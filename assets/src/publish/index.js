/**
 * Publish Page Entry Point
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
		// eslint-disable-next-line camelcase, no-undef
		__webpack_public_path__ =
			pluginUrlMeta.getAttribute( 'content' ) + 'assets/build/';
	}
}

import { render } from '@wordpress/element';
import PublishPage from './PublishPage';
import { loadAllProviders } from '../providers/utils/providerLoader';
import { ConfigProvider } from '../contexts/ConfigContext';
import { ProviderProvider } from '../contexts/ProviderContext';
import { PublishProvider } from '../contexts/PublishContext';
import DevTools from '../components/DevTools';
import { debugWarn } from '../utils/debug';

// Load providers dynamically to reduce initial bundle size
// Don't wait for providers to load - render immediately
// Providers will load in the background
loadAllProviders().catch( ( error ) => {
	// Log error but don't block functionality
	// Providers may already be loaded via PHP enqueuing
	debugWarn( 'Provider loading warning:', error );
} );

// Render immediately, don't wait for providers
const container = document.getElementById( 'aether-publish-page' );

if ( container ) {
	render(
		<ConfigProvider>
			<ProviderProvider>
				<PublishProvider>
					<PublishPage />
					<DevTools />
				</PublishProvider>
			</ProviderProvider>
		</ConfigProvider>,
		container
	);
}
