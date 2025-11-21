/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, count total files.
 *
 * @package
 */

import { doAction, applyFilters } from '@wordpress/hooks';
import { extractAssetsFromHtml } from './assetExtractor';
import { debug, debugWarn } from '../../utils/debug';
import StaticSiteCache from '../../utils/staticSiteCache';

/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs, extracts assets, and caches processed HTML.
 *
 * @param {Object}   options                    Pre-scan options.
 * @param {Array}    options.urls               URLs to scan.
 * @param {string}   options.siteUrl            WordPress site URL.
 * @param {string}   options.providerId         Provider ID.
 * @param {Object}   options.providerConfig     Provider configuration.
 * @param {Function} options.setStatusMessage   Status message updater.
 * @return {Promise<Object>} Pre-scan results.
 */
export async function executePreScan( {
	urls,
	siteUrl,
	providerId,
	providerConfig,
	setStatusMessage,
} ) {
	const failures = {
		urlsFailed: 0,
		failedUrls: [],
	};

	// Fire pre-scan start action
	doAction( 'aether.static.pre_scan.before', urls, providerId, providerConfig );

	if ( setStatusMessage ) {
		setStatusMessage( 'Scanning files to upload…', 'progress', 'scanFiles' );
	}

	// Initialize cache
	const cache = new StaticSiteCache();
	const allUniqueAssets = new Set();

	// Log cache health
	const cacheHealth = await cache.getHealth();
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

	// Clean up old caches
	const cleanedCount = await cache.cleanup();
	if ( cleanedCount > 0 ) {
		debug( `[Aether] Cleaned up ${ cleanedCount } old cache entries` );
	}

	// Scan each URL
	for ( let i = 0; i < urls.length; i++ ) {
		const url = urls[ i ];

		try {
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

			const html = await htmlResponse.text();

			// Extract assets
			const assetUrls = await extractAssetsFromHtml( html, url, siteUrl );

			// Add to unique set
			for ( const assetUrl of assetUrls ) {
				allUniqueAssets.add( assetUrl );
			}

			// Filter raw HTML before caching
			const filteredRawHtml = applyFilters(
				'aether.static.html.raw',
				html,
				url,
				siteUrl
			);

			// Cache HTML and assets
			await cache.set( url, filteredRawHtml, assetUrls );
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
	const cacheStats = await cache.getStats();
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
			`Pre-scan complete: ${ cacheStats.sessionCached } HTML files, ${ allUniqueAssets.size } assets`,
			'success',
			'scanFiles'
		);
	}

	return {
		cache,
		allUniqueAssets,
		totalFilesToUpload,
		failures,
		cacheStats,
	};
}
