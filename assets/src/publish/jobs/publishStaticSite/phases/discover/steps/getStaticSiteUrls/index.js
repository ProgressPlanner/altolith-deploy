/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be converted to static HTML.
 * Uses WordPress queries to find posts, pages, archives, etc.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';
import apiFetch from '../../../../../../../utils/api';

/**
 * Get static site URLs step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered URLs.
 */
export async function handler( context ) {
	const { setStatusMessage } = context;

	setStatusMessage(
		'Discovering URLs for static site…',
		'progress',
		'getStaticSiteUrls'
	);

	// Call REST endpoint to discover URLs (handled by URLDiscoveryService.php)
	const urlsResponse = await apiFetch( {
		path: '/aether/site-exporter/publish/steps/getStaticSiteUrls',
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

/**
 * Register getStaticSiteUrls step for discover phase
 */
addFilter(
	'aether.publish.publishStaticSite.discover.steps.register',
	'aether/publish-static-site-get-static-site-urls-step',
	( steps ) => {
		steps.push( {
			id: 'getStaticSiteUrls',
			label: 'Get Static Site URLs',
			description: 'Discover all URLs to convert to static HTML',
			dependencies: [],
			handler,
		} );
		return steps;
	}
);
