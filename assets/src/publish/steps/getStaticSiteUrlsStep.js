/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be converted to static HTML.
 * Uses WordPress queries to find posts, pages, archives, etc.
 *
 * @package
 */

import apiFetch from '../../utils/api';

/**
 * Get static site URLs step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered URLs.
 */
export async function getStaticSiteUrlsHandler( context ) {
	const { setStatusMessage } = context;

	setStatusMessage(
		'Discovering URLs for static site…',
		'progress',
		'getStaticSiteUrls'
	);

	// Call REST endpoint to discover URLs (handled by URLDiscoveryService.php)
	const urlsResponse = await apiFetch( {
		path: '/aether/v1/publish/steps/getStaticSiteUrls',
	} );

	if ( ! urlsResponse.success || ! urlsResponse.urls ) {
		throw new Error( urlsResponse.message || 'Failed to discover URLs' );
	}

	const urls = urlsResponse.urls;
	const staticSiteUrl = urlsResponse.staticSiteUrl || null;

	setStatusMessage(
		`Discovered ${ urls.length } URLs for static site`,
		'success',
		'getStaticSiteUrls'
	);

	return {
		urls,
		staticSiteUrl,
		urlsCount: urls.length,
	};
}
