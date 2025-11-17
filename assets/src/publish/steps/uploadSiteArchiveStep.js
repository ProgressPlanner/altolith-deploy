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
 * @param {Object}   context                         Execution context.
 * @param {Function} context.handleSiteArchiveUpload Archive upload function.
 * @param {string}   context.providerId              Storage provider ID.
 * @param {Function} context.setStatusMessage        Status message updater.
 * @param {Object}   context.blueprintBundle         Blueprint bundle data from generateBlueprint step.
 * @return {Promise<Object>} Step result.
 */
export async function uploadSiteArchiveHandler( context ) {
	const { handleSiteArchiveUpload, providerId, setStatusMessage } = context;

	setStatusMessage(
		'Uploading site archive…',
		'progress',
		'uploadSiteArchive'
	);

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
		context,
		providerId
	);

	// Upload blueprint-bundle.zip directly
	// Pass entire context so upload handler has access to blueprintBundle data
	await handleSiteArchiveUpload( providerId, deploymentConfig );

	setStatusMessage(
		'Site archive uploaded successfully',
		'success',
		'uploadSiteArchive'
	);

	return {};
}
