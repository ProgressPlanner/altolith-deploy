/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
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
/************************************************************************/

;// external ["wp","hooks"]
const external_wp_hooks_namespaceObject = window["wp"]["hooks"];
;// external ["wp","apiFetch"]
const external_wp_apiFetch_namespaceObject = window["wp"]["apiFetch"];
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_namespaceObject);
;// ./assets/src/utils/api.js
/**
 * API Fetch Utility
 *
 * Wrapper around @wordpress/api-fetch with:
 * - Nonce handling from window.altolithData
 * - Auth header utilities for external APIs
 */



/**
 * Get REST API base URL from window.altolithData or default.
 *
 * @return {string} REST API base URL (without namespace).
 */
function getRestUrl() {
  if (typeof window !== 'undefined' && window.altolithData && window.altolithData.restUrl) {
    return window.altolithData.restUrl;
  }
  return '/wp-json/';
}

/**
 * Get REST API nonce from window.altolithData or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  if (typeof window !== 'undefined' && window.altolithData && window.altolithData.nonce) {
    return window.altolithData.nonce;
  }
  return '';
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
 * Configure API fetch with base URL and nonce.
 * Automatically fetches from window.altolithData if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from window.altolithData if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from window.altolithData if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || getRestUrl();
  const token = nonce || getNonce();
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const api = ((external_wp_apiFetch_default()));
;// ./assets/src/providers/services/fileValidation.js
/**
 * File Validation Utilities
 *
 * Client-side file validation for uploads.
 * Provides instant feedback before hitting the server.
 * PHP still validates as security backstop.
 */

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
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
];

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
function validateFile(file, key) {
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
      response = await api({
        path: '/altolith/deploy/local-storage/upload',
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
    const response = await api({
      path: '/altolith/deploy/local-storage/delete',
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
    const response = await api({
      path: '/altolith/deploy/local-storage/batch-delete',
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
    const response = await api({
      path: `/altolith/deploy/local-storage/download?key=${encodeURIComponent(key)}&static_path=${encodeURIComponent(staticPath)}`,
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
;// ./assets/src/providers/services/storageService.js
/**
 * Storage Service
 *
 * Storage service for local filesystem operations.
 * All operations go through REST API endpoints.
 *
 * Supports adapter pattern for provider-specific upload implementations.
 * Each provider instance can inject its own upload adapter via the
 * 'altolith.storage.service.create' filter, achieving true provider instance isolation.
 *
 */



/**
 * Storage Service class.
 */
class StorageService {
  /**
   * Constructor.
   *
   * @param {string} staticPath    Path for static files storage.
   * @param {Object} config        Optional configuration.
   * @param {Object} uploadAdapter Optional upload adapter with upload() method.
   */
  constructor(staticPath, config = {}, uploadAdapter = null) {
    this.staticPath = staticPath;
    this.config = config;
    this.baseUrl = config.public_url || config.base_url || '';
    this.providerId = config.provider_id || null;
    this.uploadAdapter = uploadAdapter;
  }

  /**
   * Upload a file to storage.
   *
   * Uses the upload adapter if provided, otherwise falls back to filesystem adapter.
   * This enables provider-specific upload implementations while keeping common logic
   * (manifest, dedup, etc.) in the StorageService.
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
    try {
      let result;

      // Use upload adapter if provided (provider-specific upload)
      if (this.uploadAdapter && typeof this.uploadAdapter.upload === 'function') {
        result = await this.uploadAdapter.upload(key, file, {
          ...metadata,
          contentType
        });
      } else {
        // Default: use filesystem adapter directly
        result = await uploadFile(this.staticPath, key, file, {
          contentType,
          cacheControl: metadata.cacheControl || '',
          onProgress: metadata.onProgress || null
        });
      }
      if (!result.success) {
        return result;
      }

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
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// ./assets/src/utils/outputTypes.js
/**
 * Output Types
 *
 * Defines core output types and provides a filterable hook for 3rd-party plugins
 * to register additional output types with their configuration fields.
 *
 * Output types are controlled via global settings, not per-provider toggles.
 * Provider-specific fields (like blueprint_subfolder) are still defined here.
 */




/**
 * Hook name for registering output types.
 *
 * @type {string}
 */
const OUTPUT_TYPES_HOOK = 'altolith.provider.outputTypes';

/**
 * Core output types provided by altolith-deploy.
 *
 * Note: Enable toggles are now in global settings, not per-provider.
 * Only provider-specific configuration fields are defined here.
 *
 * @type {Array<Object>}
 */
const CORE_OUTPUT_TYPES = [{
  id: 'static_site',
  label: (0,external_wp_i18n_namespaceObject.__)('Static Site', 'altolith-deploy'),
  description: (0,external_wp_i18n_namespaceObject.__)('Export your WordPress site as static HTML files.', 'altolith-deploy'),
  // No provider-specific fields for static site
  fields: []
}, {
  id: 'blueprint',
  label: (0,external_wp_i18n_namespaceObject.__)('Blueprint', 'altolith-deploy'),
  description: (0,external_wp_i18n_namespaceObject.__)('Export WordPress Playground blueprint files.', 'altolith-deploy'),
  fields: [{
    id: 'blueprint_subfolder',
    type: 'text',
    label: (0,external_wp_i18n_namespaceObject.__)('Blueprint Subfolder', 'altolith-deploy'),
    default: 'playground',
    placeholder: 'playground',
    help: (0,external_wp_i18n_namespaceObject.__)('Subfolder where blueprint files will be stored (e.g., "playground" creates /playground/blueprint.json).', 'altolith-deploy'),
    validation: {
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: (0,external_wp_i18n_namespaceObject.__)('Subfolder must contain only letters, numbers, hyphens, and underscores.', 'altolith-deploy')
    }
  }]
}];

/**
 * Get all registered output types.
 *
 * Returns core output types plus any added by 3rd-party plugins via the
 * 'altolith.provider.outputTypes' filter.
 *
 * @example
 * // In a 3rd-party plugin:
 * import { addFilter } from '@wordpress/hooks';
 *
 * addFilter('altolith.provider.outputTypes', 'my-plugin', (types) => {
 *     return [...types, {
 *         id: 'media_offload',
 *         label: 'Media Offloading',
 *         fields: [
 *             { id: 'media_subfolder', type: 'text', label: 'Media Subfolder', default: 'wp-content/uploads' },
 *         ],
 *     }];
 * });
 *
 * @return {Array<Object>} Array of output type definitions.
 */
function getOutputTypes() {
  return (0,external_wp_hooks_namespaceObject.applyFilters)(OUTPUT_TYPES_HOOK, CORE_OUTPUT_TYPES);
}

/**
 * Get all output type config fields.
 *
 * Flattens the fields from all output types into a single array,
 * suitable for merging with provider config fields.
 *
 * @return {Array<Object>} Array of config field definitions.
 */
function getOutputTypeFields() {
  const outputTypes = getOutputTypes();
  return outputTypes.flatMap(type => type.fields || []);
}

/**
 * Get an output type by ID.
 *
 * @param {string} typeId Output type ID (e.g., 'static_site', 'blueprint').
 * @return {Object|null} Output type definition or null if not found.
 */
function getOutputType(typeId) {
  const outputTypes = getOutputTypes();
  return outputTypes.find(type => type.id === typeId) || null;
}

/**
 * Get IDs of all registered output types.
 *
 * @return {Array<string>} Array of output type IDs.
 */
function getOutputTypeIds() {
  return getOutputTypes().map(type => type.id);
}

/**
 * Check which output types are enabled based on global settings.
 *
 * Reads from global settings stored in window.altolithData.globalSettings
 * or falls back to defaults.
 *
 * @return {Array<string>} Array of enabled output type IDs.
 */
function getEnabledOutputTypes() {
  // Get global settings from window or use defaults
  const globalSettings = window?.altolithData?.globalSettings || {};
  const enabled = [];

  // Check static site (default: true)
  if (globalSettings.exportStaticSite !== false) {
    enabled.push('static_site');
  }

  // Check blueprint (default: true)
  if (globalSettings.exportBlueprint !== false) {
    enabled.push('blueprint');
  }

  // Allow 3rd-party output types to check their own settings
  const outputTypes = getOutputTypes();
  for (const type of outputTypes) {
    // Skip core types already handled
    if (type.id === 'static_site' || type.id === 'blueprint') {
      continue;
    }

    // Check for a matching global setting (e.g., exportMediaOffload for media_offload)
    const settingKey = `export${type.id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}`;
    if (globalSettings[settingKey] === true) {
      enabled.push(type.id);
    }
  }
  return enabled;
}
;// ./assets/src/providers/local-filesystem/LocalFilesystemProvider.js
/**
 * Local Filesystem Provider
 *
 * Unified provider for local file storage. Handles all output types
 * (static site, blueprint, etc.) based on user configuration.
 *
 * This replaces the separate LocalFilesystemStaticSiteProvider and
 * LocalFilesystemBlueprintBundleProvider with a single, extensible provider.
 */




/**
 * LocalFilesystemProvider class
 *
 * Handles local file storage for all output types.
 * Files are stored relative to WordPress root directory.
 */
class LocalFilesystemProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'local-filesystem';

  /**
   * Provider family for config copying compatibility.
   *
   * @type {string}
   */
  static FAMILY = 'local-filesystem';

  /**
   * Provider name.
   *
   * @type {string}
   */
  static NAME = (0,external_wp_i18n_namespaceObject.__)('Local Filesystem', 'altolith-deploy');

  /**
   * Provider type.
   *
   * @type {string}
   */
  static TYPE = 'local-storage';

  /**
   * Provider description.
   *
   * @type {string}
   */
  static DESCRIPTION = (0,external_wp_i18n_namespaceObject.__)('Store exported files locally in the WordPress directory. No cloud deployment required.', 'altolith-deploy');

  /**
   * Provider icon.
   *
   * @type {string}
   */
  static ICON = '💾';

  /**
   * Whether this provider supports parallel execution with other instances.
   *
   * Local filesystem providers should run sequentially to avoid PHP request
   * contention when multiple instances upload to the same WordPress REST endpoint.
   *
   * @type {boolean}
   */
  static SUPPORTS_PARALLEL_EXECUTION = false;

  /**
   * Core configuration fields (provider-specific).
   *
   * Output type fields are added dynamically via getConfigFields().
   *
   * @type {Array<Object>}
   */
  static CONFIG_FIELDS = [{
    id: 'public_url',
    label: (0,external_wp_i18n_namespaceObject.__)('Public URL', 'altolith-deploy'),
    type: 'text',
    required: false,
    secure: false,
    placeholder: 'https://example.com',
    help: (0,external_wp_i18n_namespaceObject.__)('URL where exported files will be publicly accessible. Used for URL replacements in exported HTML and blueprint references. Leave empty to use WordPress home URL.', 'altolith-deploy'),
    validation: {
      pattern: /^https?:\/\/.+/,
      message: (0,external_wp_i18n_namespaceObject.__)('Public URL must be a valid HTTP or HTTPS URL', 'altolith-deploy')
    }
  }, {
    id: 'base_path',
    label: (0,external_wp_i18n_namespaceObject.__)('Base Directory', 'altolith-deploy'),
    type: 'text',
    required: true,
    secure: false,
    placeholder: 'static/',
    help: (0,external_wp_i18n_namespaceObject.__)('Directory where files will be written (relative to WordPress root). Each export overwrites the previous one.', 'altolith-deploy'),
    validation: {
      pattern: /^[a-zA-Z0-9/_.-]+$/,
      message: (0,external_wp_i18n_namespaceObject.__)('Path must contain only letters, numbers, slashes, hyphens, underscores, and dots.', 'altolith-deploy')
    }
  }];

  /**
   * Get all configuration fields including output type fields.
   *
   * This method merges the provider's core fields with fields from all
   * registered output types (static_site, blueprint, media_offload, etc.).
   *
   * @return {Array<Object>} Complete array of config field definitions.
   */
  static getConfigFields() {
    const coreFields = [...LocalFilesystemProvider.CONFIG_FIELDS];
    const outputTypeFields = getOutputTypeFields();
    return [...coreFields, ...outputTypeFields];
  }
}
/* harmony default export */ const local_filesystem_LocalFilesystemProvider = ((/* unused pure expression or super */ null && (LocalFilesystemProvider)));
;// ./assets/src/providers/registry/ProviderRegistry.js
/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * altolith.providers.register hooks. This replaces the PHP ProviderRegistry.
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
    (0,external_wp_hooks_namespaceObject.doAction)('altolith.providers.registered', providerId, ProviderClass);
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
 * Hook into altolith.providers.register to auto-register providers.
 *
 * When providers call doAction('altolith.providers.register', ProviderClass),
 * this will automatically register them.
 */
(0,external_wp_hooks_namespaceObject.addAction)('altolith.providers.register', 'altolith/provider-registry', ProviderClass => {
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
  window.altolith = window.altolith || {};
  // Only create global registry if it doesn't exist (first bundle to load)
  if (!window.altolith.ProviderRegistry) {
    window.altolith.ProviderRegistry = registry;
  } else {
    // If registry already exists, use the global one and sync providers
    const globalRegistry = window.altolith.ProviderRegistry;
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
;// ./assets/src/providers/local-filesystem/index.js
/**
 * Local Filesystem Provider
 *
 * Unified provider for local file storage. Handles all output types
 * (static site, blueprint, media offload, etc.) based on user configuration.
 *
 * Uses the StorageService adapter pattern for provider instance isolation.
 */







// Register provider class in JavaScript registry
registry_ProviderRegistry.register(LocalFilesystemProvider.ID, LocalFilesystemProvider);

// Also trigger the hook for any listeners
(0,external_wp_hooks_namespaceObject.doAction)('altolith.providers.register', LocalFilesystemProvider);

/**
 * Create upload adapter for local filesystem.
 *
 * The adapter encapsulates the provider-specific upload logic while
 * allowing the StorageService to handle common concerns (manifest, URL building, etc.).
 *
 * @param {string} basePath Base path to upload files to.
 * @return {Object} Upload adapter with upload() method.
 */
function createUploadAdapter(basePath) {
  return {
    /**
     * Upload a file to local filesystem.
     *
     * @param {string}    key     Storage key (file path relative to basePath).
     * @param {File|Blob} file    File to upload.
     * @param {Object}    options Upload options (contentType, etc.).
     * @return {Promise<Object>} Upload result.
     */
    async upload(key, file, options = {}) {
      return uploadFile(basePath, key, file, options);
    }
  };
}

/**
 * Register storage service creation filter.
 *
 * This filter intercepts storage service creation for local-filesystem
 * provider instances. Each instance gets its own StorageService with an adapter
 * configured for its specific basePath, achieving true instance isolation.
 */
(0,external_wp_hooks_namespaceObject.addFilter)('altolith.storage.service.create', 'altolith/local-filesystem', (service, basePath, config, providerId) => {
  // Only handle this provider type
  if (!providerId?.startsWith('local-filesystem')) {
    return service;
  }

  // Skip if this is an old provider ID format (to avoid conflicts during migration)
  if (providerId?.startsWith('local-filesystem-static-site') || providerId?.startsWith('local-filesystem-blueprint-bundle')) {
    return service;
  }

  // Create instance-specific upload adapter using THIS instance's basePath
  const uploadAdapter = createUploadAdapter(basePath);

  // Return new StorageService with the adapter
  // This StorageService is isolated to this specific provider instance
  return new StorageService(basePath, config, uploadAdapter);
}, 10);
/******/ })()
;