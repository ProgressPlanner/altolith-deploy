/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 186:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Ay: () => (/* binding */ api)
});

// UNUSED EXPORTS: configureAPI, createAuthHeaders, setAPINonce

// EXTERNAL MODULE: external ["wp","apiFetch"]
var external_wp_apiFetch_ = __webpack_require__(455);
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_);
;// ./assets/src/utils/getRestUrl.js
/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from window.aetherData or returns a default.
 * Returns base REST API URL (without namespace) so paths can include full namespace.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
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
;// ./assets/src/utils/api.js
/**
 * API Fetch Utility
 *
 * Wrapper around @wordpress/api-fetch with:
 * - Nonce handling from window.aetherData
 * - Auth header utilities for external APIs
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

/***/ }),

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ }),

/***/ 906:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfigStorage: () => (/* binding */ ConfigStorage)
/* harmony export */ });
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(186);
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
/************************************************************************/
var __webpack_exports__ = {};

// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
// EXTERNAL MODULE: ./assets/src/utils/api.js + 1 modules
var api = __webpack_require__(186);
;// ./assets/src/utils/debug.js
/**
 * Debug Utility
 *
 * Centralized logging utility for development debugging.
 * Can be enabled/disabled via window.aetherDebug flag.
 *
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
/* harmony default export */ const utils_debug = ((/* unused pure expression or super */ null && (debugUtil)));
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// ./assets/src/providers/utils/configValidation.js
/**
 * Configuration Validation Utilities
 *
 * Pure functions for validating provider configurations.
 *
 */



/**
 * Validate a configuration value against a field definition.
 *
 * @param {*}      value  Value to validate.
 * @param {Object} field  Field definition.
 * @param {Object} config Full config object (for cross-field validation).
 * @return {Promise<string|null>} Error message or null if valid.
 */
async function validateFieldValue(value, field, config) {
  // Check required fields
  if (field.required && !value) {
    return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Field label */
    (0,external_wp_i18n_namespaceObject.__)('%s is required.', 'aether-site-exporter'), field.label);
  }

  // Skip validation if field is empty and not required
  if (!value) {
    return null;
  }

  // Type validation
  if (field.validation) {
    const validation = field.validation;

    // Pattern validation
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        if (validation.message) {
          return validation.message;
        }
        return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Field label */
        (0,external_wp_i18n_namespaceObject.__)('%s format is invalid.', 'aether-site-exporter'), field.label);
      }
    }

    // Min length validation
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Field label, 2: Minimum length */
      (0,external_wp_i18n_namespaceObject.__)('%1$s must be at least %2$d characters.', 'aether-site-exporter'), field.label, validation.minLength);
    }

    // Max length validation
    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Field label, 2: Maximum length */
      (0,external_wp_i18n_namespaceObject.__)('%1$s must be no more than %2$d characters.', 'aether-site-exporter'), field.label, validation.maxLength);
    }

    // Custom validator callback
    if (validation.callback && typeof validation.callback === 'function') {
      const result = await validation.callback(value, config);
      if (typeof result === 'string') {
        return result;
      }
    }
  }
  return null;
}

/**
 * Validate all fields in a configuration.
 *
 * @param {Object}        config Configuration to validate.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {Promise<Object>} Object of field ID to error message.
 */
async function validateAllFields(config, fields) {
  const errors = {};
  for (const field of fields) {
    const fieldId = field.id;
    const value = config[fieldId];
    const error = await validateFieldValue(value, field, config);
    if (error) {
      errors[fieldId] = error;
    }
  }
  return errors;
}

/**
 * Check if a configuration has all required fields filled.
 *
 * @param {Object}        config Configuration to check.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {boolean} True if all required fields are present.
 */
function hasRequiredFields(config, fields) {
  for (const field of fields) {
    if (field.required && !config[field.id]) {
      return false;
    }
  }
  return true;
}
;// ./assets/src/providers/utils/configSanitization.js
/**
 * Configuration Sanitization Utilities
 *
 * Pure functions for sanitizing provider configurations.
 *
 */

/**
 * Sanitize a single field value based on its type.
 *
 * @param {*}      value Value to sanitize.
 * @param {Object} field Field definition with type info.
 * @return {*} Sanitized value.
 */
