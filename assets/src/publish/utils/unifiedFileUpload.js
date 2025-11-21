/**
 * Unified File Upload System
 *
 * Provides a unified action-based system for all file uploads (blueprint bundles,
 * static HTML, static assets, etc.) to storage providers.
 *
 * @package
 */

import { doAction, applyFilters, hasAction } from '@wordpress/hooks';

/**
 * File types supported by the unified upload system.
 *
 * @type {Object<string, string>}
 */
export const FILE_TYPES = {
	BLUEPRINT_BUNDLE: 'blueprint-bundle',
	STATIC_HTML: 'static-html',
	STATIC_ASSET: 'static-asset',
};

/**
 * Create file context for unified upload action.
 *
 * @param {Object}   options                    Options object.
 * @param {string}   options.fileType          File type (FILE_TYPES.*).
 * @param {string}   options.filePath         File path (for blueprint bundles) or URL (for static files).
 * @param {Blob|string|null} options.fileContent File content (Blob, string, or null to fetch).
 * @param {string}   options.contentType       Content type (MIME type).
 * @param {string}   options.storageKey       Storage key/path for the file.
 * @param {string}   options.providerId       Provider instance ID.
 * @param {Object}   options.metadata         Additional metadata (siteUrl, staticSiteUrl, blueprintData, etc.).
 * @return {Object} File context object.
 */
export function createFileContext( {
	fileType,
	filePath,
	fileContent = null,
	contentType,
	storageKey,
	providerId,
	metadata = {},
} ) {
	return {
		fileType,
		filePath,
		fileContent,
		contentType,
		storageKey,
		providerId,
		metadata,
	};
}

/**
 * Execute action handlers asynchronously.
 *
 * WordPress hooks don't have built-in async action support. We use a promise
 * tracking system where handlers register their promises on the context object.
 *
 * @param {string} actionName Action name.
 * @param {Object} fileContext File context object (first arg).
 * @return {Promise<void>}
 */
async function doActionAsync( actionName, fileContext ) {
	// Initialize promise array on fileContext
	if ( ! fileContext._uploadPromises ) {
		fileContext._uploadPromises = [];
	}

	// Fire the action - handlers will add their promises to fileContext._uploadPromises
	doAction( actionName, fileContext );

	// Wait for all registered promises to complete
	const promises = fileContext._uploadPromises || [];
	if ( promises.length > 0 ) {
		await Promise.all( promises );
	}

	// Clean up
	delete fileContext._uploadPromises;
}

/**
 * Upload a file using the unified action system.
 *
 * Fires `aether.file.upload` action which providers hook into to handle the upload.
 *
 * @param {Object} fileContext File context object from createFileContext().
 * @return {Promise<Object>} Upload result with success status and optional error.
 */
export async function uploadFile( fileContext ) {
	// Allow filtering of file context before upload
	const filteredContext = applyFilters(
		'aether.file.upload.context',
		fileContext,
		fileContext.providerId
	);

	// Fire unified upload action asynchronously
	// Providers hook into this action to handle the actual upload
	await doActionAsync( 'aether.file.upload', filteredContext );

	// Return result (providers should update context with result)
	// For now, we assume success if no error is thrown
	// In the future, providers could set fileContext.result
	return {
		success: true,
		fileContext: filteredContext,
	};
}

/**
 * Upload multiple files to multiple providers.
 *
 * @param {Array<Object>} fileContexts Array of file context objects.
 * @param {Array<string>} providerIds  Array of provider instance IDs.
 * @return {Promise<Array<Object>>} Array of upload results.
 */
export async function uploadFiles( fileContexts, providerIds ) {
	const results = [];

	for ( const fileContext of fileContexts ) {
		for ( const providerId of providerIds ) {
			const contextWithProvider = {
				...fileContext,
				providerId,
			};

			try {
				const result = await uploadFile( contextWithProvider );
				results.push( {
					...result,
					providerId,
				} );
			} catch ( error ) {
				results.push( {
					success: false,
					error: error.message || 'Upload failed',
					providerId,
					fileContext: contextWithProvider,
				} );
			}
		}
	}

	return results;
}

