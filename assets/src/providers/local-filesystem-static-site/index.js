/**
 * Local Filesystem Static Site Provider
 *
 * Handles static file uploads (HTML, CSS, JS) to local filesystem.
 * Uses the StorageService adapter pattern for true provider instance isolation.
 *
 * Each provider instance gets its own StorageService via the 'aether.storage.service.create'
 * filter, ensuring complete isolation between instances (even of the same provider type).
 *
 */

import { addFilter, doAction } from '@wordpress/hooks';
import { uploadFile as uploadFileToFilesystem } from '../services/filesystemAdapter';
import { StorageService } from '../services/storageService';
import { LocalFilesystemStaticSiteProvider } from './LocalFilesystemStaticSiteProvider';
import ProviderRegistry from '../registry/ProviderRegistry';

// Register provider class in JavaScript registry
ProviderRegistry.register(
	LocalFilesystemStaticSiteProvider.ID,
	LocalFilesystemStaticSiteProvider
);

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', LocalFilesystemStaticSiteProvider );

/**
 * Create upload adapter for local filesystem static site.
 *
 * The adapter encapsulates the provider-specific upload logic while
 * allowing the StorageService to handle common concerns (manifest, URL building, etc.).
 *
 * @param {string} staticPath Path to upload files to.
 * @return {Object} Upload adapter with upload() method.
 */
function createUploadAdapter( staticPath ) {
	return {
		/**
		 * Upload a file to local filesystem.
		 *
		 * @param {string}    key     Storage key (file path).
		 * @param {File|Blob} file    File to upload.
		 * @param {Object}    options Upload options (contentType, etc.).
		 * @return {Promise<Object>} Upload result.
		 */
		async upload( key, file, options = {} ) {
			return uploadFileToFilesystem( staticPath, key, file, options );
		},
	};
}

/**
 * Register storage service creation filter.
 *
 * This filter intercepts storage service creation for local-filesystem-static-site
 * provider instances. Each instance gets its own StorageService with an adapter
 * configured for its specific staticPath, achieving true instance isolation.
 *
 * The filter receives the full provider instance ID (e.g., 'local-filesystem-static-site:uuid'),
 * allowing it to configure instance-specific settings.
 */
addFilter(
	'aether.storage.service.create',
	'aether/local-filesystem-static-site',
	( service, staticPath, config, providerId ) => {
		// Only handle this provider type
		if ( ! providerId?.startsWith( 'local-filesystem-static-site' ) ) {
			return service;
		}

		// Create instance-specific upload adapter using THIS instance's staticPath
		const uploadAdapter = createUploadAdapter( staticPath );

		// Return new StorageService with the adapter
		// This StorageService is isolated to this specific provider instance
		return new StorageService( staticPath, config, uploadAdapter );
	},
	10
);
