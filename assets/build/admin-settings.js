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
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(735);
/**
 * Unified File Upload System
 *
 * Provides a unified action-based system for all file uploads (blueprint bundles,
 * static HTML, static assets, etc.) to storage providers.
 *
 * @package
 */






/**
 * File types supported by the unified upload system.
 *
 * @type {Object<string, string>}
 */
const FILE_TYPES = {
  BLUEPRINT_BUNDLE: 'blueprint-bundle',
  STATIC_HTML: 'static-html',
  STATIC_ASSET: 'static-asset'
};

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
  } catch (error) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__/* .debugWarn */ .UT)(`Failed to fetch provider config for ${providerId}:`, error);
  }
  return null;
}

/**
 * Execute action handlers asynchronously.
 *
 * WordPress hooks don't have built-in async action support. We use a promise
 * tracking system where handlers register their promises on the context object.
 *
 * @param {string} actionName  Action name.
 * @param {Object} fileContext File context object (first arg).
 * @return {Promise<void>}
 */
async function doActionAsync(actionName, fileContext) {
  // Initialize promise array on fileContext
  if (!fileContext._uploadPromises) {
    fileContext._uploadPromises = [];
  }

  // Fire the action - handlers will add their promises to fileContext._uploadPromises
  (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.doAction)(actionName, fileContext);

  // Wait for all registered promises to complete
  const promises = fileContext._uploadPromises || [];
  if (promises.length > 0) {
    await Promise.all(promises);
  }

  // Clean up
  delete fileContext._uploadPromises;
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
        } else {
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__/* .debugWarn */ .UT)('Cannot process HTML: fileContent is not a string or Blob');
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
      } else {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__/* .debugWarn */ .UT)(`Cannot process HTML for ${providerId}: staticSiteUrl not available`);
      }
    } catch (error) {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__/* .debugWarn */ .UT)(`Failed to process HTML for ${filePath || 'unknown'}:`, error);
      // Continue with original content on error
    }
  }

  // Create context with processed content
  const contextWithProcessedContent = {
    ...fileContext,
    fileContent: processedContent
  };

  // Allow filtering of file context before upload
  const filteredContext = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.file.upload.context', contextWithProcessedContent, providerId);

  // Fire unified upload action asynchronously
  // Providers hook into this action to handle the actual upload
  await doActionAsync('aether.file.upload', filteredContext);

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

/***/ 159:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  StorageService: () => (/* binding */ StorageService)
});

// EXTERNAL MODULE: ./assets/src/utils/api.js + 1 modules
var api = __webpack_require__(186);
// EXTERNAL MODULE: ./assets/src/utils/debug.js
var utils_debug = __webpack_require__(735);
;// ./assets/src/utils/standardResponse.js
/**
 * Standard Response Format Utility
 *
 * Provides standardized response object format for API operations.
 *
 * Standard format:
 * {
 *   success: boolean,
 *   data?: any,           // Success data
 *   error?: string,       // Single error message
 *   errors?: string[]     // Multiple errors (optional)
 * }
 *
 * @package
 */

/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
function standardResponse_createSuccessResponse(data = null, message = null) {
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
function standardResponse_createErrorResponse(error, errors = null) {
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
;// ./assets/src/utils/filesystemAdapter.js
/**
 * Filesystem Adapter
 *
 * Adapter for local filesystem storage operations via REST API.
 * Replaces workerEndpointClient.js for local storage.
 *
 * @package
 */





/**
 * Upload a file to local filesystem via REST API.
 *
 * @param {string}    staticPath Base path for static files.
 * @param {string}    key        File path/key relative to static path.
 * @param {File|Blob} file       File to upload.
 * @param {Object}    options    Optional options (contentType, cacheControl, onProgress, jobId).
 * @return {Promise<Object>} Upload result with success and optional url/error.
 */
async function uploadFile(staticPath, key, file, options = {}) {
  try {
    // Validate key parameter
    if (!key || key === '') {
      const error = new Error(`Upload key is empty. File: ${file?.name || 'unknown'}, staticPath: ${staticPath}`);
      return createErrorResponse(error.message);
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('static_path', staticPath);
    formData.append('job_id', options.jobId || '');
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
      debug('filesystemAdapter.uploadFile API error:', apiError);
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
    debug('filesystemAdapter.uploadFile error:', error);
    return createErrorResponse(error.message || 'Upload failed');
  }
}

/**
 * Delete a file from local filesystem.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to delete.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Object>} Delete result.
 */
async function deleteFile(staticPath, key, options = {}) {
  (0,utils_debug/* debug */.Yz)('filesystemAdapter.deleteFile:', {
    staticPath,
    key
  });
  try {
    const response = await (0,api/* default */.Ay)({
      path: '/aether/site-exporter/local-storage/delete',
      method: 'DELETE',
      data: {
        key,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return standardResponse_createErrorResponse(response.error || 'Delete failed');
    }
    return standardResponse_createSuccessResponse();
  } catch (error) {
    (0,utils_debug/* debug */.Yz)('filesystemAdapter.deleteFile error:', error);
    return standardResponse_createErrorResponse(error.message || 'Delete failed');
  }
}

/**
 * Copy a file (not needed for local filesystem - files are uploaded directly).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} sourceKey  Source file path/key.
 * @param {string} destKey    Destination file path/key.
 * @return {Promise<Object>} Copy result.
 */
async function copyFile(staticPath, sourceKey, destKey) {
  // Parameters kept for API consistency, but not used for local filesystem
  // eslint-disable-next-line no-unused-vars
  const _unused = {
    staticPath,
    sourceKey,
    destKey
  };
  // Not implemented for local filesystem
  // Files are uploaded directly to their final location
  (0,utils_debug/* debug */.Yz)('filesystemAdapter.copyFile: Not implemented (not needed for local storage)');
  return standardResponse_createSuccessResponse();
}

/**
 * List objects in a directory (not needed for static site generation).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} prefix     Directory prefix to list.
 * @param {number} limit      Maximum number of objects to return.
 * @return {Promise<Object>} List result.
 */
async function listObjects(staticPath, prefix = '', limit = 1000) {
  // Parameters kept for API consistency, but not used for local filesystem
  // eslint-disable-next-line no-unused-vars
  const _unused = {
    staticPath,
    prefix,
    limit
  };
  // Not implemented - not needed for static site generation
  // Static site generator doesn't need to list existing files
  (0,utils_debug/* debug */.Yz)('filesystemAdapter.listObjects: Not implemented (not needed for static site generation)');
  return standardResponse_createSuccessResponse({
    objects: []
  });
}

/**
 * Batch copy files (not needed for local filesystem).
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  operations Array of {source, dest} operations.
 * @return {Promise<Object>} Batch copy result.
 */
async function batchCopy(staticPath, operations) {
  // Parameters kept for API consistency, but not used for local filesystem
  // eslint-disable-next-line no-unused-vars
  const _unused = {
    staticPath,
    operations
  };
  // Not implemented for local filesystem
  (0,utils_debug/* debug */.Yz)('filesystemAdapter.batchCopy: Not implemented (not needed for local storage)');
  return standardResponse_createSuccessResponse();
}

/**
 * Batch delete files.
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  keys       Array of file paths/keys to delete.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Object>} Batch delete result.
 */
async function batchDelete(staticPath, keys, options = {}) {
  (0,utils_debug/* debug */.Yz)('filesystemAdapter.batchDelete:', {
    staticPath,
    count: keys.length
  });
  try {
    const response = await (0,api/* default */.Ay)({
      path: '/aether/site-exporter/local-storage/batch-delete',
      method: 'DELETE',
      data: {
        keys,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return standardResponse_createErrorResponse(response.error || 'Batch delete failed');
    }
    return standardResponse_createSuccessResponse();
  } catch (error) {
    (0,utils_debug/* debug */.Yz)('filesystemAdapter.batchDelete error:', error);
    return standardResponse_createErrorResponse(error.message || 'Batch delete failed');
  }
}

/**
 * Download a file (manifest).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to download.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Blob|null>} File blob or null if not found.
 */
async function downloadFile(staticPath, key, options = {}) {
  (0,utils_debug/* debug */.Yz)('filesystemAdapter.downloadFile:', {
    staticPath,
    key
  });
  try {
    const response = await (0,api/* default */.Ay)({
      path: `/aether/site-exporter/local-storage/download?key=${encodeURIComponent(key)}&static_path=${encodeURIComponent(staticPath)}&job_id=${options.jobId || ''}`,
      method: 'GET',
      parse: false // Get raw response
    });
    if (!response.ok) {
      return null;
    }
    return await response.blob();
  } catch (error) {
    (0,utils_debug/* debug */.Yz)('filesystemAdapter.downloadFile error:', error);
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
 * @package
 */




/**
 * Storage Service class.
 */
class StorageService {
  /**
   * Constructor.
   *
   * @param {string} staticPath Path for static files storage.
   * @param {string} jobId      Job ID for this export (optional, defaults to empty string).
   * @param {Object} config     Optional configuration.
   */
  constructor(staticPath, jobId = '', config = {}) {
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
   * Note: Local filesystem providers don't need prefixing since they use
   * different base paths (static/, static2/, static3/) for isolation.
   *
   * @param {string} key Original storage key.
   * @return {string} Prefixed storage key.
   */
  _prefixKey(key) {
    if (!this.providerId) {
      return key;
    }

    // Skip prefixing for local-filesystem providers
    // They use different base paths for isolation (e.g., static/, static2/, static3/)
    if (this.providerId.startsWith('local-filesystem:')) {
      return key;
    }

    // Don't double-prefix
    if (key.startsWith(this.providerId + '/')) {
      return key;
    }
    return `${this.providerId}/${key}`;
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
    const prefixedKey = this._prefixKey(key);

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
      storageKey: prefixedKey,
      providerId: this.providerId,
      metadata: {
        staticPath: this.staticPath,
        originalKey: key,
        jobId: this.jobId,
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
    const prefixedKey = this._prefixKey(key);
    return deleteFile(this.staticPath, prefixedKey, {
      jobId: this.jobId
    });
  }

  /**
   * Copy an object from source to destination within storage.
   *
   * @param {string} sourceKey Source object key.
   * @param {string} destKey   Destination object key.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async copy(sourceKey, destKey) {
    const prefixedSourceKey = this._prefixKey(sourceKey);
    const prefixedDestKey = this._prefixKey(destKey);
    return copyFile(this.staticPath, prefixedSourceKey, prefixedDestKey);
  }

  /**
   * Check if a file exists in storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<boolean>} True if exists, false otherwise.
   */
  async exists(key) {
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
  async listObjects(prefix = '', limit = 1000) {
    const prefixedPrefix = this._prefixKey(prefix);
    return listObjects(this.staticPath, prefixedPrefix, limit);
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
   * @param {Array} operations Array of {source, dest} objects.
   * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
   */
  async batchCopy(operations) {
    return batchCopy(this.staticPath, operations);
  }

  /**
   * Batch delete multiple objects from storage.
   *
   * @param {Array} keys Array of object keys to delete.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async batchDelete(keys) {
    return batchDelete(this.staticPath, keys, {
      jobId: this.jobId
    });
  }

  /**
   * Download manifest file from storage.
   *
   * @return {Promise<Blob|null>} Manifest blob or null if not found.
   */
  async downloadManifest() {
    // Use provider-specific manifest filename to ensure isolation between providers
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
    const prefixedManifestKey = this._prefixKey(manifestKey);
    try {
      const blob = await downloadFile(this.staticPath, prefixedManifestKey, {
        jobId: this.jobId
      });
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

  /**
   * Test connection to storage service.
   *
   * @return {Promise<Object>} Result array with 'success' and optional 'message', 'error'.
   */
  async testConnection() {
    // For local filesystem, always return success
    return {
      success: true,
      message: 'Local filesystem storage is ready.'
    };
  }
}

/***/ }),

/***/ 186:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Ay: () => (/* binding */ api)
});

// UNUSED EXPORTS: configureAPI, createAuthHeaders, invalidateCache, setAPINonce

// EXTERNAL MODULE: external ["wp","apiFetch"]
var external_wp_apiFetch_ = __webpack_require__(455);
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_);
;// ./assets/src/utils/getRestUrl.js
/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from window.aetherData or returns a default.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
 * @package
 */

/**
 * Get REST API URL from window.aetherData or default.
 *
 * @return {string} REST API base URL.
 */
function getRestUrl() {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.restUrl) {
    return window.aetherData.restUrl;
  }
  return '/wp-json/aether/site-exporter/';
}
;// ./assets/src/utils/api.js
/**
 * API Fetch Utility
 *
 * Enhanced wrapper around @wordpress/api-fetch with:
 * - Request deduplication (prevents concurrent identical requests)
 * - Response caching with TTL (GET requests only)
 * - Nonce handling from window.aetherData
 * - Auth header utilities for external APIs
 *
 * @package
 */




/**
 * Create authorization headers for external API calls.
 *
 * Utility for building consistent Authorization headers.
 *
 * @param {string} token API token or key.
 * @param {string} type  Auth type (default: 'Bearer').
 * @return {Object} Headers object with Authorization and Content-Type.
 */
function createAuthHeaders(token, type = 'Bearer') {
  return {
    Authorization: `${type} ${token}`,
    'Content-Type': 'application/json'
  };
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
 * Request deduplication middleware
 *
 * Prevents concurrent identical requests by returning the same Promise
 * for duplicate in-flight requests.
 *
 * Uses request key (method + path + data) to identify duplicates.
 */
const pendingRequests = new Map();
function createRequestKey(options) {
  const method = options.method || 'GET';
  const path = options.path || '';
  const data = options.data ? JSON.stringify(options.data) : '';
  return `${method}:${path}:${data}`;
}
const requestDeduplicationMiddleware = (options, next) => {
  const requestKey = createRequestKey(options);

  // Check if this request is already in flight
  if (pendingRequests.has(requestKey)) {
    // Return the existing Promise
    return pendingRequests.get(requestKey);
  }

  // Make the request
  const promise = next(options);

  // Store the Promise
  pendingRequests.set(requestKey, promise);

  // Clean up when request completes (success or error)
  // Use finally() to guarantee cleanup regardless of outcome
  promise.finally(() => {
    pendingRequests.delete(requestKey);
  });
  return promise;
};

/**
 * Response caching middleware
 *
 * Caches GET request responses with TTL to reduce redundant API calls.
 *
 * Cache format: Map<requestKey, {response, timestamp}>
 * TTL: Configurable per endpoint (default: 5 minutes)
 */
const responseCache = new Map();

// Cache configuration with endpoint-specific TTLs
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000,
  // 5 minutes default
  endpointTTLs: {
    '/assets': 10 * 60 * 1000,
    // 10 minutes - asset lists change infrequently
    '/settings': 1 * 60 * 1000 // 1 minute - settings may change
  },
  // Set to true to bypass cache (useful for development/testing)
  bypassCache: false
};

/**
 * Get cache TTL for a specific request path.
 *
 * @param {string} path Request path to check.
 * @return {number} TTL in milliseconds.
 */
function getCacheTTL(path) {
  if (CACHE_CONFIG.bypassCache) {
    return 0;
  }

  // Check if path matches any endpoint-specific TTL
  for (const [endpoint, ttl] of Object.entries(CACHE_CONFIG.endpointTTLs)) {
    if (path && path.includes(endpoint)) {
      return ttl;
    }
  }
  return CACHE_CONFIG.defaultTTL;
}
function isCacheValid(cacheEntry, path) {
  if (!cacheEntry) {
    return false;
  }
  const ttl = getCacheTTL(path);
  if (ttl === 0) {
    // Cache bypass enabled
    return false;
  }
  const age = Date.now() - cacheEntry.timestamp;
  return age < ttl;
}
const responseCachingMiddleware = (options, next) => {
  const method = options.method || 'GET';

  // Only cache GET requests
  if (method !== 'GET') {
    return next(options);
  }
  const requestKey = createRequestKey(options);
  const cached = responseCache.get(requestKey);

  // Return cached response if valid (pass path for TTL calculation)
  if (isCacheValid(cached, options.path)) {
    return Promise.resolve(cached.response);
  }

  // Make the request
  const promise = next(options);

  // Cache successful responses
  promise.then(response => {
    responseCache.set(requestKey, {
      response,
      timestamp: Date.now()
    });
    return response;
  }).catch(error => {
    // Don't cache errors
    throw error;
  });
  return promise;
};

/**
 * Invalidate cache for a specific path or all cached responses
 *
 * @param {string|null} path Optional path to invalidate (invalidates all if not provided)
 */
function invalidateCache(path = null) {
  if (path) {
    // Invalidate all cache entries matching this path
    for (const [key] of responseCache.entries()) {
      if (key.includes(path)) {
        responseCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    responseCache.clear();
  }
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
function setAPINonce(nonce) {
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL, nonce, and middleware.
 * Automatically fetches from window.aetherData if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from window.aetherData if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from window.aetherData if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || getRestUrl();
  const token = nonce || getNonce();
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }

  // Add custom middleware (order matters: caching before deduplication)
  external_wp_apiFetch_default().use(responseCachingMiddleware);
  external_wp_apiFetch_default().use(requestDeduplicationMiddleware);
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const api = ((external_wp_apiFetch_default()));

/***/ }),

/***/ 264:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getProviderForDeploymentType: () => (/* binding */ getProviderForDeploymentType)
/* harmony export */ });
/* unused harmony export getDefaultProvider */
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _registry_ProviderRegistry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(825);
/**
 * Provider Discovery Utilities
 *
 * Helper functions for discovering and working with providers.
 * Now uses JavaScript ProviderRegistry instead of REST API.
 *
 * @package
 */




/**
 * Get default provider ID.
 *
 * Uses filter to allow customization, then queries JavaScript registry.
 *
 * @return {string|null} Default provider ID or null if none available
 */
function getDefaultProvider() {
  // Try filter first (allows customization).
  const filtered = applyFilters('aether.provider.getDefault', null);
  if (filtered) {
    return filtered;
  }

  // Get from JavaScript registry.
  const defaultProvider = ProviderRegistry.getDefault();
  return defaultProvider ? defaultProvider.getId() : null;
}

/**
 * Get provider ID for a specific deployment type.
 *
 * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
 * @return {string|null} Provider ID or null if none found
 */
function getProviderForDeploymentType(deploymentType) {
  // Try filter first (allows customization).
  const filtered = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.provider.getForDeploymentType', null, deploymentType);
  if (filtered) {
    return filtered;
  }

  // Get from JavaScript registry.
  const provider = _registry_ProviderRegistry__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A.getForDeploymentType(deploymentType);
  return provider ? provider.getId() : null;
}

/***/ }),

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 595:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ER: () => (/* binding */ collectSiteUrlMatches),
/* harmony export */   Gd: () => (/* binding */ rewriteAbsolutePaths),
/* harmony export */   R7: () => (/* binding */ restoreScriptContent),
/* harmony export */   RK: () => (/* binding */ rewriteImportMaps),
/* harmony export */   j: () => (/* binding */ rewriteSrcsetUrls),
/* harmony export */   wh: () => (/* binding */ protectScriptContent),
/* harmony export */   yD: () => (/* binding */ replaceSiteUrlMatches)
/* harmony export */ });
/* harmony import */ var _urlUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(873);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(735);
/**
 * HTML Rewriting Utilities
 *
 * Helper functions for HTML URL rewriting.
 *
 * @package
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
  const escapedHost = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_0__/* .escapeRegex */ .$f)(siteHost);
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
  (0,_utils_debug__WEBPACK_IMPORTED_MODULE_1__/* .debug */ .Yz)('[URL Rewriter] Rewriting absolute paths with base:', basePath);
  let replaceCount = 0;
  const result = html.replace(/(\b(?:href|src|action|data|poster|content)=)(["'`])(\/(?!\/)[^"'`]*)\2/gi, (match, attrPart, quote, path) => {
    replaceCount++;

    // Skip if already includes the base path
    if (path.startsWith(basePath + '/')) {
      return match;
    }

    // Skip anchors and special paths
    if (path === '/' || path.startsWith('/#') || path.startsWith('/data:')) {
      return match;
    }
    const rewrittenPath = basePath + path;
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_1__/* .debug */ .Yz)(`[URL Rewriter] Rewriting: ${path} -> ${rewrittenPath}`);
    return attrPart + quote + rewrittenPath + quote;
  });
  (0,_utils_debug__WEBPACK_IMPORTED_MODULE_1__/* .debug */ .Yz)(`[URL Rewriter] Processed ${replaceCount} absolute path attributes`);
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

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ }),

/***/ 735:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AO: () => (/* binding */ debugError),
/* harmony export */   UT: () => (/* binding */ debugWarn),
/* harmony export */   Yz: () => (/* binding */ debug)
/* harmony export */ });
/* unused harmony exports debugInfo, debugTable, debugTime, debugTimeEnd, debugGroup, debugGroupEnd, enableDebug, disableDebug */
/**
 * Debug Utility
 *
 * Centralized logging utility for development debugging.
 * Can be enabled/disabled via window.aetherDebug flag.
 *
 * @package
 */

/**
 * Check if debug mode is enabled.
 *
 * @return {boolean} True if debug mode is enabled.
 */
function isDebugEnabled() {
  return typeof window !== 'undefined' && window.aetherDebug === true;
}

/**
 * Log a message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debug(...args) {
  if (isDebugEnabled() && window.console && window.console.log) {
    window.console.log('[Aether]', ...args);
  }
}

/**
 * Log an error to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugError(...args) {
  if (isDebugEnabled() && window.console && window.console.error) {
    window.console.error('[Aether Error]', ...args);
  }
}

/**
 * Log a warning to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugWarn(...args) {
  if (isDebugEnabled() && window.console && window.console.warn) {
    window.console.warn('[Aether Warning]', ...args);
  }
}

/**
 * Log an info message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugInfo(...args) {
  if (isDebugEnabled() && window.console && window.console.info) {
    window.console.info('[Aether Info]', ...args);
  }
}

/**
 * Log a table to console (only in debug mode).
 *
 * @param {*} data Data to display as table.
 */
function debugTable(data) {
  if (isDebugEnabled() && window.console && window.console.table) {
    window.console.table(data);
  }
}

/**
 * Start a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
function debugTime(label) {
  if (isDebugEnabled() && window.console && window.console.time) {
    window.console.time(`[Aether] ${label}`);
  }
}

/**
 * End a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
function debugTimeEnd(label) {
  if (isDebugEnabled() && window.console && window.console.timeEnd) {
    window.console.timeEnd(`[Aether] ${label}`);
  }
}

/**
 * Group console messages (only in debug mode).
 *
 * @param {string} label Group label.
 */
function debugGroup(label) {
  if (isDebugEnabled() && window.console && window.console.group) {
    window.console.group(`[Aether] ${label}`);
  }
}

/**
 * End console message group (only in debug mode).
 */
function debugGroupEnd() {
  if (isDebugEnabled() && window.console && window.console.groupEnd) {
    window.console.groupEnd();
  }
}

/**
 * Enable debug mode.
 *
 * Usage: aetherDebug.enable() in browser console.
 */
function enableDebug() {
  if (typeof window !== 'undefined') {
    window.aetherDebug = true;
    debug('Debug mode enabled');
  }
}

/**
 * Disable debug mode.
 *
 * Usage: aetherDebug.disable() in browser console.
 */
function disableDebug() {
  if (typeof window !== 'undefined') {
    window.aetherDebug = false;
  }
}

// Export as single object for easier importing
const debugUtil = {
  debug,
  error: debugError,
  warn: debugWarn,
  info: debugInfo,
  table: debugTable,
  time: debugTime,
  timeEnd: debugTimeEnd,
  group: debugGroup,
  groupEnd: debugGroupEnd,
  enable: enableDebug,
  disable: disableDebug,
  isEnabled: isDebugEnabled
};

// Make available globally for easy browser console access
if (typeof window !== 'undefined') {
  window.aetherDebug = window.aetherDebug || false;
  window.aetherDebugUtil = debugUtil;
}
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (debugUtil)));

/***/ }),

/***/ 825:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * aether.providers.register hooks. This replaces the PHP ProviderRegistry.
 *
 * @package
 */



/**
 * Internal registry storage.
 *
 * @type {Map<string, Object>}
 */
const providers = new Map();

/**
 * Provider Registry
 *
 * Singleton registry for managing all JavaScript provider instances.
 */
class ProviderRegistry {
  /**
   * Register a provider instance.
   *
   * @param {string} providerId Provider ID
   * @param {Object} provider   Provider instance (must have getId, getName, etc.)
   * @return {void}
   */
  register(providerId, provider) {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ProviderRegistry.register() requires a valid provider ID string');
    }
    if (!provider || typeof provider !== 'object') {
      throw new Error('ProviderRegistry.register() requires a provider instance');
    }

    // Validate provider has required methods
    if (typeof provider.getId !== 'function') {
      throw new Error(`Provider ${providerId} must implement getId() method`);
    }
    if (typeof provider.getName !== 'function') {
      throw new Error(`Provider ${providerId} must implement getName() method`);
    }
    providers.set(providerId, provider);

