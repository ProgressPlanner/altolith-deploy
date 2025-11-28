/**
 * Local Filesystem Provider
 *
 * Unified provider for local file storage. Handles all output types
 * (static site, blueprint, media offload, etc.) based on user configuration.
 *
 * Uses the StorageService adapter pattern for provider instance isolation.
 */

import { addFilter, doAction } from '@wordpress/hooks';
import { uploadFile as uploadFileToFilesystem } from '../services/filesystemAdapter';
import { StorageService } from '../services/storageService';
import { LocalFilesystemProvider } from './LocalFilesystemProvider';
import ProviderRegistry from '../registry/ProviderRegistry';

// Register provider class in JavaScript registry
ProviderRegistry.register(
	LocalFilesystemProvider.ID,
	LocalFilesystemProvider
);

// Also trigger the hook for any listeners
doAction( 'altolith.providers.register', LocalFilesystemProvider );

/**
 * Create upload adapter for local filesystem.
 *
 * The adapter encapsulates the provider-specific upload logic while
 * allowing the StorageService to handle common concerns (manifest, URL building, etc.).
 *
 * @param {string} basePath Base path to upload files to.
 * @return {Object} Upload adapter with upload() method.
 */
function createUploadAdapter( basePath ) {
	return {
		/**
		 * Upload a file to local filesystem.
		 *
		 * @param {string}    key     Storage key (file path relative to basePath).
		 * @param {File|Blob} file    File to upload.
		 * @param {Object}    options Upload options (contentType, etc.).
		 * @return {Promise<Object>} Upload result.
		 */
		async upload( key, file, options = {} ) {
			return uploadFileToFilesystem( basePath, key, file, options );
		},
	};
}

/**
 * Register storage service creation filter.
 *
 * This filter intercepts storage service creation for local-filesystem
 * provider instances. Each instance gets its own StorageService with an adapter
 * configured for its specific basePath, achieving true instance isolation.
 */
addFilter(
	'altolith.storage.service.create',
	'altolith/local-filesystem',
	( service, basePath, config, providerId ) => {
		// Only handle this provider type
		if ( ! providerId?.startsWith( 'local-filesystem' ) ) {
			return service;
		}

		// Skip if this is an old provider ID format (to avoid conflicts during migration)
		if (
			providerId?.startsWith( 'local-filesystem-static-site' ) ||
			providerId?.startsWith( 'local-filesystem-blueprint-bundle' )
		) {
			return service;
		}

		// Create instance-specific upload adapter using THIS instance's basePath
		const uploadAdapter = createUploadAdapter( basePath );

		// Return new StorageService with the adapter
		// This StorageService is isolated to this specific provider instance
		return new StorageService( basePath, config, uploadAdapter );
	},
	10
);
