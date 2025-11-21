/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses hook-based architecture where providers handle URL rewriting and uploading.
 *
 * @package
 */

import { doAction, applyFilters } from '@wordpress/hooks';
import { calculateOverallProgress } from '../../utils/progressManager';

/**
 * Upload static files step handler.
 *
 * @param {Object}   context                         Execution context.
 * @param {Array}    context.staticSiteProviders     Providers for static site.
 * @param {Array}    context.urls                    URLs from getStaticSiteUrls.
 * @param {string}   context.staticSiteUrl           Static site URL.
 * @param {Object}   context.blueprintData           Blueprint data.
 * @param {string}   context.siteUrl                 WordPress site URL.
 * @param {Function} context.setStatusMessage        Status message updater.
 * @param {Function} context.setStepProgress         Step progress updater.
 * @param {Function} context.setOverallProgressValue Overall progress updater.
 * @return {Promise<Object>} Step result with uploaded files.
 */
async function handler( context ) {
	const {
		urls,
		staticSiteUrl,
		blueprintData,
		siteUrl,
		staticSiteProviders = [],
		setStatusMessage,
		setStepProgress,
		setOverallProgressValue,
	} = context;

	if ( ! urls || ! Array.isArray( urls ) ) {
		throw new Error(
			'URLs not found. Please run getStaticSiteUrls first.'
		);
	}

	const providers = staticSiteProviders;

	if ( providers.length === 0 ) {
		setStatusMessage(
			'No providers enabled for static site deployment',
			'warning',
			'uploadStaticFiles'
		);
		return { skipped: true, reason: 'no_providers' };
	}

	setStatusMessage(
		`Processing ${ urls.length } files for ${ providers.length } provider(s)…`,
		'progress',
		'uploadStaticFiles'
	);

	// Filter URLs before processing
	const filteredUrls = applyFilters( 'aether.upload.urls', urls, providers, {
		siteUrl,
		blueprintData,
		staticSiteUrl,
		providers,
	} );

	// Track results per provider
	const providerResults = {};
	providers.forEach( ( providerId ) => {
		providerResults[ providerId ] = {
			filesProcessed: 0,
			filesUploaded: 0,
			errors: [],
		};
	} );

	// Process each file through hooks
	const totalFiles = filteredUrls.length;
	let processedCount = 0;

	for ( const urlData of filteredUrls ) {
		processedCount++;

		// Update progress
		if ( setStepProgress && setOverallProgressValue ) {
			const stepProgress = Math.min(
				100,
				Math.round( ( processedCount / totalFiles ) * 100 )
			);
			setStepProgress( 'uploadStaticFiles', stepProgress );
			setOverallProgressValue(
				calculateOverallProgress( {
					step: 'uploadStaticFiles',
					progress: stepProgress,
				} )
			);
		}

		// Create file context for hooks
		const fileContext = {
			url: urlData.url || urlData,
			path: urlData.path || urlData.url || urlData,
			content: urlData.content || null,
			contentType: urlData.contentType || 'text/html',
			siteUrl,
			staticSiteUrl,
			blueprintData,
			providers,
			setStatusMessage,
		};

		/**
		 * Action: Process a static site file.
		 *
		 * Providers hook into this action to:
		 * 1. Perform URL rewriting/HTML transformations
		 * 2. Upload the file to their storage
		 *
		 * @param {Object}   fileContext                  File context object.
		 * @param {string}   fileContext.url              Original URL.
		 * @param {string}   fileContext.path             File path.
		 * @param {string}   fileContext.content          File content (may be null, provider fetches if needed).
		 * @param {string}   fileContext.contentType      Content type.
		 * @param {string}   fileContext.siteUrl          WordPress site URL.
		 * @param {string}   fileContext.staticSiteUrl    Target static site URL.
		 * @param {Object}   fileContext.blueprintData    Blueprint data.
		 * @param {Array}    fileContext.providers        Provider IDs.
		 * @param {Function} fileContext.setStatusMessage Status updater.
		 */
		doAction( 'aether.staticSite.file.process', fileContext );

		// Also fire provider-specific actions for more granular control
		for ( const providerId of providers ) {
			/**
			 * Action: Process a file for a specific provider.
			 *
			 * @param {Object} fileContext File context object.
			 * @param {string} providerId  Provider ID.
			 */
			doAction(
				`aether.staticSite.file.process.${ providerId }`,
				fileContext,
				providerId
			);
		}
	}

	// Gather results from providers via filter
	const results = applyFilters(
		'aether.staticSite.upload.results',
		providerResults,
		providers,
		{ siteUrl, blueprintData, staticSiteUrl }
	);

	// Calculate totals
	const successfulProviders = Object.entries( results ).filter(
		( [ , data ] ) => data.filesUploaded > 0 || data.errors.length === 0
	);
	const failedProviders = Object.entries( results ).filter(
		( [ , data ] ) => data.errors.length > 0 && data.filesUploaded === 0
	);

	const totalFilesUploaded = Object.values( results ).reduce(
		( sum, data ) => sum + ( data.filesUploaded || 0 ),
		0
	);

	if ( successfulProviders.length > 0 ) {
		setStatusMessage(
			`Uploaded static site to ${ successfulProviders.length }/${ providers.length } provider(s) (${ totalFilesUploaded } files)`,
			failedProviders.length > 0 ? 'warning' : 'success',
			'uploadStaticFiles'
		);
	}

	if ( failedProviders.length === providers.length ) {
		throw new Error( 'Failed to upload static site to any provider' );
	}

	return applyFilters(
		'aether.upload.result',
		{
			providers,
			results,
			successCount: successfulProviders.length,
			failureCount: failedProviders.length,
			totalFilesUploaded,
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
	label: 'Upload Static Files',
	description: 'Generate and upload static HTML files',
	dependencies: [ 'getStaticSiteUrls' ],
	provides: [],
	handler,
};
