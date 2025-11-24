/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Handles blueprint bundle uploads to local filesystem.
 * Single responsibility: copy blueprint bundle file to destinationPath.
 *
 */

import { addAction, doAction } from '@wordpress/hooks';
import apiFetch from '@aether/utils/api';
import { debug, debugWarn } from '@aether/utils/debug';
import { LocalFilesystemBlueprintBundleProvider } from './LocalFilesystemBlueprintBundleProvider';
import ProviderRegistry from '../registry/ProviderRegistry';

// Register provider class in JavaScript registry
ProviderRegistry.register(
	LocalFilesystemBlueprintBundleProvider.ID,
	LocalFilesystemBlueprintBundleProvider
);

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', LocalFilesystemBlueprintBundleProvider );

// Track upload results per provider instance
const uploadResults = {};

// Track processed files per provider to avoid duplicate processing
// Value can be: true (processed), or a Promise (in progress)
const processedFiles = new Map();

/**
 * Handle unified file upload for blueprint bundle provider.
 *
 * @param {Object} fileContext Unified file context from aether.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload( fileContext ) {
	const {
		providerId,
		filePath,
		destinationPath,
		metadata = {},
	} = fileContext;

	// Debug logging
	debug( '[LocalFilesystemBlueprintBundle] handleUnifiedFileUpload called:', {
		providerId,
		filePath,
		destinationPath,
	} );

	// Only handle requests for local-filesystem providers that support blueprint_bundle
	if ( ! providerId || ! providerId.startsWith( 'local-filesystem' ) ) {
		debug(
			'[LocalFilesystemBlueprintBundle] Skipping - not a local-filesystem provider:',
			providerId
		);
		return;
	}

	// Check if this is a blueprint bundle provider by checking provider ID
	// Since providers have single responsibility, we can check the provider ID directly
	if (
		! providerId ||
		! providerId.startsWith( 'local-filesystem-blueprint-bundle' )
	) {
		debug(
			'[LocalFilesystemBlueprintBundle] Skipping - not a blueprint bundle provider:',
			providerId
		);
		return;
	}

	// Create a unique key for this file+provider combination
	const fileKey = `${ providerId }:${ filePath || destinationPath }`;

	// Check if file is already processed or in progress
	const existingEntry = processedFiles.get( fileKey );
	if ( existingEntry === true ) {
		// Already processed successfully
		debug(
			'[LocalFilesystemBlueprintBundle] Skipping - file already processed:',
			fileKey
		);
		return;
	}
	if ( existingEntry instanceof Promise ) {
		// Already in progress - wait for it to complete
		debug(
			'[LocalFilesystemBlueprintBundle] File already in progress, waiting:',
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
				'[LocalFilesystemBlueprintBundle] File processed by other handler:',
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

			// Blueprint bundle is a file path, not content
			if ( ! filePath ) {
				throw new Error( 'Blueprint bundle file path is required' );
			}

			// Trigger PHP action hook for blueprint bundle upload
			// Use destinationPath from abstraction layer
			const response = await apiFetch( {
				path: '/aether/site-exporter/local-storage/trigger-blueprint-bundle-upload',
				method: 'POST',
				data: {
					instance_id: providerId,
					source_path: filePath,
					destination_path: destinationPath,
					context: metadata,
				},
			} );

			if ( ! response.success ) {
				fileContext.result = {
					success: false,
					error:
						response.message ||
						'Failed to trigger blueprint bundle upload',
				};
				throw new Error(
					response.message ||
						'Failed to trigger blueprint bundle upload'
				);
			}

			uploadResults[ providerId ].filesUploaded++;
			debug(
				`Uploaded blueprint bundle ${ filePath } to ${ destinationPath } for provider ${ providerId }`
			);
			// Set result on fileContext for unified upload system
			fileContext.result = { success: true };
		} catch ( error ) {
			uploadResults[ providerId ].errors.push( {
				url: filePath,
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
 * Handles blueprint bundle uploads via the unified aether.file.upload action.
 */
addAction(
	'aether.file.upload',
	'aether/local-filesystem-blueprint-bundle',
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
