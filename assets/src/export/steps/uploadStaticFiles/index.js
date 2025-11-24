/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses useStaticSiteGenerator to process URLs and upload files via unified action system.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { fetchProviderConfig } from '@aether/export/utils/staticSiteConfig';

/**
 * Upload static files step handler
 *
 * Processes a single provider instance (thread context).
 * Called once per provider by ThreadOrchestrator.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Array}    context.urls                    - URLs from preScanStaticSite (includes assets)
 * @param {string}   context.staticSiteUrl           - Static site URL
 * @param {Map}      context.sharedHtmlData          - Pre-fetched HTML data from preScanStaticSite
 * @param {Object}   context.blueprintData           - Blueprint data
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.processStaticSiteUrls   - Static site generator function
 * @param {Function} context.setStatusMessage        - Status message updater
 * @return {Promise<Object>} Step result with uploaded files
 */
async function handler( context ) {
	const {
		currentProviderInstance,
		urls,
		staticSiteUrl,
		sharedHtmlData,
		siteUrl,
		processStaticSiteUrls,
		setStatusMessage,
	} = context;

	// blueprintData is optional and may be passed via context if available
	const blueprintData = context.blueprintData || null;

	if ( ! currentProviderInstance ) {
		throw new Error(
			__(
				'Provider instance not found in thread context',
				'aether-site-exporter'
			)
		);
	}

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

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	setStatusMessage(
		sprintf(
			/* translators: %s: Provider label */
			__( 'Processing static site for %s…', 'aether-site-exporter' ),
			providerLabel
		),
		'progress',
		'uploadStaticFiles'
	);

	// Fetch provider config to get provider-specific public_url
	// This ensures each provider uses its own staticSiteUrl (e.g., http://localhost:10003/static3)
	// instead of the global one from getStaticSiteUrls
	let providerSpecificStaticSiteUrl = staticSiteUrl;
	try {
		const providerConfig = await fetchProviderConfig( providerId );
		if ( providerConfig.public_url ) {
			providerSpecificStaticSiteUrl = providerConfig.public_url;
		}
	} catch ( error ) {
		// If fetching provider config fails, fall back to global staticSiteUrl
		// This should not happen in normal operation, but provides a safety net
	}

	// Filter URLs before processing
	const filteredUrls = applyFilters(
		'aether.export.step.uploadStaticSiteFiles.urls',
		urls,
		[ providerId ],
		{
			siteUrl,
			blueprintData,
			staticSiteUrl: providerSpecificStaticSiteUrl,
			providerId,
		}
	);

	// Process URLs for this provider instance
	// Pass shared HTML data so it uses stored HTML instead of fetching again
	// Use provider-specific staticSiteUrl for correct URL rewriting
	const result = await processStaticSiteUrls(
		filteredUrls,
		providerSpecificStaticSiteUrl,
		providerId,
		siteUrl,
		setStatusMessage,
		blueprintData,
		null, // removeMessage
		sharedHtmlData // Pass shared HTML data from preScanStaticSite
	);

	// Check if upload succeeded
	const filesUploaded = result.filesUploaded || 0;
	const success = result.success && filesUploaded > 0;

	if ( success ) {
		setStatusMessage(
			sprintf(
				/* translators: %1$s: Provider label, %2$d: Files uploaded */
				__( 'Uploaded %2$d files to %1$s', 'aether-site-exporter' ),
				providerLabel,
				filesUploaded
			),
			'success',
			'uploadStaticFiles'
		);
	} else {
		const errorMessage =
			result.error || __( 'No files uploaded', 'aether-site-exporter' );
		throw new Error(
			sprintf(
				/* translators: %1$s: Provider label, %2$s: Error message */
				__( 'Failed to upload to %1$s: %2$s', 'aether-site-exporter' ),
				providerLabel,
				errorMessage
			)
		);
	}

	return applyFilters(
		'aether.export.step.uploadStaticSiteFiles.result',
		{
			staticUploadResults: {
				providerId,
				providerLabel,
				success,
				filesUploaded: result.filesUploaded || 0,
				filesSkipped: result.filesSkipped || 0,
				urlsProcessed: result.urlsProcessed || 0,
				urlsSucceeded: result.urlsSucceeded || 0,
				urlsFailed: result.urlsFailed || 0,
				assetsUploaded: result.assetsUploaded || 0,
				assetsFailed: result.assetsFailed || 0,
				failedUrls: result.failedUrls || [],
				uploadedFiles: result.uploadedFiles || [],
			},
		},
		providerId,
		{ siteUrl, blueprintData, staticSiteUrl }
	);
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'uploadStaticFiles',
	label: __( 'Upload Static Files', 'aether-site-exporter' ),
	description: __(
		'Generate and upload static HTML files',
		'aether-site-exporter'
	),
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
