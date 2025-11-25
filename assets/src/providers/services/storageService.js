/**
 * Storage Service
 *
 * Storage service for local filesystem operations.
 * All operations go through REST API endpoints.
 *
 * Supports adapter pattern for provider-specific upload implementations.
 * Each provider instance can inject its own upload adapter via the
 * 'aether.storage.service.create' filter, achieving true provider instance isolation.
 *
 */

import {
	deleteFile,
	batchDelete as batchDeleteFromAdapter,
	getObjectUrl,
	downloadFile as downloadFileFromAdapter,
	uploadFile as uploadFileToFilesystem,
} from './filesystemAdapter';

/**
 * Storage Service class.
 */
export class StorageService {
	/**
	 * Constructor.
	 *
	 * @param {string} staticPath    Path for static files storage.
	 * @param {Object} config        Optional configuration.
	 * @param {Object} uploadAdapter Optional upload adapter with upload() method.
	 */
	constructor( staticPath, config = {}, uploadAdapter = null ) {
		this.staticPath = staticPath;
		this.config = config;
		this.baseUrl = config.public_url || config.base_url || '';
		this.providerId = config.provider_id || null;
		this.uploadAdapter = uploadAdapter;
	}

	/**
	 * Upload a file to storage.
	 *
	 * Uses the upload adapter if provided, otherwise falls back to filesystem adapter.
	 * This enables provider-specific upload implementations while keeping common logic
	 * (manifest, dedup, etc.) in the StorageService.
	 *
	 * @param {string}    key      Object key/path in storage.
	 * @param {File|Blob} file     File to upload.
	 * @param {Object}    metadata Optional metadata (contentType, cacheControl, onProgress).
	 * @return {Promise<Object>} Result array with 'success' and optional 'url', 'error'.
	 */
	async upload( key, file, metadata = {} ) {
		if ( ! ( file instanceof File || file instanceof Blob ) ) {
			return {
				success: false,
				error: 'File must be a File or Blob object',
			};
		}

		const contentType = metadata.contentType || file.type;

		try {
			let result;

			// Use upload adapter if provided (provider-specific upload)
			if (
				this.uploadAdapter &&
				typeof this.uploadAdapter.upload === 'function'
			) {
				result = await this.uploadAdapter.upload( key, file, {
					contentType,
					cacheControl: metadata.cacheControl || '',
					onProgress: metadata.onProgress || null,
				} );
			} else {
				// Default: use filesystem adapter directly
				result = await uploadFileToFilesystem(
					this.staticPath,
					key,
					file,
					{
						contentType,
						cacheControl: metadata.cacheControl || '',
						onProgress: metadata.onProgress || null,
					}
				);
			}

			if ( ! result.success ) {
				return result;
			}

			// Build public URL
			const url = this.getUrl( key );

			return {
				success: true,
				url,
			};
		} catch ( error ) {
			return {
				success: false,
				error: error.message || 'Upload failed',
			};
		}
	}

	/**
	 * Delete a file from storage.
	 *
	 * @param {string} key Object key/path.
	 * @return {Promise<Object>} Result array with 'success' and optional 'error'.
	 */
	async delete( key ) {
		return deleteFile( this.staticPath, key );
	}

	/**
	 * Copy an object from source to destination within storage.
	 *
	 * @return {Promise<Object>} Result array with 'success' and optional 'error'.
	 */
	async copy() {
		return { success: true };
	}

	/**
	 * Check if a file exists in storage.
	 *
	 * @return {Promise<boolean>} True if exists, false otherwise.
	 */
	async exists() {
		// Not implemented for local filesystem - not needed for static site generation
		return false;
	}

	/**
	 * List objects in storage.
	 *
	 * @return {Promise<Object>} Result array with 'success', 'objects' array, and optional 'error'.
	 */
	async listObjects() {
		return { success: true, objects: [] };
	}

	/**
	 * Get public URL for an object.
	 *
	 * @param {string} key Object key/path.
	 * @return {string} Public URL.
	 */
	getUrl( key ) {
		// Use baseUrl if available
		if ( this.baseUrl ) {
			return getObjectUrl( this.staticPath, this.baseUrl, key );
		}
		// Return key as fallback (relative path)
		return key;
	}

	/**
	 * Batch copy multiple objects in storage.
	 *
	 * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
	 */
	async batchCopy() {
		return { success: true };
	}

	/**
	 * Batch delete multiple objects from storage.
	 *
	 * @param {Array} keys Array of object keys to delete.
	 * @return {Promise<Object>} Result with success and optional error.
	 */
	async batchDelete( keys ) {
		return batchDeleteFromAdapter( this.staticPath, keys );
	}

	/**
	 * Download manifest file from storage.
	 *
	 * @return {Promise<Blob|null>} Manifest blob or null if not found.
	 */
	async downloadManifest() {
		// Use provider-specific manifest filename to ensure isolation between providers
		const manifestKey = this.providerId
			? `file-manifest-${ this.providerId }.json`
			: 'file-manifest.json';

		try {
			const blob = await downloadFileFromAdapter(
				this.staticPath,
				manifestKey
			);
			return blob;
		} catch ( error ) {
			// Return null if file doesn't exist (404) or other error.
			return null;
		}
	}

	/**
	 * Upload manifest file to storage.
	 *
	 * @param {Blob} blob Manifest blob to upload.
	 * @return {Promise<Object>} Result with success and optional error.
	 */
	async uploadManifest( blob ) {
		// Use provider-specific manifest filename to ensure isolation between providers
		const manifestKey = this.providerId
			? `file-manifest-${ this.providerId }.json`
			: 'file-manifest.json';

		const result = await this.upload( manifestKey, blob, {
			contentType: 'application/json',
		} );

		return result;
	}
}
