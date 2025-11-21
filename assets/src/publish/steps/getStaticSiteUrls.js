/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be fetched for static site generation.
 *
 * @package
 */

/**
 * Get static site URLs step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {string}   context.siteUrl          WordPress site URL.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered URLs.
 */
async function handler( context ) {
	const { api, siteUrl, setStatusMessage } = context;

	setStatusMessage(
		'Discovering URLs for static site…',
		'progress',
		'getStaticSiteUrls'
	);

	// Discover URLs from API
	const urlResponse = await api.discoverUrls();

	if ( ! urlResponse.success ) {
		throw new Error( urlResponse.message || 'Failed to discover URLs' );
	}

	const urls = urlResponse.urls || [];
	const staticSiteUrl = urlResponse.staticSiteUrl || siteUrl;
	const urlsCount = urls.length;

	setStatusMessage(
		`Discovered ${ urlsCount } URLs for static site generation`,
		'success',
		'getStaticSiteUrls'
	);

	// Return data to merge into execution state
	return {
		urls,
		staticSiteUrl,
		urlsCount,
	};
}

/**
 * Get Static Site URLs step definition.
 */
export const getStaticSiteUrlsStep = {
	id: 'getStaticSiteUrls',
	label: 'Discover URLs',
	description: 'Find all URLs for static site generation',
	dependencies: [],
	provides: [ 'urls', 'staticSiteUrl', 'urlsCount' ],
	handler,
};
