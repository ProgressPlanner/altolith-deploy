/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses useStaticSiteGenerator to process URLs and upload files via unified action system.
 *
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

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
		providerId,
		urls,
		staticSiteUrl,
		blueprintData,
		siteUrl,
		processStaticSiteUrls,
		setStatusMessage,
		sharedCache, // From preScanStaticSite step (global cache)
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

	if ( ! providerId ) {
		throw new Error(
			__( 'Provider ID not found in context', 'aether-site-exporter' )
		);
	}

	setStatusMessage(
		sprintf(
			/* translators: %d: Number of files */
			_n(
				'Processing %d file…',
				'Processing %d files…',
				urls.length,
				'aether-site-exporter'
			),
			urls.length
		),
		'progress',
		`uploadStaticFiles-${ providerId }`
	);

	// Filter URLs before processing
	const filteredUrls = applyFilters(
		'aether.export.step.uploadStaticSiteFiles.urls',
		urls,
		[ providerId ],
		{
			siteUrl,
			blueprintData,
			staticSiteUrl,
			providerId,
		}
	);

	// Process URLs for this provider
	// Use shared cache from preScanStaticSite step (cached raw HTML)
	const result = await processStaticSiteUrls(
		filteredUrls,
		staticSiteUrl,
		providerId,
		siteUrl,
		setStatusMessage,
		blueprintData,
		null, // removeMessage
		sharedCache // Shared cache from global step
	);

	// Report success
	const filesUploaded = result.filesUploaded || 0;
	const filesSkipped = result.filesSkipped || 0;

	if ( filesUploaded > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %d: Number of files uploaded */
				_n(
					'Uploaded %d file',
					'Uploaded %d files',
					filesUploaded,
					'aether-site-exporter'
				),
				filesUploaded
			),
			result.urlsFailed > 0 ? 'warning' : 'success',
			`uploadStaticFiles-${ providerId }`
		);
	}

	if ( filesUploaded === 0 ) {
		throw new Error(
			__(
				'Failed to upload any files for static site',
				'aether-site-exporter'
			)
		);
	}

	return applyFilters(
		'aether.export.step.uploadStaticSiteFiles.result',
		{
			success: true,
			providerId,
			filesUploaded,
			filesSkipped,
			urlsProcessed: result.urlsProcessed || 0,
			urlsSucceeded: result.urlsSucceeded || 0,
			urlsFailed: result.urlsFailed || 0,
			assetsUploaded: result.assetsUploaded || 0,
			assetsFailed: result.assetsFailed || 0,
			failedUrls: result.failedUrls || [],
			uploadedFiles: result.uploadedFiles || [],
		},
		[ providerId ],
		{ siteUrl, blueprintData, staticSiteUrl, providerId }
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
	globalCache: false,
	dependencies: [ 'preScanStaticSite' ],
	provides: [],
	handler,
};
