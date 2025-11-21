/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, count total files.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
import { extractAssetsFromHtml } from './assetExtractor';
import { debug, debugWarn } from '@aether/utils/debug';
import StaticSiteCache from '@aether/utils/staticSiteCache';

/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs, extracts assets, and caches raw HTML.
 *
 * @param {Object}   options                  Pre-scan options.
 * @param {Array}    options.urls             URLs to scan.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.providerConfig   Provider configuration.
 * @param {Function} options.setStatusMessage Status message updater.
 * @param {Object}   options.cache            Optional shared cache instance.
 * @return {Promise<Object>} Pre-scan results.
 */
export async function executePreScan( {
	urls,
	siteUrl,
	providerId,
	providerConfig,
	setStatusMessage,
	cache = null,
} ) {
	const failures = {
		urlsFailed: 0,
		failedUrls: [],
	};

	// Fire pre-scan start action
	doAction(
		'aether.static.pre_scan.before',
		urls,
		providerId,
		providerConfig
	);

	if ( setStatusMessage ) {
		setStatusMessage(
			__( 'Scanning files to upload…', 'aether-site-exporter' ),
			'progress',
			'scanFiles'
		);
	}

	// Use provided cache or create new one
	const sharedCache = cache || new StaticSiteCache();
	const allUniqueAssets = new Set();

	// Log cache health (only if we created a new cache)
	if ( ! cache ) {
		const cacheHealth = await sharedCache.getHealth();
		if ( cacheHealth.usingFallback ) {
			debugWarn(
				'[Aether] IndexedDB not available, using in-memory fallback (500 URL limit)'
			);
		}
		if ( cacheHealth.recommendations.length > 0 ) {
			cacheHealth.recommendations.forEach( ( rec ) =>
				debugWarn( `[Aether] ${ rec }` )
			);
		}

		// Clean up old caches (only for new cache instances)
		const cleanedCount = await sharedCache.cleanup();
		if ( cleanedCount > 0 ) {
			debug( `[Aether] Cleaned up ${ cleanedCount } old cache entries` );
		}
	}

	// Scan each URL
	for ( let i = 0; i < urls.length; i++ ) {
		const url = urls[ i ];

		try {
			// Check cache before fetching
			const cached = await sharedCache.get( url );
			let html;
			let assetUrls;

			if ( cached ) {
				// Use cached data
				html = cached.rawHtml;
				assetUrls = cached.assetUrls || [];
				debug( `[Aether] Using cached HTML for: ${ url }` );
			} else {
				// Fetch from URL
				const htmlResponse = await fetch( url, {
					method: 'GET',
					credentials: 'omit',
					headers: {
						'User-Agent': 'Aether Static Site Generator',
					},
				} );

				if ( htmlResponse.status !== 200 ) {
					debugWarn(
						`[Aether] Skipping URL with non-200 status: ${ url } (HTTP ${ htmlResponse.status })`
					);
					failures.urlsFailed++;
					failures.failedUrls.push( {
						url,
						reason: `Failed to fetch HTML: HTTP ${ htmlResponse.status } ${ htmlResponse.statusText }`,
					} );
					continue;
				}

				html = await htmlResponse.text();

				// Extract assets
				assetUrls = await extractAssetsFromHtml( html, url, siteUrl );

				// Cache raw HTML (before any filters) and assets
				await sharedCache.set( url, html, assetUrls );
			}

			// Add to unique set
			for ( const assetUrl of assetUrls ) {
				allUniqueAssets.add( assetUrl );
			}
		} catch ( error ) {
			debugWarn( `[Aether] Error fetching URL: ${ url }`, error.message );
			failures.urlsFailed++;
			failures.failedUrls.push( {
				url,
				reason: error.message,
			} );
		}
	}

	// Get cache stats
	const cacheStats = await sharedCache.getStats();
	const totalFilesToUpload = cacheStats.sessionCached + allUniqueAssets.size;

	debug( 'Pre-scan complete:', {
		urlsScanned: urls.length,
		urlsSuccessful: cacheStats.sessionCached,
		uniqueAssets: allUniqueAssets.size,
		totalFilesToUpload,
	} );

	// Fire completion action
	doAction(
		'aether.static.pre_scan.after',
		{
			urlsScanned: urls.length,
			urlsSuccessful: cacheStats.sessionCached,
			uniqueAssets: allUniqueAssets.size,
			totalFiles: totalFilesToUpload,
		},
		providerId
	);

	if ( setStatusMessage ) {
		setStatusMessage(
			sprintf(
				/* translators: %1$d: Number of HTML files, %2$d: Number of assets */
				__(
					'Pre-scan complete: %1$d HTML files, %2$d assets',
					'aether-site-exporter'
				),
				cacheStats.sessionCached,
				allUniqueAssets.size
			),
			'success',
			'scanFiles'
		);
	}

	return {
		cache: sharedCache,
		allUniqueAssets,
		totalFilesToUpload,
		failures,
		cacheStats,
	};
}
