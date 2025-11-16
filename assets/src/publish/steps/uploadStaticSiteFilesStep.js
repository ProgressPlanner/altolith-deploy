/**
 * Upload Static Site Files Step
 *
 * This is the MOST COMPLEX step - generates static HTML/CSS/JS and uploads to storage.
 * Handles all URL fetching, asset extraction, URL rewriting, and file uploads.
 *
 * @package
 */

/**
 * Upload static site files step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Function} context.processStaticSiteUrls Static site generator function.
 * @param {Object}   context.currentStatus         Current job status.
 * @param {string}   context.siteKey               Site key for storage.
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
		siteKey,
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

	if ( ! siteKey ) {
		throw new Error(
			'Site key is required for static site generation. Please ensure the site is properly configured.'
		);
	}

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

	// Process ALL URLs and upload static files
	const result = await processStaticSiteUrls(
		urlsArray,
		siteUrlForStatic,
		providerId,
		siteKey,
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

	return {
		staticFiles: result.uploadedFiles || [],
		filesUploaded: result.filesUploaded || 0,
	};
}
