/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses useStaticSiteGenerator to process URLs and upload files via unified action system.
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';

/**
 * Upload static files step handler
 *
 * @param {Object}   context                       - Execution context
 * @param {Array}    context.staticSiteProviders   - Providers for static site
 * @param {Array}    context.urls                  - URLs from preScanStaticSite (includes assets)
 * @param {string}   context.staticSiteUrl         - Static site URL
 * @param {Map}      context.sharedHtmlData        - Pre-fetched HTML data from preScanStaticSite
 * @param {Object}   context.blueprintData         - Blueprint data
 * @param {string}   context.siteUrl               - WordPress site URL
 * @param {Function} context.processStaticSiteUrls - Static site generator function
 * @param {Function} context.setStatusMessage      - Status message updater
 * @return {Promise<Object>} Step result with uploaded files
 */
async function handler( context ) {
	const {
		urls,
		staticSiteUrl,
		sharedHtmlData,
		siteUrl,
		staticSiteProviders = [],
		processStaticSiteUrls,
		setStatusMessage,
	} = context;

	// blueprintData is optional and may be passed via context if available
	const blueprintData = context.blueprintData || null;

	if ( ! urls || ! Array.isArray( urls ) ) {
		throw new Error(
			__(
				'URLs not found. Please run getStaticSiteUrls first.',
				'aether'
			)
		);
	}

	if ( ! processStaticSiteUrls ) {
		throw new Error(
			__( 'Static site generator not available', 'aether' )
		);
	}

	const providers = staticSiteProviders;

	if ( providers.length === 0 ) {
		setStatusMessage(
			__( 'No providers enabled for static site deployment', 'aether' ),
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
				'aether'
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

	// Process URLs for each provider using useStaticSiteGenerator
	const providerResults = {};
	let totalFilesUploaded = 0;
	let totalFilesSkipped = 0;
	let totalUrlsProcessed = 0;
	let totalUrlsSucceeded = 0;
	let totalUrlsFailed = 0;
	const allFailedUrls = [];

	// Process each provider
	// Each provider will use the shared cache to get raw HTML and process it independently
	for ( const providerId of providers ) {
		try {
			setStatusMessage(
				sprintf(
					/* translators: %s: Provider ID */
					__( 'Processing static site for provider: %s', 'aether' ),
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
				sharedHtmlData // Pass shared HTML data from preScanStaticSite
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
				error: error.message || __( 'Unknown error', 'aether' ),
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

	// Calculate totals
	// A provider is successful if it uploaded at least one file
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
					'aether'
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
					'aether'
				),
				errorDetails
			)
		);
	}

	return applyFilters(
		'aether.export.step.uploadStaticSiteFiles.result',
		{
			staticUploadResults: {
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
		},
		providers,
		{ siteUrl, blueprintData, staticSiteUrl }
	);
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'uploadStaticFiles',
	label: __( 'Upload Static Files', 'aether' ),
	description: __( 'Generate and upload static HTML files', 'aether' ),
	supportsProgress: true,
	dependencies: [ 'preScanStaticSite' ],
	requires: {
		currentProviderInstance: {
			from: 'thread',
			required: true,
		},
		urls: {
			from: 'preScanStaticSite',
			required: true,
		},
		staticSiteUrl: {
			from: 'getStaticSiteUrls',
			required: true,
		},
		sharedHtmlData: {
			from: 'preScanStaticSite',
			required: true,
		},
		siteUrl: {
			from: 'initial',
			required: true,
		},
		staticSiteProviders: {
			from: 'initial',
			required: true,
		},
		processStaticSiteUrls: {
			from: 'initial',
			required: true,
		},
		setStatusMessage: {
			from: 'initial',
			required: true,
		},
	},
	provides: {
		staticUploadResults: {
			type: 'object',
			scope: 'thread',
		},
	},
	handler,
};

/**
 * Register step via WordPress hooks
 */
addAction(
	'aether.export.register_steps',
	'aether/step-uploadStaticFiles',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
