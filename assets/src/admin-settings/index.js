/**
 * Admin Settings Entry Point
 *
 * Loads providers via dynamic imports and renders the AdminSettings component.
 * Providers are imported directly here rather than via PHP-enqueued scripts
 * to ensure they register before the component queries the provider registry.
 *
 * @package
 */

// Set webpack publicPath before any imports (for asset loading)
// Note: Webpack is configured to never create chunks - all code is bundled into single files
// eslint-disable-next-line camelcase, no-undef
if ( typeof __webpack_public_path__ !== 'undefined' ) {
	const pluginUrlMeta = document.querySelector(
		'meta[name="aether-plugin-url"]'
	);
	if ( pluginUrlMeta ) {
		const pluginUrl = pluginUrlMeta.getAttribute( 'content' );
		// Ensure plugin URL ends with slash
		const publicPath = pluginUrl.endsWith( '/' )
			? pluginUrl + 'assets/build/'
			: pluginUrl + '/assets/build/';
		// eslint-disable-next-line camelcase, no-undef
		__webpack_public_path__ = publicPath;
	}
}

import { render } from '@wordpress/element';
import AdminSettings from './AdminSettings';
import ErrorBoundary from '../components/ErrorBoundary';
import { PublishProvider } from '../contexts/PublishContext';

// Providers are registered via PHP using the 'aether_providers' filter.
// JavaScript providers register implementation hooks (aether.provider.upload, aether.provider.test, etc.).

/**
 * Initialize admin settings page.
 *
 * @return {void}
 */
const init = () => {
	const container = document.getElementById( 'aether-admin-settings' );

	if ( ! container ) {
		return;
	}

	render(
		<ErrorBoundary>
			<PublishProvider>
				<AdminSettings />
			</PublishProvider>
		</ErrorBoundary>,
		container
	);
};

init();
