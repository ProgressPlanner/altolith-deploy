/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, return raw data.
 * No caching - fetches fresh every time.
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
import { extractAssetsFromHtml } from './assetExtractor';
import { debug, debugWarn } from '@aether/utils/debug';

/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs, extracts assets, and returns raw HTML data.
 * No caching - always fetches fresh.
 *
 * @param {Object}   options                  Pre-scan options.
 * @param {Array}    options.urls             URLs to scan.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.providerConfig   Provider configuration.
 * @param {Function} options.setStatusMessage Status message updater.
 * @return {Promise<Object>} Pre-scan results with raw HTML data.
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
	doAction(
		'aether.export.step.uploadStaticSiteFiles.pre_scan.before',
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

	const allUniqueAssets = new Set();
	const urlData = []; // Array of {url, rawHtml, assetUrls}

	// Scan each URL
	for ( let i = 0; i < urls.length; i++ ) {
		const url = urls[ i ];

		try {
			// Fetch from URL (no cache)
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

			// Store raw data
			urlData.push( {
				url,
				rawHtml: html,
				assetUrls,
			} );

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

	const urlsSuccessful = urlData.length;
	const totalFilesToUpload = urlsSuccessful + allUniqueAssets.size;

	debug( 'Pre-scan complete:', {
		urlsScanned: urls.length,
		urlsSuccessful,
		uniqueAssets: allUniqueAssets.size,
		totalFilesToUpload,
	} );

	// Fire completion action
	doAction(
		'aether.export.step.uploadStaticSiteFiles.pre_scan.after',
		{
			urlsScanned: urls.length,
			urlsSuccessful,
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
				urlsSuccessful,
				allUniqueAssets.size
			),
			'success',
			'scanFiles'
		);
	}

	return {
		urlData, // Array of {url, rawHtml, assetUrls}
		allUniqueAssets,
		totalFilesToUpload,
		failures,
	};
}
