/**
 * Upload Site Archive Step
 *
 * Uploads blueprint-bundle.zip file to configured provider(s).
 * Supports multiple provider instances with different deployment configurations.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { calculateOverallProgress } from '../utils/progressManager';

/**
 * Upload site archive step handler (stateless).
 *
 * @param {Object}   context                          Execution context.
 * @param {Function} context.handleSiteArchiveUpload  Archive upload function.
 * @param {Array}    context.blueprintBundleProviders Array of provider IDs that support blueprint bundle deployment.
 * @param {string}   context.providerId               (Legacy) Single provider ID for backwards compatibility.
 * @param {Function} context.setStatusMessage         Status message updater.
 * @param {Object}   context.blueprintBundle          Blueprint bundle data from generateBlueprint step.
 * @return {Promise<Object>} Step result.
 */
export async function uploadSiteArchiveHandler( context ) {
	const {
		handleSiteArchiveUpload,
		blueprintBundleProviders = [], // NEW: Array of provider IDs
		providerId, // LEGACY: Keep for backwards compat
		setStatusMessage,
		setStepProgress,
		setOverallProgressValue,
	} = context;

	// Use blueprintBundleProviders if available (these are instance IDs)
	// Fallback to single providerId for backward compatibility (may be instance ID or provider type ID)
	let providers = [];
	if ( blueprintBundleProviders.length > 0 ) {
		// blueprintBundleProviders contains instance IDs (e.g., 'local-filesystem:abc-123')
		providers = blueprintBundleProviders;
	} else if ( providerId ) {
		// Legacy fallback - providerId may be instance ID or provider type ID
		providers = [ providerId ];
	}

	if ( providers.length === 0 ) {
		setStatusMessage(
			'No providers enabled for blueprint bundle',
			'warning',
			'uploadSiteArchive'
		);
		return { skipped: true, reason: 'no_providers' };
	}

	setStatusMessage(
		`Uploading blueprint bundle to ${ providers.length } provider(s)…`,
		'progress',
		'uploadSiteArchive'
	);

	// Upload to providers sequentially to avoid race conditions
	const uploadResults = [];
	let successCount = 0;
	let failureCount = 0;

	for ( const providerIdItem of providers ) {
		try {
			// Fetch provider-specific configuration
			// providerIdItem is an instance ID (e.g., 'local-filesystem:abc-123')
			let exportPath = 'blueprint-bundle/bundle.zip'; // Default path
			try {
				const providerResponse = await apiFetch( {
					path: `/aether/site-exporter/providers/${ providerIdItem }`,
				} );
				if ( providerResponse.success && providerResponse.config ) {
					const providerConfig = providerResponse.config || {};
					// Get provider-specific export_path from instance config
					if ( providerConfig.export_path ) {
						exportPath = providerConfig.export_path;
					}
				} else if ( ! providerResponse.success ) {
					console.warn(
						`[Aether] Failed to fetch config for instance ${ providerIdItem }:`,
						providerResponse
					);
				}
			} catch ( error ) {
				// If we can't fetch provider config, use default export path
				// This maintains backwards compatibility
				console.warn(
					`[Aether] Error fetching config for instance ${ providerIdItem }, using default export path:`,
					error
				);
			}

			/**
			 * Filter the deployment configuration before archive upload.
			 *
			 * Allows modification of upload settings, provider ID, or context data.
			 *
			 * @param {Object} deploymentConfig Configuration object with context data.
			 * @param {string} providerId       The provider ID being used.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('aether.deployment.config', 'my-provider', (config, providerId) => {
			 *   return {
			 *     ...config,
			 *     customUploadOptions: {
			 *       compression: 'gzip',
			 *       cacheControl: 'max-age=3600'
			 *     }
			 *   };
			 * });
			 */
			const deploymentConfig = applyFilters(
				'aether.deployment.config',
				{
					...context,
					providerId: providerIdItem,
					exportPath, // Add export path to config
				},
				providerIdItem
			);

			// Upload blueprint-bundle.zip directly
			// Pass entire context so upload handler has access to blueprintBundle data
			await handleSiteArchiveUpload( providerIdItem, deploymentConfig );

			successCount++;
			uploadResults.push( {
				status: 'fulfilled',
				value: {
					providerId: providerIdItem,
					success: true,
					exportPath,
				},
			} );

			// Update progress incrementally as each instance completes
			// Calculate progress as: (successCount / providers.length) * 100
			if ( setStepProgress && setOverallProgressValue ) {
				const stepProgress = Math.min(
					100,
					Math.round( ( successCount / providers.length ) * 100 )
				);
				setStepProgress( 'uploadSiteArchive', stepProgress );
				setOverallProgressValue(
					calculateOverallProgress( {
						step: 'uploadSiteArchive',
						progress: stepProgress,
					} )
				);
			}
		} catch ( error ) {
			failureCount++;
			const errorMessage =
				error?.message || error?.toString() || 'Unknown error';
			console.error(
				`[Aether] Failed to upload blueprint bundle to instance ${ providerIdItem }:`,
				error
			);
			uploadResults.push( {
				status: 'rejected',
				reason: error,
				providerId: providerIdItem,
				error: errorMessage,
			} );
		}
	}

	// Report results
	if ( successCount > 0 ) {
		setStatusMessage(
			`Uploaded blueprint bundle to ${ successCount }/${ providers.length } provider(s)`,
			failureCount > 0 ? 'warning' : 'success',
			'uploadSiteArchive'
		);
	}

	// Fail only if ALL providers failed
	if ( successCount === 0 ) {
		throw new Error( 'Failed to upload blueprint bundle to any provider' );
	}

	return {
		providers,
		results: uploadResults.map( ( r ) =>
			r.status === 'fulfilled' ? r.value : r.reason
		),
		successCount,
		failureCount,
	};
}
