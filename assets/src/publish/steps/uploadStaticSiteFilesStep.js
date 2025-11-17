/**
 * Upload Static Site Files Step
 *
 * This is the MOST COMPLEX step - generates static HTML/CSS/JS and uploads to storage.
 * Handles all URL fetching, asset extraction, URL rewriting, and file uploads.
 *
 * @package
 */

import { doAction, applyFilters } from '@wordpress/hooks';

/**
 * Upload static site files step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Function} context.processStaticSiteUrls Static site generator function.
 * @param {Object}   context.currentStatus         Current job status.
 * @param {string}   context.siteUrl               WordPress site URL.
 * @param {string}   context.providerId            Storage/static-site provider ID.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @param {Function} context.removeMessage         Message remover.
 * @return {Promise<Object>} Step result with uploaded files.
 */
export async function uploadStaticSiteFilesHandler( context ) {
	const {
		processStaticSiteUrls,
		urls, // From getStaticSiteUrlsHandler (workflow) or currentStatus (tests)
		staticSiteUrl, // From getStaticSiteUrlsHandler (workflow) or currentStatus (tests)
		blueprintData, // From generateBlueprintHandler (workflow) or currentStatus (tests)
		currentStatus, // Legacy support for tests
		siteUrl,
		providerId,
		setStatusMessage,
		removeMessage,
	} = context;

	setStatusMessage(
		'Uploading static site files…',
		'progress',
		'uploadStaticSiteFiles'
	);

	// Support both new format (urls directly in context) and old format (currentStatus.urls for tests)
	const urlsArray = urls || currentStatus?.urls;
	const siteUrlForStatic =
		staticSiteUrl !== undefined
			? staticSiteUrl
			: currentStatus?.staticSiteUrl ?? null;
	const blueprintDataForStatic =
		blueprintData !== undefined
			? blueprintData
			: currentStatus?.blueprintData ?? null;

	if ( ! urlsArray || ! Array.isArray( urlsArray ) ) {
		throw new Error(
			'URLs not found. Please run getStaticSiteUrls first.'
		);
	}

	/**
	 * Filter the URLs before processing for static site upload.
	 *
	 * Allows modification of URLs that will be fetched and uploaded.
	 *
	 * @param {Array}  urls       Array of URL objects to process.
	 * @param {string} providerId The provider ID being used for upload.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('aether.upload.urls', 'my-provider', (urls, providerId) => {
	 *   // Add custom URL
	 *   return [...urls, { url: '/custom-page/', type: 'page' }];
	 * });
	 */
	const filteredUrls = applyFilters( 'aether.upload.urls', urlsArray, providerId );

	// Process ALL URLs and upload static files
	const result = await processStaticSiteUrls(
		filteredUrls,
		siteUrlForStatic,
		providerId,
		siteUrl,
		setStatusMessage,
		blueprintDataForStatic,
		removeMessage
	);

	setStatusMessage(
		`Uploaded static site files (${ result.filesUploaded || 0 } files)`,
		'success',
		'uploadStaticSiteFiles'
	);

	/**
	 * Filter the upload result before returning.
	 *
	 * @param {Object} result     The upload result object.
	 * @param {string} providerId The provider ID used for upload.
	 *
	 * @example
	 * import { addFilter} from '@wordpress/hooks';
	 *
	 * addFilter('aether.upload.result', 'my-provider', (result, providerId) => {
	 *   return {
	 *     ...result,
	 *     customMetadata: 'added by my provider'
	 *   };
	 * });
	 */
	const filteredResult = applyFilters(
		'aether.upload.result',
		{
			staticFiles: result.uploadedFiles || [],
			filesUploaded: result.filesUploaded || 0,
		},
		providerId
	);

	return filteredResult;
}
