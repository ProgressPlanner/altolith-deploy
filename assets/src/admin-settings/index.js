/**
 * Admin Settings Entry Point
 *
 * Loads providers via dynamic imports and renders the AdminSettings component.
 * Providers are imported directly here rather than via PHP-enqueued scripts
 * to ensure they register before the component queries the provider registry.
 *
 * @package
 */

// Set webpack publicPath before any imports to ensure chunks load correctly
// This must be set before any dynamic imports or chunk loading
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
import { ConfigProvider } from '../contexts/ConfigContext';
import { ProviderProvider } from '../contexts/ProviderContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import DevTools from '../components/DevTools';
import { debugError } from '../utils/debug';

/**
 * Load all provider modules via dynamic imports.
 *
 * Uses dynamic imports to allow webpack to code-split providers into separate chunks.
 * Catches individual import errors to prevent one failing provider from blocking others.
 *
 * @return {Promise<void>}
 */
const loadProviders = async () => {
	try {
		await Promise.all( [
			import( '../providers/cloudflare-r2/index' ).catch( () => {
				// Provider failed to load, continue with others
			} ),
			import( '../providers/gitlab/index' ).catch( () => {
				// Provider failed to load, continue with others
			} ),
			import( '../providers/cloudflare/index' ).catch( () => {
				// Provider failed to load, continue with others
			} ),
			import( '../providers/gitlab-pages/index' ).catch( () => {
				// Provider failed to load, continue with others
			} ),
		] );
	} catch ( error ) {
		// Log error but continue - admin settings should still render
		debugError( 'Error loading providers:', error );
	}
};

/**
 * Initialize admin settings page.
 *
 * Loads providers first to ensure they're registered, then renders the component.
 * If provider loading fails, still renders the component (it will show empty dropdowns).
 *
 * @return {Promise<void>}
 */
const init = async () => {
	const container = document.getElementById( 'aether-admin-settings' );

	if ( ! container ) {
		return;
	}

	try {
		// Wait for providers to load before rendering
		await loadProviders();

		render(
			<ConfigProvider>
				<ProviderProvider>
					<SettingsProvider>
						<AdminSettings />
						<DevTools />
					</SettingsProvider>
				</ProviderProvider>
			</ConfigProvider>,
			container
		);
	} catch ( error ) {
		debugError( 'Error initializing admin settings:', error );
		// Render anyway even if providers fail to load
		render(
			<ConfigProvider>
				<ProviderProvider>
					<SettingsProvider>
						<AdminSettings />
						<DevTools />
					</SettingsProvider>
				</ProviderProvider>
			</ConfigProvider>,
			container
		);
	}
};

init();
