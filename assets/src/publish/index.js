/**
 * Publish Page Entry Point
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
import PublishPage from './PublishPage';
import { loadAllProviders } from '@aether/providers/utils/providerLoader';
import { ConfigProvider } from '@aether/contexts/ConfigContext';
import { ProviderProvider } from '@aether/contexts/ProviderContext';
import { PublishProvider } from '@aether/contexts/PublishContext';
import DevTools from '@aether/components/DevTools';
import { debugWarn } from '@aether/utils/debug';
import { initializeErrorHandlers } from '@aether/utils/errorHandler';

// Initialize global error handlers
initializeErrorHandlers();

// Providers are registered in JavaScript via aether.providers.register hooks.
// JavaScript providers register implementation hooks (aether.provider.upload, aether.provider.test, etc.).
// Providers are loaded dynamically as separate scripts (enqueued via PHP) to reduce initial bundle size.

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
