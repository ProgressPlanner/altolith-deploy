/**
 * Local Filesystem Provider Registration
 *
 * This file registers hooks for the LocalFilesystem provider implementation.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 */

import { addFilter, addAction, doAction } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { LocalFilesystemProvider } from './LocalFilesystemProvider';
import { uploadFile as uploadFileToStorage } from '@aether/utils/filesystemAdapter';
import { debug, debugWarn } from '@aether/utils/debug';
import { FILE_TYPES } from '@aether/export/utils/unifiedFileUpload';
import ProviderRegistry from '../registry/ProviderRegistry';

// Create provider instance for hook registration
const provider = new LocalFilesystemProvider();

// eslint-disable-next-line no-console
console.log(
	'LocalFilesystemProvider: Registering provider...',
	provider.getId()
);

// Register provider in JavaScript registry
ProviderRegistry.register( provider.getId(), provider );

// eslint-disable-next-line no-console
console.log( 'LocalFilesystemProvider: Provider registered successfully' );

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', provider );

// Track upload results per provider instance
const uploadResults = {};

/**
 * Handle unified file upload for a provider instance.
 *
 * @param {Object} fileContext Unified file context from aether.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload( fileContext ) {
	const {
		fileType,
		providerId,
		filePath,
		fileContent,
		contentType,
		storageKey,
		metadata = {},
	} = fileContext;

	// Only handle requests for local-filesystem providers
	if ( ! providerId || ! providerId.startsWith( 'local-filesystem' ) ) {
		return;
	}

	// Initialize results tracking for this provider if needed
	if ( ! uploadResults[ providerId ] ) {
		uploadResults[ providerId ] = {
			filesProcessed: 0,
			filesUploaded: 0,
			errors: [],
		};
	}

	uploadResults[ providerId ].filesProcessed++;

	try {
		let staticPath = 'static/';
		let exportPath = 'blueprint-bundle/bundle.zip';

		// Fetch provider config
		try {
			const providerResponse = await apiFetch( {
				path: `/aether/site-exporter/providers/${ providerId }/config`,
			} );
			if ( providerResponse.success && providerResponse.config ) {
				const config = providerResponse.config;
				if ( fileType === FILE_TYPES.BLUEPRINT_BUNDLE ) {
					// For blueprint bundles, use export_path
					if ( config.export_path ) {
						exportPath = config.export_path;
					}
				} else {
					// For static files, use static_files_path
					staticPath = config.static_files_path || 'static/';
					staticPath = staticPath.replace( /\/$/, '' );
				}
			}
		} catch ( configError ) {
			debugWarn(
				`Failed to fetch provider config for ${ providerId }:`,
				configError
			);
		}

		// Handle blueprint bundle upload
		if ( fileType === FILE_TYPES.BLUEPRINT_BUNDLE ) {
			// Blueprint bundle is a file path, not content
			if ( ! filePath ) {
				throw new Error( 'Blueprint bundle file path is required' );
			}

			// Trigger PHP action hook for blueprint bundle upload
			const response = await apiFetch( {
				path: '/aether/site-exporter/local-storage/trigger-blueprint-bundle-upload',
				method: 'POST',
				data: {
					instance_id: providerId,
					source_path: filePath,
					destination_path: exportPath,
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
				`Uploaded blueprint bundle ${ filePath } to ${ exportPath } for provider ${ providerId }`
			);
			// Set result on fileContext for unified upload system
			fileContext.result = { success: true };
			return;
		}

		// Handle static file uploads (HTML and assets)
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
		} else if (
			filePath &&
			( filePath.startsWith( 'http://' ) ||
				filePath.startsWith( 'https://' ) )
		) {
			// Fetch from URL if content not provided
			try {
				const response = await fetch( filePath, {
					method: 'GET',
					credentials: 'omit',
				} );
				if ( response.ok ) {
					fileBlob = await response.blob();
				} else {
					throw new Error(
						`Failed to fetch ${ filePath }: HTTP ${ response.status }`
					);
				}
			} catch ( fetchError ) {
				uploadResults[ providerId ].errors.push( {
					url: filePath,
					error: fetchError.message,
				} );
				// Set result on fileContext for unified upload system
				fileContext.result = {
					success: false,
					error: fetchError.message,
				};
				return;
			}
		} else {
			throw new Error( 'File content or valid URL is required' );
		}

		if ( ! fileBlob ) {
			uploadResults[ providerId ].errors.push( {
				url: filePath,
				error: 'Failed to get file content',
			} );
			// Set result on fileContext for unified upload system
			fileContext.result = {
				success: false,
				error: 'Failed to get file content',
			};
			return;
		}

		// HTML is already processed by the base layer (unifiedFileUpload.js)
		// Provider receives pre-processed HTML in fileContent

		// Check if file is HTML for path handling
		const isHtml =
			fileType === FILE_TYPES.STATIC_HTML ||
			( contentType && contentType.includes( 'text/html' ) );

		// Determine storage key
		let finalStorageKey = storageKey;
		if ( ! finalStorageKey ) {
			// Derive from filePath
			if (
				filePath.startsWith( 'http://' ) ||
				filePath.startsWith( 'https://' )
			) {
				try {
					const urlObj = new URL( filePath );
					finalStorageKey = urlObj.pathname;
					if ( urlObj.search ) {
						finalStorageKey = finalStorageKey.replace(
							urlObj.search,
							''
						);
					}
				} catch ( urlError ) {
					debugWarn( `Failed to parse URL ${ filePath }:`, urlError );
					finalStorageKey = filePath;
				}
			} else {
				finalStorageKey = filePath;
			}
		}

		// Remove leading slash and ensure relative path
		finalStorageKey = finalStorageKey.replace( /^\/+/, '' );

		// Handle directory paths (add index.html)
		const hasFileExtension = /\.[a-zA-Z0-9]+$/.test( finalStorageKey );
		if ( finalStorageKey === '' ) {
			finalStorageKey = 'index.html';
		} else if ( finalStorageKey.endsWith( '/' ) ) {
			finalStorageKey =
				finalStorageKey.replace( /\/+$/, '' ) + '/index.html';
		} else if ( ! hasFileExtension && isHtml ) {
			finalStorageKey = finalStorageKey + '/index.html';
		}

		// Upload file via filesystemAdapter
		const uploadResult = await uploadFileToStorage(
			staticPath,
			finalStorageKey,
			fileBlob,
			{
				contentType: contentType || 'text/html',
			}
		);

		if ( uploadResult.success ) {
			uploadResults[ providerId ].filesUploaded++;
			debug(
				`Uploaded ${ finalStorageKey } to ${ staticPath } for provider ${ providerId }`
			);
			// Set result on fileContext for unified upload system
			fileContext.result = { success: true };
		} else {
			uploadResults[ providerId ].errors.push( {
				url: filePath,
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
	}
}

/**
 * Register unified file upload action hook.
 *
 * Handles all file uploads (blueprint bundles, static HTML, static assets)
 * via the unified aether.file.upload action.
 */
addAction(
	'aether.file.upload',
	'aether/local-filesystem',
	( fileContext ) => {
		// Initialize promise array on fileContext if not exists
		if ( ! fileContext._uploadPromises ) {
			fileContext._uploadPromises = [];
		}

		// Start upload and add promise to context
		// Add error handler to prevent unhandled promise rejections
		const uploadPromise = handleUnifiedFileUpload( fileContext ).catch(
			( error ) => {
				debugWarn( 'Provider upload failed:', error?.message || error );
				// Set error result on fileContext
				fileContext.result = {
					success: false,
					error: error?.message || 'Upload failed',
				};
			}
		);
		fileContext._uploadPromises.push( uploadPromise );
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
