/**
 * Local Filesystem Provider Registration
 *
 * This file registers hooks for the LocalFilesystem provider implementation.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
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
	( handler, providerId, config ) => {
		// Only handle requests for local-filesystem providers (including instances)
		if ( ! providerId || ! providerId.startsWith( 'local-filesystem' ) ) {
			return handler; // Return existing handler or null
		}

		// Return upload handler function
		return async ( filePath, fileName, context ) => {
			// Get export path from context (set by uploadSiteArchiveStep)
			// providerId from filter is an instance ID (e.g., 'local-filesystem:abc-123')
			// Use instanceId from context if available, otherwise fall back to providerId from closure
			const instanceId = context?.instanceId || providerId;
			const exportPath = context?.exportPath || 'blueprint-bundle/bundle.zip';
			
			// Trigger PHP action hook for provider instances to handle upload
			// This allows each provider instance to copy the file to its configured path
			try {
				const response = await apiFetch( {
					path: '/aether/site-exporter/local-storage/trigger-blueprint-bundle-upload',
					method: 'POST',
					data: {
						instance_id: instanceId,
						source_path: filePath,
						destination_path: exportPath,
						context: context || {},
					},
				} );

				if ( ! response.success ) {
					return {
						success: false,
						error: response.message || 'Failed to trigger blueprint bundle upload',
					};
				}

				return {
					success: true,
					message: response.message || 'Blueprint bundle uploaded successfully',
					path: exportPath,
				};
			} catch ( error ) {
				return {
					success: false,
					error: error?.message || error?.toString() || 'Unknown error during upload',
				};
			}
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
		// Only handle requests for local-filesystem providers (including instances)
		if ( ! providerId || ! providerId.startsWith( 'local-filesystem' ) ) {
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
		if ( providerId && providerId.startsWith( 'local-filesystem' ) ) {
			return 'direct';
		}
		return strategy;
	},
	10
);
