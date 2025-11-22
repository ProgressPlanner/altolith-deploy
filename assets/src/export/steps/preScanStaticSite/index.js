/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages, caches them, and extracts assets.
 * Creates shared StaticSiteCache for all providers to use.
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import { StaticSiteCache } from '@aether/utils/staticSiteCache';
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
 * @return {Promise<Object>} Step result with shared cache and URLs.
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
		__( 'Pre-scanning URLs and caching HTML…', 'aether-site-exporter' ),
		'progress',
		'preScanStaticSite'
	);

	// Create shared cache instance for all providers
	// This ensures URLs and HTML are fetched only once, then shared across providers
	const sharedCache = new StaticSiteCache();
	await sharedCache.initialize();

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

	// Execute pre-scan: Fetch all URLs and cache raw HTML
	// This prevents duplicate network requests when multiple providers are enabled
	const preScanResult = await executePreScan( {
		urls,
		siteUrl,
		providerId: firstProviderId || 'pre-scan',
		providerConfig,
		setStatusMessage,
		setStepProgress,
		cache: sharedCache,
	} );

	setStatusMessage(
		sprintf(
			/* translators: %1$d: Number of pages, %2$d: Number of assets */
			__(
				'Pre-scanned %1$d pages and found %2$d unique assets',
				'aether-site-exporter'
			),
			preScanResult.cacheStats.sessionCached,
			preScanResult.allUniqueAssets.size
		),
		'success',
		'preScanStaticSite'
	);

	// Return shared cache and results for provider steps to use
	// The sharedCache will be available to all uploadStaticFiles step instances
	return {
		success: true,
		sharedCache, // Pass cache instance to provider steps
		urls, // Keep original URLs
		scannedUrls: preScanResult.cacheStats.sessionCached,
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
