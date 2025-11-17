/**
 * Local Filesystem Provider Registration
 *
 * This file registers the LocalFilesystem provider with the Aether plugin.
 *
 * @package
 */

import { addAction } from '@wordpress/hooks';
import { LocalFilesystemProvider } from './LocalFilesystemProvider';
import ProviderRegistry from '../registry/ProviderRegistry';

/**
 * Register LocalFilesystem provider immediately.
 *
 * Register directly with the registry instance to ensure it's available
 * before any code tries to use it.
 */
ProviderRegistry.register( 'local-filesystem', LocalFilesystemProvider );

/**
 * Also register via hooks for auto-discovery compatibility.
 *
 * Listen for the registry's registration action and register the provider.
 * This ensures the provider is registered even if autoDiscover() is called.
 */
addAction(
	'aether.providers.register',
	'aether/local-filesystem',
	( registry ) => {
		registry.register( 'local-filesystem', LocalFilesystemProvider );
	}
);
