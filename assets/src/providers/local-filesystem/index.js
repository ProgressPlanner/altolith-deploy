/**
 * Local Filesystem Provider Registration
 *
 * This file registers hooks for the LocalFilesystem provider implementation.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */

import { addFilter, addAction } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { LocalFilesystemProvider } from './LocalFilesystemProvider';
import { uploadFile as uploadFileToStorage } from '../../utils/filesystemAdapter';
import { debug, debugWarn } from '../../utils/debug';
import { processHtml } from '../../publish/utils/htmlProcessor';
import { FILE_TYPES } from '../../publish/utils/unifiedFileUpload';

// Create provider instance for hook registration
const provider = new LocalFilesystemProvider();

// Track upload results per provider instance
const uploadResults = {};

// Track processed files per provider to avoid duplicate processing
const processedFiles = new Map();

/**
 * Handle unified file upload for a provider instance.
 *
 * @param {Object} fileContext Unified file context from aether.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload( fileContext ) {
	const { fileType, providerId, filePath, fileContent, contentType, storageKey, metadata = {} } = fileContext;

	// Only handle requests for local-filesystem providers
	if ( ! providerId || ! providerId.startsWith( 'local-filesystem' ) ) {
		return;
	}

	// Create a unique key for this file+provider combination
	const fileKey = `${ providerId }:${ filePath || storageKey }`;

	// Skip if already processed
	if ( processedFiles.has( fileKey ) ) {
		return;
	}
	processedFiles.set( fileKey, true );

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
		let providerPublicUrl = metadata.staticSiteUrl || null;

		// Fetch provider config
		try {
			const providerResponse = await apiFetch( {
				path: `/aether/site-exporter/providers/${ providerId }`,
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
					if ( config.public_url ) {
						providerPublicUrl = config.public_url;
					}
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
				throw new Error(
					response.message || 'Failed to trigger blueprint bundle upload'
				);
			}

			uploadResults[ providerId ].filesUploaded++;
			debug(
				`Uploaded blueprint bundle ${ filePath } to ${ exportPath } for provider ${ providerId }`
			);
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
		} else if ( filePath && ( filePath.startsWith( 'http://' ) || filePath.startsWith( 'https://' ) ) ) {
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
			return;
		}

		// Process HTML content - rewrite URLs for static site
		const isHtml = fileType === FILE_TYPES.STATIC_HTML ||
			( contentType && contentType.includes( 'text/html' ) );

		if ( isHtml && metadata.siteUrl && providerPublicUrl ) {
			try {
				const htmlText = await fileBlob.text();
				const processedHtml = processHtml(
					htmlText,
					filePath,
					metadata.siteUrl,
					providerPublicUrl
				);
				fileBlob = new Blob( [ processedHtml ], { type: 'text/html' } );
			} catch ( htmlError ) {
				debugWarn(
					`Failed to process HTML for ${ filePath }:`,
					htmlError
				);
			}
		}

		// Determine storage key
		let finalStorageKey = storageKey;
		if ( ! finalStorageKey ) {
			// Derive from filePath
			if ( filePath.startsWith( 'http://' ) || filePath.startsWith( 'https://' ) ) {
				try {
					const urlObj = new URL( filePath );
					finalStorageKey = urlObj.pathname;
					if ( urlObj.search ) {
						finalStorageKey = finalStorageKey.replace( urlObj.search, '' );
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
			finalStorageKey = finalStorageKey.replace( /\/+$/, '' ) + '/index.html';
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
				jobId: '',
			}
		);

		if ( uploadResult.success ) {
			uploadResults[ providerId ].filesUploaded++;
			debug(
				`Uploaded ${ finalStorageKey } to ${ staticPath } for provider ${ providerId }`
			);
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
	}
}

/**
 * Process a single file for a provider instance (legacy - for backward compatibility).
 *
 * @param {Object} fileContext File context object.
 * @param {string} providerId  Provider instance ID.
 * @return {Promise<void>}
 */
