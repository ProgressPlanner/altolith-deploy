/**
 * Upload Static Site Files Step
 *
 * This is the MOST COMPLEX step - generates static HTML/CSS/JS and uploads to storage.
 * Handles all URL fetching, asset extraction, URL rewriting, and file uploads.
 *
 * @package
 */

import { addFilter, applyFilters } from '@wordpress/hooks';
import apiFetch from '../../../../../../../utils/api';
import { calculateOverallProgress } from '../../../../../../utils/progressManager';

/**
 * Upload static site files step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Function} context.processStaticSiteUrls Static site generator function.
 * @param {Array}    context.staticSiteProviders   Array of provider IDs that support static site deployment.
 * @param {string}   context.providerId            (Legacy) Single provider ID for backwards compatibility.
 * @param {Object}   context.currentStatus         Current job status.
 * @param {string}   context.siteUrl               WordPress site URL.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @param {Function} context.removeMessage         Message remover.
 * @return {Promise<Object>} Step result with uploaded files.
 */
export async function handler( context ) {
	const {
		processStaticSiteUrls,
		urls, // From getStaticSiteUrlsHandler (workflow) or currentStatus (tests)
		staticSiteUrl, // From getStaticSiteUrlsHandler (workflow) or currentStatus (tests)
		blueprintData, // From generateBlueprintHandler (workflow) or currentStatus (tests)
		currentStatus, // Legacy support for tests
		siteUrl,
		staticSiteProviders = [], // NEW: Array of provider IDs
		providerId, // LEGACY: Keep for backwards compat
		setStatusMessage,
		setStepProgress,
		setOverallProgressValue,
		updateStaticSiteProgressContext,
		removeMessage,
	} = context;

	// Support both new format (urls directly in context) and old format (currentStatus.urls for tests)
	const urlsArray = urls || currentStatus?.urls;
	const blueprintDataForStatic =
		blueprintData !== undefined
			? blueprintData
			: currentStatus?.blueprintData ?? null;

	if ( ! urlsArray || ! Array.isArray( urlsArray ) ) {
		throw new Error(
			'URLs not found. Please run getStaticSiteUrls first.'
		);
	}

	// Use staticSiteProviders if available, fallback to single providerId
	let providers = [];
	if ( staticSiteProviders.length > 0 ) {
		providers = staticSiteProviders;
	} else if ( providerId ) {
		providers = [ providerId ];
	}

	if ( providers.length === 0 ) {
		setStatusMessage(
			'No providers enabled for static site deployment',
			'warning',
			'uploadStaticSiteFiles'
		);
		return { skipped: true, reason: 'no_providers' };
	}

	setStatusMessage(
		`Uploading static site to ${ providers.length } provider(s)…`,
		'progress',
		'uploadStaticSiteFiles'
	);

	/**
	 * Filter the URLs before processing for static site upload.
	 *
	 * Allows modification of URLs that will be fetched and uploaded.
	 *
	 * @param {Array}  urls      Array of URL objects to process.
	 * @param {Array}  providers Array of provider IDs being used for upload.
	 * @param {Object} context   Enhanced context with workflow state and provider info.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('aether.upload.urls', 'my-provider', (urls, providers, context) => {
	 *   // Add custom URL
	 *   // context contains: siteUrl, blueprintData, staticSiteUrl, etc.
	 *   return [...urls, { url: '/custom-page/', type: 'page' }];
	 * });
	 */
	const filteredUrls = applyFilters(
		'aether.upload.urls',
		urlsArray,
		providers, // Pass array instead of single ID
		{
			// Enhanced context for providers
			siteUrl,
			blueprintData: blueprintDataForStatic,
			staticSiteUrl,
			providers,
		}
	);

	// IMPORTANT: To avoid race conditions when multiple providers fetch the same URLs,
	// we need to run providers sequentially, not in parallel.
	// This ensures each provider gets a complete set of files without interference.
	const uploadResults = [];

	// Track progress across all providers
	// We need to wrap processStaticSiteUrls to provide a provider-aware progress callback
	// The original progress callback in usePublishController.js doesn't know about multiple providers
	for (
		let providerIndex = 0;
		providerIndex < providers.length;
		providerIndex++
	) {
		const providerIdItem = providers[ providerIndex ];
		try {
			// Fetch provider-specific deployment URL
			// Each provider may have a different public URL (e.g., custom domain, worker endpoint)
			let providerDeploymentUrl = staticSiteUrl || null;
			let providerName = providerIdItem; // Fallback to ID
			let providerConfig = {};

			try {
				const providerResponse = await apiFetch( {
					path: `/aether/site-exporter/providers/${ providerIdItem }`,
				} );
				if ( providerResponse.success && providerResponse.config ) {
					providerConfig = providerResponse.config || {};
					// Get provider instance name or type for display
					providerName =
						providerConfig.instance_name ||
						providerConfig.provider_type ||
						providerIdItem;

					// Get deployment URL from provider config (same logic as AbstractProvider.getDeploymentUrl)
					if ( providerConfig.pages_url ) {
						providerDeploymentUrl = providerConfig.pages_url;
					} else if ( providerConfig.worker_endpoint ) {
						providerDeploymentUrl = providerConfig.worker_endpoint;
					} else if ( providerConfig.public_url ) {
						providerDeploymentUrl = providerConfig.public_url;
					}
					// Allow filter to override deployment URL
					providerDeploymentUrl = applyFilters(
						'aether.provider.deployment_url',
						providerDeploymentUrl,
						providerConfig,
						providerIdItem
					);
				}
			} catch ( error ) {
				// If we can't fetch provider config, fall back to shared staticSiteUrl
				// This maintains backwards compatibility
			}

			// Show provider context banner
			if ( setStatusMessage && providers.length > 1 ) {
				setStatusMessage(
					`Uploading to ${ providerName } (Provider ${
						providerIndex + 1
					} of ${ providers.length })`,
					'info',
					'upload-provider-context'
				);
			}

			// Update progress context before processing this provider
			// This allows the progress callback in usePublishController.js to adjust
			// progress based on the current provider index and total providers
			if ( updateStaticSiteProgressContext ) {
				updateStaticSiteProgressContext(
					providerIndex,
					providers.length
				);
			}

			const result = await processStaticSiteUrls(
				filteredUrls,
				providerDeploymentUrl, // Provider-specific deployment URL
				providerIdItem,
				siteUrl,
				setStatusMessage,
				blueprintDataForStatic,
				removeMessage
			);

			// Show provider completion summary
			if ( setStatusMessage && providers.length > 1 ) {
				const filesUploaded = result.filesUploaded || 0;
				setStatusMessage(
					`Completed ${ providerName }: ${ filesUploaded } files uploaded`,
					'success',
					`upload-provider-${ providerIndex }-summary`
				);
			}

			// After processing, ensure progress reflects completed provider
			// The progress callback should have already updated it, but we ensure it's correct
			if (
				setStepProgress &&
				setOverallProgressValue &&
				updateStaticSiteProgressContext &&
				providers.length > 1
			) {
				// Provider completed, so update context to reflect completion
				// This ensures progress shows 100% for this provider's share
				updateStaticSiteProgressContext(
					providerIndex + 1,
					providers.length
				);
				// Trigger final progress update (provider at 100% of its share)
				const stepProgress = Math.min(
					100,
					Math.round(
						( ( providerIndex + 1 ) / providers.length ) * 100
					)
				);
				setStepProgress( 'uploadStaticSiteFiles', stepProgress );
				setOverallProgressValue(
					calculateOverallProgress( {
						step: 'uploadStaticSiteFiles',
						progress: stepProgress,
					} )
				);
			}

			uploadResults.push( {
				status: 'fulfilled',
				value: {
					providerId: providerIdItem,
					success: true,
					filesUploaded: result.filesUploaded || 0,
					uploadedFiles: result.uploadedFiles || [],
				},
			} );
		} catch ( error ) {
			uploadResults.push( {
				status: 'rejected',
				value: {
					providerId: providerIdItem,
					success: false,
					error: error.message,
				},
			} );
		}
	}

	// Use the uploadResults array we built sequentially
	const results = uploadResults;

	// Aggregate results
	const successfulUploads = results.filter(
		( r ) => r.status === 'fulfilled' && r.value.success
	);
	const failedUploads = results.filter(
		( r ) =>
			r.status === 'rejected' ||
			( r.status === 'fulfilled' && ! r.value.success )
	);

	if ( successfulUploads.length > 0 ) {
		const totalFiles = successfulUploads.reduce(
			( sum, r ) => sum + ( r.value.filesUploaded || 0 ),
			0
		);
		setStatusMessage(
			`Uploaded static site to ${ successfulUploads.length }/${ providers.length } provider(s) (${ totalFiles } files)`,
			failedUploads.length > 0 ? 'warning' : 'success',
			'uploadStaticSiteFiles'
		);
	}

	if ( failedUploads.length === providers.length ) {
		throw new Error( 'Failed to upload static site to any provider' );
	}

	/**
	 * Filter the upload result before returning.
	 *
	 * @param {Object} result    The aggregated upload result object.
	 * @param {Array}  providers Array of provider IDs used for upload.
	 * @param {Object} context   Enhanced context with workflow state.
	 *
	 * @example
	 * import { addFilter} from '@wordpress/hooks';
	 *
	 * addFilter('aether.upload.result', 'my-provider', (result, providers, context) => {
	 *   return {
	 *     ...result,
	 *     customMetadata: 'added by my provider',
	 *     // context contains: siteUrl, blueprintData, etc.
	 *   };
	 * });
	 */
	const filteredResult = applyFilters(
		'aether.upload.result',
		{
			providers,
			results: results.map( ( r ) =>
				r.status === 'fulfilled' ? r.value : r.reason
			),
			successCount: successfulUploads.length,
			failureCount: failedUploads.length,
			// Legacy fields for backwards compatibility
			staticFiles: successfulUploads[ 0 ]?.value?.uploadedFiles || [],
			filesUploaded: successfulUploads[ 0 ]?.value?.filesUploaded || 0,
		},
		providers,
		{
			// Enhanced context for providers
			siteUrl,
			blueprintData: blueprintDataForStatic,
			staticSiteUrl,
		}
	);

	return filteredResult;
}

/**
 * Register uploadStaticFiles step for staticSite phase
 */
addFilter(
	'aether.publish.uploadAssets.staticSite.steps.register',
	'aether/upload-assets-upload-static-files-step',
	( steps ) => {
		steps.push( {
			id: 'uploadStaticFiles',
			label: 'Upload Static Files',
			description: 'Generate and upload static HTML files to providers',
			dependencies: [],
			handler,
		} );
		return steps;
	}
);
