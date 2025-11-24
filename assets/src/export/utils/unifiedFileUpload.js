/**
 * Unified File Upload System
 *
 * Provides a unified action-based system for all file uploads (blueprint bundles,
 * static HTML, static assets, etc.) to storage providers.
 *
 */

import { doActionAsync, applyFilters } from '@wordpress/hooks';
import { processHtml } from '@aether/export/utils/htmlProcessor';
import apiFetch from '@wordpress/api-fetch';
import { debugWarn, debug } from '@aether/utils/debug';

/**
 * File types supported by the unified upload system.
 * Internal use only - providers should not know about file types.
 *
 * @type {Object<string, string>}
 */
const FILE_TYPES = {
	BLUEPRINT_BUNDLE: 'blueprint-bundle',
	STATIC_HTML: 'static-html',
	STATIC_ASSET: 'static-asset',
};

// Export for use in export steps (not providers)
export { FILE_TYPES };

/**
 * Create file context for unified upload action.
 *
 * @param {Object}           options             Options object.
 * @param {string}           options.fileType    File type (FILE_TYPES.*).
 * @param {string}           options.filePath    File path (for blueprint bundles) or URL (for static files).
 * @param {Blob|string|null} options.fileContent File content (Blob, string, or null to fetch).
 * @param {string}           options.contentType Content type (MIME type).
 * @param {string}           options.storageKey  Storage key/path for the file.
 * @param {string}           options.providerId  Provider instance ID.
 * @param {Object}           options.metadata    Additional metadata (siteUrl, staticSiteUrl, blueprintData, etc.).
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
 * Get provider's static site URL (public URL).
 *
 * Fetches provider config via API if metadata.staticSiteUrl is not available.
 *
 * @param {string} providerId Provider instance ID.
 * @param {Object} metadata   File context metadata.
 * @return {Promise<string|null>} Provider's static site URL or null if unavailable.
 */
async function getProviderStaticSiteUrl( providerId, metadata ) {
	// Use metadata.staticSiteUrl if available
	if ( metadata.staticSiteUrl ) {
		return metadata.staticSiteUrl;
	}

	// Fetch provider config to get public_url
	try {
		const providerResponse = await apiFetch( {
			path: `/aether/site-exporter/providers/${ providerId }/config`,
		} );

		if (
			providerResponse.success &&
			providerResponse.config &&
			providerResponse.config.public_url
		) {
			return providerResponse.config.public_url;
		}
	} catch ( error ) {
		debugWarn(
			`Failed to fetch provider config for ${ providerId }:`,
			error
		);
	}

	return null;
}

/**
 * Get provider configuration.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<Object>} Provider configuration object.
 */
async function getProviderConfig( providerId ) {
	try {
		const providerResponse = await apiFetch( {
			path: `/aether/site-exporter/providers/${ providerId }/config`,
		} );

		if ( providerResponse.success && providerResponse.config ) {
			return providerResponse.config;
		}
	} catch ( error ) {
		debugWarn(
			`Failed to fetch provider config for ${ providerId }:`,
			error
		);
	}

	return {};
}

/**
 * Determine destination path based on file type and provider config.
 *
 * @param {string} fileType File type (FILE_TYPES.*).
 * @param {Object} config   Provider configuration.
 * @return {string} Destination path.
 */
function determineDestinationPath( fileType, config ) {
	if ( fileType === FILE_TYPES.BLUEPRINT_BUNDLE ) {
		return config.export_path || 'blueprint-bundle/bundle.zip';
	}
	// For static files (HTML and assets)
	const staticPath = config.static_files_path || 'static/';
	return staticPath.replace( /\/$/, '' );
}

/**
 * Upload a file using the unified action system.
 *
 * Fires `aether.file.upload` action which providers hook into to handle the upload.
 * Providers should set `fileContext.result = { success: true/false, error?: string }`
 * to communicate the upload result.
 *
 * @param {Object} fileContext File context object from createFileContext().
 * @return {Promise<Object>} Upload result with success status and optional error.
 */
