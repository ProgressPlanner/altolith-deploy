/**
 * Upload Site Archive Step
 *
 * Uploads wp-content.zip file directly to storage.
 * Handles both Git and storage provider uploads.
 *
 * @package
 */

/**
 * Upload site archive step handler (stateless).
 *
 * @param {Object}   context                         Execution context.
 * @param {Function} context.handleSiteArchiveUpload Archive upload function.
 * @param {string}   context.siteKey                 Site key for storage.
 * @param {string}   context.providerId              Storage provider ID.
 * @param {Function} context.setStatusMessage        Status message updater.
 * @return {Promise<Object>} Step result.
 */
export async function uploadSiteArchiveHandler( context ) {
	const { handleSiteArchiveUpload, siteKey, providerId, setStatusMessage } =
		context;

	setStatusMessage(
		'Uploading site archive…',
		'progress',
		'uploadSiteArchive'
	);

	// Upload wp-content.zip directly
	await handleSiteArchiveUpload( siteKey, providerId );

	setStatusMessage(
		'Site archive uploaded successfully',
		'success',
		'uploadSiteArchive'
	);

	return {};
}
