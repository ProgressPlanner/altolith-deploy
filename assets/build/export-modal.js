/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 98:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $Z: () => (/* binding */ FILE_TYPES),
/* harmony export */   QM: () => (/* binding */ uploadFile),
/* harmony export */   sM: () => (/* binding */ createFileContext)
/* harmony export */ });
/* unused harmony export uploadFiles */
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _aether_export_utils_htmlProcessor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(864);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__);
/**
 * Unified File Upload System
 *
 * Provides a unified action-based system for all file uploads (blueprint bundles,
 * static HTML, static assets, etc.) to storage providers.
 *
 */





/**
 * File types supported by the unified upload system.
 * Internal use only - providers should not know about file types.
 *
 * @type {Object<string, string>}
 */
const FILE_TYPES = {
  BLUEPRINT_BUNDLE: 'blueprint-bundle',
  STATIC_HTML: 'static-html',
  STATIC_ASSET: 'static-asset'
};

// Export for use in export steps (not providers)


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
function createFileContext({
  fileType,
  filePath,
  fileContent = null,
  contentType,
  storageKey,
  providerId,
  metadata = {}
}) {
  return {
    fileType,
    filePath,
    fileContent,
    contentType,
    storageKey,
    providerId,
    metadata
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
async function getProviderStaticSiteUrl(providerId, metadata) {
  // Use metadata.staticSiteUrl if available
  if (metadata.staticSiteUrl) {
    return metadata.staticSiteUrl;
  }

  // Fetch provider config to get public_url
  try {
    const providerResponse = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default()({
      path: `/aether/site-exporter/providers/${providerId}/config`
    });
    if (providerResponse.success && providerResponse.config && providerResponse.config.public_url) {
      return providerResponse.config.public_url;
    }
  } catch (error) {}
  return null;
}

/**
 * Get provider configuration.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<Object>} Provider configuration object.
 */
async function getProviderConfig(providerId) {
  try {
    const providerResponse = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default()({
      path: `/aether/site-exporter/providers/${providerId}/config`
    });
    if (providerResponse.success && providerResponse.config) {
      return providerResponse.config;
    }
  } catch (error) {}
  return {};
}

/**
 * Determine destination path based on file type and provider config.
 *
 * @param {string} fileType File type (FILE_TYPES.*).
 * @param {Object} config   Provider configuration.
 * @return {string} Destination path.
 */
function determineDestinationPath(fileType, config) {
  if (fileType === FILE_TYPES.BLUEPRINT_BUNDLE) {
    return config.export_path || 'blueprint-bundle/bundle.zip';
  }
  // For static files (HTML and assets)
  const staticPath = config.static_files_path || 'static/';
  return staticPath.replace(/\/$/, '');
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
async function uploadFile(fileContext) {
  const {
    fileType,
    filePath,
    fileContent,
    contentType,
    providerId,
    metadata = {}
  } = fileContext;

  // Fetch provider config to determine destination path
  const config = await getProviderConfig(providerId);
  const destinationPath = determineDestinationPath(fileType, config);

  // Process HTML content per-provider-instance before upload
  // Each provider has a different staticSiteUrl, so HTML needs to be processed separately
  const isHtml = fileType === FILE_TYPES.STATIC_HTML || contentType && contentType.includes('text/html');
  let processedContent = fileContent;
  if (isHtml && metadata.siteUrl) {
    try {
      // Get provider's staticSiteUrl
      const staticSiteUrl = await getProviderStaticSiteUrl(providerId, metadata);
      if (staticSiteUrl) {
        // Extract HTML content from fileContent (handle both Blob and string)
        let htmlText;
        if (typeof fileContent === 'string') {
          htmlText = fileContent;
        } else if (fileContent instanceof Blob) {
          htmlText = await fileContent.text();
        }
        if (htmlText) {
          // Apply HTML filter hook (for consistency with Path 1)
          const filteredHtml = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.export.step.uploadStaticSiteFiles.html.process', htmlText, filePath, metadata.siteUrl, staticSiteUrl, providerId);

          // Process HTML with URL rewriting
          const processedHtml = (0,_aether_export_utils_htmlProcessor__WEBPACK_IMPORTED_MODULE_1__/* .processHtml */ .t)(filteredHtml, filePath, metadata.siteUrl, staticSiteUrl);

          // Convert processed HTML back to Blob with correct content type
          processedContent = new Blob([processedHtml], {
            type: 'text/html'
          });
        }
      }
    } catch (error) {
      // Continue with original content on error
    }
  }

  // Create context for provider - remove fileType, add destinationPath
  // Providers should not know about file types, only where to upload
  const providerContext = {
    filePath,
    // For blueprint bundles
    fileContent: processedContent,
    // For static files (processed HTML/CSS/JS)
    destinationPath,
    // Where to upload (determined by abstraction layer)
    storageKey: fileContext.storageKey,
    contentType,
    providerId,
    metadata
    // Note: fileType is NOT included - providers don't need to know
  };

  // Allow filtering of file context before upload
  const filteredContext = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.file.upload.context', providerContext, providerId);

  // Fire unified upload action asynchronously
  // Providers hook into this action to handle the actual upload
  await (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.doActionAsync)('aether.file.upload', filteredContext);

  // Check if provider set a result on the context
  if (filteredContext.result) {
    return {
      ...filteredContext.result,
      fileContext: filteredContext
    };
  }

  // Default to success if no result was set (backwards compatibility)
  return {
    success: true,
    fileContext: filteredContext
  };
}

/**
 * Upload multiple files to multiple providers.
 *
 * @param {Array<Object>} fileContexts Array of file context objects.
 * @param {Array<string>} providerIds  Array of provider instance IDs.
 * @return {Promise<Array<Object>>} Array of upload results.
 */
async function uploadFiles(fileContexts, providerIds) {
  const results = [];
  for (const fileContext of fileContexts) {
    for (const providerId of providerIds) {
      const contextWithProvider = {
        ...fileContext,
        providerId
      };
      try {
        const result = await uploadFile(contextWithProvider);
        results.push({
          ...result,
          providerId
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message || 'Upload failed',
          providerId,
          fileContext: contextWithProvider
        });
      }
    }
  }
  return results;
}

/***/ }),

/***/ 380:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  StorageService: () => (/* binding */ StorageService)
});

// EXTERNAL MODULE: ./assets/src/utils/api.js
var api = __webpack_require__(444);
;// ./assets/src/utils/fileValidation.js
/**
 * File Validation Utilities
 *
 * Client-side file validation for uploads.
 * Provides instant feedback before hitting the server.
 * PHP still validates as security backstop.
 */

// Maximum file size: 100MB
const MAX_FILE_SIZE = (/* unused pure expression or super */ null && (100 * 1024 * 1024));

// Allowed file extensions
const ALLOWED_EXTENSIONS = (/* unused pure expression or super */ null && (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
// Images
'css', 'js', 'json',
// Web assets
'woff', 'woff2', 'ttf', 'eot',
// Fonts
'pdf', 'txt', 'md',
// Documents
'zip', 'tar', 'gz',
// Archives
'html', 'htm', 'xml' // Markup
]));

// Expected MIME types for extensions
const MIME_TYPE_MAP = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  // Web assets
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  // Fonts
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  eot: 'application/vnd.ms-fontobject',
  // Documents
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  // Archives
  zip: 'application/zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  // Markup
  html: 'text/html',
  htm: 'text/html',
  xml: 'application/xml'
};

/**
 * Format file size in human-readable format.
 *
 * @param {number} bytes File size in bytes.
 * @return {string} Human-readable size (e.g., "1.5 MB").
 */
function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename.
 *
 * @param {string} filename File name.
 * @return {string} Extension (lowercase, without dot).
 */
function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Validate file size.
 *
 * @param {File|Blob} file File to validate.
 * @return {Object} Validation result with valid boolean and error message.
 */
function validateFileSize(file) {
  if (!file || !file.size) {
    return {
      valid: true
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }
  return {
    valid: true
  };
}

/**
 * Validate file extension.
 *
 * @param {string} filename File name or key.
 * @return {Object} Validation result with valid boolean and error message.
 */
function validateFileExtension(filename) {
  const extension = getFileExtension(filename);

  // Allow files without extension (e.g., directory index files)
  if (extension === '') {
    return {
      valid: true
    };
  }
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type "${extension}" is not allowed for upload. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}.`
    };
  }
  return {
    valid: true
  };
}

/**
 * Validate file MIME type.
 *
 * @param {File|Blob} file     File to validate.
 * @param {string}    filename File name (to check extension).
 * @return {Object} Validation result with valid boolean and error message.
 */
function validateFileMimeType(file, filename) {
  if (!file || !file.type) {
    // No MIME type available (e.g., Blob without type)
    // Skip validation - PHP will handle it
    return {
      valid: true
    };
  }
  const extension = getFileExtension(filename);
  const expectedMimeType = MIME_TYPE_MAP[extension];

  // If we don't have an expected MIME type, allow it
  // (PHP will do final validation)
  if (!expectedMimeType) {
    return {
      valid: true
    };
  }

  // Check if MIME type matches expected
  if (file.type !== expectedMimeType) {
    // Allow common misidentifications
    const mimeType = file.type;

    // JavaScript files often misidentified
    if (extension === 'js' && (mimeType === 'text/plain' || mimeType === 'text/x-java' || mimeType === 'application/x-javascript' || mimeType === 'text/javascript')) {
      return {
        valid: true
      };
    }

    // Text-based files often detected as text/plain
    if (['css', 'html', 'htm', 'xml', 'txt', 'md'].includes(extension) && mimeType === 'text/plain') {
      return {
        valid: true
      };
    }
    return {
      valid: false,
      error: `File MIME type "${mimeType}" doesn't match expected type "${expectedMimeType}" for .${extension} files.`
    };
  }
  return {
    valid: true
  };
}

/**
 * Validate file completely (size, extension, MIME type).
 *
 * @param {File|Blob} file File to validate.
 * @param {string}    key  File key/name.
 * @return {Object} Validation result with valid boolean and error message.
 */
function fileValidation_validateFile(file, key) {
  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate file extension
  const extensionValidation = validateFileExtension(key);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  // Validate MIME type
  const mimeValidation = validateFileMimeType(file, key);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }
  return {
    valid: true
  };
}
;// ./assets/src/providers/services/filesystemAdapter.js
/**
 * Filesystem Adapter
 *
 * Adapter for local filesystem storage operations via REST API.
 * Replaces workerEndpointClient.js for local storage.
 *
 */




/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
function createSuccessResponse(data = null, message = null) {
  const response = {
    success: true,
    data
  };

  // Add message to data if provided
  if (message && typeof data === 'object' && data !== null) {
    response.data = {
      ...data,
      message
    };
  } else if (message) {
    response.data = {
      message
    };
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
function createErrorResponse(error, errors = null) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
  const response = {
    success: false,
    error: errorMessage
  };
  if (errors && Array.isArray(errors) && errors.length > 0) {
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
async function uploadFile(staticPath, key, file, options = {}) {
  try {
    // Validate key parameter
    if (!key || key === '') {
      const error = new Error(`Upload key is empty. File: ${file?.name || 'unknown'}, staticPath: ${staticPath}`);
      return createErrorResponse(error.message);
    }

    // Client-side validation for instant feedback
    const validation = validateFile(file, key);
    if (!validation.valid) {
      return createErrorResponse(validation.error);
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('static_path', staticPath);
    if (options.contentType) {
      formData.append('content_type', options.contentType);
    }
    let response;
    try {
      response = await apiFetch({
        path: '/aether/site-exporter/local-storage/upload',
        method: 'POST',
        body: formData
      });
    } catch (apiError) {
      // WordPress REST API throws errors for WP_Error responses
      // Extract detailed error information if available
      const errorMessage = apiError?.message || apiError?.data?.message || apiError?.code || 'Upload failed';

      // Include additional error details if available (destination, source, etc.)
      const errorDetails = [];
      if (apiError?.data?.destination) {
        errorDetails.push(`Destination: ${apiError.data.destination}`);
      }
      if (apiError?.data?.source) {
        errorDetails.push(`Source: ${apiError.data.source}`);
      }
      if (apiError?.data?.system_error) {
        errorDetails.push(`System: ${apiError.data.system_error}`);
      }
      const fullErrorMessage = errorDetails.length > 0 ? `${errorMessage} (${errorDetails.join(', ')})` : errorMessage;
      return createErrorResponse(fullErrorMessage);
    }
    if (!response.success) {
      // Extract detailed error information from response
      const errorMessage = response.error || response.message || 'Upload failed';
      const errorDetails = [];
      if (response.destination) {
        errorDetails.push(`Destination: ${response.destination}`);
      }
      if (response.source) {
        errorDetails.push(`Source: ${response.source}`);
      }
      if (response.system_error) {
        errorDetails.push(`System: ${response.system_error}`);
      }
      const fullErrorMessage = errorDetails.length > 0 ? `${errorMessage} (${errorDetails.join(', ')})` : errorMessage;
      return createErrorResponse(fullErrorMessage);
    }

    // Call progress callback if provided (100% since we don't have chunked upload yet)
    if (options.onProgress) {
      options.onProgress(file.size, file.size, 100);
    }
    return createSuccessResponse();
  } catch (error) {
    return createErrorResponse(error.message || 'Upload failed');
  }
}

/**
 * Delete a file from local filesystem.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to delete.
 * @return {Promise<Object>} Delete result.
 */
async function deleteFile(staticPath, key) {
  try {
    const response = await (0,api/* default */.Ay)({
      path: '/aether/site-exporter/local-storage/delete',
      method: 'DELETE',
      data: {
        key,
        static_path: staticPath
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    return createErrorResponse(error.message || 'Delete failed');
  }
}

/**
 * Copy a file (not needed for local filesystem - files are uploaded directly).
 *
 * @return {Promise<Object>} Copy result.
 */
async function copyFile() {
  // Not implemented for local filesystem
  // Files are uploaded directly to their final location
  return createSuccessResponse();
}

/**
 * List objects in a directory (not needed for static site generation).
 *
 * @return {Promise<Object>} List result.
 */
async function listObjects() {
  // Not implemented - not needed for static site generation
  // Static site generator doesn't need to list existing files
  return createSuccessResponse({
    objects: []
  });
}

/**
 * Batch delete files.
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  keys       Array of file paths/keys to delete.
 * @return {Promise<Object>} Batch delete result.
 */
async function batchDelete(staticPath, keys) {
  try {
    const response = await (0,api/* default */.Ay)({
      path: '/aether/site-exporter/local-storage/batch-delete',
      method: 'DELETE',
      data: {
        keys,
        static_path: staticPath
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Batch delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    return createErrorResponse(error.message || 'Batch delete failed');
  }
}

/**
 * Download a file (manifest).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to download.
 * @return {Promise<Blob|null>} File blob or null if not found.
 */
async function downloadFile(staticPath, key) {
  try {
    const response = await (0,api/* default */.Ay)({
      path: `/aether/site-exporter/local-storage/download?key=${encodeURIComponent(key)}&static_path=${encodeURIComponent(staticPath)}`,
      method: 'GET',
      parse: false // Get raw response
    });
    if (!response.ok) {
      return null;
    }
    return await response.blob();
  } catch (error) {
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
function getObjectUrl(staticPath, baseUrl, key) {
  // For local filesystem, construct URL from baseUrl and key
  // Remove any trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Remove leading slash from key if present
  const cleanKey = key.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanKey}`;
}
// EXTERNAL MODULE: ./assets/src/export/utils/unifiedFileUpload.js
var unifiedFileUpload = __webpack_require__(98);
;// ./assets/src/providers/services/storageService.js
/**
 * Storage Service
 *
 * Storage service for local filesystem operations.
 * All operations go through REST API endpoints.
 *
 */




/**
 * Storage Service class.
 */
class StorageService {
  /**
   * Constructor.
   *
   * @param {string} staticPath Path for static files storage.
   * @param {Object} config     Optional configuration.
   */
  constructor(staticPath, config = {}) {
    this.staticPath = staticPath;
    this.config = config;
    this.baseUrl = config.public_url || config.base_url || '';
    this.providerId = config.provider_id || null;
  }

  /**
   * Upload a file to storage.
   *
   * Uses unified upload action system for provider integration.
   *
   * @param {string}    key      Object key/path in storage.
   * @param {File|Blob} file     File to upload.
   * @param {Object}    metadata Optional metadata (contentType, cacheControl, onProgress).
   * @return {Promise<Object>} Result array with 'success' and optional 'url', 'error'.
   */
  async upload(key, file, metadata = {}) {
    if (!(file instanceof File || file instanceof Blob)) {
      return {
        success: false,
        error: 'File must be a File or Blob object'
      };
    }
    const contentType = metadata.contentType || file.type;

    // Determine file type based on content type
    let fileType = unifiedFileUpload/* FILE_TYPES */.$Z.STATIC_ASSET;
    if (contentType === 'text/html') {
      fileType = unifiedFileUpload/* FILE_TYPES */.$Z.STATIC_HTML;
    }

    // Create unified file context
    const fileContext = (0,unifiedFileUpload/* createFileContext */.sM)({
      fileType,
      filePath: null,
      // Not applicable for storage service uploads
      fileContent: file,
      contentType,
      storageKey: key,
      providerId: this.providerId,
      metadata: {
        staticPath: this.staticPath,
        originalKey: key,
        cacheControl: metadata.cacheControl || '',
        onProgress: metadata.onProgress || null
      }
    });

    // Upload via unified action system
    try {
      await (0,unifiedFileUpload/* uploadFile */.QM)(fileContext);

      // Build public URL
      const url = this.getUrl(key);
      return {
        success: true,
        url
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Delete a file from storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async delete(key) {
    return deleteFile(this.staticPath, key);
  }

  /**
   * Copy an object from source to destination within storage.
   *
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async copy() {
    return {
      success: true
    };
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
    return {
      success: true,
      objects: []
    };
  }

  /**
   * Get public URL for an object.
   *
   * @param {string} key Object key/path.
   * @return {string} Public URL.
   */
  getUrl(key) {
    // Use baseUrl if available
    if (this.baseUrl) {
      return getObjectUrl(this.staticPath, this.baseUrl, key);
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
    return {
      success: true
    };
  }

  /**
   * Batch delete multiple objects from storage.
   *
   * @param {Array} keys Array of object keys to delete.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async batchDelete(keys) {
    return batchDelete(this.staticPath, keys);
  }

  /**
   * Download manifest file from storage.
   *
   * @return {Promise<Blob|null>} Manifest blob or null if not found.
   */
  async downloadManifest() {
    // Use provider-specific manifest filename to ensure isolation between providers
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
    try {
      const blob = await downloadFile(this.staticPath, manifestKey);
      return blob;
    } catch (error) {
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
  async uploadManifest(blob) {
    // Use provider-specific manifest filename to ensure isolation between providers
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
    const result = await this.upload(manifestKey, blob, {
      contentType: 'application/json'
    });
    return result;
  }
}

/***/ }),

/***/ 444:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ay: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports setAPINonce, configureAPI */
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);
/**
 * API Fetch Utility
 *
 * Wrapper around @wordpress/api-fetch with:
 * - Nonce handling from window.aetherData
 * - Auth header utilities for external APIs
 */



/**
 * Get REST API base URL from window.aetherData or default.
 *
 * @return {string} REST API base URL (without namespace).
 */
function getRestUrl() {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.restUrl) {
    return window.aetherData.restUrl;
  }
  return '/wp-json/';
}

/**
 * Get REST API nonce from window.aetherData or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.nonce) {
    return window.aetherData.nonce;
  }
  return '';
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
function setAPINonce(nonce) {
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL and nonce.
 * Automatically fetches from window.aetherData if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from window.aetherData if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from window.aetherData if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || getRestUrl();
  const token = nonce || getNonce();
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()));

/***/ }),

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 574:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  sF: () => (/* binding */ createUrlRewriter),
  ge: () => (/* reexport */ isExternal),
  Nh: () => (/* reexport */ resolveRelative),
  Gw: () => (/* reexport */ stripPlaygroundScope)
});

// UNUSED EXPORTS: forceHttps, normalize

// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// ./assets/src/export/utils/urlUtils.js
/**
 * URL Utilities
 *
 * Pure functions for URL parsing, resolution, and normalization.
 *
 */



/**
 * Resolve relative URL against a base URL.
 *
 * @param {string} url     Relative or absolute URL.
 * @param {string} baseUrl Base URL for resolution.
 * @return {string} Absolute URL.
 */
function resolveRelative(url, baseUrl) {
  // Data URLs should never be resolved - return as-is.
  if (url.startsWith('data:')) {
    return url;
  }

  // Already absolute.
  try {
    new URL(url);
    return url;
  } catch {
    // Not a valid absolute URL, continue
  }

  // Protocol-relative.
  if (url.startsWith('//')) {
    return 'https:' + url;
  }

  // Absolute path.
  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return base.origin + url;
  }

  // Relative to base URL directory.
  const base = new URL(baseUrl);
  const baseDir = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
  const resolvedUrl = base.origin + baseDir + '/' + url;
  return (0,external_wp_hooks_.applyFilters)('aether.url.resolve', resolvedUrl, url, baseUrl);
}

/**
 * Check if URL is external to the site.
 *
 * @param {string} url     URL to check.
 * @param {string} siteUrl Site URL for comparison.
 * @return {boolean} True if external.
 */
function isExternal(url, siteUrl) {
  // Relative URLs are not external.
  if (url.startsWith('/') && !url.startsWith('//')) {
    return false;
  }
  let isExternalUrl = false;

  // URLs that start with http:// or https:// - check host.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const siteObj = new URL(siteUrl);
      isExternalUrl = urlObj.host !== siteObj.host;
    } catch {
      isExternalUrl = true;
    }
  }
  // Protocol-relative URLs - check host.
  else if (url.startsWith('//')) {
    try {
      const urlObj = new URL('https:' + url);
      const siteObj = new URL(siteUrl);
      isExternalUrl = urlObj.host !== siteObj.host;
    } catch {
      isExternalUrl = true;
    }
  }
  // If it doesn't start with a scheme or /, treat as external to be safe.
  else {
    isExternalUrl = true;
  }
  return (0,external_wp_hooks_.applyFilters)('aether.url.is_external', isExternalUrl, url, siteUrl);
}

/**
 * Force URL to use HTTPS scheme.
 *
 * @param {string} url URL to convert.
 * @return {string} URL with HTTPS scheme.
 */
function forceHttps(url) {
  // Skip data URLs, anchors, and protocol-relative URLs.
  if (url.startsWith('data:') || url.startsWith('#') || url.startsWith('//')) {
    return url;
  }

  // Convert http:// to https://.
  if (url.startsWith('http://')) {
    return 'https://' + url.substring(7);
  }
  return url;
}

/**
 * Strip WordPress Playground scope from path.
 *
 * WordPress Playground uses scoped URLs like:
 * https://playground.wordpress.net/scope:happy-classic-town/
 *
 * @param {string} path Path that may contain Playground scope.
 * @return {string} Path with scope removed.
 */
function stripPlaygroundScope(path) {
  let result = path.replace(/^\/?scope:[a-z0-9.:-]+\//i, '');
  result = result.replace(/\/scope:[a-z0-9.:-]+\//gi, '/');
  result = result.replace(/^\/?scope:[a-z0-9.:-]+$/i, '');
  return result;
}

/**
 * Normalize a URL for comparison.
 *
 * @param {string} url     URL to normalize.
 * @param {string} siteUrl Site URL for HTTPS enforcement.
 * @return {string} Normalized URL.
 */
function normalize(url, siteUrl) {
  // Handle relative URLs.
  if (url.startsWith('/') && !url.startsWith('//')) {
    try {
      const siteObj = new URL(siteUrl);
      url = siteObj.origin + url;
    } catch {
      // If siteUrl is invalid, return as-is
    }
  }

  // Strip WordPress Playground scope from URL path.
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname) {
      urlObj.pathname = stripPlaygroundScope(urlObj.pathname);
      url = urlObj.toString();
    }
  } catch {
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      const strippedPath = stripPlaygroundScope(pathMatch[1]);
      url = url.replace(pathMatch[1], strippedPath);
    }
  }

  // Remove URL fragments.
  const fragmentIndex = url.indexOf('#');
  if (fragmentIndex !== -1) {
    url = url.substring(0, fragmentIndex);
  }

  // Remove trailing slash.
  url = url.replace(/\/$/, '');
  return (0,external_wp_hooks_.applyFilters)('aether.url.normalize', url, siteUrl);
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract host from a URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string if invalid.
 */
function extractHost(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    const hostMatch = url.match(/^https?:\/\/([^\/]+)/);
    return hostMatch ? hostMatch[1] : '';
  }
}

/**
 * Check if URL should be skipped (anchors, data URLs, CF Images).
 *
 * @param {string} url URL to check.
 * @return {boolean} True if should skip.
 */
function shouldSkipUrl(url) {
  return url.startsWith('#') || url.startsWith('data:') || url.includes('imagedelivery.net');
}
;// ./assets/src/export/utils/htmlRewriting.js
/**
 * HTML Rewriting Utilities
 *
 * Helper functions for HTML URL rewriting.
 *
 */



/**
 * Protect inline script content by replacing with placeholders.
 *
 * @param {string} html HTML content.
 * @return {Object} Object with protected HTML and placeholders map.
 */
function protectScriptContent(html) {
  const placeholders = {};
  let counter = 0;
  const protectedHtml = html.replace(/<script(?![^>]*type=["']importmap["'])([^>]*)>(.*?)<\/script>/gis, (match, openingAttrs, content) => {
    if (content.trim()) {
      const placeholder = `___SCRIPT_CONTENT_${counter}___`;
      placeholders[placeholder] = content;
      counter++;
      return `<script${openingAttrs}>${placeholder}</script>`;
    }
    return match;
  });
  return {
    html: protectedHtml,
    placeholders
  };
}

/**
 * Restore inline script content from placeholders.
 *
 * @param {string} html         HTML content with placeholders.
 * @param {Object} placeholders Placeholders map.
 * @return {string} HTML with restored script content.
 */
function restoreScriptContent(html, placeholders) {
  let result = html;
  for (const placeholder in placeholders) {
    if (placeholders.hasOwnProperty(placeholder)) {
      result = result.replace(placeholder, placeholders[placeholder]);
    }
  }
  return result;
}

/**
 * Collect all site URL matches from HTML.
 *
 * @param {string} html     HTML content.
 * @param {string} siteHost Site host to match.
 * @return {Array} Array of match objects with index, length, match, and type.
 */
function collectSiteUrlMatches(html, siteHost) {
  const escapedHost = escapeRegex(siteHost);
  const matches = [];
  const httpPattern = new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi');
  const httpsPattern = new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi');
  const protocolRelativePattern = new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi');
  let match;
  while ((match = httpPattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'http'
    });
  }
  while ((match = httpsPattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'https'
    });
  }
  while ((match = protocolRelativePattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'protocol-relative'
    });
  }

  // Sort by index
  matches.sort((a, b) => a.index - b.index);
  return matches;
}

/**
 * Replace site URL matches in HTML.
 *
 * @param {string}   html       HTML content.
 * @param {Array}    matches    Match objects from collectSiteUrlMatches.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with replaced URLs.
 */
function replaceSiteUrlMatches(html, matches, rewriteUrl, contextUrl) {
  let result = '';
  let lastIndex = 0;
  let lastMatchEnd = 0;
  for (const matchData of matches) {
    // Skip overlapping matches
    if (matchData.index < lastMatchEnd) {
      continue;
    }

    // Skip CF Images URLs
    if (matchData.match.includes('imagedelivery.net')) {
      continue;
    }
    let urlToRewrite = matchData.match;
    if (matchData.type === 'protocol-relative') {
      urlToRewrite = 'https:' + matchData.match;
    }
    const rewritten = rewriteUrl(urlToRewrite, contextUrl);
    if (rewritten !== urlToRewrite) {
      result += html.substring(lastIndex, matchData.index);
      result += rewritten;
      lastIndex = matchData.index + matchData.length;
      lastMatchEnd = matchData.index + matchData.length;
    } else {
      lastMatchEnd = matchData.index + matchData.length;
    }
  }
  result += html.substring(lastIndex);
  return result;
}

/**
 * Rewrite absolute paths in HTML attributes.
 *
 * @param {string} html     HTML content.
 * @param {string} basePath Base path to prepend.
 * @return {string} HTML with rewritten paths.
 */
function rewriteAbsolutePaths(html, basePath) {
  if (!basePath || basePath === '' || basePath === '/') {
    return html;
  }
  const result = html.replace(/(\b(?:href|src|action|data|poster|content)=)(["'`])(\/(?!\/)[^"'`]*)\2/gi, (match, attrPart, quote, path) => {
    // Skip if already includes the base path
    if (path.startsWith(basePath + '/')) {
      return match;
    }

    // Skip anchors and special paths
    if (path === '/' || path.startsWith('/#') || path.startsWith('/data:')) {
      return match;
    }
    const rewrittenPath = basePath + path;
    return attrPart + quote + rewrittenPath + quote;
  });
  return result;
}

/**
 * Rewrite srcset attribute URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten srcset URLs.
 */
function rewriteSrcsetUrls(html, rewriteUrl, contextUrl) {
  return html.replace(/(<(?:img|source)[^>]+srcset=)(["'`])([^"'`]+)\2/gi, (match, tag, quote, srcsetValue) => {
    const srcsetParts = srcsetValue.split(',').map(part => {
      const trimmed = part.trim();
      const urlMatch = trimmed.match(/^([^\s]+)(\s+.+)?$/);
      if (!urlMatch) {
        return trimmed;
      }
      const url = urlMatch[1];
      const descriptor = urlMatch[2] || '';
      if (url.includes('imagedelivery.net')) {
        return trimmed;
      }
      const rewritten = rewriteUrl(url, contextUrl);
      return rewritten + descriptor;
    });
    return tag + quote + srcsetParts.join(', ') + quote;
  });
}

/**
 * Rewrite import map URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten import map URLs.
 */
function rewriteImportMaps(html, rewriteUrl, contextUrl) {
  return html.replace(/<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis, (match, jsonContent) => {
    try {
      const importmap = JSON.parse(jsonContent);
      if (!importmap || typeof importmap !== 'object' || !importmap.imports) {
        return match;
      }
      for (const moduleName in importmap.imports) {
        if (importmap.imports.hasOwnProperty(moduleName)) {
          importmap.imports[moduleName] = rewriteUrl(importmap.imports[moduleName], contextUrl);
        }
      }
      const newJson = JSON.stringify(importmap);
      return match.replace(jsonContent, newJson);
    } catch {
      return match;
    }
  });
}
;// ./assets/src/export/utils/urlRewriter.js
/**
 * URL Rewriter
 *
 * Rewrites WordPress URLs to static URLs for the static site.
 *
 */



// Import URL utilities


// Import HTML rewriting helpers


// Re-export URL utilities for backwards compatibility


/**
 * Create URL rewriter instance.
 *
 * @param {string}                 siteUrl   Site URL.
 * @param {string|null}            staticUrl Static site URL (where it will be deployed).
 * @param {Object<string, string>} urlMap    Optional URL mapping cache.
 * @return {Object} URL rewriter instance.
 */
function createUrlRewriter(siteUrl, staticUrl = null, urlMap = {}) {
  // Force HTTPS for site URL to avoid mixed content issues.
  const normalizedSiteUrl = forceHttps(siteUrl);

  // Treat empty string as null.
  const normalizedStaticUrl = staticUrl && staticUrl.trim() ? staticUrl.trim() : null;

  // Detect if static URL is a public URL vs worker endpoint.
  let isPublicUrl = normalizedStaticUrl && !normalizedStaticUrl.includes('.workers.dev');

  // If the static URL has a pathname component, don't add /static prefix
  if (isPublicUrl && normalizedStaticUrl) {
    try {
      const urlObj = new URL(normalizedStaticUrl);
      if (urlObj.pathname && urlObj.pathname !== '/') {
        isPublicUrl = false;
      }
    } catch {
      // URL parsing failed, leave isPublicUrl as is
    }
  }

  // Build initial URL mapping.
  const mapping = {
    [normalizedSiteUrl]: '/',
    [normalizedSiteUrl + '/']: '/',
    ...(siteUrl !== normalizedSiteUrl ? {
      [siteUrl]: '/',
      [siteUrl + '/']: '/'
    } : {}),
    ...urlMap
  };

  /**
   * Convert WordPress URL to static path.
   *
   * @param {string} url URL to convert.
   * @return {string} Static path.
   */
  function convertToStaticPath(url) {
    // Handle relative URLs.
    if (url.startsWith('/') && !url.startsWith('//')) {
      return stripPlaygroundScope(url);
    }

    // Parse URL.
    let path = '/';
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname || '/';
    } catch {
      const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (pathMatch) {
        path = pathMatch[1];
      } else if (url.includes('?')) {
        const parts = url.split('?');
        path = parts[0];
      }
    }

    // Remove leading/trailing slashes.
    path = path.replace(/^\/+|\/+$/g, '');

    // Strip WordPress Playground scope.
    path = stripPlaygroundScope(path);
    if (!path) {
      return '/';
    }

    // Handle WordPress query parameters.
    try {
      const urlObj = new URL(url);
      if (urlObj.search) {
        const params = new URLSearchParams(urlObj.search);
        if (params.has('s')) {
          const query = params.get('s');
          return `/search/?q=${encodeURIComponent(query)}`;
        }
      }
    } catch {
      // URL parsing failed, continue with path
    }

    // Ensure trailing slash for directory-style URLs.
    path = '/' + path;

    // Add trailing slash if not a file.
    if (!/\.[a-z0-9]{2,5}$/i.test(path)) {
      path = path.replace(/\/$/, '') + '/';
    }
    return path;
  }

  /**
   * Normalize a URL for comparison.
   *
   * @param {string} url URL to normalize.
   * @return {string} Normalized URL.
   */
  function normalizeUrl(url) {
    return normalize(url, siteUrl);
  }

  /**
   * Check if URL is external.
   *
   * @param {string} url URL to check.
   * @return {boolean} True if external.
   */
  function isExternalUrl(url) {
    return isExternal(url, siteUrl);
  }

  /**
   * Rewrite a single URL.
   *
   * @param {string} url        URL to rewrite.
   * @param {string} contextUrl Context URL for relative URL resolution.
   * @return {string} Rewritten URL.
   */
  function rewriteUrl(url, contextUrl = '') {
    // Skip external URLs.
    if (isExternalUrl(url)) {
      return url;
    }

    // Skip special URLs.
    if (shouldSkipUrl(url)) {
      return url;
    }

    // Resolve relative URLs against context.
    let absoluteUrl = url;
    if (contextUrl && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      absoluteUrl = resolveRelative(url, contextUrl);
    } else if (contextUrl && url.startsWith('/')) {
      try {
        const contextObj = new URL(contextUrl);
        absoluteUrl = contextObj.origin + url;
      } catch {
        // If context URL parsing fails, use as-is
      }
    }

    // Check URL map first.
    const urlNormalized = normalizeUrl(absoluteUrl);
    let staticPath = mapping[urlNormalized];
    if (!staticPath) {
      staticPath = convertToStaticPath(absoluteUrl);
    }

    // If using public URL, add /static/ prefix.
    if (isPublicUrl && staticPath && staticPath !== '/' && !staticPath.startsWith('/static/')) {
      staticPath = '/static' + staticPath;
    }

    // Apply static URL base if configured.
    let rewrittenUrl;
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        rewrittenUrl = staticUrlObj.origin + basePath + staticPath;
      } catch {
        rewrittenUrl = normalizedStaticUrl.replace(/\/$/, '') + staticPath;
      }
    } else {
      rewrittenUrl = staticPath;
    }
    return (0,external_wp_hooks_.applyFilters)('aether.url.rewrite', rewrittenUrl, url, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }

  /**
   * Rewrite all URLs in HTML content.
   *
   * @param {string} html       HTML content.
   * @param {string} contextUrl Current page URL for relative URL resolution.
   * @return {string} HTML with rewritten URLs.
   */
  function rewriteHtml(html, contextUrl) {
    // Protect inline script content
    const {
      html: protectedHtml,
      placeholders
    } = protectScriptContent(html);
    let result = protectedHtml;

    // Extract site host and rewrite URLs
    const siteHost = extractHost(siteUrl);
    if (siteHost) {
      const matches = collectSiteUrlMatches(result, siteHost);
      result = replaceSiteUrlMatches(result, matches, rewriteUrl, contextUrl);
    }

    // Rewrite absolute paths if static URL has subdirectories
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        result = rewriteAbsolutePaths(result, basePath);
      } catch (error) {
        // Error in absolute path rewriting, continue without rewriting
      }
    }

    // Rewrite srcset and import map URLs
    result = rewriteSrcsetUrls(result, rewriteUrl, contextUrl);
    result = rewriteImportMaps(result, rewriteUrl, contextUrl);

    // Restore inline script content
    result = restoreScriptContent(result, placeholders);
    return (0,external_wp_hooks_.applyFilters)('aether.url.rewrite_html', result, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }
  return {
    rewriteHtml,
    rewriteUrl,
    addUrlMapping: (originalUrl, staticPath) => {
      const normalized = normalizeUrl(originalUrl);
      mapping[normalized] = staticPath;
    },
    getUrlMapping: () => ({
      ...mapping
    })
  };
}

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ }),

/***/ 864:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   W: () => (/* binding */ getStaticFilePath),
/* harmony export */   t: () => (/* binding */ processHtml)
/* harmony export */ });
/* harmony import */ var _urlRewriter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/**
 * HTML Processor
 *
 * Processes HTML for static site generation.
 * Ported from PHP HTMLGeneratorService::processHtml() logic.
 *
 */



/**
 * Process HTML for static site.
 *
 * @param {string}      html          HTML content.
 * @param {string}      url           Source URL.
 * @param {string}      siteUrl       Site URL.
 * @param {string|null} staticSiteUrl Static site URL for URL rewriting.
 * @return {string} Processed HTML.
 */
function processHtml(html, url, siteUrl, staticSiteUrl = null) {
  // STEP 1: Remove admin bar from HTML (in case source was generated while logged in).
  // This removes #wpadminbar div, related CSS/JS, and body classes.
  html = removeAdminBar(html);

  // STEP 2: Remove dynamic WordPress links (RSS comments feed, REST API, XML-RPC).
  // These features don't exist in static exports.
  html = removeDynamicWpLinks(html);

  // STEP 3: Replace all internal URLs (absolute → relative or custom domain).
  // This is the main URL rewriting step that makes the static site work.
  const urlRewriter = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__/* .createUrlRewriter */ .sF)(siteUrl, staticSiteUrl);
  html = urlRewriter.rewriteHtml(html, url);
  return html;
}

/**
 * Remove admin bar from HTML.
 *
 * Strips the WordPress admin bar (#wpadminbar) and related styles/scripts
 * that may have been rendered if the source page was fetched while logged in.
 *
 * @param {string} html HTML content.
 * @return {string} HTML with admin bar removed.
 */
function removeAdminBar(html) {
  // Helper function to remove HTML elements by attribute matching.
  // Used to remove admin bar CSS, JS, and HTML by ID or class.
  const removeElementsByAttr = (htmlContent, element, attribute, valuePattern, exactMatch = false) => {
    // Escape regex special characters in pattern.
    const escapedPattern = valuePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build regex pattern for attribute matching.
    // exactMatch=true: id="exact-value"
    // exactMatch=false: id="contains-value-anywhere"
    let attrPattern;
    if (exactMatch) {
      attrPattern = `${attribute}=["']${escapedPattern}["']`;
    } else {
      attrPattern = `${attribute}=["'][^"']*${escapedPattern}[^"']*["']`;
    }

    // Handle self-closing tags (link).
    // Pattern: <link ... id="admin-bar-css" ... >
    if (element === 'link') {
      const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>`, 'gi');
      return htmlContent.replace(pattern, '');
    }

    // Handle tags with content (script, style, div).
    // Pattern: <script ... id="admin-bar-js" ...>...</script>
    const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>.*?<\/${element}>`, 'gis');
    return htmlContent.replace(pattern, '');
  };

  // Remove admin bar CSS link.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-css', true);

  // Remove dashicons CSS link (used by admin bar).
  html = removeElementsByAttr(html, 'link', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'dashicons-css', true);

  // Remove admin bar container div.
  html = removeElementsByAttr(html, 'link', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'script', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'style', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'div', 'id', 'wpadminbar', true);

  // Remove admin bar inline styles.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-inline-css', true);

  // Remove admin bar scripts.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-js', true);

  // Remove any remaining admin bar related inline styles.
  html = html.replace(/<style[^>]*>.*?#wpadminbar.*?<\/style>/gis, '');

  // Remove logged-in and admin-bar classes from body tag.
  // These classes affect page layout and should be removed for static site.
  const classesToRemove = ['logged-in', 'admin-bar'];
  for (const className of classesToRemove) {
    const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(class=["'][^"']*)\\b${escapedClass}\\b([^"']*["'])`, 'gi');
    html = html.replace(pattern, '$1$2');
  }

  // Add no-admin-bar class to body (opposite of admin-bar class).
  // WordPress themes use this class to adjust layout when admin bar is absent.
  if (!html.includes('no-admin-bar')) {
    html = html.replace(/(<body[^>]*class=["'][^"']*)(")/i, '$1 no-admin-bar$2');
  }

  // AGGRESSIVE CLEANUP: Remove everything between <body> and wp-site-blocks div.
  // This is a last-resort cleanup for any remaining admin bar HTML.
  // Only runs if admin bar classes are still present in HTML.
  if (html.includes('wp-admin-bar-')) {
    html = html.replace(/(<body[^>]*>).*?(<div[^>]*class=["'][^"']*wp-site-blocks)/gis, '$1$2');
  }
  return html;
}

/**
 * Remove dynamic WordPress links from HTML.
 *
 * Removes links to features that don't exist in static exports:
 * - Comments RSS feed
 * - REST API discovery
 * - XML-RPC/RSD
 *
 * @param {string} html HTML content.
 * @return {string} HTML with dynamic links removed.
 */
function removeDynamicWpLinks(html) {
  // Remove comments feed link.
  // <link rel="alternate" type="application/rss+xml" title="..." href=".../comments/feed/" />.
  html = html.replace(/<link[^>]*rel=["']alternate["'][^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*>/gi, '');

  // Alternative pattern (href before rel).
  html = html.replace(/<link[^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*rel=["']alternate["'][^>]*>/gi, '');

  // Remove REST API discovery link.
  // <link rel="https://api.w.org/" href=".../wp-json/" />.
  html = html.replace(/<link[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*>/gi, '');

  // Remove XML-RPC/RSD discovery link.
  // <link rel="EditURI" type="application/rsd+xml" title="RSD" href=".../xmlrpc.php" />.
  html = html.replace(/<link[^>]*rel=["']EditURI["'][^>]*type=["']application\/rsd\+xml["'][^>]*>/gi, '');

  // Alternative pattern (type before rel).
  html = html.replace(/<link[^>]*type=["']application\/rsd\+xml["'][^>]*rel=["']EditURI["'][^>]*>/gi, '');
  return html;
}

/**
 * Get static file path for a URL.
 *
 * @param {string} url URL to convert.
 * @return {string} File path (relative to static root).
 */
function getStaticFilePath(url) {
  // Extract pathname from URL.
  let path = '/';
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname || '/';
  } catch {
    // Fallback: If URL parsing fails, extract path manually with regex.
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      path = pathMatch[1];
    }
  }

  // Handle homepage (root URL).
  if (!path || path === '/') {
    return 'index.html';
  }

  // Remove leading slash (normalize path).
  path = path.replace(/^\/+/, '');

  // Remove WordPress Playground scope prefix.
  // Playground URLs contain scope like /scope:12345/path → path
  path = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__/* .stripPlaygroundScope */ .Gw)(path);

  // Remove trailing slash (normalize path).
  path = path.replace(/\/+$/, '');

  // Check if path is empty after removing scope (homepage case).
  if (!path) {
    return 'index.html';
  }

  // Convert URL path to directory structure with index.html.
  // Example: /about → about/index.html
  // This allows static files to be served via directory URLs: example.com/about/
  return path + '/index.html';
}

/***/ }),

/***/ 906:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfigStorage: () => (/* binding */ ConfigStorage)
/* harmony export */ });
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(444);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/**
 * Provider Configuration Storage
 *
 * Handles provider configuration persistence with REST API backend storage.
 */




/**
 * Configuration storage class.
 *
 * Provides REST API persistence for provider configurations.
 */
class ConfigStorage {
  /**
   * Provider ID.
   *
   * @type {string}
   */
  providerId;

  /**
   * Constructor.
   *
   * @param {string} providerId Provider ID.
   */
  constructor(providerId) {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ConfigStorage requires a valid provider ID');
    }
    this.providerId = providerId;
  }

  /**
   * Load configuration from REST API.
   *
   * @return {Promise<Object>} Configuration object
   */
  async load() {
    try {
      const response = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'GET'
      });
      let config = response.config || {};

      /**
       * Filter provider configuration after loading from storage.
       *
       * Allows modification of config loaded from REST API.
       *
       * @param {Object} config     Loaded configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.storage.config.load', 'my-plugin', (config, providerId) => {
       *     if (providerId === 'my-provider') {
       *         config.autoLoaded = Date.now();
       *     }
       *     return config;
       * });
       */
      config = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.storage.config.load', config, this.providerId);

      /**
       * Action fired after configuration is loaded from storage.
       *
       * @param {Object} config     Loaded configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.storage.config.loaded', 'my-plugin', (config, providerId) => {
       *     console.log(`Configuration loaded for ${providerId}`);
       * });
       */
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.loaded', config, this.providerId);
      return config;
    } catch (error) {
      // If provider not configured, return empty object
      if (error.code === 'restProviderNotConfigured' || error.status === 404) {
        return {};
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Save configuration to REST API.
   *
   * @param {Object} config Configuration object to save.
   * @return {Promise<boolean>} True if saved successfully
   */
  async save(config) {
    /**
     * Filter configuration before saving to storage.
     *
     * Allows modification of config before REST API call.
     *
     * @param {Object} config     Configuration to save.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.storage.config.before_save', 'my-plugin', (config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         config.lastSaved = Date.now();
     *     }
     *     return config;
     * });
     */
    config = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.storage.config.before_save', config, this.providerId);
    try {
      await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'POST',
        data: {
          config
        }
      });

      /**
       * Action fired after configuration is saved to storage.
       *
       * @param {Object} config     Saved configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.storage.config.saved', 'my-plugin', (config, providerId) => {
       *     console.log(`Configuration saved for ${providerId}`);
       * });
       */
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.saved', config, this.providerId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete configuration from REST API.
   *
   * @return {Promise<boolean>} True if deleted successfully
   */
  async delete() {
    /**
     * Action fired before configuration is deleted from storage.
     *
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.storage.config.before_delete', 'my-plugin', (providerId) => {
     *     console.log(`Deleting configuration for ${providerId}`);
     * });
     */
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.before_delete', this.providerId);
    try {
      await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'DELETE'
      });

      /**
       * Action fired after configuration is deleted from storage.
       *
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.storage.config.deleted', 'my-plugin', (providerId) => {
       *     console.log(`Configuration deleted for ${providerId}`);
       * });
       */
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.deleted', this.providerId);
      return true;
    } catch (error) {
      throw error;
    }
  }
}
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (ConfigStorage)));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "";
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/contexts/ExportContext.js
/**
 * Export Context
 *
 * Centralized export workflow state management using React Context API.
 * Provides global export state with step tracking, progress management, and status updates.
 *
 */



/**
 * Export Context
 *
 * @type {Object}
 */

const ExportContext = (0,external_wp_element_namespaceObject.createContext)({
  steps: [],
  isExporting: false,
  finalStatus: null,
  error: null,
  currentStatusMessage: null,
  overallProgress: 0,
  staticSiteProviders: [],
  blueprintBundleProviders: [],
  providerProgress: {},
  initializeSteps: () => {},
  setStepStatus: () => {},
  setStepProgress: () => {},
  setProviderProgress: () => {},
  updateFromStep: () => {},
  markAllComplete: () => {},
  showError: () => {},
  setIsExporting: () => {},
  setStatusMessage: () => {},
  setOverallProgressValue: () => {},
  updateMessage: () => {},
  removeMessage: () => {},
  setProviders: () => {},
  reset: () => {}
});

/**
 * Export Provider Component
 *
 * Wraps the export workflow to provide global state management.
 * Features:
 * - Step tracking (pending, active, complete, error)
 * - Progress management (per-step and overall)
 * - Status messages
 * - Error handling
 * - Progress never goes backwards (monotonic increase)
 * - Retry support (can restart from earlier steps)
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
function ExportProvider({
  children
}) {
  // Core state
  const [steps, setSteps] = (0,external_wp_element_namespaceObject.useState)([]);
  const [isExporting, setIsExporting] = (0,external_wp_element_namespaceObject.useState)(false);
  const [finalStatus, setFinalStatus] = (0,external_wp_element_namespaceObject.useState)(null);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const [currentStatusMessage, setCurrentStatusMessage] = (0,external_wp_element_namespaceObject.useState)(null);
  const [overallProgress, setOverallProgress] = (0,external_wp_element_namespaceObject.useState)(0);
  const [messageHistory, setMessageHistory] = (0,external_wp_element_namespaceObject.useState)([]);
  const [staticSiteProviders, setStaticSiteProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [blueprintBundleProviders, setBlueprintBundleProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [providerProgress, setProviderProgressState] = (0,external_wp_element_namespaceObject.useState)({});

  // Track maximum progress to prevent progress from going backwards
  const maxProgressRef = (0,external_wp_element_namespaceObject.useRef)(0);

  /**
   * Initialize steps from step definitions
   *
   * @param {Array<Object>} stepDefinitions Step definitions with id, label, supportsProgress
   * @param {string|null}   initialStepId   Optional step ID to activate immediately
   */
  const initializeSteps = (0,external_wp_element_namespaceObject.useCallback)((stepDefinitions = [], initialStepId = null) => {
    const newSteps = stepDefinitions.map(stepDef => ({
      id: stepDef.id,
      label: stepDef.label,
      status: 'pending',
      supportsProgress: stepDef.supportsProgress || false,
      progress: {
        current: 0,
        total: 0
      }
    }));

    // If initialStepId is provided, activate it immediately
    let initialStepIndex = -1;
    if (initialStepId) {
      initialStepIndex = newSteps.findIndex(s => s.id === initialStepId);
      if (initialStepIndex !== -1) {
        newSteps[initialStepIndex].status = 'active';
      }
    }

    // Use functional update to ensure we're working with the latest state
    // This prevents race conditions with reset() or other state updates
    setSteps(() => newSteps);
    setError(null);
    setFinalStatus(null);
  }, []);

  /**
   * Set status for a specific step
   *
   * @param {string} stepId       Step ID
   * @param {string} status       Status: 'pending', 'active', 'complete', 'error'
   * @param {string} errorMessage Error message (only used when status is 'error')
   */
  const setStepStatus = (0,external_wp_element_namespaceObject.useCallback)((stepId, status, errorMessage = '') => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          errorMessage: status === 'error' ? errorMessage : ''
        };
      }
      return step;
    }));
  }, []);

  /**
   * Set progress for a specific step
   *
   * @param {string} stepId   Step ID
   * @param {Object} progress Progress object with `current` and `total` properties
   */
  const setStepProgress = (0,external_wp_element_namespaceObject.useCallback)((stepId, progress) => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          progress: {
            current: Math.max(0, progress.current || 0),
            total: Math.max(0, progress.total || 0)
          }
        };
      }
      return step;
    }));
  }, []);

  /**
   * Set progress for a specific provider instance
   *
   * Used by ThreadOrchestrator to track per-provider progress.
   * Format: { [providerId]: { stepId, stepLabel, progress, status } }
   *
   * @param {string} providerId Provider instance ID
   * @param {Object} progress   Progress data { stepId, stepLabel, progress, status }
   */
  const setProviderProgress = (0,external_wp_element_namespaceObject.useCallback)((providerId, progressData) => {
    setProviderProgressState(prev => ({
      ...prev,
      [providerId]: {
        ...progressData,
        progress: {
          current: Math.max(0, progressData.progress?.current || 0),
          total: Math.max(0, progressData.progress?.total || 0)
        }
      }
    }));
  }, []);

  /**
   * Update state to reflect transition to a step
   *
   * Handles both forward progression and retry (backward) scenarios.
   * When moving forward, marks previous steps as complete.
   * When retrying, resets steps between current and target position.
   *
   * @param {string} backendStep Backend step ID to transition to
   */
  const updateFromStep = (0,external_wp_element_namespaceObject.useCallback)(backendStep => {
    // Use setSteps callback to access current steps state without dependency issues
    setSteps(prevSteps => {
      // Find step by backend name
      const step = prevSteps.find(s => s.id === backendStep);
      if (!step) {
        return prevSteps; // No change
      }

      // Get step index
      const stepIndex = prevSteps.findIndex(s => s.id === step.id);
      if (stepIndex === -1) {
        return prevSteps; // No change
      }

      // Update steps based on progression direction
      const newSteps = prevSteps.map((s, i) => {
        // Mark previous steps as complete
        if (i < stepIndex && s.status !== 'complete') {
          return {
            ...s,
            status: 'complete'
          };
        }
        // Mark target step as active
        if (i === stepIndex) {
          return {
            ...s,
            status: 'active'
          };
        }
        return s;
      });
      return newSteps;
    });
  }, [] // No dependencies - uses setSteps callback to access current state
  );

  /**
   * Add message to activity log history
   *
   * @param {string}      message  Message text (can include HTML)
   * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key      Optional key to identify message for later updates
   * @param {*}           progress Optional progress value
   * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
   */
  const addMessage = (0,external_wp_element_namespaceObject.useCallback)((message, type = 'info', key = null, progress = undefined, metadata = undefined) => {
    setMessageHistory(prev => [{
      id: Date.now() + Math.random(),
      message,
      type,
      key,
      ...(progress !== undefined && {
        progress
      }),
      // Only include progress if provided
      ...(metadata !== undefined && {
        metadata
      }),
      timestamp: Date.now()
    }, ...prev // Prepend to show newest first
    ]);
  }, []);

  /**
   * Update existing message by key
   *
   * Finds a message with the given key and updates its message text, type, and/or progress.
   * If no message with the key exists, does nothing.
   *
   * @param {string}      key        Message key to find
   * @param {string|null} newMessage New message text (optional, keeps existing if null)
   * @param {string|null} newType    New message type (optional, keeps existing if null)
   * @param {Object|null} progress   Progress data { percent, loaded, total } (optional)
   * @param {Object}      metadata   Optional metadata to merge (e.g., provider info)
   */
  const updateMessage = (0,external_wp_element_namespaceObject.useCallback)((key, newMessage = null, newType = null, progress = undefined, metadata = undefined) => {
    setMessageHistory(prev => prev.map(item => {
      if (item.key !== key) {
        return item;
      }
      const updated = {
        ...item
      };
      if (newMessage !== null) {
        updated.message = newMessage;
      }
      if (newType !== null) {
        updated.type = newType;
      }
      // If progress is explicitly null, remove it. If undefined, don't update.
      if (progress === null) {
        delete updated.progress;
      } else if (progress !== undefined) {
        updated.progress = progress;
      }
      // Merge metadata - allow updating specific fields
      if (metadata !== undefined) {
        updated.metadata = {
          ...(item.metadata || {}),
          ...metadata
        };
      }
      return updated;
    }));
  }, []);

  /**
   * Remove message by key
   *
   * Removes a message with the given key from history.
   *
   * @param {string} key Message key to remove
   */
  const removeMessage = (0,external_wp_element_namespaceObject.useCallback)(key => {
    setMessageHistory(prev => prev.filter(item => item.key !== key));
  }, []);

  /**
   * Mark all steps as complete
   *
   * Called when export workflow completes successfully.
   *
   * @param {Object} status Final status object (includes deployment URL, etc.)
   */
  const markAllComplete = (0,external_wp_element_namespaceObject.useCallback)((status = {}) => {
    setSteps(prevSteps => prevSteps.map(step => ({
      ...step,
      status: 'complete'
    })));
    setFinalStatus(status);
    setIsExporting(false);
    addMessage('Site exported successfully!', 'success');
  }, [addMessage]);

  /**
   * Show error message and optionally mark step as failed
   *
   * @param {string}      errorMessage Error message to display
   * @param {string|null} stepId       Step ID to mark as failed (optional)
   */
  const showError = (0,external_wp_element_namespaceObject.useCallback)((errorMessage, stepId = null) => {
    setError(errorMessage);
    setIsExporting(false);
    addMessage(errorMessage, 'error');
    if (stepId) {
      setStepStatus(stepId, 'error', errorMessage);
    }
  }, [addMessage, setStepStatus]);

  /**
   * Set current status message
   *
   * Also adds the message to activity log history.
   * If a key is provided and a message with that key exists, updates it instead of adding new.
   *
   * @param {string}      message  Status message to display
   * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key      Optional key to identify message for later updates
   * @param {*}           progress Optional progress value
   * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
   */
  const setStatusMessage = (0,external_wp_element_namespaceObject.useCallback)((message, type, key = null, progress = undefined, metadata = undefined) => {
    setCurrentStatusMessage(message);
    if (message) {
      if (key) {
        // Check if message with this key already exists
        setMessageHistory(prev => {
          const existingIndex = prev.findIndex(item => item.key === key);
          if (existingIndex !== -1) {
            // Update existing message
            return prev.map((item, index) => {
              if (index !== existingIndex) {
                return item;
              }
              const updated = {
                ...item,
                message,
                type
              };
              // If progress is explicitly null, remove it. If undefined, don't update.
              if (progress === null) {
                delete updated.progress;
              } else if (progress !== undefined) {
                updated.progress = progress;
              }
              // Merge metadata - allow updating specific fields
              if (metadata !== undefined) {
                updated.metadata = {
                  ...(item.metadata || {}),
                  ...metadata
                };
              }
              return updated;
            });
          }
          // Add new message with key
          return [{
            id: Date.now() + Math.random(),
            message,
            type,
            key,
            ...(progress !== undefined && {
              progress
            }),
            ...(metadata !== undefined && {
              metadata
            }),
            timestamp: Date.now()
          }, ...prev];
        });
      } else {
        // No key, just add message
        addMessage(message, type, null, progress, metadata);
      }
    }
  }, [addMessage]);

  /**
   * Set overall progress percentage
   *
   * Progress is monotonic - it never decreases.
   * This prevents progress bar from jumping backwards.
   *
   * @param {number} progress Overall progress percentage (0-100)
   */
  const setOverallProgressValue = (0,external_wp_element_namespaceObject.useCallback)(progress => {
    const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    // Ensure progress never goes backwards
    if (roundedProgress > maxProgressRef.current) {
      maxProgressRef.current = roundedProgress;
    }
    setOverallProgress(maxProgressRef.current);
  }, []);

  /**
   * Set provider arrays
   *
   * @param {Array} staticProviders    Array of provider IDs for static site deployment
   * @param {Array} blueprintProviders Array of provider IDs for blueprint bundle deployment
   */
  const setProviders = (0,external_wp_element_namespaceObject.useCallback)((staticProviders = [], blueprintProviders = []) => {
    setStaticSiteProviders(staticProviders);
    setBlueprintBundleProviders(blueprintProviders);
  }, []);

  /**
   * Reset all export state to initial values
   *
   * Called when starting a new export or closing the export modal.
   *
   * @param {boolean} keepSteps If true, don't clear steps (useful when immediately reinitializing)
   */
  const reset = (0,external_wp_element_namespaceObject.useCallback)((keepSteps = false) => {
    if (!keepSteps) {
      setSteps([]);
    }
    setIsExporting(false);
    setFinalStatus(null);
    setError(null);
    setCurrentStatusMessage(null);
    setOverallProgress(0);
    setMessageHistory([]);
    setStaticSiteProviders([]);
    setBlueprintBundleProviders([]);
    setProviderProgressState({});
    maxProgressRef.current = 0;
  }, []);

  // Provide context value
  const value = (0,external_wp_element_namespaceObject.useMemo)(() => ({
    steps,
    isExporting,
    finalStatus,
    error,
    currentStatusMessage,
    overallProgress,
    messageHistory,
    staticSiteProviders,
    blueprintBundleProviders,
    providerProgress,
    initializeSteps,
    setStepStatus,
    setStepProgress,
    setProviderProgress,
    updateFromStep,
    markAllComplete,
    showError,
    setIsExporting,
    setStatusMessage,
    setOverallProgressValue,
    addMessage,
    updateMessage,
    removeMessage,
    setProviders,
    reset
  }), [steps, isExporting, finalStatus, error, currentStatusMessage, overallProgress, messageHistory, staticSiteProviders, blueprintBundleProviders, providerProgress, initializeSteps, setStepStatus, setStepProgress, setProviderProgress, updateFromStep, markAllComplete, showError, setStatusMessage, setOverallProgressValue, addMessage, updateMessage, removeMessage, setProviders, reset]);
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ExportContext.Provider, {
    value: value,
    children: children
  });
}
;// ./assets/src/hooks/useExportContext.js
/**
 * useExportContext Hook
 *
 * Hook to consume the ExportContext.
 * Provides access to global export workflow state and operations.
 *
 */