async function processFileForProvider( fileContext, providerId ) {
	// Create a unique key for this file+provider combination
	const fileKey = `${ providerId }:${ fileContext.url || fileContext.path }`;

	// Skip if already processed (prevents duplicate processing from general + provider-specific actions)
	if ( processedFiles.has( fileKey ) ) {
		return;
	}
	processedFiles.set( fileKey, true );

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
		// Fetch provider config to get static_files_path and public_url
		let staticPath = 'static/';
		let providerPublicUrl = fileContext.staticSiteUrl || null;
		try {
			const providerResponse = await apiFetch( {
				path: `/aether/site-exporter/providers/${ providerId }`,
			} );
			if ( providerResponse.success && providerResponse.config ) {
				staticPath =
					providerResponse.config.static_files_path || 'static/';
				// Ensure path doesn't have trailing slash
				staticPath = staticPath.replace( /\/$/, '' );
				// Use provider-specific public_url for URL rewriting
				if ( providerResponse.config.public_url ) {
					providerPublicUrl = providerResponse.config.public_url;
				}
			}
		} catch ( configError ) {
			debugWarn(
				`Failed to fetch provider config for ${ providerId }:`,
				configError
			);
		}

		// Get file content as Blob
		let fileBlob = null;
		if ( fileContext.content ) {
			// Content is provided - convert to Blob
			if ( typeof fileContext.content === 'string' ) {
				fileBlob = new Blob( [ fileContext.content ], {
					type: fileContext.contentType || 'text/html',
				} );
			} else if ( fileContext.content instanceof Blob ) {
				fileBlob = fileContext.content;
			}
		} else {
			// Content not provided - fetch from URL
			try {
				const response = await fetch( fileContext.url, {
					method: 'GET',
					credentials: 'omit',
				} );
				if ( response.ok ) {
					fileBlob = await response.blob();
				} else {
					throw new Error(
						`Failed to fetch ${ fileContext.url }: HTTP ${ response.status }`
					);
				}
			} catch ( fetchError ) {
				uploadResults[ providerId ].errors.push( {
					url: fileContext.url,
					error: fetchError.message,
				} );
				return;
			}
		}

		if ( ! fileBlob ) {
			uploadResults[ providerId ].errors.push( {
				url: fileContext.url,
				error: 'Failed to get file content',
			} );
			return;
		}

		// Process HTML content - rewrite URLs for static site
		const contentType = fileContext.contentType || fileBlob.type || '';
		const isHtml =
			contentType.includes( 'text/html' ) ||
			( ! contentType && ! /\.[a-z0-9]+$/i.test( fileContext.url ) );

		if ( isHtml && fileContext.siteUrl && providerPublicUrl ) {
			try {
				const htmlText = await fileBlob.text();
				const processedHtml = processHtml(
					htmlText,
					fileContext.url,
					fileContext.siteUrl,
					providerPublicUrl
				);
				fileBlob = new Blob( [ processedHtml ], { type: 'text/html' } );
			} catch ( htmlError ) {
				debugWarn(
					`Failed to process HTML for ${ fileContext.url }:`,
					htmlError
				);
			}
		}

		// Determine storage key from path or URL
		let storageKey = fileContext.path || fileContext.url;
		if (
			storageKey.startsWith( 'http://' ) ||
			storageKey.startsWith( 'https://' )
		) {
			// Extract path from URL
			try {
				const urlObj = new URL( storageKey );
				storageKey = urlObj.pathname;
				// Remove query string if present
				if ( urlObj.search ) {
					storageKey = storageKey.replace( urlObj.search, '' );
				}
			} catch ( urlError ) {
				// If URL parsing fails, use the path as-is
				debugWarn( `Failed to parse URL ${ storageKey }:`, urlError );
			}
		}

		// Remove leading slash and ensure relative path
		storageKey = storageKey.replace( /^\/+/, '' );

		// Handle directory paths (add index.html)
		// For HTML content without file extension, use directory-style paths
		const hasFileExtension = /\.[a-zA-Z0-9]+$/.test( storageKey );
		if ( storageKey === '' ) {
			// Homepage
			storageKey = 'index.html';
		} else if ( storageKey.endsWith( '/' ) ) {
			// Path with trailing slash
			storageKey = storageKey.replace( /\/+$/, '' ) + '/index.html';
		} else if ( ! hasFileExtension ) {
			// HTML page without extension (e.g., sample-page -> sample-page/index.html)
			storageKey = storageKey + '/index.html';
		}

		// Upload file via filesystemAdapter
		const uploadResult = await uploadFileToStorage(
			staticPath,
			storageKey,
			fileBlob,
			{
				contentType: fileContext.contentType || 'text/html',
				jobId: '',
			}
		);

		if ( uploadResult.success ) {
			uploadResults[ providerId ].filesUploaded++;
			debug(
				`Uploaded ${ storageKey } to ${ staticPath } for provider ${ providerId }`
			);
		} else {
			uploadResults[ providerId ].errors.push( {
				url: fileContext.url,
				path: storageKey,
				error: uploadResult.error || 'Upload failed',
			} );
			debugWarn(
				`Failed to upload ${ storageKey } for provider ${ providerId }:`,
				uploadResult.error
			);
		}
	} catch ( error ) {
		uploadResults[ providerId ].errors.push( {
			url: fileContext.url,
			error: error.message || 'Unknown error',
		} );
		debugWarn(
			`Error processing file for provider ${ providerId }:`,
			error
		);
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
		const uploadPromise = handleUnifiedFileUpload( fileContext );
		fileContext._uploadPromises.push( uploadPromise );
	},
	10
);

