/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages and extracts assets. No caching.
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import { executePreScan } from '@aether/export/utils/preScanPhase';
import { debugWarn } from '@aether/utils/debug';
import apiFetch from '@aether/utils/api';

/**
 * Pre-scan static site step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Array}    context.urls             URLs from getStaticSiteUrls.
 * @param {string}   context.siteUrl          WordPress site URL.
 * @param {Function} context.setStatusMessage Status message updater.
 * @param {Function} context.setStepProgress  Step progress updater.
 * @return {Promise<Object>} Step result with URL data.
 */
async function handler( context ) {
	const { urls, siteUrl, setStatusMessage, setStepProgress, providerIds } =
		context;

	if ( ! urls || ! Array.isArray( urls ) ) {
		throw new Error(
			__(
				'URLs not found. Please run getStaticSiteUrls first.',
				'aether-site-exporter'
			)
		);
	}

	setStatusMessage(
		__( 'Pre-scanning URLs and fetching HTML…', 'aether-site-exporter' ),
		'progress',
		'preScanStaticSite'
	);

	// Get first provider ID for config (pre-scan doesn't need provider-specific config)
	const firstProviderId = providerIds && providerIds[ 0 ];

	if ( ! firstProviderId ) {
		debugWarn(
			'[Aether] No provider IDs found, using default config for pre-scan'
		);
	}

	// Fetch provider config if we have a provider ID
	let providerConfig = {};
	if ( firstProviderId ) {
		try {
			const providerResponse = await apiFetch( {
				path: `/aether/site-exporter/providers/${ firstProviderId }/config`,
			} );
			if ( providerResponse.success && providerResponse.config ) {
				providerConfig = providerResponse.config || {};
			}
		} catch ( error ) {
			debugWarn(
				'[Aether] Failed to fetch provider config for pre-scan:',
				error
			);
		}
	}

	// Execute pre-scan: Fetch all URLs and get raw HTML data (no caching)
	const preScanResult = await executePreScan( {
		urls,
		siteUrl,
		providerId: firstProviderId || 'pre-scan',
		providerConfig,
		setStatusMessage,
		setStepProgress,
	} );

	setStatusMessage(
		sprintf(
			/* translators: %1$d: Number of pages, %2$d: Number of assets */
			__(
				'Pre-scanned %1$d pages and found %2$d unique assets',
				'aether-site-exporter'
			),
			preScanResult.urlData.length,
			preScanResult.allUniqueAssets.size
		),
		'success',
		'preScanStaticSite'
	);

	// Return URL data and results for provider steps to use
	// The urlData will be available to all uploadStaticFiles step instances
	return {
		success: true,
		urlData: preScanResult.urlData, // Array of {url, rawHtml, assetUrls}
		urls, // Keep original URLs
		scannedUrls: preScanResult.urlData.length,
		assetCount: preScanResult.allUniqueAssets.size,
	};
}

/**
 * Pre-Scan Static Site step definition.
 */
export const preScanStaticSiteStep = {
	id: 'preScanStaticSite',
	label: __( 'Scan for Assets', 'aether-site-exporter' ),
	description: __(
		'Discover CSS, JS, and image assets from pages',
		'aether-site-exporter'
	),
	supportsProgress: true,
	globalCache: true,
	dependencies: [ 'getStaticSiteUrls' ],
	provides: [ 'urls', 'htmlCount', 'assetCount' ],
	handler,
};
