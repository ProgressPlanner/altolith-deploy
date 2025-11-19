/**
 * Local Filesystem Provider Registration
 *
 * This file registers hooks for the LocalFilesystem provider implementation.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';
import { LocalFilesystemProvider } from './LocalFilesystemProvider';

// Create provider instance for hook registration
const provider = new LocalFilesystemProvider();

/**
 * Register upload handler hook.
 *
 * Providers register upload handlers via aether.provider.upload filter.
 */
addFilter(
	'aether.provider.upload',
	'aether/local-filesystem',
	( handler, providerId ) => {
		// Only handle requests for this provider
		if ( providerId !== 'local-filesystem' ) {
			return handler; // Return existing handler or null
		}

		// Return upload handler function
		return async ( filePath, fileName ) => {
			return await provider.uploadFile( filePath, fileName );
		};
	},
	10
);

/**
 * Register test connection handler hook.
 *
 * Providers register test handlers via aether.provider.test filter.
 */
addFilter(
	'aether.provider.test',
	'aether/local-filesystem',
	( handler, providerId, config ) => {
		// Only handle requests for this provider
		if ( providerId !== 'local-filesystem' ) {
			return handler; // Return existing handler or null
		}

		// Return test handler function
		return async ( testConfig ) => {
			return await provider.testConnection( testConfig || config );
		};
	},
	10
);

/**
 * Register upload strategy filter.
 *
 * Providers can override upload strategy via aether.provider.upload_strategy filter.
 */
addFilter(
	'aether.provider.upload_strategy',
	'aether/local-filesystem',
	( strategy, providerId ) => {
		if ( providerId === 'local-filesystem' ) {
			return 'direct';
		}
		return strategy;
	},
	10
);