/**
 * Hook to access export context
 *
 * Must be used within an ExportProvider.
 *
 * @throws {Error} If used outside ExportProvider
 * @return {Object} Export context value
 * @property {Array}    steps                   - All workflow steps
 * @property {boolean}  isExporting             - Exporting flag
 * @property {Object}   finalStatus             - Final status object (null if not complete)
 * @property {string}   error                   - Error message (null if no error)
 * @property {string}   currentStatusMessage    - Current status message
 * @property {number}   overallProgress         - Overall progress percentage (0-100)
 * @property {Function} initializeSteps         - Initialize steps from definitions
 * @property {Function} setStepStatus           - Set status for a specific step
 * @property {Function} setStepProgress         - Set progress for a specific step
 * @property {Function} updateFromStep          - Transition to a step
 * @property {Function} markAllComplete         - Mark all steps complete
 * @property {Function} showError               - Show error message
 * @property {Function} setIsExporting          - Set exporting flag
 * @property {Function} setStatusMessage        - Set status message
 * @property {Function} setOverallProgressValue - Set overall progress
 * @property {Function} addMessage              - Add a message to history
 * @property {Function} updateMessage           - Update existing message by key
 * @property {Function} removeMessage           - Remove message by key
 * @property {Function} reset                   - Reset all state
 *
 * @example
 * function ExportButton() {
 *     const { isExporting, startExport } = useExportContext();
 *
 *     return (
 *         <button onClick={startExport} disabled={isExporting}>
 *             {isExporting ? 'Exporting...' : 'Export'}
 *         </button>
 *     );
 * }
 *
 * @example
 * // Get steps for display
 * function ProgressSteps() {
 *     const { steps } = useExportContext();
 *
 *     return (
 *         <ul>
 *             {steps.map(step => (
 *                 <li key={step.id}>
 *                     {step.label} - {step.status}
 *                 </li>
 *             ))}
 *         </ul>
 *     );
 * }
 *
 * @example
 * // Update step progress
 * function useWorkflowStep() {
 *     const { setStepProgress, updateFromStep } = useExportContext();
 *
 *     const runStep = async (stepId) => {
 *         updateFromStep(stepId);
 *         setStepProgress(stepId, 50);
 *         await doWork();
 *         setStepProgress(stepId, 100);
 *     };
 *
 *     return { runStep };
 * }
 */
function useExportContext() {
  const context = (0,external_wp_element_namespaceObject.useContext)(ExportContext);
  if (!context) {
    throw new Error('useExportContext must be used within an ExportProvider');
  }
  return context;
}
/* harmony default export */ const hooks_useExportContext = ((/* unused pure expression or super */ null && (useExportContext)));
;// ./assets/src/export/hooks/useExportState.js
/**
 * Publish State Hook
 *
 * Wrapper hook that provides export state from ExportContext.
 * Delegates to centralized state management.
 *
 */



/**
 * Get export workflow state
 *
 * Returns all export state and operations from context.
 * Simplified from 202 lines to delegate to ExportContext.
 *
 * @return {Object} Publish state and operations
 */
function useExportState() {
  return useExportContext();
}
// EXTERNAL MODULE: ./assets/src/utils/api.js
var utils_api = __webpack_require__(444);
;// ./node_modules/idb/build/index.js
const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const transactionDoneMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    // This mapping exists in reverseTransformCache but doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(this.request);
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */
function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event));
    }
    return wrap(request).then(() => undefined);
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap = {};
const advanceResults = new WeakMap();
const ittrProxiedCursorToOriginalProxy = new WeakMap();
const cursorIteratorTraps = {
    get(target, prop) {
        if (!advanceMethodProps.includes(prop))
            return target[prop];
        let cachedFunc = methodMap[prop];
        if (!cachedFunc) {
            cachedFunc = methodMap[prop] = function (...args) {
                advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
            };
        }
        return cachedFunc;
    },
};
async function* iterate(...args) {
    // tslint:disable-next-line:no-this-assignment
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
        cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
        return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    // Map this double-proxy back to the original, so other cursor methods work.
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
        yield proxiedCursor;
        // If one of the advancing methods was not called, call continue().
        cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
        advanceResults.delete(proxiedCursor);
    }
}
function isIteratorProp(target, prop) {
    return ((prop === Symbol.asyncIterator &&
        instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        (prop === 'iterate' && instanceOfAny(target, [IDBIndex, IDBObjectStore])));
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
        if (isIteratorProp(target, prop))
            return iterate;
        return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
        return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    },
}));



;// ./assets/src/utils/indexedDB.js
/**
 * IndexedDB Wrapper - Abstract storage interface for browser persistent storage
 *
 * Uses the `idb` library (by Jake Archibald) as a foundation, providing a
 * simple, promise-based API for storing data in IndexedDB.
 *
 * Works in all modern browsers including WordPress Playground WASM environment.
 *
 * Features:
 * - Simple key-value storage interface
 * - Automatic database initialization
 * - Promise-based async API
 * - Error handling and quota management
 * - Support for multiple stores and indexes
 * - Automatic cleanup of expired data
 * - Built on battle-tested `idb` library (9.8M weekly downloads)
 */

/* global indexedDB, IDBKeyRange */



/**
 * IndexedDB database instance cache
 * Stores opened database connections to avoid repeated initialization
 */
const dbInstances = new Map();

/**
 * Default database configuration
 */
const DEFAULT_CONFIG = {
  dbName: 'aether-site-exporter',
  version: 1,
  stores: {
    cache: {
      keyPath: 'key',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'type',
        keyPath: 'type',
        unique: false
      }]
    }
  }
};

/**
 * Open IndexedDB database with configuration using idb library
 *
 * @param {Object} config         - Database configuration
 * @param {string} config.dbName  - Database name
 * @param {number} config.version - Database version
 * @param {Object} config.stores  - Object stores configuration
 * @return {Promise<Object>} Database instance
 */
async function openDatabase(config = DEFAULT_CONFIG) {
  const cacheKey = `${config.dbName}_v${config.version}`;

  // Return cached instance if available
  if (dbInstances.has(cacheKey)) {
    return dbInstances.get(cacheKey);
  }
  try {
    const db = await openDB(config.dbName, config.version, {
      upgrade(database) {
        // Create object stores based on configuration
        Object.entries(config.stores).forEach(([storeName, storeConfig]) => {
          // Delete existing store if it exists (for upgrades)
          if (database.objectStoreNames.contains(storeName)) {
            database.deleteObjectStore(storeName);
          }

          // Create new store
          const store = database.createObjectStore(storeName, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement || false
          });

          // Create indexes
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique || false
              });
            });
          }
        });
      }
    });
    dbInstances.set(cacheKey, db);
    return db;
  } catch (error) {
    throw new Error(`Failed to open IndexedDB: ${error.message || 'Unknown error'}`);
  }
}

/**
 * IndexedDB Store - Abstract interface for a single object store
 *
 * Provides a simple key-value API on top of idb library
 */
class IndexedDBStore {
  /**
   * Constructor
   *
   * @param {string} storeName - Name of the object store
   * @param {Object} config    - Database configuration (optional)
   */
  constructor(storeName, config = DEFAULT_CONFIG) {
    this.storeName = storeName;
    this.config = config;
    this.db = null;
    // Get the keyPath for this store from config
    this.keyPath = config.stores?.[storeName]?.keyPath || DEFAULT_CONFIG.stores.cache.keyPath;
  }

  /**
   * Ensure database is initialized
   *
   * @return {Promise<Object>} Database instance
   */
  async ensureDatabase() {
    if (!this.db) {
      this.db = await openDatabase(this.config);
    }
    return this.db;
  }

  /**
   * Get a value by key
   *
   * @param {string|number} key - The key to retrieve
   * @return {Promise<any|null>} The stored value or null if not found
   */
  async get(key) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.get(this.storeName, key);
      return result || null;
    } catch (error) {
      console.error(`[IndexedDB] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Get all values from the store
   *
   * @param {number} limit - Maximum number of items to return (optional)
   * @return {Promise<Array>} Array of all stored values
   */
  async getAll(limit = undefined) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAll(this.storeName, undefined, limit);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all values:', error);
      return [];
    }
  }

  /**
   * Get all keys from the store
   *
   * @return {Promise<Array>} Array of all keys
   */
  async getAllKeys() {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAllKeys(this.storeName);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Set a value by key
   *
   * @param {string|number} key      - The key to set
   * @param {any}           value    - The value to store
   * @param {Object}        metadata - Additional metadata (optional)
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async set(key, value, metadata = {}) {
    try {
      const db = await this.ensureDatabase();

      // For object values, spread properties; for primitives, use value property
      const valueData = typeof value === 'object' && value !== null ? {
        ...value
      } : {
        value
      };
      const data = {
        [this.keyPath]: key,
        ...valueData,
        timestamp: Date.now(),
        ...metadata
      };
      await db.put(this.storeName, data);
      return true;
    } catch (error) {
      // Check for quota exceeded error
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        console.warn('[IndexedDB] Storage quota exceeded. Consider cleaning up old data.');
      }
      console.error(`[IndexedDB] Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Delete a value by key
   *
   * @param {string|number} key - The key to delete
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async delete(key) {
    try {
      const db = await this.ensureDatabase();
      await db.delete(this.storeName, key);
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Error deleting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all data from the store
   *
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async clear() {
    try {
      const db = await this.ensureDatabase();
      await db.clear(this.storeName);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Error clearing store:', error);
      return false;
    }
  }

  /**
   * Count number of items in the store
   *
   * @return {Promise<number>} Number of items
   */
  async count() {
    try {
      const db = await this.ensureDatabase();
      const result = await db.count(this.storeName);
      return result || 0;
    } catch (error) {
      console.error('[IndexedDB] Error counting items:', error);
      return 0;
    }
  }

  /**
   * Get values by index
   *
   * @param {string} indexName  - Name of the index
   * @param {any}    indexValue - Value to search for in the index
   * @return {Promise<Array>} Array of matching values
   */
  async getByIndex(indexName, indexValue) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAllFromIndex(this.storeName, indexName, indexValue);
      return result || [];
    } catch (error) {
      console.error(`[IndexedDB] Error getting by index "${indexName}":`, error);
      return [];
    }
  }

  /**
   * Delete items older than specified age
   *
   * Uses the timestamp index to efficiently find and delete old items.
   *
   * @param {number} maxAgeMs - Maximum age in milliseconds
   * @return {Promise<number>} Number of items deleted
   */
  async deleteOlderThan(maxAgeMs) {
    try {
      const db = await this.ensureDatabase();
      const cutoffTime = Date.now() - maxAgeMs;

      // Use transaction for atomic delete operation
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('timestamp');
      let deletedCount = 0;

      // Get cursor for items with timestamp <= cutoffTime
      let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      while (cursor) {
        await cursor.delete();
        deletedCount++;
        cursor = await cursor.continue();
      }
      await tx.done;
      return deletedCount;
    } catch (error) {
      console.error('[IndexedDB] Error deleting old items:', error);
      return 0;
    }
  }

  /**
   * Get storage estimate (quota and usage)
   *
   * @return {Promise<Object>} Storage estimate with quota and usage
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          percentUsed: estimate.quota > 0 ? estimate.usage / estimate.quota * 100 : 0
        };
      } catch (error) {
        console.error('[IndexedDB] Error getting storage estimate:', error);
      }
    }
    return {
      quota: null,
      usage: null,
      percentUsed: null
    };
  }
}

/**
 * Check if IndexedDB is available
 *
 * @return {boolean} True if IndexedDB is supported
 */
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null && typeof openDB === 'function';
  } catch (error) {
    return false;
  }
}

/**
 * Delete entire database
 *
 * @param {string} dbName - Database name to delete
 * @return {Promise<boolean>} True if successful
 */
async function deleteDatabase(dbName) {
  try {
    // Remove from cache
    const cacheKeys = Array.from(dbInstances.keys()).filter(key => key.startsWith(dbName));
    cacheKeys.forEach(key => dbInstances.delete(key));

    // Delete database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message || 'Unknown error'}`));
    });
    return true;
  } catch (error) {
    console.error('[IndexedDB] Error deleting database:', error);
    return false;
  }
}
/* harmony default export */ const utils_indexedDB = (IndexedDBStore);
;// ./assets/src/utils/wporgCache.js
/**
 * WordPress.org API Cache - Persistent cache for WordPress.org existence checks
 *
 * Caches WordPress.org plugin/theme existence checks in IndexedDB with 7-day expiration.
 * Provides 3-15 second performance improvement per export by eliminating redundant API calls.
 *
 * Features:
 * - Persistent storage across browser sessions
 * - 7-day cache expiration
 * - In-memory L1 cache for current session
 * - Automatic cleanup of expired entries
 * - Works in WordPress Playground WASM environment
 */



/**
 * Cache configuration
 */
const WPORG_CACHE_CONFIG = {
  dbName: 'aether-wporg-cache',
  version: 1,
  stores: {
    wporgChecks: {
      keyPath: 'cacheKey',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'type',
        keyPath: 'type',
        unique: false
      }]
    }
  }
};

/**
 * Cache expiration time (7 days)
 * WordPress.org plugins/themes don't change frequently, so 7 days is safe
 */
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * WordPress.org Cache Manager
 *
 * Provides persistent caching of WordPress.org existence checks
 */
class WpOrgCache {
  /**
   * Constructor
   */
  constructor() {
    this.store = new utils_indexedDB('wporgChecks', WPORG_CACHE_CONFIG);
    this.memoryCache = new Map(); // L1 cache for current session
    this.cleanupPromise = null; // Track cleanup to avoid concurrent runs
  }

  /**
   * Generate cache key
   *
   * @param {string} slug - Plugin/theme slug
   * @param {string} type - 'plugin' or 'theme'
   * @return {string} Cache key
   */
  getCacheKey(slug, type) {
    return `${type}:${slug}`;
  }

  /**
   * Get cached existence check result
   *
   * Checks memory cache first, then IndexedDB
   *
   * @param {string} slug - Plugin/theme slug
   * @param {string} type - 'plugin' or 'theme'
   * @return {Promise<boolean|null>} Cached result or null if not found/expired
   */
  async get(slug, type) {
    const cacheKey = this.getCacheKey(slug, type);

    // L1: Check memory cache first (instant)
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // L2: Check IndexedDB
    try {
      const cached = await this.store.get(cacheKey);

      // Check if cache entry exists and is not expired
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_EXPIRATION_MS) {
          // Valid cache hit - store in memory for faster access
          this.memoryCache.set(cacheKey, cached.exists);
          return cached.exists;
        }

        // Cache expired - delete it
        await this.store.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[WpOrgCache] Error getting cache for ${cacheKey}:`, error);
    }
    return null; // Cache miss or error
  }

  /**
   * Set cached existence check result
   *
   * Stores in both memory and IndexedDB
   *
   * @param {string}  slug   - Plugin/theme slug
   * @param {string}  type   - 'plugin' or 'theme'
   * @param {boolean} exists - Whether the asset exists on WordPress.org
   * @return {Promise<boolean>} True if successfully cached
   */
  async set(slug, type, exists) {
    const cacheKey = this.getCacheKey(slug, type);

    // L1: Store in memory
    this.memoryCache.set(cacheKey, exists);

    // L2: Store in IndexedDB
    try {
      await this.store.set(cacheKey, {
        exists
      }, {
        type,
        slug
      });
      return true;
    } catch (error) {
      console.error(`[WpOrgCache] Error setting cache for ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired cache entries
   *
   * Runs automatically on initialization, removes entries older than 7 days
   *
   * @return {Promise<number>} Number of entries cleaned up
   */
  async cleanup() {
    // Prevent concurrent cleanup runs
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }
    this.cleanupPromise = (async () => {
      try {
        const deleted = await this.store.deleteOlderThan(CACHE_EXPIRATION_MS);

        // Cleaned up expired cache entries

        return deleted;
      } catch (error) {
        return 0;
      } finally {
        this.cleanupPromise = null;
      }
    })();
    return this.cleanupPromise;
  }

  /**
   * Clear all cached data
   *
   * @return {Promise<boolean>} True if successful
   */
  async clear() {
    this.memoryCache.clear();
    return this.store.clear();
  }

