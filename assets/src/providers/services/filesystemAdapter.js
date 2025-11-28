/**
 * Filesystem Adapter
 *
 * Adapter for local filesystem storage operations via REST API.
 * Replaces workerEndpointClient.js for local storage.
 *
 */

import apiFetch from '@altolith/utils/api';
import { validateFile } from './fileValidation';

/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
function createSuccessResponse( data = null, message = null ) {
	const response = {
		success: true,
		data,
	};

	// Add message to data if provided
	if ( message && typeof data === 'object' && data !== null ) {
		response.data = { ...data, message };
	} else if ( message ) {
		response.data = { message };
	}

	return response;
}

/**
 * Create an error response.
 *
 * @param {string|Error} error  Error message or Error object.
 * @param {Array}        errors Optional array of multiple errors.
 * @return {Object} Standardized error response.
 */
function createErrorResponse( error, errors = null ) {
	const errorMessage =
		typeof error === 'string' ? error : error?.message || 'Unknown error';

	const response = {
		success: false,
		error: errorMessage,
	};

	if ( errors && Array.isArray( errors ) && errors.length > 0 ) {
		response.errors = errors;
	}

	return response;
}

/**
 * Upload a file to local filesystem via REST API.
 *
 * @param {string}    staticPath Base path for static files.
 * @param {string}    key        File path/key relative to static path.
 * @param {File|Blob} file       File to upload.
 * @param {Object}    options    Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result with success and optional url/error.
 */
export async function uploadFile( staticPath, key, file, options = {} ) {
	try {
		// Validate key parameter
		if ( ! key || key === '' ) {
			const error = new Error(
				`Upload key is empty. File: ${
					file?.name || 'unknown'
				}, staticPath: ${ staticPath }`
			);
			return createErrorResponse( error.message );
		}

		// Client-side validation for instant feedback
		const validation = validateFile( file, key );
		if ( ! validation.valid ) {
			return createErrorResponse( validation.error );
		}

		// Create FormData for file upload
		const formData = new FormData();
		formData.append( 'file', file );
		formData.append( 'key', key );
		formData.append( 'static_path', staticPath );

		if ( options.contentType ) {
			formData.append( 'content_type', options.contentType );
		}

		let response;
		try {
			response = await apiFetch( {
				path: '/altolith/deploy/local-storage/upload',
				method: 'POST',
				body: formData,
			} );
		} catch ( apiError ) {
			// WordPress REST API throws errors for WP_Error responses
			// Extract detailed error information if available
			const errorMessage =
				apiError?.message ||
				apiError?.data?.message ||
				apiError?.code ||
				'Upload failed';

			// Include additional error details if available (destination, source, etc.)
			const errorDetails = [];
			if ( apiError?.data?.destination ) {
				errorDetails.push(
					`Destination: ${ apiError.data.destination }`
				);
			}
			if ( apiError?.data?.source ) {
				errorDetails.push( `Source: ${ apiError.data.source }` );
			}
			if ( apiError?.data?.system_error ) {
				errorDetails.push( `System: ${ apiError.data.system_error }` );
			}

			const fullErrorMessage =
				errorDetails.length > 0
					? `${ errorMessage } (${ errorDetails.join( ', ' ) })`
					: errorMessage;

			return createErrorResponse( fullErrorMessage );
		}

		if ( ! response.success ) {
			// Extract detailed error information from response
			const errorMessage =
				response.error || response.message || 'Upload failed';
			const errorDetails = [];

			if ( response.destination ) {
				errorDetails.push( `Destination: ${ response.destination }` );
			}
			if ( response.source ) {
				errorDetails.push( `Source: ${ response.source }` );
			}
			if ( response.system_error ) {
				errorDetails.push( `System: ${ response.system_error }` );
			}

			const fullErrorMessage =
				errorDetails.length > 0
					? `${ errorMessage } (${ errorDetails.join( ', ' ) })`
					: errorMessage;

			return createErrorResponse( fullErrorMessage );
		}

		// Call progress callback if provided (100% since we don't have chunked upload yet)
		if ( options.onProgress ) {
			options.onProgress( file.size, file.size, 100 );
		}

		return createSuccessResponse();
	} catch ( error ) {
		return createErrorResponse( error.message || 'Upload failed' );
	}
}

/**
 * Delete a file from local filesystem.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to delete.
 * @return {Promise<Object>} Delete result.
 */
export async function deleteFile( staticPath, key ) {
	try {
		const response = await apiFetch( {
			path: '/altolith/deploy/local-storage/delete',
			method: 'DELETE',
			data: {
				key,
				static_path: staticPath,
			},
		} );

		if ( ! response.success ) {
			return createErrorResponse( response.error || 'Delete failed' );
		}

		return createSuccessResponse();
	} catch ( error ) {
		return createErrorResponse( error.message || 'Delete failed' );
	}
}

/**
 * Copy a file (not needed for local filesystem - files are uploaded directly).
 *
 * @return {Promise<Object>} Copy result.
 */
export async function copyFile() {
	// Not implemented for local filesystem
	// Files are uploaded directly to their final location
	return createSuccessResponse();
}

/**
 * List objects in a directory (not needed for static site generation).
 *
 * @return {Promise<Object>} List result.
 */
export async function listObjects() {
	// Not implemented - not needed for static site generation
	// Static site generator doesn't need to list existing files
	return createSuccessResponse( { objects: [] } );
}

/**
 * Batch delete files.
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  keys       Array of file paths/keys to delete.
 * @return {Promise<Object>} Batch delete result.
 */
export async function batchDelete( staticPath, keys ) {
	try {
		const response = await apiFetch( {
			path: '/altolith/deploy/local-storage/batch-delete',
			method: 'DELETE',
			data: {
				keys,
				static_path: staticPath,
			},
		} );

		if ( ! response.success ) {
			return createErrorResponse(
				response.error || 'Batch delete failed'
			);
		}

		return createSuccessResponse();
	} catch ( error ) {
		return createErrorResponse( error.message || 'Batch delete failed' );
	}
}

/**
 * Download a file (manifest).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to download.
 * @return {Promise<Blob|null>} File blob or null if not found.
 */
export async function downloadFile( staticPath, key ) {
	try {
		const response = await apiFetch( {
			path: `/altolith/deploy/local-storage/download?key=${ encodeURIComponent(
				key
			) }&static_path=${ encodeURIComponent( staticPath ) }`,
			method: 'GET',
			parse: false, // Get raw response
		} );

		if ( ! response.ok ) {
			return null;
		}

		return await response.blob();
	} catch ( error ) {
		return null;
	}
}

/**
 * Get public URL for a file.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} baseUrl    Base URL for static files.
 * @param {string} key        File path/key.
 * @return {string} Public URL.
 */
export function getObjectUrl( staticPath, baseUrl, key ) {
	// For local filesystem, construct URL from baseUrl and key
	// Remove any trailing slash from baseUrl
	const cleanBaseUrl = baseUrl.replace( /\/$/, '' );

	// Remove leading slash from key if present
	const cleanKey = key.replace( /^\//, '' );

	return `${ cleanBaseUrl }/${ cleanKey }`;
}