function sanitizeFieldValue(value, field) {
  const type = field.type || 'text';
  switch (type) {
    case 'password':
    case 'text':
    case 'textarea':
      return String(value).trim();
    case 'email':
      return String(value).trim().toLowerCase();
    case 'url':
      // Remove trailing slash
      return String(value).trim().replace(/\/$/, '');
    case 'checkbox':
      return Boolean(value);
    case 'number':
      return Number(value) || 0;
    case 'select':
      // Return value as-is, validation happens separately
      return value;
    case 'checkbox-group':
      // Ensure value is an array
      return Array.isArray(value) ? value : [];
    default:
      return String(value).trim();
  }
}

/**
 * Validate a select field value against allowed options.
 *
 * @param {*}             value   Value to validate.
 * @param {Array<Object>} options Field options array.
 * @return {boolean} True if value is in allowed options.
 */
function isValidSelectValue(value, options) {
  const allowedValues = (options || []).map(opt => opt.value);
  return allowedValues.includes(value);
}

/**
 * Filter checkbox-group values against allowed options.
 *
 * @param {Array}         values  Array of values to filter.
 * @param {Array<Object>} options Field options array.
 * @return {Array} Filtered array containing only valid values.
 */
function filterCheckboxGroupValues(values, options) {
  if (!Array.isArray(values)) {
    return [];
  }
  const allowedValues = (options || []).map(opt => opt.value);
  if (allowedValues.length === 0) {
    return values;
  }
  return values.filter(v => allowedValues.includes(v));
}

/**
 * Sanitize all fields in a configuration.
 *
 * @param {Object}        config Configuration to sanitize.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {Object} Sanitized configuration.
 */
function sanitizeAllFields(config, fields) {
  const sanitized = {};
  for (const field of fields) {
    const fieldId = field.id;
    if (!(fieldId in config)) {
      continue;
    }
    const value = config[fieldId];
    const type = field.type || 'text';

    // Handle select type with option validation
    if (type === 'select') {
      if (isValidSelectValue(value, field.options)) {
        sanitized[fieldId] = value;
      }
      continue;
    }

    // Handle checkbox-group with option filtering
    if (type === 'checkbox-group') {
      sanitized[fieldId] = filterCheckboxGroupValues(value, field.options);
      continue;
    }

    // Standard sanitization
    sanitized[fieldId] = sanitizeFieldValue(value, field);
  }
  return sanitized;
}
;// ./assets/src/providers/base/AbstractProvider.js
/**
 * Abstract Provider Base Class
 *
 * Provides common functionality for all providers.
 * Abstract base class for all providers (JavaScript-only, no PHP equivalent)
 *
 */






/**
 * Abstract base class for providers.
 *
 * Provides default implementations and helper methods.
 */
class AbstractProvider {
  /**
   * Provider configuration.
   *
   * @type {Object}
   */
  config = {};

  /**
   * Registered provider ID (overrides getId() if set).
   *
   * @type {string|null}
   */
  registeredId = null;

  /**
   * Config storage instance.
   *
   * @type {Object|null}
   */
  configStorage = null;

  /**
   * Constructor.
   *
   * @param {Object}      config       Provider configuration.
   * @param {string|null} registeredId Optional registered provider ID.
   */
  constructor(config = {}, registeredId = null) {
    this.config = config;
    this.registeredId = registeredId;
    this.initialize();
  }

  /**
   * Initialize the provider.
   *
   * Called during construction. Subclasses can override to perform setup.
   */
  initialize() {
    // Default: no initialization needed.
    // Subclasses can override to set up services, etc.
  }

  /**
   * Get the unique provider identifier.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider ID
   */
  getId() {
    throw new Error('AbstractProvider.getId() must be implemented by subclass');
  }

  /**
   * Get the human-readable provider name.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider name
   */
  getName() {
    throw new Error('AbstractProvider.getName() must be implemented by subclass');
  }

  /**
   * Get the provider type.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider type
   */
  getType() {
    throw new Error('AbstractProvider.getType() must be implemented by subclass');
  }

  /**
   * Get the provider description.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider description
   */
  getDescription() {
    throw new Error('AbstractProvider.getDescription() must be implemented by subclass');
  }

  /**
   * Get the provider icon.
   *
   * Can be a dashicons class, emoji, SVG path, or URL.
   *
   * @abstract
   * @return {string} Provider icon
   */
  getIcon() {
    return '📦'; // Default generic icon
  }

  /**
   * Get the deployment types this provider supports.
   *
   * Must be overridden by subclasses to declare what deployment types
   * they can handle (e.g., static sites, blueprint bundles, edge functions).
   *
   * @abstract
   * @return {Array<string>} Array of DEPLOYMENT_TYPES constants
   */
  getSupportedDeploymentTypes() {
    return []; // Default: support nothing (must override)
  }