    /**
     * Action fired after a provider is registered.
     *
     * @param {string} providerId Provider ID
     * @param {Object} provider   Provider instance
     */
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.doAction)('aether.providers.registered', providerId, provider);
  }

  /**
   * Get a provider by ID.
   *
   * @param {string} providerId Provider ID
   * @return {Object|null} Provider instance or null if not found
   */
  get(providerId) {
    return providers.get(providerId) || null;
  }

  /**
   * Get all registered providers.
   *
   * @return {Array<Object>} Array of provider instances
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
   * @return {Array<Object>} Array of providers that support the deployment type
   */
  getByDeploymentType(deploymentType) {
    return this.getAll().filter(provider => {
      const supportedTypes = provider.getSupportedDeploymentTypes?.() || [];
      return supportedTypes.includes(deploymentType);
    });
  }

  /**
   * Get default provider.
   *
   * Returns the first provider that supports static_site deployment,
   * or the first registered provider if none found.
   *
   * @return {Object|null} Default provider or null if none registered
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
   * @return {Object|null} Provider instance or null if not found
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
   * Extracts the provider type from the instance ID and returns the corresponding provider.
   *
   * @param {string} instanceId Instance ID (format: {provider_type}:{uuid})
   * @return {Object|null} Provider instance or null if not found
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
 * When providers call doAction('aether.providers.register', provider),
 * this will automatically register them.
 */
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addAction)('aether.providers.register', 'aether/provider-registry', provider => {
  if (!provider || typeof provider !== 'object') {
    return;
  }

  // Get provider ID
  let providerId;
  if (typeof provider.getId === 'function') {
    providerId = provider.getId();
  } else if (provider.id) {
    providerId = provider.id;
  } else {
    return; // Invalid provider
  }

  // Register the provider
  registry.register(providerId, provider);
});

// Make registry globally available so all bundles share the same instance
// This is necessary because webpack creates separate module instances for each bundle
let exportedRegistry = registry;
if (typeof window !== 'undefined') {
  window.aether = window.aether || {};
  // Only create global registry if it doesn't exist (first bundle to load)
  if (!window.aether.ProviderRegistry) {
    window.aether.ProviderRegistry = registry;
    // eslint-disable-next-line no-console
    console.log('ProviderRegistry: Created global registry instance');
  } else {
    // If registry already exists, use the global one and sync providers
    const globalRegistry = window.aether.ProviderRegistry;
    // Copy any providers from this instance to the global one
    const localProviders = Array.from(providers.values());
    localProviders.forEach(provider => {
      const providerId = provider.getId();
      if (!globalRegistry.get(providerId)) {
        globalRegistry.register(providerId, provider);
      }
    });
    // Use the global registry instead
    exportedRegistry = globalRegistry;
    // eslint-disable-next-line no-console
    console.log('ProviderRegistry: Using global registry instance,', globalRegistry.getAll().length, 'providers registered');
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (exportedRegistry);

/***/ }),

/***/ 864:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   W: () => (/* binding */ getStaticFilePath),
/* harmony export */   t: () => (/* binding */ processHtml)
/* harmony export */ });
/* harmony import */ var _urlRewriter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(932);
/**
 * HTML Processor
 *
 * Processes HTML for static site generation.
 * Ported from PHP HTMLGeneratorService::processHtml() logic.
 *
 * @package
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

/***/ 873:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $f: () => (/* binding */ escapeRegex),
/* harmony export */   Gw: () => (/* binding */ stripPlaygroundScope),
/* harmony export */   Nh: () => (/* binding */ resolveRelative),
/* harmony export */   S8: () => (/* binding */ normalize),
/* harmony export */   VG: () => (/* binding */ forceHttps),
/* harmony export */   ge: () => (/* binding */ isExternal),
/* harmony export */   ox: () => (/* binding */ extractHost),
/* harmony export */   sg: () => (/* binding */ shouldSkipUrl)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/**
 * URL Utilities
 *
 * Pure functions for URL parsing, resolution, and normalization.
 *
 * @package
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
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.url.resolve', resolvedUrl, url, baseUrl);
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
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.url.is_external', isExternalUrl, url, siteUrl);
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
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.url.normalize', url, siteUrl);
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

/***/ }),

/***/ 932:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Gw: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.Gw),
/* harmony export */   Nh: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.Nh),
/* harmony export */   ge: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.ge),
/* harmony export */   sF: () => (/* binding */ createUrlRewriter)
/* harmony export */ });
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(735);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _urlUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(873);
/* harmony import */ var _htmlRewriting__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(595);
/**
 * URL Rewriter
 *
 * Rewrites WordPress URLs to static URLs for the static site.
 *
 * @package
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
  const normalizedSiteUrl = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .forceHttps */ .VG)(siteUrl);

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
      return (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .stripPlaygroundScope */ .Gw)(url);
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
    path = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .stripPlaygroundScope */ .Gw)(path);
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
    return (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .normalize */ .S8)(url, siteUrl);
  }

  /**
   * Check if URL is external.
   *
   * @param {string} url URL to check.
   * @return {boolean} True if external.
   */
  function isExternalUrl(url) {
    return (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .isExternal */ .ge)(url, siteUrl);
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
    if ((0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .shouldSkipUrl */ .sg)(url)) {
      return url;
    }

    // Resolve relative URLs against context.
    let absoluteUrl = url;
    if (contextUrl && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      absoluteUrl = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .resolveRelative */ .Nh)(url, contextUrl);
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
    return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.url.rewrite', rewrittenUrl, url, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }

  /**
   * Rewrite all URLs in HTML content.
   *
   * @param {string} html       HTML content.
   * @param {string} contextUrl Current page URL for relative URL resolution.
   * @return {string} HTML with rewritten URLs.
   */
  function rewriteHtml(html, contextUrl) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__/* .debug */ .Yz)('[URL Rewriter] rewriteHtml called with:');
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__/* .debug */ .Yz)('  - contextUrl:', contextUrl);
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__/* .debug */ .Yz)('  - siteUrl:', siteUrl);
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__/* .debug */ .Yz)('  - normalizedStaticUrl:', normalizedStaticUrl);
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__/* .debug */ .Yz)('  - HTML length:', html.length);

    // Protect inline script content
    const {
      html: protectedHtml,
      placeholders
    } = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__/* .protectScriptContent */ .wh)(html);
    let result = protectedHtml;

    // Extract site host and rewrite URLs
    const siteHost = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__/* .extractHost */ .ox)(siteUrl);
    if (siteHost) {
      const matches = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__/* .collectSiteUrlMatches */ .ER)(result, siteHost);
      result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__/* .replaceSiteUrlMatches */ .yD)(result, matches, rewriteUrl, contextUrl);
    }

    // Rewrite absolute paths if static URL has subdirectories
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__/* .rewriteAbsolutePaths */ .Gd)(result, basePath);
      } catch (error) {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__/* .debugError */ .AO)('[URL Rewriter] Error in absolute path rewriting:', error);
      }
    }

    // Rewrite srcset and import map URLs
    result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__/* .rewriteSrcsetUrls */ .j)(result, rewriteUrl, contextUrl);
    result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__/* .rewriteImportMaps */ .RK)(result, rewriteUrl, contextUrl);

    // Restore inline script content
    result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__/* .restoreScriptContent */ .R7)(result, placeholders);
    return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.url.rewrite_html', result, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
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
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/contexts/ExportContext.js
/**
 * Publish Context
 *
 * Centralized publish workflow state management using React Context API.
 * Provides global publish state with step tracking, progress management, and status updates.
 *
 * @package
 */



/**
 * Publish Context
 *
 * @type {Object}
 */

const ExportContext = (0,external_wp_element_namespaceObject.createContext)({
  steps: [],
  isPublishing: false,
  jobId: null,
  finalStatus: null,
  error: null,
  currentStatusMessage: null,
  overallProgress: 0,
  staticSiteProviders: [],
  blueprintBundleProviders: [],
  initializeSteps: () => {},
  setStepStatus: () => {},
  setStepProgress: () => {},
  updateFromStep: () => {},
  markAllComplete: () => {},
  showError: () => {},
  setIsPublishing: () => {},
  setJobId: () => {},
  setStatusMessage: () => {},
  setOverallProgressValue: () => {},
  updateMessage: () => {},
  removeMessage: () => {},
  setProviders: () => {},
  reset: () => {}
});

/**
 * Publish Provider Component
 *
 * Wraps the publish workflow to provide global state management.
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
function PublishProvider({
  children
}) {
  // Core state
  const [steps, setSteps] = (0,external_wp_element_namespaceObject.useState)([]);
  const [isPublishing, setIsPublishing] = (0,external_wp_element_namespaceObject.useState)(false);
  const [jobId, setJobId] = (0,external_wp_element_namespaceObject.useState)(null);
  const [finalStatus, setFinalStatus] = (0,external_wp_element_namespaceObject.useState)(null);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const [currentStatusMessage, setCurrentStatusMessage] = (0,external_wp_element_namespaceObject.useState)(null);
  const [overallProgress, setOverallProgress] = (0,external_wp_element_namespaceObject.useState)(0);
  const [messageHistory, setMessageHistory] = (0,external_wp_element_namespaceObject.useState)([]);
  const [staticSiteProviders, setStaticSiteProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [blueprintBundleProviders, setBlueprintBundleProviders] = (0,external_wp_element_namespaceObject.useState)([]);

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
      progress: 0
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
   * Set progress percentage for a specific step
   *
   * @param {string} stepId   Step ID
   * @param {number} progress Progress percentage (0-100)
   */
  const setStepProgress = (0,external_wp_element_namespaceObject.useCallback)((stepId, progress) => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          progress: Math.max(0, Math.min(100, Math.round(progress)))
        };
      }
      return step;
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
   * Called when publish workflow completes successfully.
   *
   * @param {Object} status Final status object (includes deployment URL, etc.)
   */
  const markAllComplete = (0,external_wp_element_namespaceObject.useCallback)((status = {}) => {
    setSteps(prevSteps => prevSteps.map(step => ({
      ...step,
      status: 'complete'
    })));
    setFinalStatus(status);
    setIsPublishing(false);
    addMessage('Site published successfully!', 'success');
  }, [addMessage]);

  /**
   * Show error message and optionally mark step as failed
   *
   * @param {string}      errorMessage Error message to display
   * @param {string|null} stepId       Step ID to mark as failed (optional)
   */
  const showError = (0,external_wp_element_namespaceObject.useCallback)((errorMessage, stepId = null) => {
    setError(errorMessage);
    setIsPublishing(false);
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
   * Reset all publish state to initial values
   *
   * Called when starting a new publish or closing the publish modal.
   *
   * @param {boolean} keepSteps If true, don't clear steps (useful when immediately reinitializing)
   */
  const reset = (0,external_wp_element_namespaceObject.useCallback)((keepSteps = false) => {
    if (!keepSteps) {
      setSteps([]);
    }
    setIsPublishing(false);
    setJobId(null);
    setFinalStatus(null);
    setError(null);
    setCurrentStatusMessage(null);
    setOverallProgress(0);
    setMessageHistory([]);
    setStaticSiteProviders([]);
    setBlueprintBundleProviders([]);
    maxProgressRef.current = 0;
  }, []);

  // Provide context value
  const value = (0,external_wp_element_namespaceObject.useMemo)(() => ({
    steps,
    isPublishing,
    jobId,
    finalStatus,
    error,
    currentStatusMessage,
    overallProgress,
    messageHistory,
    staticSiteProviders,
    blueprintBundleProviders,
    initializeSteps,
    setStepStatus,
    setStepProgress,
    updateFromStep,
    markAllComplete,
    showError,
    setIsPublishing,
    setJobId,
    setStatusMessage,
    setOverallProgressValue,
    addMessage,
    updateMessage,
    removeMessage,
    setProviders,
    reset
  }), [steps, isPublishing, jobId, finalStatus, error, currentStatusMessage, overallProgress, messageHistory, staticSiteProviders, blueprintBundleProviders, initializeSteps, setStepStatus, setStepProgress, updateFromStep, markAllComplete, showError, setStatusMessage, setOverallProgressValue, addMessage, updateMessage, removeMessage, setProviders, reset]);
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
 * Provides access to global publish workflow state and operations.
 *
 * @package
 */




/**
 * Hook to access publish context
 *
 * Must be used within a PublishProvider.
 *
 * @throws {Error} If used outside PublishProvider
 * @return {Object} Publish context value
 * @property {Array}    steps                   - All workflow steps
 * @property {boolean}  isPublishing            - Publishing flag
 * @property {string}   jobId                   - Current job ID
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
 * @property {Function} setIsPublishing         - Set publishing flag
 * @property {Function} setJobId                - Set job ID
 * @property {Function} setStatusMessage        - Set status message
 * @property {Function} setOverallProgressValue - Set overall progress
 * @property {Function} addMessage              - Add a message to history
 * @property {Function} updateMessage           - Update existing message by key
 * @property {Function} removeMessage           - Remove message by key
 * @property {Function} reset                   - Reset all state
 *
 * @example
 * function ExportButton() {
 *     const { isPublishing, startExport } = useExportContext();
 *
 *     return (
 *         <button onClick={startExport} disabled={isPublishing}>
 *             {isPublishing ? 'Publishing...' : 'Export'}
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
    throw new Error('useExportContext must be used within a PublishProvider');
  }
  return context;
}
/* harmony default export */ const hooks_useExportContext = ((/* unused pure expression or super */ null && (useExportContext)));
;// ./assets/src/export/hooks/useExportState.js
/**
 * Publish State Hook
 *
 * Wrapper hook that provides publish state from ExportContext.
 * Delegates to centralized state management.
 *
 * @package
 */



/**
 * Get publish workflow state
 *
 * Returns all publish state and operations from context.
 * Simplified from 202 lines to delegate to ExportContext.
 *
 * @return {Object} Publish state and operations
 */
function useExportState() {
  return useExportContext();
}
// EXTERNAL MODULE: ./assets/src/utils/api.js + 1 modules
var utils_api = __webpack_require__(186);
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
// EXTERNAL MODULE: ./assets/src/utils/debug.js
var admin_settings_debug = __webpack_require__(735);
;// ./assets/src/utils/wporgCache.js
/**
 * WordPress.org API Cache - Persistent cache for WordPress.org existence checks
 *
 * Caches WordPress.org plugin/theme existence checks in IndexedDB with 7-day expiration.
 * Provides 3-15 second performance improvement per publish by eliminating redundant API calls.
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
        if (deleted > 0) {
          (0,admin_settings_debug/* debug */.Yz)(`[WpOrgCache] Cleaned up ${deleted} expired cache entries`);
        }
        return deleted;
      } catch (error) {
        (0,admin_settings_debug/* debugError */.AO)('[WpOrgCache] Error during cleanup:', error);
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

  /**
   * Get all cached entries for debugging
   *
   * @return {Promise<Array>} Array of all cached entries
   */
  async getAllEntries() {
    try {
      return await this.store.getAll();
    } catch (error) {
      console.error('[WpOrgCache] Error getting all entries:', error);
      return [];
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
 * @package
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
   * Get plugin configuration from REST API.
   *
   * @return {Promise<Object>} Configuration object.
   */
  async getConfig() {
    try {
      const response = await this.apiFetch({
        path: '/aether/site-exporter/config',
        method: 'GET'
      });
      return response || {};
    } catch (error) {
      return {};
    }
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
 * @package
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
    (0,admin_settings_debug/* debugWarn */.UT)(`CORS proxy WordPress.org check returned null for ${type} "${slug}", trying direct API fallback`);
    result = await checkWithMethod(normalizedSlug, type, 'direct', config);
  }

  // If still null after fallback, treat as false
  if (result === null) {
    (0,admin_settings_debug/* debugWarn */.UT)(`All WordPress.org check methods failed for ${type} "${slug}", treating as custom asset`);
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
    (0,admin_settings_debug/* debugWarn */.UT)(`Failed to check WordPress.org for ${type} "${slug}" using ${method} method:`, error);
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
 * @package
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
;// ./assets/src/services/ExportAPIService.js
/**
 * Publish API Service
 *
 * Service for publish-related API operations.
 * Extracted from useExportAPI hook for testability.
 *
 * @package
 */

const CHANGED_ASSETS_KEY = 'aether_changed_assets';

/**
 * Publish API Service Class
 *
 * Handles publish-related API calls and asset tracking.
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
        path: '/aether/site-exporter/publish/createArchive',
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
        path: '/aether/site-exporter/publish/generateBlueprintBundle',
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
 * Handles API calls for publish operations.
 * Uses ExportAPIService for all business logic.
 *
 * @package
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
 * @package
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
 * @package
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
 * @package
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
 * @package
 */



/**
 * Fetch existing manifest from remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @return {Promise<Object>} Manifest object (empty object if not found).
 */
async function fetchManifest(storageService) {
  const manifestKey = 'file-manifest.json';
  try {
    (0,admin_settings_debug/* debug */.Yz)('Fetching manifest from remote:', manifestKey);

    // Try to download manifest from storage.
    const manifestBlob = await storageService.downloadManifest();
    if (!manifestBlob) {
      (0,admin_settings_debug/* debug */.Yz)('Manifest not found, starting with empty manifest');
      return {};
    }

    // Parse JSON from blob.
    const manifestText = await manifestBlob.text();
    const manifest = JSON.parse(manifestText);
    (0,admin_settings_debug/* debug */.Yz)('Manifest fetched successfully:', {
      fileCount: Object.keys(manifest).length
    });
    return manifest || {};
  } catch (error) {
    // If manifest doesn't exist (404) or other error, start with empty manifest.
    if (error.message && error.message.includes('404')) {
      (0,admin_settings_debug/* debug */.Yz)('Manifest not found (404), starting with empty manifest');
      return {};
    }
    (0,admin_settings_debug/* debugWarn */.UT)('Failed to fetch manifest, starting with empty manifest:', error);
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
  (0,admin_settings_debug/* debug */.Yz)('Updated manifest entry:', {
    storageKey,
    size,
    hashLength: hash.length,
    contentType: contentType || 'not specified'
  });
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
    (0,admin_settings_debug/* debug */.Yz)('File size differs, will upload:', {
      storageKey,
      existingSize: entry.size,
      newSize: size
    });
    return false;
  }

  // Stage 2: Check hash if size matches.
  if (entry.hash !== hash) {
    (0,admin_settings_debug/* debug */.Yz)('File size matches but hash differs, will upload:', {
      storageKey,
      size
    });
    return false;
  }

  // Both size and hash match - skip upload.
  (0,admin_settings_debug/* debug */.Yz)('File unchanged, skipping upload:', {
    storageKey,
    size,
    hash: hash.substring(0, 16) + '...'
  });
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
  let removedCount = 0;

  // Keep only entries for files that exist in current upload
  // Also preserve wp-content.zip entries (uploaded in parallel step)
  for (const storageKey of Object.keys(manifest)) {
    if (currentFiles.has(storageKey) || storageKey.includes('/wp-content.zip')) {
      cleanedManifest[storageKey] = manifest[storageKey];
    } else {
      removedCount++;
    }
  }
  if (removedCount > 0) {
    (0,admin_settings_debug/* debug */.Yz)('Manifest cleanup:', {
      before: Object.keys(manifest).length,
      after: Object.keys(cleanedManifest).length,
      removed: removedCount
    });
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
  const manifestKey = 'file-manifest.json';
  try {
    (0,admin_settings_debug/* debug */.Yz)('Uploading manifest:', {
      manifestKey,
      fileCount: Object.keys(manifest).length
    });

    // Convert manifest to JSON blob (minified for smaller file size).
    const manifestJson = JSON.stringify(manifest);
    const manifestBlob = new Blob([manifestJson], {
      type: 'application/json'
    });

    // Upload manifest via storage service.
    const result = await storageService.uploadManifest(manifestBlob);
    if (result.success) {
      (0,admin_settings_debug/* debug */.Yz)('Manifest uploaded successfully');
      return true;
    }
    (0,admin_settings_debug/* debugWarn */.UT)('Manifest upload failed:', result.error);
    return false;
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('Failed to upload manifest:', error);
    return false;
  }
}
;// ./assets/src/export/utils/staticSiteConfig.js
/**
 * Static Site Configuration Utilities
 *
 * Pure functions for building static site generator configuration.
 *
 * @package
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
    // Dynamic import to avoid circular dependencies
    const providerDiscovery = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 264));
    const discoveredProviderId = await providerDiscovery.getProviderForDeploymentType('static_site');
    const providerIdToUse = staticSiteProviderId || discoveredProviderId;
    if (providerIdToUse) {
      const configResponse = await (0,utils_api/* default */.Ay)({
        path: `/aether/site-exporter/providers/${providerIdToUse}`
      });
      if (configResponse.success && configResponse.config) {
        providerConfig = configResponse.config;
      }
    }
  } catch (error) {
    (0,admin_settings_debug/* debug */.Yz)('Failed to load provider configuration:', error);
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
    } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 159));
    storageService = new StorageService(staticPath, '', filteredConfig);
  }
  return storageService;
}
// EXTERNAL MODULE: ./assets/src/export/utils/urlRewriter.js
var urlRewriter = __webpack_require__(932);
;// ./assets/src/export/utils/assetExclusions.js
/**
 * Asset Exclusions Configuration
 *
 * Centralized configuration for assets and URL patterns that should be excluded
 * from static site generation.
 *
 * @package
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
 * @package
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
 * @package
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
 * @package
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
;// ./assets/src/utils/staticSiteCache.js
/**
 * Static Site Cache - IndexedDB-based cache for static site generation
 *
 * Provides persistent browser storage for raw HTML and discovered assets
 * during static site generation. Eliminates memory limits by storing data in
 * IndexedDB instead of RAM.
 *
 * Features:
 * - Unlimited URL caching (limited only by browser storage quota)
 * - Persistent across browser sessions
 * - Automatic cleanup of old caches
 * - Works in WordPress Playground WASM environment
 */



/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  dbName: 'aether-static-site-cache',
  version: 1,
  stores: {
    urlCache: {
      keyPath: 'url',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'sessionId',
        keyPath: 'sessionId',
        unique: false
      }]
    }
  }
};

/**
 * Maximum age for cached items (24 hours)
 * After this time, cached items are considered stale
 */
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Static Site Cache Manager
 *
 * Manages caching of raw HTML and assets during static site generation.
 */
class StaticSiteCache {
  /**
   * Constructor
   *
   * @param {string} sessionId - Unique session identifier for this generation run
   */
  constructor(sessionId = null) {
    this.sessionId = sessionId || this.generateSessionId();
    this.store = new utils_indexedDB('urlCache', CACHE_CONFIG);
    this.isAvailable = isIndexedDBAvailable();

    // Fallback to in-memory cache if IndexedDB unavailable
    this.memoryCache = new Map();
  }

  /**
   * Generate unique session ID
   *
   * @return {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Check if cache is available
   *
   * @return {boolean} True if IndexedDB is available
   */
  isReady() {
    return this.isAvailable;
  }