/**
 * Register upload handler hook (deprecated - kept for backward compatibility).
 *
 * @deprecated Use aether.file.upload action instead.
 * This filter is kept temporarily for backward compatibility but will be removed.
 */
addFilter(
	'aether.provider.upload',
	'aether/local-filesystem',
	( handler, providerId ) => {
		// Only handle requests for local-filesystem providers (including instances)
		if ( ! providerId || ! providerId.startsWith( 'local-filesystem' ) ) {
			return handler; // Return existing handler or null
		}

		// Return upload handler function (legacy support)
		return async ( filePath, fileName, context ) => {
			// Convert legacy filter call to unified action
			const instanceId = context?.instanceId || providerId;
			const exportPath =
				context?.exportPath || 'blueprint-bundle/bundle.zip';

			// Create unified file context
			const fileContext = {
				fileType: FILE_TYPES.BLUEPRINT_BUNDLE,
				filePath,
				fileContent: null,
				contentType: 'application/zip',
				storageKey: exportPath,
				providerId: instanceId,
				metadata: context || {},
			};

			// Use unified upload handler
			await handleUnifiedFileUpload( fileContext );

			// Return legacy format for compatibility
			return {
				success: true,
				message: 'Blueprint bundle uploaded successfully',
				path: exportPath,
			};
		};
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

/**
 * Register static site file processing action hook (legacy - for backward compatibility).
 *
 * @deprecated Use aether.file.upload action instead.
 * This action is kept temporarily for backward compatibility.
 */
addAction(
	'aether.staticSite.file.process',
	'aether/local-filesystem',
	async ( fileContext ) => {
		// Only process if this is a local-filesystem provider
		const providers = fileContext.providers || [];
		const localFilesystemProviders = providers.filter( ( id ) =>
			id.startsWith( 'local-filesystem' )
		);

		if ( localFilesystemProviders.length === 0 ) {
			return;
		}

		// Convert legacy action to unified file context
		for ( const providerId of localFilesystemProviders ) {
			const unifiedContext = {
				fileType: FILE_TYPES.STATIC_HTML,
				filePath: fileContext.url || fileContext.path,
				fileContent: fileContext.content || null,
				contentType: fileContext.contentType || 'text/html',
				storageKey: fileContext.path || fileContext.url,
				providerId,
				metadata: {
					siteUrl: fileContext.siteUrl,
					staticSiteUrl: fileContext.staticSiteUrl,
					blueprintData: fileContext.blueprintData,
				},
			};

			await handleUnifiedFileUpload( unifiedContext );
		}
	},
	10
);

/**
 * Register results filter to report upload statistics.
 *
 * Providers use this filter to report their upload results.
 */
addFilter(
	'aether.staticSite.upload.results',
	'aether/local-filesystem',
	( results, providers ) => {
		// Merge our tracked results into the results object
		const localFilesystemProviders = providers.filter( ( id ) =>
			id.startsWith( 'local-filesystem' )
		);

		for ( const providerId of localFilesystemProviders ) {
			if ( uploadResults[ providerId ] ) {
				// Merge results, preserving existing data
				results[ providerId ] = {
					...results[ providerId ],
					...uploadResults[ providerId ],
				};
			}
		}

		return results;
	},
	10
);