  /**
   * Get supported deployment types with filter applied.
   *
   * Allows external modification of supported deployment types via hooks.
   *
   * @return {Array<string>} Filtered array of deployment types
   */
  getDeploymentTypesWithFilter() {
    const supported = this.getSupportedDeploymentTypes();

    /**
     * Filter supported deployment types for a provider.
     *
     * Allows modification of what deployment types a provider supports.
     *
     * @param {Array<string>} supported  Array of deployment type constants.
     * @param {string}        providerId Provider ID.
     * @param {Object}        provider   Provider instance.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.supported_deployment_types', 'my-plugin',
     *     (supported, providerId, provider) => {
     *         if (providerId === 'my-provider') {
     *             supported.push('custom_type');
     *         }
     *         return supported;
     *     }
     * );
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.supported_deployment_types', supported, this.getId(), this);
  }

  /**
   * Check if provider supports a specific deployment type.
   *
   * @param {string} type Deployment type constant to check.
   * @return {boolean} True if supported, false otherwise
   */
  supportsDeploymentType(type) {
    return this.getDeploymentTypesWithFilter().includes(type);
  }

  /**
   * Get enabled deployment types from provider configuration.
   *
   * Since providers now have single responsibility, this always returns
   * the supported deployment types for this provider.
   *
   * @return {Array<string>} Array of enabled deployment types
   */
  getEnabledDeploymentTypes() {
    return this.getSupportedDeploymentTypes();
  }

  /**
   * Check if a deployment type is enabled in provider settings.
   *
   * @param {string} type Deployment type constant to check.
   * @return {boolean} True if enabled, false otherwise
   */
  isDeploymentTypeEnabled(type) {
    return this.getEnabledDeploymentTypes().includes(type);
  }

  /**
   * Get maximum simultaneous uploads for this provider.
   *
   * Returns the default number of files that can be uploaded in parallel.
   * Can be overridden by:
   * 1. Instance configuration (this.config.maxSimultaneousUploads)
   * 2. Subclass implementation (override this method)
   * 3. Global default (10)
   *
   * Subclasses can override to set provider-specific defaults.
   * For example:
   * - Local filesystem: Infinity (no limit)
   * - Cloud providers with rate limits: 5-10
   * - Slow/constrained servers: 2-3
   *
   * @return {number} Maximum number of simultaneous uploads
   */
  getMaxSimultaneousUploads() {
    // Check instance config first
    if (this.config && typeof this.config.maxSimultaneousUploads === 'number') {
      return this.config.maxSimultaneousUploads;
    }

    // Default: 10 simultaneous uploads
    // Subclasses can override this method to provide different defaults
    return 10;
  }

  /**
   * Get the provider configuration.
   *
   * Returns the current configuration array for this provider.
   *
   * @return {Promise<Object>} Configuration object
   */
  async getConfig() {
    if (Object.keys(this.config).length === 0) {
      this.config = await this.loadConfig();
    }

    /**
     * Filter provider configuration after loading.
     *
     * Allows modification of configuration before returning to caller.
     *
     * @param {Object} config     Provider configuration.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.get', 'my-plugin', (config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         config.customField = 'modified value';
     *     }
     *     return config;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config.get', this.config, this.getId());
  }

  /**
   * Save the provider configuration.
   *
   * @param {Object} config Configuration object to save.
   * @return {Promise<boolean>} True if saved successfully
   */
  async saveConfig(config) {
    /**
     * Filter provider configuration before validation.
     *
     * Allows modification of config before validation and saving.
     *
     * @param {Object} config     Configuration to save.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.before_save', 'my-plugin', (config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         config.auto_generated_field = Date.now();
     *     }
     *     return config;
     * });
     */
    config = (0,external_wp_hooks_.applyFilters)('aether.provider.config.before_save', config, this.getId());

    // Validate configuration
    const errors = await this.validateConfig(config);
    if (Object.keys(errors).length > 0) {
      throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: JSON string of validation errors */
      (0,external_wp_i18n_namespaceObject.__)('Configuration validation failed: %s', 'aether-site-exporter'), JSON.stringify(errors)));
    }

    // Sanitize configuration
    const sanitized = await this.sanitizeConfig(config);

    // Save via config storage
    const storage = await this.getConfigStorage();
    const result = await storage.save(sanitized);
    if (result) {
      this.config = sanitized;

      /**
       * Action fired after provider configuration is saved successfully.
       *
       * @param {Object} config     Saved configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.provider.config.saved', 'my-plugin', (config, providerId) => {
       *     console.log(`Provider ${providerId} configuration saved`);
       * });
       */
      (0,external_wp_hooks_.doAction)('aether.provider.config.saved', sanitized, this.getId());
    }
    return result;
  }

