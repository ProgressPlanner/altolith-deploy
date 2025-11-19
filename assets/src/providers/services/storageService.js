/**
 * Storage Service
 *
 * Storage service for local filesystem operations.
 * All operations go through REST API endpoints.
 *
 * @package
 */

import {
	uploadFile,
	deleteFile,
	copyFile,
	listObjects as listObjectsFromAdapter,
	batchCopy as batchCopyFromAdapter,
	batchDelete as batchDeleteFromAdapter,
	getObjectUrl,
	downloadFile as downloadFileFromAdapter,
} from '../../utils/filesystemAdapter';

/**
 * Storage Service class.
 */
export class StorageService {
	/**
	 * Constructor.
	 *
	 * @param {string} staticPath Path for static files storage.
	 * @param {string} jobId      Job ID for this export (optional, defaults to empty string).
	 * @param {Object} config     Optional configuration.
	 */
	constructor( staticPath, jobId = '', config = {} ) {
		this.staticPath = staticPath;
		this.jobId = jobId;
		this.config = config;
		this.baseUrl = config.public_url || config.base_url || '';
		this.providerId = config.provider_id || null;
	}

	/**
	 * Add provider prefix to a storage key.
	 *
	 * Ensures isolated storage paths for each provider.
	 * Example: 'static/index.html' → 'cloudflare-r2/static/index.html'
	 *
	 * @param {string} key Original storage key.
	 * @return {string} Prefixed storage key.
	 */
	_prefixKey( key ) {
		if ( ! this.providerId ) {
			return key;
		}
		// Don't double-prefix
		if ( key.startsWith( this.providerId + '/' ) ) {
			return key;
		}
		return `${ this.providerId }/${ key }`;
	}

	/**
	 * Upload a file to storage.
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

		const options = {
			contentType: metadata.contentType || file.type,
			cacheControl: metadata.cacheControl || '',
			onProgress: metadata.onProgress || null,
			jobId: this.jobId,
		};

		const prefixedKey = this._prefixKey( key );
		const result = await uploadFile(
			this.staticPath,
			prefixedKey,
			file,
			options
		);

		if ( ! result.success ) {
			return result;
		}

		// Build public URL.
		const url = this.getUrl( key );

		return {
			success: true,
			url,
		};
	}

	/**
	 * Delete a file from storage.
	 *
	 * @param {string} key Object key/path.
	 * @return {Promise<Object>} Result array with 'success' and optional 'error'.
	 */
	async delete( key ) {
		const prefixedKey = this._prefixKey( key );
		return deleteFile( this.staticPath, prefixedKey, {
			jobId: this.jobId,
		} );
	}

	/**
	 * Copy an object from source to destination within storage.
	 *
	 * @param {string} sourceKey Source object key.
	 * @param {string} destKey   Destination object key.
	 * @return {Promise<Object>} Result array with 'success' and optional 'error'.
	 */
	async copy( sourceKey, destKey ) {
		const prefixedSourceKey = this._prefixKey( sourceKey );
		const prefixedDestKey = this._prefixKey( destKey );
		return copyFile( this.staticPath, prefixedSourceKey, prefixedDestKey );
	}

	/**
	 * Check if a file exists in storage.
	 *
	 * @param {string} key Object key/path.
	 * @return {Promise<boolean>} True if exists, false otherwise.
	 */
	async exists( key ) {
		// Key parameter kept for API consistency, but not used for local filesystem
		// eslint-disable-next-line no-unused-vars
		const _unused = key;
		// Not implemented for local filesystem - not needed for static site generation
		return false;
	}

	/**
	 * List objects in storage.
	 *
	 * @param {string} prefix Optional prefix to filter objects.
	 * @param {number} limit  Maximum number of objects to return.
	 * @return {Promise<Object>} Result array with 'success', 'objects' array, and optional 'error'.
	 */
	async listObjects( prefix = '', limit = 1000 ) {
		const prefixedPrefix = this._prefixKey( prefix );
		return listObjectsFromAdapter( this.staticPath, prefixedPrefix, limit );
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
	 * @param {Array} operations Array of {source, dest} objects.
	 * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
	 */
	async batchCopy( operations ) {
		return batchCopyFromAdapter( this.staticPath, operations );
	}

	/**
	 * Batch delete multiple objects from storage.
	 *
	 * @param {Array} keys Array of object keys to delete.
	 * @return {Promise<Object>} Result with success and optional error.
	 */
	async batchDelete( keys ) {
		return batchDeleteFromAdapter( this.staticPath, keys, {
			jobId: this.jobId,
		} );
	}

	/**
	 * Download manifest file from storage.
	 *
	 * @return {Promise<Blob|null>} Manifest blob or null if not found.
	 */
	async downloadManifest() {
		const manifestKey = 'file-manifest.json';
		const prefixedManifestKey = this._prefixKey( manifestKey );

		try {
			const blob = await downloadFileFromAdapter(
				this.staticPath,
				prefixedManifestKey,
				{ jobId: this.jobId }
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
		const manifestKey = 'file-manifest.json';

		const result = await this.upload( manifestKey, blob, {
			contentType: 'application/json',
		} );

		return result;
	}

	/**
	 * Test connection to storage service.
	 *
	 * @return {Promise<Object>} Result array with 'success' and optional 'message', 'error'.
	 */
	async testConnection() {
		// For local filesystem, always return success
		return {
			success: true,
			message: 'Local filesystem storage is ready.',
		};
	}
}
