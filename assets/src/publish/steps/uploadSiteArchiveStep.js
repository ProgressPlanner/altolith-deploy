/**
 * Upload Site Archive Step
 *
 * Uploads wp-content.zip file directly to storage.
 * Handles both Git and storage provider uploads.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';

/**
 * Upload site archive step handler (stateless).
 *
 * @param {Object}   context                           Execution context.
 * @param {Function} context.handleSiteArchiveUpload   Archive upload function.
 * @param {Array}    context.blueprintBundleProviders  Array of provider IDs that support blueprint bundle deployment.
 * @param {string}   context.providerId                (Legacy) Single provider ID for backwards compatibility.
 * @param {Function} context.setStatusMessage          Status message updater.
 * @param {Object}   context.blueprintBundle           Blueprint bundle data from generateBlueprint step.
 * @return {Promise<Object>} Step result.
 */
export async function uploadSiteArchiveHandler( context ) {
	const {
		handleSiteArchiveUpload,
		blueprintBundleProviders = [], // NEW: Array of provider IDs
		providerId, // LEGACY: Keep for backwards compat
		setStatusMessage,
	} = context;

	// Use blueprintBundleProviders if available, fallback to single providerId
	const providers =
		blueprintBundleProviders.length > 0
			? blueprintBundleProviders
			: providerId
			? [ providerId ]
			: [];

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

	// Upload to ALL providers in parallel
	const uploadPromises = providers.map( async ( providerIdItem ) => {
		try {
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
				},
				providerIdItem
			);

			// Upload blueprint-bundle.zip directly
			// Pass entire context so upload handler has access to blueprintBundle data
			await handleSiteArchiveUpload(
				providerIdItem,
				deploymentConfig
			);

			return {
				providerId: providerIdItem,
				success: true,
			};
		} catch ( error ) {
			return {
				providerId: providerIdItem,
				success: false,
				error: error.message,
			};
		}
	} );

	const results = await Promise.allSettled( uploadPromises );

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
		setStatusMessage(
			`Uploaded blueprint bundle to ${ successfulUploads.length }/${ providers.length } provider(s)`,
			failedUploads.length > 0 ? 'warning' : 'success',
			'uploadSiteArchive'
		);
	}

	if ( failedUploads.length === providers.length ) {
		throw new Error(
			'Failed to upload blueprint bundle to any provider'
		);
	}

	return {
		providers,
		results: results.map( ( r ) =>
			r.status === 'fulfilled' ? r.value : r.reason
		),
		successCount: successfulUploads.length,
		failureCount: failedUploads.length,
	};
}
