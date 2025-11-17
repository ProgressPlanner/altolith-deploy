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

	// Upload blueprint-bundle.zip directly
	// Pass entire context so upload handler has access to blueprintBundle data
	await handleSiteArchiveUpload( providerId, context );

	setStatusMessage(
		'Site archive uploaded successfully',
		'success',
		'uploadSiteArchive'
	);

	return {};
}