  /**
   * Get cached data for a URL
   *
   * @param {string} url - The URL to retrieve from cache
   * @return {Promise<Object|null>} Cached data or null if not found
   */
  async get(url) {
    if (!this.isAvailable) {
      const cached = this.memoryCache.get(url);
      if (!cached) {
        return null;
      }
      // Support legacy processedHtml for backward compatibility
      return {
        rawHtml: cached.rawHtml || cached.processedHtml,
        assetUrls: cached.assetUrls,
        url: cached.url,
        timestamp: cached.timestamp
      };
    }
    try {
      const cached = await this.store.get(url);

      // Check if cache is stale
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age > MAX_CACHE_AGE_MS) {
          // Cache is stale, delete it
          await this.delete(url);
          return null;
        }
      }
      return cached ? {
        rawHtml: cached.rawHtml || cached.processedHtml,
        // Support legacy processedHtml for backward compatibility
        assetUrls: cached.assetUrls,
        url: cached.url,
        timestamp: cached.timestamp
      } : null;
    } catch (error) {
      console.error(`[StaticSiteCache] Error getting URL "${url}":`, error);
      return null;
    }
  }

  /**
   * Cache raw HTML and assets for a URL
   *
   * @param {string}        url       - The URL being cached
   * @param {string}        rawHtml   - The raw HTML content (before processing)
   * @param {Array<string>} assetUrls - Array of discovered asset URLs
   * @return {Promise<boolean>} True if successful
   */
  async set(url, rawHtml, assetUrls) {
    if (!this.isAvailable) {
      this.memoryCache.set(url, {
        rawHtml,
        assetUrls,
        url,
        timestamp: Date.now()
      });
      return true;
    }
    try {
      return await this.store.set(url, {
        rawHtml,
        assetUrls
      }, {
        sessionId: this.sessionId
      });
    } catch (error) {
      console.error(`[StaticSiteCache] Error caching URL "${url}":`, error);
      return false;
    }
  }

  /**
   * Delete cached data for a URL
   *
   * @param {string} url - The URL to delete from cache
   * @return {Promise<boolean>} True if successful
   */
  async delete(url) {
    if (!this.isAvailable) {
      return this.memoryCache.delete(url);
    }
    try {
      return await this.store.delete(url);
    } catch (error) {
      console.error(`[StaticSiteCache] Error deleting URL "${url}":`, error);
      return false;
    }
  }

  /**
   * Check if a URL is cached
   *
   * @param {string} url - The URL to check
   * @return {Promise<boolean>} True if cached
   */
  async has(url) {
    const cached = await this.get(url);
    return cached !== null;
  }

  /**
   * Get all cached URLs for current session
   *
   * @return {Promise<Array<string>>} Array of cached URLs
   */
  async getAllUrls() {
    if (!this.isAvailable) {
      return Array.from(this.memoryCache.keys());
    }
    try {
      const items = await this.store.getByIndex('sessionId', this.sessionId);
      return items.map(item => item.url);
    } catch (error) {
      console.error('[StaticSiteCache] Error getting all URLs:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   *
   * @return {Promise<Object>} Cache statistics
   */
  async getStats() {
    if (!this.isAvailable) {
      return {
        totalCached: this.memoryCache.size,
        sessionCached: this.memoryCache.size,
        storageUsed: null,
        storageQuota: null,
        storagePercent: null,
        usingFallback: true
      };
    }
    try {
      const [totalCount, sessionItems, storageEstimate] = await Promise.all([this.store.count(), this.store.getByIndex('sessionId', this.sessionId), this.store.getStorageEstimate()]);
      return {
        totalCached: totalCount,
        sessionCached: sessionItems.length,
        storageUsed: storageEstimate.usage,
        storageQuota: storageEstimate.quota,
        storagePercent: storageEstimate.percentUsed,
        usingFallback: false
      };
    } catch (error) {
      console.error('[StaticSiteCache] Error getting stats:', error);
      return {
        totalCached: 0,
        sessionCached: 0,
        storageUsed: null,
        storageQuota: null,
        storagePercent: null,
        usingFallback: false
      };
    }
  }

  /**
   * Clear all cache for current session
   *
   * @return {Promise<number>} Number of items deleted
   */
  async clearSession() {
    if (!this.isAvailable) {
      const size = this.memoryCache.size;
      this.memoryCache.clear();
      return size;
    }
    try {
      // Get all items for this session
      const items = await this.store.getByIndex('sessionId', this.sessionId);

      // Delete each item
      let deletedCount = 0;
      for (const item of items) {
        const success = await this.store.delete(item.url);
        if (success) {
          deletedCount++;
        }
      }
      return deletedCount;
    } catch (error) {
      console.error('[StaticSiteCache] Error clearing session:', error);
      return 0;
    }
  }

  /**
   * Clear all cache (all sessions)
   *
   * @return {Promise<boolean>} True if successful
   */
  async clearAll() {
    if (!this.isAvailable) {
      this.memoryCache.clear();
      return true;
    }
    try {
      return await this.store.clear();
    } catch (error) {
      console.error('[StaticSiteCache] Error clearing all:', error);
      return false;
    }
  }

  /**
   * Clean up old cached items (older than MAX_CACHE_AGE_MS)
   *
   * @return {Promise<number>} Number of items deleted
   */
  async cleanup() {
    if (!this.isAvailable) {
      // For memory cache, just clear everything
      const size = this.memoryCache.size;
      this.memoryCache.clear();
      return size;
    }
    try {
      return await this.store.deleteOlderThan(MAX_CACHE_AGE_MS);
    } catch (error) {
      console.error('[StaticSiteCache] Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Batch get multiple URLs
   *
   * @param {Array<string>} urls - Array of URLs to retrieve
   * @return {Promise<Map<string, Object>>} Map of URL to cached data
   */
  async batchGet(urls) {
    const results = new Map();

    // Process in parallel for better performance
    await Promise.all(urls.map(async url => {
      const cached = await this.get(url);
      if (cached) {
        results.set(url, cached);
      }
    }));
    return results;
  }

  /**
   * Batch set multiple URLs
   *
   * @param {Array<Object>} items - Array of {url, rawHtml, assetUrls}
   * @return {Promise<number>} Number of items successfully cached
   */
  async batchSet(items) {
    let successCount = 0;

    // Process in parallel for better performance
    await Promise.all(items.map(async item => {
      const success = await this.set(item.url, item.rawHtml || item.processedHtml,
      // Support legacy processedHtml for backward compatibility
      item.assetUrls);
      if (success) {
        successCount++;
      }
    }));
    return successCount;
  }

  /**
   * Get cache health information
   *
   * @return {Promise<Object>} Health information
   */
  async getHealth() {
    const stats = await this.getStats();
    return {
      isHealthy: this.isAvailable,
      usingFallback: stats.usingFallback,
      cacheSize: stats.sessionCached,
      storageWarning: stats.storagePercent !== null && stats.storagePercent > 80,
      recommendations: this.getRecommendations(stats)
    };
  }

  /**
   * Get recommendations based on cache state
   *
   * @param {Object} stats - Cache statistics
   * @return {Array<string>} Array of recommendation messages
   */
  getRecommendations(stats) {
    const recommendations = [];
    if (stats.usingFallback) {
      recommendations.push('IndexedDB is not available. Using in-memory fallback which has a 500 URL limit.');
    }
    if (stats.storagePercent !== null && stats.storagePercent > 80) {
      recommendations.push(`Browser storage is ${Math.round(stats.storagePercent)}% full. Consider clearing old caches.`);
    }
    if (stats.storagePercent !== null && stats.storagePercent > 95) {
      recommendations.push('Browser storage is nearly full. Cache operations may fail.');
    }
    if (stats.totalCached > stats.sessionCached * 2) {
      recommendations.push('Old cache data detected. Run cleanup() to free up space.');
    }
    return recommendations;
  }
}
/* harmony default export */ const staticSiteCache = (StaticSiteCache);
;// ./assets/src/export/utils/preScanPhase.js
/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, count total files.
 *
 * @package
 */







/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs, extracts assets, and caches raw HTML.
 *
 * @param {Object}   options                  Pre-scan options.
 * @param {Array}    options.urls             URLs to scan.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.providerConfig   Provider configuration.
 * @param {Function} options.setStatusMessage Status message updater.
 * @param {Object}   options.cache            Optional shared cache instance.
 * @return {Promise<Object>} Pre-scan results.
 */
async function executePreScan({
  urls,
  siteUrl,
  providerId,
  providerConfig,
  setStatusMessage,
  cache = null
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

  // Use provided cache or create new one
  const sharedCache = cache || new staticSiteCache();
  const allUniqueAssets = new Set();

  // Log cache health (only if we created a new cache)
  if (!cache) {
    const cacheHealth = await sharedCache.getHealth();
    if (cacheHealth.usingFallback) {
      (0,admin_settings_debug/* debugWarn */.UT)('[Aether] IndexedDB not available, using in-memory fallback (500 URL limit)');
    }
    if (cacheHealth.recommendations.length > 0) {
      cacheHealth.recommendations.forEach(rec => (0,admin_settings_debug/* debugWarn */.UT)(`[Aether] ${rec}`));
    }

    // Clean up old caches (only for new cache instances)
    const cleanedCount = await sharedCache.cleanup();
    if (cleanedCount > 0) {
      (0,admin_settings_debug/* debug */.Yz)(`[Aether] Cleaned up ${cleanedCount} old cache entries`);
    }
  }

  // Scan each URL
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      // Check cache before fetching
      const cached = await sharedCache.get(url);
      let html;
      let assetUrls;
      if (cached) {
        // Use cached data
        html = cached.rawHtml;
        assetUrls = cached.assetUrls || [];
        (0,admin_settings_debug/* debug */.Yz)(`[Aether] Using cached HTML for: ${url}`);
      } else {
        // Fetch from URL
        const htmlResponse = await fetch(url, {
          method: 'GET',
          credentials: 'omit',
          headers: {
            'User-Agent': 'Aether Static Site Generator'
          }
        });
        if (htmlResponse.status !== 200) {
          (0,admin_settings_debug/* debugWarn */.UT)(`[Aether] Skipping URL with non-200 status: ${url} (HTTP ${htmlResponse.status})`);
          failures.urlsFailed++;
          failures.failedUrls.push({
            url,
            reason: `Failed to fetch HTML: HTTP ${htmlResponse.status} ${htmlResponse.statusText}`
          });
          continue;
        }
        html = await htmlResponse.text();

        // Extract assets
        assetUrls = await extractAssetsFromHtml(html, url, siteUrl);

        // Cache raw HTML (before any filters) and assets
        await sharedCache.set(url, html, assetUrls);
      }

      // Add to unique set
      for (const assetUrl of assetUrls) {
        allUniqueAssets.add(assetUrl);
      }
    } catch (error) {
      (0,admin_settings_debug/* debugWarn */.UT)(`[Aether] Error fetching URL: ${url}`, error.message);
      failures.urlsFailed++;
      failures.failedUrls.push({
        url,
        reason: error.message
      });
    }
  }

  // Get cache stats
  const cacheStats = await sharedCache.getStats();
  const totalFilesToUpload = cacheStats.sessionCached + allUniqueAssets.size;
  (0,admin_settings_debug/* debug */.Yz)('Pre-scan complete:', {
    urlsScanned: urls.length,
    urlsSuccessful: cacheStats.sessionCached,
    uniqueAssets: allUniqueAssets.size,
    totalFilesToUpload
  });

  // Fire completion action
  (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.pre_scan.after', {
    urlsScanned: urls.length,
    urlsSuccessful: cacheStats.sessionCached,
    uniqueAssets: allUniqueAssets.size,
    totalFiles: totalFilesToUpload
  }, providerId);
  if (setStatusMessage) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of HTML files, %2$d: Number of assets */
    (0,external_wp_i18n_namespaceObject.__)('Pre-scan complete: %1$d HTML files, %2$d assets', 'aether-site-exporter'), cacheStats.sessionCached, allUniqueAssets.size), 'success', 'scanFiles');
  }
  return {
    cache: sharedCache,
    allUniqueAssets,
    totalFilesToUpload,
    failures,
    cacheStats
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
 * @package
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
 * @package
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
    (0,admin_settings_debug/* debug */.Yz)('calculateFileHash:', {
      fileSize: file.size,
      hashLength: hashHex.length
    });
    return hashHex;
  } catch (error) {
    (0,admin_settings_debug/* debugError */.AO)('Failed to calculate file hash:', error);
    throw new Error(`Hash calculation failed: ${error.message}`);
  }
}
;// ./assets/src/utils/helpers.js
/**
 * General Utility Functions
 *
 * Common helper functions used throughout the application.
 *
 * @package
 */

/**
 * Filter out null and undefined values from an object
 *
 * @param {Object} obj Object to filter
 * @return {Object} New object with null/undefined values removed
 */