  /**
   * Get cache statistics
   *
   * @return {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const totalCount = await this.store.count();
      const memoryCount = this.memoryCache.size;
      return {
        totalCached: totalCount,
        memoryCached: memoryCount,
        hitRate: null // Would require tracking hits/misses
      };
    } catch (error) {
      console.error('[WpOrgCache] Error getting stats:', error);
      return {
        totalCached: 0,
        memoryCached: this.memoryCache.size,
        hitRate: null
      };
    }
  }
}

// Create singleton instance
let cacheInstance = null;

/**
 * Get WordPress.org cache instance (singleton)
 *
 * @return {WpOrgCache} Cache instance
 */
function getWpOrgCache() {
  if (!cacheInstance) {
    cacheInstance = new WpOrgCache();

    // Run cleanup on first initialization
    cacheInstance.cleanup().catch(error => {
      console.error('[WpOrgCache] Initial cleanup failed:', error);
    });
  }
  return cacheInstance;
}
/* harmony default export */ const wporgCache = ((/* unused pure expression or super */ null && (getWpOrgCache)));
;// ./assets/src/services/AssetDiscoveryService.js
/**
 * Asset Discovery Service
 *
 * Pure functions and service class for discovering and categorizing WordPress assets.
 * Extracted from useAssetDiscovery hook for better testability.
 *
 */

/**
 * Normalize plugin slug to directory name only.
 * WordPress stores plugins as 'akismet/akismet.php' but WordPress.org expects just 'akismet'.
 *
 * @param {string} slug - Plugin slug (may include file path)
 * @return {string} Normalized slug (directory name only)
 */
function normalizePluginSlug(slug) {
  if (slug.includes('/')) {
    return slug.split('/')[0];
  }
  return slug;
}

/**
 * Filter assets to only active ones.
 *
 * @param {Array<Object>} assets Array of asset objects with is_active property.
 * @return {Array<Object>} Only active assets.
 */
function filterActiveAssets(assets) {
  return assets.filter(asset => asset.is_active);
}

/**
 * Get active theme from themes array.
 *
 * @param {Array<Object>} themes Array of theme objects.
 * @return {Object|null} Active theme or null if none found.
 */
function getActiveTheme(themes) {
  return themes.find(theme => theme.is_active) || null;
}

/**
 * Filter assets by WordPress.org status.
 *
 * @param {Array<Object>} assets    Array of assets with from_wporg property.
 * @param {boolean}       fromWpOrg True to get WordPress.org assets, false for custom.
 * @return {Array<Object>} Filtered assets.
 */
function filterByWpOrgStatus(assets, fromWpOrg) {
  return assets.filter(asset => asset.from_wporg === fromWpOrg);
}

/**
 * Filter out built-in Playground plugins.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @return {Array<Object>} Plugins excluding built-in ones.
 */
function filterBuiltInPlugins(plugins) {
  const builtInSlugs = ['aether', 'sqlite-database-integration'];
  return plugins.filter(plugin => !builtInSlugs.includes(normalizePluginSlug(plugin.slug)));
}

/**
 * Transform asset to custom asset format.
 *
 * @param {Object} asset Asset object with assetType, slug, name, version.
 * @return {Object} Custom asset format.
 */
function toCustomAssetFormat(asset) {
  return {
    type: asset.assetType,
    slug: asset.slug,
    name: asset.name,
    version: asset.version
  };
}

/**
 * Transform asset to blueprint slug format.
 *
 * @param {Object} asset Asset object with slug.
 * @return {string} Normalized slug.
 */
function toBlueprintSlugFormat(asset) {
  return normalizePluginSlug(asset.slug);
}

/**
 * Combine plugins and themes with asset type tag.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @param {Array<Object>} themes  Array of theme objects.
 * @return {Array<Object>} Combined array with assetType property.
 */
function combineAssetsWithType(plugins, themes) {
  return [...plugins.map(p => ({
    ...p,
    assetType: 'plugin'
  })), ...themes.map(t => ({
    ...t,
    assetType: 'theme'
  }))];
}

/**
 * Get site name from globals.
 * Separated as pure function for testability.
 *
 * @return {string} Site name from window.wp.siteName or document.title or empty string.
 */
function getSiteName() {
  if (typeof window !== 'undefined' && window.wp && window.wp.siteName) {
    return window.wp.siteName;
  }
  if (typeof document !== 'undefined' && document.title) {
    return document.title;
  }
  return '';
}

/**
 * Asset Discovery Service
 *
 * Service class for discovering and categorizing WordPress assets.
 * Uses dependency injection for testability.
 */
class AssetDiscoveryService {
  /**
   * @param {Function} apiFetch      WordPress apiFetch function.
   * @param {Function} checkWpOrg    Function to check if asset is from WordPress.org.
   * @param {Object}   wporgCache    WordPress.org cache instance.
   * @param {Function} getSiteNameFn Function to get site name (optional, defaults to getSiteName).
   */
  constructor(apiFetch, checkWpOrg, wporgCache, getSiteNameFn = null) {
    this.apiFetch = apiFetch;
    this.checkWpOrg = checkWpOrg;
    this.wporgCache = wporgCache;
    this.getSiteName = getSiteNameFn || getSiteName;
  }

  /**
   * Get all installed plugins and themes with metadata from REST API.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays.
   */
  async getInstalledAssets() {
    try {
      const response = await this.apiFetch({
        path: '/aether/site-exporter/assets',
        method: 'GET'
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assets');
      }
      return {
        plugins: response.plugins || [],
        themes: response.themes || []
      };
    } catch (error) {
      return {
        plugins: [],
        themes: []
      };
    }
  }

  /**
   * Get plugin configuration from window.aetherData.
   *
   * Configuration was previously fetched from REST API endpoint /config,
   * but that endpoint was removed in favor of reading from window.aetherData
   * which is injected by PHP.
   *
   * @return {Promise<Object>} Configuration object.
   */
  async getConfig() {
    // Read config from window.aetherData (injected by PHP).
    if (typeof window !== 'undefined' && window.aetherData) {
      return {
        publicUrl: window.aetherData.publicUrl || '',
        adminUrl: window.aetherData.adminUrl || ''
        // Note: wporgCheckMethod and corsProxyUrl are not needed
        // because the JS code uses hardcoded defaults ('cors-proxy' with fallback to 'direct')
      };
    }

    // Fallback if window.aetherData is not available.
    return {
      publicUrl: '',
      adminUrl: ''
    };
  }

  /**
   * Check all assets against WordPress.org in parallel.
   *
   * @param {Array<Object>} items  Array of items with slug and assetType.
   * @param {Object}        config Configuration object for WordPress.org check.
   * @return {Promise<Array<Object>>} Assets with from_wporg property added.
   */
  async checkAssetsAgainstWpOrg(items, config) {
    return Promise.all(items.map(async item => {
      const fromWpOrg = await this.checkWpOrg(item.slug, item.assetType, config);
      return {
        ...item,
        from_wporg: fromWpOrg
      };
    }));
  }

  /**
   * Discover all custom assets (not from WordPress.org).
   *
   * @return {Promise<Array<Object>>} Array of custom assets.
   */
  async discoverCustomAssets() {
    const config = await this.getConfig();
    const {
      plugins,
      themes
    } = await this.getInstalledAssets();
    const activePlugins = filterActiveAssets(plugins);
    const activeTheme = getActiveTheme(themes);
    const activeThemes = activeTheme ? [activeTheme] : [];
    const items = combineAssetsWithType(activePlugins, activeThemes);
    const allAssets = await this.checkAssetsAgainstWpOrg(items, config);
    const customAssets = filterByWpOrgStatus(allAssets, false);
    return customAssets.map(toCustomAssetFormat);
  }

  /**
   * Get WordPress.org assets for blueprint generation.
   *
   * Returns only active plugins/themes from WordPress.org.
   * Custom assets will be included in wp-content.zip.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays.
   */
  async getBlueprintAssets() {
    const config = await this.getConfig();
    const {
      plugins,
      themes
    } = await this.getInstalledAssets();
    const activePlugins = filterActiveAssets(plugins);
    const activeTheme = getActiveTheme(themes);
    const activeThemes = activeTheme ? [activeTheme] : [];
    const items = combineAssetsWithType(activePlugins, activeThemes);
    const allAssets = await this.checkAssetsAgainstWpOrg(items, config);
    const wporgAssets = filterByWpOrgStatus(allAssets, true);
    const wporgPlugins = wporgAssets.filter(asset => asset.assetType === 'plugin').filter(plugin => filterBuiltInPlugins([plugin]).length > 0).map(toBlueprintSlugFormat);
    const wporgThemes = wporgAssets.filter(asset => asset.assetType === 'theme').map(toBlueprintSlugFormat);
    return {
      plugins: wporgPlugins,
      themes: wporgThemes,
      siteName: this.getSiteName()
    };
  }
}
;// ./assets/src/utils/useAssetDiscovery.js
/**
 * Asset Discovery Hook
 *
 * Browser-based implementation for WordPress.org asset detection.
 * Detects WordPress.org plugins/themes by checking wordpress.org APIs.
 *
 */







// Re-export normalizePluginSlug


/**
 * Check if a plugin or theme exists on WordPress.org
 *
 * Uses browser-based method (default: CORS proxy) to check WordPress.org.
 * Can be switched to direct API calls via config.
 *
 * @param {string} slug   - Plugin or theme slug (will be normalized for plugins)
 * @param {string} type   - 'plugin' or 'theme'
 * @param {Object} config - Configuration object with wporgCheckMethod and corsProxyUrl
 * @return {Promise<boolean>} True if asset exists on WordPress.org
 */
async function isFromWordPressOrg(slug, type, config = {}) {
  // Normalize plugin slugs (remove file path if present)
  // Example: 'akismet/akismet.php' -> 'akismet'
  const normalizedSlug = type === 'plugin' ? normalizePluginSlug(slug) : slug;

  // Check persistent cache first (IndexedDB + memory)
  const cache = getWpOrgCache();
  const cached = await cache.get(normalizedSlug, type);
  if (cached !== null) {
    return cached;
  }

  // Try CORS proxy method first, then fallback to direct API calls
  let result = await checkWithMethod(normalizedSlug, type, 'cors-proxy', config);

  // If CORS proxy method returned null (unable to check), try direct API fallback
  if (result === null) {
    result = await checkWithMethod(normalizedSlug, type, 'direct', config);
  }

  // If still null after fallback, treat as false
  if (result === null) {
    result = false;
  }

  // Cache the result (only if we got a definitive answer)
  if (result !== null) {
    await cache.set(normalizedSlug, type, result);
  }
  return result;
}

/**
 * Check WordPress.org using specific method
 *
 * @param {string} slug   - Normalized plugin/theme slug
 * @param {string} type   - 'plugin' or 'theme'
 * @param {string} method - 'cors-proxy' or 'direct'
 * @param {Object} config - Configuration object
 * @return {Promise<boolean|null>} True if exists, false if doesn't exist, null if unable to check
 */
async function checkWithMethod(slug, type, method, config = {}) {
  try {
    let checkUrl;
    switch (method) {
      case 'cors-proxy':
        // Use external CORS proxy (e.g., cfp.s12y.org or custom worker)
        checkUrl = config.corsProxyUrl || 'https://cfp.s12y.org/check-wporg';
        checkUrl += `?slug=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}`;
        break;
      case 'direct':
      default:
        // Direct WordPress.org API calls (may fail in some browsers due to CORS)
        if (type === 'theme') {
          checkUrl = `https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=${encodeURIComponent(slug)}`;
        } else {
          checkUrl = `https://api.wordpress.org/plugins/info/1.0/${encodeURIComponent(slug)}.json`;
        }
        break;
    }

    // Use plain fetch for all methods (browser-based checking)
    const response = await fetch(checkUrl);
    if (!response.ok) {
      throw new Error(`WordPress.org check returned ${response.status}`);
    }
    const data = await response.json();

    // Handle different response formats
    let exists;
    if (method === 'direct') {
      // Direct WordPress.org API: check for 'error' field
      exists = !data.error && (data.slug || data.name);
    } else {
      // CORS proxy: standardized response with 'success' and 'exists' fields
      if (!data.success) {
        throw new Error(data.error || (0,external_wp_i18n_namespaceObject.__)('Unknown error', 'aether-site-exporter'));
      }
      exists = data.exists;
    }

    // Return the result (could be true, false, or null)
    // null means "unable to check" and should trigger fallback
    return exists;
  } catch (error) {
    // Network/API error - return null to indicate unable to check
    return null;
  }
}

/**
 * Asset Discovery Hook
 *
 * Provides methods to discover and categorize installed plugins/themes.
 * Uses AssetDiscoveryService for business logic.
 *
 * @return {Object} Hook methods and state
 */
function useAssetDiscovery() {
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);

  // Create service instance with dependencies
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new AssetDiscoveryService(utils_api/* default */.Ay, isFromWordPressOrg, getWpOrgCache()), []);

  /**
   * Discover all custom assets (not from WordPress.org)
   *
   * @return {Promise<Array<Object>>} Array of custom assets
   */
  const discoverCustomAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const customAssets = await service.discoverCustomAssets();
      setLoading(false);
      return customAssets;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [service]);

  /**
   * Get WordPress.org assets for blueprint generation
   *
   * Returns only active plugins/themes from WordPress.org.
   * Custom assets will be included in wp-content.zip.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays
   */
  const getBlueprintAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const blueprintAssets = await service.getBlueprintAssets();
      setLoading(false);
      return blueprintAssets;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [service]);
  return {
    discoverCustomAssets,
    getBlueprintAssets,
    loading,
    error
  };
}
;// ./assets/src/utils/storage.js
/**
 * Storage Abstraction Layer
 *
 * Provides a testable abstraction over localStorage with:
 * - Automatic JSON serialization/deserialization
 * - Error handling for quota exceeded and other errors
 * - Consistent API that can be easily mocked in tests
 * - Support for default values
 *
 */

/**
 * Storage abstraction object.
 *
 * @type {Object}
 */
const storage = {
  /**
   * Get a value from storage.
   *
   * @param {string} key          Storage key.
   * @param {*}      defaultValue Optional default value if key doesn't exist or parse fails.
   * @return {*} Parsed value, default value, or null.
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // If JSON parsing fails, return default value
        return defaultValue;
      }
    } catch (error) {
      // Handle localStorage access errors
      return defaultValue;
    }
  },
  /**
   * Set a value in storage.
   *
   * @param {string} key   Storage key.
   * @param {*}      value Value to store (will be JSON serialized).
   * @return {boolean} True on success, false on error.
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Handle quota exceeded, circular references, or other errors
      return false;
    }
  },
  /**
   * Remove a value from storage.
   *
   * @param {string} key Storage key.
   * @return {boolean} True on success, false on error.
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },
  /**
   * Clear all storage.
   *
   * @return {boolean} True on success, false on error.
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  },
  /**
   * Check if a key exists in storage.
   *
   * @param {string} key Storage key.
   * @return {boolean} True if key exists, false otherwise.
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  },
  /**
   * Get all keys in storage.
   *
   * @return {Array<string>} Array of storage keys.
   */
  keys() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      return [];
    }
  }
};
;// ./assets/src/constants/api.js
/**
 * API Constants
 *
 * Centralized API endpoints and configuration for WordPress REST API
 *
 */

/**
 * WordPress REST API namespace for Aether plugin
 * @constant {string}
 */
const API_NAMESPACE = 'aether/site-exporter';

/**
 * Base path for all Aether REST API endpoints
 * Note: Does not include /wp-json/ prefix as that's handled by apiFetch root URL middleware
 * @constant {string}
 */
const API_BASE_PATH = `/${API_NAMESPACE}`;

/**
 * REST API Endpoints
 *
 * All WordPress REST API endpoints used throughout the application.
 * Use these constants instead of hardcoded strings.
 */
const ENDPOINTS = {
  /**
   * Settings endpoints
   */
  SETTINGS: `${API_BASE_PATH}/settings`,
  SETTINGS_GET: `${API_BASE_PATH}/settings`,
  SETTINGS_UPDATE: `${API_BASE_PATH}/settings`,
  /**
   * Export workflow endpoints (formerly publish)
   */
  EXPORT_WORKFLOW: {
    START: `${API_BASE_PATH}/export`,
    STATUS: `${API_BASE_PATH}/export/status`,
    STEPS: `${API_BASE_PATH}/export/steps`,
    STEP: stepId => `${API_BASE_PATH}/export/steps/${stepId}`,
    CANCEL: `${API_BASE_PATH}/export/cancel`,
    CREATE_ARCHIVE: `${API_BASE_PATH}/export/createArchive`,
    GENERATE_BLUEPRINT_BUNDLE: `${API_BASE_PATH}/export/generateBlueprintBundle`
  },
  /**
   * Provider endpoints
   */
  PROVIDERS: {
    CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    SAVE_CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    DELETE_CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    STATUS: providerId => `${API_BASE_PATH}/providers/${providerId}/status`
  },
  /**
   * Blueprint endpoints
   * Note: Blueprint generation is now handled client-side via useBlueprintGenerator hook
   */
  BLUEPRINT: {
    GET: `${API_BASE_PATH}/blueprint`
  },
  /**
   * Export endpoints
   */
  EXPORT: {
    START: `${API_BASE_PATH}/export/start`,
    STATUS: `${API_BASE_PATH}/export/status`,
    DOWNLOAD: `${API_BASE_PATH}/export/download`
  },
  /**
   * Configuration endpoints
   */
  CONFIG: {
    UPDATE: `${API_BASE_PATH}/config`,
    RESET: `${API_BASE_PATH}/config/reset`
  },
  /**
   * Static site endpoints
   */
  STATIC_SITE: {
    URLS: `${API_BASE_PATH}/static-site/urls`,
    GENERATE: `${API_BASE_PATH}/static-site/generate`
  },
  /**
   * Asset management endpoints
   * Note: Asset discovery now handled by useAssetDiscovery.js hook (browser-based)
   * These endpoints have been removed as they made HTTP requests that fail in WordPress Playground
   */
  ASSETS: {
    EXTRACT: `${API_BASE_PATH}/assets/extract`
  },
  /**
   * Usage statistics endpoints
   */
  USAGE: {
    SUMMARY: `${API_BASE_PATH}/usage/summary`,
    DETAILS: `${API_BASE_PATH}/usage/details`
  }
};

/**
 * HTTP Methods
 * @constant {Object}
 */
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

/**
 * API Request Headers
 * @constant {Object}
 */
const API_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded'
};

/**
 * API Response Status Codes
 * @constant {Object}
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};
;// ./assets/src/constants/index.js
/**
 * Constants Index
 *
 * Central export point for all application constants.
 * Import from this file for convenience:
 *
 * @example
 * import { ENDPOINTS, POLLING_INTERVAL } from '../constants';
 */

// API Constants


// Timing Constants

;// ./assets/src/services/ExportAPIService.js
/**
 * Publish API Service
 *
 * Service for export-related API operations.
 * Extracted from useExportAPI hook for testability.
 *
 */


const CHANGED_ASSETS_KEY = 'aether_changed_assets';

/**
 * Publish API Service Class
 *
 * Handles export-related API calls and asset tracking.
 */
class ExportAPIService {
  /**
   * Create service instance
   *
   * @param {Function} apiFetch       WordPress apiFetch function (injectable for testing)
   * @param {Object}   assetDiscovery Asset discovery service
   * @param {Object}   storage        Storage implementation (injectable for testing)
   */
  constructor(apiFetch, assetDiscovery, storage) {
    this.apiFetch = apiFetch;
    this.assetDiscovery = assetDiscovery;
    this.storage = storage;
  }

  /**
   * Discover custom assets
   *
   * Uses browser-based asset discovery instead of PHP endpoint.
   * This avoids HTTP requests that fail in WordPress Playground.
   *
   * @return {Promise<Object>} Discovery response with assets array
   */
  async discoverBlueprintBundleAssets() {
    const customAssets = await this.assetDiscovery.discoverCustomAssets();
    return {
      success: true,
      assets: customAssets,
      count: customAssets.length
    };
  }

  /**
   * Mark asset as changed
   *
   * Stores changed assets in localStorage.
   * No server call needed - browser-only tracking.
   *
   * @param {string} type Asset type (theme, plugin)
   * @param {string} slug Asset slug
   * @return {Object} Success response
   */
  markAssetChanged(type, slug) {
    // Get current changed assets
    const changedAssets = this.storage.get(CHANGED_ASSETS_KEY, []);
    const key = `${type}:${slug}`;

    // Add if not already present
    if (!changedAssets.includes(key)) {
      changedAssets.push(key);
      this.storage.set(CHANGED_ASSETS_KEY, changedAssets);
    }
    return {
      success: true,
      message: `Marked ${type} ${slug} as changed`
    };
  }

  /**
   * Fetch all pages of a paginated URL endpoint.
   *
   * @param {string}   endpoint       API endpoint path.
   * @param {Function} onPageComplete Optional callback after each page.
   * @return {Promise<Array>} All URLs from all pages.
   */
  async fetchAllPaginatedUrls(endpoint, onPageComplete = null) {
    const allUrls = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const response = await this.apiFetch({
        path: `${endpoint}?page=${page}`,
        method: 'GET'
      });
      if (!response.success) {
        throw new Error(response.message || `Failed to fetch URLs from ${endpoint}`);
      }
      allUrls.push(...(response.urls || []));
      hasMore = response.hasMore;
      page = response.nextPage || page + 1;
      if (onPageComplete) {
        onPageComplete({
          page: page - 1,
          urlsCount: allUrls.length,
          total: response.total,
          hasMore
        });
      }
    }
    return allUrls;
  }

  /**
   * Discover URLs for static site generation
   *
   * Calls paginated REST API endpoints to discover all URLs that need to be fetched.
   * Fetches posts, terms, authors, and archives in parallel where possible.
   *
   * @param {Function} onProgress Optional callback for progress updates.
   * @return {Promise<Object>} Response with urls array and staticSiteUrl
   */
  async discoverUrls(onProgress = null) {
    try {
      const allUrls = [];
      const types = ['posts', 'terms', 'authors', 'archives'];

      // Fetch each type sequentially to avoid overwhelming the server
      for (const type of types) {
        if (onProgress) {
          onProgress({
            type,
            status: 'fetching'
          });
        }
        const urls = await this.fetchAllPaginatedUrls(`/aether/site-exporter/urls/${type}`, onProgress ? progress => onProgress({
          type,
          ...progress
        }) : null);
        allUrls.push(...urls);
        if (onProgress) {
          onProgress({
            type,
            status: 'complete',
            count: urls.length
          });
        }
      }

      // Deduplicate URLs
      const uniqueUrls = [...new Set(allUrls)];
      return {
        success: true,
        urls: uniqueUrls,
        staticSiteUrl: null // Will be determined by provider config
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to discover URLs',
        urls: [],
        staticSiteUrl: null
      };
    }
  }

  /**
   * Create site archive
   *
   * Creates wp-content.zip containing custom plugins, themes, and uploads.
   *
   * @param {Object}  options                Archive creation options.
   * @param {Array}   options.assets         Array of asset objects to include.
   * @param {boolean} options.includeUploads Whether to include uploads directory.
   * @return {Promise<Object>} Response with zipPath, zipUrl, and zipSize
   */
  async createArchive({
    assets = [],
    includeUploads = true
  } = {}) {
    try {
      // Extract slugs from assets array
      const customAssets = assets.map(asset => asset.slug || asset);
      const response = await this.apiFetch({
        path: ENDPOINTS.EXPORT_WORKFLOW.CREATE_ARCHIVE,
        method: 'POST',
        data: {
          custom_assets: customAssets,
          include_uploads: includeUploads
        }
      });
      if (response.success && response.data) {
        // The PHP endpoint returns data in a 'data' property
        const archiveData = response.data;
        return {
          success: true,
          zipPath: archiveData.zipPath || null,
          zipUrl: archiveData.zipUrl || null,
          zipSize: archiveData.zipSize || 0
        };
      }
      return {
        success: false,
        message: response.message || 'Failed to create archive'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create archive'
      };
    }
  }

  /**
   * Generate blueprint JSON
   *
   * This is typically handled client-side via generateBlueprintJson function.
   * This method is a fallback if the function is not available.
   *
   * @return {Promise<Object>} Response with blueprint data
   */
  async generateBlueprint() {
    // This is a fallback method - typically blueprint generation is done client-side
    // via the generateBlueprintJson function from useBlueprintGenerator hook
    return {
      success: false,
      message: 'Blueprint generation must be done client-side. Please ensure generateBlueprintJson function is available.'
    };
  }

  /**
   * Create blueprint bundle
   *
   * Creates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
   *
   * @param {Object} options                  Bundle creation options.
   * @param {Object} options.blueprint        Blueprint JSON data.
   * @param {string} options.wpContentZipPath Path to wp-content.zip.
   * @return {Promise<Object>} Response with bundlePath, bundleUrl, and bundleSize
   */
  async createBlueprintBundle({
    blueprint,
    wpContentZipPath
  } = {}) {
    try {
      if (!blueprint) {
        return {
          success: false,
          message: 'Blueprint data is required'
        };
      }
      if (!wpContentZipPath) {
        return {
          success: false,
          message: 'Archive path is required'
        };
      }
      const response = await this.apiFetch({
        path: ENDPOINTS.EXPORT_WORKFLOW.GENERATE_BLUEPRINT_BUNDLE,
        method: 'POST',
        data: {
          blueprintData: blueprint,
          archiveResult: {
            zipPath: wpContentZipPath
          }
        }
      });
      if (response.success && response.data) {
        // The PHP endpoint returns data in a 'data' property
        const bundleData = response.data;
        return {
          success: true,
          bundlePath: bundleData.bundlePath || null,
          bundleUrl: bundleData.bundleUrl || null,
          bundleSize: bundleData.bundleSize || 0
        };
      }
      return {
        success: false,
        message: response.message || 'Failed to create blueprint bundle'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create blueprint bundle'
      };
    }
  }
}
;// ./assets/src/export/hooks/useExportAPI.js
/**
 * Publish API Hook
 *
 * Handles API calls for export operations.
 * Uses ExportAPIService for all business logic.
 *
 */






function useExportAPI() {
  const assetDiscovery = useAssetDiscovery();

  // Create service instance (memoized to prevent recreation)
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new ExportAPIService(utils_api/* default */.Ay, assetDiscovery, storage), [assetDiscovery]);
  const discoverBlueprintBundleAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverBlueprintBundleAssets();
  }, [service]);

  // getAssetStatus is an alias for discoverBlueprintBundleAssets (eliminates duplication)
  const getAssetStatus = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverBlueprintBundleAssets();
  }, [service]);
  const markAssetChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    return Promise.resolve(service.markAssetChanged(type, slug));
  }, [service]);
  const discoverUrls = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverUrls();
  }, [service]);
  const createArchive = (0,external_wp_element_namespaceObject.useCallback)(async options => {
    return await service.createArchive(options);
  }, [service]);
  const generateBlueprint = (0,external_wp_element_namespaceObject.useCallback)(async options => {
    return await service.generateBlueprint(options);
  }, [service]);
  const createBlueprintBundle = (0,external_wp_element_namespaceObject.useCallback)(async options => {
    return await service.createBlueprintBundle(options);
  }, [service]);
  return {
    discoverBlueprintBundleAssets,
    getAssetStatus,
    markAssetChanged,
    discoverUrls,
    createArchive,
    generateBlueprint,
    createBlueprintBundle
  };
}
;// ./assets/src/services/AssetManagerService.js
/**
 * Asset Manager Service
 *
 * Service for managing asset state with pure business logic.
 * Extracted from useAssetManager hook for testability.
 *
 */

const STORAGE_KEY = 'aetherAssets';

/**
 * Normalize asset data from server
 *
 * Converts snake_case fields to camelCase and ensures existsOnR2 is present.
 * Pure function for data transformation.
 *
 * @param {Object} assetData Raw asset data from server
 * @return {Object} Normalized asset data
 */
function normalizeAssetData(assetData) {
  if (!assetData || typeof assetData !== 'object') {
    return {
      existsOnR2: false
    };
  }

  // eslint-disable-next-line camelcase
  const {
    exists_on_r2,
    existsOnR2,
    ...rest
  } = assetData;
  return {
    ...rest,
    // eslint-disable-next-line camelcase
    existsOnR2: existsOnR2 || exists_on_r2 || false
  };
}

/**
 * Calculate if asset needs upload
 *
 * Pure function to determine upload necessity based on R2 existence.
 *
 * @param {boolean} existsOnR2 Whether asset exists on R2
 * @return {boolean} Whether asset needs upload
 */
function calculateNeedsUpload(existsOnR2) {
  return !existsOnR2;
}

/**
 * Create new asset object
 *
 * Pure function for creating asset with consistent structure.
 *
 * @param {string}  type       Asset type (theme, plugin)
 * @param {string}  slug       Asset slug
 * @param {string}  name       Asset name (optional)
 * @param {boolean} existsOnR2 Whether asset exists on R2 (optional)
 * @return {Object} New asset object
 */
function createAsset(type, slug, name = undefined, existsOnR2 = false) {
  const asset = {
    type,
    slug,
    needsUpload: calculateNeedsUpload(existsOnR2)
  };
  if (name !== undefined) {
    asset.name = name;
  }
  if (existsOnR2 !== undefined) {
    asset.existsOnR2 = existsOnR2;
  }
  return asset;
}

/**
 * Merge asset data
 *
 * Pure function for merging existing asset with updated data.
 *
 * @param {Object}  existing                    Existing asset object
 * @param {Object}  updated                     Updated asset data
 * @param {Object}  options                     Merge options
 * @param {boolean} options.preserveNeedsUpload Preserve existing needsUpload flag
 * @return {Object} Merged asset
 */
function mergeAsset(existing, updated, options = {}) {
  const {
    preserveNeedsUpload = false
  } = options;

  // If no existing asset, treat updated as new
  if (!existing) {
    const normalized = normalizeAssetData(updated);
    return {
      ...normalized,
      needsUpload: calculateNeedsUpload(normalized.existsOnR2)
    };
  }

  // If no update, return existing
  if (!updated) {
    return existing;
  }

  // Normalize updated data
  const normalized = normalizeAssetData(updated);

  // Merge data
  const merged = {
    ...existing,
    ...normalized
  };

  // Calculate or preserve needsUpload
  if (preserveNeedsUpload && 'needsUpload' in existing) {
    merged.needsUpload = existing.needsUpload;
  } else if ('existsOnR2' in merged) {
    merged.needsUpload = calculateNeedsUpload(merged.existsOnR2);
  }
  return merged;
}

/**
 * Filter assets that need upload
 *
 * Pure function to extract changed assets as type:slug strings.
 *
 * @param {Object} assets Assets object
 * @return {Array<string>} Array of "type:slug" strings
 */
function filterChangedAssets(assets) {
  if (!assets || typeof assets !== 'object') {
    return [];
  }
  return Object.values(assets).filter(asset => asset && asset.needsUpload).map(asset => `${asset.type}:${asset.slug}`);
}

/**
 * Clear all upload flags
 *
 * Pure function to set needsUpload=false for all assets.
 *
 * @param {Object} assets Assets object
 * @return {Object} New assets object with cleared flags
 */
function clearAllUploadFlags(assets) {
  if (!assets || typeof assets !== 'object') {
    return {};
  }
  const cleared = {};
  Object.keys(assets).forEach(slug => {
    cleared[slug] = {
      ...assets[slug],
      needsUpload: false
    };
  });
  return cleared;
}

/**
 * Asset Manager Service Class
 *
 * Handles asset state operations with localStorage integration.
 */
class AssetManagerService {
  /**
   * Create service instance
   *
   * @param {Object} storage Storage implementation (injectable for testing)
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Load assets from storage
   *
   * @return {Object} Assets object
   */
  load() {
    return this.storage.get(STORAGE_KEY, {});
  }

  /**
   * Save assets to storage
   *
   * @param {Object} assets Assets to save
   * @return {void}
   */
  save(assets) {
    this.storage.set(STORAGE_KEY, assets);
  }

  /**
   * Mark asset as changed (needs upload)
   *
   * @param {Object} currentAssets Current assets state
   * @param {string} type          Asset type
   * @param {string} slug          Asset slug
   * @return {Object} Updated assets state
   */
  markAsChanged(currentAssets, type, slug) {
    const updated = {
      ...currentAssets
    };
    const existingAsset = updated[slug];
    updated[slug] = existingAsset ? {
      ...existingAsset,
      needsUpload: true
    } : createAsset(type, slug);
    return updated;
  }

  /**
   * Update asset from server data
   *
   * @param {Object} currentAssets Current assets state
   * @param {Object} assetData     Server asset data
   * @return {Object} Updated assets state
   */
  updateFromServer(currentAssets, assetData) {
    const normalized = normalizeAssetData(assetData);
    const {
      slug
    } = normalized;
    const updated = {
      ...currentAssets
    };
    const existingAsset = updated[slug];
    updated[slug] = mergeAsset(existingAsset, normalized);
    return updated;
  }

  /**
   * Sync multiple assets from server
   *
   * @param {Object} currentAssets Current assets state
   * @param {Array}  serverAssets  Array of server asset data
   * @return {Object} Updated assets state
   */
  syncWithServer(currentAssets, serverAssets) {
    if (!Array.isArray(serverAssets)) {
      return currentAssets;
    }
    const updated = {
      ...currentAssets
    };
    serverAssets.forEach(assetData => {
      const normalized = normalizeAssetData(assetData);
      const {
        slug
      } = normalized;
      const existingAsset = updated[slug];

      // Preserve needsUpload if asset was locally marked as changed
      updated[slug] = mergeAsset(existingAsset, normalized, {
        preserveNeedsUpload: !!existingAsset?.needsUpload
      });
    });
    return updated;
  }
}
;// ./assets/src/export/hooks/useAssetManager.js
/**
 * Asset Manager Hook
 *
 * Manages asset state in localStorage.
 * Uses AssetManagerService for all business logic.
 *
 */




function useAssetManager() {
  const [assets, setAssets] = (0,external_wp_element_namespaceObject.useState)({});

  // Create service instance (memoized to prevent recreation)
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new AssetManagerService(storage), []);

  // Load assets from localStorage on mount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const data = service.load();
    setAssets(data);
  }, [service]);

  // Save assets to localStorage whenever they change
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    service.save(assets);
  }, [service, assets]);
  const markAsChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    setAssets(prev => service.markAsChanged(prev, type, slug));
  }, [service]);
  const updateFromServer = (0,external_wp_element_namespaceObject.useCallback)(assetData => {
    setAssets(prev => service.updateFromServer(prev, assetData));
  }, [service]);
  const syncWithServer = (0,external_wp_element_namespaceObject.useCallback)(serverAssets => {
    setAssets(prev => service.syncWithServer(prev, serverAssets));
  }, [service]);
  const getChangedAssets = (0,external_wp_element_namespaceObject.useCallback)(() => {
    return filterChangedAssets(assets);
  }, [assets]);
  const clearUploadFlags = (0,external_wp_element_namespaceObject.useCallback)(() => {
    setAssets(prev => clearAllUploadFlags(prev));
  }, []);
  return {
    assets,
    markAsChanged,
    updateFromServer,
    syncWithServer,
    getChangedAssets,
    clearUploadFlags
  };
}
// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// ./assets/src/export/utils/assetTracker.js
/**
 * Asset Tracker
 *
 * Tracks uploaded assets to prevent duplicate uploads.
 *
 */

/**
 * Create an asset tracker instance.
 *
 * @return {Object} Asset tracker instance.
 */
function createAssetTracker() {
  // Track uploaded assets by normalized URL.
  const uploadedAssets = new Set();
  // Track failed assets by normalized URL.
  const failedAssets = new Set();

  /**
   * Check if an asset has already been uploaded.
   *
   * @param {string} url Asset URL.
   * @return {boolean} True if already uploaded.
   */
  function isUploaded(url) {
    // Normalize URL for comparison (remove fragments, trailing slashes).
    const normalized = normalizeUrl(url);
    return uploadedAssets.has(normalized);
  }

  /**
   * Mark an asset as uploaded.
   *
   * @param {string} url Asset URL.
   */
  function markUploaded(url) {
    const normalized = normalizeUrl(url);
    uploadedAssets.add(normalized);
  }

  /**
   * Mark an asset as failed.
   *
   * @param {string} url Asset URL.
   */
  function markFailed(url) {
    const normalized = normalizeUrl(url);
    failedAssets.add(normalized);
  }

  /**
   * Check if an asset has failed.
   *
   * @param {string} url Asset URL.
   * @return {boolean} True if failed.
   */
  function isFailed(url) {
    const normalized = normalizeUrl(url);
    return failedAssets.has(normalized);
  }

  /**
   * Get count of uploaded assets.
   *
   * @return {number} Number of uploaded assets.
   */
  function getCount() {
    return uploadedAssets.size;
  }

  /**
   * Get count of failed assets.
   *
   * @return {number} Number of failed assets.
   */
  function getFailedCount() {
    return failedAssets.size;
  }

  /**
   * Clear all tracked assets.
   */
  function clear() {
    uploadedAssets.clear();
    failedAssets.clear();
  }

  /**
   * Normalize a URL for comparison.
   *
   * @param {string} url URL to normalize.
   * @return {string} Normalized URL.
   */
  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove fragments.
      urlObj.hash = '';
      // Remove trailing slash from path.
      if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is (will still work for exact matches).
      return url;
    }
  }
  return {
    isUploaded,
    markUploaded,
    markFailed,
    isFailed,
    getCount,
    getFailedCount,
    clear
  };
}
;// ./assets/src/utils/manifestManager.js
/**
 * Manifest Manager Utility
 *
 * Manages the file manifest JSON that tracks file sizes and hashes
 * for upload optimization. The manifest is stored remotely at
 * file-manifest.json in each provider's storage location.
 *
 */

/**
 * Fetch existing manifest from remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @return {Promise<Object>} Manifest object (empty object if not found).
 */
async function fetchManifest(storageService) {
  try {
    // Try to download manifest from storage.
    const manifestBlob = await storageService.downloadManifest();
    if (!manifestBlob) {
      return {};
    }

    // Parse JSON from blob.
    const manifestText = await manifestBlob.text();
    const manifest = JSON.parse(manifestText);
    return manifest || {};
  } catch (error) {
    // If manifest doesn't exist (404) or other error, start with empty manifest.
    if (error.message && error.message.includes('404')) {
      return {};
    }
    return {};
  }
}

/**
 * Update manifest entry with size, hash, and optional content-type.
 *
 * @param {Object} manifest    Manifest object to update.
 * @param {string} storageKey  Storage key/path for the file.
 * @param {number} size        File size in bytes.
 * @param {string} hash        SHA-256 hash hex string.
 * @param {string} contentType Optional content-type header value.
 * @return {Object} Updated manifest object.
 */