  /**
   * Delete the provider configuration.
   *
   * @return {Promise<boolean>} True if deleted successfully
   */
  async deleteConfig() {
    /**
     * Action fired before provider configuration is deleted.
     *
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.provider.config.before_delete', 'my-plugin', (providerId) => {
     *     console.log(`Deleting configuration for ${providerId}`);
     * });
     */
    (0,external_wp_hooks_.doAction)('aether.provider.config.before_delete', this.getId());
    const storage = await this.getConfigStorage();
    const result = await storage.delete();
    if (result) {
      this.config = {};

      /**
       * Action fired after provider configuration is deleted.
       *
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.provider.config.deleted', 'my-plugin', (providerId) => {
       *     console.log(`Configuration deleted for ${providerId}`);
       * });
       */
      (0,external_wp_hooks_.doAction)('aether.provider.config.deleted', this.getId());
    }
    return result;
  }

  /**
   * Check if the provider is properly configured.
   *
   * @return {Promise<boolean>} True if configured
   */
  async isConfigured() {
    const config = await this.getConfig();
    if (Object.keys(config).length === 0) {
      return false;
    }
    return hasRequiredFields(config, this.getConfigFields());
  }

  /**
   * Validate the provider configuration.
   *
   * @param {Object} config Configuration object to validate.
   * @return {Promise<Object>} Validation errors object (empty if valid)
   */
  async validateConfig(config) {
    const errors = await validateAllFields(config, this.getConfigFields());

    /**
     * Filter validation errors before returning.
     *
     * Allows adding or removing validation errors.
     *
     * @param {Object} errors     Validation errors object.
     * @param {Object} config     Configuration being validated.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.validate', 'my-plugin', (errors, config, providerId) => {
     *     if (providerId === 'my-provider' && config.field1 === config.field2) {
     *         errors.field2 = 'Field 2 must be different from Field 1';
     *     }
     *     return errors;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config.validate', errors, config, this.getId());
  }

  /**
   * Sanitize the provider configuration.
   *
   * @param {Object} config Configuration object to sanitize.
   * @return {Promise<Object>} Sanitized configuration
   */
  async sanitizeConfig(config) {
    const sanitized = sanitizeAllFields(config, this.getConfigFields());

    /**
     * Filter sanitized configuration before returning.
     *
     * Allows custom sanitization logic for specific fields.
     *
     * @param {Object} sanitized  Sanitized configuration.
     * @param {Object} config     Original configuration.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.sanitize', 'my-plugin', (sanitized, config, providerId) => {
     *     if (providerId === 'my-provider' && sanitized.url) {
     *         // Ensure URL always ends with slash
     *         sanitized.url = sanitized.url.replace(/\/?$/, '/');
     *     }
     *     return sanitized;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config.sanitize', sanitized, config, this.getId());
  }

  /**
   * Get configuration fields for this provider.
   *
   * Adds provider-specific fields. Subclasses should override
   * getProviderSpecificConfigFields() instead of this method.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getConfigFields() {
    const fields = [];

    // Add provider-specific fields
    const providerFields = this.getProviderSpecificConfigFields?.() || [];
    fields.push(...providerFields);

    /**
     * Filter provider configuration fields.
     *
     * Allows modification of the fields array for a provider.
     *
     * @param {Array<Object>} fields     Array of field definitions.
     * @param {string}        providerId Provider ID.
     * @param {Object}        provider   Provider instance.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config_fields', 'my-plugin',
     *     (fields, providerId, provider) => {
     *         if (providerId === 'my-provider') {
     *             fields.push({
     *                 id: 'custom_field',
     *                 type: 'text',
     *                 label: 'Custom Field'
     *             });
     *         }
     *         return fields;
     *     }
     * );
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config_fields', fields, this.getId(), this);
  }

  /**
   * Get provider-specific configuration fields.
   *
   * Override this method in subclasses to define fields specific to your provider.
   * Do not override getConfigFields() directly.
   *
   * @abstract
   * @return {Array<Object>} Array of field definitions
   */
  getProviderSpecificConfigFields() {
    return [];
  }

  /**
   * Deploy edge worker/function.
   *
   * Default implementation for non-edge providers.
   * Edge-capable providers should override this.
   *
   * @return {Promise<Object>} Deployment result
   */
  async deploy() {
    return {
      success: true,
      message: 'No deployment needed for this provider.'
    };
  }

  /**
   * Get provider status.
   *
   * @return {Promise<Object>} Status object
   */
  async getStatus() {
    const configured = await this.isConfigured();
    return {
      configured,
      healthy: configured // Default: healthy if configured
    };
  }

  /**
   * Get settings URL for this provider.
   *
   * @return {string} Settings URL
   */
  getSettingsUrl() {
    return `admin.php?page=aether#/settings/provider/${this.getId()}`;
  }

  /**
   * Get documentation URL for this provider.
   *
   * @return {string} Documentation URL
   */
  getDocumentationUrl() {
    return `https://docs.aether.dev/providers/${this.getId()}`;
  }

  /**
   * Get provider metadata.
   *
   * Returns all provider information for UI rendering.
   *
   * @return {Object} Metadata object
   */
  getMetadata() {
    const metadata = {
      id: this.getId(),
      name: this.getName(),
      type: this.getType(),
      description: this.getDescription(),
      icon: this.getIcon(),
      supportedDeploymentTypes: this.getDeploymentTypesWithFilter(),
      configFields: this.getConfigFields(),
      settingsUrl: this.getSettingsUrl(),
      documentationUrl: this.getDocumentationUrl()
    };

    /**
     * Filter provider metadata before returning.
     *
     * Allows modification of provider metadata for UI rendering.
     *
     * @param {Object} metadata   Provider metadata.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.metadata', 'my-plugin', (metadata, providerId) => {
     *     if (providerId === 'my-provider') {
     *         metadata.customField = 'custom value';
     *     }
     *     return metadata;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.metadata', metadata, this.getId());
  }

  /**
   * Get deployment URL for this provider.
   *
   * Default implementation checks common field names.
   *
   * @return {Promise<string>} Deployment URL or empty string
   */
  async getDeploymentUrl() {
    const config = await this.getConfig();
    let deploymentUrl = '';

    // Check pages_url first (for providers with hosted pages)
    if (config.pages_url) {
      deploymentUrl = config.pages_url;
    }
    // Check worker_endpoint (R2, Spaces)
    else if (config.worker_endpoint) {
      deploymentUrl = config.worker_endpoint;
    }
    // Fallback to public_url (R2 custom domain)
    else if (config.public_url) {
      deploymentUrl = config.public_url;
    }

    /**
     * Filter deployment URL for a provider.
     *
     * Allows customization of the deployment URL.
     *
     * @param {string} deploymentUrl Deployment URL.
     * @param {Object} config        Provider configuration.
     * @param {string} providerId    Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.deployment_url', 'my-plugin', (url, config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         return config.custom_url || url;
     *     }
     *     return url;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.deployment_url', deploymentUrl, config, this.getId());
  }

  /**
   * Get the upload strategy for this provider.
   *
   * Determines how files should be uploaded to this provider.
   * Providers should override this method to specify their upload strategy.
   *
   * @return {string} Upload strategy: 'storage', 'direct', or 'api'
   *
   * Strategies:
   * - 'storage': Uses object storage upload (R2, S3, Spaces)
   * - 'direct': Direct file operation (local filesystem)
   * - 'api': Uses provider-specific API for uploads
   */
  getUploadStrategy() {
    // Default: assume storage-based upload
    // Providers should override this method
    return 'storage';
  }

  /**
   * Upload a file to the provider.
   *
   * Abstract method that providers must implement to upload files.
   * For local providers, this might be a file copy operation.
   * For remote providers, this would be an actual upload to the remote host.
   *
   * @abstract
   * @param {string} sourcePath      Local file path to upload.
   * @param {string} destinationPath Destination path/key where file should be stored.
   * @return {Promise<Object>} Upload result with success status and URL.
   */
  // eslint-disable-next-line no-unused-vars
  async uploadFile(sourcePath, destinationPath) {
    throw new Error('AbstractProvider.uploadFile() must be implemented by subclass');
  }

  /**
   * Load configuration from storage.
   *
   * @protected
   * @return {Promise<Object>} Configuration object
   */
  async loadConfig() {
    const storage = await this.getConfigStorage();
    return storage.load();
  }

  /**
   * Get config storage instance.
   *
   * Lazy-loads the ConfigStorage class.
   *
   * @protected
   * @return {Promise<Object>} Config storage instance
   */
  async getConfigStorage() {
    if (!this.configStorage) {
      // Lazy load to avoid circular dependencies
      const {
        ConfigStorage
      } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 906));
      this.configStorage = new ConfigStorage(this.getId());
    }
    return this.configStorage;
  }

  /**
   * Get a configuration value.
   *
   * @protected
   * @param {string} key          Configuration key.
   * @param {*}      defaultValue Default value if key doesn't exist.
   * @return {Promise<*>} Configuration value
   */
  async getConfigValue(key, defaultValue = null) {
    const config = await this.getConfig();
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  /**
   * Check if a configuration value is set and not empty.
   *
   * @protected
   * @param {string} key Configuration key.
   * @return {Promise<boolean>} True if set and not empty
   */
  async hasConfigValue(key) {
    const config = await this.getConfig();
    return Boolean(config[key]);
  }

  /**
   * Get specific config fields by IDs.
   *
   * Helper method to filter config fields by their IDs.
   * Preserves order of fieldIds array.
   *
   * @protected
   * @param {Array<string>} fieldIds Array of field IDs to retrieve.
   * @return {Array<Object>} Filtered field definitions
   */
  getFieldsById(fieldIds) {
    const allFields = this.getConfigFields();
    const indexedFields = {};

    // Index fields by ID for quick lookup
    allFields.forEach(field => {
      const fieldKey = field.id || field.name || '';
      if (fieldKey) {
        indexedFields[fieldKey] = field;
      }
    });

    // Build result in the order specified by fieldIds
    return fieldIds.filter(id => indexedFields[id]).map(id => indexedFields[id]);
  }

  /**
   * Render custom settings UI.
   *
   * Optional method that providers can override to render custom settings UI.
   * If not overridden, the default ProviderSettings component will be used.
   *
   * @return {void|null} Returns null to indicate no custom rendering (default behavior).
   */
  renderSettings() {
    // Default: return null to indicate no custom rendering
    // ProviderSettings component will be used instead
    return null;
  }

  /**
   * Check if provider has custom settings rendering.
   *
   * @return {boolean} True if provider implements custom renderSettings
   */
  hasCustomSettings() {
    // Check if renderSettings was overridden by subclass
    return this.renderSettings !== AbstractProvider.prototype.renderSettings;
  }
}
/* harmony default export */ const base_AbstractProvider = ((/* unused pure expression or super */ null && (AbstractProvider)));
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

/**
 * Descriptions for deployment types
 */
const DEPLOYMENT_TYPE_DESCRIPTIONS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Deploy static HTML/CSS/JS files for web hosting', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Deploy WordPress Playground blueprint bundle (ZIP file)', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Deploy serverless functions to edge computing platforms', 'aether-site-exporter')
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
class LocalFilesystemBlueprintBundleProvider extends AbstractProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'local-filesystem-blueprint-bundle';

  /**
   * Get the unique provider identifier.
   *
   * @return {string} Provider ID
   */
  getId() {
    return this.registeredId || LocalFilesystemBlueprintBundleProvider.ID;
  }

  /**
   * Get the human-readable provider name.
   *
   * @return {string} Provider name
   */
  getName() {
    return (0,external_wp_i18n_namespaceObject.__)('Local Filesystem (Blueprint Bundle)', 'aether-site-exporter');
  }

  /**
   * Get the provider type.
   *
   * @return {string} Provider type
   */
  getType() {
    return 'local-storage';
  }

  /**
   * Get the provider description.
   *
   * @return {string} Provider description
   */
  getDescription() {
    return (0,external_wp_i18n_namespaceObject.__)('Store blueprint bundle ZIP files locally in the WordPress uploads directory. No cloud deployment required.', 'aether');
  }

  /**
   * Get the provider icon.
   *
   * @return {string} Provider icon
   */
  getIcon() {
    return '💾';
  }

  /**
   * Get deployment types this provider supports.
   *
   * LocalFilesystemBlueprintBundle only supports blueprint bundles.
   *
   * @return {Array<string>} Array of DEPLOYMENT_TYPES constants
   */
  getSupportedDeploymentTypes() {
    return [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
  }

  /**
   * Get maximum simultaneous uploads for local filesystem.
   *
   * Local filesystem has no rate limits, so return Infinity for unlimited parallel uploads.
   *
   * @return {number} Maximum number of simultaneous uploads (Infinity = no limit)
   */
  getMaxSimultaneousUploads() {
    // Check instance config first (user can still override to limit parallelism)
    if (this.config && typeof this.config.maxSimultaneousUploads === 'number') {
      return this.config.maxSimultaneousUploads;
    }

    // Local filesystem can handle unlimited parallel uploads
    return Infinity;
  }

  /**
   * Get provider-specific configuration fields.
   *
   * LocalFilesystemBlueprintBundle provider only needs export path.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getProviderSpecificConfigFields() {
    return [{
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

  /**
   * Validate provider configuration.
   *
   * @param {Object} config Configuration object to validate.
   * @return {Promise<Object>} Validation result
   */
  async validateConfig(config) {
    // Use base validation from AbstractProvider
    const baseErrors = await super.validateConfig(config);

    // Additional validation for LocalFilesystemBlueprintBundle
    const errors = {
      ...baseErrors
    };

    // Validate export path if provided
    if (config.export_path) {
      // Ensure path doesn't try to escape WordPress root
      if (config.export_path.includes('..') || config.export_path.startsWith('/')) {
        errors.export_path = (0,external_wp_i18n_namespaceObject.__)('Export path must be relative to WordPress root and cannot contain ".."', 'aether');
      }
    }
    return errors;
  }

  /**
   * Sanitize provider configuration.
   *
   * @param {Object} config Configuration object to sanitize.
   * @return {Promise<Object>} Sanitized configuration
   */
  async sanitizeConfig(config) {
    const sanitized = await super.sanitizeConfig(config);

    // Sanitize export_path - default to 'blueprint-bundle/bundle.zip' if empty
    if (sanitized.export_path) {
      sanitized.export_path = sanitized.export_path.replace(/^\/+|\/+$/g, '').trim();
      if (sanitized.export_path === '' || !sanitized.export_path.endsWith('.zip')) {
        sanitized.export_path = 'blueprint-bundle/bundle.zip';
      }
    } else {
      sanitized.export_path = 'blueprint-bundle/bundle.zip';
    }
    return sanitized;
  }

  /**
   * Test connection to provider.
   *
   * For LocalFilesystem, this checks if the export directory is writable.
   *
   * @return {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      // For LocalFilesystem, we don't need to test anything
      // The server-side will handle directory creation and permissions
      return {
        success: true,
        message: (0,external_wp_i18n_namespaceObject.__)('Local filesystem is ready for blueprint bundle exports', 'aether')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_namespaceObject.__)('Connection test failed', 'aether-site-exporter')
      };
    }
  }

  /**
   * Deploy to provider.
   *
   * For LocalFilesystem, this is a no-op since files are already local.
   * The actual export happens server-side in PHP.
   *
   * @return {Promise<Object>} Deployment result
   */
  async deploy() {
    try {
      // For LocalFilesystem, deployment is handled server-side
      // This method is called during the export workflow,
      // but the actual file operations happen in PHP

      return {
        success: true,
        message: (0,external_wp_i18n_namespaceObject.__)('Blueprint bundle saved locally. Files are available in the exports directory.', 'aether'),
        deploymentUrl: '' // No deployment URL for local storage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_namespaceObject.__)('Deployment failed', 'aether-site-exporter')
      };
    }
  }

  /**
   * Get deployment status.
   *
   * @return {Promise<Object>} Status result
   */
  async getStatus() {
    const configured = await this.isConfigured();
    return {
      success: true,
      status: configured ? 'active' : 'inactive',
      configured,
      healthy: true,
      // LocalFilesystem is always healthy
      message: configured ? (0,external_wp_i18n_namespaceObject.__)('Local filesystem blueprint bundle storage is active', 'aether') : (0,external_wp_i18n_namespaceObject.__)('Local filesystem blueprint bundle storage is available', 'aether')
    };
  }

  /**
   * Get deployment URL for this provider.
   *
   * LocalFilesystem doesn't have a deployment URL since files are stored locally.
   *
   * @return {Promise<string>} Empty string
   */
  async getDeploymentUrl() {
    return '';
  }

  /**
   * Get the upload strategy for this provider.
   *
   * LocalFilesystem uses direct file operations (no upload needed).
   *
   * @return {string} Upload strategy
   */
  getUploadStrategy() {
    return 'direct';
  }

  /**
   * Check if provider is properly configured.
   *
   * LocalFilesystem is always configured since it doesn't require credentials.
   *
   * @return {Promise<boolean>} True (always configured)
   */
  async isConfigured() {
    // LocalFilesystem doesn't require configuration
    // It's always available as a fallback option
    return true;
  }
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
    (0,external_wp_hooks_.doAction)('aether.providers.registered', providerId, provider);
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
(0,external_wp_hooks_.addAction)('aether.providers.register', 'aether/provider-registry', provider => {
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
/* harmony default export */ const registry_ProviderRegistry = (exportedRegistry);
;// ./assets/src/providers/local-filesystem-blueprint-bundle/index.js
/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Handles blueprint bundle uploads to local filesystem.
 * Single responsibility: copy blueprint bundle file to destinationPath.
 *
 */







// Create provider instance for hook registration
const provider = new LocalFilesystemBlueprintBundleProvider();

// Register provider in JavaScript registry
registry_ProviderRegistry.register(provider.getId(), provider);

// Also trigger the hook for any listeners
(0,external_wp_hooks_.doAction)('aether.providers.register', provider);

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
    filePath,
    destinationPath,
    metadata = {}
  } = fileContext;

  // Debug logging
  debug('[LocalFilesystemBlueprintBundle] handleUnifiedFileUpload called:', {
    providerId,
    filePath,
    destinationPath
  });

  // Only handle requests for local-filesystem providers that support blueprint_bundle
  if (!providerId || !providerId.startsWith('local-filesystem')) {
    debug('[LocalFilesystemBlueprintBundle] Skipping - not a local-filesystem provider:', providerId);
    return;
  }

  // Check if this is a blueprint bundle provider by checking provider ID
  // Since providers have single responsibility, we can check the provider ID directly
  if (!providerId || !providerId.startsWith('local-filesystem-blueprint-bundle')) {
    debug('[LocalFilesystemBlueprintBundle] Skipping - not a blueprint bundle provider:', providerId);
    return;
  }

  // Create a unique key for this file+provider combination
  const fileKey = `${providerId}:${filePath || destinationPath}`;

  // Check if file is already processed or in progress
  const existingEntry = processedFiles.get(fileKey);
  if (existingEntry === true) {
    // Already processed successfully
    debug('[LocalFilesystemBlueprintBundle] Skipping - file already processed:', fileKey);
    return;
  }
  if (existingEntry instanceof Promise) {
    // Already in progress - wait for it to complete
    debug('[LocalFilesystemBlueprintBundle] File already in progress, waiting:', fileKey);
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
      debug('[LocalFilesystemBlueprintBundle] File processed by other handler:', fileKey);
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
      const response = await (0,api/* default */.Ay)({
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
      debug(`Uploaded blueprint bundle ${filePath} to ${destinationPath} for provider ${providerId}`);
      // Set result on fileContext for unified upload system
      fileContext.result = {
        success: true
      };
    } catch (error) {
      uploadResults[providerId].errors.push({
        url: filePath,
        error: error.message || 'Unknown error'
      });
      debugWarn(`Error processing file for provider ${providerId}:`, error);
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
(0,external_wp_hooks_.addAction)('aether.file.upload', 'aether/local-filesystem-blueprint-bundle', fileContext => {
  // Initialize promise array on fileContext if not exists
  if (!fileContext._uploadPromises) {
    fileContext._uploadPromises = [];
  }

  // Start upload and add promise to context
  const uploadPromise = handleUnifiedFileUpload(fileContext);
  fileContext._uploadPromises.push(uploadPromise);
}, 10);

/**
 * Register test connection handler hook.
 *
 * Providers register test handlers via aether.provider.test filter.
 */
(0,external_wp_hooks_.addFilter)('aether.provider.test', 'aether/local-filesystem-blueprint-bundle', (handler, providerId, config) => {
  // Only handle requests for local-filesystem-blueprint-bundle providers
  if (!providerId || !providerId.startsWith('local-filesystem-blueprint-bundle')) {
    return handler; // Return existing handler or null
  }

  // Return test handler function
  return async testConfig => {
    return await provider.testConnection(testConfig || config);
  };
}, 10);

/**
 * Register upload strategy filter.
 *
 * Providers can override upload strategy via aether.provider.upload_strategy filter.
 */
(0,external_wp_hooks_.addFilter)('aether.provider.upload_strategy', 'aether/local-filesystem-blueprint-bundle', (strategy, providerId) => {
  if (providerId && providerId.startsWith('local-filesystem-blueprint-bundle')) {
    return 'direct';
  }
  return strategy;
}, 10);
/******/ })()
;