function filterNullishValues(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * Safely parse JSON with fallback value
 *
 * @param {string}   jsonString JSON string to parse
 * @param {*}        fallback   Fallback value if parsing fails (default: null)
 * @param {Function} validator  Optional validator function to verify parsed value
 * @return {*} Parsed value or fallback
 */
function parseJSONSafely(jsonString, fallback = null, validator = null) {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(jsonString);

    // If validator provided, use it to verify the parsed value
    if (validator && !validator(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Parse JSON array from localStorage safely
 *
 * @param {string} jsonString JSON string to parse
 * @param {Array}  fallback   Fallback array if parsing fails (default: [])
 * @return {Array} Parsed array or fallback
 */
function parseJSONArray(jsonString, fallback = []) {
  return parseJSONSafely(jsonString, fallback, Array.isArray);
}

/**
 * Parse JSON object from localStorage safely
 *
 * @param {string} jsonString JSON string to parse
 * @param {Object} fallback   Fallback object if parsing fails (default: {})
 * @return {Object} Parsed object or fallback
 */
function parseJSONObject(jsonString, fallback = {}) {
  return parseJSONSafely(jsonString, fallback, val => val && typeof val === 'object' && !Array.isArray(val));
}

/**
 * Check if a value is an encrypted credential
 *
 * @param {*} value Value to check
 * @return {boolean} True if value is encrypted credential string
 */
function isEncryptedValue(value) {
  return typeof value === 'string' && value.startsWith('encrypted:');
}

/**
 * Deep merge two objects
 *
 * @param {Object} target Target object
 * @param {Object} source Source object
 * @return {Object} Merged object
 */
function deepMerge(target, source) {
  const output = {
    ...target
  };
  if (!source || typeof source !== 'object') {
    return output;
  }
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  });
  return output;
}

/**
 * Debounce a function call
 *
 * @param {Function} func      Function to debounce
 * @param {number}   wait      Milliseconds to wait
 * @param {boolean}  immediate Execute on leading edge instead of trailing
 * @return {Function} Debounced function
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func(...args);
    }
  };
}

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
 * for the publish workflow.
 *
 * @package
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
        (0,admin_settings_debug/* debugError */.AO)(`[ErrorHandler] Error not retryable or max retries reached:`, error);
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt, config);
      (0,admin_settings_debug/* debugWarn */.UT)(`[ErrorHandler] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms:`, error.message);
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  (0,admin_settings_debug/* debugError */.AO)(`[ErrorHandler] All retry attempts exhausted after ${maxRetries + 1} attempts`);
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
 * @package
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
            (0,admin_settings_debug/* debugWarn */.UT)('Failed to calculate file hash, will upload:', error);
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
          (0,admin_settings_debug/* debugWarn */.UT)('Failed to calculate hash:', error);
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
      (0,admin_settings_debug/* debugWarn */.UT)(`Failed to upload file: ${key}`, error);
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
          debugWarn('Failed to calculate file hash, will upload:', error);
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
        debugWarn('Failed to calculate hash:', error);
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
    debugWarn(`Failed to upload file: ${key}`, error);
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
 * @package
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
    (0,admin_settings_debug/* debug */.Yz)(`Manifest loaded with ${manifestEntryCount} entries`);
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('Failed to fetch manifest, continuing without hash comparison:', error);
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
        (0,admin_settings_debug/* debugWarn */.UT)(`Skipping invalid asset URL (empty path after scope stripping): ${assetUrl}`);
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
        } catch (error) {
          (0,admin_settings_debug/* debugWarn */.UT)('Failed to calculate hash for manifest check, will upload:', assetUrl, error);
        }
      }
      assetData.push({
        assetUrl,
        assetPath: finalAssetPath,
        assetKey: finalAssetKey,
        assetBlob,
        contentType: finalContentType
      });
    } catch (error) {
      (0,admin_settings_debug/* debugWarn */.UT)('Failed to fetch asset:', assetUrl, error);
    }
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
      (0,admin_settings_debug/* debugWarn */.UT)('Could not find fileData for result key:', result.key);
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
      (0,admin_settings_debug/* debugWarn */.UT)('Failed to calculate hash, will upload:', error);
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
      (0,admin_settings_debug/* debugWarn */.UT)('Failed to calculate hash:', error);
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
    const beforeCleanupCount = Object.keys(manifest).length;
    let cleanedManifest = cleanupManifest(manifest, currentFileKeys);
    cleanedManifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.cleanup', cleanedManifest, currentFileKeys, providerId);
    const afterCleanupCount = Object.keys(cleanedManifest).length;
    const removedCount = beforeCleanupCount - afterCleanupCount;
    (0,admin_settings_debug/* debug */.Yz)(`Manifest cleanup: ${beforeCleanupCount} entries → ${afterCleanupCount} entries (${removedCount} removed, ${currentFileKeys.size} current files)`);
    await uploadManifest(storageService, cleanedManifest);
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Updated file manifest', 'aether-site-exporter'), 'success', 'updateManifest');
    }
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('Failed to upload manifest:', error);
  }
}
;// ./assets/src/export/hooks/useStaticSiteGenerator.js
/**
 * Static Site Generator Hook
 *
 * Processes URLs and uploads static site files using a two-phase approach:
 * 1. PHASE 1 (Pre-scan): Fetch all URLs, extract assets, count total files
 * 2. PHASE 2 (Upload): Upload all files with accurate progress
 *
 * @package
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
    (0,admin_settings_debug/* debug */.Yz)('Static site storage configuration:', {
      staticPath,
      providerId: staticSiteProviderId
    });
    const storageService = await createStorageService(staticPath, config, staticSiteProviderId, providerConfig);
    const totalUrls = urls.length;

    // PHASE 1: Pre-scan all URLs (use shared cache if provided)
    const preScanResult = await executePreScan({
      urls,
      siteUrl,
      providerId: staticSiteProviderId,
      providerConfig,
      setStatusMessage,
      cache
    });
    const {
      cache: sharedCache,
      totalFilesToUpload
    } = preScanResult;

    // Merge pre-scan failures
    failures.urlsFailed += preScanResult.failures.urlsFailed;
    failures.failedUrls.push(...preScanResult.failures.failedUrls);

    // PHASE 2: Upload all files
    let manifest = await prepareManifest(storageService, staticSiteProviderId, setStatusMessage);
    let filesUploaded = 0;
    let filesSkipped = 0;

    // Get cached URLs
    const cachedUrls = await sharedCache.getAllUrls();

    // Fire upload start action
    (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.upload.before', cachedUrls, totalFilesToUpload, staticSiteProviderId);

    // Process each URL
    for (const url of cachedUrls) {
      const cached = await sharedCache.get(url);
      if (!cached) {
        (0,admin_settings_debug/* debugWarn */.UT)(`[Aether] Cache miss for URL: ${url} - skipping`);
        continue;
      }
      const {
        rawHtml,
        assetUrls
      } = cached;
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
            (0,admin_settings_debug/* debug */.Yz)('Periodic manifest save:', filesUploaded + ' files');
            await uploadManifest(storageService, manifest);
          } catch (error) {
            (0,admin_settings_debug/* debugWarn */.UT)('Periodic manifest save failed:', error);
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

    // Note: Cache cleanup is handled at the workflow level (uploadStaticFiles step)
    // to ensure it happens once for all providers, not per provider

    // Finalize manifest
    await finalizeManifest(storageService, manifest, uploadedFiles, staticSiteProviderId, setStatusMessage);

    // Log optimization summary
    const actualUploads = filesUploaded - filesSkipped;
    (0,admin_settings_debug/* debug */.Yz)('Upload optimization summary:', {
      totalFiles: filesUploaded,
      uploaded: actualUploads,
      skipped: filesSkipped,
      skipRate: filesUploaded > 0 ? `${Math.round(filesSkipped / filesUploaded * 100)}%` : '0%'
    });

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
 * @package
 */



/**
 * Production zip URL for Aether plugin (matches PHP constant AETHER_PRODUCTION_ZIP_URL).
 */
const AETHER_PRODUCTION_ZIP_URL = 'https://r2.s12y.org/aether.zip';

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
 * Build the installPlugin step for Aether plugin.
 *
 * @return {Object} Blueprint step object.
 */
function buildAetherInstallStep() {
  // Add cache-busting to ensure fresh download.
  const aetherUrl = `${AETHER_PRODUCTION_ZIP_URL}?v=${Date.now()}`;
  return {
    step: 'installPlugin',
    pluginData: {
      resource: 'url',
      url: aetherUrl,
      caption: 'Installing Aether plugin'
    },
    options: {
      activate: false
    }
  };
}

/**
 * Build the defineWpConfigConsts step to identify Playground environment.
 *
 * @return {Object} Blueprint step object.
 */
function buildDefineConstsStep() {
  return {
    step: 'defineWpConfigConsts',
    consts: {
      AETHER_PLAYGROUND_SITE: true
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
 * Build the activatePlugin step for Aether plugin.
 *
 * @return {Object} Blueprint step object.
 */
function buildAetherActivationStep() {
  return {
    step: 'activatePlugin',
    pluginPath: 'aether/aether.php'
  };
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
 * @package
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
   * @param {Object}   [options]                 Optional options object.
   * @param {Array}    [options.assets]          Discovered assets (currently unused).
   * @param {string}   [options.wpContentZipUrl] wp-content.zip URL (currently unused).
   * @param {Function} [setStatusMessage]        Optional status message callback.
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
 * @package
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

/**
 * Descriptions for deployment types
 */
const DEPLOYMENT_TYPE_DESCRIPTIONS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Deploy static HTML/CSS/JS files for web hosting', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Deploy WordPress Playground blueprint bundle (ZIP file)', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Deploy serverless functions to edge computing platforms', 'aether-site-exporter')
};
;// ./assets/src/export/executor/DependencyResolver.js
/**
 * Dependency Resolver
 *
 * Resolves step dependencies and builds parallel execution plan.
 * Uses topological sort to determine execution order.
 *
 * @package
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
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<string>} Array of validation errors (empty if valid).
 */
function validateDependencies(steps) {
  const errors = [];
  const stepIds = new Set(steps.map(s => s.id));
  steps.forEach(step => {
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
 * Tracks publish workflow progress with equal step weights and IndexedDB persistence.
 * Each step gets equal weight: 100% / number of steps.
 *
 * @package
 */



const DB_CONFIG = {
  dbName: 'aether-publish-progress',
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
    (0,admin_settings_debug/* debugWarn */.UT)('[ProgressTracker] IndexedDB not available, progress will not persist');
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
    (0,admin_settings_debug/* debugWarn */.UT)('[ProgressTracker] Failed to save progress:', error);
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
    (0,admin_settings_debug/* debugWarn */.UT)('[ProgressTracker] Failed to load progress:', error);
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
    (0,admin_settings_debug/* debugWarn */.UT)('[ProgressTracker] Failed to delete progress:', error);
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
      (0,admin_settings_debug/* debugWarn */.UT)(`[ProgressTracker] Unknown step ID: ${stepId}`);
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
    (0,admin_settings_debug/* debug */.Yz)(`[ProgressTracker] Step ${stepId}: ${clampedProgress}% | Overall: ${progressState.overallProgress}%`);
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
 * @package
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
    (0,admin_settings_debug/* debugWarn */.UT)('[StateManager] IndexedDB not available, state will not persist');
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
    (0,admin_settings_debug/* debug */.Yz)(`[StateManager] Saved state for ${stateKey}`);
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('[StateManager] Failed to save state:', error);
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
      (0,admin_settings_debug/* debug */.Yz)(`[StateManager] Loaded state for ${stateKey}`);
      return result.state;
    }
    return null;
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('[StateManager] Failed to load state:', error);
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
    (0,admin_settings_debug/* debug */.Yz)(`[StateManager] Deleted state for ${workflowId}${providerInstance ? `::${providerInstance}` : ''}`);
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('[StateManager] Failed to delete state:', error);
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
    (0,admin_settings_debug/* debugWarn */.UT)('[StateManager] Failed to list states:', error);
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
 * Executes publish workflow steps with automatic dependency resolution
 * and parallel execution support.
 *
 * @package
 */








/**
 * Execute a workflow with the given steps.
 *
 * @param {Array<Object>} steps   Array of step definitions to execute.
 * @param {Object}        context Initial context with dependencies and state.
 * @param {Object}        options Execution options.
 * @return {Promise<Object>} Final execution state.
 */
async function executeSteps(steps, context, options = {}) {
  const {
    onStepStart = () => {},
    onStepComplete = () => {},
    onStepSkipped = () => {},
    onError = () => {}
  } = options;

  // Validate dependencies
  const errors = validateDependencies(steps);
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
    if (savedProgress) {
      (0,admin_settings_debug/* debug */.Yz)('[StepExecutor] Loaded previous progress:', savedProgress);
    }

    // Try to restore execution context
    restoredState = await restoreExecutionContext(stateManager, context);
    if (restoredState && restoredState.completedSteps?.length > 0) {
      (0,admin_settings_debug/* debug */.Yz)(`[StepExecutor] Restored state with ${restoredState.completedSteps.length} completed steps`);
    }
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('[StepExecutor] Failed to restore state:', error);
  }

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
  (0,external_wp_hooks_.doAction)('aether.export.workflow.before', executionContext, steps);
  try {
    for (const parallelGroup of executionPlan) {
      // Determine which steps to run vs skip
      const stepsToRun = [];
      const stepsToSkip = [];
      for (const stepId of parallelGroup) {
        const step = steps.find(s => s.id === stepId);
        const shouldSkip = (0,external_wp_hooks_.applyFilters)(`aether.publish.step.${stepId}.skip`, step.skip ? step.skip(executionContext) : false, executionContext);
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
        (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.skipped`, executionContext);
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
        (0,admin_settings_debug/* debugWarn */.UT)('[StepExecutor] Failed to save state:', error);
        // Don't throw - state saving is non-critical
      }
    }

    // Fire workflow complete action
    (0,external_wp_hooks_.doAction)('aether.export.workflow.after', executionContext.state, executionContext);

    // Clear progress tracker and state on successful completion
    await progressTracker.clear();
    await stateManager.clear();
    return executionContext.state;
  } catch (error) {
    (0,external_wp_hooks_.doAction)('aether.export.workflow.error', error, executionContext);
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
  (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.before`, executionContext);
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

    // Execute handler with retry logic
    const result = await errorHandler.executeWithRetry(async () => {
      return await step.handler(stepContext);
    }, {
      onRetry: (error, attempt, delay) => {
        // Fire retry action
        (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.retry`, error, attempt, delay, executionContext);
      }
    });

    // Apply result filter
    const filteredResult = (0,external_wp_hooks_.applyFilters)(`aether.publish.step.${stepId}.result`, result || {}, executionContext);
    onStepComplete(stepId, filteredResult);

    // Mark step as completed in progress tracker
    if (executionContext.progressTracker) {
      await executionContext.progressTracker.completeStep(stepId);
    }

    // Fire after hook
    (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.after`, filteredResult, executionContext);
    return filteredResult;
  } catch (error) {
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
    (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.error`, enhancedError, executionContext);

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
;// ./assets/src/export/executor/index.js
/**
 * Executor Module
 *
 * @package
 */



;// ./assets/src/export/steps/discoverBlueprintBundleAssets/index.js
/**
 * Discover Blueprint Bundle Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in the blueprint bundle.
 *
 * @package
 */



/**
 * Discover blueprint bundle assets step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered assets.
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
 * Discover Blueprint Bundle Assets step definition.
 */
const discoverBlueprintBundleAssetsStep = {
  id: 'discoverBlueprintBundleAssets',
  label: (0,external_wp_i18n_namespaceObject.__)('Discover Assets', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Find custom plugins and themes for blueprint bundle', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  provides: ['discoveredAssets'],
  handler
};
;// ./assets/src/export/steps/getStaticSiteUrls/index.js
/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be fetched for static site generation.
 *
 * @package
 */



/**
 * Get static site URLs step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {string}   context.siteUrl          WordPress site URL.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered URLs.
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
 * Get Static Site URLs step definition.
 */
const getStaticSiteUrlsStep = {
  id: 'getStaticSiteUrls',
  label: (0,external_wp_i18n_namespaceObject.__)('Discover URLs', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Find all URLs for static site generation', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  provides: ['urls', 'staticSiteUrl', 'urlsCount'],
  handler: getStaticSiteUrls_handler
};
;// ./assets/src/export/steps/preScanStaticSite/index.js
/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages and extracts assets (CSS, JS, images) to add to URL list.
 *
 * @package
 */





/**
 * Pre-scan static site step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Array}    context.urls             URLs from getStaticSiteUrls.
 * @param {string}   context.siteUrl          WordPress site URL.
 * @param {Function} context.setStatusMessage Status message updater.
 * @param {Function} context.setStepProgress  Step progress updater.
 * @return {Promise<Object>} Step result with expanded URL list including assets.
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

  // Fetch each URL and extract assets
  for (let i = 0; i < totalUrls; i++) {
    const url = urls[i];

    // Update progress
    if (setStepProgress) {
      const progress = Math.round((i + 1) / totalUrls * 100);
      setStepProgress('preScanStaticSite', progress);
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
        (0,admin_settings_debug/* debugWarn */.UT)(`[Aether] Skipping URL with non-200 status: ${url} (HTTP ${response.status})`);
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
    } catch (error) {
      (0,admin_settings_debug/* debugWarn */.UT)(`[Aether] Error fetching URL: ${url}`, error.message);
    }
  }

  // Combine HTML URLs with discovered assets
  const expandedUrls = [...htmlUrls, ...allAssets];
  (0,admin_settings_debug/* debug */.Yz)('[Aether] Pre-scan complete:', {
    htmlPages: htmlUrls.length,
    assetsDiscovered: allAssets.size,
    totalUrls: expandedUrls.length
  });
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of pages, %2$d: Number of assets */
  (0,external_wp_i18n_namespaceObject.__)('Found %1$d pages and %2$d assets', 'aether-site-exporter'), htmlUrls.length, allAssets.size), 'success', 'preScanStaticSite');

  // Return expanded URL list
  return {
    urls: expandedUrls,
    htmlCount: htmlUrls.length,
    assetCount: allAssets.size
  };
}

/**
 * Pre-Scan Static Site step definition.
 */
const preScanStaticSiteStep = {
  id: 'preScanStaticSite',
  label: (0,external_wp_i18n_namespaceObject.__)('Scan for Assets', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Discover CSS, JS, and image assets from pages', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['getStaticSiteUrls'],
  provides: ['urls', 'htmlCount', 'assetCount'],
  handler: preScanStaticSite_handler
};
;// ./assets/src/export/steps/createWpContentArchive/index.js
/**
 * Create WP Content Archive Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @package
 */





/**
 * Create wp-content archive step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              ExportAPI instance.
 * @param {Object}   context.assetManager     Asset manager instance.
 * @param {Array}    context.discoveredAssets Discovered assets from discoverBlueprintBundleAssets step.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with archive info.
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
 * Create WP Content Archive step definition.
 */
const createWpContentArchiveStep = {
  id: 'createWpContentArchive',
  label: (0,external_wp_i18n_namespaceObject.__)('Create WP Content Archive', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Package custom plugins, themes, and uploads', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['discoverBlueprintBundleAssets'],
  provides: ['zipPath', 'zipUrl', 'zipSize'],
  handler: createWpContentArchive_handler
};
;// ./assets/src/export/steps/createBlueprintBundle/index.js
/**
 * Create Blueprint Bundle Step
 *
 * Generates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
 *
 * @package
 */





/**
 * Create blueprint bundle step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Object}   context.api                   ExportAPI instance.
 * @param {Function} context.generateBlueprintJson Blueprint JSON generator function.
 * @param {string}   context.zipPath               Path to wp-content.zip from createWpContentArchive.
 * @param {string}   context.zipUrl                URL to wp-content.zip.
 * @param {Array}    context.discoveredAssets      Discovered assets.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @return {Promise<Object>} Step result with blueprint bundle info.
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
 * Create Blueprint Bundle step definition.
 */
const createBlueprintBundleStep = {
  id: 'createBlueprintBundle',
  label: (0,external_wp_i18n_namespaceObject.__)('Create Blueprint Bundle', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Create blueprint-bundle.zip', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: ['createWpContentArchive'],
  provides: ['blueprintData', 'blueprintBundle'],
  handler: createBlueprintBundle_handler
};
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
 * @package
 */






/**
 * Upload blueprint bundle step handler.
 *
 * @param {Object}   context                          Execution context.
 * @param {Array}    context.blueprintBundleProviders Providers for blueprint bundle.
 * @param {Object}   context.blueprintBundle          Bundle data from "./createBlueprintBundle.
 * @param {string}   context.siteUrl                  WordPress site URL.
 * @param {Function} context.setStatusMessage         Status message updater.
 * @param {Function} context.setStepProgress          Step progress updater.
 * @param {Function} context.setOverallProgressValue  Overall progress updater.
 * @return {Promise<Object>} Step result.
 */
async function uploadBlueprintBundle_handler(context) {
  const {
    blueprintBundleProviders = [],
    blueprintBundle,
    siteUrl,
    setStatusMessage,
    setStepProgress
  } = context;
  const providers = blueprintBundleProviders;
  if (providers.length === 0) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.__)('No providers enabled for blueprint bundle', 'aether-site-exporter'), 'warning', 'uploadBlueprintBundle');
    return {
      skipped: true,
      reason: 'no_providers'
    };
  }
  const bundleSize = blueprintBundle?.bundleSize || 0;
  const bundleSizeFormatted = formatFileSize(bundleSize);
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File size, %2$d: Number of providers */
  (0,external_wp_i18n_namespaceObject._n)('Uploading blueprint bundle (%1$s) to %2$d provider…', 'Uploading blueprint bundle (%1$s) to %2$d providers…', providers.length, 'aether-site-exporter'), bundleSizeFormatted, providers.length), 'progress', 'uploadBlueprintBundle');

  // Upload to providers sequentially
  const uploadResults = [];
  let successCount = 0;
  let failureCount = 0;
  for (const providerIdItem of providers) {
    try {
      // Fetch provider config to get export_path
      let exportPath = 'blueprint-bundle/bundle.zip';
      try {
        const providerResponse = await external_wp_apiFetch_default()({
          path: `/aether/site-exporter/providers/${providerIdItem}/config`
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
        providerId: providerIdItem,
        metadata: {
          ...context,
          siteUrl,
          exportPath
        }
      });

      // Upload file using unified upload system
      // This fires aether.file.upload action which providers hook into
      await (0,unifiedFileUpload/* uploadFile */.QM)(fileContext);
      successCount++;
      uploadResults.push({
        status: 'fulfilled',
        value: {
          providerId: providerIdItem,
          success: true,
          exportPath
        }
      });

      // Update progress
      if (setStepProgress) {
        const stepProgress = Math.min(100, Math.round(successCount / providers.length * 100));
        setStepProgress('uploadBlueprintBundle', stepProgress);
      }
    } catch (error) {
      failureCount++;
      uploadResults.push({
        status: 'rejected',
        reason: error,
        providerId: providerIdItem,
        error: error?.message || (0,external_wp_i18n_namespaceObject.__)('Unknown error', 'aether-site-exporter')
      });
    }
  }

  // Report results
  if (successCount > 0) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File size, %2$d: Success count, %3$d: Total providers */
    (0,external_wp_i18n_namespaceObject._n)('Uploaded blueprint bundle (%1$s) to %2$d/%3$d provider', 'Uploaded blueprint bundle (%1$s) to %2$d/%3$d providers', providers.length, 'aether-site-exporter'), bundleSizeFormatted, successCount, providers.length), failureCount > 0 ? 'warning' : 'success', 'uploadBlueprintBundle');
  }
  if (successCount === 0) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Failed to upload blueprint bundle to any provider', 'aether-site-exporter'));
  }
  return {
    providers,
    results: uploadResults.map(r => r.status === 'fulfilled' ? r.value : r.reason),
    successCount,
    failureCount
  };
}

/**
 * Upload Blueprint Bundle step definition.
 */
const uploadBlueprintBundleStep = {
  id: 'uploadBlueprintBundle',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Blueprint Bundle', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Upload blueprint-bundle.zip to providers', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['createBlueprintBundle'],
  provides: [],
  handler: uploadBlueprintBundle_handler
};
;// ./assets/src/export/steps/uploadStaticFiles/index.js
/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses useStaticSiteGenerator to process URLs and upload files via unified action system.
 *
 * @package
 */








/**
 * Upload static files step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Array}    context.staticSiteProviders   Providers for static site.
 * @param {Array}    context.urls                  URLs from getStaticSiteUrls.
 * @param {string}   context.staticSiteUrl         Static site URL.
 * @param {Object}   context.blueprintData         Blueprint data.
 * @param {string}   context.siteUrl               WordPress site URL.
 * @param {Function} context.processStaticSiteUrls Static site generator function.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @return {Promise<Object>} Step result with uploaded files.
 */
async function uploadStaticFiles_handler(context) {
  const {
    urls,
    staticSiteUrl,
    blueprintData,
    siteUrl,
    staticSiteProviders = [],
    processStaticSiteUrls,
    setStatusMessage
  } = context;
  if (!urls || !Array.isArray(urls)) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('URLs not found. Please run getStaticSiteUrls first.', 'aether-site-exporter'));
  }
  if (!processStaticSiteUrls) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Static site generator not available', 'aether-site-exporter'));
  }
  const providers = staticSiteProviders;
  if (providers.length === 0) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.__)('No providers enabled for static site deployment', 'aether-site-exporter'), 'warning', 'uploadStaticFiles');
    return {
      skipped: true,
      reason: 'no_providers'
    };
  }
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of files, %2$d: Number of providers */
  (0,external_wp_i18n_namespaceObject._n)('Processing %1$d file for %2$d provider…', 'Processing %1$d files for %2$d providers…', urls.length, 'aether-site-exporter'), urls.length, providers.length), 'progress', 'uploadStaticFiles');

  // Filter URLs before processing
  const filteredUrls = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.urls', urls, providers, {
    siteUrl,
    blueprintData,
    staticSiteUrl,
    providers
  });

  // Create shared cache instance for all providers
  // This ensures URLs and HTML are fetched only once, then shared across providers
  const sharedCache = new staticSiteCache();

  // Pre-scan once: Fetch all URLs and cache raw HTML before processing providers
  // This prevents duplicate network requests when multiple providers are enabled
  let preScanResult = null;
  try {
    // Get provider config for first provider (for pre-scan)
    // Pre-scan doesn't need provider-specific config, but executePreScan expects it
    const firstProviderId = providers[0];
    const providerConfig = await fetchProviderConfig(firstProviderId);
    setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Pre-scanning URLs and caching HTML…', 'aether-site-exporter'), 'progress', 'uploadStaticFiles-prescan');
    preScanResult = await executePreScan({
      urls: filteredUrls,
      siteUrl,
      providerId: firstProviderId,
      providerConfig,
      setStatusMessage,
      cache: sharedCache // Use shared cache
    });
    (0,admin_settings_debug/* debug */.Yz)(`[Aether] Pre-scan complete: ${preScanResult.cacheStats.sessionCached} URLs cached, ${preScanResult.allUniqueAssets.size} unique assets`);
  } catch (error) {
    (0,admin_settings_debug/* debugWarn */.UT)('[Aether] Pre-scan failed:', error);
    // Continue with empty cache - processStaticSiteUrls will handle it
  }

  // Process URLs for each provider using useStaticSiteGenerator
  const providerResults = {};
  let totalFilesUploaded = 0;
  let totalFilesSkipped = 0;
  let totalUrlsProcessed = 0;
  let totalUrlsSucceeded = 0;
  let totalUrlsFailed = 0;
  const allFailedUrls = [];

  // Note: Progress tracking is handled by processStaticSiteUrls internally
  // No need for separate onProgress callback here

  // Process each provider
  // Each provider will use the shared cache to get raw HTML and process it independently
  try {
    for (const providerId of providers) {
      try {
        setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Provider ID */
        (0,external_wp_i18n_namespaceObject.__)('Processing static site for provider: %s', 'aether-site-exporter'), providerId), 'progress', `uploadStaticFiles-${providerId}`);

        // Process URLs for this provider
        // Pass shared cache so it uses cached raw HTML instead of fetching again
        const result = await processStaticSiteUrls(filteredUrls, staticSiteUrl, providerId, siteUrl, setStatusMessage, blueprintData, null,
        // removeMessage
        sharedCache // Pass shared cache
        );

        // Aggregate results
        providerResults[providerId] = {
          success: result.success,
          urlsProcessed: result.urlsProcessed || 0,
          urlsSucceeded: result.urlsSucceeded || 0,
          urlsFailed: result.urlsFailed || 0,
          filesUploaded: result.filesUploaded || 0,
          filesSkipped: result.filesSkipped || 0,
          assetsUploaded: result.assetsUploaded || 0,
          assetsFailed: result.assetsFailed || 0,
          failedUrls: result.failedUrls || [],
          uploadedFiles: result.uploadedFiles || []
        };
        totalFilesUploaded += result.filesUploaded || 0;
        totalFilesSkipped += result.filesSkipped || 0;
        totalUrlsProcessed += result.urlsProcessed || 0;
        totalUrlsSucceeded += result.urlsSucceeded || 0;
        totalUrlsFailed += result.urlsFailed || 0;
        if (result.failedUrls) {
          allFailedUrls.push(...result.failedUrls);
        }
      } catch (error) {
        providerResults[providerId] = {
          success: false,
          error: error.message || (0,external_wp_i18n_namespaceObject.__)('Unknown error', 'aether-site-exporter'),
          urlsProcessed: 0,
          urlsSucceeded: 0,
          urlsFailed: filteredUrls.length,
          filesUploaded: 0,
          filesSkipped: 0,
          assetsUploaded: 0,
          assetsFailed: 0,
          failedUrls: filteredUrls.map(url => ({
            url: typeof url === 'string' ? url : url.url || url,
            reason: error.message || 'Unknown error'
          })),
          uploadedFiles: []
        };
        totalUrlsFailed += filteredUrls.length;
        allFailedUrls.push(...filteredUrls.map(url => ({
          url: typeof url === 'string' ? url : url.url || url,
          reason: error.message || 'Unknown error'
        })));
      }
    }
  } finally {
    // Clean up cache when publish finishes (success or failure)
    try {
      const cacheCleanedCount = await sharedCache.clearSession();
      if (cacheCleanedCount > 0) {
        (0,admin_settings_debug/* debug */.Yz)(`[Aether] Cleared ${cacheCleanedCount} cache entries from session`);
      }
    } catch (cleanupError) {
      (0,admin_settings_debug/* debugWarn */.UT)('[Aether] Failed to cleanup cache:', cleanupError);
    }
  }

  // Calculate totals
  // A provider is successful if it uploaded at least one file
  // (success === false just means some URLs had errors, not total failure)
  const successfulProviders = Object.entries(providerResults).filter(([, data]) => data.filesUploaded > 0);
  const failedProviders = Object.entries(providerResults).filter(([, data]) => data.filesUploaded === 0);
  if (successfulProviders.length > 0) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Success count, %2$d: Total providers, %3$d: Total files uploaded */
    (0,external_wp_i18n_namespaceObject._n)('Uploaded static site to %1$d/%2$d provider (%3$d file)', 'Uploaded static site to %1$d/%2$d providers (%3$d files)', totalFilesUploaded, 'aether-site-exporter'), successfulProviders.length, providers.length, totalFilesUploaded), failedProviders.length > 0 ? 'warning' : 'success', 'uploadStaticFiles');
  }
  if (failedProviders.length === providers.length) {
    // Collect error details from all failed providers
    const errorDetails = failedProviders.map(([providerId, data]) => {
      const error = data.error || 'Unknown error';
      return `${providerId}: ${error}`;
    }).join('; ');
    throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Error details from providers */
    (0,external_wp_i18n_namespaceObject.__)('Failed to upload static site to any provider. Details: %s', 'aether-site-exporter'), errorDetails));
  }
  return (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.result', {
    providers,
    results: providerResults,
    successCount: successfulProviders.length,
    failureCount: failedProviders.length,
    totalFilesUploaded,
    totalFilesSkipped,
    totalUrlsProcessed,
    totalUrlsSucceeded,
    totalUrlsFailed,
    failedUrls: allFailedUrls
  }, providers, {
    siteUrl,
    blueprintData,
    staticSiteUrl
  });
}

/**
 * Upload Static Files step definition.
 */
const uploadStaticFilesStep = {
  id: 'uploadStaticFiles',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Static Files', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Generate and upload static HTML files', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['preScanStaticSite'],
  provides: [],
  handler: uploadStaticFiles_handler
};
;// ./assets/src/export/steps/index.js
/**
 * Step Registry
 *
 * Flat step definitions with explicit dependencies for the export workflow.
 * Steps are executed in parallel when their dependencies are satisfied.
 *
 * @package
 */










/**
 * Get all registered steps.
 *
 * Steps are filtered through hooks to allow extension.
 *
 * @return {Array<Object>} Array of step definitions.
 */
function getRegisteredSteps() {
  const steps = [discoverBlueprintBundleAssetsStep, getStaticSiteUrlsStep, preScanStaticSiteStep, createWpContentArchiveStep, createBlueprintBundleStep, uploadBlueprintBundleStep, uploadStaticFilesStep];

  /**
   * Filter registered steps.
   *
   * Allows plugins to add, remove, or modify steps.
   *
   * @param {Array<Object>} steps Array of step definitions.
   */
  return (0,external_wp_hooks_.applyFilters)('aether.export.steps', steps);
}

/**
 * Get steps filtered by which providers are enabled.
 *
 * @param {Object} context Execution context with provider arrays.
 * @return {Array<Object>} Filtered steps based on enabled providers.
 */
function getActiveSteps(context) {
  const {
    staticSiteProviders = [],
    blueprintBundleProviders = []
  } = context;
  const steps = getRegisteredSteps();

  // Filter out steps that should be skipped based on provider configuration
  return steps.filter(step => {
    // If step has a static skip function, check it
    if (typeof step.shouldSkip === 'function') {
      return !step.shouldSkip(context);
    }

    // Skip blueprint-related steps if no blueprint bundle providers
    if (step.id === 'discoverBlueprintBundleAssets' || step.id === 'createWpContentArchive' || step.id === 'createBlueprintBundle' || step.id === 'uploadBlueprintBundle') {
      return blueprintBundleProviders.length > 0;
    }

    // Skip static site steps if no static site providers
    if (step.id === 'preScanStaticSite' || step.id === 'uploadStaticFiles') {
      return staticSiteProviders.length > 0;
    }
    return true;
  });
}
;// ./assets/src/export/utils/exportConfiguration.js
/**
 * Publish Configuration Utilities
 *
 * Pure functions for preparing publish workflow configuration.
 * These functions are extracted from useExportController for testability.
 *
 * @package
 */



/**
 * Prepare publish configuration from settings response
 *
 * Extracts provider IDs and settings from API response.
 * Pure function - no side effects, easily testable.
 *
 * @param {Object} settingsResponse - Response from settings API
 * @return {Object} Configuration object with provider IDs
 */
function preparePublishConfiguration(settingsResponse) {
  const settings = settingsResponse?.settings || {};
  const providerTypes = settings.provider_types || {};
  return {
    storageProviderId: providerTypes.storage || '',
    staticSiteProviderId: providerTypes.static_site || '',
    providerConfigs: settings.providers || {}
  };
}

/**
 * Get enabled provider instances for a specific deployment type
 *
 * Filters provider configurations to find enabled instances
 * that support the specified deployment type.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<string>} Array of enabled instance IDs
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

      // Check if enabled (default to true if not specified)
      const isEnabled = instanceConfig.enabled !== false;

      // Check if supports this deployment type
      const deploymentTypes = instanceConfig.deployment_types || [];
      const supportsType = Array.isArray(deploymentTypes) && deploymentTypes.includes(deploymentType);
      return isEnabled && supportsType;
    }).map(([id]) => id);
  } catch (error) {
    (0,admin_settings_debug/* debugError */.AO)(`Failed to get instances for deployment type ${deploymentType}:`, error);
    return [];
  }
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
    edgeFunctionProviders
  } = config;
  const {
    api,
    processStaticSiteUrls,
    generateBlueprintJson,
    updateStaticSiteProgressContext,
    assetManager,
    setStatusMessage,
    setStepProgress
  } = dependencies;
  return {
    // API and state
    api,
    siteUrl,
    // Provider arrays by deployment type (from PHP registry via REST API)
    staticSiteProviders,
    blueprintBundleProviders,
    edgeFunctionProviders,
    // Hooks and utilities
    processStaticSiteUrls,
    generateBlueprintJson,
    updateStaticSiteProgressContext,
    assetManager,
    // State setters
    setStatusMessage,
    setStepProgress,
    // Discovered assets (populated during workflow)
    discoveredAssets: null
  };
}
;// ./assets/src/export/hooks/useExportController.js
/**
 * Publish Controller Hook
 *
 * Orchestrates the publish workflow using phase-based execution
 *
 * @package
 */












function useExportController(publishState) {
  const {
    setIsPublishing,
    updateFromStep,
    markAllComplete,
    showError,
    initializeSteps,
    setStatusMessage,
    setOverallProgressValue,
    setStepProgress,
    removeMessage,
    setProviders
  } = publishState;

  // State for storage provider ID (set before starting publish)
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

      // Current provider's progress (0-100)
      const currentProviderProgress = Math.min(100, Math.max(0, Math.round(uploadedFiles / totalFiles * 100)));

      // Calculate step progress accounting for multiple providers
      // Progress formula: (providerIndex * 100 + currentProviderProgress) / totalProviders
      let stepProgress = currentProviderProgress;
      if (totalProviders > 1) {
        stepProgress = Math.min(100, Math.round((providerIndex * 100 + currentProviderProgress) / totalProviders));
      }

      // Only update step progress - let the progress tracker handle overall progress
      // This prevents progress jumps when this step starts
      setStepProgress('uploadStaticFiles', stepProgress);
    }
  });
  const startExport = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    try {
      (0,admin_settings_debug/* debug */.Yz)('startExport called');

      // Initialize steps with 'discoverBlueprintBundleAssets' as the active step
      // This sets up steps array, active step, and lastStepIndex correctly
      initializeSteps(getRegisteredSteps(), 'discoverBlueprintBundleAssets');
      // Set isPublishing to true to start the workflow
      setIsPublishing(true);
      (0,admin_settings_debug/* debug */.Yz)('Steps initialized, starting publish workflow');

      // Fetch settings to get storage provider ID before starting
      const settingsResponse = await (0,utils_api/* default */.Ay)({
        path: '/aether/site-exporter/settings'
      });

      // Use pure function to extract configuration
      const publishConfig = preparePublishConfiguration(settingsResponse);

      // Update storage provider ID state
      if (settingsResponse.success && publishConfig.storageProviderId) {
        setStorageProviderId(publishConfig.storageProviderId);
      }

      // Fetch asset status
      try {
        const assetStatusResponse = await api.getAssetStatus();
        if (assetStatusResponse.success && assetStatusResponse.assets) {
          assetManager.syncWithServer(assetStatusResponse.assets);
        }
      } catch (assetError) {
        // Asset status fetch is not critical - log and continue
        (0,admin_settings_debug/* debugError */.AO)('Failed to fetch asset status:', assetError);
      }

      // STATELESS WORKFLOW EXECUTION
      // No job tracking - React owns all state, PHP provides stateless endpoints

      // Activate the first step immediately to update UI
      updateFromStep('discoverBlueprintBundleAssets');

      // Get current site URL for static site generation (use pure function)
      const siteUrl = window.location.origin;

      // Get arrays of instance IDs for each deployment type (use pure function)
      const providersByType = determineProvidersByDeploymentType(publishConfig.providerConfigs, [DEPLOYMENT_TYPES.STATIC_SITE, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE, DEPLOYMENT_TYPES.EDGE_FUNCTIONS]);
      const staticSiteProviders = providersByType[DEPLOYMENT_TYPES.STATIC_SITE];
      const blueprintBundleProviders = providersByType[DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
      const edgeFunctionProviders = providersByType[DEPLOYMENT_TYPES.EDGE_FUNCTIONS];
      (0,admin_settings_debug/* debug */.Yz)('[Workflow] Providers by deployment type:', {
        staticSite: staticSiteProviders,
        blueprintBundle: blueprintBundleProviders,
        edgeFunctions: edgeFunctionProviders
      });

      // Store provider arrays in global state for UI access
      setProviders(staticSiteProviders, blueprintBundleProviders);

      // Build context object with all dependencies for step handlers (use pure function)
      const workflowContext = buildWorkflowContext({
        siteUrl,
        staticSiteProviders,
        blueprintBundleProviders,
        edgeFunctionProviders
      }, {
        api,
        processStaticSiteUrls,
        generateBlueprintJson,
        updateStaticSiteProgressContext,
        assetManager,
        setStatusMessage,
        setStepProgress
      });

      // Add additional UI callbacks not in pure function (to avoid coupling)
      workflowContext.setOverallProgressValue = setOverallProgressValue;
      workflowContext.removeMessage = removeMessage;

      // Execute full workflow - individual steps check provider deployment_types

      // Set up workflow lifecycle callbacks for UI updates
      const workflowOptions = {
        onStepStart: stepId => {
          (0,admin_settings_debug/* debug */.Yz)(`[Workflow] Step starting: ${stepId}`);
          // Update UI with step ID
          updateFromStep(stepId);
        },
        onStepComplete: (stepId, result) => {
          (0,admin_settings_debug/* debug */.Yz)(`[Workflow] Step completed: ${stepId}`, result);
        },
        onStepSkipped: stepId => {
          (0,admin_settings_debug/* debug */.Yz)(`[Workflow] Step skipped: ${stepId}`);
        },
        onError: (stepId, error) => {
          (0,admin_settings_debug/* debugError */.AO)(`[Workflow] Step error: ${stepId}`, error);
        }
      };

      // Get steps filtered by enabled providers
      const activeSteps = getActiveSteps(workflowContext);

      // Execute steps using flat executor with dependency resolution
      await executeSteps(activeSteps, workflowContext, workflowOptions);
      (0,admin_settings_debug/* debug */.Yz)('[Workflow] All steps completed successfully');

      // Clear asset upload tracking flags (reset state for next publish)
      assetManager.clearUploadFlags();

      // Update UI to show all steps as complete with success message
      markAllComplete({
        status: 'complete'
      });

      // Release publishing lock (allows user to start new publish)
      setIsPublishing(false);
    } catch (error) {
      (0,admin_settings_debug/* debugError */.AO)('Publish failed:', error);
      showError(`Failed to start: ${error.message}`);
      setIsPublishing(false);
    }
  }, [setIsPublishing, api, assetManager, showError, initializeSteps, setStorageProviderId, updateFromStep, updateStaticSiteProgressContext, processStaticSiteUrls, generateBlueprintJson, setStatusMessage, setStepProgress, removeMessage, setOverallProgressValue, setProviders, markAllComplete]);
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
 * @package
 */

const colors = {
  primary: '#2271b1',
  primaryHover: '#135e96',
  primaryDark: '#0a4168',
  text: '#1d2327',
  textMuted: '#646970',
  textSecondary: '#50575e',
  white: '#fff',
  background: '#f6f7f7',
  backgroundLighter: '#f0f0f1',
  backgroundError: '#fcf0f1',
  borderLight: '#c3c4c7',
  borderLighter: '#e0e0e0',
  error: '#d63638',
  success: '#00a32a',
  warning: '#dba617',
  info: '#2271b1'
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
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04)',
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
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  success: {
    background: '#d5f0dd',
    color: '#00833e'
  },
  error: {
    background: '#fcf0f1',
    color: '#c22c2e'
  },
  warning: {
    background: '#fcf0c7',
    color: '#826200'
  },
  info: {
    background: '#d7edff',
    color: '#135e96'
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
    background: '#d5f0dd'
  },
  error: {
    borderLeftColor: colors.error,
    background: colors.backgroundError
  },
  warning: {
    borderLeftColor: colors.warning,
    background: '#fcf0c7'
  },
  info: {
    borderLeftColor: colors.info,
    background: '#d7edff'
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

/**
 * Create grid style object
 *
 * @param {string} minColumnWidth Minimum column width
 * @param {string} gap            Gap spacing
 * @return {Object} Style object
 */
const createGridStyle = (minColumnWidth = '16rem', gap = spacing.md) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`,
  gap
});

/**
 * Common utility styles
 */
const utilityStyles = {
  noMargin: {
    margin: 0
  },
  noMarginTop: {
    marginTop: 0
  },
  noMarginBottom: {
    marginBottom: 0
  }
};
;// ./assets/src/components/ActivityLogMessage/index.js
/**
 * Activity Log Message Component
 *
 * Renders a single activity log message with icon, text, and optional progress bar
 *
 * @package
 */



/**
 * Get activity item style based on message type
 *
 * @param {string} type Message type: 'info' | 'success' | 'error' | 'progress'
 * @return {Object} Style object
 */

const getActivityItemStyle = type => {
  const baseStyle = {
    ...createFlexStyle('row', spacing.sm),
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    transition: 'background-color 0.2s ease'
  };
  const typeStyles = {
    progress: {
      backgroundColor: noticeStyles.info.background
    },
    success: {
      backgroundColor: noticeStyles.success.background
    },
    error: {
      backgroundColor: noticeStyles.error.background
    },
    info: {
      backgroundColor: colors.backgroundLighter
    }
  };
  return {
    ...baseStyle,
    ...(typeStyles[type] || typeStyles.info)
  };
};

/**
 * Get icon color based on message type
 *
 * @param {string} type Message type: 'info' | 'success' | 'error' | 'progress'
 * @return {string} Color value
 */
const getActivityIconColor = type => {
  const iconColors = {
    progress: colors.primary,
    success: colors.success,
    error: colors.error,
    info: colors.textMuted
  };
  return iconColors[type] || iconColors.info;
};
const activityIconStyle = {
  flexShrink: 0,
  width: '1rem',
  height: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: fontWeight.bold
};
const activityMessageStyle = {
  flex: 1,
  lineHeight: 1.4,
  wordBreak: 'break-word',
  minWidth: 0 // Allow flex item to shrink below content size
};
const fileProgressBarContainerStyle = {
  flexShrink: 0,
  width: '120px',
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  marginLeft: spacing.sm
};
const fileProgressBarStyle = {
  flex: 1,
  height: '4px',
  backgroundColor: colors.borderLighter,
  borderRadius: borderRadius.full,
  overflow: 'hidden'
};
const fileProgressBarFillStyle = {
  height: '100%',
  backgroundColor: colors.primary,
  transition: 'width 0.2s ease'
};
const fileProgressPercentageStyle = {
  fontSize: fontSize.xs,
  color: colors.textMuted,
  fontWeight: fontWeight.medium,
  minWidth: '35px',
  textAlign: 'right'
};

/**
 * Get icon character for message type
 *
 * @param {string} type Message type
 * @return {string} Icon character
 */
const getIcon = type => {
  const icons = {
    success: '✓',
    error: '✕',
    progress: '◉',
    info: '•'
  };
  return icons[type] || icons.info;
};

/**
 * Activity Log Message Component
 *
 * @param {Object}      props          Component props
 * @param {string}      props.message  Message text (plain text, HTML will be escaped)
 * @param {string}      props.type     Message type: 'info' | 'success' | 'error' | 'progress'
 * @param {Object|null} props.progress Optional progress data { percent: number, loaded?: number, total?: number }
 * @return {JSX.Element} Activity log message item
 */
function ActivityLogMessage({
  message,
  type,
  progress
}) {
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
    className: `aether-publish-progress-modal__activity-item aether-publish-progress-modal__activity-item--${type}`,
    style: getActivityItemStyle(type),
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
      className: `aether-publish-progress-modal__activity-icon aether-publish-progress-modal__activity-icon--${type}`,
      style: {
        ...activityIconStyle,
        color: getActivityIconColor(type)
      },
      children: getIcon(type)
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
      className: "aether-publish-progress-modal__activity-message",
      style: activityMessageStyle,
      children: message
    }), progress && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-publish-progress-modal__file-progress",
      style: fileProgressBarContainerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__file-progress-bar",
        style: fileProgressBarStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
          className: "aether-publish-progress-modal__file-progress-fill",
          style: {
            ...fileProgressBarFillStyle,
            width: `${progress.percent}%`
          }
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        className: "aether-publish-progress-modal__file-progress-percentage",
        style: fileProgressPercentageStyle,
        children: [progress.percent, "%"]
      })]
    })]
  });
}
;// ./assets/src/components/UploadStatistic/index.js
/**
 * Upload Statistic Component
 *
 * Reusable component for displaying individual statistics with a labeled badge
 * and flexible content area. Used within UploadStatistics to show metrics like
 * provider count, file count, and total size.
 *
 * @package
 */



/**
 * Upload Statistic Component
 *
 * @param {Object}      props          Component props
 * @param {string}      props.label    Label text displayed in badge
 * @param {Object}      props.color    Color configuration for label badge (with backgroundColor and textColor properties)
 * @param {JSX.Element} props.children Content to display below the label
 * @return {JSX.Element} Statistic item
 */

function UploadStatistic({
  label,
  color = {
    backgroundColor: colors.backgroundLight,
    textColor: colors.textMuted
  },
  children
}) {
  // Styles
  const itemStyle = {
    ...createFlexStyle('column', spacing.xs),
    alignItems: 'center',
    minWidth: '120px'
  };
  const labelStyle = {
    fontSize: fontSize.xs,
    color: color.textColor,
    backgroundColor: color.backgroundColor,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-publish-progress-modal__detail-item",
    style: itemStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
      className: "aether-publish-progress-modal__detail-label",
      style: labelStyle,
      children: label
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-publish-progress-modal__detail-value",
      children: children
    })]
  });
}
;// ./assets/src/components/UploadStatistics/index.js
/**
 * Upload Statistics Component
 *
 * Displays upload statistics including provider count, files uploaded, and total size.
 * Calculates stats from message history and remains visible throughout publish workflow.
 *
 * @package
 */







