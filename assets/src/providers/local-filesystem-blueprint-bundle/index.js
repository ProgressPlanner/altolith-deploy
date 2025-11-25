/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Handles blueprint bundle uploads to local filesystem.
 * Uses the StorageService adapter pattern for true provider instance isolation.
 *
 * Note: Blueprint bundles are server-side files that need to be copied via PHP,
 * so the upload adapter calls a REST API endpoint instead of using direct file upload.
 *
 */

import { addFilter, doAction } from '@wordpress/hooks';
import apiFetch from '@aether/utils/api';
import { StorageService } from '../services/storageService';
import { LocalFilesystemBlueprintBundleProvider } from './LocalFilesystemBlueprintBundleProvider';
import ProviderRegistry from '../registry/ProviderRegistry';

// Register provider class in JavaScript registry
ProviderRegistry.register(
	LocalFilesystemBlueprintBundleProvider.ID,
	LocalFilesystemBlueprintBundleProvider
);

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', LocalFilesystemBlueprintBundleProvider );

/**
 * Create upload adapter for blueprint bundle.
 *
 * Blueprint bundles are server-side files that need to be copied via PHP REST API.
 * The adapter encapsulates this provider-specific upload logic.
 *
 * @param {string} staticPath Path to upload files to.
 * @param {string} providerId Provider instance ID.
 * @return {Object} Upload adapter with upload() method.
 */
function createUploadAdapter( staticPath, providerId ) {
	return {
		/**
		 * Upload a blueprint bundle file.
		 *
		 * For blueprint bundles, the "file" parameter is expected to be a Blob
		 * containing metadata about the source file path, since the actual file
		 * exists on the server and needs to be copied via PHP.
		 *
		 * @param {string}    key     Storage key (destination file path).
		 * @param {File|Blob} file    File or Blob (may contain source path metadata).
		 * @param {Object}    options Upload options.
		 * @return {Promise<Object>} Upload result.
		 */
		async upload( key, file, options = {} ) {
			// For blueprint bundles, we need the source path from metadata
			// The key is the destination path
			const sourcePath = options.sourcePath || options.filePath;

			if ( ! sourcePath ) {
				return {
					success: false,
					error: 'Blueprint bundle source path is required',
				};
			}

			try {
				// Trigger PHP action hook for blueprint bundle upload
				const response = await apiFetch( {
					path: '/aether/site-exporter/local-storage/trigger-blueprint-bundle-upload',
					method: 'POST',
					data: {
						instance_id: providerId,
						source_path: sourcePath,
						destination_path: staticPath,
						context: options.metadata || {},
					},
				} );

				if ( ! response.success ) {
					return {
						success: false,
						error:
							response.message ||
							'Failed to trigger blueprint bundle upload',
					};
				}

				return { success: true };
			} catch ( error ) {
				return {
					success: false,
					error: error.message || 'Blueprint bundle upload failed',
				};
			}
		},
	};
}

/**
 * Register storage service creation filter.
 *
 * This filter intercepts storage service creation for local-filesystem-blueprint-bundle
 * provider instances. Each instance gets its own StorageService with an adapter
 * configured for its specific settings, achieving true instance isolation.
 */
addFilter(
	'aether.storage.service.create',
	'aether/local-filesystem-blueprint-bundle',
	( service, staticPath, config, providerId ) => {
		// Only handle this provider type
		if ( ! providerId?.startsWith( 'local-filesystem-blueprint-bundle' ) ) {
			return service;
		}

		// Create instance-specific upload adapter
		const uploadAdapter = createUploadAdapter( staticPath, providerId );

		// Return new StorageService with the adapter
		return new StorageService( staticPath, config, uploadAdapter );
	},
	10
);