export async function uploadFile( fileContext ) {
	const {
		fileType,
		filePath,
		fileContent,
		contentType,
		providerId,
		metadata = {},
	} = fileContext;

	// Fetch provider config to determine destination path
	const config = await getProviderConfig( providerId );
	const destinationPath = determineDestinationPath( fileType, config );

	// Process HTML content per-provider-instance before upload
	// Each provider has a different staticSiteUrl, so HTML needs to be processed separately
	const isHtml =
		fileType === FILE_TYPES.STATIC_HTML ||
		( contentType && contentType.includes( 'text/html' ) );

	let processedContent = fileContent;

	if ( isHtml && metadata.siteUrl ) {
		try {
			// Get provider's staticSiteUrl
			const staticSiteUrl = await getProviderStaticSiteUrl(
				providerId,
				metadata
			);

			if ( staticSiteUrl ) {
				// Extract HTML content from fileContent (handle both Blob and string)
				let htmlText;
				if ( typeof fileContent === 'string' ) {
					htmlText = fileContent;
				} else if ( fileContent instanceof Blob ) {
					htmlText = await fileContent.text();
				} else {
					debugWarn(
						'Cannot process HTML: fileContent is not a string or Blob'
					);
				}

				if ( htmlText ) {
					// Apply HTML filter hook (for consistency with Path 1)
					const filteredHtml = applyFilters(
						'aether.export.step.uploadStaticSiteFiles.html.process',
						htmlText,
						filePath,
						metadata.siteUrl,
						staticSiteUrl,
						providerId
					);

					// Process HTML with URL rewriting
					const processedHtml = processHtml(
						filteredHtml,
						filePath,
						metadata.siteUrl,
						staticSiteUrl
					);

					// Convert processed HTML back to Blob with correct content type
					processedContent = new Blob( [ processedHtml ], {
						type: 'text/html',
					} );
				}
			} else {
				debugWarn(
					`Cannot process HTML for ${ providerId }: staticSiteUrl not available`
				);
			}
		} catch ( error ) {
			debugWarn(
				`Failed to process HTML for ${ filePath || 'unknown' }:`,
				error
			);
			// Continue with original content on error
		}
	}

	// Create context for provider - remove fileType, add destinationPath
	// Providers should not know about file types, only where to upload
	const providerContext = {
		filePath, // For blueprint bundles
		fileContent: processedContent, // For static files (processed HTML/CSS/JS)
		destinationPath, // Where to upload (determined by abstraction layer)
		storageKey: fileContext.storageKey,
		contentType,
		providerId,
		metadata,
		// Note: fileType is NOT included - providers don't need to know
	};

	// Allow filtering of file context before upload
	const filteredContext = applyFilters(
		'aether.file.upload.context',
		providerContext,
		providerId
	);

	// Debug logging
	debug( '[UnifiedUpload] Firing aether.file.upload action:', {
		fileType, // Internal use only for logging
		providerId,
		storageKey: filteredContext.storageKey,
		destinationPath: filteredContext.destinationPath,
		hasFileContent: !! filteredContext.fileContent,
		hasFilePath: !! filteredContext.filePath,
		contentType,
	} );

	// Fire unified upload action asynchronously
	// Providers hook into this action to handle the actual upload
	await doActionAsync( 'aether.file.upload', filteredContext );

	// Debug logging after action
	debug( '[UnifiedUpload] Upload action completed:', {
		providerId,
		storageKey: filteredContext.storageKey,
		hasResult: !! filteredContext.result,
		result: filteredContext.result,
	} );

	// Check if provider set a result on the context
	if ( filteredContext.result ) {
		return {
			...filteredContext.result,
			fileContext: filteredContext,
		};
	}

	// Default to success if no result was set (backwards compatibility)
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
