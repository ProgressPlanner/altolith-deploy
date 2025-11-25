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
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createNonceMiddleware(nonce));
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
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const api = ((external_wp_apiFetch_default()));
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
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
;// ./assets/src/providers/local-filesystem-blueprint-bundle/LocalFilesystemBlueprintBundleProvider.js
/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Provider for local blueprint bundle file storage.
 * Handles blueprint bundle ZIP files only.
 *
 */




/**
 * LocalFilesystemBlueprintBundleProvider class
 *
 * Handles local file storage for blueprint bundles only.
 * Files are stored in wp-content/aether-exports/.
 */
class LocalFilesystemBlueprintBundleProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'local-filesystem-blueprint-bundle';

  /**
   * Provider name.
   *
   * @type {string}
   */
  static NAME = (0,external_wp_i18n_namespaceObject.__)('Local Filesystem', 'aether-site-exporter');

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
  static DESCRIPTION = (0,external_wp_i18n_namespaceObject.__)('Store blueprint bundle ZIP files locally in the WordPress uploads directory. No cloud deployment required.', 'aether');

  /**
   * Provider icon.
   *
   * @type {string}
   */
  static ICON = '💾';

  /**
   * Deployment type this provider supports.
   *
   * @type {string}
   */
  static DEPLOYMENT_TYPE = DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE;

  /**
   * Configuration fields.
   *
   * @type {Array<Object>}
   */
  static CONFIG_FIELDS = [{
    id: 'export_path',
    label: (0,external_wp_i18n_namespaceObject.__)('Blueprint-bundle file path', 'aether-site-exporter'),
    type: 'text',
    required: true,
    secure: false,
    placeholder: 'blueprint-bundle/bundle.zip',
    help: (0,external_wp_i18n_namespaceObject.__)('Full path to the blueprint bundle ZIP file (relative to WordPress root), including filename.', 'aether'),
    validation: {
      pattern: /^[a-zA-Z0-9/_.-]+\.zip$/,
      message: (0,external_wp_i18n_namespaceObject.__)('Blueprint bundle path must end with .zip and contain only letters, numbers, slashes, hyphens, underscores, and dots.', 'aether')
    }
  }];
}
/* harmony default export */ const local_filesystem_blueprint_bundle_LocalFilesystemBlueprintBundleProvider = ((/* unused pure expression or super */ null && (LocalFilesystemBlueprintBundleProvider)));
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
    (0,external_wp_hooks_namespaceObject.doAction)('aether.providers.registered', providerId, ProviderClass);
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
(0,external_wp_hooks_namespaceObject.addAction)('aether.providers.register', 'aether/provider-registry', ProviderClass => {
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
;// ./assets/src/providers/local-filesystem-blueprint-bundle/index.js
/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Handles blueprint bundle uploads to local filesystem.
 * Single responsibility: copy blueprint bundle file to destinationPath.
 *
 */






// Register provider class in JavaScript registry
registry_ProviderRegistry.register(LocalFilesystemBlueprintBundleProvider.ID, LocalFilesystemBlueprintBundleProvider);

// Also trigger the hook for any listeners
(0,external_wp_hooks_namespaceObject.doAction)('aether.providers.register', LocalFilesystemBlueprintBundleProvider);

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
async function handleUnifiedFileUpload(fileContext) {
  const {
    providerId,
    fileType,
    filePath,
    destinationPath,
    metadata = {}
  } = fileContext;

  // Only handle requests for local-filesystem providers that support blueprint_bundle
  if (!providerId || !providerId.startsWith('local-filesystem')) {
    return;
  }

  // Check if this is a blueprint bundle provider by checking provider ID
  // Since providers have single responsibility, we can check the provider ID directly
  if (!providerId || !providerId.startsWith('local-filesystem-blueprint-bundle')) {
    return;
  }

  // Only process blueprint bundle files, not static files
  if (fileType !== 'blueprint-bundle') {
    return;
  }

  // Create a unique key for this file+provider combination
  const fileKey = `${providerId}:${filePath || destinationPath}`;

  // Check if file is already processed or in progress
  const existingEntry = processedFiles.get(fileKey);
  if (existingEntry === true) {
    // Already processed successfully
    return;
  }
  if (existingEntry instanceof Promise) {
    // Already in progress - wait for it to complete
    try {
      await existingEntry;
    } catch (error) {
      // If the other handler failed, we can try again
      // Remove the failed promise so we can retry
      if (processedFiles.get(fileKey) === existingEntry) {
        processedFiles.delete(fileKey);
      }
    }
    // Check again after waiting
    if (processedFiles.get(fileKey) === true) {
      return;
    }
  }

  // Mark as in progress by storing a promise
  // This promise will be resolved/rejected when processing completes
  const processingPromise = (async () => {
    try {
      // Initialize results tracking for this provider if needed
      if (!uploadResults[providerId]) {
        uploadResults[providerId] = {
          filesProcessed: 0,
          filesUploaded: 0,
          errors: []
        };
      }
      uploadResults[providerId].filesProcessed++;

      // Blueprint bundle is a file path, not content
      if (!filePath) {
        throw new Error('Blueprint bundle file path is required');
      }

      // Trigger PHP action hook for blueprint bundle upload
      // Use destinationPath from abstraction layer
      const response = await api({
        path: '/aether/site-exporter/local-storage/trigger-blueprint-bundle-upload',
        method: 'POST',
        data: {
          instance_id: providerId,
          source_path: filePath,
          destination_path: destinationPath,
          context: metadata
        }
      });
      if (!response.success) {
        fileContext.result = {
          success: false,
          error: response.message || 'Failed to trigger blueprint bundle upload'
        };
        throw new Error(response.message || 'Failed to trigger blueprint bundle upload');
      }
      uploadResults[providerId].filesUploaded++;
      // Set result on fileContext for unified upload system
      fileContext.result = {
        success: true
      };
    } catch (error) {
      uploadResults[providerId].errors.push({
        url: filePath,
        error: error.message || 'Unknown error'
      });
      // Set result on fileContext for unified upload system
      fileContext.result = {
        success: false,
        error: error.message || 'Unknown error'
      };
      // Re-throw so the promise wrapper can handle it
      throw error;
    }
    // Mark as processed after successful completion
    processedFiles.set(fileKey, true);
  })().catch(error => {
    // Remove from map on error so it can be retried
    if (processedFiles.get(fileKey) === processingPromise) {
      processedFiles.delete(fileKey);
    }
    throw error;
  });

  // Store the promise so other handlers can wait for it
  processedFiles.set(fileKey, processingPromise);

  // Wait for processing to complete
  await processingPromise;
}

/**
 * Register unified file upload action hook.
 *
 * Handles blueprint bundle uploads via the unified aether.file.upload action.
 */
(0,external_wp_hooks_namespaceObject.addAction)('aether.file.upload', 'aether/local-filesystem-blueprint-bundle', fileContext => {
  // Initialize promise array on fileContext if not exists
  if (!fileContext._uploadPromises) {
    fileContext._uploadPromises = [];
  }

  // Start upload and add promise to context
  const uploadPromise = handleUnifiedFileUpload(fileContext);
  fileContext._uploadPromises.push(uploadPromise);
}, 10);
/******/ })()
;