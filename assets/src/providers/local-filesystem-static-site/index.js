/**
 * Local Filesystem Static Site Provider
 *
 * Handles static file uploads (HTML, CSS, JS) to local filesystem.
 * Single responsibility: upload static files to destinationPath.
 *
 */

import { addAction, doAction } from '@wordpress/hooks';
import { uploadFile as uploadFileToStorage } from '@aether/utils/filesystemAdapter';
import { debug, debugWarn } from '@aether/utils/debug';
import { LocalFilesystemStaticSiteProvider } from './LocalFilesystemStaticSiteProvider';
import ProviderRegistry from '../registry/ProviderRegistry';

// Register provider class in JavaScript registry
ProviderRegistry.register(
	LocalFilesystemStaticSiteProvider.ID,
	LocalFilesystemStaticSiteProvider
);

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', LocalFilesystemStaticSiteProvider );

// Track upload results per provider instance
const uploadResults = {};

// Track processed files per provider to avoid duplicate processing
// Value can be: true (processed), or a Promise (in progress)
const processedFiles = new Map();

/**
 * Handle unified file upload for static site provider.
 *
 * @param {Object} fileContext Unified file context from aether.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload( fileContext ) {
	const {
		providerId,
		fileContent,
		contentType,
		storageKey,
		destinationPath,
	} = fileContext;

	// Debug logging
	debug( '[LocalFilesystemStaticSite] handleUnifiedFileUpload called:', {
		providerId,
		storageKey,
		destinationPath,
		hasFileContent: !! fileContent,
		contentType,
	} );

	// Only handle requests for local-filesystem providers that support static_site
	if ( ! providerId || ! providerId.startsWith( 'local-filesystem' ) ) {
		debug(
			'[LocalFilesystemStaticSite] Skipping - not a local-filesystem provider:',
			providerId
		);
		return;
	}

	// Check if this is a static site provider by checking provider ID
	// Since providers have single responsibility, we can check the provider ID directly
	if (
		! providerId ||
		! providerId.startsWith( 'local-filesystem-static-site' )
	) {
		debug(
			'[LocalFilesystemStaticSite] Skipping - not a static site provider:',
			providerId
		);
		return;
	}

	// Create a unique key for this file+provider combination
	const fileKey = `${ providerId }:${ storageKey }`;

	// Check if file is already processed or in progress
	const existingEntry = processedFiles.get( fileKey );
	if ( existingEntry === true ) {
		// Already processed successfully
		debug(
			'[LocalFilesystemStaticSite] Skipping - file already processed:',
			fileKey
		);
		return;
	}
	if ( existingEntry instanceof Promise ) {
		// Already in progress - wait for it to complete
		debug(
			'[LocalFilesystemStaticSite] File already in progress, waiting:',
			fileKey
		);
		try {
			await existingEntry;
		} catch ( error ) {
			// If the other handler failed, we can try again
			// Remove the failed promise so we can retry
			if ( processedFiles.get( fileKey ) === existingEntry ) {
				processedFiles.delete( fileKey );
			}
		}
		// Check again after waiting
		if ( processedFiles.get( fileKey ) === true ) {
			debug(
				'[LocalFilesystemStaticSite] File processed by other handler:',
				fileKey
			);
			return;
		}
	}

	// Mark as in progress by storing a promise
	// This promise will be resolved/rejected when processing completes
	const processingPromise = ( async () => {
		try {
			// Initialize results tracking for this provider if needed
			if ( ! uploadResults[ providerId ] ) {
				uploadResults[ providerId ] = {
					filesProcessed: 0,
					filesUploaded: 0,
					errors: [],
				};
			}

			uploadResults[ providerId ].filesProcessed++;

			// Get file content as Blob
			let fileBlob = null;
			if ( fileContent ) {
				if ( typeof fileContent === 'string' ) {
					fileBlob = new Blob( [ fileContent ], {
						type: contentType || 'text/html',
					} );
				} else if ( fileContent instanceof Blob ) {
					fileBlob = fileContent;
				}
			} else {
				throw new Error(
					'File content is required for static site files'
				);
			}

			if ( ! fileBlob ) {
				throw new Error( 'Failed to get file content' );
			}

			// Determine storage key
			let finalStorageKey = storageKey;
			if ( ! finalStorageKey ) {
				throw new Error( 'Storage key is required' );
			}

			// Remove leading slash and ensure relative path
			finalStorageKey = finalStorageKey.replace( /^\/+/, '' );

			// Handle directory paths (add index.html)
			const hasFileExtension = /\.[a-zA-Z0-9]+$/.test( finalStorageKey );
			const isHtml = contentType && contentType.includes( 'text/html' );
			if ( finalStorageKey === '' ) {
				finalStorageKey = 'index.html';
			} else if ( finalStorageKey.endsWith( '/' ) ) {
				finalStorageKey =
					finalStorageKey.replace( /\/+$/, '' ) + '/index.html';
			} else if ( ! hasFileExtension && isHtml ) {
				finalStorageKey = finalStorageKey + '/index.html';
			}

			// Upload file via filesystemAdapter
			// Use destinationPath from abstraction layer
			const uploadResult = await uploadFileToStorage(
				destinationPath,
				finalStorageKey,
				fileBlob,
				{
					contentType: contentType || 'text/html',
				}
			);

			if ( uploadResult.success ) {
				uploadResults[ providerId ].filesUploaded++;
				debug(
					`Uploaded ${ finalStorageKey } to ${ destinationPath } for provider ${ providerId }`
				);
				// Set result on fileContext for unified upload system
				fileContext.result = { success: true };
			} else {
				uploadResults[ providerId ].errors.push( {
					path: finalStorageKey,
					error: uploadResult.error || 'Upload failed',
				} );
				debugWarn(
					`Failed to upload ${ finalStorageKey } for provider ${ providerId }:`,
					uploadResult.error
				);
				// Set result on fileContext for unified upload system
				fileContext.result = {
					success: false,
					error: uploadResult.error || 'Upload failed',
				};
			}
		} catch ( error ) {
			uploadResults[ providerId ].errors.push( {
				error: error.message || 'Unknown error',
			} );
			debugWarn(
				`Error processing file for provider ${ providerId }:`,
				error
			);
			// Set result on fileContext for unified upload system
			fileContext.result = {
				success: false,
				error: error.message || 'Unknown error',
			};
			// Re-throw so the promise wrapper can handle it
			throw error;
		}
		// Mark as processed after successful completion
		processedFiles.set( fileKey, true );
	} )().catch( ( error ) => {
		// Remove from map on error so it can be retried
		if ( processedFiles.get( fileKey ) === processingPromise ) {
			processedFiles.delete( fileKey );
		}
		throw error;
	} );

	// Store the promise so other handlers can wait for it
	processedFiles.set( fileKey, processingPromise );

	// Wait for processing to complete
	await processingPromise;
}

/**
 * Register unified file upload action hook.
 *
 * Handles static file uploads (HTML, CSS, JS) via the unified aether.file.upload action.
 */
addAction(
	'aether.file.upload',
	'aether/local-filesystem-static-site',
	( fileContext ) => {
		// Initialize promise array on fileContext if not exists
		if ( ! fileContext._uploadPromises ) {
			fileContext._uploadPromises = [];
		}

		// Start upload and add promise to context
		const uploadPromise = handleUnifiedFileUpload( fileContext );
		fileContext._uploadPromises.push( uploadPromise );
	},
	10
);
