/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses useStaticSiteGenerator to process URLs and upload files via unified action system.
 *
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { executePreScan } from '@aether/export/utils/preScanPhase';
import { fetchProviderConfig } from '@aether/export/utils/staticSiteConfig';
import { debug, debugWarn } from '@aether/utils/debug';

/**
 * Upload static files step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Array}    context.staticSiteProviders   Providers for static site.
 * @param {Array}    context.urls                  URLs from getStaticSiteUrls.
 * @param {string}   context.staticSiteUrl         Static site URL.
 * @param {Object}   context.blueprintData         Blueprint data.
 * @param {string}   context.siteUrl               WordPress site URL.
 * @param {Function} context.processStaticSiteUrls Static site generator function.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @return {Promise<Object>} Step result with uploaded files.
 */
async function handler( context ) {
	const {
		urls,
		staticSiteUrl,
		blueprintData,
		siteUrl,
		staticSiteProviders = [],
		processStaticSiteUrls,
		setStatusMessage,
	} = context;

	if ( ! urls || ! Array.isArray( urls ) ) {
		throw new Error(
			__(
				'URLs not found. Please run getStaticSiteUrls first.',
				'aether-site-exporter'
			)
		);
	}

	if ( ! processStaticSiteUrls ) {
		throw new Error(
			__( 'Static site generator not available', 'aether-site-exporter' )
		);
	}

	const providers = staticSiteProviders;

	if ( providers.length === 0 ) {
		setStatusMessage(
			__(
				'No providers enabled for static site deployment',
				'aether-site-exporter'
			),
			'warning',
			'uploadStaticFiles'
		);
		return { skipped: true, reason: 'no_providers' };
	}

	setStatusMessage(
		sprintf(
			/* translators: %1$d: Number of files, %2$d: Number of providers */
			_n(
				'Processing %1$d file for %2$d provider…',
				'Processing %1$d files for %2$d providers…',
				urls.length,
				'aether-site-exporter'
			),
			urls.length,
			providers.length
		),
		'progress',
		'uploadStaticFiles'
	);

	// Filter URLs before processing
	const filteredUrls = applyFilters(
		'aether.export.step.uploadStaticSiteFiles.urls',
		urls,
		providers,
		{
			siteUrl,
			blueprintData,
			staticSiteUrl,
			providers,
		}
	);

	// Create shared data storage for HTML across providers
	// This ensures URLs and HTML are fetched only once, then shared across providers
	const sharedHtmlData = new Map();

	// Pre-scan once: Fetch all URLs and store HTML before processing providers
	// This prevents duplicate network requests when multiple providers are enabled
	let preScanResult = null;
	try {
		// Get provider config for first provider (for pre-scan)
		// Pre-scan doesn't need provider-specific config, but executePreScan expects it
		const firstProviderId = providers[ 0 ];
		const providerConfig = await fetchProviderConfig( firstProviderId );

		setStatusMessage(
			__( 'Pre-scanning URLs…', 'aether-site-exporter' ),
			'progress',
			'uploadStaticFiles-prescan'
		);

		preScanResult = await executePreScan( {
			urls: filteredUrls,
			siteUrl,
			providerId: firstProviderId,
			providerConfig,
			setStatusMessage,
			htmlData: sharedHtmlData, // Use shared data storage
		} );

		debug(
			`[Aether] Pre-scan complete: ${ preScanResult.urlsSuccessful } URLs fetched, ${ preScanResult.allUniqueAssets.size } unique assets`
		);
	} catch ( error ) {
		debugWarn( '[Aether] Pre-scan failed:', error );
		// Continue with empty data - processStaticSiteUrls will handle it
	}

	// Process URLs for each provider using useStaticSiteGenerator
	const providerResults = {};
	let totalFilesUploaded = 0;
	let totalFilesSkipped = 0;
	let totalUrlsProcessed = 0;
	let totalUrlsSucceeded = 0;
	let totalUrlsFailed = 0;
	const allFailedUrls = [];

	// Note: Progress tracking is handled by processStaticSiteUrls internally
	// No need for separate onProgress callback here

	// Process each provider
	// Each provider will use the shared cache to get raw HTML and process it independently
	try {
		for ( const providerId of providers ) {
			try {
				setStatusMessage(
					sprintf(
						/* translators: %s: Provider ID */
						__(
							'Processing static site for provider: %s',
							'aether-site-exporter'
						),
						providerId
					),
					'progress',
					`uploadStaticFiles-${ providerId }`
				);

				// Process URLs for this provider
				// Pass shared HTML data so it uses stored HTML instead of fetching again
				const result = await processStaticSiteUrls(
					filteredUrls,
					staticSiteUrl,
					providerId,
					siteUrl,
					setStatusMessage,
					blueprintData,
					null, // removeMessage
					sharedHtmlData // Pass shared HTML data
				);

				// Aggregate results
				providerResults[ providerId ] = {
					success: result.success,
					urlsProcessed: result.urlsProcessed || 0,
					urlsSucceeded: result.urlsSucceeded || 0,
					urlsFailed: result.urlsFailed || 0,
					filesUploaded: result.filesUploaded || 0,
					filesSkipped: result.filesSkipped || 0,
					assetsUploaded: result.assetsUploaded || 0,
					assetsFailed: result.assetsFailed || 0,
					failedUrls: result.failedUrls || [],
					uploadedFiles: result.uploadedFiles || [],
				};

				totalFilesUploaded += result.filesUploaded || 0;
				totalFilesSkipped += result.filesSkipped || 0;
				totalUrlsProcessed += result.urlsProcessed || 0;
				totalUrlsSucceeded += result.urlsSucceeded || 0;
				totalUrlsFailed += result.urlsFailed || 0;
				if ( result.failedUrls ) {
					allFailedUrls.push( ...result.failedUrls );
				}
			} catch ( error ) {
				providerResults[ providerId ] = {
					success: false,
					error:
						error.message ||
						__( 'Unknown error', 'aether-site-exporter' ),
					urlsProcessed: 0,
					urlsSucceeded: 0,
					urlsFailed: filteredUrls.length,
					filesUploaded: 0,
					filesSkipped: 0,
					assetsUploaded: 0,
					assetsFailed: 0,
					failedUrls: filteredUrls.map( ( url ) => ( {
						url: typeof url === 'string' ? url : url.url || url,
						reason: error.message || 'Unknown error',
					} ) ),
					uploadedFiles: [],
				};
				totalUrlsFailed += filteredUrls.length;
				allFailedUrls.push(
					...filteredUrls.map( ( url ) => ( {
						url: typeof url === 'string' ? url : url.url || url,
						reason: error.message || 'Unknown error',
					} ) )
				);
			}
		}
	} finally {
		// Clean up HTML data when export finishes (success or failure)
		sharedHtmlData.clear();
		debug( '[Aether] Cleared HTML data from memory' );
	}

	// Calculate totals
	// A provider is successful if it uploaded at least one file
	// (success === false just means some URLs had errors, not total failure)
	const successfulProviders = Object.entries( providerResults ).filter(
		( [ , data ] ) => data.filesUploaded > 0
	);
	const failedProviders = Object.entries( providerResults ).filter(
		( [ , data ] ) => data.filesUploaded === 0
	);

	if ( successfulProviders.length > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %1$d: Success count, %2$d: Total providers, %3$d: Total files uploaded */
				_n(
					'Uploaded static site to %1$d/%2$d provider (%3$d file)',
					'Uploaded static site to %1$d/%2$d providers (%3$d files)',
					totalFilesUploaded,
					'aether-site-exporter'
				),
				successfulProviders.length,
				providers.length,
				totalFilesUploaded
			),
			failedProviders.length > 0 ? 'warning' : 'success',
			'uploadStaticFiles'
		);
	}

	if ( failedProviders.length === providers.length ) {
		// Collect error details from all failed providers
		const errorDetails = failedProviders
			.map( ( [ providerId, data ] ) => {
				const error = data.error || 'Unknown error';
				return `${ providerId }: ${ error }`;
			} )
			.join( '; ' );

		throw new Error(
			sprintf(
				/* translators: %s: Error details from providers */
				__(
					'Failed to upload static site to any provider. Details: %s',
					'aether-site-exporter'
				),
				errorDetails
			)
		);
	}

	return applyFilters(
		'aether.export.step.uploadStaticSiteFiles.result',
		{
			providers,
			results: providerResults,
			successCount: successfulProviders.length,
			failureCount: failedProviders.length,
			totalFilesUploaded,
			totalFilesSkipped,
			totalUrlsProcessed,
			totalUrlsSucceeded,
			totalUrlsFailed,
			failedUrls: allFailedUrls,
		},
		providers,
		{ siteUrl, blueprintData, staticSiteUrl }
	);
}

/**
 * Upload Static Files step definition.
 */
export const uploadStaticFilesStep = {
	id: 'uploadStaticFiles',
	label: __( 'Upload Static Files', 'aether-site-exporter' ),
	description: __(
		'Generate and upload static HTML files',
		'aether-site-exporter'
	),
	supportsProgress: true,
	dependencies: [ 'preScanStaticSite' ],
	provides: [],
	handler,
};
