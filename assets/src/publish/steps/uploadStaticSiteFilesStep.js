/**
 * Upload Static Site Files Step
 *
 * This is the MOST COMPLEX step - generates static HTML/CSS/JS and uploads to storage.
 * Handles all URL fetching, asset extraction, URL rewriting, and file uploads.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';

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
export async function uploadStaticSiteFilesHandler( context ) {
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
		removeMessage,
	} = context;

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
	 * @param {Array} urls      Array of URL objects to process.
	 * @param {Array} providers Array of provider IDs being used for upload.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('aether.upload.urls', 'my-provider', (urls, providers) => {
	 *   // Add custom URL
	 *   return [...urls, { url: '/custom-page/', type: 'page' }];
	 * });
	 */
	const filteredUrls = applyFilters(
		'aether.upload.urls',
		urlsArray,
		providers // Pass array instead of single ID
	);

	// Upload to ALL providers in parallel
	const uploadPromises = providers.map( async ( providerIdItem ) => {
		try {
			const result = await processStaticSiteUrls(
				filteredUrls,
				siteUrlForStatic,
				providerIdItem,
				siteUrl,
				setStatusMessage,
				blueprintDataForStatic,
				removeMessage
			);

			return {
				providerId: providerIdItem,
				success: true,
				filesUploaded: result.filesUploaded || 0,
				uploadedFiles: result.uploadedFiles || [],
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
	 *
	 * @example
	 * import { addFilter} from '@wordpress/hooks';
	 *
	 * addFilter('aether.upload.result', 'my-provider', (result, providers) => {
	 *   return {
	 *     ...result,
	 *     customMetadata: 'added by my provider'
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
		providers
	);

	return filteredResult;
}