function updateManifestEntry(manifest, storageKey, size, hash, contentType = null) {
  if (!manifest) {
    manifest = {};
  }
  manifest[storageKey] = {
    size,
    hash
  };

  // Add content-type if provided
  if (contentType) {
    manifest[storageKey].contentType = contentType;
  }
  return manifest;
}

/**
 * Check if file should be skipped based on size and hash comparison.
 *
 * Two-stage check: size first, then hash if size matches.
 * Returns true if both size and hash match existing entry.
 *
 * @param {Object} manifest   Manifest object.
 * @param {string} storageKey Storage key/path for the file.
 * @param {number} size       File size in bytes.
 * @param {string} hash       SHA-256 hash hex string.
 * @return {boolean} True if file should be skipped (size and hash match).
 */
function manifestManager_shouldSkipUpload(manifest, storageKey, size, hash) {
  if (!manifest || !manifest[storageKey]) {
    // No entry in manifest, don't skip.
    return false;
  }
  const entry = manifest[storageKey];

  // Stage 1: Check size first (fast comparison).
  if (entry.size !== size) {
    return false;
  }

  // Stage 2: Check hash if size matches.
  if (entry.hash !== hash) {
    return false;
  }

  // Both size and hash match - skip upload.

  return true;
}

/**
 * Clean up manifest by removing entries not in current upload set.
 *
 * This prevents manifest from growing indefinitely as files are added/removed.
 * Returns a new manifest object containing only entries for files in currentFiles set.
 *
 * @param {Object} manifest     Existing manifest object.
 * @param {Set}    currentFiles Set of storage keys for files in current upload.
 * @return {Object} Cleaned manifest object.
 */
function cleanupManifest(manifest, currentFiles) {
  if (!manifest || !currentFiles) {
    return manifest || {};
  }
  const cleanedManifest = {};

  // Keep only entries for files that exist in current upload
  // Also preserve wp-content.zip entries (uploaded in parallel step)
  for (const storageKey of Object.keys(manifest)) {
    if (currentFiles.has(storageKey) || storageKey.includes('/wp-content.zip')) {
      cleanedManifest[storageKey] = manifest[storageKey];
    }
  }
  return cleanedManifest;
}

/**
 * Upload manifest to remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @param {Object} manifest       Manifest object to upload.
 * @return {Promise<boolean>} True if upload succeeded.
 */
async function uploadManifest(storageService, manifest) {
  try {
    // Convert manifest to JSON blob (minified for smaller file size).
    const manifestJson = JSON.stringify(manifest);
    const manifestBlob = new Blob([manifestJson], {
      type: 'application/json'
    });

    // Upload manifest via storage service.
    const result = await storageService.uploadManifest(manifestBlob);
    if (result.success) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
;// ./assets/src/export/utils/staticSiteConfig.js
/**
 * Static Site Configuration Utilities
 *
 * Pure functions for building static site generator configuration.
 *
 */



/**
 * Build storage configuration object.
 *
 * @param {string} siteUrl       WordPress site URL.
 * @param {string} staticSiteUrl Target static site URL.
 * @param {string} providerId    Provider ID.
 * @return {Object} Storage configuration.
 */
function buildStorageConfig(siteUrl, staticSiteUrl, providerId) {
  return {
    public_url: siteUrl,
    base_url: staticSiteUrl || siteUrl,
    provider_id: providerId
  };
}

/**
 * Calculate total files to upload from pre-scan results.
 *
 * @param {number} cachedHtmlCount Number of HTML files cached.
 * @param {number} uniqueAssets    Number of unique assets.
 * @return {number} Total files to upload.
 */
function calculateTotalFiles(cachedHtmlCount, uniqueAssets) {
  return cachedHtmlCount + uniqueAssets;
}

/**
 * Build the final result object from upload phase.
 *
 * @param {Object} failures           Failure tracking object.
 * @param {Object} assetTracker       Asset tracker instance.
 * @param {number} filesUploaded      Number of files uploaded.
 * @param {number} filesSkipped       Number of files skipped.
 * @param {number} totalFilesToUpload Total files to upload.
 * @param {Array}  uploadedFiles      Array of uploaded file info.
 * @param {number} totalUrls          Total URLs processed.
 * @return {Object} Result object.
 */
function buildUploadResult(failures, assetTracker, filesUploaded, filesSkipped, totalFilesToUpload, uploadedFiles, totalUrls) {
  return {
    success: failures.urlsFailed === 0,
    urlsProcessed: totalUrls,
    urlsSucceeded: failures.urlsSucceeded,
    urlsFailed: failures.urlsFailed,
    assetsUploaded: assetTracker.getCount(),
    assetsFailed: failures.assetsFailed,
    failedUrls: failures.failedUrls,
    uploadedFiles,
    filesUploaded,
    filesSkipped,
    totalFilesToUpload
  };
}

/**
 * Create initial failure tracking object.
 *
 * @return {Object} Failure tracking object.
 */
function createFailureTracker() {
  return {
    urlsFailed: 0,
    urlsSucceeded: 0,
    assetsFailed: 0,
    failedUrls: []
  };
}

/**
 * Fetch provider configuration from REST API.
 *
 * @param {string} staticSiteProviderId Provider ID from parameter.
 * @return {Promise<Object>} Provider configuration object.
 */
async function fetchProviderConfig(staticSiteProviderId) {
  let providerConfig = {};
  try {
    // CRITICAL: Always use the exact provider ID passed in
    // Do NOT do provider discovery - this breaks multi-instance threading
    // where each thread needs its OWN provider instance config
    if (!staticSiteProviderId) {
      throw new Error('Provider ID is required for fetchProviderConfig. ' + 'Provider discovery should not be used in threaded contexts.');
    }

    // Use ConfigStorage to load provider config (handles caching and REST API)
    const {
      ConfigStorage
    } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 906));
    const storage = new ConfigStorage(staticSiteProviderId);
    providerConfig = await storage.load();
  } catch (error) {
    // Re-throw to make failures visible instead of silently using wrong config
    throw error;
  }
  return providerConfig;
}

/**
 * Create and configure storage service.
 *
 * @param {string} staticPath     Static files path.
 * @param {Object} config         Storage configuration.
 * @param {string} providerId     Provider ID.
 * @param {Object} providerConfig Provider configuration.
 * @return {Promise<Object>} Storage service instance.
 */
async function createStorageService(staticPath, config, providerId, providerConfig) {
  // Filter configuration
  const filteredConfig = (0,external_wp_hooks_.applyFilters)('aether.storage.service.config', config, staticPath, providerId, providerConfig);

  // Allow filter to override storage service creation
  let storageService = (0,external_wp_hooks_.applyFilters)('aether.storage.service.create', null, staticPath, filteredConfig, providerId);

  // Create default if not overridden
  if (!storageService) {
    const {
      StorageService
    } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 380));
    storageService = new StorageService(staticPath, filteredConfig);
  }
  return storageService;
}
// EXTERNAL MODULE: ./assets/src/export/utils/urlRewriter.js + 2 modules
var urlRewriter = __webpack_require__(574);
;// ./assets/src/export/utils/assetExclusions.js
/**
 * Asset Exclusions Configuration
 *
 * Centralized configuration for assets and URL patterns that should be excluded
 * from static site generation.
 *
 */

/**
 * Image file extensions that are served from external CDNs.
 * These are skipped when found in CSS/JS, but collected when referenced in HTML.
 */
const SKIP_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];

/**
 * Essential file extensions that should always be collected,
 * even if they are external URLs (e.g., Google Fonts).
 * These assets are critical for site functionality.
 */
const ESSENTIAL_EXTENSIONS = ['css', 'js', 'woff', 'woff2', 'ttf', 'eot', 'otf'];

/**
 * Webpack module IDs to skip (not real files, just module references).
 * These are webpack internal module IDs that don't correspond to actual files.
 */
const WEBPACK_MODULE_IDS = ['react', 'is-prop-valid', 'uncategorized', 'git-config', 'react-dom', 'react-jsx-runtime'];

/**
 * URL patterns that should be excluded from asset collection.
 * Patterns starting with '/' are checked at the start of the URL pathname.
 * Other patterns are checked anywhere in the URL using includes().
 */
const EXCLUDED_URL_PATTERNS = ['/wp-json/',
// WordPress REST API endpoints
'/xmlrpc.php',
// WordPress XML-RPC endpoint
'/wp-comments-post.php',
// WordPress comment submission endpoint (405 Method Not Allowed)
'imagedelivery.net' // External CDN (imagedelivery.net)
];

/**
 * Regex patterns for more complex exclusions.
 * These are checked after simple string patterns.
 */
const EXCLUDED_URL_REGEX_PATTERNS = [/wp-admin\/.*\.php$/ // WordPress admin PHP files (wp-admin/*.php and wp-admin/**/*.php)
];

/**
 * Check if a URL matches any excluded pattern.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL should be excluded.
 */
function isExcludedUrl(url) {
  // Check simple string patterns first.
  const matchesStringPattern = EXCLUDED_URL_PATTERNS.some(pattern => {
    // Patterns starting with '/' should match at the start of the pathname.
    if (pattern.startsWith('/')) {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.startsWith(pattern);
      } catch {
        // If URL parsing fails, check if URL string starts with pattern.
        return url.startsWith(pattern);
      }
    }
    // Other patterns are checked anywhere in the URL.
    return url.includes(pattern);
  });
  if (matchesStringPattern) {
    return true;
  }

  // Check regex patterns for more complex exclusions.
  // Extract pathname for regex matching to avoid matching query strings or fragments.
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return EXCLUDED_URL_REGEX_PATTERNS.some(regex => regex.test(pathname));
  } catch {
    // If URL parsing fails, test against full URL string.
    return EXCLUDED_URL_REGEX_PATTERNS.some(regex => regex.test(url));
  }
}

/**
 * Check if a file extension is in the skip list.
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension should be skipped.
 */