/**
 * Upload Statistics Component
 *
 * @param {Object} props                          Component props
 * @param {Array}  props.messageHistory           Array of status messages
 * @param {Array}  props.staticSiteProviders      Array of provider IDs for static site deployment
 * @param {Array}  props.blueprintBundleProviders Array of provider IDs for blueprint bundle deployment
 * @return {JSX.Element|null} Upload statistics section or null if no stats available
 */

function UploadStatistics({
  messageHistory,
  staticSiteProviders = [],
  blueprintBundleProviders = []
}) {
  // Calculate upload statistics from message history
  const uploadStats = (0,external_wp_element_namespaceObject.useMemo)(() => {
    // Get provider count from actual provider arrays (more accurate than parsing messages)
    // Use the largest count between static and blueprint providers
    const providerCount = Math.max(staticSiteProviders.length, blueprintBundleProviders.length, 1);

    // Count static site files uploaded across all providers
    // Parse provider summary messages like "Completed Production: 100 files uploaded"
    // to get actual total (e.g., 100 files × 3 providers = 300 total uploads)
    const providerSummaryMessages = messageHistory.filter(msg => msg.key?.startsWith('upload-provider-') && msg.key?.endsWith('-summary'));

    // Count static site files
    let staticFileCount = 0;
    if (providerSummaryMessages.length > 0) {
      // Multi-provider: sum file counts from each provider summary
      providerSummaryMessages.forEach(msg => {
        const match = msg.message?.match(/(\d+)\s+files?\s+uploaded/i);
        if (match) {
          staticFileCount += parseInt(match[1], 10);
        }
      });
    } else {
      // Single provider or no summaries yet: count unique file messages
      const uploadedFileMessages = messageHistory.filter(msg => msg.type === 'success' && msg.metadata?.fileSize && msg.key?.startsWith('upload-'));
      staticFileCount = uploadedFileMessages.length;
    }

    // Count blueprint bundle uploads (1 file per provider)
    const blueprintFileCount = blueprintBundleProviders.length;

    // Total files = static files + blueprint bundles
    const fileCount = staticFileCount + blueprintFileCount;

    // Calculate total size from metadata
    // Static site files size
    const uploadedFileMessages = messageHistory.filter(msg => msg.type === 'success' && msg.metadata?.fileSize && msg.key?.startsWith('upload-'));
    const staticFilesSize = uploadedFileMessages.reduce((sum, msg) => {
      return sum + (msg.metadata?.fileSize || 0);
    }, 0);

    // Blueprint bundle size (only count once, not per provider)
    const blueprintMessages = messageHistory.filter(msg => msg.key === 'uploadSiteArchive' && msg.type === 'success' && msg.metadata?.isBlueprint);
    const blueprintSize = blueprintMessages[0]?.metadata?.bundleSize || 0;

    // Total size = static files + blueprint
    const totalSize = staticFilesSize + blueprintSize;
    return {
      providerCount,
      fileCount,
      totalSize: formatFileSize(totalSize)
    };
  }, [messageHistory, staticSiteProviders, blueprintBundleProviders]);

  // Don't render if no uploads at all
  if (uploadStats.fileCount === 0) {
    return null;
  }

  // Styles
  const detailsSectionStyle = {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.borderLighter}`,
    ...createFlexStyle('row', spacing.xl),
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  };
  const detailValueStyle = {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.semibold
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-publish-progress-modal__details",
    style: detailsSectionStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(UploadStatistic, {
      label: (0,external_wp_i18n_namespaceObject.__)('Providers', 'aether-site-exporter'),
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        style: detailValueStyle,
        children: uploadStats.providerCount
      })
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(UploadStatistic, {
      label: (0,external_wp_i18n_namespaceObject.__)('Files Uploaded', 'aether-site-exporter'),
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        style: detailValueStyle,
        children: uploadStats.fileCount
      })
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(UploadStatistic, {
      label: (0,external_wp_i18n_namespaceObject.__)('Total Size', 'aether-site-exporter'),
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        style: detailValueStyle,
        children: uploadStats.totalSize
      })
    })]
  });
}
;// ./assets/src/components/ExportProgressModal/index.js
/**
 * Publish Progress Modal Component
 *
 * Shows publish progress with progress bar and status messages
 *
 * @package
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
const progressBarContainerStyle = {
  ...createFlexStyle('row', spacing.lg),
  alignItems: 'center',
  width: '100%'
};
const progressBarStyle = {
  width: '100%',
  height: '20px',
  backgroundColor: colors.borderLighter,
  borderRadius: borderRadius.sm,
  overflow: 'hidden',
  position: 'relative'
};
const progressBarFillStyle = {
  height: '100%',
  backgroundColor: colors.primary,
  transition: 'width 0.3s ease',
  borderRadius: borderRadius.sm
};
const progressPercentageStyle = {
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  color: colors.text,
  minWidth: '3rem',
  textAlign: 'right',
  flexShrink: 0
};
const activityLogStyle = {
  marginTop: spacing.xl,
  overflowY: 'auto',
  fontSize: fontSize.xs,
  height: '300px'
};
const activityListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  ...createFlexStyle('column', 0)
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
  const publishState = useExportState();
  const {
    startExport
  } = useExportController(publishState);
  const {
    steps,
    isPublishing,
    jobId,
    finalStatus,
    error,
    reset,
    overallProgress,
    messageHistory,
    staticSiteProviders,
    blueprintBundleProviders
  } = publishState;

  // Ref for activity log auto-scroll
  const activityLogRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Keep modal open if finalStatus is set, even if isOpen becomes false
  // This allows the auto-close effect to run and show the success message
  const shouldShowModal = isOpen || finalStatus;

  // Wrapper for onClose that resets state before closing
  // Only allow closing when job is finished (has finalStatus or error)
  const handleClose = (0,external_wp_element_namespaceObject.useCallback)(() => {
    // Prevent closing while job is in progress
    if (isPublishing && !finalStatus && !error) {
      return;
    }
    reset();
    if (onClose) {
      onClose();
    }
  }, [reset, onClose, isPublishing, finalStatus, error]);

  // Reset state when modal closes (only when shouldShowModal becomes false)
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!shouldShowModal) {
      reset();
    }
  }, [shouldShowModal, reset]);

  // Start publish when modal opens
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isOpen && !isPublishing) {
      // Only start if we haven't started yet (no steps initialized and no job ID)
      if (steps.length === 0 && !jobId) {
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

  // Auto-scroll activity log to top when new messages arrive
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (activityLogRef.current) {
      activityLogRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [messageHistory.length]);

  // Calculate overall progress from steps if not explicitly set
  const displayProgress = (0,external_wp_element_namespaceObject.useMemo)(() => {
    if (overallProgress > 0) {
      return overallProgress;
    }
    if (steps.length === 0) {
      return 0;
    }
    const completedSteps = steps.filter(step => step.status === 'complete').length;
    const currentActiveStep = steps.find(step => step.status === 'active');
    let progress = completedSteps / steps.length * 100;
    if (currentActiveStep && currentActiveStep.supportsProgress) {
      progress += currentActiveStep.progress / steps.length;
    }
    return Math.min(100, Math.round(progress));
  }, [steps, overallProgress]);

  // Sort activity log messages by priority: progress → error → success/info
  const sortedMessageHistory = (0,external_wp_element_namespaceObject.useMemo)(() => {
    const getPriority = type => {
      switch (type) {
        case 'progress':
          return 0;
        case 'error':
          return 1;
        case 'success':
        case 'info':
        default:
          return 2;
      }
    };
    return [...messageHistory].sort((a, b) => {
      const priorityA = getPriority(a.type);
      const priorityB = getPriority(b.type);
      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Within same priority, maintain existing order (newest first)
      // Since messages are prepended, original index order is preserved
      return 0;
    });
  }, [messageHistory]);
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
    return (0,external_wp_i18n_namespaceObject.__)('Publishing Site', 'aether-site-exporter');
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Modal, {
    className: "aether-publish-progress-modal",
    title: getModalTitle(),
    onRequestClose: handleClose,
    isFullScreen: false,
    shouldCloseOnClickOutside: false,
    shouldCloseOnEsc: false,
    __experimentalHideHeader: false,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-publish-progress-modal__content",
      style: modalContentStyle,
      children: [error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__notice aether-publish-progress-modal__notice--error",
        style: noticeErrorStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-publish-progress-modal__notice-text",
          style: utilityStyles.noMargin,
          children: error
        })
      }), finalStatus && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-publish-progress-modal__notice aether-publish-progress-modal__notice--success",
        style: noticeSuccessStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-publish-progress-modal__notice-text",
          style: noticeParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Your site has been published successfully!', 'aether')
        }), finalStatus.deploymentUrl && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("p", {
          className: "aether-publish-progress-modal__deployment",
          style: utilityStyles.noMargin,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
            className: "aether-publish-progress-modal__deployment-label",
            children: (0,external_wp_i18n_namespaceObject.__)('View your published site:', 'aether')
          }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
            className: "aether-publish-progress-modal__deployment-link",
            href: finalStatus.deploymentUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            children: finalStatus.deploymentUrl
          })]
        })]
      }), !finalStatus && !error && steps.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__progress",
        style: progressContainerStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-publish-progress-modal__progress-container",
          style: progressBarContainerStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
            className: "aether-publish-progress-modal__progress-bar",
            style: progressBarStyle,
            children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
              className: "aether-publish-progress-modal__progress-fill",
              style: {
                ...progressBarFillStyle,
                width: `${displayProgress}%`
              }
            })
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
            className: "aether-publish-progress-modal__progress-percentage",
            style: progressPercentageStyle,
            children: [displayProgress, "%"]
          })]
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(UploadStatistics, {
        messageHistory: messageHistory,
        staticSiteProviders: staticSiteProviders,
        blueprintBundleProviders: blueprintBundleProviders
      }), messageHistory.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__activity-log",
        style: activityLogStyle,
        ref: activityLogRef,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("ul", {
          className: "aether-publish-progress-modal__activity-list",
          style: activityListStyle,
          children: sortedMessageHistory.map(item => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ActivityLogMessage, {
            message: item.message,
            type: item.type,
            progress: item.progress
          }, item.id))
        })
      }), steps.length === 0 && !error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-publish-progress-modal__loading",
        style: loadingStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {
          className: "aether-publish-progress-modal__spinner"
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-publish-progress-modal__loading-text",
          style: loadingParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Initializing publish process…', 'aether-site-exporter')
        })]
      })]
    })
  });
}
;// external ["wp","primitives"]
const external_wp_primitives_namespaceObject = window["wp"]["primitives"];
;// ./node_modules/@wordpress/icons/build-module/library/trash.js
/**
 * WordPress dependencies
 */


const trash = /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_primitives_namespaceObject.Path, {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 5.5A2.25 2.25 0 0 0 9.878 7h4.244A2.251 2.251 0 0 0 12 5.5ZM12 4a3.751 3.751 0 0 0-3.675 3H5v1.5h1.27l.818 8.997a2.75 2.75 0 0 0 2.739 2.501h4.347a2.75 2.75 0 0 0 2.738-2.5L17.73 8.5H19V7h-3.325A3.751 3.751 0 0 0 12 4Zm4.224 4.5H7.776l.806 8.861a1.25 1.25 0 0 0 1.245 1.137h4.347a1.25 1.25 0 0 0 1.245-1.137l.805-8.861Z"
  })
});
/* harmony default export */ const library_trash = (trash);

;// ./assets/src/components/StatusNotice/index.js
/**
 * Status Notice Component
 *
 * Reusable notice/alert component for displaying status messages.
 * Wraps WordPress Notice component with consistent styling.
 *
 * @package
 */



/**
 * StatusNotice Component
 *
 * @param {Object}   props               Component props
 * @param {string}   props.status        Notice status (success, error, warning, info)
 * @param {string}   props.message       Message to display
 * @param {boolean}  props.isDismissible Whether notice can be dismissed
 * @param {Function} props.onDismiss     Callback when notice is dismissed
 * @param {string}   props.className     Optional additional CSS class
 * @return {JSX.Element} Rendered notice
 */

function StatusNotice({
  status = 'info',
  message,
  isDismissible = true,
  onDismiss = null,
  className = ''
}) {
  const noticeClassName = `aether-status-notice aether-status-notice--${status} ${className}`.trim();
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
    className: noticeClassName,
    status: status,
    isDismissible: isDismissible,
    onRemove: onDismiss,
    children: message
  });
}
;// ./assets/src/utils/validation.js
/**
 * Validation Utilities
 *
 * Client-side validation utilities for provider configurations.
 * Can be used with zod schemas once zod is installed.
 *
 * @package
 */

/**
 * Validate a field value based on validation rules.
 *
 * @param {string} value Value to validate.
 * @param {Object} field Field definition with validation rules.
 * @return {string|null} Error message if invalid, null if valid.
 */
function validateField(value, field) {
  const {
    validation,
    label,
    required
  } = field;

  // Check required fields.
  if (required && (value === null || value === undefined || value === '')) {
    return `${label} is required.`;
  }

  // Skip validation if field is empty and not required.
  if (!value && !required) {
    return null;
  }
  if (!validation) {
    return null;
  }

  // Pattern validation.
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return validation.message || `${label} format is invalid.`;
    }
  }

  // Min length validation.
  if (validation.minLength && value.length < validation.minLength) {
    return `${label} must be at least ${validation.minLength} characters.`;
  }

  // Max length validation.
  if (validation.maxLength && value.length > validation.maxLength) {
    return `${label} must be no more than ${validation.maxLength} characters.`;
  }
  return null;
}

/**
 * Validate a provider configuration.
 *
 * @param {Object} config Configuration object to validate.
 * @param {Array}  fields Array of field definitions.
 * @return {Object} Object with `valid` boolean and `errors` object.
 */
function validateConfig(config, fields) {
  const errors = {};
  fields.forEach(field => {
    const fieldId = field.id;
    const value = config[fieldId];
    const error = validateField(value, field);
    if (error) {
      errors[fieldId] = error;
    }
  });
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
;// ./assets/src/components/SecretField/index.js
/**
 * Secret Field Component
 *
 * Replaces the aether-secret web component with a React component.
 *
 * @package
 */





function SecretField({
  value = '',
  onChange,
  label,
  help,
  placeholder,
  ...props
}) {
  const [isVisible, setIsVisible] = (0,external_wp_element_namespaceObject.useState)(false);
  const containerStyle = {
    position: 'relative'
  };
  const inputWrapperStyle = {
    position: 'relative'
  };
  const eyeButtonStyle = {
    position: 'absolute',
    right: '8px',
    top: 'calc(23px + 50%)',
    transform: 'translateY(-100%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    fontSize: '18px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    opacity: 0.7,
    transition: 'opacity 0.2s ease'
  };

  // Add hover effect via onMouseEnter/onMouseLeave
  const [isHovered, setIsHovered] = (0,external_wp_element_namespaceObject.useState)(false);

  // Password manager prevention attributes
  const passwordManagerPreventionAttrs = {
    autoComplete: 'off',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
    'data-form-type': 'other'
  };

  // CSS for text masking when not visible
  const inputStyle = {
    paddingRight: '40px',
    // Make room for the eye icon
    ...(!isVisible ? {
      WebkitTextSecurity: 'disc',
      textSecurity: 'disc'
    } : {})
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
    className: "aether-secret-field",
    style: containerStyle,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-secret-field__wrapper",
      style: inputWrapperStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        className: "aether-secret-field__input",
        label: label,
        help: help,
        value: value,
        onChange: onChange,
        type: "text",
        placeholder: placeholder,
        style: inputStyle,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs,
        ...props
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("button", {
        type: "button",
        className: "aether-secret-field__toggle",
        onClick: () => setIsVisible(!isVisible),
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        style: {
          ...eyeButtonStyle,
          opacity: isHovered ? 1 : 0.7
        },
        "aria-label": isVisible ? (0,external_wp_i18n_namespaceObject.__)('Hide', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Show', 'aether-site-exporter'),
        title: isVisible ? (0,external_wp_i18n_namespaceObject.__)('Hide', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Show', 'aether-site-exporter'),
        children: isVisible ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("svg", {
          className: "aether-secret-field__icon aether-secret-field__icon--visible",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 32 32",
          width: "18",
          height: "18",
          style: {
            display: 'block'
          },
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M30.94,15.66A16.69,16.69,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16.69,16.69,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM16,25c-5.3,0-10.9-3.93-12.93-9C5.1,10.93,10.7,7,16,7s10.9,3.93,12.93,9C26.9,21.07,21.3,25,16,25Z"
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M16,10a6,6,0,1,0,6,6A6,6,0,0,0,16,10Zm0,10a4,4,0,1,1,4-4A4,4,0,0,1,16,20Z"
          })]
        }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("svg", {
          className: "aether-secret-field__icon aether-secret-field__icon--hidden",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 32 32",
          width: "18",
          height: "18",
          style: {
            display: 'block'
          },
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M5.24,22.51l1.43-1.42A14.06,14.06,0,0,1,3.07,16C5.1,10.93,10.7,7,16,7a12.38,12.38,0,0,1,4,.72l1.55-1.56A14.72,14.72,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16,16,0,0,0,5.24,22.51Z"
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M12,15.73a4,4,0,0,1,3.7-3.7l1.81-1.82a6,6,0,0,0-7.33,7.33Z"
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M30.94,15.66A16.4,16.4,0,0,0,25.2,8.22L30,3.41,28.59,2,2,28.59,3.41,30l5.1-5.1A15.29,15.29,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM20,16a4,4,0,0,1-6,3.44L19.44,14A4,4,0,0,1,20,16Zm-4,9a13.05,13.05,0,0,1-6-1.58l2.54-2.54a6,6,0,0,0,8.35-8.35l2.87-2.87A14.54,14.54,0,0,1,28.93,16C26.9,21.07,21.3,25,16,25Z"
          })]
        })
      })]
    })
  });
}
;// ./assets/src/components/ProviderField/index.js
/**
 * Provider Field Component
 *
 * Dynamically renders a form field based on provider field definition.
 *
 * @package
 */




/**
 * Render a provider configuration field.
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.field    Field definition from provider metadata.
 * @param {*}        props.value    Current field value.
 * @param {Function} props.onChange Change handler.
 * @param {Object}   props.errors   Validation errors object.
 * @param {boolean}  props.isHidden Whether field should be hidden via CSS.
 * @return {JSX.Element} Rendered field component.
 */

function ProviderField({
  field,
  value,
  onChange,
  errors,
  isHidden = false
}) {
  const {
    id,
    label,
    description,
    type = 'text',
    required = false,
    options = [],
    placeholder = '',
    sensitive = false
  } = field;
  const error = errors?.[id];
  const help = error || description;

  // Password manager prevention attributes for all text inputs
  const passwordManagerPreventionAttrs = {
    autoComplete: 'off',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
    'data-form-type': 'other'
  };

  // Base style for field wrapper
  const fieldWrapperStyle = {
    display: isHidden ? 'none' : undefined
  };

  // Handle sensitive fields (passwords, API keys, etc.)
  if (sensitive || type === 'password') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(SecretField, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        placeholder: placeholder,
        required: required
      })
    });
  }

  // Handle checkbox fields
  if (type === 'checkbox') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
        label: label,
        help: help,
        checked: value || false,
        onChange: newValue => onChange(id, newValue),
        __nextHasNoMarginBottom: true
      })
    });
  }

  // Handle toggle group fields (checkbox group with multiple selection)
  if (type === 'checkbox-group' && options.length > 0) {
    // Use defaultValue if value is undefined or null
    let resolvedValue = [];
    if (value !== undefined && value !== null) {
      resolvedValue = value;
    } else if (field.defaultValue !== undefined) {
      resolvedValue = field.defaultValue;
    }
    const currentValue = Array.isArray(resolvedValue) ? resolvedValue : [];
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: [label && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-field__label components-base-control__label",
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          className: "aether-provider-field__label-text",
          children: label
        }), required && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
          className: "aether-provider-field__label-required components-base-control__label__required",
          children: "*"
        })]
      }), help && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-field__help components-base-control__help",
        children: help
      }), error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-field__error aether-provider-field__error--message components-base-control__help components-base-control__help--error",
        children: error
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-field__checkbox-group aether-checkbox-group",
        children: options.map(option => {
          const optionValue = option.value;
          const optionLabel = option.label || option.value;
          const isSelected = currentValue.includes(optionValue);
          return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
            className: "aether-provider-field__checkbox-option",
            label: optionLabel,
            checked: isSelected,
            onChange: checked => {
              let newValue;
              if (checked) {
                // Add to array if not already present (prevent duplicates)
                if (!currentValue.includes(optionValue)) {
                  newValue = [...currentValue, optionValue];
                } else {
                  // Already in array, no change needed
                  return;
                }
              } else {
                // Remove from array
                newValue = currentValue.filter(v => v !== optionValue);
              }
              onChange(id, newValue);
            },
            style: {
              margin: '0.25rem 0'
            },
            __nextHasNoMarginBottom: true
          }, optionValue);
        })
      })]
    });
  }

  // Handle select fields
  if (type === 'select' && options.length > 0) {
    const selectOptions = options.map(opt => ({
      label: opt.label || opt.value,
      value: opt.value
    }));
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.SelectControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        options: selectOptions,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true
      })
    });
  }

  // Handle textarea fields
  if (type === 'textarea') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextareaControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        placeholder: placeholder,
        required: required,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Handle URL fields
  if (type === 'url') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "url",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Handle email fields
  if (type === 'email') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "email",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Handle number fields
  if (type === 'number') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "number",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Default: text field
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
    className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
    style: fieldWrapperStyle,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: label,
      help: help,
      value: value || '',
      onChange: newValue => onChange(id, newValue),
      placeholder: placeholder,
      required: required,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      ...passwordManagerPreventionAttrs
    })
  });
}
;// ./assets/src/utils/constants.js
/**
 * Application Constants
 *
 * Centralized constants to avoid magic numbers and strings throughout the codebase.
 *
 * @package
 */

/**
 * Success message display duration (milliseconds).
 */
const SUCCESS_MESSAGE_DURATION_MS = 3000;

/**
 * Short delay for async operations (milliseconds).
 * Used to allow state updates to propagate before continuing.
 */
const SHORT_DELAY_MS = 100;

/**
 * Maximum progress percentage.
 */
const MAX_PROGRESS = 100;
;// ./assets/src/hooks/useSuccessTimeout.js
/**
 * Success Timeout Hook
 *
 * Manages success message timeout with automatic cleanup.
 * Prevents memory leaks and ensures proper cleanup on unmount.
 *
 * @package
 */




/**
 * Hook for managing success message timeout.
 *
 * @return {Object} { showSuccess, clearSuccess }
 */
function useSuccessTimeout() {
  const timeoutRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Cleanup timeout on unmount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  const showSuccess = (0,external_wp_element_namespaceObject.useCallback)(callback => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (callback) {
        callback();
      }
      timeoutRef.current = null;
    }, SUCCESS_MESSAGE_DURATION_MS);
  }, []);
  const clearSuccess = (0,external_wp_element_namespaceObject.useCallback)(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  return {
    showSuccess,
    clearSuccess
  };
}
;// ./assets/src/components/ProviderForm/index.js
/**
 * Provider Form Component
 *
 * Dynamically renders a form based on provider field definitions.
 * Can be enhanced with react-hook-form once installed.
 *
 * @package
 */












// Styles - extracted to module level for performance

const formStyle = {
  ...createFlexStyle('column', spacing.md)
};
const actionsStyle = {
  ...createFlexStyle('row', spacing.sm),
  justifyContent: 'flex-end',
  marginTop: spacing.md,
  paddingTop: spacing.md,
  borderTop: `1px solid ${colors.borderLight}`
};

/**
 * Provider Form Component.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.providerId    Provider ID.
 * @param {Array}    props.fields        Array of field definitions from provider metadata.
 * @param {Object}   props.initialValues Initial form values.
 * @param {Function} props.onSubmit      Optional submit handler.
 * @param {Function} props.onChange      Optional change handler.
 * @return {JSX.Element} Rendered form component.
 */
function ProviderForm({
  providerId,
  fields = [],
  initialValues = {},
  onSubmit,
  onChange
}) {
  // Initialize values with field defaults merged with initialValues
  const initializeValues = () => {
    const defaults = {};
    fields.forEach(field => {
      // Use defaultValue if provided, otherwise use empty defaults based on field type
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      } else if (field.type === 'checkbox-group') {
        // Ensure checkbox-group fields are always arrays (even if empty)
        defaults[field.id] = [];
      } else if (field.type === 'checkbox') {
        defaults[field.id] = false;
      }
    });

    // Merge defaults with initialValues, but treat null/undefined as "not set"
    // This ensures that null values from backend don't override defaults
    const merged = {
      ...defaults
    };
    Object.keys(initialValues).forEach(key => {
      const value = initialValues[key];
      // Only use initialValues if it's not null or undefined
      if (value !== null && value !== undefined) {
        merged[key] = value;
      }
    });
    return merged;
  };
  const [values, setValues] = (0,external_wp_element_namespaceObject.useState)(initializeValues);
  const [errors, setErrors] = (0,external_wp_element_namespaceObject.useState)({});
  const [saving, setSaving] = (0,external_wp_element_namespaceObject.useState)(false);
  const [success, setSuccess] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const {
    showSuccess,
    clearSuccess
  } = useSuccessTimeout();

  // Refs for hook container elements
  const beforeFieldsRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const afterFieldsRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const actionsRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Update values when initialValues change
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    setValues(initializeValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);
  const handleFieldChange = (0,external_wp_element_namespaceObject.useCallback)((fieldId, value) => {
    const newValues = {
      ...values,
      [fieldId]: value
    };
    setValues(newValues);
    setErrors({});
    setError(null);
    clearSuccess();
    setSuccess(false);

    // Call onChange callback if provided
    if (onChange) {
      onChange(newValues);
    }
  }, [values, onChange, clearSuccess]);

  // Trigger hooks when values or other state changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const hookContext = {
      providerId,
      values,
      onChange: handleFieldChange,
      errors,
      saving
    };

    // Trigger before_fields hook
    if (beforeFieldsRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.form.before_fields', hookContext);
    }

    // Trigger after_fields hook
    if (afterFieldsRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.form.after_fields', hookContext);
    }

    // Trigger actions hook
    if (actionsRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.form.actions', hookContext);
    }
  }, [providerId, values, handleFieldChange, errors, saving]);
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Ensure all fields are included in values (even if not touched)
    // This prevents fields from being omitted when saving
    const completeValues = {
      ...values
    };
    fields.forEach(field => {
      // Handle undefined or null values (null shouldn't happen due to initialization, but be defensive)
      if (completeValues[field.id] === undefined || completeValues[field.id] === null) {
        // Use defaultValue if available, otherwise use type-specific defaults
        if (field.defaultValue !== undefined) {
          completeValues[field.id] = field.defaultValue;
        } else if (field.type === 'checkbox-group') {
          completeValues[field.id] = [];
        } else if (field.type === 'checkbox') {
          completeValues[field.id] = false;
        }
      }

      // Ensure checkbox-group fields are always arrays (defensive check)
      if (field.type === 'checkbox-group' && !Array.isArray(completeValues[field.id])) {
        completeValues[field.id] = [];
      }
    });

    // Client-side validation
    const validation = validateConfig(completeValues, fields);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSaving(false);
      return;
    }
    try {
      // Call custom onSubmit if provided
      if (onSubmit) {
        await onSubmit(completeValues);
      } else {
        // Default: save to settings using /aether/site-exporter/settings endpoint
        // Get current providers settings
        const settingsResponse = await (0,utils_api/* default */.Ay)({
          path: '/aether/site-exporter/settings?key=providers'
        });
        if (!settingsResponse.success) {
          throw new Error('Failed to load current settings');
        }

        // Merge new provider settings with existing providers
        const currentProviders = settingsResponse.value || {};
        const updatedProviders = {
          ...currentProviders,
          [providerId]: completeValues
        };

        // Save updated providers object
        const saveResponse = await (0,utils_api/* default */.Ay)({
          path: '/aether/site-exporter/settings',
          method: 'POST',
          data: {
            key: 'providers',
            value: updatedProviders
          }
        });
        if (!saveResponse.success) {
          throw new Error(saveResponse.message || 'Failed to save settings');
        }
      }
      setSuccess(true);
      showSuccess(() => setSuccess(false));
    } catch (err) {
      setError(err.message || (0,external_wp_i18n_namespaceObject.__)('Failed to save settings', 'aether-site-exporter'));
    } finally {
      setSaving(false);
    }
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("form", {
    className: "aether-provider-form",
    onSubmit: handleSubmit,
    style: formStyle,
    children: [error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(StatusNotice, {
      status: "error",
      message: error,
      isDismissible: true,
      onRemove: () => setError(null),
      className: "aether-provider-form__notice"
    }), success && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(StatusNotice, {
      status: "success",
      message: (0,external_wp_i18n_namespaceObject.__)('Settings saved successfully!', 'aether-site-exporter'),
      isDismissible: true,
      onRemove: () => setSuccess(false),
      className: "aether-provider-form__notice"
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      ref: beforeFieldsRef,
      className: "aether-provider-form__before-fields",
      "data-provider-id": providerId
    }), (() => {
      // Helper function to determine if field should be hidden
      const isFieldHidden = field => {
        // Always hide deployment_types field (managed in modal)
        if (field.name === 'deployment_types') {
          return true;
        }
        if (field.hidden === true) {
          // Hide fields marked as hidden in provider settings
          return true;
        }
        if (field.deploymentType) {
          // Hide fields with deploymentType if that type is not in current deployment_types
          // Check both values.deployment_types and initialValues.deployment_types
          // to handle real-time updates when deployment types change in modal
          const currentDeploymentTypes = values.deployment_types || initialValues.deployment_types || [];
          return !currentDeploymentTypes.includes(field.deploymentType);
        }
        return false;
      };

      // Separate fields into regular and advanced
      const regularFields = fields.filter(field => !field.is_advanced);
      const advancedFields = fields.filter(field => field.is_advanced === true);

      // Render field component
      const renderField = field => {
        const isHidden = isFieldHidden(field);
        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderField, {
          field: field,
          value: values[field.id],
          onChange: handleFieldChange,
          errors: errors,
          isHidden: isHidden
        }, field.id);
      };

      // Helper function to get default value for a field
      const getFieldDefault = field => {
        if (field.defaultValue !== undefined) {
          return field.defaultValue;
        }
        if (field.type === 'checkbox-group') {
          return [];
        }
        if (field.type === 'checkbox') {
          return false;
        }
        return '';
      };

      // Helper function to check if a field has a value
      const hasFieldValue = field => {
        const value = values[field.id];
        const defaultValue = getFieldDefault(field);

        // If value is undefined or null, it doesn't have a value
        if (value === undefined || value === null) {
          return false;
        }

        // For arrays, check if it's not empty and different from default
        if (Array.isArray(value)) {
          return value.length > 0 && JSON.stringify(value) !== JSON.stringify(defaultValue);
        }

        // For checkboxes, check if value is different from default (true vs false)
        if (field.type === 'checkbox') {
          return value !== defaultValue;
        }

        // For other types, check if value is not empty and different from default
        return value !== '' && value !== defaultValue;
      };

      // Helper function to reset a field to its default
      const resetField = fieldId => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) {
          return;
        }
        const defaultValue = getFieldDefault(field);
        handleFieldChange(fieldId, defaultValue);
      };
      return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
        children: [regularFields.map(renderField), advancedFields.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.__experimentalToolsPanel, {
          className: "aether-provider-form__tools-panel",
          label: (0,external_wp_i18n_namespaceObject.__)('Advanced settings', 'aether-site-exporter'),
          resetAll: null,
          children: advancedFields.map(field => {
            const isHidden = isFieldHidden(field);
            return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.__experimentalToolsPanelItem, {
              className: "aether-provider-form__tools-panel-item",
              hasValue: () => hasFieldValue(field),
              label: field.label || field.name,
              onDeselect: () => resetField(field.id),
              children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderField, {
                field: field,
                value: values[field.id],
                onChange: handleFieldChange,
                errors: errors,
                isHidden: isHidden
              })
            }, field.id);
          })
        })]
      });
    })(), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      ref: afterFieldsRef,
      className: "aether-provider-form__after-fields",
      "data-provider-id": providerId
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-form__actions",
      style: actionsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-form__submit-button",
        type: "submit",
        variant: "primary",
        isBusy: saving,
        disabled: saving,
        children: saving ? (0,external_wp_i18n_namespaceObject.__)('Saving…', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Save Settings', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        ref: actionsRef,
        className: "aether-provider-form__actions-hook",
        "data-provider-id": providerId
      })]
    })]
  });
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if providerId, fields array length, or initialValues change
/* harmony default export */ const components_ProviderForm = ((0,external_wp_element_namespaceObject.memo)(ProviderForm, (prevProps, nextProps) => {
  return prevProps.providerId === nextProps.providerId && prevProps.fields.length === nextProps.fields.length && JSON.stringify(prevProps.initialValues) === JSON.stringify(nextProps.initialValues);
}));
;// ./assets/src/components/ProviderInstancePanel/index.js
/**
 * Provider Instance Panel Component
 *
 * Displays provider instances in a collapsible panel layout using WordPress PanelBody.
 * Each provider instance is displayed as a collapsible panel with basic info in the header
 * and settings form (deployment types and provider settings) in the body.
 *
 * @package
 */












// Styles for settings form

const deploymentTypesSectionStyle = {
  padding: spacing.md,
  backgroundColor: colors.backgroundLighter,
  borderRadius: borderRadius.sm,
  border: `1px solid ${colors.borderLight}`,
  marginBottom: spacing.lg
};
const sectionTitleStyle = {
  fontSize: fontSize.base,
  fontWeight: fontWeight.semibold,
  color: colors.text,
  marginTop: 0,
  marginBottom: spacing.md
};
const deploymentTypesDescriptionStyle = {
  fontSize: fontSize.sm,
  color: colors.textSecondary,
  marginBottom: spacing.md
};
const deleteButtonContainerStyle = {
  ...createFlexStyle('row', spacing.md),
  justifyContent: 'flex-end',
  marginTop: spacing.lg,
  paddingTop: spacing.lg,
  borderTop: `1px solid ${colors.borderLight}`
};

// Styles - extracted to module level for performance
const panelHeaderStyle = {
  ...createFlexStyle('row', spacing.md),
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: spacing.md,
  width: '100%'
};
const nameStyle = {
  fontSize: fontSize.base,
  fontWeight: fontWeight.semibold,
  color: colors.text,
  cursor: 'pointer',
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: borderRadius.sm,
  transition: 'background-color 0.2s ease',
  flex: '0 1 auto',
  minWidth: '150px'
};
const nameInputStyle = {
  fontSize: fontSize.base,
  fontWeight: fontWeight.semibold,
  padding: `${spacing.xs} ${spacing.sm}`,
  border: `2px solid ${colors.primary}`,
  borderRadius: borderRadius.sm,
  outline: 'none',
  transition: 'border-color 0.2s ease',
  width: '200px',
  flex: '0 0 auto'
};
const providerTypeTagStyle = {
  fontSize: fontSize.xs,
  fontWeight: fontWeight.medium,
  padding: '4px 8px',
  borderRadius: borderRadius.sm,
  backgroundColor: '#000',
  color: '#fff',
  display: 'inline-block',
  flex: '0 0 auto'
};
const deploymentTypesContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing.xs,
  flex: '1 1 auto',
  minWidth: '200px'
};
const toggleContainerStyle = {
  flex: '0 0 auto'
};
const panelBodyContentStyle = {
  ...createFlexStyle('column', spacing.lg),
  paddingTop: spacing.md
};

/**
 * Get color styling for a deployment type tag
 *
 * @param {string} deploymentType Deployment type identifier
 * @return {Object} Style object with backgroundColor and color
 */
const getDeploymentTypeTagStyle = deploymentType => {
  const baseStyle = {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    padding: '3px 8px',
    borderRadius: borderRadius.sm,
    display: 'inline-block'
  };

  // Assign different colors based on deployment type using WordPress statusBadgeStyles
  switch (deploymentType) {
    case DEPLOYMENT_TYPES.STATIC_SITE:
      return {
        ...baseStyle,
        ...statusBadgeStyles.success
      };
    case DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE:
      return {
        ...baseStyle,
        ...statusBadgeStyles.info
      };
    case DEPLOYMENT_TYPES.EDGE_FUNCTIONS:
      return {
        ...baseStyle,
        ...statusBadgeStyles.warning
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: colors.backgroundLighter,
        color: colors.textSecondary
      };
  }
};

/**
 * Provider Instance Panel Component
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.provider Provider metadata with settingsFields.
 * @param {Object}   props.instance Instance config.
 * @param {Function} props.onToggle Callback to toggle enabled state.
 * @param {Function} props.onDelete Callback to delete instance.
 * @param {Function} props.onRename Callback to rename instance.
 * @param {Function} props.onSave   Callback to save config changes.
 * @return {JSX.Element} Rendered component.
 */
function ProviderInstancePanel({
  provider,
  instance,
  onToggle,
  onDelete,
  onRename,
  onSave
}) {
  const [isEditing, setIsEditing] = (0,external_wp_element_namespaceObject.useState)(false);
  const [editedName, setEditedName] = (0,external_wp_element_namespaceObject.useState)(instance.config.instance_name || '');
  const [config, setConfig] = (0,external_wp_element_namespaceObject.useState)(instance.config);
  const [saveError, setSaveError] = (0,external_wp_element_namespaceObject.useState)(null);
  const inputRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const beforeFormRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const afterFormRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Update config when instance config changes
  // Use a ref to track if we're in the middle of a local update
  const isLocalUpdateRef = (0,external_wp_element_namespaceObject.useRef)(false);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    // Only sync from parent if we're not in the middle of a local update
    if (!isLocalUpdateRef.current) {
      setConfig(instance.config);
    }
    // Reset the flag after sync
    isLocalUpdateRef.current = false;
  }, [instance.config]);

  // Focus input when editing starts
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  const handleNameSave = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    if (editedName.trim() === '') {
      setEditedName(instance.config.instance_name || '');
      setIsEditing(false);
      return;
    }

    // Don't save if name hasn't changed
    if (editedName === instance.config.instance_name) {
      setIsEditing(false);
      return;
    }

    // Save the new name via API
    if (onRename) {
      try {
        await onRename(instance.instanceId, editedName);
      } catch (error) {
        console.error('Failed to rename instance:', error);
        // Revert to original name on error
        setEditedName(instance.config.instance_name || '');
      }
    }
    setIsEditing(false);
  }, [editedName, instance.config.instance_name, instance.instanceId, onRename]);
  const handleNameCancel = (0,external_wp_element_namespaceObject.useCallback)(() => {
    setEditedName(instance.config.instance_name || '');
    setIsEditing(false);
  }, [instance.config.instance_name]);
  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    const confirmed = confirm((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: instance name */
    (0,external_wp_i18n_namespaceObject.__)('Are you sure you want to delete the instance "%s"? This cannot be undone.', 'aether-site-exporter'), instance.config.instance_name));
    if (confirmed) {
      onDelete();
    }
  };

  // Get enabled deployment types from local config state (for reactivity)
  // Memoize to prevent unnecessary headerContent recreation
  const enabledDeploymentTypes = (0,external_wp_element_namespaceObject.useMemo)(() => config?.deployment_types || [], [config?.deployment_types]);

  // Get provider metadata
  const providerMetadata = provider?.metadata || {};
  const supportedDeploymentTypes = providerMetadata.supportedDeploymentTypes || [];
  const settingsFields = provider?.settingsFields || [];

  // Deployment type labels
  const deploymentTypeLabels = {
    [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Static Site', 'aether-site-exporter'),
    [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Blueprint Bundle', 'aether-site-exporter'),
    [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Edge Functions', 'aether-site-exporter')
  };
  const handleFormChange = (0,external_wp_element_namespaceObject.useCallback)(newValues => {
    // Include deployment_types in the merged config
    setConfig({
      ...newValues,
      // eslint-disable-next-line camelcase
      deployment_types: config.deployment_types || []
    });
  }, [config.deployment_types]);
  const handleDeploymentTypeToggle = (0,external_wp_element_namespaceObject.useCallback)((deploymentType, checked) => {
    setConfig(prevConfig => {
      const currentTypes = prevConfig.deployment_types || [];
      const newTypes = checked ? [...currentTypes, deploymentType] : currentTypes.filter(t => t !== deploymentType);
      return {
        ...prevConfig,
        // eslint-disable-next-line camelcase
        deployment_types: newTypes
      };
    });
  }, []);
  const handleFormSubmit = async values => {
    if (!instance.instanceId) {
      return;
    }
    setSaveError(null);
    try {
      const configResponse = await (0,utils_api/* default */.Ay)({
        path: '/aether/site-exporter/settings?key=providers'
      });
      if (!configResponse.success) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('Failed to load current settings', 'aether-site-exporter'));
      }
      const providerConfigs = configResponse.value || {};
      const currentConfig = providerConfigs[instance.instanceId] || {};
      const enabled = currentConfig.enabled !== false; // Default to enabled

      // Include deployment_types from config state
      const updatedConfig = {
        ...values,
        enabled,
        // eslint-disable-next-line camelcase
        deployment_types: config.deployment_types || []
      };

      // Save with enabled state preserved
      const updatedProviders = {
        ...providerConfigs,
        [instance.instanceId]: updatedConfig
      };
      const saveResponse = await (0,utils_api/* default */.Ay)({
        path: '/aether/site-exporter/settings',
        method: 'POST',
        data: {
          key: 'providers',
          value: updatedProviders
        }
      });
      if (!saveResponse.success) {
        throw new Error(saveResponse.message || 'Failed to save settings');
      }

      // Notify parent of successful save
      if (onSave) {
        onSave(instance.instanceId, updatedConfig);
      }
    } catch (err) {
      console.error('Failed to save provider config:', err);
      setSaveError(err.message || (0,external_wp_i18n_namespaceObject.__)('Failed to save settings', 'aether-site-exporter'));
      throw err;
    }
  };

  // Trigger hooks when panel is open and config/provider changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!provider || !instance.instanceId) {
      return;
    }
    const {
      id
    } = provider;
    const hookContext = {
      providerId: id,
      instanceId: instance.instanceId,
      provider,
      config,
      onConfigChange: handleFormChange
    };

    // Trigger before_form hook
    if (beforeFormRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.panel.before_form', hookContext);
    }

    // Trigger after_form hook
    if (afterFormRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.panel.after_form', hookContext);
    }
  }, [provider, config, handleFormChange, instance.instanceId]);

  // Custom header content - memoized to prevent title disappearing on re-renders
  const headerContent = (0,external_wp_element_namespaceObject.useMemo)(() => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-provider-instance-panel__header-content",
    style: panelHeaderStyle,
    children: [isEditing ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("input", {
      ref: inputRef,
      className: "aether-provider-instance-panel__name-input",
      type: "text",
      value: editedName,
      onChange: e => setEditedName(e.target.value),
      onBlur: handleNameSave,
      onKeyDown: e => {
        if (e.key === 'Enter') {
          handleNameSave();
        } else if (e.key === 'Escape') {
          handleNameCancel();
        }
      },
      style: nameInputStyle,
      onClick: e => e.stopPropagation()
    }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-instance-panel__name",
      style: nameStyle,
      onClick: e => {
        e.stopPropagation();
        setIsEditing(true);
      },
      onKeyDown: e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          setIsEditing(true);
        }
      },
      onMouseEnter: e => {
        e.currentTarget.style.backgroundColor = colors.backgroundLighter;
      },
      onMouseLeave: e => {
        e.currentTarget.style.backgroundColor = 'transparent';
      },
      role: "button",
      tabIndex: 0,
      title: (0,external_wp_i18n_namespaceObject.__)('Click to edit name', 'aether-site-exporter'),
      children: config.instance_name || instance.config.instance_name
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
      className: "aether-provider-instance-panel__type-tag",
      style: providerTypeTagStyle,
      children: providerMetadata.name || provider?.id || ''
    }), enabledDeploymentTypes.length > 0 ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-instance-panel__deployment-types",
      style: deploymentTypesContainerStyle,
      children: enabledDeploymentTypes.map(deploymentType => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        className: `aether-provider-instance-panel__deployment-type-tag aether-provider-instance-panel__deployment-type-tag--${deploymentType}`,
        style: getDeploymentTypeTagStyle(deploymentType),
        children: DEPLOYMENT_TYPE_LABELS[deploymentType] || deploymentType
      }, deploymentType))
    }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
      style: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        fontStyle: 'italic',
        flex: '1 1 auto'
      },
      children: (0,external_wp_i18n_namespaceObject.__)('None', 'aether-site-exporter')
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-instance-panel__toggle",
      style: toggleContainerStyle,
      onClick: e => e.stopPropagation(),
      onKeyDown: e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
        }
      },
      role: "presentation",
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ToggleControl, {
        className: "aether-provider-instance-panel__toggle-control",
        label: (0,external_wp_i18n_namespaceObject.__)('Enable this instance', 'aether-site-exporter'),
        checked: config.enabled !== false,
        onChange: enabled => {
          // Mark that we're doing a local update
          isLocalUpdateRef.current = true;
          // Update local state immediately for reactivity
          setConfig(prev => ({
            ...prev,
            enabled
          }));
          // Then call the parent callback
          onToggle(enabled);
        },
        __nextHasNoMarginBottom: true
      })
    })]
  }), [isEditing, editedName, config.instance_name, instance.config.instance_name, config.enabled, enabledDeploymentTypes, providerMetadata.name, provider?.id, handleNameSave, handleNameCancel, onToggle]);
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.PanelBody, {
    className: "aether-provider-instance-panel",
    title: headerContent,
    initialOpen: false,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-instance-panel__body",
      style: panelBodyContentStyle,
      children: [saveError && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(StatusNotice, {
        status: "error",
        message: saveError,
        isDismissible: true,
        onRemove: () => setSaveError(null),
        className: "aether-provider-instance-panel__notice"
      }), supportedDeploymentTypes.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-instance-panel__deployment-types",
        style: deploymentTypesSectionStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
          className: "aether-provider-instance-panel__deployment-types-title",
          style: sectionTitleStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Deployment Types', 'aether-site-exporter')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-provider-instance-panel__deployment-types-description",
          style: deploymentTypesDescriptionStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Select which deployment types this provider instance should handle.', 'aether-site-exporter')
        }), supportedDeploymentTypes.map(deploymentType => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
          className: "aether-provider-instance-panel__deployment-type-checkbox",
          label: deploymentTypeLabels[deploymentType],
          checked: config.deployment_types?.includes(deploymentType) || false,
          onChange: checked => handleDeploymentTypeToggle(deploymentType, checked)
        }, deploymentType))]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        ref: beforeFormRef,
        className: "aether-provider-panel__before-form",
        "data-provider-id": provider?.id,
        "data-instance-id": instance.instanceId
      }), settingsFields.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProviderForm, {
        providerId: provider?.id,
        fields: settingsFields,
        initialValues: {
          ...config,
          // Include deployment_types in initialValues for reactive field visibility
          // eslint-disable-next-line camelcase
          deployment_types: config.deployment_types || []
        },
        onChange: handleFormChange,
        onSubmit: handleFormSubmit
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        ref: afterFormRef,
        className: "aether-provider-panel__after-form",
        "data-provider-id": provider?.id,
        "data-instance-id": instance.instanceId
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-instance-panel__delete-container",
        style: deleteButtonContainerStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
          className: "aether-provider-instance-panel__delete-button",
          variant: "secondary",
          isDestructive: true,
          onClick: handleDelete,
          icon: library_trash,
          children: (0,external_wp_i18n_namespaceObject.__)('Delete Instance', 'aether-site-exporter')
        })
      })]
    })
  });
}
;// ./node_modules/uuid/dist/native.js
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
/* harmony default export */ const dist_native = ({ randomUUID });

;// ./node_modules/uuid/dist/rng.js
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
}

;// ./node_modules/uuid/dist/stringify.js

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
/* harmony default export */ const dist_stringify = ((/* unused pure expression or super */ null && (stringify)));

;// ./node_modules/uuid/dist/v4.js



function _v4(options, buf, offset) {
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
    if (dist_native.randomUUID && !buf && !options) {
        return dist_native.randomUUID();
    }
    return _v4(options, buf, offset);
}
/* harmony default export */ const dist_v4 = (v4);

;// ./assets/src/components/ModalActions/index.js
/**
 * Modal Actions Component
 *
 * Reusable footer actions component for modals.
 * Provides consistent button layout and spacing.
 *
 * @package
 */




// Styles - extracted to module level for performance

const actionsContainerStyle = {
  display: 'flex',
  gap: spacing.sm,
  justifyContent: 'flex-end',
  marginTop: spacing.lg
};

/**
 * ModalActions Component
 *
 * @param {Object}      props                Component props
 * @param {Function}    props.onCancel       Cancel button handler
 * @param {Function}    props.onSubmit       Submit button handler
 * @param {string}      props.cancelLabel    Cancel button label
 * @param {string}      props.submitLabel    Submit button label
 * @param {boolean}     props.isSubmitting   Whether submit is in progress
 * @param {boolean}     props.submitDisabled Whether submit button is disabled
 * @param {string}      props.submitVariant  Submit button variant (primary, secondary, etc.)
 * @param {JSX.Element} props.children       Optional additional action buttons
 * @param {string}      props.className      Optional additional CSS class
 * @return {JSX.Element} Rendered modal actions
 */
function ModalActions({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancel',
  submitLabel = 'Submit',
  isSubmitting = false,
  submitDisabled = false,
  submitVariant = 'primary',
  children = null,
  className = ''
}) {
  const containerClassName = `aether-modal-actions ${className}`.trim();
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: containerClassName,
    style: actionsContainerStyle,
    children: [children, onCancel && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
      className: "aether-modal-actions__cancel",
      variant: "secondary",
      onClick: onCancel,
      disabled: isSubmitting,
      children: cancelLabel
    }), onSubmit && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
      className: "aether-modal-actions__submit",
      variant: submitVariant,
      onClick: onSubmit,
      isBusy: isSubmitting,
      disabled: submitDisabled || isSubmitting,
      children: submitLabel
    })]
  });
}
;// ./assets/src/components/AddProviderInstanceModal/index.js
/**
 * Add Provider Instance Modal Component
 *
 * Modal for creating a new provider instance.
 * Shows provider type selector and instance name input.
 *
 * @package
 */




// eslint-disable-next-line import/no-unresolved




// Styles - extracted to module level for performance

const AddProviderInstanceModal_formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg
};

/**
 * Add Provider Instance Modal Component.
 *
 * @param {Object}   props           Component props.
 * @param {boolean}  props.isOpen    Whether modal is open.
 * @param {Function} props.onClose   Callback to close modal.
 * @param {Array}    props.providers Array of available provider types.
 * @param {Function} props.onCreate  Callback to create instance (instanceId, providerType, instanceName).
 * @return {JSX.Element|null} Rendered component.
 */
function AddProviderInstanceModal({
  isOpen,
  onClose,
  providers,
  onCreate
}) {
  const [selectedProviderType, setSelectedProviderType] = (0,external_wp_element_namespaceObject.useState)('');
  const [instanceName, setInstanceName] = (0,external_wp_element_namespaceObject.useState)('');
  const [isCreating, setIsCreating] = (0,external_wp_element_namespaceObject.useState)(false);
  const handleCreate = async () => {
    if (!selectedProviderType || !instanceName.trim()) {
      return;
    }

    // Generate UUID client-side for instant feedback
    const instanceId = `${selectedProviderType}:${dist_v4()}`;
    setIsCreating(true);
    try {
      await onCreate(instanceId, selectedProviderType, instanceName.trim());
      // Reset form and close
      setSelectedProviderType('');
      setInstanceName('');
      onClose();
    } catch (error) {
      console.error('Failed to create instance:', error);
      // eslint-disable-next-line no-alert
      alert((0,external_wp_i18n_namespaceObject.__)('Failed to create instance. Please try again.', 'aether-site-exporter'));
    } finally {
      setIsCreating(false);
    }
  };
  const handleClose = () => {
    setSelectedProviderType('');
    setInstanceName('');
    onClose();
  };
  if (!isOpen) {
    return null;
  }
  const selectedProvider = providers.find(p => p.id === selectedProviderType);
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Modal, {
    className: "aether-add-provider-instance-modal",
    title: (0,external_wp_i18n_namespaceObject.__)('Add Provider Instance', 'aether-site-exporter'),
    onRequestClose: handleClose,
    size: "medium",
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-add-provider-instance-modal__form",
      style: AddProviderInstanceModal_formStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.SelectControl, {
        className: "aether-add-provider-instance-modal__provider-select",
        label: (0,external_wp_i18n_namespaceObject.__)('Provider Type', 'aether-site-exporter'),
        value: selectedProviderType,
        onChange: setSelectedProviderType,
        options: [{
          label: (0,external_wp_i18n_namespaceObject.__)('Select a provider…', 'aether-site-exporter'),
          value: ''
        }, ...providers.map(provider => ({
          label: provider.name,
          value: provider.id
        }))],
        help: selectedProvider ? selectedProvider.description : (0,external_wp_i18n_namespaceObject.__)('Choose which type of provider to create', 'aether-site-exporter')
      }), selectedProviderType && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        className: "aether-add-provider-instance-modal__instance-name",
        label: (0,external_wp_i18n_namespaceObject.__)('Instance Name', 'aether-site-exporter'),
        value: instanceName,
        onChange: setInstanceName,
        placeholder: (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: provider name */
        (0,external_wp_i18n_namespaceObject.__)('e.g., "%s Production"', 'aether-site-exporter'), selectedProvider?.name || 'My'),
        help: (0,external_wp_i18n_namespaceObject.__)('Choose a descriptive name for this instance', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ModalActions, {
        onCancel: handleClose,
        onSubmit: handleCreate,
        cancelLabel: (0,external_wp_i18n_namespaceObject.__)('Cancel', 'aether-site-exporter'),
        submitLabel: (0,external_wp_i18n_namespaceObject.__)('Create Instance', 'aether-site-exporter'),
        isSubmitting: isCreating,
        isSubmitDisabled: !selectedProviderType || !instanceName.trim() || isCreating,
        className: "aether-add-provider-instance-modal__actions"
      })]
    })
  });
}
;// ./assets/src/components/LoadingSpinner/index.js
/**
 * Loading Spinner Component
 *
 * Reusable loading indicator with optional message.
 * Wraps WordPress Spinner component with consistent styling and layout.
 *
 * @package
 */




// Styles - extracted to module level for performance

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.md,
  padding: spacing.xl,
  textAlign: 'center'
};
const messageStyle = {
  fontSize: fontSize.base,
  color: colors.textSecondary,
  margin: 0
};

/**
 * LoadingSpinner Component
 *
 * @param {Object} props           Component props
 * @param {string} props.message   Optional loading message to display
 * @param {string} props.className Optional additional CSS class
 * @param {Object} props.style     Optional inline style overrides
 * @return {JSX.Element} Rendered loading spinner
 */
function LoadingSpinner({
  message = '',
  className = '',
  style = {}
}) {
  const containerClassName = `aether-loading-spinner ${className}`.trim();
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: containerClassName,
    style: {
      ...containerStyle,
      ...style
    },
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {
      className: "aether-loading-spinner__spinner"
    }), message && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
      className: "aether-loading-spinner__message",
      style: messageStyle,
      children: message
    })]
  });
}
;// ./assets/src/components/SectionHeader/index.js
/**
 * Section Header Component
 *
 * Reusable section header with title and optional description.
 * Provides consistent styling across admin pages.
 *
 * @package
 */



// Styles - extracted to module level for performance

const sectionHeaderStyle = {
  ...commonStyles.sectionHeader,
  backgroundColor: colors.white
};
const headerTitleStyle = {
  margin: 0,
  fontSize: '1.3em',
  lineHeight: 1.4,
  color: colors.text,
  backgroundColor: colors.white
};
const headerDescriptionStyle = {
  margin: '0.5rem 0 0',
  color: colors.textMuted,
  fontSize: fontSize.base
};

/**
 * SectionHeader Component
 *
 * @param {Object}      props             Component props
 * @param {string}      props.title       Section title
 * @param {string}      props.description Optional section description
 * @param {string}      props.className   Optional additional CSS class
 * @param {JSX.Element} props.actions     Optional action buttons/elements to display in header
 * @return {JSX.Element} Rendered section header
 */
function SectionHeader({
  title,
  description = '',
  className = '',
  actions = null
}) {
  const headerClassName = `aether-section-header ${className}`.trim();
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: headerClassName,
    style: sectionHeaderStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-section-header__content",
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h2", {
        className: "aether-section-header__title",
        style: headerTitleStyle,
        children: title
      }), description && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-section-header__description",
        style: headerDescriptionStyle,
        children: description
      })]
    }), actions && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-section-header__actions",
      children: actions
    })]
  });
}
;// ./assets/src/services/ProviderSettingsAPI.js
/**
 * Provider Settings API Service
 *
 * Service class for managing provider settings via REST API.
 * Extracted from useProviderSettings hook for testability.
 *
 * @package
 */

/**
 * Merge provider configurations with preservation options
 *
 * Pure function for merging provider configs.
 *
 * @param {Object}  currentConfig                   Current provider configuration
 * @param {Object}  updatedConfig                   Updated configuration
 * @param {Object}  options                         Merge options
 * @param {boolean} options.preserveEnabled         Preserve existing enabled state
 * @param {boolean} options.preserveDeploymentTypes Preserve existing deployment_types
 * @return {Object} Merged configuration
 */
function mergeProviderConfig(currentConfig, updatedConfig, options = {}) {
  const {
    preserveEnabled = false,
    preserveDeploymentTypes = false
  } = options;

  // Start with existing config to preserve all fields, then overlay updates
  const mergedConfig = {
    ...(currentConfig || {}),
    ...(updatedConfig || {})
  };

  // Preserve enabled state if requested
  if (preserveEnabled && currentConfig && 'enabled' in currentConfig) {
    mergedConfig.enabled = currentConfig.enabled;
  }

  // Preserve deployment_types if requested and exists
  if (preserveDeploymentTypes && currentConfig && 'deployment_types' in currentConfig) {
    mergedConfig.deployment_types = currentConfig.deployment_types;
  }
  return mergedConfig;
}

/**
 * Merge multiple provider updates
 *
 * Pure function for merging multiple provider config updates.
 *
 * @param {Object} currentProviders Current provider configurations
 * @param {Object} updates          Object mapping provider IDs to their updated configs
 * @return {Object} Updated provider configurations
 */
function mergeMultipleProviders(currentProviders, updates) {
  if (!updates || typeof updates !== 'object') {
    return currentProviders || {};
  }
  return {
    ...(currentProviders || {}),
    ...Object.entries(updates).reduce((acc, [providerId, config]) => {
      acc[providerId] = {
        ...(currentProviders?.[providerId] || {}),
        ...(config || {})
      };
      return acc;
    }, {})
  };
}

/**
 * Provider Settings API Service Class
 *
 * Handles all provider settings operations via REST API.
 */
class ProviderSettingsAPI {
  /**
   * Create API service instance
   *
   * @param {Function} apiFetch WordPress apiFetch function (injectable for testing)
   */
  constructor(apiFetch) {
    this.apiFetch = apiFetch;
  }

  /**
   * Fetch all provider settings
   *
   * @return {Promise<Object>} Provider configurations object
   */
  async fetchAll() {
    const response = await this.apiFetch({
      path: '/aether/site-exporter/settings?key=providers'
    });
    if (!response.success) {
      throw new Error('Failed to load provider settings');
    }
    return response.value || {};
  }

  /**
   * Save provider settings
   *
   * @param {Object} providers Provider configurations to save
   * @return {Promise<Object>} Saved provider configurations
   */
  async save(providers) {
    const response = await this.apiFetch({
      path: '/aether/site-exporter/settings',
      method: 'POST',
      data: {
        key: 'providers',
        value: providers
      }
    });
    if (!response.success) {
      throw new Error('Failed to save provider settings');
    }
    return providers;
  }

  /**
   * Update a single provider's configuration
   *
   * @param {string} providerId    Provider ID
   * @param {Object} updatedConfig Updated configuration
   * @param {Object} options       Merge options
   * @return {Promise<Object>} Updated provider configurations
   */
  async update(providerId, updatedConfig, options = {}) {
    // Fetch current settings
    const currentProviders = await this.fetchAll();
    const currentConfig = currentProviders[providerId] || {};

    // Merge configurations using pure function
    const mergedConfig = mergeProviderConfig(currentConfig, updatedConfig, options);

    // Build updated providers object
    const updatedProviders = {
      ...currentProviders,
      [providerId]: mergedConfig
    };

    // Save to API
    return await this.save(updatedProviders);
  }

  /**
   * Update multiple providers at once
   *
   * @param {Object} updates Object mapping provider IDs to their updated configs
   * @return {Promise<Object>} Updated provider configurations
   */
  async updateMultiple(updates) {
    // Fetch current settings
    const currentProviders = await this.fetchAll();

    // Merge all updates using pure function
    const updatedProviders = mergeMultipleProviders(currentProviders, updates);

    // Save to API
    return await this.save(updatedProviders);
  }

  /**
   * Toggle provider enabled state
   *
   * @param {string}  providerId Provider ID
   * @param {boolean} enabled    New enabled state
   * @return {Promise<Object>} Updated provider configurations
   */
  async toggleEnabled(providerId, enabled) {
    return await this.update(providerId, {
      enabled
    });
  }

  /**
   * Create a new provider instance
   *
   * @param {string} instanceId   Client-generated instance ID (provider_type:uuid)
   * @param {string} providerType Provider type (e.g., 'local-filesystem')
   * @param {string} instanceName User-friendly instance name
   * @return {Promise<Object>} Created instance info
   */
  async createInstance(instanceId, providerType, instanceName) {
    const response = await this.apiFetch({
      path: `/aether/site-exporter/providers/${providerType}/instances`,
      method: 'POST',
      data: {
        instance_id: instanceId,
        instance_name: instanceName
      }
    });
    if (!response.success) {
      throw new Error('Failed to create provider instance');
    }
    return response;
  }

  /**
   * Rename a provider instance
   *
   * @param {string} instanceId   Instance ID
   * @param {string} instanceName New instance name
   * @return {Promise<Object>} Updated provider configurations
   */
  async renameInstance(instanceId, instanceName) {
    return await this.update(instanceId, {
      instance_name: instanceName
    });
  }

  /**
   * Delete a provider instance
   *
   * @param {string} instanceId Instance ID
   * @return {Promise<Object>} Updated provider configurations
   */
  async deleteInstance(instanceId) {
    // Delete via REST API
    await this.apiFetch({
      path: `/aether/site-exporter/providers/${instanceId}/config`,
      method: 'DELETE'
    });

    // Fetch and return updated settings
    return await this.fetchAll();
  }
}
;// ./assets/src/hooks/useProviderSettings.js
/**
 * Provider Settings Hook
 *
 * Centralized hook for fetching and updating provider settings.
 * Eliminates duplicate code across components that manage provider configurations.
 *
 * Uses ProviderSettingsAPI service for all business logic.
 * Hook provides React state management (loading/error) around service calls.
 *
 * @package
 */





/**
 * Custom hook for managing provider settings
 *
 * @return {Object} Settings management functions and state
 */
function useProviderSettings() {
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);

  // Create service instance with apiFetch (memoized to prevent recreation)
  const api = (0,external_wp_element_namespaceObject.useMemo)(() => new ProviderSettingsAPI((external_wp_apiFetch_default())), []);

  /**
   * Fetch all provider settings
   *
   * @return {Promise<Object>} Provider configurations object
   */
  const fetchProviderSettings = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const providers = await api.fetchAll();
      setLoading(false);
      return providers;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Update a single provider's configuration
   *
   * @param {string}  providerId                      Provider ID
   * @param {Object}  updatedConfig                   Updated configuration for the provider
   * @param {Object}  options                         Options
   * @param {boolean} options.preserveEnabled         Preserve existing enabled state (default: false)
   * @param {boolean} options.preserveDeploymentTypes Preserve existing deployment_types (default: false)
   * @return {Promise<Object>} Updated provider configurations
   */
  const updateProviderConfig = (0,external_wp_element_namespaceObject.useCallback)(async (providerId, updatedConfig, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.update(providerId, updatedConfig, options);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Update multiple providers at once
   *
   * @param {Object} updates Object mapping provider IDs to their updated configs
   * @return {Promise<Object>} Updated provider configurations
   */
  const updateMultipleProviders = (0,external_wp_element_namespaceObject.useCallback)(async updates => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.updateMultiple(updates);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Toggle provider enabled state
   *
   * @param {string}  providerId Provider ID (can be instance ID)
   * @param {boolean} enabled    New enabled state
   * @return {Promise<Object>} Updated provider configurations
   */
  const toggleProviderEnabled = (0,external_wp_element_namespaceObject.useCallback)(async (providerId, enabled) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.toggleEnabled(providerId, enabled);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Create a new provider instance
   *
   * @param {string} instanceId   Client-generated instance ID (provider_type:uuid)
   * @param {string} providerType Provider type (e.g., 'local-filesystem')
   * @param {string} instanceName User-friendly instance name
   * @return {Promise<Object>} Created instance info
   */
  const createProviderInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, providerType, instanceName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createInstance(instanceId, providerType, instanceName);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Rename a provider instance
   *
   * @param {string} instanceId   Instance ID
   * @param {string} instanceName New instance name
   * @return {Promise<Object>} Updated provider configurations
   */
  const renameProviderInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, instanceName) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.renameInstance(instanceId, instanceName);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Delete a provider instance
   *
   * @param {string} instanceId Instance ID
   * @return {Promise<Object>} Updated provider configurations
   */
  const deleteProviderInstance = (0,external_wp_element_namespaceObject.useCallback)(async instanceId => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.deleteInstance(instanceId);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);
  return {
    loading,
    error,
    fetchProviderSettings,
    updateProviderConfig,
    updateMultipleProviders,
    toggleProviderEnabled,
    createProviderInstance,
    renameProviderInstance,
    deleteProviderInstance
  };
}
// EXTERNAL MODULE: ./assets/src/providers/registry/ProviderRegistry.js
var admin_settings_ProviderRegistry = __webpack_require__(825);
;// ./assets/src/admin-settings/ProviderSettings.js
/**
 * Provider Settings Component (Instance-Based)
 *
 * Displays provider types with their instances grouped together.
 * Each provider type section can have multiple named instances.
 *
 * @package
 */













// Styles - extracted to module level for performance

const emptyMessageStyle = {
  color: colors.textSecondary
};
const panelsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: colors.white
};
const emptyStateStyle = {
  padding: spacing.xl,
  textAlign: 'center',
  color: colors.textSecondary,
  fontSize: '0.875rem',
  border: `1px dashed ${colors.borderLight}`,
  borderRadius: '8px'
};

/**
 * Provider Settings Component.
 *
 * @param {Object}   props                 Component props.
 * @param {Object}   props.providerConfigs Provider configurations from parent.
 * @param {Function} props.onConfigsUpdate Callback to update parent configs.
 * @param {Function} props.onNotice        Callback to show notices.
 * @return {JSX.Element} Rendered component.
 */
function ProviderSettings({
  providerConfigs = {},
  onConfigsUpdate,
  onNotice
}) {
  const [providers, setProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [isAddModalOpen, setIsAddModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);

  // Local state for optimistic updates
  const [localConfigs, setLocalConfigs] = (0,external_wp_element_namespaceObject.useState)(providerConfigs);

  // Sync local state when parent prop changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    setLocalConfigs(providerConfigs);
  }, [providerConfigs]);
  const configs = localConfigs;

  // Initialize provider settings hook
  const {
    toggleProviderEnabled,
    createProviderInstance,
    deleteProviderInstance,
    renameProviderInstance
  } = useProviderSettings();
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    // Get providers from JavaScript registry
    const loadProviders = () => {
      // eslint-disable-next-line no-console
      console.log('ProviderSettings: Loading providers...');
      try {
        // Get provider metadata from JavaScript registry
        const allProviders = admin_settings_ProviderRegistry/* default */.A.getAll();
        // eslint-disable-next-line no-console
        console.log('ProviderSettings: Found', allProviders.length, 'providers from registry');

        // If no providers, wait a bit for them to register
        if (allProviders.length === 0) {
          // eslint-disable-next-line no-console
          console.log('ProviderSettings: No providers yet, waiting...');
          let attempts = 0;
          const maxAttempts = 20;
          const interval = setInterval(() => {
            attempts++;
            const foundProviders = admin_settings_ProviderRegistry/* default */.A.getAll();
            // eslint-disable-next-line no-console
            console.log('ProviderSettings: Attempt', attempts, '- Found', foundProviders.length, 'providers');
            if (foundProviders.length > 0 || attempts >= maxAttempts) {
              clearInterval(interval);
              if (foundProviders.length > 0) {
                processProviders(foundProviders);
              } else {
                // eslint-disable-next-line no-console
                console.warn('ProviderSettings: No providers found after waiting');
                setProviders([]);
              }
            }
          }, 100);
          return;
        }
        processProviders(allProviders);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('ProviderSettings: Failed to load providers:', error);
      }
    };
    const processProviders = allProviders => {
      // eslint-disable-next-line no-console
      console.log('ProviderSettings: Processing', allProviders.length, 'providers');
      const providerMetadata = allProviders.map(provider => ({
        id: provider.getId(),
        name: provider.getName(),
        description: provider.getDescription?.() || '',
        type: provider.getType?.() || 'generic',
        deployment_types: provider.getSupportedDeploymentTypes?.() || [],
        settings_fields: provider.getProviderSpecificConfigFields?.() || []
      }));

      // eslint-disable-next-line no-console
      console.log('ProviderSettings: Processed providers:', providerMetadata.map(p => p.id));
      setProviders(providerMetadata);
    };
    loadProviders();

    // Configs are now managed by parent component
    // If parent hasn't loaded them yet, trigger initial load
    if (onConfigsUpdate && Object.keys(configs).length === 0) {
      external_wp_apiFetch_default()({
        path: '/aether/site-exporter/settings?key=providers'
      }).then(configsResponse => {
        if (configsResponse.success && configsResponse.value) {
          onConfigsUpdate(configsResponse.value);
        }
      }).catch(error => {
        console.error('Failed to load provider configurations:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onConfigsUpdate, configs]);

  // Create flat list of all instances with provider metadata
  const allInstances = Object.entries(configs).map(([instanceId, config]) => {
    const providerType = config.provider_type || instanceId.split(':')[0];
    const provider = providers.find(p => p.id === providerType);
    return {
      instanceId,
      config,
      provider: provider || {
        name: providerType,
        id: providerType
      }
    };
  });
  const handleCreateInstanceConfirm = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, providerType, instanceName) => {
    // Get provider metadata for default deployment types
    const provider = providers.find(p => p.id === providerType);
    const defaultDeploymentTypes = provider?.deployment_types || [];

    // Optimistically add the new instance to local state
    const newInstance = {
      provider_type: providerType,
      instance_name: instanceName,
      enabled: false,
      deployment_types: defaultDeploymentTypes
    };
    const optimisticConfigs = {
      ...localConfigs,
      [instanceId]: newInstance
    };
    setLocalConfigs(optimisticConfigs);
    try {
      // Create instance in backend
      await createProviderInstance(instanceId, providerType, instanceName);

      // Update parent state (persists the optimistic update)
      if (onConfigsUpdate) {
        onConfigsUpdate(optimisticConfigs);
      }
    } catch (error) {
      console.error('Failed to create instance:', error);

      // Rollback optimistic update on error
      setLocalConfigs(localConfigs);

      // Re-throw to show error in modal
      throw error;
    }
  }, [createProviderInstance, onConfigsUpdate, localConfigs, providers]);
  const handleToggleInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, enabled) => {
    // Capture original state before optimistic update for rollback
    const originalConfigs = localConfigs;

    // Optimistic update: update local state immediately before API call
    const optimisticConfigs = {
      ...localConfigs,
      [instanceId]: {
        ...localConfigs[instanceId],
        enabled
      }
    };
    setLocalConfigs(optimisticConfigs);
    try {
      const updatedProviders = await toggleProviderEnabled(instanceId, enabled);

      // Merge API response with current local state to preserve all instances
      // This ensures no instances are lost if API response is incomplete
      const mergedConfigs = {
        ...optimisticConfigs,
        ...updatedProviders
      };

      // Update local state with merged result
      setLocalConfigs(mergedConfigs);

      // Update parent configs state with merged result
      if (onConfigsUpdate) {
        onConfigsUpdate(mergedConfigs);
      }
    } catch (error) {
      console.error('Failed to toggle instance:', error);

      // Rollback optimistic update on error
      setLocalConfigs(originalConfigs);

      // Show error notification
      if (onNotice) {
        onNotice(`Failed to toggle instance: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  }, [toggleProviderEnabled, onConfigsUpdate, localConfigs, onNotice]);
  const handleDeleteInstance = (0,external_wp_element_namespaceObject.useCallback)(async instanceId => {
    // Capture original state before optimistic update for rollback
    const originalConfigs = localConfigs;

    // Optimistically remove from local state
    const {
      [instanceId]: removed,
      ...remainingConfigs
    } = localConfigs;
    setLocalConfigs(remainingConfigs);
    try {
      // Delete from backend
      const updatedProviders = await deleteProviderInstance(instanceId);

      // Merge API response with remaining configs to preserve all instances
      // This ensures no instances are lost if API response is incomplete
      const mergedConfigs = {
        ...remainingConfigs,
        ...updatedProviders
      };

      // Update local state with merged result
      setLocalConfigs(mergedConfigs);

      // Update parent state with merged result
      if (onConfigsUpdate) {
        onConfigsUpdate(mergedConfigs);
      }
    } catch (error) {
      console.error('Failed to delete instance:', error);

      // Rollback optimistic update on error
      setLocalConfigs(originalConfigs);

      // Show error notification
      if (onNotice) {
        onNotice(`Failed to delete instance: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  }, [deleteProviderInstance, onConfigsUpdate, localConfigs, onNotice]);
  const handleRenameInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, newName) => {
    // Capture original state before optimistic update for rollback
    const originalConfigs = localConfigs;

    // Optimistic update: update local state immediately before API call
    const optimisticConfigs = {
      ...localConfigs,
      [instanceId]: {
        ...localConfigs[instanceId],
        instance_name: newName
      }
    };
    setLocalConfigs(optimisticConfigs);
    try {
      const updatedProviders = await renameProviderInstance(instanceId, newName);

      // Merge API response with current local state to preserve all instances
      // This ensures no instances are lost if API response is incomplete
      const mergedConfigs = {
        ...optimisticConfigs,
        ...updatedProviders
      };

      // Update local state with merged result
      setLocalConfigs(mergedConfigs);

      // Update parent configs state with merged result
      if (onConfigsUpdate) {
        onConfigsUpdate(mergedConfigs);
      }
    } catch (error) {
      console.error('Failed to rename instance:', error);

      // Rollback optimistic update on error
      setLocalConfigs(originalConfigs);

      // Re-throw to show error in UI
      throw error;
    }
  }, [renameProviderInstance, onConfigsUpdate, localConfigs]);
  const handleConfigSave = (0,external_wp_element_namespaceObject.useCallback)((instanceId, updatedConfig) => {
    // Update local state immediately for reactivity
    const updatedConfigs = {
      ...localConfigs,
      [instanceId]: updatedConfig
    };
    setLocalConfigs(updatedConfigs);

    // Also update parent state
    if (onConfigsUpdate) {
      onConfigsUpdate(updatedConfigs);
    }
  }, [localConfigs, onConfigsUpdate]);
  if (providers.length === 0) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings aether-provider-settings--loading",
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(LoadingSpinner, {})
    });
  }
  if (providers.length === 0) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings aether-provider-settings--empty",
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-settings__empty-message",
        style: emptyMessageStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('No providers available. Install a provider plugin to enable deployment options.', 'aether-site-exporter')
      })
    });
  }
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-provider-settings",
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(SectionHeader, {
      title: (0,external_wp_i18n_namespaceObject.__)('Provider Instances', 'aether-site-exporter'),
      description: (0,external_wp_i18n_namespaceObject.__)('Create and manage multiple instances of each provider type. Each instance can have its own configuration and deployment settings.', 'aether-site-exporter'),
      className: "aether-provider-settings__header",
      actions: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-settings__add-button",
        variant: "tertiary",
        onClick: () => setIsAddModalOpen(true),
        children: (0,external_wp_i18n_namespaceObject.__)('Add Provider Instance', 'aether-site-exporter')
      })
    }), allInstances.length > 0 ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings__panels-container",
      style: panelsContainerStyle,
      children: allInstances.map(instance => {
        const providerType = instance.config.provider_type || instance.instanceId.split(':')[0];
        const fullProvider = providers.find(p => p.id === providerType);
        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderInstancePanel, {
          provider: {
            id: fullProvider?.id || providerType,
            metadata: {
              name: fullProvider?.name || providerType,
              description: fullProvider?.description || '',
              supportedDeploymentTypes: fullProvider?.deployment_types || [],
              type: fullProvider?.type || ''
            },
            settingsFields: (fullProvider?.settings_fields || []).map(field => ({
              ...field,
              id: field.name
            }))
          },
          instance: {
            instanceId: instance.instanceId,
            config: instance.config
          },
          onToggle: enabled => handleToggleInstance(instance.instanceId, enabled),
          onDelete: () => handleDeleteInstance(instance.instanceId),
          onRename: handleRenameInstance,
          onSave: handleConfigSave
        }, instance.instanceId);
      })
    }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings__empty-state",
      style: emptyStateStyle,
      children: (0,external_wp_i18n_namespaceObject.__)('No provider instances configured. Click "Add Provider Instance" to create one.', 'aether-site-exporter')
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(AddProviderInstanceModal, {
      isOpen: isAddModalOpen,
      onClose: () => setIsAddModalOpen(false),
      providers: providers,
      onCreate: handleCreateInstanceConfirm
    })]
  });
}
;// ./assets/src/components/InfoCard/index.js
/**
 * Info Card Component
 *
 * Reusable card component for displaying informational content.
 * Used in help/documentation sections to present organized information.
 *
 * @package
 */



// Styles - extracted to module level for performance

const cardStyle = {
  marginBottom: '2rem',
  padding: '1.5rem',
  background: colors.white,
  border: `1px solid ${colors.borderLighter}`,
  borderRadius: borderRadius.sm
};
const titleStyle = {
  margin: '0 0 1rem',
  fontSize: fontSize.xl,
  fontWeight: fontWeight.semibold,
  color: colors.text
};
const paragraphStyle = {
  margin: '0 0 1rem',
  color: colors.textSecondary,
  lineHeight: 1.6
};
const lastParagraphStyle = {
  ...paragraphStyle,
  ...utilityStyles.noMarginBottom
};

/**
 * InfoCard Component
 *
 * @param {Object}      props           Component props
 * @param {string}      props.title     Card title
 * @param {JSX.Element} props.children  Card content
 * @param {string}      props.className Optional additional CSS class
 * @param {Object}      props.style     Optional style overrides
 * @param {boolean}     props.isLast    Whether this is the last card (removes bottom margin)
 * @return {JSX.Element} Rendered info card
 */
function InfoCard({
  title,
  children,
  className = '',
  style = {},
  isLast = false
}) {
  const cardClassName = `aether-info-card ${className}`.trim();
  const finalCardStyle = isLast ? {
    ...cardStyle,
    ...utilityStyles.noMarginBottom,
    ...style
  } : {
    ...cardStyle,
    ...style
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: cardClassName,
    style: finalCardStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h4", {
      className: "aether-info-card__title",
      style: titleStyle,
      children: title
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-info-card__content",
      children: children
    })]
  });
}

// Export helper components for common content patterns
function InfoParagraph({
  children,
  isLast = false
}) {
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
    className: "aether-info-card__paragraph",
    style: isLast ? lastParagraphStyle : paragraphStyle,
    children: children
  });
}
;// ./assets/src/components/HowItWorks/index.js
/**
 * How It Works Component
 *
 * @package
 */






// Styles - extracted to module level for performance

const sectionStyle = {
  ...commonStyles.section
};
const contentStyle = {
  // maxWidth: '60rem',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
  paddingTop: spacing.lg,
  paddingBottom: spacing.lg
};
const benefitListStyle = {
  margin: '0.5rem 0 0',
  paddingLeft: '1.5rem',
  color: colors.textSecondary,
  lineHeight: 1.8
};
const benefitListItemStyle = {
  marginBottom: '0.5rem'
};
function HowItWorks() {
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-how-it-works",
    style: sectionStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(SectionHeader, {
      title: (0,external_wp_i18n_namespaceObject.__)('How Publishing Works', 'aether-site-exporter'),
      description: (0,external_wp_i18n_namespaceObject.__)('Understanding the Aether publish process.', 'aether-site-exporter'),
      className: "aether-how-it-works__header"
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-how-it-works__content",
      style: contentStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoCard, {
        title: (0,external_wp_i18n_namespaceObject.__)('What Happens When You Publish?', 'aether-site-exporter'),
        className: "aether-how-it-works__item",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoParagraph, {
          isLast: true,
          children: (0,external_wp_i18n_namespaceObject.__)('When you click "Export Site", Aether performs a series of automated steps to sync your WordPress site to your configured providers. The process is designed to be fast, reliable, and error-resistant.', 'aether-site-exporter')
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoCard, {
        title: (0,external_wp_i18n_namespaceObject.__)('Publish Steps', 'aether-site-exporter'),
        className: "aether-how-it-works__item",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ol", {
          className: "aether-how-it-works__steps-list",
          style: benefitListStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "aether-how-it-works__step",
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              className: "aether-how-it-works__step-label",
              children: (0,external_wp_i18n_namespaceObject.__)('Discover Assets:', 'aether-site-exporter')
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('Finds custom plugins, themes, and uploads to include in blueprint bundle.', 'aether-site-exporter')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "aether-how-it-works__step",
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              className: "aether-how-it-works__step-label",
              children: (0,external_wp_i18n_namespaceObject.__)('Discover URLs:', 'aether-site-exporter')
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('Finds all URLs for static site generation.', 'aether-site-exporter')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "aether-how-it-works__step",
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              className: "aether-how-it-works__step-label",
              children: (0,external_wp_i18n_namespaceObject.__)('Pre-Scan Static Site:', 'aether-site-exporter')
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('Fetches HTML pages and extracts assets (CSS, JS, images) to add to URL list.', 'aether-site-exporter')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "aether-how-it-works__step",
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              className: "aether-how-it-works__step-label",
              children: (0,external_wp_i18n_namespaceObject.__)('Create Bundle:', 'aether-site-exporter')
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('Packages custom plugins, themes, and uploads into wp-content.zip archive.', 'aether-site-exporter')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "aether-how-it-works__step",
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              className: "aether-how-it-works__step-label",
              children: (0,external_wp_i18n_namespaceObject.__)('Generate Blueprint:', 'aether-site-exporter')
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('Creates blueprint-bundle.zip with blueprint.json containing your site data.', 'aether-site-exporter')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "aether-how-it-works__step",
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              className: "aether-how-it-works__step-label",
              children: (0,external_wp_i18n_namespaceObject.__)('Upload Blueprint Bundle:', 'aether-site-exporter')
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('Uploads blueprint bundle to configured providers (only if blueprint deployment is enabled).', 'aether-site-exporter')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "aether-how-it-works__step",
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              className: "aether-how-it-works__step-label",
              children: (0,external_wp_i18n_namespaceObject.__)('Upload Static Files:', 'aether-site-exporter')
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('Generates and uploads static HTML/CSS/JS files (only if static site deployment is enabled).', 'aether-site-exporter')]
          })]
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoCard, {
        title: (0,external_wp_i18n_namespaceObject.__)('Blueprint Storage', 'aether-site-exporter'),
        className: "aether-how-it-works__item",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoParagraph, {
          isLast: true,
          children: (0,external_wp_i18n_namespaceObject.__)('Your WordPress site is packaged as a WordPress Playground blueprint - a complete, portable version that can run in any WordPress Playground environment. This blueprint contains your site data as JSON (not a database), along with your custom plugins, themes, and uploads. The blueprint is stored in your configured storage provider and can be loaded into WordPress Playground to recreate your site.', 'aether-site-exporter')
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoCard, {
        title: (0,external_wp_i18n_namespaceObject.__)('Static Site Deployment', 'aether-site-exporter'),
        className: "aether-how-it-works__item",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoParagraph, {
          isLast: true,
          children: (0,external_wp_i18n_namespaceObject.__)('When static site generation is enabled, Aether discovers all URLs, pre-scans pages to extract assets (CSS, JS, images), generates HTML for all pages, rewrites URLs, and uploads everything to your configured hosting provider. Visitors see the fast, secure static version while you maintain full WordPress editing capabilities.', 'aether-site-exporter')
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoCard, {
        title: (0,external_wp_i18n_namespaceObject.__)('Publish Progress', 'aether-site-exporter'),
        className: "aether-how-it-works__item",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoParagraph, {
          isLast: true,
          children: (0,external_wp_i18n_namespaceObject.__)('The publish process shows real-time progress with a task list. Each step is executed independently with automatic retry logic for network errors. You can monitor the progress or close the modal and continue working - the publish will complete in the background.', 'aether-site-exporter')
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoCard, {
        title: (0,external_wp_i18n_namespaceObject.__)('What Gets Published?', 'aether-site-exporter'),
        className: "aether-how-it-works__item",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ul", {
          className: "aether-how-it-works__published-list",
          style: benefitListStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            children: (0,external_wp_i18n_namespaceObject.__)('All published posts and pages', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            children: (0,external_wp_i18n_namespaceObject.__)('Custom post types', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            children: (0,external_wp_i18n_namespaceObject.__)('Categories, tags, and taxonomies', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            children: (0,external_wp_i18n_namespaceObject.__)('Theme files and customizations', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            children: (0,external_wp_i18n_namespaceObject.__)('Active plugins', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            children: (0,external_wp_i18n_namespaceObject.__)('Media files (images, videos)', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            children: (0,external_wp_i18n_namespaceObject.__)('WordPress settings and options', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "aether-how-it-works__published-item",
            style: benefitListItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Site data (as JSON in blueprint)', 'aether-site-exporter')
          })]
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoCard, {
        title: (0,external_wp_i18n_namespaceObject.__)('Troubleshooting', 'aether-site-exporter'),
        className: "aether-how-it-works__item aether-how-it-works__item--last",
        isLast: true,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(InfoParagraph, {
          isLast: true,
          children: (0,external_wp_i18n_namespaceObject.__)('If a publish fails, check the error message in the publish progress modal. Common issues include missing provider configuration, network errors, or insufficient storage. You can retry the publish after fixing the issue. Each step executes independently with automatic retry logic for network errors.', 'aether-site-exporter')
        })
      })]
    })]
  });
}
;// ./assets/src/admin-settings/AdminSettings.js
/**
 * Admin Settings Main Component
 *
 * Main admin settings page container.
 *
 * @package
 */











function AdminSettings() {
  const [isExportModalOpen, setIsExportModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);
  const [providerConfigs, setProviderConfigs] = (0,external_wp_element_namespaceObject.useState)({});
  const [notices, setNotices] = (0,external_wp_element_namespaceObject.useState)([]);

  // Add notice helper
  const addNotice = (0,external_wp_element_namespaceObject.useCallback)((message, status = 'error') => {
    const id = Date.now();
    setNotices(prev => [...prev, {
      id,
      message,
      status,
      isDismissible: true
    }]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotices(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Remove notice helper
  const removeNotice = (0,external_wp_element_namespaceObject.useCallback)(id => {
    setNotices(prev => prev.filter(n => n.id !== id));
  }, []);

  // Load provider configs on mount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const loadConfigs = async () => {
      try {
        const configsResponse = await (0,utils_api/* default */.Ay)({
          path: '/aether/site-exporter/settings?key=providers'
        });
        if (configsResponse.success && configsResponse.value) {
          setProviderConfigs(configsResponse.value);
        }
      } catch (err) {
        console.error('Failed to load provider configs:', err);
      }
    };
    loadConfigs();
  }, []);

  // Callback to update configs when a provider is toggled or configured
  const handleConfigsUpdate = (0,external_wp_element_namespaceObject.useCallback)(updatedConfigs => {
    setProviderConfigs(updatedConfigs);
  }, []);
  const containerStyle = {
    padding: '1.25rem',
    maxWidth: '100%'
  };
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md
  };
  const headingStyle = {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1
  };
  const sectionsStyle = {
    ...createFlexStyle('column', spacing.lg)
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-admin-settings",
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-admin-settings__header",
      style: headerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h1", {
        className: "aether-admin-settings__heading",
        style: headingStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Aether Site Exporter Settings', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-admin-settings__export-button",
        variant: "primary",
        onClick: () => setIsExportModalOpen(true),
        children: (0,external_wp_i18n_namespaceObject.__)('Export Site', 'aether-site-exporter')
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-admin-settings__sections",
      style: sectionsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(StatusNotice, {
        status: "info",
        message: (0,external_wp_i18n_namespaceObject.__)('Aether Site Exporter allows you to export your WordPress site as a complete package.', 'aether-site-exporter'),
        isDismissible: false,
        className: "aether-admin-settings__notice"
      }), notices.map(notice => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(StatusNotice, {
        status: notice.status,
        message: notice.message,
        isDismissible: notice.isDismissible,
        onRemove: () => removeNotice(notice.id),
        className: "aether-admin-settings__notice"
      }, notice.id)), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderSettings, {
        providerConfigs: providerConfigs,
        onConfigsUpdate: handleConfigsUpdate,
        onNotice: addNotice
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(HowItWorks, {})]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ExportProgressModal, {
      isOpen: isExportModalOpen,
      onClose: () => setIsExportModalOpen(false)
    })]
  });
}
;// ./assets/src/components/ErrorBoundary/index.js
/**
 * Error Boundary Component
 *
 * Catches errors in React component tree and displays a fallback UI
 * instead of crashing the entire application.
 *
 * @package
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
    // Log error details for debugging
    (0,admin_settings_debug/* debugError */.AO)('Error caught by ErrorBoundary:', {
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
 * @package
 */



/**
 * Initialize global error handlers
 */
function initializeErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    (0,admin_settings_debug/* debugError */.AO)('Unhandled promise rejection:', {
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
    (0,admin_settings_debug/* debugError */.AO)('Uncaught error:', {
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
;// ./assets/src/admin-settings/index.js
/**
 * Admin Settings Entry Point
 *
 * Loads providers via dynamic imports and renders the AdminSettings component.
 * Providers are imported directly here rather than via PHP-enqueued scripts
 * to ensure they register before the component queries the provider registry.
 *
 * @package
 */

// Set webpack publicPath before any imports (for asset loading)
// Note: Webpack is configured to never create chunks - all code is bundled into single files
// eslint-disable-next-line camelcase, no-undef
if (true) {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.pluginUrl) {
    const pluginUrl = window.aetherData.pluginUrl;
    // Ensure plugin URL ends with slash
    const publicPath = pluginUrl.endsWith('/') ? pluginUrl + 'assets/build/' : pluginUrl + '/assets/build/';
    // eslint-disable-next-line camelcase, no-undef
    __webpack_require__.p = publicPath;
  }
}






// Initialize global error handlers

initializeErrorHandlers();

// Providers are registered in JavaScript via aether.providers.register hooks.
// JavaScript providers register implementation hooks (aether.provider.upload, aether.provider.test, etc.).

/**
 * Initialize admin settings page.
 *
 * @return {void}
 */
const init = () => {
  const container = document.getElementById('aether-admin-settings');
  if (!container) {
    // eslint-disable-next-line no-console
    console.error('Aether: Container element #aether-admin-settings not found');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('Aether: Initializing admin settings page...');
  try {
    (0,external_wp_element_namespaceObject.render)(/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ErrorBoundary, {
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(PublishProvider, {
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(AdminSettings, {})
      })
    }), container);
    // eslint-disable-next-line no-console
    console.log('Aether: Admin settings page rendered successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Aether: Error rendering admin settings page:', error);
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
/******/ })()
;