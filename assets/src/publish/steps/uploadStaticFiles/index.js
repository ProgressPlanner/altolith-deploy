/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import apiFetch from '../../../utils/api';
import { calculateOverallProgress } from '../../utils/progressManager';

/**
 * Upload static files step handler.
 *
 * @param {Object}   context                                 Execution context.
 * @param {Function} context.processStaticSiteUrls           Static site generator function.
 * @param {Array}    context.staticSiteProviders             Providers for static site.
 * @param {Array}    context.urls                            URLs from getStaticSiteUrls.
 * @param {string}   context.staticSiteUrl                   Static site URL.
 * @param {Object}   context.blueprintData                   Blueprint data.
 * @param {string}   context.siteUrl                         WordPress site URL.
 * @param {Function} context.setStatusMessage                Status message updater.
 * @param {Function} context.setStepProgress                 Step progress updater.
 * @param {Function} context.setOverallProgressValue         Overall progress updater.
 * @param {Function} context.updateStaticSiteProgressContext Progress context updater.
 * @param {Function} context.removeMessage                   Message remover.
 * @return {Promise<Object>} Step result with uploaded files.
 */
async function handler( context ) {
	const {
		processStaticSiteUrls,
		urls,
		staticSiteUrl,
		blueprintData,
		siteUrl,
		staticSiteProviders = [],
		setStatusMessage,
		setStepProgress,
		setOverallProgressValue,
		updateStaticSiteProgressContext,
		removeMessage,
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
		`Uploading static site to ${ providers.length } provider(s)…`,
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

	// Upload to providers sequentially to avoid race conditions
	const uploadResults = [];

	for (
		let providerIndex = 0;
		providerIndex < providers.length;
		providerIndex++
	) {
		const providerIdItem = providers[ providerIndex ];
		try {
			// Fetch provider config
			let providerDeploymentUrl = staticSiteUrl || null;
			let providerName = providerIdItem;

			try {
				const providerResponse = await apiFetch( {
					path: `/aether/site-exporter/providers/${ providerIdItem }`,
				} );
				if ( providerResponse.success && providerResponse.config ) {
					const providerConfig = providerResponse.config || {};
					providerName =
						providerConfig.instance_name ||
						providerConfig.provider_type ||
						providerIdItem;

					if ( providerConfig.pages_url ) {
						providerDeploymentUrl = providerConfig.pages_url;
					} else if ( providerConfig.worker_endpoint ) {
						providerDeploymentUrl = providerConfig.worker_endpoint;
					} else if ( providerConfig.public_url ) {
						providerDeploymentUrl = providerConfig.public_url;
					}

					providerDeploymentUrl = applyFilters(
						'aether.provider.deployment_url',
						providerDeploymentUrl,
						providerConfig,
						providerIdItem
					);
				}
			} catch {
				// Use defaults on error
			}

			// Show provider context
			if ( setStatusMessage && providers.length > 1 ) {
				setStatusMessage(
					`Uploading to ${ providerName } (Provider ${
						providerIndex + 1
					} of ${ providers.length })`,
					'info',
					'upload-provider-context'
				);
			}

			// Update progress context
			if ( updateStaticSiteProgressContext ) {
				updateStaticSiteProgressContext(
					providerIndex,
					providers.length
				);
			}

			const result = await processStaticSiteUrls(
				filteredUrls,
				providerDeploymentUrl,
				providerIdItem,
				siteUrl,
				setStatusMessage,
				blueprintData,
				removeMessage
			);

			// Show completion summary
			if ( setStatusMessage && providers.length > 1 ) {
				const filesUploaded = result.filesUploaded || 0;
				setStatusMessage(
					`Completed ${ providerName }: ${ filesUploaded } files uploaded`,
					'success',
					`upload-provider-${ providerIndex }-summary`
				);
			}

			// Update progress
			if (
				setStepProgress &&
				setOverallProgressValue &&
				updateStaticSiteProgressContext &&
				providers.length > 1
			) {
				updateStaticSiteProgressContext(
					providerIndex + 1,
					providers.length
				);
				const stepProgress = Math.min(
					100,
					Math.round(
						( ( providerIndex + 1 ) / providers.length ) * 100
					)
				);
				setStepProgress( 'uploadStaticFiles', stepProgress );
				setOverallProgressValue(
					calculateOverallProgress( {
						step: 'uploadStaticFiles',
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

	// Aggregate results
	const successfulUploads = uploadResults.filter(
		( r ) => r.status === 'fulfilled' && r.value.success
	);
	const failedUploads = uploadResults.filter(
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
			'uploadStaticFiles'
		);
	}

	if ( failedUploads.length === providers.length ) {
		throw new Error( 'Failed to upload static site to any provider' );
	}

	return applyFilters(
		'aether.upload.result',
		{
			providers,
			results: uploadResults.map( ( r ) =>
				r.status === 'fulfilled' ? r.value : r.reason
			),
			successCount: successfulUploads.length,
			failureCount: failedUploads.length,
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