function isSkippedExtension(extension) {
  return SKIP_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Check if a file extension is essential (always collected).
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension is essential.
 */
function isEssentialExtension(extension) {
  return ESSENTIAL_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Check if a module ID is a webpack internal reference.
 *
 * @param {string} moduleId Module ID to check.
 * @return {boolean} True if module ID should be skipped.
 */
function isWebpackModuleId(moduleId) {
  return WEBPACK_MODULE_IDS.includes(moduleId);
}
;// ./assets/src/export/utils/assetPatterns.js
/**
 * Asset Patterns
 *
 * Regex patterns for asset extraction from HTML, CSS, and JS.
 *
 */

/**
 * Stylesheet link patterns.
 * Two patterns handle both attribute orders: href-first and rel-first.
 */
const STYLESHEET_PATTERNS = [/<link[^>]+href=(["'])([^"']+)\1[^>]*rel=["']stylesheet["'][^>]*>/gi, /<link[^>]+rel=["']stylesheet["'][^>]*href=(["'])([^"']+)\1[^>]*>/gi];

/**
 * Script src pattern.
 */
const SCRIPT_PATTERN = /<script[^>]+src=(["'])([^"']+)\1[^>]*>/gi;

/**
 * Inline CSS in style tags pattern.
 */
const INLINE_CSS_PATTERN = /<style[^>]*>(.*?)<\/style>/gis;

/**
 * Inline JS in script tags pattern.
 */
const INLINE_JS_PATTERN = /<script[^>]*>(.*?)<\/script>/gis;

/**
 * Import map pattern.
 */
const IMPORT_MAP_PATTERN = /<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis;

/**
 * CSS @import pattern.
 */
const CSS_IMPORT_PATTERN = /@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;

/**
 * CSS url() pattern.
 */
const CSS_URL_PATTERN = /url\(["']?([^"')]+)["']?\)/gi;

/**
 * JS import patterns.
 */
const JS_IMPORT_PATTERNS = {
  // ES6 import: import ... from 'module'
  es6: /import\s+(?:[^;"']+\s+from\s+)?["']([^"']+)["']/gi,
  // Dynamic import: import('module')
  dynamic: /import\s*\(\s*["']([^"']+)["']\s*\)/gi,
  // CommonJS require: require('module')
  require: /require\s*\(\s*["']([^"']+)["']\s*\)/gi
};

/**
 * JS asset reference patterns.
 */
const JS_ASSET_PATTERNS = [
// new URL() constructor
/new\s+URL\s*\(\s*["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
// String literals with asset extensions
/["']([\.\/][^"']*\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi];

/**
 * HTML attribute patterns for asset extraction.
 */
const HTML_ATTR_PATTERNS = [/<img[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<video[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<video[^>]+poster=(["'])([^"']+)\1[^>]*>?/gi, /<audio[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<source[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<link[^>]+(?:rel=["'](?:preload|prefetch)["'][^>]+)?href=(["'])([^"']+)\1[^>]*>?/gi];

/**
 * Srcset patterns.
 */
const SRCSET_PATTERNS = {
  img: /<img[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi,
  source: /<source[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi
};

/**
 * Inline style attribute pattern.
 */
const INLINE_STYLE_PATTERN = /style\s*=\s*(["'])((?:(?!\1)(?:\\.|[^\\]))*)\1/gi;

/**
 * Asset type map by extension.
 */
const ASSET_TYPE_MAP = {
  css: 'css',
  js: 'js',
  woff: 'font',
  woff2: 'font',
  ttf: 'font',
  otf: 'font',
  eot: 'font'
};

/**
 * Get file extension from URL.
 *
 * @param {string} url URL to extract extension from.
 * @return {string} File extension in lowercase, or empty string.
 */
function getExtensionFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot !== -1) {
      return pathname.substring(lastDot + 1).toLowerCase();
    }
  } catch {
    const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return '';
}

/**
 * Get asset type from URL.
 *
 * @param {string} url Asset URL.
 * @return {string} Asset type ('css', 'js', 'font', or 'other').
 */
function getAssetType(url) {
  const extension = getExtensionFromUrl(url);
  return ASSET_TYPE_MAP[extension] || 'other';
}

/**
 * Parse srcset value into array of URLs.
 *
 * @param {string} srcsetValue Srcset attribute value.
 * @return {Array<string>} Array of URLs (without descriptors).
 */
function parseSrcset(srcsetValue) {
  return srcsetValue.split(',').map(part => {
    const trimmed = part.trim();
    const urlMatch = trimmed.match(/^([^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  }).filter(Boolean);
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract host from URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string.
 */
function extractHost(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    const hostMatch = url.match(/^https?:\/\/([^\/]+)/);
    return hostMatch ? hostMatch[1] : '';
  }
}
;// ./assets/src/export/utils/assetFilters.js
/**
 * Asset Filters
 *
 * Pure functions for determining which assets to collect.
 *
 */






/**
 * Extract module ID from URL for webpack checking.
 *
 * @param {string} url URL to extract module ID from.
 * @return {string|null} Module ID or null.
 */
function extractModuleId(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || pathname;
    return filename.replace(/\.[^.]*$/, '');
  } catch {
    const filenameMatch = url.match(/\/([^\/]+)(?:\.[^.]*)?(?:\?|$)/);
    return filenameMatch ? filenameMatch[1] : null;
  }
}

/**
 * Check if asset should be collected.
 *
 * @param {string} url     Asset URL.
 * @param {string} siteUrl Site URL.
 * @param {string} source  Source where asset was found ('html', 'css', 'js').
 * @return {boolean} True if should collect.
 */
function shouldCollectAsset(url, siteUrl, source = 'css') {
  // FILTER 0: Skip webpack module IDs (not real files)
  const moduleId = extractModuleId(url);
  if (moduleId && isWebpackModuleId(moduleId)) {
    return false;
  }

  // Get file extension
  const extension = getExtensionFromUrl(url);

  // PRIORITY 1: Always collect essential assets (CSS, JS, fonts) EVEN IF EXTERNAL
  if (isEssentialExtension(extension)) {
    return true;
  }

  // FILTER 1 & 2: Skip excluded URL patterns
  if (isExcludedUrl(url)) {
    return false;
  }

  // FILTER 3: Skip external URLs for non-essential assets
  if ((0,urlRewriter/* isExternal */.ge)(url, siteUrl)) {
    return false;
  }

  // PRIORITY 2: Collect images when referenced in HTML (internal URLs only)
  if (source === 'html' && isSkippedExtension(extension)) {
    return true;
  }

  // FILTER 4: Skip image files when found in CSS/JS
  if (isSkippedExtension(extension)) {
    return false;
  }

  // PRIORITY 3: For other assets, apply filter hook
  let shouldCollect = true;

  /**
   * Filter whether an asset should be collected.
   *
   * @param {boolean} shouldCollect Whether to collect this asset.
   * @param {string}  url           Asset URL.
   * @param {string}  siteUrl       Site URL.
   * @param {string}  source        Asset source.
   * @param {string}  extension     File extension.
   */
  shouldCollect = (0,external_wp_hooks_.applyFilters)('aether.assets.should_collect', shouldCollect, url, siteUrl, source, extension);
  return shouldCollect;
}
;// ./assets/src/export/utils/assetExtractor.js
/**
 * Asset Extractor
 *
 * Extracts asset URLs (CSS, JS, fonts, images) from HTML content.
 *
 */







/**
 * Extract asset URLs from HTML content.
 *
 * @param {string} html    HTML content.
 * @param {string} pageUrl Page URL for resolving relative URLs.
 * @param {string} siteUrl Site URL for internal URL checking.
 * @return {Promise<Array<string>>} Array of asset URLs.
 */
async function extractAssetsFromHtml(html, pageUrl, siteUrl) {
  const collected = new Set();
  const processed = new Set();

  // Collect stylesheets
  for (const pattern of STYLESHEET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const cssUrl = match[2];
      const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(cssUrl, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }
  }

  // Collect scripts
  SCRIPT_PATTERN.lastIndex = 0;
  const scriptMatches = html.matchAll(SCRIPT_PATTERN);
  for (const match of scriptMatches) {
    const jsUrl = match[2];
    const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(jsUrl, pageUrl);
    if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
      collected.add(resolvedUrl);
      await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
    }
  }

  // Collect from inline CSS
  INLINE_CSS_PATTERN.lastIndex = 0;
  const inlineCssMatches = html.matchAll(INLINE_CSS_PATTERN);
  for (const match of inlineCssMatches) {
    collectCssInlineDependencies(match[1], pageUrl, siteUrl, collected);
  }

  // Collect from inline JS
  INLINE_JS_PATTERN.lastIndex = 0;
  const inlineJsMatches = html.matchAll(INLINE_JS_PATTERN);
  for (const match of inlineJsMatches) {
    await collectJsInlineDependencies(match[1], pageUrl, siteUrl, collected, processed);
  }

  // Collect from import maps
  IMPORT_MAP_PATTERN.lastIndex = 0;
  const importMapMatches = html.matchAll(IMPORT_MAP_PATTERN);
  for (const match of importMapMatches) {
    await collectImportmapModules(match[1], pageUrl, siteUrl, collected, processed);
  }

  // Collect from HTML attributes
  collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected);
  let assets = Array.from(collected);
  assets = (0,external_wp_hooks_.applyFilters)('aether.assets.extracted', assets, html, pageUrl, siteUrl);
  return assets;
}

/**
 * Collect assets from HTML attributes.
 *
 * @param {string}      html      HTML content.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 */
function collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected) {
  const siteHost = extractHost(siteUrl);
  if (siteHost) {
    const escapedHost = escapeRegex(siteHost);
    const patterns = [new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi'), new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi'), new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi')];
    const allMatches = new Set();
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[0];
        if (!url.includes('imagedelivery.net')) {
          // Protocol-relative URLs (third pattern, index 2)
          if (i === 2) {
            try {
              const siteUrlObj = new URL(siteUrl);
              allMatches.add(siteUrlObj.protocol + url);
            } catch {
              allMatches.add('https:' + url);
            }
          } else {
            allMatches.add(url);
          }
        }
      }
    }
    for (const url of allMatches) {
      const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(url, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Collect from attribute patterns
  for (const pattern of HTML_ATTR_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const url = match[2];
      const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(url, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Collect from srcset
  for (const [, pattern] of Object.entries(SRCSET_PATTERNS)) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const urls = parseSrcset(match[2]);
      for (const url of urls) {
        const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(url, pageUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
          collected.add(resolvedUrl);
        }
      }
    }
  }

  // Collect from inline styles
  INLINE_STYLE_PATTERN.lastIndex = 0;
  const inlineStyleMatches = html.matchAll(INLINE_STYLE_PATTERN);
  for (const match of inlineStyleMatches) {
    let inlineCss = match[2];
    inlineCss = inlineCss.replace(/\\(["'])/g, '$1');
    collectCssInlineDependencies(inlineCss, pageUrl, siteUrl, collected, 'html');
  }
}

/**
 * Collect modules from import map.
 *
 * @param {string}      json      Import map JSON.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectImportmapModules(json, pageUrl, siteUrl, collected, processed) {
  try {
    const importmap = JSON.parse(json);
    if (!importmap?.imports) {
      return;
    }
    for (const moduleName in importmap.imports) {
      if (importmap.imports.hasOwnProperty(moduleName)) {
        const moduleUrl = importmap.imports[moduleName];
        const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(moduleUrl, pageUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
          collected.add(resolvedUrl);
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
  } catch {
    // Invalid JSON
  }
}

/**
 * Collect CSS dependencies.
 *
 * @param {string}      cssUrl    CSS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectCssDependencies(cssUrl, siteUrl, collected, processed) {
  if (processed.has(cssUrl)) {
    return;
  }
  processed.add(cssUrl);
  try {
    const response = await fetch(cssUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'User-Agent': 'Aether Static Site Generator'
      }
    });
    if (!response.ok) {
      return;
    }
    const cssContent = await response.text();

    // @import statements
    CSS_IMPORT_PATTERN.lastIndex = 0;
    const importMatches = cssContent.matchAll(CSS_IMPORT_PATTERN);
    for (const match of importMatches) {
      const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(match[1], cssUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }

    // url() references
    CSS_URL_PATTERN.lastIndex = 0;
    const urlMatches = cssContent.matchAll(CSS_URL_PATTERN);
    for (const match of urlMatches) {
      const assetUrl = match[1];
      if (assetUrl.startsWith('data:')) {
        continue;
      }
      const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(assetUrl, cssUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
      }
    }
  } catch {
    // Failed to fetch
  }
}

/**
 * Collect CSS inline dependencies.
 *
 * @param {string}      cssContent CSS content.
 * @param {string}      baseUrl    Base URL.
 * @param {string}      siteUrl    Site URL.
 * @param {Set<string>} collected  Collected URLs.
 * @param {string}      source     Source type.
 */
function collectCssInlineDependencies(cssContent, baseUrl, siteUrl, collected, source = 'css') {
  CSS_URL_PATTERN.lastIndex = 0;
  const urlMatches = cssContent.matchAll(CSS_URL_PATTERN);
  for (const match of urlMatches) {
    const assetUrl = match[1];
    if (assetUrl.startsWith('data:')) {
      continue;
    }
    const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(assetUrl, baseUrl);
    if (shouldCollectAsset(resolvedUrl, siteUrl, source)) {
      collected.add(resolvedUrl);
    }
  }
}

/**
 * Collect JS dependencies.
 *
 * @param {string}      jsUrl     JS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsDependencies(jsUrl, siteUrl, collected, processed) {
  if (processed.has(jsUrl)) {
    return;
  }
  processed.add(jsUrl);
  try {
    const response = await fetch(jsUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'User-Agent': 'Aether Static Site Generator'
      }
    });
    if (!response.ok) {
      return;
    }
    const jsContent = await response.text();

    // Process all import patterns
    for (const [, pattern] of Object.entries(JS_IMPORT_PATTERNS)) {
      pattern.lastIndex = 0;
      const matches = jsContent.matchAll(pattern);
      for (const match of matches) {
        const importUrl = match[1];
        if (isWebpackModuleId(importUrl)) {
          continue;
        }
        const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(importUrl, jsUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
          collected.add(resolvedUrl);
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
    await collectJsInlineDependencies(jsContent, jsUrl, siteUrl, collected, processed);
  } catch {
    // Failed to fetch
  }
}

/**
 * Collect JS inline dependencies.
 *
 * @param {string}      jsContent JS content.
 * @param {string}      baseUrl   Base URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsInlineDependencies(jsContent, baseUrl, siteUrl, collected, processed) {
  for (const pattern of JS_ASSET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = jsContent.matchAll(pattern);
    for (const match of matches) {
      const assetUrl = match[1];
      if (assetUrl.startsWith('data:') || assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
        continue;
      }
      const resolvedUrl = (0,urlRewriter/* resolveRelative */.Nh)(assetUrl, baseUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
        collected.add(resolvedUrl);
        const type = getAssetType(resolvedUrl);
        if (type === 'css') {
          await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
        } else if (type === 'js') {
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
  }
}

/**
 * Get asset local path.
 *
 * @param {string} url Asset URL.
 * @return {string|null} Local path or null.
 */
function getAssetLocalPath(url) {
  let path = '';
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname || '';
  } catch {
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      path = pathMatch[1];
    }
  }
  path = path.replace(/^\/+/, '');
  path = (0,urlRewriter/* stripPlaygroundScope */.Gw)(path);
  if (!path || path === '') {
    return null;
  }
  return path;
}
;// ./assets/src/export/utils/preScanPhase.js
/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, count total files.
 *
 */





/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs and extracts assets.
 *
 * @param {Object}   options                  Pre-scan options.
 * @param {Array}    options.urls             URLs to scan.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.providerConfig   Provider configuration.
 * @param {Function} options.setStatusMessage Status message updater.
 * @param {Object}   options.htmlData         Optional HTML data storage.
 * @return {Promise<Object>} Pre-scan results.
 */
async function executePreScan({
  urls,
  siteUrl,
  providerId,
  providerConfig,
  setStatusMessage,
  htmlData = null
}) {
  const failures = {
    urlsFailed: 0,
    failedUrls: []
  };

  // Fire pre-scan start action
  (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.pre_scan.before', urls, providerId, providerConfig);
  if (setStatusMessage) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Scanning files to upload…', 'aether-site-exporter'), 'progress', 'scanFiles');
  }

  // Store HTML data if provided
  const dataStorage = htmlData || new Map();
  const allUniqueAssets = new Set();
  let successfulUrls = 0;

  // Scan each URL
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    // Check if URL is already in cache (from preScanStaticSite step)
    const cachedEntry = dataStorage.get(url);
    if (cachedEntry) {
      // Use cached data - validate structure
      if (cachedEntry && typeof cachedEntry === 'object' && cachedEntry.rawHtml && Array.isArray(cachedEntry.assetUrls)) {
        successfulUrls++;

        // Add cached assets to unique set
        for (const assetUrl of cachedEntry.assetUrls) {
          allUniqueAssets.add(assetUrl);
        }
        continue;
      }
    }

    // URL not in cache - this might be an asset URL (CSS, JS, image, etc.)
    // Assets are handled separately in the upload phase, so we can skip them here
    // Only fetch if it looks like it might be an HTML page
    // (We'll let the fetch determine if it's actually HTML)
    try {
      // Fetch from URL
      const htmlResponse = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (htmlResponse.status !== 200) {
        failures.urlsFailed++;
        failures.failedUrls.push({
          url,
          reason: `Failed to fetch HTML: HTTP ${htmlResponse.status} ${htmlResponse.statusText}`
        });
        continue;
      }

      // Check content-type to ensure it's HTML
      const contentType = htmlResponse.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        // Not HTML - likely an asset (CSS, JS, image, etc.)
        // Assets are handled separately in upload phase, skip here
        continue;
      }
      const html = await htmlResponse.text();

      // Extract assets
      const assetUrls = await extractAssetsFromHtml(html, url, siteUrl);

      // Store HTML and assets in provided data structure
      dataStorage.set(url, {
        rawHtml: html,
        assetUrls
      });
      successfulUrls++;

      // Add to unique set
      for (const assetUrl of assetUrls) {
        allUniqueAssets.add(assetUrl);
      }
    } catch (error) {
      failures.urlsFailed++;
      failures.failedUrls.push({
        url,
        reason: error.message
      });
    }
  }
  const totalFilesToUpload = successfulUrls + allUniqueAssets.size;

  // Fire completion action
  (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.pre_scan.after', {
    urlsScanned: urls.length,
    urlsSuccessful: successfulUrls,
    uniqueAssets: allUniqueAssets.size,
    totalFiles: totalFilesToUpload
  }, providerId);
  if (setStatusMessage) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of HTML files, %2$d: Number of assets */
    (0,external_wp_i18n_namespaceObject.__)('Pre-scan complete: %1$d HTML files, %2$d assets', 'aether-site-exporter'), successfulUrls, allUniqueAssets.size), 'success', 'scanFiles');
  }
  return {
    htmlData: dataStorage,
    allUniqueAssets,
    totalFilesToUpload,
    failures,
    urlsSuccessful: successfulUrls
  };
}
// EXTERNAL MODULE: ./assets/src/export/utils/htmlProcessor.js
var htmlProcessor = __webpack_require__(864);
;// ./assets/src/utils/concurrencyLimiter.js
/**
 * Concurrency Limiter Utility
 *
 * Limits the number of concurrent async operations to prevent overwhelming
 * the browser/server with too many simultaneous requests.
 *
 */

/**
 * Create a concurrency limiter function.
 *
 * Returns a function that wraps async operations and ensures only
 * a limited number run concurrently. Additional operations are queued
 * and executed as slots become available.
 *
 * @param {number} limit Maximum number of concurrent operations (default: 5)
 * @return {Function} Limiter function that wraps async operations
 *
 * @example
 * const limiter = createConcurrencyLimiter(3);
 * const results = await Promise.allSettled([
 *   limiter(() => asyncOperation1()),
 *   limiter(() => asyncOperation2()),
 *   limiter(() => asyncOperation3()),
 *   limiter(() => asyncOperation4()), // Will wait until one of the first 3 completes
 * ]);
 */
function createConcurrencyLimiter(limit = 5) {
  let running = 0;
  const queue = [];

  /**
   * Execute the next queued operation if slots are available.
   */
  const processQueue = () => {
    // If we're at the limit or queue is empty, nothing to do
    if (running >= limit || queue.length === 0) {
      return;
    }

    // Get next operation from queue
    const {
      operation,
      resolve,
      reject
    } = queue.shift();
    running++;

    // Execute the operation
    Promise.resolve(operation()).then(result => {
      running--;
      resolve(result);
      // Process next item in queue
      processQueue();
    }).catch(error => {
      running--;
      reject(error);
      // Process next item in queue
      processQueue();
    });
  };

  /**
   * Limiter function that wraps async operations.
   *
   * @param {Function} operation Async operation to execute
   * @return {Promise} Promise that resolves when operation completes
   */
  return operation => {
    return new Promise((resolve, reject) => {
      queue.push({
        operation,
        resolve,
        reject
      });
      processQueue();
    });
  };
}
;// ./assets/src/utils/fileHash.js
/**
 * File Hash Utility
 *
 * Utility functions for calculating SHA-256 hashes of files and blobs.
 * Uses Web Crypto API for hardware-accelerated hashing.
 *
 */

/**
 * Calculate SHA-256 hash for a File or Blob object.
 *
 * Converts the file/blob to ArrayBuffer and calculates SHA-256 hash
 * using Web Crypto API. Works with all Blob types including images
 * (WebP, PNG, JPG), CSS, JS, HTML, and other binary files.
 *
 * @param {File|Blob} file File or Blob object to hash.
 * @return {Promise<string>} Hex-encoded hash string (64 characters).
 */
async function fileHash_calculateFileHash(file) {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new Error('File must be a File or Blob object');
  }
  try {
    // Convert Blob/File to ArrayBuffer for hashing.
    const arrayBuffer = await file.arrayBuffer();

    // Calculate SHA-256 hash using Web Crypto API.
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

    // Convert ArrayBuffer to hex string.
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    throw new Error(`Hash calculation failed: ${error.message}`);
  }
}
;// ./assets/src/export/utils/helpers.js
/**
 * Export Utility Functions
 *
 * Helper functions used in export-related operations.
 *
 */

/**
 * Format file size in bytes to human-readable string
 *
 * @param {number} bytes    Number of bytes
 * @param {number} decimals Number of decimal places (default: 1)
 * @return {string} Formatted file size (e.g., "2.5 MB", "123 KB")
 */
function formatFileSize(bytes, decimals = 1) {
  if (!bytes || bytes === 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(decimals)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(decimals)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(decimals)} GB`;
}
;// ./assets/src/export/utils/errorHandler.js
/**
 * Error Handler Utility
 *
 * Provides error categorization, retry logic, and error recovery strategies
 * for the export workflow.
 *
 */



/**
 * Error categories for error handling strategies.
 *
 * @type {Object<string, string>}
 */
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit',
  QUOTA_EXCEEDED: 'quota_exceeded',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels.
 *
 * @type {Object<string, string>}
 */
const ERROR_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Default retry configuration.
 *
 * @type {Object}
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  // 1 second
  maxDelay: 10000,
  // 10 seconds
  backoffMultiplier: 2,
  retryableCategories: [ERROR_CATEGORIES.NETWORK, ERROR_CATEGORIES.TIMEOUT, ERROR_CATEGORIES.RATE_LIMIT]
};

/**
 * Categorize an error based on its properties.
 *
 * @param {Error} error Error object to categorize.
 * @return {string} Error category.
 */
function categorizeError(error) {
  if (!error) {
    return ERROR_CATEGORIES.UNKNOWN;
  }
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  const status = error.status || error.statusCode;

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection') || code === 'network_error' || code === 'econnrefused' || code === 'enotfound') {
    return ERROR_CATEGORIES.NETWORK;
  }

  // Timeout errors
  if (message.includes('timeout') || code === 'timeout' || status === 408) {
    return ERROR_CATEGORIES.TIMEOUT;
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('too many requests') || code === 'rate_limit' || status === 429) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }

  // Quota exceeded errors
  if (message.includes('quota') || message.includes('storage') || code === 'quota_exceeded' || status === 507) {
    return ERROR_CATEGORIES.QUOTA_EXCEEDED;
  }

  // Permission errors
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden') || code === 'permission_denied' || status === 401 || status === 403) {
    return ERROR_CATEGORIES.PERMISSION;
  }

  // Not found errors
  if (message.includes('not found') || code === 'not_found' || status === 404) {
    return ERROR_CATEGORIES.NOT_FOUND;
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || code === 'validation_error' || status === 400 || status === 422) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  return ERROR_CATEGORIES.UNKNOWN;
}

/**
 * Determine error severity based on category and context.
 *
 * @param {string} category Error category.
 * @return {string} Error severity level.
 */
function determineSeverity(category) {
  // Critical errors that should stop the workflow
  if (category === ERROR_CATEGORIES.PERMISSION || category === ERROR_CATEGORIES.QUOTA_EXCEEDED || category === ERROR_CATEGORIES.VALIDATION) {
    return ERROR_SEVERITY.CRITICAL;
  }

  // High severity errors that may require user intervention
  if (category === ERROR_CATEGORIES.NOT_FOUND) {
    return ERROR_SEVERITY.HIGH;
  }

  // Medium severity errors that can be retried
  if (category === ERROR_CATEGORIES.NETWORK || category === ERROR_CATEGORIES.TIMEOUT || category === ERROR_CATEGORIES.RATE_LIMIT) {
    return ERROR_SEVERITY.MEDIUM;
  }

  // Low severity for unknown errors (may be recoverable)
  return ERROR_SEVERITY.LOW;
}

/**
 * Check if an error is retryable.
 *
 * @param {Error}  error  Error to check.
 * @param {Object} config Retry configuration.
 * @return {boolean} True if error is retryable.
 */
function isRetryable(error, config = {}) {
  const category = categorizeError(error);
  const retryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };
  return retryConfig.retryableCategories.includes(category);
}

/**
 * Calculate delay for retry attempt using exponential backoff.
 *
 * @param {number} attemptNumber Current attempt number (0-indexed).
 * @param {Object} config        Retry configuration.
 * @return {number} Delay in milliseconds.
 */
function calculateRetryDelay(attemptNumber, config = {}) {
  const retryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };
  const {
    initialDelay,
    maxDelay,
    backoffMultiplier
  } = retryConfig;
  const delay = initialDelay * Math.pow(backoffMultiplier, attemptNumber);
  return Math.min(delay, maxDelay);
}

/**
 * Execute a function with retry logic.
 *
 * @param {Function} fn                  Function to execute.
 * @param {Object}   options             Retry options.
 * @param {number}   options.maxRetries  Maximum number of retries.
 * @param {Function} options.onRetry     Callback called before each retry.
 * @param {Function} options.shouldRetry Function to determine if error is retryable.
 * @return {Promise<any>} Result of function execution.
 */
async function withRetry(fn, options = {}) {
  const config = {
    ...DEFAULT_RETRY_CONFIG,
    ...options
  };
  const {
    maxRetries,
    onRetry,
    shouldRetry
  } = config;
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const canRetry = attempt < maxRetries && (shouldRetry ? shouldRetry(error, attempt) : isRetryable(error, config));
      if (!canRetry) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt, config);
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Format error message for user display.
 *
 * @param {Error}  error   Error object.
 * @param {Object} context Error context.
 * @return {string} Formatted error message.
 */
function formatErrorMessage(error, context = {}) {
  const category = categorizeError(error);
  const {
    stepId,
    operation
  } = context;
  let message = error.message || (0,external_wp_i18n_namespaceObject.__)('An unknown error occurred', 'aether-site-exporter');

  // Add context information
  if (stepId) {
    message = (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Step ID, 2: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Error in step "%1$s": %2$s', 'aether-site-exporter'), stepId, message);
  }
  if (operation) {
    message = (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Operation name, 2: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Error during %1$s: %2$s', 'aether-site-exporter'), operation, message);
  }

  // Add category-specific guidance
  switch (category) {
    case ERROR_CATEGORIES.NETWORK:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Please check your internet connection and try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.TIMEOUT:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('The operation took too long. Please try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.RATE_LIMIT:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Too many requests. Please wait a moment and try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.QUOTA_EXCEEDED:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Storage quota exceeded. Please free up space and try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.PERMISSION:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Permission denied. Please check your access rights.', 'aether-site-exporter');
      break;
  }
  return message;
}

/**
 * Create an error handler instance with custom configuration.
 *
 * @param {Object} config Error handler configuration.
 * @return {Object} Error handler instance.
 */
function createErrorHandler(config = {}) {
  const handlerConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };
  return {
    /**
     * Execute function with retry logic.
     *
     * @param {Function} fn      Function to execute.
     * @param {Object}   options Additional retry options.
     * @return {Promise<any>} Result.
     */
    async executeWithRetry(fn, options = {}) {
      return withRetry(fn, {
        ...handlerConfig,
        ...options
      });
    },
    /**
     * Categorize an error.
     *
     * @param {Error} error Error to categorize.
     * @return {string} Error category.
     */
    categorize(error) {
      return categorizeError(error);
    },
    /**
     * Check if error is retryable.
     *
     * @param {Error} error Error to check.
     * @return {boolean} True if retryable.
     */
    isRetryable(error) {
      return isRetryable(error, handlerConfig);
    },
    /**
     * Format error message.
     *
     * @param {Error}  error   Error to format.
     * @param {Object} context Error context.
     * @return {string} Formatted message.
     */
    formatMessage(error, context = {}) {
      return formatErrorMessage(error, context);
    }
  };
}

/**
 * Default error handler instance.
 */
const errorHandler = createErrorHandler();
;// ./assets/src/export/utils/fileUploadManager.js
/**
 * File Upload Manager Utility
 *
 * Provides reusable functions for uploading files with progress tracking,
 * concurrency limiting, and hash-based deduplication.
 *
 * Used by:
 * - Static site file uploads (useStaticSiteGenerator.js)
 * - wp-content.zip uploads (useExportController.js)
 *
 */









/**
 * Sanitize a storage key for use in status message keys.
 *
 * @param {string} key Storage key.
 * @return {string} Sanitized key.
 */
function sanitizeKeyForStatus(key) {
  // Replace special characters that might cause issues in status keys
  return key.replace(/[^a-zA-Z0-9-_]/g, '-');
}

/**
 * Upload multiple files with progress tracking and concurrency limiting.
 *
 * @typedef {Object} FileUploadDescriptor
 * @property {string}                 key                           Storage key/path.
 * @property {Blob}                   blob                          File blob to upload.
 * @property {string}                 contentType                   MIME type.
 * @property {string}                 [displayName]                 Display name for progress messages (optional).
 * @property {Object}                 [metadata]                    Optional metadata object.
 *
 * @param    {Object}                 options                       Options object.
 * @param    {FileUploadDescriptor[]} options.files                 Array of file upload descriptors.
 * @param    {Object}                 options.storageService        StorageService instance.
 * @param    {Function}               options.setStatusMessage      Status message callback function.
 * @param    {number}                 [options.concurrency=5]       Max concurrent uploads (default: 5).
 * @param    {Function}               [options.onProgress]          Overall progress callback (optional).
 * @param    {string}                 [options.keyPrefix='upload']  Prefix for status message keys (default: 'upload').
 * @param    {boolean}                [options.skipHashCheck=false] Boolean to skip hash checking (default: false).
 * @param    {Object}                 [options.manifest]            Manifest object for hash checking (optional).
 * @param    {Function}               [options.shouldSkipUpload]    Custom function to determine if file should be skipped (optional).
 * @return {Promise<Object>} Result with success, uploaded, skipped, failed counts and results array.
 */
async function uploadFilesWithProgress({
  files,
  storageService,
  setStatusMessage,
  concurrency = 5,
  onProgress = null,
  keyPrefix = 'upload',
  skipHashCheck = false,
  manifest = null,
  shouldSkipUpload: customShouldSkipUpload = null
}) {
  if (!files || files.length === 0) {
    return {
      success: true,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      results: []
    };
  }
  const limiter = createConcurrencyLimiter(concurrency);
  let filesUploaded = 0;
  let filesSkipped = 0;
  let filesFailed = 0;
  let totalProcessed = 0; // Track total processed (uploaded + skipped) for progress
  const results = [];

  // Process all files in parallel with concurrency limiting
  const uploadPromises = files.map(file => limiter(async () => {
    const {
      key,
      blob,
      contentType,
      displayName: providedDisplayName,
      metadata = {}
    } = file;

    // Ensure displayName is never empty - fallback to key, then to 'file'
    const displayName = providedDisplayName || key || 'file';
    const uploadKey = `${keyPrefix}-${sanitizeKeyForStatus(key)}`;
    let fileHash = null;
    let shouldSkip = false;
    try {
      /**
       * Action fired before each file upload.
       *
       * @param {Object} fileData             File data object.
       * @param {string} fileData.key         Storage key.
       * @param {Blob}   fileData.blob        File blob.
       * @param {string} fileData.contentType Content type.
       * @param {string} fileData.displayName Display name.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.upload.file.before', 'my-provider', (fileData) => {
       *   console.log('About to upload:', fileData.key);
       * });
       */
      (0,external_wp_hooks_.doAction)('aether.upload.file.before', {
        key,
        blob,
        contentType,
        displayName
      });

      // Hash checking and skip logic (if enabled)
      if (!skipHashCheck && manifest) {
        const fileSize = blob.size;
        const existingEntry = manifest[key];
        if (existingEntry && existingEntry.size === fileSize) {
          // Stage 2: Calculate hash if size matches
          try {
            /**
             * Filter hash calculation for files.
             *
             * Allows providers to customize hash calculation or provide pre-calculated hash.
             *
             * @param {string|null} hash     Calculated hash or null to use default calculation.
             * @param {Blob}        blob     File blob.
             * @param {string}      key      Storage key.
             * @param {Object}      manifest Manifest object.
             *
             * @example
             * import { addFilter } from '@wordpress/hooks';
             *
             * addFilter('aether.upload.hash.calculate', 'my-provider', (hash, blob, key, manifest) => {
             *   // Return pre-calculated hash or null to use default
             *   if (key.startsWith('custom/')) {
             *     return 'pre-calculated-hash';
             *   }
             *   return hash; // Use default calculation
             * });
             */
            const filteredHash = (0,external_wp_hooks_.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
            fileHash = filteredHash || (await fileHash_calculateFileHash(blob));
            shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : manifestManager_shouldSkipUpload(manifest, key, fileSize, fileHash);
          } catch (error) {
            shouldSkip = false;
          }
        }
      }
      if (shouldSkip) {
        // File unchanged - skip upload
        filesSkipped++;
        totalProcessed++;
        const fileSize = blob.size;
        const sizeStr = formatFileSize(fileSize);
        if (setStatusMessage) {
          setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
          (0,external_wp_i18n_namespaceObject.__)('Skipped unchanged file %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'success', uploadKey, undefined, {
            fileSize
          });
        }

        // Report progress (guard against empty array to prevent division by zero)
        if (onProgress && files.length > 0) {
          onProgress(totalProcessed, files.length, null);
        }
        results.push({
          key,
          success: true,
          skipped: true,
          url: null,
          hash: fileHash,
          // Include hash so skipped files can be added to manifest
          size: blob.size // Include size for consistency
        });
        return;
      }

      // Calculate hash if not already calculated (for manifest update)
      if (!fileHash && !skipHashCheck) {
        try {
          /**
           * Filter hash calculation for files (when not already calculated).
           *
           * Allows providers to customize hash calculation.
           *
           * @param {string|null} hash     Calculated hash or null to use default calculation.
           * @param {Blob}        blob     File blob.
           * @param {string}      key      Storage key.
           * @param {Object}      manifest Manifest object.
           */
          const filteredHash = (0,external_wp_hooks_.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
          fileHash = filteredHash || (await fileHash_calculateFileHash(blob));
        } catch (error) {
          fileHash = null;
        }
      }
      const fileSize = blob.size;
      const sizeStr = formatFileSize(fileSize);

      // Create status message with unique key for progress tracking
      if (setStatusMessage) {
        setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
        (0,external_wp_i18n_namespaceObject.__)('Uploading %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'progress', uploadKey, {
          percent: 0,
          loaded: 0,
          total: fileSize
        }, {
          fileSize
        });
      }

      // Prepare upload options
      let uploadOptions = {
        contentType,
        cacheControl: metadata.cacheControl || 'public, max-age=31536000, immutable',
        onProgress: (loaded, total, percent) => {
          // Update progress in status message
          if (setStatusMessage) {
            setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
            (0,external_wp_i18n_namespaceObject.__)('Uploading %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'progress', uploadKey, {
              percent,
              loaded,
              total
            }, {
              fileSize
            });
          }
        }
      };

      /**
       * Filter upload options before file upload.
       *
       * Allows providers to modify upload options (contentType, cacheControl, metadata, etc.).
       *
       * @param {Object} uploadOptions Upload options object.
       * @param {string} key           Storage key.
       * @param {Blob}   blob          File blob.
       * @param {string} contentType   Content type.
       * @param {Object} metadata      File metadata.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.upload.file.options', 'my-provider', (options, key, blob, contentType, metadata) => {
       *   return {
       *     ...options,
       *     cacheControl: 'public, max-age=86400',
       *     customHeader: 'value'
       *   };
       * });
       */
      uploadOptions = (0,external_wp_hooks_.applyFilters)('aether.upload.file.options', uploadOptions, key, blob, contentType, metadata);

      // Upload file with retry logic using ErrorHandler
      let uploadResult = null;
      try {
        uploadResult = await errorHandler.executeWithRetry(async () => {
          const result = await storageService.upload(key, blob, uploadOptions);

          // If upload returned failure, throw error for retry logic
          if (!result.success) {
            const error = new Error(result.error || 'Upload failed');
            error.code = result.code;
            error.status = result.status;
            throw error;
          }
          return result;
        }, {
          onRetry: (error, attempt) => {
            if (setStatusMessage) {
              setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size, %3$d: Attempt number, %4$d: Max retries */
              (0,external_wp_i18n_namespaceObject.__)('Retrying %1$s (%2$s) - attempt %3$d/%4$d', 'aether-site-exporter'), displayName, sizeStr, attempt, 3), 'info', uploadKey, undefined, {
                fileSize
              });
            }
          }
        });
      } catch (error) {
        // Upload failed after all retries
        uploadResult = {
          success: false,
          error: errorHandler.formatMessage(error, {
            operation: `upload ${displayName}`
          })
        };
      }
      if (uploadResult && uploadResult.success) {
        filesUploaded++;
        totalProcessed++;

        // Update message to success (remove progress)
        if (setStatusMessage) {
          setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
          (0,external_wp_i18n_namespaceObject.__)('Uploaded %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'success', uploadKey, null,
          // Remove progress
          {
            fileSize
          });
        }

        // Report progress after upload completes (guard against empty array)
        if (onProgress && files.length > 0) {
          onProgress(totalProcessed, files.length, null);
        }
        const uploadResultData = {
          key,
          success: true,
          skipped: false,
          url: uploadResult.url,
          hash: fileHash,
          size: fileSize
        };

        /**
         * Action fired after each file upload succeeds.
         *
         * @param {Object} result      Upload result object.
         * @param {string} result.key  Storage key.
         * @param {string} result.url  Uploaded file URL.
         * @param {string} result.hash File hash.
         * @param {number} result.size File size.
         * @param {string} displayName Display name.
         *
         * @example
         * import { addAction } from '@wordpress/hooks';
         *
         * addAction('aether.upload.file.after', 'my-provider', (result, displayName) => {
         *   console.log('File uploaded:', result.key, result.url);
         * });
         */
        (0,external_wp_hooks_.doAction)('aether.upload.file.after', uploadResultData, displayName);
        results.push(uploadResultData);
      } else {
        // Upload failed after all retries
        filesFailed++;
        const errorMessage = uploadResult?.error || 'Upload failed after retries';
        if (setStatusMessage) {
          setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File name */
          (0,external_wp_i18n_namespaceObject.__)('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', uploadKey, null);
        }
        results.push({
          key,
          success: false,
          skipped: false,
          url: null,
          error: errorMessage
        });
      }
    } catch (error) {
      // Failed to process file
      filesFailed++;
      if (setStatusMessage) {
        setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File name */
        (0,external_wp_i18n_namespaceObject.__)('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', uploadKey, null);
      }
      results.push({
        key,
        success: false,
        skipped: false,
        url: null,
        error: error.message || 'Upload failed'
      });
    }
  }));

  // Wait for all uploads to complete (success or failure)
  await Promise.allSettled(uploadPromises);
  return {
    success: filesFailed === 0,
    uploaded: filesUploaded,
    skipped: filesSkipped,
    failed: filesFailed,
    results
  };
}

/**
 * Upload a single file with progress tracking.
 *
 * @param {Object}   options                  Options object.
 * @param {string}   options.key              Storage key.
 * @param {Blob}     options.blob             File blob.
 * @param {Object}   options.storageService   StorageService instance.
 * @param {Function} options.setStatusMessage Status message callback.
 * @param {string}   options.contentType      MIME type.
 * @param {string}   options.displayName      Display name (optional, defaults to key).
 * @param {string}   options.statusKey        Unique key for status message (required).
 * @param {Function} options.onProgress       Progress callback (optional).
 * @param {boolean}  options.skipHashCheck    Boolean to skip hash checking (default: false).
 * @param {Object}   options.manifest         Manifest object (optional).
 * @param {Function} options.shouldSkipUpload Custom function to determine if file should be skipped (optional).
 * @param {Object}   options.metadata         Optional metadata object.
 * @return {Promise<Object>} Result with success, url, skipped, error.
 */
async function uploadSingleFileWithProgress({
  key,
  blob,
  storageService,
  setStatusMessage,
  contentType,
  displayName: providedDisplayName,
  statusKey,
  onProgress = null,
  skipHashCheck = false,
  manifest = null,
  shouldSkipUpload: customShouldSkipUpload = null,
  metadata = {}
}) {
  if (!statusKey) {
    throw new Error('statusKey is required for uploadSingleFileWithProgress');
  }

  // Ensure displayName is never empty - fallback to key, then to 'file'
  const displayName = providedDisplayName || key || 'file';
  let fileHash = null;
  let shouldSkip = false;
  try {
    // Hash checking and skip logic (if enabled)
    if (!skipHashCheck && manifest) {
      const fileSize = blob.size;
      const existingEntry = manifest[key];
      if (existingEntry && existingEntry.size === fileSize) {
        // Stage 2: Calculate hash if size matches
        try {
          fileHash = await calculateFileHash(blob);
          shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : shouldSkipUpload(manifest, key, fileSize, fileHash);
        } catch (error) {
          shouldSkip = false;
        }
      }
    }
    if (shouldSkip) {
      // File unchanged - skip upload
      if (setStatusMessage) {
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        setStatusMessage(sprintf(/* translators: %1$s: File name, %2$s: File size in MB */
        __('%1$s unchanged (%2$s MB) - skipping upload', 'aether-site-exporter'), displayName, fileSizeMB), 'success', statusKey);
      }
      return {
        success: true,
        url: null,
        skipped: true,
        error: null,
        hash: fileHash
      };
    }

    // Calculate hash if not already calculated (for manifest update)
    if (!fileHash && !skipHashCheck) {
      try {
        fileHash = await calculateFileHash(blob);
      } catch (error) {
        fileHash = null;
      }
    }
    const fileSize = blob.size;

    // Create status message with progress tracking
    if (setStatusMessage) {
      setStatusMessage(sprintf(/* translators: %s: File name */
      __('Uploading %s', 'aether-site-exporter'), displayName), 'progress', statusKey, {
        percent: 0,
        loaded: 0,
        total: fileSize
      });
    }

    // Upload file with progress tracking
    const uploadResult = await storageService.upload(key, blob, {
      contentType,
      cacheControl: metadata.cacheControl || 'public, max-age=31536000, immutable',
      onProgress: (loaded, total, percent) => {
        // Update progress in status message
        if (setStatusMessage) {
          setStatusMessage(sprintf(/* translators: %s: File name */
          __('Uploading %s', 'aether-site-exporter'), displayName), 'progress', statusKey, {
            percent,
            loaded,
            total
          });
        }

        // Call custom progress callback if provided
        if (onProgress) {
          onProgress(loaded, total, percent);
        }
      }
    });
    if (uploadResult.success) {
      // Update message to success (remove progress)
      if (setStatusMessage) {
        setStatusMessage(sprintf(/* translators: %s: File name */
        __('Uploaded %s', 'aether-site-exporter'), displayName), 'success', statusKey, null // Remove progress
        );
      }
      return {
        success: true,
        url: uploadResult.url,
        skipped: false,
        error: null,
        hash: fileHash,
        size: fileSize
      };
    }
    // Upload failed
    if (setStatusMessage) {
      setStatusMessage(sprintf(/* translators: %s: File name */
      __('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', statusKey, null);
    }
    return {
      success: false,
      url: null,
      skipped: false,
      error: uploadResult.error || __('Upload failed', 'aether-site-exporter'),
      hash: fileHash
    };
  } catch (error) {
    if (setStatusMessage) {
      setStatusMessage(sprintf(/* translators: %s: File name */
      __('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', statusKey, null);
    }
    return {
      success: false,
      url: null,
      skipped: false,
      error: error.message || 'Upload failed',
      hash: fileHash
    };
  }
}
;// ./assets/src/export/utils/uploadPhase.js
/**
 * Upload Phase
 *
 * Phase 2 of static site generation: Upload all files with accurate progress tracking.
 *
 */









/**
 * Fetch and prepare manifest for upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<Object>} Manifest object.
 */
async function prepareManifest(storageService, providerId, setStatusMessage) {
  let manifest = {};
  try {
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Fetching file manifest…', 'aether-site-exporter'), 'progress', 'fetchManifest');
    }
    manifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.fetch', null, storageService, providerId);
    if (manifest === null) {
      manifest = await fetchManifest(storageService);
    }
    const manifestEntryCount = Object.keys(manifest).length;
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %d: Number of manifest entries */
      (0,external_wp_i18n_namespaceObject.__)('Fetched file manifest (%d entries)', 'aether-site-exporter'), manifestEntryCount), 'success', 'fetchManifest');
    }
  } catch (error) {
    manifest = {};
  }
  return manifest;
}

/**
 * Process and upload assets for a given set of asset URLs.
 *
 * @param {Object}   options                    Upload options.
 * @param {Array}    options.assetUrls          Asset URLs to process.
 * @param {Object}   options.assetTracker       Asset tracker instance.
 * @param {Object}   options.storageService     Storage service instance.
 * @param {Object}   options.manifest           Manifest object.
 * @param {string}   options.providerId         Provider ID.
 * @param {number}   options.filesUploaded      Current files uploaded count.
 * @param {number}   options.totalFilesToUpload Total files to upload.
 * @param {Function} options.onProgress         Progress callback.
 * @param {Function} options.setStatusMessage   Status message updater.
 * @return {Promise<Object>} Updated counts and manifest.
 */
async function processAssets({
  assetUrls,
  assetTracker,
  storageService,
  manifest,
  providerId,
  filesUploaded,
  totalFilesToUpload,
  onProgress,
  setStatusMessage
}) {
  let currentFilesUploaded = filesUploaded;
  let filesSkipped = 0;
  const uploadedFiles = [];
  let currentManifest = manifest;

  // Filter out already processed assets
  const assetsNotInTracker = assetUrls.filter(assetUrl => !assetTracker.isUploaded(assetUrl));
  if (assetsNotInTracker.length === 0) {
    return {
      filesUploaded: currentFilesUploaded,
      filesSkipped,
      uploadedFiles,
      manifest: currentManifest
    };
  }

  // Fetch and prepare asset data
  const assetData = [];
  for (const assetUrl of assetsNotInTracker) {
    try {
      const assetResponse = await fetch(assetUrl, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (assetResponse.status !== 200) {
        continue;
      }
      const assetContent = await assetResponse.blob();
      const contentType = assetResponse.headers.get('content-type') || 'application/octet-stream';
      const assetPath = getAssetLocalPath(assetUrl);
      if (assetPath === null) {
        assetTracker.markFailed(assetUrl);
        continue;
      }
      const assetKey = assetPath;
      let assetBlob = new Blob([assetContent], {
        type: contentType
      });

      // Filter asset before processing
      const filteredAssetData = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.asset.process', {
        blob: assetBlob,
        path: assetPath,
        key: assetKey,
        contentType,
        url: assetUrl
      }, providerId);
      assetBlob = filteredAssetData.blob || assetBlob;
      const finalAssetPath = filteredAssetData.path || assetPath;
      const finalAssetKey = filteredAssetData.key || assetKey;
      const finalContentType = filteredAssetData.contentType || contentType;

      // Check manifest for skip
      const existingEntry = currentManifest[finalAssetKey];
      if (existingEntry && existingEntry.size === assetBlob.size) {
        try {
          const assetHash = await fileHash_calculateFileHash(assetBlob);
          if (manifestManager_shouldSkipUpload(currentManifest, finalAssetKey, assetBlob.size, assetHash)) {
            assetTracker.markUploaded(assetUrl);
            currentFilesUploaded++;
            filesSkipped++;
            uploadedFiles.push({
              storageKey: finalAssetKey,
              relativePath: finalAssetPath,
              contentType: finalContentType
            });
            continue;
          }
        } catch (error) {}
      }
      assetData.push({
        assetUrl,
        assetPath: finalAssetPath,
        assetKey: finalAssetKey,
        assetBlob,
        contentType: finalContentType
      });
    } catch (error) {}
  }

  // Prepare files for upload
  const filesToUpload = assetData.map(data => ({
    key: data.assetKey,
    blob: data.assetBlob,
    contentType: data.contentType,
    displayName: data.assetPath || data.assetKey || 'file',
    metadata: {},
    assetData: data
  }));

  // Upload in parallel
  const uploadResult = await uploadFilesWithProgress({
    files: filesToUpload,
    storageService,
    setStatusMessage,
    concurrency: 5,
    onProgress: uploaded => {
      if (onProgress) {
        onProgress(currentFilesUploaded + uploaded, totalFilesToUpload, null);
      }
    },
    keyPrefix: 'upload',
    skipHashCheck: false,
    manifest: currentManifest,
    shouldSkipUpload: manifestManager_shouldSkipUpload
  });

  // Process results
  for (const result of uploadResult.results) {
    const fileData = filesToUpload.find(f => f.key === result.key);
    if (!fileData) {
      continue;
    }
    const {
      assetUrl,
      assetPath,
      assetKey,
      contentType
    } = fileData.assetData;
    if (result.success) {
      assetTracker.markUploaded(assetUrl);
      currentFilesUploaded++;
      if (result.skipped) {
        filesSkipped++;
      }
      if (result.hash) {
        currentManifest = updateManifestEntry(currentManifest, assetKey, result.size || fileData.blob.size, result.hash, contentType);
        currentManifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.update', currentManifest, assetKey, providerId);
      }
      uploadedFiles.push({
        storageKey: assetKey,
        relativePath: assetPath,
        contentType
      });
    }
  }
  return {
    filesUploaded: currentFilesUploaded,
    filesSkipped,
    uploadedFiles,
    manifest: currentManifest
  };
}

/**
 * Upload a single HTML file.
 *
 * @param {Object}   options                  Upload options.
 * @param {string}   options.url              Page URL.
 * @param {string}   options.rawHtml          Raw HTML content.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.staticSiteUrl    Target static site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.storageService   Storage service instance.
 * @param {Object}   options.manifest         Manifest object.
 * @param {Function} options.setStatusMessage Status message updater.
 * @return {Promise<Object>} Upload result.
 */
async function uploadHtmlFile({
  url,
  rawHtml,
  siteUrl,
  staticSiteUrl,
  providerId,
  storageService,
  manifest,
  setStatusMessage
}) {
  // Filter HTML before processing
  let processedHtml = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.html.process', rawHtml, url, siteUrl, staticSiteUrl, providerId);

  // Process HTML with URL rewriting
  processedHtml = (0,htmlProcessor/* processHtml */.t)(processedHtml, url, siteUrl, staticSiteUrl);
  const htmlPath = (0,htmlProcessor/* getStaticFilePath */.W)(url);
  const htmlKey = htmlPath;
  const htmlBlob = new Blob([processedHtml], {
    type: 'text/html'
  });
  const htmlSize = htmlBlob.size;
  let htmlHash = null;
  let shouldSkip = false;

  // Check manifest for skip
  const existingEntry = manifest[htmlKey];
  if (existingEntry && existingEntry.size === htmlSize) {
    try {
      htmlHash = await fileHash_calculateFileHash(htmlBlob);
      shouldSkip = manifestManager_shouldSkipUpload(manifest, htmlKey, htmlSize, htmlHash);
    } catch (error) {
      shouldSkip = false;
    }
  }
  if (shouldSkip) {
    return {
      success: true,
      skipped: true,
      htmlPath,
      htmlKey,
      htmlHash,
      htmlSize
    };
  }

  // Calculate hash if not already calculated
  if (!htmlHash) {
    try {
      htmlHash = await fileHash_calculateFileHash(htmlBlob);
    } catch (error) {
      htmlHash = null;
    }
  }

  // Upload status
  if (setStatusMessage) {
    setStatusMessage(`Uploading ${htmlPath}`, 'progress', `upload-${htmlPath}`);
  }
  const htmlUploadResult = await storageService.upload(htmlKey, htmlBlob, {
    contentType: 'text/html'
  });
  if (!htmlUploadResult.success) {
    throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Failed to upload HTML file: %s', 'aether-site-exporter'), htmlUploadResult.error));
  }
  if (setStatusMessage) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File path */
    (0,external_wp_i18n_namespaceObject.__)('Uploaded %s', 'aether-site-exporter'), htmlPath), 'success', `upload-${htmlPath}`);
  }
  return {
    success: true,
    skipped: false,
    htmlPath,
    htmlKey,
    htmlHash,
    htmlSize
  };
}

/**
 * Finalize manifest after upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {Object}   manifest         Manifest object.
 * @param {Array}    uploadedFiles    Array of uploaded file info.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<void>}
 */
async function finalizeManifest(storageService, manifest, uploadedFiles, providerId, setStatusMessage) {
  try {
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Updating file manifest…', 'aether-site-exporter'), 'progress', 'updateManifest');
    }
    const currentFileKeys = new Set(uploadedFiles.map(file => file.storageKey));
    let cleanedManifest = cleanupManifest(manifest, currentFileKeys);
    cleanedManifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.cleanup', cleanedManifest, currentFileKeys, providerId);
    await uploadManifest(storageService, cleanedManifest);
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Updated file manifest', 'aether-site-exporter'), 'success', 'updateManifest');
    }
  } catch (error) {}
}
;// ./assets/src/export/hooks/useStaticSiteGenerator.js
/**
 * Static Site Generator Hook
 *
 * Processes URLs and uploads static site files using a two-phase approach:
 * 1. PHASE 1 (Pre-scan): Fetch all URLs, extract assets, count total files
 * 2. PHASE 2 (Upload): Upload all files with accurate progress
 *
 */






// Extracted modules




/**
 * Process URLs and upload static site files.
 *
 * @param {Function} onProgress Progress callback (uploadedFiles, totalFiles, message).
 * @return {Function} Process function.
 */
function useStaticSiteGenerator(onProgress) {
  const processUrls = (0,external_wp_element_namespaceObject.useCallback)(async (urls, staticSiteUrl, staticSiteProviderId, siteUrl, setStatusMessage, blueprintData, removeMessage = null, cache = null) => {
    // Validate provider ID is provided
    // CRITICAL: In multi-instance threading, each thread MUST use its own provider ID
    if (!staticSiteProviderId) {
      throw new Error('Static site provider ID is required. ' + 'This function must be called with a specific provider instance ID.');
    }

    // Create asset tracker to prevent duplicate uploads
    const assetTracker = createAssetTracker();

    // Track all uploaded files for manifest generation
    const uploadedFiles = [];

    // Track failures for reporting
    const failures = createFailureTracker();

    // Get provider configuration
    const providerConfig = await fetchProviderConfig(staticSiteProviderId);
    const staticPath = providerConfig.static_files_path || 'static/';

    // Build and create storage service
    const config = buildStorageConfig(siteUrl, staticSiteUrl, staticSiteProviderId);
    const storageService = await createStorageService(staticPath, config, staticSiteProviderId, providerConfig);
    const totalUrls = urls.length;

    // PHASE 1: Pre-scan all URLs (use shared HTML data if provided)
    const preScanResult = await executePreScan({
      urls,
      siteUrl,
      providerId: staticSiteProviderId,
      providerConfig,
      setStatusMessage,
      htmlData: cache
    });
    const {
      htmlData: sharedHtmlData,
      totalFilesToUpload
    } = preScanResult;

    // Merge pre-scan failures
    failures.urlsFailed += preScanResult.failures.urlsFailed;
    failures.failedUrls.push(...preScanResult.failures.failedUrls);

    // PHASE 2: Upload all files
    let manifest = await prepareManifest(storageService, staticSiteProviderId, setStatusMessage);
    let filesUploaded = 0;
    let filesSkipped = 0;

    // Get URLs from HTML data storage
    const fetchedUrls = Array.from(sharedHtmlData.keys());

    // Validate that we have URLs to process
    if (fetchedUrls.length === 0) {
      throw new Error('No HTML data available for upload. Please ensure preScanStaticSite step completed successfully.');
    }

    // Fire upload start action
    (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.upload.before', fetchedUrls, totalFilesToUpload, staticSiteProviderId);

    // Process each URL
    for (const url of fetchedUrls) {
      const htmlDataEntry = sharedHtmlData.get(url);
      if (!htmlDataEntry) {
        continue;
      }

      // Validate data structure - expect { rawHtml, assetUrls } object
      if (typeof htmlDataEntry !== 'object' || htmlDataEntry === null) {
        continue;
      }
      if (!htmlDataEntry.rawHtml || !Array.isArray(htmlDataEntry.assetUrls)) {
        continue;
      }
      const {
        rawHtml,
        assetUrls
      } = htmlDataEntry;
      try {
        // Update progress message
        if (setStatusMessage) {
          setStatusMessage(`Uploading files (${filesUploaded + 1}/${totalFilesToUpload})`, 'progress', 'uploadFilesProgress');
        }

        // Upload HTML file
        const htmlResult = await uploadHtmlFile({
          url,
          rawHtml,
          siteUrl,
          staticSiteUrl,
          providerId: staticSiteProviderId,
          storageService,
          manifest,
          setStatusMessage
        });
        filesUploaded++;
        failures.urlsSucceeded++;
        if (htmlResult.skipped) {
          filesSkipped++;
          if (setStatusMessage) {
            setStatusMessage(`Skipped unchanged file ${htmlResult.htmlPath}`, 'success', `upload-${htmlResult.htmlPath}`);
          }
        }

        // Update manifest if hash available
        if (htmlResult.htmlHash && !htmlResult.skipped) {
          manifest = updateManifestEntry(manifest, htmlResult.htmlKey, htmlResult.htmlSize, htmlResult.htmlHash, 'text/html');
          manifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.update', manifest, htmlResult.htmlKey, staticSiteProviderId);
        }

        // Track uploaded file
        uploadedFiles.push({
          storageKey: htmlResult.htmlKey,
          relativePath: htmlResult.htmlPath,
          contentType: 'text/html'
        });

        // Report progress
        if (onProgress) {
          onProgress(filesUploaded, totalFilesToUpload, null);
        }

        // Process assets for this page
        const assetResult = await processAssets({
          assetUrls,
          assetTracker,
          storageService,
          manifest,
          providerId: staticSiteProviderId,
          filesUploaded,
          totalFilesToUpload,
          onProgress,
          setStatusMessage
        });
        filesUploaded = assetResult.filesUploaded;
        filesSkipped += assetResult.filesSkipped;
        uploadedFiles.push(...assetResult.uploadedFiles);
        manifest = assetResult.manifest;

        // Periodic manifest save
        if (filesUploaded % 50 === 0) {
          try {
            await uploadManifest(storageService, manifest);
          } catch (error) {
            // Manifest save failed, continue with upload
          }
        }
      } catch (error) {
        failures.urlsFailed++;
        failures.failedUrls.push({
          url,
          reason: error.message
        });
      }
    }

    // Note: HTML data cleanup is handled at the workflow level (uploadStaticFiles step)
    // to ensure it happens once for all providers, not per provider

    // Finalize manifest
    await finalizeManifest(storageService, manifest, uploadedFiles, staticSiteProviderId, setStatusMessage);

    // Remove progress message
    if (removeMessage) {
      removeMessage('uploadFilesProgress');
    }

    // Fire completion action
    (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.upload.after', {
      filesUploaded,
      filesSkipped,
      urlsSucceeded: failures.urlsSucceeded,
      urlsFailed: failures.urlsFailed,
      assetsUploaded: assetTracker.getCount()
    }, staticSiteProviderId);

    // Return result
    return buildUploadResult(failures, assetTracker, filesUploaded, filesSkipped, totalFilesToUpload, uploadedFiles, totalUrls);
  }, [onProgress]);
  return processUrls;
}
;// ./assets/src/export/utils/blueprintStepBuilders.js
/**
 * Blueprint Step Builders
 *
 * Utility functions for constructing individual WordPress Playground blueprint steps.
 * Each function is responsible for creating a single step or group of related steps.
 *
 */



/**
 * Build the importWordPressFiles step for importing wp-content.zip.
 *
 * Uses 'bundled' resource type to reference wp-content.zip inside the blueprint-bundle.zip.
 *
 * @return {Object} Blueprint step object.
 */
function buildImportFilesStep() {
  return {
    step: 'importWordPressFiles',
    wordPressFilesZip: {
      resource: 'bundled',
      path: '/wp-content.zip'
    }
  };
}

/**
 * Build installPlugin steps for WordPress.org plugins.
 *
 * @param {Array<string>} pluginSlugs Array of WordPress.org plugin slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
function buildPluginInstallSteps(pluginSlugs) {
  if (!Array.isArray(pluginSlugs)) {
    return [];
  }
  return pluginSlugs.map(slug => ({
    step: 'installPlugin',
    pluginData: {
      resource: 'wordpress.org/plugins',
      slug
    },
    options: {
      activate: false
    }
  }));
}

/**
 * Build installTheme steps for WordPress.org themes.
 *
 * @param {Array<string>} themeSlugs Array of WordPress.org theme slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
function buildThemeInstallSteps(themeSlugs) {
  if (!Array.isArray(themeSlugs)) {
    return [];
  }
  return themeSlugs.map(slug => ({
    step: 'installTheme',
    themeData: {
      resource: 'wordpress.org/themes',
      slug
    },
    options: {
      activate: false
    }
  }));
}

/**
 * Build complete blueprint steps array.
 *
 * @param {Object} config              Configuration object.
 * @param {Array}  config.wporgPlugins WordPress.org plugin slugs.
 * @param {Array}  config.wporgThemes  WordPress.org theme slugs.
 * @return {Array<Object>} Complete array of blueprint steps.
 */
function buildBlueprintSteps(config) {
  const {
    wporgPlugins = [],
    wporgThemes = []
  } = config;
  const steps = [];

  // Step 1: Import WordPress files (wp-content.zip from bundle).
  steps.push(buildImportFilesStep());

  // Step 2: Install WordPress.org plugins.
  steps.push(...buildPluginInstallSteps(wporgPlugins));

  // Step 3: Install WordPress.org themes.
  steps.push(...buildThemeInstallSteps(wporgThemes));

  /**
   * Filter blueprint steps array.
   *
   * Allows modification of blueprint steps before final JSON generation.
   *
   * @param {Array<Object>} steps  Blueprint steps array.
   * @param {Object}        config Configuration object with wporgPlugins, wporgThemes.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.export.step.createBlueprintBundle.steps', 'my-plugin', (steps, config) => {
   *     // Add custom step at the end
   *     steps.push({
   *         step: 'runPHP',
   *         code: '<?php update_option("my_custom_option", "value"); ?>'
   *     });
   *     return steps;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.steps', steps, config);
}

/**
 * Build complete blueprint JSON object.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Object} Complete blueprint JSON.
 */
function buildBlueprintJson(steps) {
  const blueprint = {
    $schema: 'https://playground.wordpress.net/blueprint-schema.json',
    landingPage: '/wp-login.php',
    preferredVersions: {
      php: '8.4',
      wp: 'latest'
    },
    features: {
      networking: true
    },
    steps
  };

  /**
   * Filter complete blueprint JSON object.
   *
   * Allows modification of the final blueprint configuration.
   *
   * @param {Object} blueprint Complete blueprint JSON object.
   * @param {Array}  steps     Blueprint steps array.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.export.step.createBlueprintBundle.json', 'my-plugin', (blueprint, steps) => {
   *     // Customize landing page
   *     blueprint.landingPage = '/wp-admin/';
   *
   *     // Change PHP version
   *     blueprint.preferredVersions.php = '8.3';
   *
   *     // Add login credentials
   *     blueprint.login = {
   *         username: 'admin',
   *         password: 'password'
   *     };
   *
   *     return blueprint;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.json', blueprint, steps);
}
;// ./assets/src/export/hooks/useBlueprintGenerator.js
/**
 * Blueprint Generator Hook
 *
 * Generates WordPress Playground blueprint JSON for site deployment.
 * Fetches WordPress.org plugin/theme slugs and constructs blueprint with bundled resources.
 *
 */






/**
 * Hook for generating WordPress Playground blueprint JSON.
 *
 * @return {Object} Object with generateBlueprint function.
 */
function useBlueprintGenerator() {
  const assetDiscovery = useAssetDiscovery();
  const generateBlueprint = (0,external_wp_element_namespaceObject.useCallback)(
  /**
   * Generate blueprint JSON.
   *
   * @param {Object}   [options]          Optional options object.
   * @param {Function} [setStatusMessage] Optional status message callback.
   * @return {Promise<Object>} Blueprint JSON object.
   */
  async (options = null, setStatusMessage = null) => {
    // Handle case where first argument is setStatusMessage (backwards compatibility).
    let actualSetStatusMessage;
    if (typeof options === 'function') {
      actualSetStatusMessage = options;
    } else {
      actualSetStatusMessage = setStatusMessage;
    }
    // Fetch WordPress.org plugin/theme slugs and site name using browser-based discovery.
    if (actualSetStatusMessage) {
      actualSetStatusMessage('Detecting WordPress.org plugins and themes…', 'progress', 'detectWporgAssets');
    }
    const assetsResponse = await assetDiscovery.getBlueprintAssets();
    let {
      plugins: wporgPlugins,
      themes: wporgThemes
    } = assetsResponse;

    /**
     * Filter discovered WordPress.org assets.
     *
     * Allows modification of detected plugins and themes before blueprint generation.
     *
     * @param {Object}        assets         Discovered assets object.
     * @param {Array<string>} assets.plugins WordPress.org plugin slugs.
     * @param {Array<string>} assets.themes  WordPress.org theme slugs.
     * @param {Object}        assetsResponse Full asset discovery response.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.export.step.createBlueprintBundle.assets', 'my-plugin', (assets) => {
     *     // Exclude specific plugins
     *     assets.plugins = assets.plugins.filter(slug => slug !== 'unwanted-plugin');
     *
     *     // Add additional plugins
     *     assets.plugins.push('my-required-plugin');
     *
     *     return assets;
     * });
     */
    const filteredAssets = (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.assets', {
      plugins: wporgPlugins,
      themes: wporgThemes
    }, assetsResponse);
    wporgPlugins = filteredAssets.plugins || [];
    wporgThemes = filteredAssets.themes || [];

    // Start configuring Playground settings
    if (actualSetStatusMessage) {
      actualSetStatusMessage('Configuring WordPress Playground settings…', 'progress', 'configurePlayground');
    }

    // Build blueprint steps array with bundled wp-content resources.
    const steps = buildBlueprintSteps({
      wporgPlugins,
      wporgThemes
    });

    // Construct blueprint JSON.
    let blueprint = buildBlueprintJson(steps);
    if (actualSetStatusMessage) {
      actualSetStatusMessage(`Blueprint generated: ${steps.length} total steps`, 'success', 'createBlueprintBundle');
      // Update detection message to success
      actualSetStatusMessage('Detected WordPress.org plugins and themes', 'success', 'detectWporgAssets');
      // Update configuration message to success
      actualSetStatusMessage('Configured WordPress Playground settings', 'success', 'configurePlayground');
      // Update plugin/theme messages to success
      // Keep original message text, just update type to success
      if (wporgPlugins.length > 0) {
        const pluginNames = wporgPlugins.join(', ');
        actualSetStatusMessage(`Adding ${wporgPlugins.length} WordPress.org plugin${wporgPlugins.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addPluginsToBlueprint');
        actualSetStatusMessage(`Plugins: ${pluginNames}`, 'success', 'pluginsList');
      }
      if (wporgThemes.length > 0) {
        const themeNames = wporgThemes.join(', ');
        actualSetStatusMessage(`Adding ${wporgThemes.length} WordPress.org theme${wporgThemes.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addThemesToBlueprint');
        actualSetStatusMessage(`Themes: ${themeNames}`, 'success', 'themesList');
      }
    }

    /**
     * Filter final generated blueprint.
     *
     * Allows final modification of blueprint before it's used for deployment.
     *
     * @param {Object}        blueprint    Complete blueprint JSON object.
     * @param {Array<string>} wporgPlugins WordPress.org plugin slugs.
     * @param {Array<string>} wporgThemes  WordPress.org theme slugs.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.export.step.createBlueprintBundle.generated', 'my-plugin', (blueprint) => {
     *     // Add custom metadata
     *     blueprint.description = 'My custom WordPress site';
     *
     *     return blueprint;
     * });
     */
    blueprint = (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.generated', blueprint, wporgPlugins, wporgThemes);
    return blueprint;
  }, [assetDiscovery]);
  return {
    generateBlueprint
  };
}
;// ./assets/src/constants/deploymentTypes.js
/**
 * Deployment type constants and labels
 *
 */



/**
 * Deployment type identifiers
 */
const DEPLOYMENT_TYPES = {
  STATIC_SITE: 'static_site',
  BLUEPRINT_BUNDLE: 'blueprint_bundle',
  EDGE_FUNCTIONS: 'edge_functions'
};

/**
 * Human-readable labels for deployment types
 */
const DEPLOYMENT_TYPE_LABELS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Static Site', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Blueprint Bundle', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Edge Functions', 'aether-site-exporter')
};
;// ./assets/src/export/executor/DataValidator.js
/**
 * Data Validator
 *
 * Validates data dependencies between workflow steps.
 * Ensures all required data exists before step execution
 * and validates output matches declared provides.
 *
 * Supports scope validation for multi-threaded execution:
 * - Global scope: Data shared across all threads (read-only)
 * - Thread scope: Data isolated to specific provider instance thread
 *
 * @since 1.0.0
 */



/**
 * Determine if a step is a per-thread step
 *
 * A step is per-thread if it requires data from 'thread' source.
 *
 * @param {Object} step - Step definition
 * @return {boolean} True if step is per-thread
 */
function isThreadStep(step) {
  if (!step.requires) {
    return false;
  }
  return Object.values(step.requires).some(requirement => requirement.from === 'thread');
}

/**
 * Get the scope of provided data
 *
 * @param {Object} step - Step definition
 * @param {string} key  - Data key
 * @return {string} 'global' or 'thread'
 */
function getProvideScope(step, key) {
  if (!step.provides || !step.provides[key]) {
    return 'thread'; // Default to thread scope
  }
  const definition = step.provides[key];
  if (typeof definition !== 'object' || definition === null) {
    throw new Error(`Step "${step.id}" provides "${key}" with invalid format. Expected object with scope property.`);
  }
  return definition.scope || 'thread';
}

/**
 * Validate scope consistency
 *
 * Ensures that:
 * - Thread steps only provide thread-scoped data
 * - Global steps only provide global-scoped data
 * - No scope mismatches
 *
 * @param {Object} step - Step definition
 * @throws {Error} If scope is inconsistent
 */
function validateScope(step) {
  if (!step.provides) {
    return;
  }
  const isThread = isThreadStep(step);
  const errors = [];
  Object.entries(step.provides).forEach(([key]) => {
    const scope = getProvideScope(step, key);

    // Thread steps should only provide thread-scoped data
    if (isThread && scope === 'global') {
      errors.push(`"${key}" is declared as global scope but step "${step.id}" is a thread step`);
    }

    // Global steps should only provide global-scoped data
    if (!isThread && scope === 'thread') {
      errors.push(`"${key}" is declared as thread scope but step "${step.id}" is a global step`);
    }
  });
  if (errors.length > 0) {
    throw new Error(`Step "${step.id}" has scope inconsistencies:\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * Validate step data requirements
 *
 * Checks that all required data exists in context before step execution.
 *
 * @param {Object} step    - Step definition
 * @param {Object} context - Execution context
 * @throws {Error} If required data is missing
 */
function validate(step, context) {
  if (!step.requires) {
    return;
  }
  const missingDetails = [];
  Object.entries(step.requires).forEach(([key, requirement]) => {
    const isRequired = requirement.required !== false;
    if (!(key in context) && isRequired) {
      missingDetails.push(`  - "${key}" (from: ${requirement.from})`);
    }
  });
  if (missingDetails.length > 0) {
    throw new Error(`Step "${step.id}" is missing required data:\n${missingDetails.join('\n')}`);
  }
}

/**
 * Validate step output
 *
 * Checks that step handler returned all declared provides.
 *
 * @param {Object} step   - Step definition
 * @param {Object} result - Step handler result
 * @throws {Error} If provided data is missing
 */
function validateOutput(step, result) {
  if (!step.provides || !result) {
    return;
  }
  const missing = [];
  Object.keys(step.provides).forEach(key => {
    if (!(key in result)) {
      missing.push(key);
    }
  });
  if (missing.length > 0) {
    throw new Error(`Step "${step.id}" did not provide declared outputs: ${missing.join(', ')}`);
  }
}

/**
 * Get data requirements summary
 *
 * Returns a human-readable summary of what data a step requires.
 *
 * @param {Object} step - Step definition
 * @return {string} Requirements summary
 */
function getRequirementsSummary(step) {
  if (!step.requires) {
    return (0,external_wp_i18n_namespaceObject.__)('No data requirements', 'aether-site-exporter');
  }
  const requirements = Object.entries(step.requires).map(([key, requirement]) => {
    const required = requirement.required !== false;
    const requiredLabel = required ? 'required' : 'optional';
    return `  - ${key} (from: ${requirement.from}, ${requiredLabel})`;
  });
  return requirements.join('\n');
}

/**
 * Get provides summary
 *
 * Returns a human-readable summary of what data a step provides.
 *
 * @param {Object} step - Step definition
 * @return {string} Provides summary
 */
function getProvidesSummary(step) {
  if (!step.provides) {
    return (0,external_wp_i18n_namespaceObject.__)('No data provided', 'aether-site-exporter');
  }
  const provides = Object.entries(step.provides).map(([key, definition]) => {
    if (typeof definition !== 'object' || definition === null) {
      throw new Error(`Step "${step.id}" provides "${key}" with invalid format. Expected object with type and scope properties.`);
    }
    const type = definition.type || 'unknown';
    const scope = definition.scope || 'thread';
    return `  - ${key} (type: ${type}, scope: ${scope})`;
  });
  return provides.join('\n');
}
/* harmony default export */ const DataValidator = ({
  validate,
  validateOutput,
  validateScope,
  isThreadStep,
  getProvideScope,
  getRequirementsSummary,
  getProvidesSummary
});
;// ./assets/src/export/executor/DependencyResolver.js
/**
 * Dependency Resolver
 *
 * Resolves step dependencies and builds parallel execution plan.
 * Uses topological sort to determine execution order.
 *
 */

/**
 * Build a parallel execution plan from steps with dependencies.
 *
 * Returns an array of arrays, where each inner array contains step IDs
 * that can be executed in parallel.
 *
 * @param {Array<Object>} steps Array of step definitions with id and dependencies.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
function DependencyResolver_buildParallelPlan(steps) {
  const stepIds = new Set(steps.map(s => s.id));
  const remaining = new Set(stepIds);
  const result = [];
  while (remaining.size > 0) {
    // Find all steps whose dependencies are satisfied (not in remaining)
    const ready = [...remaining].filter(stepId => {
      const step = steps.find(s => s.id === stepId);
      const deps = step.dependencies || [];
      // All dependencies must be completed (not in remaining)
      return deps.every(depId => !remaining.has(depId));
    });
    if (ready.length === 0 && remaining.size > 0) {
      const unresolved = [...remaining].join(', ');
      throw new Error(`Circular dependency detected. Unresolved steps: ${unresolved}`);
    }

    // These steps can run in parallel
    result.push(ready);

    // Remove from remaining
    ready.forEach(id => remaining.delete(id));
  }
  return result;
}

/**
 * Validate step dependencies.
 *
 * Checks that all declared dependencies reference existing steps.
 *
 * @param {Array<Object>} allSteps     All step definitions (for dependency lookup).
 * @param {Array<Object>} stepsToCheck Steps to validate (defaults to allSteps).
 * @return {Array<string>} Array of validation errors (empty if valid).
 */
function validateDependencies(allSteps, stepsToCheck = null) {
  const errors = [];
  const stepsToValidate = stepsToCheck || allSteps;
  const stepIds = new Set(allSteps.map(s => s.id));
  stepsToValidate.forEach(step => {
    const deps = step.dependencies || [];
    deps.forEach(depId => {
      if (!stepIds.has(depId)) {
        errors.push(`Step "${step.id}" depends on unknown step "${depId}"`);
      }
    });
  });
  return errors;
}

/**
 * Get execution order as a flat array.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<string>} Flat array of step IDs in execution order.
 */
function getExecutionOrder(steps) {
  const plan = DependencyResolver_buildParallelPlan(steps);
  return plan.flat();
}
;// ./assets/src/export/utils/progressTracker.js
/**
 * Progress Tracker Utility
 *
 * Tracks export workflow progress with equal step weights and IndexedDB persistence.
 * Each step gets equal weight: 100% / number of steps.
 *
 */


const DB_CONFIG = {
  dbName: 'aether-export-progress',
  version: 1,
  stores: {
    progress: {
      keyPath: 'workflowId'
    }
  }
};

// Initialize store instance
let storeInstance = null;

/**
 * Get or create IndexedDB store instance.
 *
 * @return {IndexedDBStore|null} Store instance or null if unavailable.
 */
function getStore() {
  if (!isIndexedDBAvailable()) {
    return null;
  }
  if (!storeInstance) {
    storeInstance = new utils_indexedDB('progress', DB_CONFIG);
  }
  return storeInstance;
}

/**
 * Save progress to IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @param {Object} progress   Progress data.
 * @return {Promise<void>}
 */
async function saveProgress(workflowId, progress) {
  const store = getStore();
  if (!store) {
    return; // Silently fail if IndexedDB unavailable
  }
  try {
    await store.set(workflowId, {
      ...progress,
      timestamp: Date.now()
    });
  } catch (error) {
    // Don't throw - progress tracking is non-critical
  }
}

/**
 * Load progress from IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<Object|null>} Progress data or null if not found.
 */
async function loadProgress(workflowId) {
  const store = getStore();
  if (!store) {
    return null;
  }
  try {
    const result = await store.get(workflowId);
    return result || null;
  } catch (error) {
    return null;
  }
}

/**
 * Delete progress from IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<void>}
 */
async function deleteProgress(workflowId) {
  const store = getStore();
  if (!store) {
    return;
  }
  try {
    await store.delete(workflowId);
  } catch (error) {
    // Don't throw - cleanup is non-critical
  }
}

/**
 * Create a progress tracker instance.
 *
 * @param {string}        workflowId         Unique workflow identifier.
 * @param {Array<string>} stepIds            Array of step IDs in execution order.
 * @param {Function}      [onProgressChange] Callback when progress changes.
 * @return {Object} Progress tracker instance.
 */
function createProgressTracker(workflowId, stepIds, onProgressChange = null) {
  // Calculate equal step weight
  const stepWeight = stepIds.length > 0 ? 100 / stepIds.length : 0;

  // Initialize progress state
  let progressState = {
    workflowId,
    stepIds,
    stepWeight,
    stepProgress: {},
    overallProgress: 0,
    completedSteps: [],
    startedAt: Date.now(),
    updatedAt: Date.now()
  };

  /**
   * Update progress for a specific step.
   *
   * @param {string} stepId   Step identifier.
   * @param {number} progress Step progress (0-100).
   * @return {Promise<void>}
   */
  async function updateStepProgress(stepId, progress) {
    // Validate step ID
    if (!stepIds.includes(stepId)) {
      return;
    }

    // Clamp progress to 0-100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    // Update step progress
    progressState.stepProgress[stepId] = clampedProgress;
    progressState.updatedAt = Date.now();

    // Calculate overall progress
    // Sum of (stepWeight * stepProgress / 100) for all steps
    let totalProgress = 0;
    for (const id of stepIds) {
      const stepProg = progressState.stepProgress[id] || 0;
      totalProgress += stepWeight * stepProg / 100;
    }
    progressState.overallProgress = Math.min(100, Math.round(totalProgress));

    // Save to IndexedDB
    await saveProgress(workflowId, progressState);

    // Notify callback
    if (onProgressChange) {
      onProgressChange({
        stepId,
        stepProgress: clampedProgress,
        overallProgress: progressState.overallProgress,
        progressState
      });
    }
  }

  /**
   * Mark a step as completed.
   *
   * @param {string} stepId Step identifier.
   * @return {Promise<void>}
   */
  async function completeStep(stepId) {
    await updateStepProgress(stepId, 100);
    if (!progressState.completedSteps.includes(stepId)) {
      progressState.completedSteps.push(stepId);
      await saveProgress(workflowId, progressState);
    }
  }

  /**
   * Get current progress state.
   *
   * @return {Object} Progress state.
   */
  function getProgress() {
    return {
      ...progressState
    };
  }

  /**
   * Load progress from IndexedDB.
   *
   * @return {Promise<Object|null>} Progress state or null.
   */
  async function load() {
    const saved = await loadProgress(workflowId);
    if (saved) {
      progressState = {
        ...progressState,
        ...saved
      };
      return progressState;
    }
    return null;
  }

  /**
   * Clear progress from IndexedDB.
   *
   * @return {Promise<void>}
   */
  async function clear() {
    await deleteProgress(workflowId);
    progressState = {
      workflowId,
      stepIds,
      stepWeight,
      stepProgress: {},
      overallProgress: 0,
      completedSteps: [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  return {
    updateStepProgress,
    completeStep,
    getProgress,
    load,
    clear
  };
}

/**
 * Calculate overall progress with equal step weights.
 *
 * @param {Array<string>} stepIds      Array of step IDs.
 * @param {Object}        stepProgress Object mapping step IDs to progress (0-100).
 * @return {number} Overall progress (0-100).
 */
function calculateOverallProgress(stepIds, stepProgress) {
  if (stepIds.length === 0) {
    return 0;
  }
  const stepWeight = 100 / stepIds.length;
  let totalProgress = 0;
  for (const stepId of stepIds) {
    const progress = stepProgress[stepId] || 0;
    totalProgress += stepWeight * progress / 100;
  }
  return Math.min(100, Math.round(totalProgress));
}
;// ./assets/src/export/utils/stateManager.js
/**
 * State Manager Utility
 *
 * Manages workflow state persistence using IndexedDB.
 * Uses a single database with provider instance keys for state isolation.
 * State is automatically saved and can be resumed after failures.
 *
 */


const stateManager_DB_CONFIG = {
  dbName: 'aether-export-state',
  version: 1,
  stores: {
    workflowState: {
      keyPath: 'stateKey',
      indexes: [{
        name: 'workflowId',
        keyPath: 'workflowId',
        unique: false
      }]
    }
  }
};

// Initialize store instance
let stateManager_storeInstance = null;

/**
 * Get or create IndexedDB store instance.
 *
 * @return {IndexedDBStore|null} Store instance or null if unavailable.
 */
function stateManager_getStore() {
  if (!isIndexedDBAvailable()) {
    return null;
  }
  if (!stateManager_storeInstance) {
    stateManager_storeInstance = new utils_indexedDB('workflowState', stateManager_DB_CONFIG);
  }
  return stateManager_storeInstance;
}

/**
 * Generate a state key from workflow ID and provider instance.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {string} State key.
 */
function generateStateKey(workflowId, providerInstance = null) {
  if (providerInstance) {
    return `${workflowId}::${providerInstance}`;
  }
  return workflowId;
}

/**
 * Save workflow state to IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {Object} state            State object to save.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<void>}
 */
async function saveState(workflowId, state, providerInstance = null) {
  const store = stateManager_getStore();
  if (!store) {
    return; // Silently fail if IndexedDB unavailable
  }
  const stateKey = generateStateKey(workflowId, providerInstance);
  const stateData = {
    stateKey,
    workflowId,
    providerInstance: providerInstance || null,
    state,
    timestamp: Date.now()
  };
  try {
    await store.set(stateKey, stateData);
  } catch (error) {
    // Don't throw - state persistence is non-critical
  }
}

/**
 * Load workflow state from IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<Object|null>} State object or null if not found.
 */
async function loadState(workflowId, providerInstance = null) {
  const store = stateManager_getStore();
  if (!store) {
    return null;
  }
  const stateKey = generateStateKey(workflowId, providerInstance);
  try {
    const result = await store.get(stateKey);
    if (result && result.state) {
      return result.state;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Delete workflow state from IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional, null deletes all for workflow).
 * @return {Promise<void>}
 */
async function deleteState(workflowId, providerInstance = null) {
  const store = stateManager_getStore();
  if (!store) {
    return;
  }
  try {
    if (providerInstance) {
      // Delete specific provider instance state
      const stateKey = generateStateKey(workflowId, providerInstance);
      await store.delete(stateKey);
    } else {
      // Delete all states for this workflow
      // Get all states for this workflow using index
      const allStates = await store.getByIndex('workflowId', workflowId);

      // Delete each state
      for (const stateItem of allStates) {
        await store.delete(stateItem.stateKey);
      }
    }
  } catch (error) {
    // Don't throw - cleanup is non-critical
  }
}

/**
 * List all workflow states for a workflow ID.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<Array<Object>>} Array of state objects.
 */
async function listStates(workflowId) {
  const store = stateManager_getStore();
  if (!store) {
    return [];
  }
  try {
    const allStates = await store.getByIndex('workflowId', workflowId);
    return allStates.map(stateItem => ({
      stateKey: stateItem.stateKey,
      providerInstance: stateItem.providerInstance,
      timestamp: stateItem.timestamp
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Create a state manager instance for a workflow.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Object} State manager instance.
 */
function createStateManager(workflowId) {
  /**
   * Save workflow state.
   *
   * @param {Object} state            State object to save.
   * @param {string} providerInstance Provider instance ID (optional).
   * @return {Promise<void>}
   */
  async function save(state, providerInstance = null) {
    await saveState(workflowId, state, providerInstance);
  }

  /**
   * Load workflow state.
   *
   * @param {string} providerInstance Provider instance ID (optional).
   * @return {Promise<Object|null>} State object or null.
   */
  async function load(providerInstance = null) {
    return await loadState(workflowId, providerInstance);
  }

  /**
   * Delete workflow state.
   *
   * @param {string} providerInstance Provider instance ID (optional, null deletes all).
   * @return {Promise<void>}
   */
  async function clear(providerInstance = null) {
    await deleteState(workflowId, providerInstance);
  }

  /**
   * List all states for this workflow.
   *
   * @return {Promise<Array<Object>>} Array of state metadata.
   */
  async function list() {
    return await listStates(workflowId);
  }
  return {
    save,
    load,
    clear,
    list
  };
}

/**
 * Save execution context state.
 *
 * This is a helper function that saves the relevant parts of the execution context.
 *
 * @param {Object} stateManager     State manager instance.
 * @param {Object} executionContext Execution context to save.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<void>}
 */
async function saveExecutionContext(stateManager, executionContext, providerInstance = null) {
  // Extract relevant state (exclude functions and non-serializable data)
  const stateToSave = {
    completedSteps: executionContext.completedSteps || [],
    skippedSteps: executionContext.skippedSteps || [],
    state: executionContext.state || {},
    // Save step results
    stepResults: {},
    // Save provider-specific data
    providers: {
      staticSiteProviders: executionContext.staticSiteProviders || [],
      blueprintBundleProviders: executionContext.blueprintBundleProviders || [],
      edgeFunctionProviders: executionContext.edgeFunctionProviders || []
    },
    // Save configuration
    siteUrl: executionContext.siteUrl,
    staticSiteUrl: executionContext.staticSiteUrl,
    blueprintData: executionContext.blueprintData
  };

  // Extract step results from state
  if (executionContext.state) {
    for (const [key, value] of Object.entries(executionContext.state)) {
      if (key.includes('Result') || key.includes('Bundle') || key.includes('Urls')) {
        stateToSave.stepResults[key] = value;
      }
    }
  }
  await stateManager.save(stateToSave, providerInstance);
}

/**
 * Restore execution context from saved state.
 *
 * @param {Object} stateManager     State manager instance.
 * @param {Object} baseContext      Base context to merge with.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<Object>} Restored execution context.
 */
async function restoreExecutionContext(stateManager, baseContext, providerInstance = null) {
  const savedState = await stateManager.load(providerInstance);
  if (!savedState) {
    return baseContext;
  }

  // Merge saved state into base context
  const restoredContext = {
    ...baseContext,
    completedSteps: savedState.completedSteps || [],
    skippedSteps: savedState.skippedSteps || [],
    state: {
      ...baseContext.state,
      ...savedState.state,
      ...savedState.stepResults
    }
  };

  // Restore provider arrays if available
  if (savedState.providers) {
    restoredContext.staticSiteProviders = savedState.providers.staticSiteProviders || baseContext.staticSiteProviders;
    restoredContext.blueprintBundleProviders = savedState.providers.blueprintBundleProviders || baseContext.blueprintBundleProviders;
    restoredContext.edgeFunctionProviders = savedState.providers.edgeFunctionProviders || baseContext.edgeFunctionProviders;
  }

  // Restore configuration
  if (savedState.siteUrl) {
    restoredContext.siteUrl = savedState.siteUrl;
  }
  if (savedState.staticSiteUrl) {
    restoredContext.staticSiteUrl = savedState.staticSiteUrl;
  }
  if (savedState.blueprintData) {
    restoredContext.blueprintData = savedState.blueprintData;
  }
  return restoredContext;
}
;// ./assets/src/export/executor/StepExecutor.js
/**
 * Step Executor
 *
 * Executes export workflow steps with automatic dependency resolution
 * and parallel execution support.
 *
 */








/**
 * Execute a workflow with the given steps.
 *
 * @param {Array<Object>} steps              Array of step definitions to execute.
 * @param {Object}        context            Initial context with dependencies and state.
 * @param {Object}        options            Execution options.
 * @param {Array<Object>} [options.allSteps] Optional: All steps (for dependency validation when executing subset).
 * @return {Promise<Object>} Final execution state.
 */
async function executeSteps(steps, context, options = {}) {
  const {
    onStepStart = () => {},
    onStepComplete = () => {},
    onStepSkipped = () => {},
    onError = () => {},
    allSteps = null // Optional: All steps for dependency validation
  } = options;

  // Validate dependencies
  // Use allSteps if provided (for thread steps that depend on global steps),
  // otherwise use the steps array itself
  const stepsForValidation = allSteps || steps;
  const errors = validateDependencies(stepsForValidation, steps);
  if (errors.length > 0) {
    throw new Error(`Invalid step dependencies: ${errors.join('; ')}`);
  }

  // Build execution plan with parallel groups
  const executionPlan = DependencyResolver_buildParallelPlan(steps);

  // Get all step IDs in execution order
  const stepIds = steps.map(step => step.id);

  // Create workflow ID
  const workflowId = context.workflowId || `workflow-${Date.now()}`;

  // Create progress tracker with equal step weights
  const progressTracker = createProgressTracker(workflowId, stepIds);

  // Create state manager
  const stateManager = createStateManager(workflowId);

  // Try to restore previous state (for resume capability)
  let restoredState = null;
  try {
    const savedProgress = await progressTracker.load();
    if (savedProgress) {}

    // Try to restore execution context
    restoredState = await restoreExecutionContext(stateManager, context);
    if (restoredState && restoredState.completedSteps?.length > 0) {}
  } catch (error) {}

  // Create execution context (use restored state if available)
  const executionContext = {
    ...(restoredState || context),
    workflowId,
    progressTracker,
    stateManager,
    completedSteps: restoredState?.completedSteps || [],
    skippedSteps: restoredState?.skippedSteps || [],
    state: restoredState?.state || {}
  };

  // Fire workflow start action
  (0,external_wp_hooks_.doAction)('aether.export.workflow.before', executionContext, steps, executionContext.currentProviderInstance || null);
  try {
    for (const parallelGroup of executionPlan) {
      // Determine which steps to run vs skip
      const stepsToRun = [];
      const stepsToSkip = [];
      for (const stepId of parallelGroup) {
        const step = steps.find(s => s.id === stepId);
        const shouldSkip = (0,external_wp_hooks_.applyFilters)(`aether.export.step.${stepId}.skip`, step.skip ? step.skip(executionContext) : false, executionContext, executionContext.currentProviderInstance || null);
        if (shouldSkip) {
          stepsToSkip.push(stepId);
        } else {
          stepsToRun.push(stepId);
        }
      }

      // Mark skipped steps
      for (const stepId of stepsToSkip) {
        executionContext.skippedSteps.push(stepId);
        onStepSkipped(stepId);
        (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.skipped`, executionContext, executionContext.currentProviderInstance || null);
      }
      if (stepsToRun.length === 0) {
        continue;
      }

      // Execute steps in parallel
      const results = await Promise.all(stepsToRun.map(stepId => executeStep(stepId, steps, executionContext, {
        onStepStart,
        onStepComplete,
        onError
      })));

      // Merge results into state
      for (const result of results) {
        if (result) {
          Object.assign(executionContext.state, result);
        }
      }

      // Mark as completed
      executionContext.completedSteps.push(...stepsToRun);

      // Save state after each parallel group completes
      try {
        await saveExecutionContext(stateManager, executionContext);
      } catch (error) {
        // Don't throw - state saving is non-critical
      }
    }

    // Fire workflow complete action
    (0,external_wp_hooks_.doAction)('aether.export.workflow.after', executionContext.state, executionContext, executionContext.currentProviderInstance || null);

    // Clear progress tracker and state on successful completion
    await progressTracker.clear();
    await stateManager.clear();
    return executionContext.state;
  } catch (error) {
    (0,external_wp_hooks_.doAction)('aether.export.workflow.error', error, executionContext, executionContext.currentProviderInstance || null);
    // Don't clear progress on error - allows for resume
    throw error;
  }
}

/**
 * Execute a single step.
 *
 * @param {string}        stepId           Step ID to execute.
 * @param {Array<Object>} allSteps         All step definitions.
 * @param {Object}        executionContext Current execution context.
 * @param {Object}        options          Execution options.
 * @return {Promise<Object>} Step result data.
 */
async function executeStep(stepId, allSteps, executionContext, options) {
  const step = allSteps.find(s => s.id === stepId);
  const {
    onStepStart,
    onStepComplete,
    onError
  } = options;

  // Fire before hook
  (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.before`, executionContext, executionContext.currentProviderInstance || null);
  onStepStart(stepId, step);

  // Initialize step progress to 0
  if (executionContext.progressTracker) {
    await executionContext.progressTracker.updateStepProgress(stepId, 0);
  }
  try {
    // Build context for this step (merge state into context)
    const stepContext = {
      ...executionContext,
      ...executionContext.state
    };

    // Validate data requirements before execution
    DataValidator.validate(step, stepContext);

    // Execute handler with retry logic
    const result = await errorHandler.executeWithRetry(async () => {
      return await step.handler(stepContext);
    }, {
      onRetry: (error, attempt, delay) => {
        // Fire retry action
        (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.retry`, error, attempt, delay, executionContext, executionContext.currentProviderInstance || null);
      }
    });

    // Validate output matches provides declaration
    DataValidator.validateOutput(step, result);

    // Apply result filter
    const filteredResult = (0,external_wp_hooks_.applyFilters)(`aether.export.step.${stepId}.result`, result || {}, executionContext, executionContext.currentProviderInstance || null);
    onStepComplete(stepId, filteredResult);

    // Mark step as completed in progress tracker
    if (executionContext.progressTracker) {
      await executionContext.progressTracker.completeStep(stepId);
    }

    // Fire after hook
    (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.after`, filteredResult, executionContext, executionContext.currentProviderInstance || null);
    return filteredResult;
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      // eslint-disable-next-line no-console
      console.error(`[Aether] StepExecutor - Step "${stepId}" failed:`, error);
      // eslint-disable-next-line no-console
      console.error('[Aether] Error details:', {
        message: error.message,
        stack: error.stack,
        stepId,
        providerInstance: executionContext.currentProviderInstance?.id || 'N/A'
      });
    }

    // Categorize and format error
    const category = errorHandler.categorize(error);
    const severity = determineSeverity(category, {
      stepId
    });
    const formattedMessage = formatErrorMessage(error, {
      stepId,
      operation: step.label || stepId
    });

    // Create enhanced error object
    const enhancedError = {
      ...error,
      category,
      severity,
      stepId,
      formattedMessage,
      originalMessage: error.message
    };
    onError(stepId, enhancedError);
    (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.error`, enhancedError, executionContext, executionContext.currentProviderInstance || null);

    // For critical errors, stop workflow immediately
    if (severity === ERROR_SEVERITY.CRITICAL) {
      throw new Error(formattedMessage);
    }

    // For other errors, wrap with step context
    throw new Error(formattedMessage);
  }
}

/**
 * Get the parallel execution plan for steps.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
function getExecutionPlan(steps) {
  return buildParallelPlan(steps);
}
;// ./assets/src/export/executor/ThreadOrchestrator.js
/**
 * Thread Orchestrator
 *
 * Orchestrates multi-threaded workflow execution where each provider instance
 * runs in its own isolated thread. Categorizes steps into global (run once)
 * and per-thread (run per provider instance), then executes them in parallel.
 *
 * @since 1.0.0
 */




/**
 * Keys in context that should be shared by reference (read-only across threads).
 * These are not cloned to allow threads to read the same data.
 */
const SHARED_READONLY_KEYS = ['sharedHtmlData'];

/**
 * Execute async functions with concurrency limit
 *
 * Limits number of concurrent executions to prevent resource exhaustion.
 * Uses a sliding window approach to maintain max concurrent executions.
 *
 * @param {Array}    items       - Array of items to process
 * @param {Function} fn          - Async function to call for each item
 * @param {number}   concurrency - Max concurrent executions (default: 5)
 * @return {Promise<Array>} Results array in original order
 */
async function limitConcurrency(items, fn, concurrency = 5) {
  const results = new Array(items.length);
  const executing = [];
  for (let index = 0; index < items.length; index++) {
    // Create promise for this item and wrap it with cleanup
    const promise = Promise.resolve(fn(items[index], index)).then(result => {
      // Store result in correct position
      results[index] = result;
      return result;
    });

    // Create cleanup promise that removes from executing array
    const cleanup = promise.then(() => {
      const execIndex = executing.indexOf(cleanup);
      if (execIndex !== -1) {
        executing.splice(execIndex, 1);
      }
    });

    // Add cleanup promise to executing array (not the original promise)
    executing.push(cleanup);

    // If we've hit concurrency limit, wait for one to complete
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining promises to complete
  await Promise.all(executing);
  return results;
}

/**
 * Deep clone global context to ensure thread isolation
 *
 * Creates a truly deep copy of global context so threads cannot mutate shared data.
 * Handles Maps, Arrays, and nested objects recursively.
 * Tracks visited objects to handle circular references.
 * Skips cloning keys specified in sharedKeys (passed by reference for read-only access).
 *
 * @param {Object}  context    Global context to clone
 * @param {WeakMap} visited    Internal: tracks cloned objects to handle circular refs
 * @param {Array}   sharedKeys Keys to skip cloning (passed by reference)
 * @return {Object} Deep cloned context
 */
function deepCloneContext(context, visited = new WeakMap(), sharedKeys = []) {
  // Handle primitives and null
  if (context === null || typeof context !== 'object') {
    return context;
  }

  // Check if already cloned (handles circular references)
  if (visited.has(context)) {
    return visited.get(context);
  }
  const cloned = {};
  // Mark this object as visited BEFORE recursing to handle circular references
  visited.set(context, cloned);
  for (const [key, value] of Object.entries(context)) {
    // Skip shared read-only keys - pass by reference
    if (sharedKeys.includes(key)) {
      cloned[key] = value;
      continue;
    }

    // Skip functions (callbacks are handled separately)
    if (typeof value === 'function') {
      continue;
    }

    // Handle null
    if (value === null) {
      cloned[key] = null;
      continue;
    }

    // Handle Map objects (deep clone entries, including keys)
    if (value instanceof Map) {
      const clonedMap = new Map();
      visited.set(value, clonedMap);
      for (const [mapKey, mapValue] of value.entries()) {
        // Recursively clone both keys and values
        const clonedKey = typeof mapKey === 'object' && mapKey !== null ? deepCloneValue(mapKey, visited, sharedKeys) : mapKey;
        const clonedValue = typeof mapValue === 'object' && mapValue !== null ? deepCloneValue(mapValue, visited, sharedKeys) : mapValue;
        clonedMap.set(clonedKey, clonedValue);
      }
      cloned[key] = clonedMap;
      continue;
    }

    // Handle Set objects (deep clone values)
    if (value instanceof Set) {
      const clonedSet = new Set();
      visited.set(value, clonedSet);
      for (const item of value.values()) {
        // Recursively clone set items
        const clonedItem = typeof item === 'object' && item !== null ? deepCloneValue(item, visited, sharedKeys) : item;
        clonedSet.add(clonedItem);
      }
      cloned[key] = clonedSet;
      continue;
    }

    // Handle Arrays (deep clone elements)
    if (Array.isArray(value)) {
      const clonedArray = [];
      visited.set(value, clonedArray);
      for (let i = 0; i < value.length; i++) {
        clonedArray[i] = typeof value[i] === 'object' && value[i] !== null ? deepCloneValue(value[i], visited) : value[i];
      }
      cloned[key] = clonedArray;
      continue;
    }

    // Handle plain objects (deep clone recursively)
    if (typeof value === 'object' && value.constructor === Object) {
      cloned[key] = deepCloneContext(value, visited, sharedKeys);
      continue;
    }

    // Handle Date objects
    if (value instanceof Date) {
      cloned[key] = new Date(value.getTime());
      continue;
    }

    // Handle RegExp objects
    if (value instanceof RegExp) {
      cloned[key] = new RegExp(value.source, value.flags);
      continue;
    }

    // Primitive values or unhandled types (e.g., DOM nodes)
    // For unhandled types, we keep the reference (can't clone everything)
    cloned[key] = value;
  }
  return cloned;
}

/**
 * Deep clone a single value (used by Map/Array cloning)
 *
 * @param {*}       value      Value to clone
 * @param {WeakMap} visited    Tracks cloned objects
 * @param {Array}   sharedKeys Keys to skip cloning (passed by reference)
 * @return {*} Cloned value
 */
function deepCloneValue(value, visited, sharedKeys = []) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (visited.has(value)) {
    return visited.get(value);
  }
  if (value instanceof Map) {
    const clonedMap = new Map();
    visited.set(value, clonedMap);
    for (const [k, v] of value.entries()) {
      // Clone both keys and values
      const clonedKey = typeof k === 'object' && k !== null ? deepCloneValue(k, visited, sharedKeys) : k;
      const clonedValue = typeof v === 'object' && v !== null ? deepCloneValue(v, visited, sharedKeys) : v;
      clonedMap.set(clonedKey, clonedValue);
    }
    return clonedMap;
  }
  if (value instanceof Set) {
    const clonedSet = new Set();
    visited.set(value, clonedSet);
    for (const item of value.values()) {
      const clonedItem = typeof item === 'object' && item !== null ? deepCloneValue(item, visited, sharedKeys) : item;
      clonedSet.add(clonedItem);
    }
    return clonedSet;
  }
  if (Array.isArray(value)) {
    const clonedArray = [];
    visited.set(value, clonedArray);
    for (let i = 0; i < value.length; i++) {
      clonedArray[i] = deepCloneValue(value[i], visited, sharedKeys);
    }
    return clonedArray;
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }
  if (typeof value === 'object' && value.constructor === Object) {
    return deepCloneContext(value, visited, sharedKeys);
  }

  // Unhandled types - return reference
  return value;
}

/**
 * Categorize steps into global and per-thread
 *
 * @param {Array} steps - All registered steps
 * @return {Object} { globalSteps: Array, threadSteps: Array }
 */
function categorizeSteps(steps) {
  const globalSteps = [];
  const threadSteps = [];
  steps.forEach(step => {
    if (isThreadStep(step)) {
      threadSteps.push(step);
    } else {
      globalSteps.push(step);
    }
  });
  return {
    globalSteps,
    threadSteps
  };
}

/**
 * Build thread context from global context and provider instance
 *
 * Creates an isolated thread context by deep cloning global context
 * and adding thread-specific properties.
 *
 * @param {Object} globalContext    - Global execution context
 * @param {Object} providerInstance - Provider instance object
 * @param {Object} callbacks        - Thread-specific callbacks
 * @return {Object} Thread context
 */
function buildThreadContext(globalContext, providerInstance, callbacks = {}) {
  // Validate provider instance
  if (!providerInstance || !providerInstance.id) {
    throw new Error('Invalid provider instance: missing id');
  }

  // Preserve function references before cloning (functions are skipped during clone)
  // These functions need to be preserved in thread context
  const preservedFunctions = {
    setStatusMessage: globalContext.setStatusMessage,
    setStepProgress: globalContext.setStepProgress,
    processStaticSiteUrls: globalContext.processStaticSiteUrls,
    generateBlueprintJson: globalContext.generateBlueprintJson,
    updateStaticSiteProgressContext: globalContext.updateStaticSiteProgressContext,
    assetManager: globalContext.assetManager,
    api: globalContext.api,
    removeMessage: globalContext.removeMessage,
    setOverallProgressValue: globalContext.setOverallProgressValue
  };

  // Deep clone global context to ensure thread isolation
  // Prevents threads from mutating shared data
  // Pass shared read-only keys by reference (not cloned)
  const clonedContext = deepCloneContext(globalContext, new WeakMap(), SHARED_READONLY_KEYS);

  // Add thread-specific properties
  return {
    ...clonedContext,
    currentProviderInstance: providerInstance,
    providerInstanceConfig: providerInstance.config || {},
    // Preserve function references (functions not cloned, need to be restored)
    setStatusMessage: callbacks.setStatusMessage || preservedFunctions.setStatusMessage,
    setStepProgress: callbacks.setStepProgress || preservedFunctions.setStepProgress,
    processStaticSiteUrls: preservedFunctions.processStaticSiteUrls,
    generateBlueprintJson: preservedFunctions.generateBlueprintJson,
    updateStaticSiteProgressContext: preservedFunctions.updateStaticSiteProgressContext,
    assetManager: preservedFunctions.assetManager,
    api: preservedFunctions.api,
    removeMessage: preservedFunctions.removeMessage,
    setOverallProgressValue: preservedFunctions.setOverallProgressValue
  };
}

/**
 * Execute workflow in multi-threaded mode
 *
 * Executes global steps first (once), then executes per-thread steps
 * in parallel for each provider instance.
 *
 * @param {Array}  steps             - All registered steps
 * @param {Object} initialContext    - Initial execution context
 * @param {Array}  providerInstances - Provider instances to execute in parallel
 * @param {Object} options           - Execution options
 * @return {Promise<Object>} Execution results
 */
async function executeThreadedWorkflow(steps, initialContext, providerInstances = [], options = {}) {
  // Categorize steps
  const {
    globalSteps,
    threadSteps
  } = categorizeSteps(steps);

  // Execute global steps first (run once, shared across all threads)
  let globalState = {};
  if (globalSteps.length > 0) {
    // executeSteps returns the execution state directly
    globalState = await executeSteps(globalSteps, initialContext, options);
  }

  // Build global context (initial + global step results)
  const globalContext = {
    ...initialContext,
    ...globalState
  };

  // Handle edge cases with providers and thread steps
  if (providerInstances.length === 0) {
    // If there are thread steps, this is an error condition
    // Thread steps need providers to execute
    if (threadSteps.length > 0) {
      const threadStepIds = threadSteps.map(s => s.id).join(', ');
      throw new Error(`No provider instances configured, but thread steps require execution: ${threadStepIds}. ` + `Please configure at least one provider instance or disable these steps.`);
    }

    // No thread steps and no providers - workflow completes successfully
    return {
      success: true,
      globalState,
      threadResults: [],
      successCount: 0,
      failureCount: 0
    };
  }

  // If there are providers but no thread steps, return early (nothing to do)
  if (threadSteps.length === 0) {
    return {
      success: true,
      globalState,
      threadResults: [],
      successCount: 0,
      failureCount: 0
    };
  }

  // Execute per-thread steps for each provider instance
  // Use concurrency limiting to prevent resource exhaustion
  // Default: 5 concurrent providers (configurable via options)
  const maxConcurrency = options.maxConcurrency || 5;

  // Create step label lookup map for performance (avoid repeated array searches)
  const stepLabelMap = new Map(threadSteps.map(step => [step.id, step.label]));
  const executeProviderThread = async providerInstance => {
    // Build thread-specific context
    const threadCallbacks = {
      setStatusMessage: (message, type, key, progress, metadata) => {
        // Add provider instance info to metadata
        const threadMetadata = {
          ...metadata,
          providerInstance: providerInstance.id,
          providerLabel: providerInstance.label || providerInstance.id
        };

        // Call original callback with thread info
        if (initialContext.setStatusMessage) {
          initialContext.setStatusMessage(message, type, key, progress, threadMetadata);
        }
      },
      setStepProgress: (stepId, progress) => {
        // Update step progress in context
        if (initialContext.setStepProgress) {
          initialContext.setStepProgress(stepId, progress);
        }

        // Update per-provider progress tracking
        if (initialContext.setProviderProgress) {
          // Get step label from cached map (O(1) lookup)
          const stepLabel = stepLabelMap.get(stepId) || stepId;
          initialContext.setProviderProgress(providerInstance.id, {
            stepId,
            stepLabel,
            progress,
            status: 'active'
          });
        }
      }
    };
    const threadContext = buildThreadContext(globalContext, providerInstance, threadCallbacks);

    // Execute thread steps for this provider instance
    try {
      // executeSteps returns the execution state directly
      // Pass all steps (global + thread) for dependency validation
      // since thread steps may depend on global steps
      const threadState = await executeSteps(threadSteps, threadContext, {
        ...options,
        allSteps: [...globalSteps, ...threadSteps]
      });

      // Mark provider as complete
      if (initialContext.setProviderProgress) {
        initialContext.setProviderProgress(providerInstance.id, {
          stepId: null,
          stepLabel: 'Complete',
          progress: {
            current: 100,
            total: 100
          },
          status: 'complete'
        });
      }
      return {
        success: true,
        providerInstance: providerInstance.id,
        state: threadState || {},
        error: null
      };
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        // eslint-disable-next-line no-console
        console.error('[Aether] ThreadOrchestrator - Thread execution failed for provider:', providerInstance.id, error);
        // eslint-disable-next-line no-console
        console.error('[Aether] Error stack:', error.stack);
      }

      // Mark provider as error
      if (initialContext.setProviderProgress) {
        initialContext.setProviderProgress(providerInstance.id, {
          stepId: null,
          stepLabel: 'Error',
          progress: {
            current: 0,
            total: 100
          },
          status: 'error',
          error: error.message || 'Unknown error'
        });
      }
      return {
        success: false,
        providerInstance: providerInstance.id,
        state: {},
        error: error.message || 'Unknown error'
      };
    }
  };

  // Execute provider threads with concurrency limiting
  const threadResults = await limitConcurrency(providerInstances, executeProviderThread, maxConcurrency);

  // Check if any threads succeeded
  const successfulThreads = threadResults.filter(r => r.success);
  const failedThreads = threadResults.filter(r => !r.success);

  // Determine overall success:
  // - All succeeded: complete success
  // - Some succeeded: partial success (workflow continues but with warnings)
  // - None succeeded: failure
  const allSucceeded = successfulThreads.length === threadResults.length;
  const someSucceeded = successfulThreads.length > 0;

  // Collect failed provider details for error reporting
  const failedProviders = failedThreads.map(r => ({
    providerId: r.providerInstance,
    error: r.error
  }));
  return {
    success: someSucceeded,
    // Succeeds if at least one provider worked
    partialSuccess: someSucceeded && !allSucceeded,
    // True if some failed
    allSucceeded,
    // True only if all providers succeeded
    globalState,
    threadResults,
    successCount: successfulThreads.length,
    failureCount: failedThreads.length,
    failedProviders // Array of {providerId, error} for failed providers
  };
}
/* harmony default export */ const ThreadOrchestrator = ({
  categorizeSteps,
  buildThreadContext,
  executeThreadedWorkflow
});
;// ./assets/src/export/registry/StepRegistry.js
/**
 * Step Registry
 *
 * Singleton registry for managing export workflow steps.
 * Steps register themselves dynamically via WordPress hooks.
 *
 * @since 1.0.0
 */



/**
 * Singleton instance
 */
let instance = null;

/**
 * Step Registry Class
 *
 * Manages registration and retrieval of export workflow steps.
 */
class StepRegistry {
  /**
   * Constructor
   *
   * Private constructor for singleton pattern.
   */
  constructor() {
    if (instance) {
      throw new Error('StepRegistry is a singleton. Use StepRegistry.getInstance()');
    }
    this.steps = [];
  }

  /**
   * Get singleton instance
   *
   * @return {StepRegistry} Singleton instance
   */
  static getInstance() {
    if (!instance) {
      instance = new StepRegistry();
    }
    return instance;
  }

  /**
   * Register a step
   *
   * Validates step structure and adds to registry.
   *
   * @param {Object}        step                          - Step definition
   * @param {string}        step.id                       - Unique step identifier
   * @param {string}        step.label                    - Display label (i18n)
   * @param {string}        [step.description]            - Step description (i18n)
   * @param {boolean}       [step.supportsProgress=false] - Whether step reports progress
   * @param {Array<string>} [step.dependencies=[]]        - IDs of steps this depends on
   * @param {Object}        step.requires                 - Data requirements (explicit dependencies)
   * @param {Object}        step.provides                 - Data this step provides
   * @param {Function}      step.handler                  - Async handler function
   * @param {Function}      [step.skip]                   - Optional skip function
   * @param {Function}      [step.shouldSkip]             - Optional skip function (alternative)
   * @throws {Error} If step is invalid
   */
  register(step) {
    // Validate required properties
    if (!step || typeof step !== 'object') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must be an object', 'aether-site-exporter'));
    }
    if (!step.id || typeof step.id !== 'string') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid id (string)', 'aether-site-exporter'));
    }
    if (!step.label || typeof step.label !== 'string') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid label (string)', 'aether-site-exporter'));
    }
    if (!step.handler || typeof step.handler !== 'function') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid handler (function)', 'aether-site-exporter'));
    }
    if (!step.requires || typeof step.requires !== 'object') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid requires object (data dependencies)', 'aether-site-exporter'));
    }
    if (!step.provides || typeof step.provides !== 'object') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid provides object (output declaration)', 'aether-site-exporter'));
    }

    // Check for duplicate step ID
    if (this.steps.find(s => s.id === step.id)) {
      throw new Error(`Step with id "${step.id}" is already registered`);
    }

    // Set defaults for optional properties
    const normalizedStep = {
      ...step,
      description: step.description || '',
      supportsProgress: step.supportsProgress ?? false,
      dependencies: step.dependencies || []
    };

    // Add to registry
    this.steps.push(normalizedStep);
  }

  /**
   * Get all registered steps
   *
   * @return {Array<Object>} Registered steps
   */
  getSteps() {
    return this.steps;
  }

  /**
   * Clear all registered steps
   *
   * Used for re-initialization and testing.
   */
  clear() {
    this.steps = [];
  }

  /**
   * Get step by ID
   *
   * @param {string} stepId - Step identifier
   * @return {Object|null} Step definition or null if not found
   */
  getStepById(stepId) {
    return this.steps.find(step => step.id === stepId) || null;
  }

  /**
   * Check if step is registered
   *
   * @param {string} stepId - Step identifier
   * @return {boolean} True if step is registered
   */
  hasStep(stepId) {
    return this.steps.some(step => step.id === stepId);
  }
}
/* harmony default export */ const registry_StepRegistry = (StepRegistry);
;// ./assets/src/export/steps/discoverBlueprintBundleAssets/index.js
/**
 * Discover Blueprint Bundle Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in the blueprint bundle.
 *
 * @since 1.0.0
 */




/**
 * Discover blueprint bundle assets step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with discovered assets
 */
async function handler(context) {
  const {
    api,
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Discovering plugins and themes…', 'aether-site-exporter'), 'progress', 'discoverBlueprintBundleAssets');

  // Call client-side asset discovery
  const discoveryResponse = await api.discoverBlueprintBundleAssets();
  if (!discoveryResponse.success) {
    throw new Error(discoveryResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to discover assets', 'aether-site-exporter'));
  }
  const assets = discoveryResponse.assets || [];
  const plugins = assets.filter(a => a.type === 'plugin');
  const themes = assets.filter(a => a.type === 'theme');

  // Build success message
  let message;
  if (assets.length === 0) {
    message = (0,external_wp_i18n_namespaceObject.__)('Discovered 0 active custom plugins/themes', 'aether-site-exporter');
  } else {
    const parts = [];
    if (plugins.length > 0) {
      const pluginText = plugins.length === 1 ? (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Plugin slug */
      (0,external_wp_i18n_namespaceObject.__)('1 active custom plugin (%s)', 'aether-site-exporter'), plugins[0].slug) : (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of plugins, %2$s: Comma-separated plugin slugs */
      (0,external_wp_i18n_namespaceObject._n)('%1$d active custom plugin (%2$s)', '%1$d active custom plugins (%2$s)', plugins.length, 'aether-site-exporter'), plugins.length, plugins.map(p => p.slug).join(', '));
      parts.push(pluginText);
    }
    if (themes.length > 0) {
      const themeText = themes.length === 1 ? (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Theme slug */
      (0,external_wp_i18n_namespaceObject.__)('1 active custom theme (%s)', 'aether-site-exporter'), themes[0].slug) : (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of themes, %2$s: Comma-separated theme slugs */
      (0,external_wp_i18n_namespaceObject._n)('%1$d active custom theme (%2$s)', '%1$d active custom themes (%2$s)', themes.length, 'aether-site-exporter'), themes.length, themes.map(t => t.slug).join(', '));
      parts.push(themeText);
    }
    message = (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Discovered assets description */
    (0,external_wp_i18n_namespaceObject.__)('Discovered %s. These will be included in the blueprint bundle.', 'aether-site-exporter'), parts.join((0,external_wp_i18n_namespaceObject.__)(' and ', 'aether-site-exporter')));
  }
  setStatusMessage(message, 'success', 'discoverBlueprintBundleAssets');

  // Return data to merge into execution state
  return {
    discoveredAssets: assets
  };
}

/**
 * Step definition
 */
const stepDefinition = {
  id: 'discoverBlueprintBundleAssets',
  label: (0,external_wp_i18n_namespaceObject.__)('Discover Assets', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Find custom plugins and themes for blueprint bundle', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    }
  },
  provides: {
    discoveredAssets: {
      type: 'array',
      scope: 'global'
    }
  },
  handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-discoverBlueprintBundleAssets', registry => {
  registry.register(stepDefinition);
}, 10);
;// ./assets/src/export/steps/getStaticSiteUrls/index.js
/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be fetched for static site generation.
 *
 * @since 1.0.0
 */




/**
 * Get static site URLs step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {string}   context.siteUrl          - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with discovered URLs
 */
async function getStaticSiteUrls_handler(context) {
  const {
    api,
    siteUrl,
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Discovering URLs for static site…', 'aether-site-exporter'), 'progress', 'getStaticSiteUrls');

  // Discover URLs from API with progress updates
  const urlResponse = await api.discoverUrls(progress => {
    if (progress.status === 'fetching') {
      setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Type being fetched (posts, terms, etc.) */
      (0,external_wp_i18n_namespaceObject.__)('Fetching %s…', 'aether-site-exporter'), progress.type), 'progress', 'getStaticSiteUrls');
    }
  });
  if (!urlResponse.success) {
    throw new Error(urlResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to discover URLs', 'aether-site-exporter'));
  }
  const urls = urlResponse.urls || [];
  const staticSiteUrl = urlResponse.staticSiteUrl || siteUrl;
  const urlsCount = urls.length;
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %d: Number of URLs */
  (0,external_wp_i18n_namespaceObject.__)('Discovered %d URLs for static site generation', 'aether-site-exporter'), urlsCount), 'success', 'getStaticSiteUrls');

  // Return data to merge into execution state
  return {
    urls,
    staticSiteUrl,
    urlsCount
  };
}

/**
 * Step definition
 */
const getStaticSiteUrls_stepDefinition = {
  id: 'getStaticSiteUrls',
  label: (0,external_wp_i18n_namespaceObject.__)('Discover URLs', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Find all URLs for static site generation', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    }
  },
  provides: {
    urls: {
      type: 'array',
      scope: 'global'
    },
    staticSiteUrl: {
      type: 'string',
      scope: 'global'
    },
    urlsCount: {
      type: 'number',
      scope: 'global'
    }
  },
  handler: getStaticSiteUrls_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-getStaticSiteUrls', registry => {
  registry.register(getStaticSiteUrls_stepDefinition);
}, 10);
;// ./assets/src/export/steps/preScanStaticSite/index.js
/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages and extracts assets (CSS, JS, images) to add to URL list.
 *
 * @since 1.0.0
 */





/**
 * Pre-scan static site step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Array}    context.urls             - URLs from getStaticSiteUrls
 * @param {string}   context.siteUrl          - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress  - Step progress updater
 * @return {Promise<Object>} Step result with expanded URL list including assets
 */
async function preScanStaticSite_handler(context) {
  const {
    urls,
    siteUrl,
    setStatusMessage,
    setStepProgress
  } = context;
  if (!urls || !Array.isArray(urls)) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('URLs not found. Please run getStaticSiteUrls first.', 'aether-site-exporter'));
  }
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Scanning pages for assets…', 'aether-site-exporter'), 'progress', 'preScanStaticSite');
  const allAssets = new Set();
  const htmlUrls = [];
  const totalUrls = urls.length;
  const sharedHtmlData = new Map();

  // Fetch each URL and extract assets
  for (let i = 0; i < totalUrls; i++) {
    const url = urls[i];

    // Update progress
    if (setStepProgress) {
      setStepProgress('preScanStaticSite', {
        current: i + 1,
        total: totalUrls
      });
    }
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (!response.ok) {
        continue;
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        // Not HTML, skip asset extraction but keep the URL
        htmlUrls.push(url);
        continue;
      }
      const html = await response.text();
      htmlUrls.push(url);

      // Extract assets from HTML
      const assets = await extractAssetsFromHtml(html, url, siteUrl);
      for (const asset of assets) {
        allAssets.add(asset);
      }

      // Store HTML and assets in shared cache for later use
      // Format matches what useStaticSiteGenerator expects: { rawHtml, assetUrls }
      sharedHtmlData.set(url, {
        rawHtml: html,
        assetUrls: assets
      });
    } catch (error) {}
  }

  // Combine HTML URLs with discovered assets
  const expandedUrls = [...htmlUrls, ...allAssets];
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of pages, %2$d: Number of assets */
  (0,external_wp_i18n_namespaceObject.__)('Found %1$d pages and %2$d assets', 'aether-site-exporter'), htmlUrls.length, allAssets.size), 'success', 'preScanStaticSite');

  // Return expanded URL list and shared HTML cache
  return {
    urls: expandedUrls,
    htmlCount: htmlUrls.length,
    assetCount: allAssets.size,
    sharedHtmlData
  };
}

/**
 * Step definition
 */
const preScanStaticSite_stepDefinition = {
  id: 'preScanStaticSite',
  label: (0,external_wp_i18n_namespaceObject.__)('Scan for Assets', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Discover CSS, JS, and image assets from pages', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['getStaticSiteUrls'],
  requires: {
    urls: {
      from: 'getStaticSiteUrls',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    },
    setStepProgress: {
      from: 'initial',
      required: false
    }
  },
  provides: {
    urls: {
      type: 'array',
      scope: 'global'
    },
    htmlCount: {
      type: 'number',
      scope: 'global'
    },
    assetCount: {
      type: 'number',
      scope: 'global'
    },
    sharedHtmlData: {
      type: 'Map',
      scope: 'global'
    }
  },
  handler: preScanStaticSite_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-preScanStaticSite', registry => {
  registry.register(preScanStaticSite_stepDefinition);
}, 10);
;// ./assets/src/export/steps/createWpContentArchive/index.js
/**
 * Create WP Content Archive Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @since 1.0.0
 */





/**
 * Create wp-content archive step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - ExportAPI instance
 * @param {Object}   context.assetManager     - Asset manager instance
 * @param {Array}    context.discoveredAssets - Discovered assets from discoverBlueprintBundleAssets step
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with archive info
 */
async function createWpContentArchive_handler(context) {
  const {
    api,
    assetManager,
    discoveredAssets = [],
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Creating wp-content archive…', 'aether-site-exporter'), 'progress', 'createWpContentArchive');

  // Determine which files to include
  const filesToInclude = (0,external_wp_hooks_.applyFilters)('aether.export.step.createWpContentArchive.files', discoveredAssets, context);

  // Create the archive via API
  const archiveResponse = await api.createArchive({
    assets: filesToInclude,
    includeUploads: true
  });
  if (!archiveResponse.success) {
    throw new Error(archiveResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to create wp-content archive', 'aether-site-exporter'));
  }
  const {
    zipPath,
    zipUrl,
    zipSize
  } = archiveResponse;
  const sizeFormatted = formatFileSize(zipSize || 0);

  // Update asset manager if provided and method exists
  if (assetManager && zipPath && typeof assetManager.setArchivePath === 'function') {
    assetManager.setArchivePath(zipPath);
  }
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Created wp-content archive (%s)', 'aether-site-exporter'), sizeFormatted), 'success', 'createWpContentArchive');

  // Return data to merge into execution state
  return {
    zipPath,
    zipUrl,
    zipSize
  };
}

/**
 * Step definition
 */
const createWpContentArchive_stepDefinition = {
  id: 'createWpContentArchive',
  label: (0,external_wp_i18n_namespaceObject.__)('Create WP Content Archive', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Package custom plugins, themes, and uploads', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['discoverBlueprintBundleAssets'],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    discoveredAssets: {
      from: 'discoverBlueprintBundleAssets',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    },
    assetManager: {
      from: 'initial',
      required: false
    }
  },
  provides: {
    zipPath: {
      type: 'string',
      scope: 'global'
    },
    zipUrl: {
      type: 'string',
      scope: 'global'
    },
    zipSize: {
      type: 'number',
      scope: 'global'
    }
  },
  handler: createWpContentArchive_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-createWpContentArchive', registry => {
  registry.register(createWpContentArchive_stepDefinition);
}, 10);
;// ./assets/src/export/steps/createBlueprintBundle/index.js
/**
 * Create Blueprint Bundle Step
 *
 * Generates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
 *
 * @since 1.0.0
 */





/**
 * Create blueprint bundle step handler
 *
 * @param {Object}   context                       - Execution context
 * @param {Object}   context.api                   - ExportAPI instance
 * @param {Function} context.generateBlueprintJson - Blueprint JSON generator function
 * @param {string}   context.zipPath               - Path to wp-content.zip from createWpContentArchive
 * @param {string}   context.zipUrl                - URL to wp-content.zip
 * @param {Array}    context.discoveredAssets      - Discovered assets
 * @param {Function} context.setStatusMessage      - Status message updater
 * @return {Promise<Object>} Step result with blueprint bundle info
 */
async function createBlueprintBundle_handler(context) {
  const {
    api,
    generateBlueprintJson,
    zipPath,
    zipUrl,
    discoveredAssets = [],
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Creating blueprint bundle…', 'aether-site-exporter'), 'progress', 'createBlueprintBundle');
  if (!zipPath) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Site archive not found. Please run createWpContentArchive first.', 'aether-site-exporter'));
  }

  // Generate blueprint.json
  let blueprintData;
  if (typeof generateBlueprintJson === 'function') {
    blueprintData = await generateBlueprintJson({
      assets: discoveredAssets,
      wpContentZipUrl: zipUrl
    }, setStatusMessage);
  } else {
    // Fallback: use API to generate blueprint
    const blueprintResponse = await api.generateBlueprint({
      assets: discoveredAssets,
      wpContentZipUrl: zipUrl
    });
    if (!blueprintResponse.success) {
      throw new Error(blueprintResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to generate blueprint', 'aether-site-exporter'));
    }
    blueprintData = blueprintResponse.blueprint;
  }

  // Allow filtering of blueprint data (JSON only)
  const filteredBlueprint = (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.blueprintData', blueprintData, context);

  // Create the blueprint-bundle.zip via API
  const bundleResponse = await api.createBlueprintBundle({
    blueprint: filteredBlueprint,
    wpContentZipPath: zipPath
  });
  if (!bundleResponse.success) {
    throw new Error(bundleResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to create blueprint bundle', 'aether-site-exporter'));
  }
  const {
    bundlePath,
    bundleUrl,
    bundleSize
  } = bundleResponse;
  const sizeFormatted = formatFileSize(bundleSize || 0);
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Created blueprint bundle (%s)', 'aether-site-exporter'), sizeFormatted), 'success', 'createBlueprintBundle');

  // Return data to merge into execution state
  return {
    blueprintData: filteredBlueprint,
    blueprintBundle: {
      bundlePath,
      bundleUrl,
      bundleSize
    }
  };
}

/**
 * Step definition
 */
const createBlueprintBundle_stepDefinition = {
  id: 'createBlueprintBundle',
  label: (0,external_wp_i18n_namespaceObject.__)('Create Blueprint Bundle', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Create blueprint-bundle.zip', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: ['createWpContentArchive'],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    generateBlueprintJson: {
      from: 'initial',
      required: true
    },
    zipPath: {
      from: 'createWpContentArchive',
      required: true
    },
    zipUrl: {
      from: 'createWpContentArchive',
      required: true
    },
    discoveredAssets: {
      from: 'discoverBlueprintBundleAssets',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    }
  },
  provides: {
    blueprintData: {
      type: 'object',
      scope: 'global'
    },
    blueprintBundle: {
      type: 'object',
      scope: 'global'
    }
  },
  handler: createBlueprintBundle_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-createBlueprintBundle', registry => {
  registry.register(createBlueprintBundle_stepDefinition);
}, 10);
// EXTERNAL MODULE: external ["wp","apiFetch"]
var external_wp_apiFetch_ = __webpack_require__(455);
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_);
// EXTERNAL MODULE: ./assets/src/export/utils/unifiedFileUpload.js
var unifiedFileUpload = __webpack_require__(98);
;// ./assets/src/export/steps/uploadBlueprintBundle/index.js
/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 *
 * @since 1.0.0
 */







/**
 * Upload blueprint bundle step handler
 *
 * Processes a single provider instance (thread context).
 * Called once per provider by ThreadOrchestrator.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Object}   context.blueprintBundle         - Bundle data from createBlueprintBundle
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.setStatusMessage        - Status message updater
 * @param {Function} context.setStepProgress         - Step progress updater
 * @return {Promise<Object>} Step result
 */
async function uploadBlueprintBundle_handler(context) {
  const {
    currentProviderInstance,
    blueprintBundle,
    siteUrl,
    setStatusMessage
  } = context;
  if (!currentProviderInstance) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Provider instance not found in thread context', 'aether-site-exporter'));
  }
  const providerId = currentProviderInstance.id;
  const providerLabel = currentProviderInstance.label || currentProviderInstance.id;
  const bundleSize = blueprintBundle?.bundleSize || 0;
  const bundleSizeFormatted = formatFileSize(bundleSize);
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Uploading blueprint bundle (%2$s) to %1$s…', 'aether-site-exporter'), providerLabel, bundleSizeFormatted), 'progress', 'uploadBlueprintBundle');

  // Fetch provider config to get export_path
  let exportPath = 'blueprint-bundle/bundle.zip';
  try {
    const providerResponse = await external_wp_apiFetch_default()({
      path: `/aether/site-exporter/providers/${providerId}/config`
    });
    if (providerResponse.success && providerResponse.config) {
      const providerConfig = providerResponse.config || {};
      if (providerConfig.export_path) {
        exportPath = providerConfig.export_path;
      }
    }
  } catch {
    // Use default path on error
  }

  // Create unified file context for blueprint bundle
  const fileContext = (0,unifiedFileUpload/* createFileContext */.sM)({
    fileType: unifiedFileUpload/* FILE_TYPES */.$Z.BLUEPRINT_BUNDLE,
    filePath: blueprintBundle.bundlePath,
    fileContent: null,
    contentType: 'application/zip',
    storageKey: exportPath,
    providerId,
    metadata: {
      ...context,
      siteUrl,
      exportPath
    }
  });

  // Upload file using unified upload system
  // This fires aether.file.upload action which providers hook into
  await (0,unifiedFileUpload/* uploadFile */.QM)(fileContext);

  // Report success
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Uploaded blueprint bundle (%2$s) to %1$s', 'aether-site-exporter'), providerLabel, bundleSizeFormatted), 'success', 'uploadBlueprintBundle');
  return {
    bundleUploadResults: {
      providerId,
      providerLabel,
      success: true,
      exportPath,
      bundleSize
    }
  };
}

/**
 * Step definition
 */
const uploadBlueprintBundle_stepDefinition = {
  id: 'uploadBlueprintBundle',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Blueprint Bundle', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Upload blueprint-bundle.zip to providers', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['createBlueprintBundle'],
  requires: {
    currentProviderInstance: {
      from: 'thread',
      required: true
    },
    blueprintBundle: {
      from: 'createBlueprintBundle',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    },
    setStepProgress: {
      from: 'initial',
      required: false
    }
  },
  provides: {
    bundleUploadResults: {
      type: 'object',
      scope: 'thread'
    }
  },
  handler: uploadBlueprintBundle_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-uploadBlueprintBundle', registry => {
  registry.register(uploadBlueprintBundle_stepDefinition);
}, 10);
;// ./assets/src/export/steps/uploadStaticFiles/index.js
/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses useStaticSiteGenerator to process URLs and upload files via unified action system.
 *
 * @since 1.0.0
 */





/**
 * Upload static files step handler
 *
 * Processes a single provider instance (thread context).
 * Called once per provider by ThreadOrchestrator.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Array}    context.urls                    - URLs from preScanStaticSite (includes assets)
 * @param {string}   context.staticSiteUrl           - Static site URL
 * @param {Map}      context.sharedHtmlData          - Pre-fetched HTML data from preScanStaticSite
 * @param {Object}   context.blueprintData           - Blueprint data
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.processStaticSiteUrls   - Static site generator function
 * @param {Function} context.setStatusMessage        - Status message updater
 * @return {Promise<Object>} Step result with uploaded files
 */
async function uploadStaticFiles_handler(context) {
  const {
    currentProviderInstance,
    urls,
    staticSiteUrl,
    sharedHtmlData,
    siteUrl,
    processStaticSiteUrls,
    setStatusMessage
  } = context;

  // blueprintData is optional and may be passed via context if available
  const blueprintData = context.blueprintData || null;
  if (!currentProviderInstance) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Provider instance not found in thread context', 'aether-site-exporter'));
  }
  if (!urls || !Array.isArray(urls)) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('URLs not found. Please run getStaticSiteUrls first.', 'aether-site-exporter'));
  }
  if (!processStaticSiteUrls) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Static site generator not available', 'aether-site-exporter'));
  }
  const providerId = currentProviderInstance.id;
  const providerLabel = currentProviderInstance.label || currentProviderInstance.id;
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Provider label */
  (0,external_wp_i18n_namespaceObject.__)('Processing static site for %s…', 'aether-site-exporter'), providerLabel), 'progress', 'uploadStaticFiles');

  // Fetch provider config to get provider-specific public_url
  // This ensures each provider uses its own staticSiteUrl (e.g., http://localhost:10003/static3)
  // instead of the global one from getStaticSiteUrls
  let providerSpecificStaticSiteUrl = staticSiteUrl;
  try {
    const providerConfig = await fetchProviderConfig(providerId);
    if (providerConfig.public_url) {
      providerSpecificStaticSiteUrl = providerConfig.public_url;
    }
  } catch (error) {
    // If fetching provider config fails, fall back to global staticSiteUrl
    // This should not happen in normal operation, but provides a safety net
  }

  // Filter URLs before processing
  const filteredUrls = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.urls', urls, [providerId], {
    siteUrl,
    blueprintData,
    staticSiteUrl: providerSpecificStaticSiteUrl,
    providerId
  });

  // Process URLs for this provider instance
  // Pass shared HTML data so it uses stored HTML instead of fetching again
  // Use provider-specific staticSiteUrl for correct URL rewriting
  const result = await processStaticSiteUrls(filteredUrls, providerSpecificStaticSiteUrl, providerId, siteUrl, setStatusMessage, blueprintData, null,
  // removeMessage
  sharedHtmlData // Pass shared HTML data from preScanStaticSite
  );

  // Check if upload succeeded
  const filesUploaded = result.filesUploaded || 0;
  const success = result.success && filesUploaded > 0;
  if (success) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$d: Files uploaded */
    (0,external_wp_i18n_namespaceObject.__)('Uploaded %2$d files to %1$s', 'aether-site-exporter'), providerLabel, filesUploaded), 'success', 'uploadStaticFiles');
  } else {
    const errorMessage = result.error || (0,external_wp_i18n_namespaceObject.__)('No files uploaded', 'aether-site-exporter');
    throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$s: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Failed to upload to %1$s: %2$s', 'aether-site-exporter'), providerLabel, errorMessage));
  }
  return (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.result', {
    staticUploadResults: {
      providerId,
      providerLabel,
      success,
      filesUploaded: result.filesUploaded || 0,
      filesSkipped: result.filesSkipped || 0,
      urlsProcessed: result.urlsProcessed || 0,
      urlsSucceeded: result.urlsSucceeded || 0,
      urlsFailed: result.urlsFailed || 0,
      assetsUploaded: result.assetsUploaded || 0,
      assetsFailed: result.assetsFailed || 0,
      failedUrls: result.failedUrls || [],
      uploadedFiles: result.uploadedFiles || []
    }
  }, providerId, {
    siteUrl,
    blueprintData,
    staticSiteUrl
  });
}

/**
 * Step definition
 */
const uploadStaticFiles_stepDefinition = {
  id: 'uploadStaticFiles',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Static Files', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Generate and upload static HTML files', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['preScanStaticSite'],
  requires: {
    currentProviderInstance: {
      from: 'thread',
      required: true
    },
    urls: {
      from: 'preScanStaticSite',
      required: true
    },
    staticSiteUrl: {
      from: 'getStaticSiteUrls',
      required: true
    },
    sharedHtmlData: {
      from: 'preScanStaticSite',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    processStaticSiteUrls: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    }
  },
  provides: {
    staticUploadResults: {
      type: 'object',
      scope: 'thread'
    }
  },
  handler: uploadStaticFiles_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-uploadStaticFiles', registry => {
  registry.register(uploadStaticFiles_stepDefinition);
}, 10);
;// ./assets/src/export/steps/index.js
/**
 * Step Registry
 *
 * Steps register themselves dynamically via WordPress hooks.
 * This file triggers step registration and provides helper functions.
 *
 * @since 1.0.0
 */




// Import step files to ensure they register themselves








/**
 * Get all registered steps
 *
 * Triggers step registration via hooks and returns collected steps.
 *
 * @return {Array<Object>} Array of step definitions
 */
function getRegisteredSteps() {
  const registry = registry_StepRegistry.getInstance();

  // Clear previous registrations (for re-initialization)
  registry.clear();

  // Trigger registration hook - steps self-register
  (0,external_wp_hooks_.doAction)('aether.export.register_steps', registry);
  return registry.getSteps();
}

/**
 * Get steps filtered by which providers are enabled
 *
 * Uses provider INSTANCE arrays (not ID arrays) to ensure validation.
 * This prevents steps from executing when all provider instances are disabled/invalid.
 *
 * @param {Object} context - Execution context with provider instance arrays
 * @return {Array<Object>} Filtered steps based on enabled provider instances
 */
function getActiveSteps(context) {
  const {
    staticSiteProviderInstances = [],
    blueprintBundleProviderInstances = []
  } = context;
  const steps = getRegisteredSteps();

  // Filter out steps that should be skipped based on provider configuration
  const filteredSteps = steps.filter(step => {
    // If step has a static skip function, check it
    if (typeof step.shouldSkip === 'function') {
      return !step.shouldSkip(context);
    }

    // Skip blueprint-related steps if no blueprint bundle provider INSTANCES
    if (step.id === 'discoverBlueprintBundleAssets' || step.id === 'createWpContentArchive' || step.id === 'createBlueprintBundle' || step.id === 'uploadBlueprintBundle') {
      return blueprintBundleProviderInstances.length > 0;
    }

    // Skip static site steps if no static site provider INSTANCES
    if (step.id === 'preScanStaticSite' || step.id === 'uploadStaticFiles') {
      return staticSiteProviderInstances.length > 0;
    }
    return true;
  });
  return filteredSteps;
}
;// ./assets/src/providers/registry/ProviderRegistry.js
/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * aether.providers.register hooks. This replaces the PHP ProviderRegistry.
 *
 */



/**
 * Internal registry storage.
 *
 * @type {Map<string, Function>}
 */
const providers = new Map();

/**
 * Provider Registry
 *
 * Singleton registry for managing all JavaScript provider classes.
 */
class ProviderRegistry {
  /**
   * Register a provider class.
   *
   * @param {string}   providerId    Provider ID
   * @param {Function} ProviderClass Provider class (must have static ID, NAME, etc.)
   * @return {void}
   */
  register(providerId, ProviderClass) {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ProviderRegistry.register() requires a valid provider ID string');
    }
    if (!ProviderClass || typeof ProviderClass !== 'function') {
      throw new Error('ProviderRegistry.register() requires a provider class');
    }

    // Validate provider has required static properties
    if (!ProviderClass.ID) {
      throw new Error(`Provider ${providerId} must have static ID property`);
    }
    if (!ProviderClass.NAME) {
      throw new Error(`Provider ${providerId} must have static NAME property`);
    }
    providers.set(providerId, ProviderClass);

    /**
     * Action fired after a provider is registered.
     *
     * @param {string}   providerId    Provider ID
     * @param {Function} ProviderClass Provider class
     */
    (0,external_wp_hooks_.doAction)('aether.providers.registered', providerId, ProviderClass);
  }

  /**
   * Get a provider class by ID.
   *
   * @param {string} providerId Provider ID
   * @return {Function|null} Provider class or null if not found
   */
  get(providerId) {
    return providers.get(providerId) || null;
  }

  /**
   * Get all registered provider classes.
   *
   * @return {Array<Function>} Array of provider classes
   */
  getAll() {
    return Array.from(providers.values());
  }

  /**
   * Get all provider IDs.
   *
   * @return {Array<string>} Array of provider IDs
   */
  getAllIds() {
    return Array.from(providers.keys());
  }

  /**
   * Get providers that support a specific deployment type.
   *
   * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
   * @return {Array<Function>} Array of provider classes that support the deployment type
   */
  getByDeploymentType(deploymentType) {
    return this.getAll().filter(ProviderClass => {
      return ProviderClass.DEPLOYMENT_TYPE === deploymentType;
    });
  }

  /**
   * Get default provider.
   *
   * Returns the first provider that supports static_site deployment,
   * or the first registered provider if none found.
   *
   * @return {Function|null} Default provider class or null if none registered
   */
  getDefault() {
    const staticSiteProviders = this.getByDeploymentType('static_site');
    if (staticSiteProviders.length > 0) {
      return staticSiteProviders[0];
    }
    const allProviders = this.getAll();
    return allProviders.length > 0 ? allProviders[0] : null;
  }

  /**
   * Get provider for a specific deployment type.
   *
   * Returns the first provider that supports the deployment type.
   *
   * @param {string} deploymentType Deployment type
   * @return {Function|null} Provider class or null if not found
   */
  getForDeploymentType(deploymentType) {
    const matchingProviders = this.getByDeploymentType(deploymentType);
    return matchingProviders.length > 0 ? matchingProviders[0] : null;
  }

  /**
   * Check if a provider is registered.
   *
   * @param {string} providerId Provider ID
   * @return {boolean} True if registered
   */
  has(providerId) {
    return providers.has(providerId);
  }

  /**
   * Get count of registered providers.
   *
   * @return {number} Number of registered providers
   */
  count() {
    return providers.size;
  }

  /**
   * Parse instance ID into provider type and UUID.
   *
   * Instance IDs have format: {provider_type}:{uuid}
   * Example: "local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890"
   *
   * @param {string} instanceId Instance ID to parse
   * @return {{provider_type: string, uuid: string}|null} Parsed components or null if invalid format
   */
  parseInstanceId(instanceId) {
    if (!instanceId || typeof instanceId !== 'string') {
      return null;
    }
    const parts = instanceId.split(':', 2);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }
    return {
      provider_type: parts[0],
      uuid: parts[1]
    };
  }

  /**
   * Get provider class for an instance ID.
   *
   * Extracts the provider type from the instance ID and returns the corresponding provider class.
   *
   * @param {string} instanceId Instance ID (format: {provider_type}:{uuid})
   * @return {Function|null} Provider class or null if not found
   */
  getProviderForInstance(instanceId) {
    const parsed = this.parseInstanceId(instanceId);
    if (!parsed) {
      return null;
    }
    return this.get(parsed.provider_type);
  }

  /**
   * Create a new instance ID for a provider type.
   *
   * Generates a UUID v4 and combines it with the provider type.
   *
   * @param {string} providerType Provider type (e.g., 'local-filesystem')
   * @return {string} Instance ID (format: {provider_type}:{uuid})
   */
  createInstanceId(providerType) {
    // Generate UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
    return `${providerType}:${uuid}`;
  }

  /**
   * Clear all registered providers.
   *
   * Useful for testing or resetting state.
   *
   * @return {void}
   */
  clear() {
    providers.clear();
  }
}

// Create singleton instance
const registry = new ProviderRegistry();

/**
 * Hook into aether.providers.register to auto-register providers.
 *
 * When providers call doAction('aether.providers.register', ProviderClass),
 * this will automatically register them.
 */
(0,external_wp_hooks_.addAction)('aether.providers.register', 'aether/provider-registry', ProviderClass => {
  if (!ProviderClass || typeof ProviderClass !== 'function') {
    return;
  }

  // Get provider ID from static property
  const providerId = ProviderClass.ID;
  if (!providerId) {
    return; // Invalid provider - must have static ID
  }

  // Register the provider class
  registry.register(providerId, ProviderClass);
});

// Make registry globally available so all bundles share the same instance
// This is necessary because webpack creates separate module instances for each bundle
let exportedRegistry = registry;
if (typeof window !== 'undefined') {
  window.aether = window.aether || {};
  // Only create global registry if it doesn't exist (first bundle to load)
  if (!window.aether.ProviderRegistry) {
    window.aether.ProviderRegistry = registry;
  } else {
    // If registry already exists, use the global one and sync providers
    const globalRegistry = window.aether.ProviderRegistry;
    // Copy any providers from this instance to the global one
    const localProviders = Array.from(providers.values());
    localProviders.forEach(ProviderClass => {
      const providerId = ProviderClass.ID;
      if (!globalRegistry.get(providerId)) {
        globalRegistry.register(providerId, ProviderClass);
      }
    });
    // Use the global registry instead
    exportedRegistry = globalRegistry;
  }
}
/* harmony default export */ const registry_ProviderRegistry = (exportedRegistry);
;// ./assets/src/export/utils/exportConfiguration.js
/**
 * Export Configuration Utilities
 *
 * Pure functions for preparing export workflow configuration.
 * These functions are extracted from useExportController for testability.
 *
 */



/**
 * Prepare export configuration from settings response
 *
 * Extracts provider IDs and settings from API response.
 * Pure function - no side effects, easily testable.
 *
 * @param {Object} settingsResponse - Response from settings API
 * @return {Object} Configuration object with provider IDs
 */
function prepareExportConfiguration(settingsResponse) {
  const settings = settingsResponse?.settings || {};
  const providerTypes = settings.provider_types || {};
  return {
    storageProviderId: providerTypes.storage || '',
    staticSiteProviderId: providerTypes.static_site || '',
    providerConfigs: settings.providers || {}
  };
}

/**
 * Get provider instances for a specific deployment type
 *
 * Filters provider configurations to find instances
 * that support the specified deployment type based on their provider type.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<string>} Array of instance IDs
 */
function getEnabledInstancesForDeploymentType(providerConfigs, deploymentType) {
  try {
    if (!providerConfigs || typeof providerConfigs !== 'object') {
      return [];
    }
    return Object.entries(providerConfigs).filter(([, instanceConfig]) => {
      if (!instanceConfig || typeof instanceConfig !== 'object') {
        return false;
      }

      // Check if provider type supports this deployment type
      const providerType = instanceConfig.provider_type;
      if (!providerType) {
        return false;
      }

      // Get provider class from registry and check if it supports the deployment type
      const ProviderClass = registry_ProviderRegistry.get(providerType);
      if (!ProviderClass) {
        return false;
      }
      const supportsType = ProviderClass.DEPLOYMENT_TYPE === deploymentType;
      return supportsType;
    }).map(([id]) => id);
  } catch (error) {
    return [];
  }
}

/**
 * Validate a provider instance configuration
 *
 * Checks that the instance has required properties and valid configuration.
 *
 * @param {string} instanceId - Instance ID
 * @param {Object} config     - Instance configuration
 * @return {boolean} True if instance is valid
 */
function isValidProviderInstance(instanceId, config) {
  // Must have non-empty ID
  if (!instanceId || typeof instanceId !== 'string') {
    return false;
  }

  // Must have config object
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Must have provider_type
  if (!config.provider_type) {
    return false;
  }
  return true;
}

/**
 * Build provider instance objects from configurations
 *
 * Creates array of provider instances with full config for threading.
 * Each instance has id, label, and complete configuration.
 * Validates each instance to ensure it's properly configured.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<Object>} Valid provider instance objects with { id, label, config }
 */
function buildProviderInstances(providerConfigs, deploymentType) {
  const instanceIds = getEnabledInstancesForDeploymentType(providerConfigs, deploymentType);
  return instanceIds
  // Map to instance objects
  .map(instanceId => {
    const config = providerConfigs[instanceId] || {};
    return {
      id: instanceId,
      label: config.label || instanceId,
      config
    };
  })
  // Validate and filter out invalid instances
  .filter(instance => isValidProviderInstance(instance.id, instance.config));
}

/**
 * Determine providers for all deployment types
 *
 * Pure function that takes provider configs and returns
 * arrays of instance IDs for each deployment type.
 *
 * @param {Object}        providerConfigs - All provider configurations
 * @param {Array<string>} deploymentTypes - Array of deployment type constants
 * @return {Object} Object with arrays of instance IDs keyed by deployment type
 */
function determineProvidersByDeploymentType(providerConfigs, deploymentTypes) {
  const result = {};
  deploymentTypes.forEach(deploymentType => {
    const instances = getEnabledInstancesForDeploymentType(providerConfigs, deploymentType);
    result[deploymentType] = instances;
  });
  return result;
}

/**
 * Build workflow context from configuration
 *
 * Pure function that assembles the context object
 * needed for workflow execution.
 *
 * @param {Object} config       - Configuration object
 * @param {Object} dependencies - External dependencies
 * @return {Object} Workflow context
 */
function buildWorkflowContext(config, dependencies) {
  const {
    siteUrl,
    staticSiteProviders,
    blueprintBundleProviders,
    edgeFunctionProviders,
    staticSiteProviderInstances,
    blueprintBundleProviderInstances,
    edgeFunctionProviderInstances
  } = config;
  const {
    api,
    processStaticSiteUrls,
    generateBlueprintJson,
    updateStaticSiteProgressContext,
    assetManager,
    setStatusMessage,
    setStepProgress,
    setProviderProgress
  } = dependencies;
  return {
    // API and state
    api,
    siteUrl,
    // Provider arrays by deployment type (from PHP registry via REST API)
    staticSiteProviders,
    blueprintBundleProviders,
    edgeFunctionProviders,
    // Provider instance arrays for threading (with full config objects)
    staticSiteProviderInstances,
    blueprintBundleProviderInstances,
    edgeFunctionProviderInstances,
    // Provider instance references (for thread context)
    providerInstances: config.providerInstances || [],
    currentProviderInstance: config.currentProviderInstance || null,
    // Hooks and utilities
    processStaticSiteUrls,
    generateBlueprintJson,
    updateStaticSiteProgressContext,
    assetManager,
    // State setters
    setStatusMessage,
    setStepProgress,
    setProviderProgress,
    // Discovered assets (populated during workflow)
    discoveredAssets: null
  };
}
;// ./assets/src/export/hooks/useExportController.js
/**
 * Publish Controller Hook
 *
 * Orchestrates the export workflow using phase-based execution
 *
 */











function useExportController(exportState) {
  const {
    setIsExporting,
    updateFromStep,
    markAllComplete,
    showError,
    initializeSteps,
    setStatusMessage,
    setOverallProgressValue,
    setStepProgress,
    setProviderProgress,
    removeMessage,
    setProviders
  } = exportState;

  // State for storage provider ID (set before starting export)
  // Must be declared before hooks that use it
  const [setStorageProviderId] = (0,external_wp_element_namespaceObject.useState)('');
  const api = useExportAPI();
  const assetManager = useAssetManager();

  // Create blueprint generator hook.
  const {
    generateBlueprint: generateBlueprintJson
  } = useBlueprintGenerator();

  // Provider context for progress tracking across multiple providers
  // This allows the progress callback to adjust progress based on the current provider index
  const staticSiteProgressContext = (0,external_wp_element_namespaceObject.useRef)({
    providerIndex: 0,
    totalProviders: 1
  });

  // Function to update static site progress context
  // This allows the step handler to set the current provider index before processing
  const updateStaticSiteProgressContext = (0,external_wp_element_namespaceObject.useCallback)((providerIndex, totalProviders) => {
    staticSiteProgressContext.current = {
      providerIndex,
      totalProviders
    };
  }, []);

  // Create static site generator with progress callback
  const processStaticSiteUrls = useStaticSiteGenerator((uploadedFiles, totalFiles) => {
    if (totalFiles > 0 && uploadedFiles >= 0) {
      // Get current provider context
      const {
        providerIndex,
        totalProviders
      } = staticSiteProgressContext.current;

      // Calculate raw numbers accounting for multiple providers
      // For multiple providers, we need to calculate the total across all providers
      // and the current position across all providers
      if (totalProviders > 1) {
        // For multiple providers, each provider processes totalFiles
        // Current position: providerIndex * totalFiles + uploadedFiles
        // Total: totalProviders * totalFiles
        const totalAcrossProviders = totalProviders * totalFiles;
        const currentAcrossProviders = providerIndex * totalFiles + uploadedFiles;
        setStepProgress('uploadStaticFiles', {
          current: currentAcrossProviders,
          total: totalAcrossProviders
        });
      } else {
        // Single provider - use raw numbers directly
        setStepProgress('uploadStaticFiles', {
          current: uploadedFiles,
          total: totalFiles
        });
      }
    }
  });
  const startExport = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    try {
      // Initialize steps with 'discoverBlueprintBundleAssets' as the active step
      // This sets up steps array, active step, and lastStepIndex correctly
      initializeSteps(getRegisteredSteps(), 'discoverBlueprintBundleAssets');
      // Set isExporting to true to start the workflow
      setIsExporting(true);

      // Fetch settings to get storage provider ID before starting
      const settingsResponse = await (0,utils_api/* default */.Ay)({
        path: '/aether/site-exporter/settings'
      });

      // Use pure function to extract configuration
      const exportConfig = prepareExportConfiguration(settingsResponse);

      // Update storage provider ID state
      if (settingsResponse.success && exportConfig.storageProviderId) {
        setStorageProviderId(exportConfig.storageProviderId);
      }

      // Fetch asset status
      try {
        const assetStatusResponse = await api.getAssetStatus();
        if (assetStatusResponse.success && assetStatusResponse.assets) {
          assetManager.syncWithServer(assetStatusResponse.assets);
        }
      } catch (assetError) {
        // Asset status fetch is not critical - log and continue
      }

      // Activate the first step immediately to update UI
      updateFromStep('discoverBlueprintBundleAssets');

      // Get current site URL for static site generation (use pure function)
      const siteUrl = window.location.origin;

      // Get arrays of instance IDs for each deployment type (use pure function)
      const providersByType = determineProvidersByDeploymentType(exportConfig.providerConfigs, [DEPLOYMENT_TYPES.STATIC_SITE, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE, DEPLOYMENT_TYPES.EDGE_FUNCTIONS]);
      const staticSiteProviders = providersByType[DEPLOYMENT_TYPES.STATIC_SITE];
      const blueprintBundleProviders = providersByType[DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
      const edgeFunctionProviders = providersByType[DEPLOYMENT_TYPES.EDGE_FUNCTIONS];

      // Build provider instance objects for threading
      const staticSiteProviderInstances = buildProviderInstances(exportConfig.providerConfigs, DEPLOYMENT_TYPES.STATIC_SITE);
      const blueprintBundleProviderInstances = buildProviderInstances(exportConfig.providerConfigs, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE);
      const edgeFunctionProviderInstances = buildProviderInstances(exportConfig.providerConfigs, DEPLOYMENT_TYPES.EDGE_FUNCTIONS);

      // Store provider arrays in global state for UI access
      setProviders(staticSiteProviders, blueprintBundleProviders);

      // Build context object with all dependencies for step handlers (use pure function)
      const workflowContext = buildWorkflowContext({
        siteUrl,
        staticSiteProviders,
        blueprintBundleProviders,
        edgeFunctionProviders,
        staticSiteProviderInstances,
        blueprintBundleProviderInstances,
        edgeFunctionProviderInstances
      }, {
        api,
        processStaticSiteUrls,
        generateBlueprintJson,
        updateStaticSiteProgressContext,
        assetManager,
        setStatusMessage,
        setStepProgress,
        setProviderProgress
      });

      // Add additional UI callbacks not in pure function (to avoid coupling)
      workflowContext.setOverallProgressValue = setOverallProgressValue;
      workflowContext.removeMessage = removeMessage;

      // Execute full workflow - individual steps check provider type

      // Set up workflow lifecycle callbacks for UI updates
      const workflowOptions = {
        onStepStart: stepId => {
          // Update UI with step ID
          updateFromStep(stepId);
        },
        onStepComplete: () => {},
        onStepSkipped: () => {},
        onError: () => {}
      };

      // Get steps filtered by enabled providers
      const activeSteps = getActiveSteps(workflowContext);

      // Determine provider instances for threading
      // Use all provider instances across all deployment types
      const allProviderInstances = [...staticSiteProviderInstances, ...blueprintBundleProviderInstances, ...edgeFunctionProviderInstances];

      // Execute workflow with ThreadOrchestrator (handles 0, 1, or N providers)
      await executeThreadedWorkflow(activeSteps, workflowContext, allProviderInstances, workflowOptions);

      // Clear asset upload tracking flags (reset state for next export)
      assetManager.clearUploadFlags();

      // Update UI to show all steps as complete with success message
      markAllComplete({
        status: 'complete'
      });

      // Release exporting lock (allows user to start new export)
      setIsExporting(false);
    } catch (error) {
      showError(`Failed to start: ${error.message}`);
      setIsExporting(false);
    }
  }, [setIsExporting, api, assetManager, showError, initializeSteps, setStorageProviderId, updateFromStep, updateStaticSiteProgressContext, processStaticSiteUrls, generateBlueprintJson, setStatusMessage, setStepProgress, setProviderProgress, removeMessage, setOverallProgressValue, setProviders, markAllComplete]);
  return {
    startExport
  };
}
;// ./assets/src/utils/styles.js
/**
 * Shared style utilities and constants
 *
 * Centralized styles for inline styling across components.
 *
 */

const colors = {
  primary: '#2271b1',
  primaryHover: '#135e96',
  primaryDark: '#0a4168',
  text: '#1d2327',
  textMuted: '#646970',
  textSecondary: '#50575e',
  white: '#fff',
  black: '#000',
  background: '#f6f7f7',
  backgroundLighter: '#f0f0f1',
  backgroundError: '#fcf0f1',
  backgroundSuccess: '#d5f0dd',
  backgroundWarning: '#fcf0c7',
  backgroundInfo: '#d7edff',
  borderLight: '#c3c4c7',
  borderLighter: '#e0e0e0',
  borderActive: '#007cba',
  error: '#d63638',
  errorDark: '#c22c2e',
  success: '#00a32a',
  successDark: '#00833e',
  warning: '#dba617',
  warningDark: '#826200',
  info: '#2271b1',
  // Deployment type colors
  deploymentStaticSite: '#2271b1',
  deploymentBlueprintBundle: '#00a32a',
  deploymentEdgeFunctions: '#986800',
  // Overlay/shadow colors
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowLighter: 'rgba(0, 0, 0, 0.05)',
  shadowActive: 'rgba(0, 124, 186, 0.1)'
};
const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem'
};
const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px'
};
const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem'
};
const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};
const commonStyles = {
  section: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: `0 1px 1px ${colors.shadowLight}`,
    marginBottom: spacing.lg,
    padding: 0
  },
  sectionHeader: {
    borderBottom: `1px solid ${colors.borderLight}`,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    background: colors.background
  },
  card: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.sm,
    padding: spacing.lg
  }
};
const statusBadgeStyles = {
  base: {
    display: 'inline-block',
    paddingTop: '3px',
    paddingBottom: '3px',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    letterSpacing: '0.5px'
  },
  success: {
    background: colors.backgroundSuccess,
    color: colors.successDark
  },
  error: {
    background: colors.backgroundError,
    color: colors.errorDark
  },
  warning: {
    background: colors.backgroundWarning,
    color: colors.warningDark
  },
  info: {
    background: colors.backgroundInfo,
    color: colors.primaryHover
  }
};
const noticeStyles = {
  base: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
    borderLeft: '4px solid',
    background: colors.white
  },
  success: {
    borderLeftColor: colors.success,
    background: colors.backgroundSuccess
  },
  error: {
    borderLeftColor: colors.error,
    background: colors.backgroundError
  },
  warning: {
    borderLeftColor: colors.warning,
    background: colors.backgroundWarning
  },
  info: {
    borderLeftColor: colors.info,
    background: colors.backgroundInfo
  }
};

/**
 * Create flexbox style object
 *
 * @param {string} direction Flex direction ('row' or 'column')
 * @param {string} gap       Gap spacing
 * @return {Object} Style object
 */
const createFlexStyle = (direction = 'row', gap = spacing.md) => ({
  display: 'flex',
  flexDirection: direction,
  gap
});
;// ./assets/src/components/ProgressBar/index.js
/**
 * Progress Bar Component
 *
 * Displays progress using a native HTML progress element with optional description text.
 *
 * @package
 */




/**
 * Progress Bar Component
 *
 * Displays a progress bar with current/total values and optional description.
 *
 * @param {Object} props               - Component props
 * @param {Object} props.progress      - Progress object with `current` (number) and `total` (number) properties
 * @param {string} [props.description] - Optional description text displayed below progress bar
 * @param {number} props.height        - Height of the progress element in pixels
 * @return {JSX.Element} Progress bar component
 */

function ProgressBar({
  progress,
  description,
  height
}) {
  // Calculate percentage for display
  const percentage = progress.total > 0 ? Math.round(progress.current / progress.total * 100) : 0;

  // Container style
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs
  };

  // Progress element style
  const progressStyle = {
    width: '100%',
    height: `${height}px`
  };

  // Description style
  const descriptionStyle = {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    margin: 0
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    style: containerStyle,
    className: "aether-progress-bar",
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("progress", {
      style: progressStyle,
      max: progress.total,
      value: progress.current,
      "aria-valuenow": progress.current,
      "aria-valuemin": 0,
      "aria-valuemax": progress.total,
      "aria-label": description || (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Progress percentage */
      (0,external_wp_i18n_namespaceObject.__)('Progress: %1$d%%', 'aether-site-exporter'), percentage)
    }), description && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
      style: descriptionStyle,
      className: "aether-progress-bar__description",
      children: description
    })]
  });
}
/* harmony default export */ const components_ProgressBar = (ProgressBar);
;// ./assets/src/components/ProviderProgressBar/index.js
/**
 * Provider Progress Bar Component
 *
 * Displays progress for a single provider instance.
 * Shows provider label, current step, and progress using raw numbers.
 *
 * @since 1.0.0
 */





/**
 * Provider Progress Bar Component
 *
 * @param {Object} props               - Component props
 * @param {string} props.providerId    - Provider instance ID
 * @param {string} props.providerLabel - Provider display label
 * @param {string} props.stepLabel     - Current step label
 * @param {Object} props.progress      - Progress object with `current` and `total` properties
 * @param {string} props.status        - Status: 'active', 'complete', 'error'
 * @param {string} props.error         - Error message (if status is 'error')
 * @return {JSX.Element} Provider progress bar component
 */

function ProviderProgressBar({
  providerId,
  providerLabel,
  stepLabel,
  progress,
  status,
  error
}) {
  // Calculate percentage for display
  const percentage = progress.total > 0 ? Math.round(progress.current / progress.total * 100) : 0;
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      default:
        return null;
    }
  };
  const statusIcon = getStatusIcon();

  // Base container style
  const containerStyle = {
    marginBottom: spacing.lg,
    padding: spacing.md,
    border: `1px solid ${colors.borderLighter}`,
    borderRadius: borderRadius.sm,
    background: colors.white,
    transition: 'all 0.3s ease'
  };

  // Status-specific styles
  if (status === 'active') {
    containerStyle.borderColor = colors.borderActive;
    containerStyle.boxShadow = `0 0 0 1px ${colors.shadowActive}`;
  } else if (status === 'complete') {
    containerStyle.borderColor = colors.success;
    containerStyle.background = colors.background;
  } else if (status === 'error') {
    containerStyle.borderColor = colors.error;
    containerStyle.background = colors.backgroundError;
  }

  // Header style
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  };

  // Label style
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: fontSize.sm
  };

  // Status icon style
  const statusIconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold
  };
  if (status === 'active') {
    statusIconStyle.animation = 'pulse 1.5s ease-in-out infinite';
  } else if (status === 'complete') {
    statusIconStyle.background = colors.success;
    statusIconStyle.color = colors.white;
  } else if (status === 'error') {
    statusIconStyle.background = colors.error;
    statusIconStyle.color = colors.white;
  }

  // Percentage style
  const percentageStyle = {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold
  };

  // Step label style
  const stepStyle = {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontStyle: 'italic'
  };

  // Error message style
  const errorStyle = {
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    background: colors.backgroundError,
    borderRadius: '2px'
  };

  // Complete message style
  const completeMessageStyle = {
    fontSize: fontSize.xs,
    color: colors.success,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium
  };

  // Progress bar wrapper style
  const progressBarWrapperStyle = {
    position: 'relative'
  };

  // Build modifier classes based on status
  const statusModifier = status ? `aether-provider-progress-bar--${status}` : '';
  const containerClasses = ['aether-provider-progress-bar', statusModifier].filter(Boolean).join(' ');
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("style", {
      children: `
					@keyframes pulse {
						0%, 100% {
							opacity: 1;
						}
						50% {
							opacity: 0.5;
						}
					}
				`
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: containerClasses,
      style: containerStyle,
      "data-provider-id": providerId,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-progress-bar__header",
        style: headerStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-provider-progress-bar__label",
          style: labelStyle,
          children: [statusIcon && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
            className: "aether-provider-progress-bar__status-icon",
            style: statusIconStyle,
            children: statusIcon
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
            className: "aether-provider-progress-bar__provider-name",
            children: providerLabel
          })]
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-provider-progress-bar__percentage",
          style: percentageStyle,
          children: [percentage, "%"]
        })]
      }), stepLabel && status === 'active' && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__step",
        style: stepStyle,
        children: stepLabel
      }), error && status === 'error' && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__error",
        style: errorStyle,
        children: error
      }), status === 'complete' && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__complete",
        style: completeMessageStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Complete', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__progress",
        style: progressBarWrapperStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProgressBar, {
          progress: progress,
          height: 8
        })
      })]
    })]
  });
}
/* harmony default export */ const components_ProviderProgressBar = (ProviderProgressBar);
;// ./assets/src/components/ProviderProgressList/index.js
/**
 * Provider Progress List Component
 *
 * Displays a list of provider progress bars.
 * Shows progress for each provider instance running in parallel.
 *
 * @since 1.0.0
 */





/**
 * Provider Progress List Component
 *
 * @param {Object} props                   - Component props
 * @param {Object} props.providerProgress  - Provider progress object { [providerId]: { stepId, stepLabel, progress: { current, total }, status, error } }
 * @param {Array}  props.providerInstances - Array of provider instances { id, label, config }
 * @return {JSX.Element|null} Provider progress list component
 */

function ProviderProgressList({
  providerProgress = {},
  providerInstances = []
}) {
  // If no provider instances, don't render anything
  if (providerInstances.length === 0) {
    return null;
  }

  // If only one provider, don't show the list (show normal progress instead)
  if (providerInstances.length === 1) {
    return null;
  }

  // Container style
  const containerStyle = {
    margin: '20px 0'
  };

  // Header style
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottom: `2px solid ${colors.borderLighter}`
  };

  // Header h4 style
  const headerTitleStyle = {
    margin: 0,
    fontSize: '15px',
    fontWeight: fontWeight.semibold,
    color: colors.text
  };

  // Count badge style
  const countStyle = {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    padding: '4px 8px',
    background: colors.background,
    borderRadius: '12px'
  };

  // Items container style
  const itemsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-provider-progress-list",
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-progress-list__header",
      style: headerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h4", {
        className: "aether-provider-progress-list__title",
        style: headerTitleStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Provider Progress', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        className: "aether-provider-progress-list__count",
        style: countStyle,
        children: [providerInstances.length, ' ', (0,external_wp_i18n_namespaceObject.__)('providers', 'aether-site-exporter')]
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-progress-list__items",
      style: itemsStyle,
      children: providerInstances.map(instance => {
        const progress = providerProgress[instance.id] || {
          stepId: null,
          stepLabel: (0,external_wp_i18n_namespaceObject.__)('Pending', 'aether-site-exporter'),
          progress: {
            current: 0,
            total: 0
          },
          status: 'pending'
        };
        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProviderProgressBar, {
          providerId: instance.id,
          providerLabel: instance.label || instance.id,
          stepLabel: progress.stepLabel,
          progress: progress.progress,
          status: progress.status,
          error: progress.error
        }, instance.id);
      })
    })]
  });
}
/* harmony default export */ const components_ProviderProgressList = (ProviderProgressList);
;// ./assets/src/components/ExportProgressModal/index.js
/**
 * Publish Progress Modal Component
 *
 * Shows export progress with progress bar and status messages
 *
 */










// Styles - extracted to module level for performance

const modalContentStyle = {
  padding: spacing['2xl'],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing['2xl']
};
const noticeErrorStyle = {
  ...noticeStyles.error,
  padding: spacing.md,
  marginBottom: spacing.md
};
const noticeSuccessStyle = {
  ...noticeStyles.success,
  padding: spacing.md,
  marginBottom: spacing.md
};
const noticeParagraphStyle = {
  margin: '0 0 0.5rem'
};
const progressContainerStyle = {
  ...createFlexStyle('column', spacing.xl)
};
const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.xl,
  padding: spacing['2xl'],
  textAlign: 'center'
};
const loadingParagraphStyle = {
  margin: 0,
  fontSize: '1.125rem',
  color: colors.textMuted
};
function ExportProgressModal({
  isOpen,
  onClose,
  onComplete
}) {
  const exportState = useExportState();
  const {
    startExport
  } = useExportController(exportState);
  const {
    steps,
    isExporting,
    finalStatus,
    error,
    reset,
    staticSiteProviders,
    blueprintBundleProviders,
    providerProgress
  } = exportState;

  // Keep modal open if finalStatus is set, even if isOpen becomes false
  // This allows the auto-close effect to run and show the success message
  const shouldShowModal = isOpen || finalStatus;

  // Wrapper for onClose that resets state before closing
  // Only allow closing when job is finished (has finalStatus or error)
  const handleClose = (0,external_wp_element_namespaceObject.useCallback)(() => {
    // Prevent closing while job is in progress
    if (isExporting && !finalStatus && !error) {
      return;
    }
    reset();
    if (onClose) {
      onClose();
    }
  }, [reset, onClose, isExporting, finalStatus, error]);

  // Reset state when modal closes (only when shouldShowModal becomes false)
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!shouldShowModal) {
      reset();
    }
  }, [shouldShowModal, reset]);

  // Start export when modal opens
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isOpen && !isExporting) {
      // Only start if we haven't started yet (no steps initialized)
      if (steps.length === 0) {
        startExport();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen to avoid re-triggering

  // Handle completion
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (finalStatus && onComplete) {
      // Call onComplete callback to refresh data
      // Note: Modal no longer auto-closes, user must manually close
      onComplete(finalStatus);
    }
  }, [finalStatus, onComplete]);

  // Calculate overall progress from steps using raw numbers
  const overallProgressData = (0,external_wp_element_namespaceObject.useMemo)(() => {
    if (steps.length === 0) {
      return {
        current: 0,
        total: 0
      };
    }

    // Sum up current and total from all steps that support progress
    let totalCurrent = 0;
    let totalTotal = 0;
    steps.forEach(step => {
      if (step.supportsProgress && step.progress) {
        totalCurrent += step.progress.current || 0;
        totalTotal += step.progress.total || 0;
      }
    });

    // If no steps support progress, return zero progress
    if (totalTotal === 0) {
      return {
        current: 0,
        total: 0
      };
    }
    return {
      current: totalCurrent,
      total: totalTotal
    };
  }, [steps]);

  // Build provider instances array from provider IDs
  // Combine all providers across deployment types for display
  const allProviderInstances = (0,external_wp_element_namespaceObject.useMemo)(() => {
    const instances = [];

    // Add static site providers
    staticSiteProviders.forEach(id => {
      instances.push({
        id,
        label: id // Label will come from config if available
      });
    });

    // Add blueprint bundle providers (avoid duplicates)
    blueprintBundleProviders.forEach(id => {
      if (!instances.find(p => p.id === id)) {
        instances.push({
          id,
          label: id
        });
      }
    });
    return instances;
  }, [staticSiteProviders, blueprintBundleProviders]);
  if (!shouldShowModal) {
    return null;
  }
  const getModalTitle = () => {
    if (error) {
      return (0,external_wp_i18n_namespaceObject.__)('Publish Failed', 'aether-site-exporter');
    }
    if (finalStatus) {
      return (0,external_wp_i18n_namespaceObject.__)('Site Published Successfully!', 'aether-site-exporter');
    }
    return (0,external_wp_i18n_namespaceObject.__)('Exporting Site', 'aether-site-exporter');
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Modal, {
    className: "aether-export-progress-modal",
    title: getModalTitle(),
    onRequestClose: handleClose,
    isFullScreen: false,
    shouldCloseOnClickOutside: false,
    shouldCloseOnEsc: false,
    __experimentalHideHeader: false,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-export-progress-modal__content",
      style: modalContentStyle,
      children: [error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-export-progress-modal__notice aether-export-progress-modal__notice--error",
        style: noticeErrorStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-export-progress-modal__notice-text",
          style: {
            margin: 0
          },
          children: error
        })
      }), finalStatus && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-export-progress-modal__notice aether-export-progress-modal__notice--success",
        style: noticeSuccessStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-export-progress-modal__notice-text",
          style: noticeParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Your site has been exported successfully!', 'aether')
        }), finalStatus.deploymentUrl && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("p", {
          className: "aether-export-progress-modal__deployment",
          style: {
            margin: 0
          },
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
            className: "aether-export-progress-modal__deployment-label",
            children: (0,external_wp_i18n_namespaceObject.__)('View your published site:', 'aether')
          }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
            className: "aether-export-progress-modal__deployment-link",
            href: finalStatus.deploymentUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            children: finalStatus.deploymentUrl
          })]
        })]
      }), !finalStatus && !error && steps.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-export-progress-modal__progress",
        style: progressContainerStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProgressBar, {
          progress: overallProgressData,
          height: 20,
          description: overallProgressData.total > 0 ? `${Math.round(overallProgressData.current / overallProgressData.total * 100)}%` : undefined
        })
      }), !finalStatus && !error && allProviderInstances.length > 1 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProviderProgressList, {
        providerProgress: providerProgress,
        providerInstances: allProviderInstances
      }), steps.length === 0 && !error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-export-progress-modal__loading",
        style: loadingStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {
          className: "aether-export-progress-modal__spinner"
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-export-progress-modal__loading-text",
          style: loadingParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Initializing export process…', 'aether-site-exporter')
        })]
      })]
    })
  });
}
;// ./assets/src/components/ErrorBoundary/index.js
/**
 * Error Boundary Component
 *
 * Catches errors in React component tree and displays a fallback UI
 * instead of crashing the entire application.
 *
 */





/**
 * Error Boundary component
 */

class ErrorBoundary extends external_wp_element_namespaceObject.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('Error caught by ErrorBoundary:', {
      error,
      errorInfo
    });
    this.setState({
      error,
      errorInfo
    });

    // Optionally send to error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.resetError
        });
      }

      // Default fallback UI
      const containerStyle = {
        padding: spacing.lg
      };
      const noticeStyle = {
        ...noticeStyles.error,
        padding: spacing.md + ' ' + spacing.lg,
        margin: spacing.lg + ' 0'
      };
      const headingStyle = {
        margin: '0 0 ' + spacing.sm,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: colors.text
      };
      const paragraphStyle = {
        margin: '0 0 ' + spacing.sm,
        color: colors.text
      };
      return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-error-boundary",
        style: containerStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-error-boundary__notice",
          style: noticeStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h2", {
            className: "aether-error-boundary__heading",
            style: headingStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Something went wrong', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
            className: "aether-error-boundary__message",
            style: paragraphStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('An unexpected error occurred. Please try refreshing the page.', 'aether')
          }), this.state.error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("details", {
            className: "aether-error-boundary__details",
            style: {
              marginTop: spacing.lg
            },
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("summary", {
              className: "aether-error-boundary__summary",
              children: (0,external_wp_i18n_namespaceObject.__)('Error details', 'aether-site-exporter')
            }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("pre", {
              className: "aether-error-boundary__error-text",
              style: {
                marginTop: spacing.lg,
                padding: spacing.lg,
                background: colors.backgroundLighter,
                overflow: 'auto',
                fontSize: fontSize.sm
              },
              children: [this.state.error.toString(), this.state.errorInfo && this.state.errorInfo.componentStack]
            })]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("button", {
            type: "button",
            className: "aether-error-boundary__retry-button",
            onClick: this.resetError,
            style: {
              marginTop: spacing.lg,
              padding: spacing.sm + ' ' + spacing.lg,
              background: colors.primary,
              color: colors.white,
              border: `1px solid ${colors.primary}`,
              borderRadius: borderRadius.sm,
              cursor: 'pointer',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.normal,
              lineHeight: 1.5
            },
            children: (0,external_wp_i18n_namespaceObject.__)('Try again', 'aether-site-exporter')
          })]
        })
      });
    }
    return this.props.children;
  }
}
/* harmony default export */ const components_ErrorBoundary = (ErrorBoundary);
;// ./assets/src/utils/errorHandler.js
/**
 * Global Error Handler
 *
 * Handles unhandled promise rejections and runtime errors globally.
 *
 */

/**
 * Initialize global error handlers
 */
function initializeErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });

    // Prevent default browser behavior (console error)
    event.preventDefault();

    // Show user-friendly error notification
    showErrorNotification('An unexpected error occurred. Please try again or refresh the page.');
  });

  // Handle uncaught errors
  window.addEventListener('error', event => {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Don't prevent default for syntax errors - let them show in console
    if (event.error && event.error.stack) {
      event.preventDefault();
      showErrorNotification('An unexpected error occurred. Please refresh the page.');
    }
  });
}

/**
 * Show error notification to user
 *
 * @param {string} message Error message to display
 */
function showErrorNotification(message) {
  // Use WordPress notices if available
  if (window.wp && window.wp.data && window.wp.data.dispatch) {
    // Store dispatch result in a variable first to safely check it
    const noticesDispatch = window.wp.data.dispatch('core/notices');

    // Check if result is a valid object before destructuring
    if (noticesDispatch && typeof noticesDispatch === 'object') {
      const {
        createErrorNotice
      } = noticesDispatch;
      if (createErrorNotice && typeof createErrorNotice === 'function') {
        createErrorNotice(message, {
          id: 'aether-global-error',
          isDismissible: true
        });
        return;
      }
    }
  }

  // Fallback to console error
  console.error(message);
}
;// ./assets/src/export-modal/index.js
/**
 * Export Modal Entry Point
 *
 * Self-contained bundle with ExportProgressModal and all dependencies.
 * Loaded dynamically when admin bar export button is clicked.
 *
 */

// Set webpack publicPath before any imports
// Note: Webpack is configured to never create chunks - all code is bundled into single files
/* global __webpack_public_path__ */
/* eslint-disable camelcase */
if (true) {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.pluginUrl) {
    const pluginUrl = window.aetherData.pluginUrl;
    // Ensure plugin URL ends with slash
    const publicPath = pluginUrl.endsWith('/') ? pluginUrl + 'assets/build/' : pluginUrl + '/assets/build/';
    __webpack_require__.p = publicPath;
  }
}
/* eslint-enable camelcase */







// Initialize global error handlers

initializeErrorHandlers();

/**
 * Initialize export modal from admin bar
 *
 * @return {void}
 */
function initExportModal() {
  // Create or get root container
  let container = document.getElementById('aether-export-modal-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'aether-export-modal-root';
    document.body.appendChild(container);
  }

  // Handle modal close
  const handleClose = () => {
    const containerEl = document.getElementById('aether-export-modal-root');
    if (containerEl) {
      (0,external_wp_element_namespaceObject.render)(null, containerEl);
    }
    // Reset loading flag after delay to allow modal to close
    setTimeout(() => {
      window.aetherExportLoaded = false;
    }, 300);
  };
  try {
    (0,external_wp_element_namespaceObject.render)(/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ErrorBoundary, {
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ExportProvider, {
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ExportProgressModal, {
          isOpen: true,
          onClose: handleClose
        })
      })
    }), container);
  } catch (error) {
    // eslint-disable-line no-console
    console.error('Aether: Error rendering export modal:', error);
  }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExportModal);
} else {
  initExportModal();
}
/******/ })()
;