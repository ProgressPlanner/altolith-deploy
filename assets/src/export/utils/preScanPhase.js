/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, count total files.
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
import { extractAssetsFromHtml } from './assetExtractor';
import { getStaticFilesCache } from './staticFilesCache';

/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs and extracts assets.
 * HTML data is read from IndexedDB cache (populated by preScanStaticSite step).
 *
 * @param {Object}   options                  Pre-scan options.
 * @param {Array}    options.urls             URLs to scan.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.providerConfig   Provider configuration.
 * @param {Function} options.setStatusMessage Status message updater.
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

	// Get IndexedDB cache (populated by preScanStaticSite step)
	const cache = getStaticFilesCache();

	// Local storage for this provider thread (deep cloned from cache)
	const dataStorage = new Map();
	const allUniqueAssets = new Set();
	let successfulUrls = 0;

	// Scan each URL
	for ( let i = 0; i < urls.length; i++ ) {
		const url = urls[ i ];

		// Read from IndexedDB cache with deep cloning for thread isolation
		const cachedEntry = await cache.getCloned( url );
		if ( cachedEntry && cachedEntry.content && cachedEntry.assetUrls ) {
			successfulUrls++;

			// Store cloned data in local Map for this provider
			dataStorage.set( url, {
				rawHtml: cachedEntry.content,
				assetUrls: cachedEntry.assetUrls,
			} );

			// Add cached assets to unique set
			for ( const assetUrl of cachedEntry.assetUrls ) {
				allUniqueAssets.add( assetUrl );
			}
			continue;
		}

		// URL not in cache - this might be an asset URL (CSS, JS, image, etc.)
		// Assets are handled separately in the upload phase, so we can skip them here
		// Only fetch if it looks like it might be an HTML page
		// (We'll let the fetch determine if it's actually HTML)
		try {
			// Fetch from URL
			const htmlResponse = await fetch( url, {
				method: 'GET',
				credentials: 'omit',
				headers: {
					'User-Agent': 'Aether Static Site Generator',
				},
			} );

			if ( htmlResponse.status !== 200 ) {
				failures.urlsFailed++;
				failures.failedUrls.push( {
					url,
					reason: `Failed to fetch HTML: HTTP ${ htmlResponse.status } ${ htmlResponse.statusText }`,
				} );
				continue;
			}

			// Check content-type to ensure it's HTML
			const contentType =
				htmlResponse.headers.get( 'content-type' ) || '';
			if ( ! contentType.includes( 'text/html' ) ) {
				// Not HTML - likely an asset (CSS, JS, image, etc.)
				// Assets are handled separately in upload phase, skip here
				continue;
			}

			const html = await htmlResponse.text();

			// Extract assets
			const assetUrls = await extractAssetsFromHtml( html, url, siteUrl );

			// Store HTML and assets in local data structure
			dataStorage.set( url, { rawHtml: html, assetUrls } );
			successfulUrls++;

			// Add to unique set
			for ( const assetUrl of assetUrls ) {
				allUniqueAssets.add( assetUrl );
			}
		} catch ( error ) {
			failures.urlsFailed++;
			failures.failedUrls.push( {
				url,
				reason: error.message,
			} );
		}
	}

	const totalFilesToUpload = successfulUrls + allUniqueAssets.size;

	// Fire completion action
	doAction(
		'aether.export.step.uploadStaticSiteFiles.pre_scan.after',
		{
			urlsScanned: urls.length,
			urlsSuccessful: successfulUrls,
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
				successfulUrls,
				allUniqueAssets.size
			),
			'success',
			'scanFiles'
		);
	}

	return {
		htmlData: dataStorage,
		allUniqueAssets,
		totalFilesToUpload,
		failures,
		urlsSuccessful: successfulUrls,
	};
}
