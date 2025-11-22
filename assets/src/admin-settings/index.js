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
	if (
		typeof window !== 'undefined' &&
		window.aetherData &&
		window.aetherData.pluginUrl
	) {
		const pluginUrl = window.aetherData.pluginUrl;
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
import { PublishProvider } from '../contexts/ExportContext';
import { initializeErrorHandlers } from '../utils/errorHandler';

// Initialize global error handlers
initializeErrorHandlers();

// Providers are registered in JavaScript via aether.providers.register hooks.
// JavaScript providers register implementation hooks (aether.provider.upload, aether.provider.test, etc.).

/**
 * Initialize admin settings page.
 *
 * @return {void}
 */
const init = () => {
	const container = document.getElementById( 'aether-admin-settings' );

	if ( ! container ) {
		// eslint-disable-next-line no-console
		console.error(
			'Aether: Container element #aether-admin-settings not found'
		);
		return;
	}

	// eslint-disable-next-line no-console
	console.log( 'Aether: Initializing admin settings page...' );

	try {
		render(
			<ErrorBoundary>
				<PublishProvider>
					<AdminSettings />
				</PublishProvider>
			</ErrorBoundary>,
			container
		);
		// eslint-disable-next-line no-console
		console.log( 'Aether: Admin settings page rendered successfully' );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Aether: Error rendering admin settings page:', error );
	}
};

// Wait for DOM to be ready
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
