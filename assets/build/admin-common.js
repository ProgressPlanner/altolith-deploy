/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 444:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ay: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports createAuthHeaders, invalidateCache, setAPINonce, configureAPI */
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _getRestUrl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(573);
/**
 * API Fetch Utility
 *
 * Enhanced wrapper around @wordpress/api-fetch with:
 * - Request deduplication (prevents concurrent identical requests)
 * - Response caching with TTL (GET requests only)
 * - Nonce handling from meta tags
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
 * Get REST API nonce from meta tag or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  const metaTag = document.querySelector('meta[name="aether-rest-nonce"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
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
    '/settings': 1 * 60 * 1000,
    // 1 minute - settings may change
    '/config': 30 * 60 * 1000,
    // 30 minutes - static configuration
    '/check-wporg': 60 * 60 * 1000 // 60 minutes - WordPress.org data rarely changes
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
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL, nonce, and middleware.
 * Automatically fetches from meta tags if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from meta if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from meta if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || (0,_getRestUrl__WEBPACK_IMPORTED_MODULE_1__/* .getRestUrl */ .e)();
  const token = nonce || getNonce();
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }

  // Add custom middleware (order matters: caching before deduplication)
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(responseCachingMiddleware);
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(requestDeduplicationMiddleware);
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()));

/***/ }),

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 573:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   e: () => (/* binding */ getRestUrl)
/* harmony export */ });
/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from the meta tag or returns a default.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
 * @package
 */

/**
 * Get REST API URL from meta tag or default.
 *
 * @return {string} REST API base URL.
 */
function getRestUrl() {
  const metaTag = document.querySelector('meta[name="aether-rest-url"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '/wp-json/aether/site-exporter/';
  }
  return '/wp-json/aether/site-exporter/';
}

/***/ }),

/***/ 602:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   P2: () => (/* binding */ openDB)
/* harmony export */ });
/* unused harmony exports deleteDB, unwrap, wrap */
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
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(444);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_indexedDB__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(991);
/**
 * Provider Configuration Storage
 *
 * Handles provider configuration persistence with IndexedDB caching
 * and REST API backend storage.
 *
 * Upgraded from localStorage to IndexedDB for:
 * - Better storage capacity (no 5-10MB localStorage limit)
 * - Persistent caching across sessions
 * - Works reliably in WordPress Playground WASM environment
 *
 * @package
 */





/**
 * Cache duration in milliseconds (5 minutes).
 */
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * IndexedDB configuration for provider configs
 */
const PROVIDER_CONFIG_DB = {
  dbName: 'aether-provider-configs',
  version: 1,
  stores: {
    configs: {
      keyPath: 'cacheKey',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'providerId',
        keyPath: 'providerId',
        unique: false
      }]
    }
  }
};

/**
 * Shared IndexedDB store instance for all provider configs
 * @type {IndexedDBStore|null}
 */
let sharedStore = null;

/**
 * Get or create the shared IndexedDB store
 *
 * @return {IndexedDBStore} Shared store instance
 */
function getSharedStore() {
  if (!sharedStore) {
    sharedStore = new _utils_indexedDB__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .Ay('configs', PROVIDER_CONFIG_DB);
  }
  return sharedStore;
}

/**
 * Configuration storage class.
 *
 * Provides IndexedDB caching on top of REST API persistence.
 */
class ConfigStorage {
  /**
   * Provider ID.
   *
   * @type {string}
   */
  providerId;

  /**
   * Cache key for IndexedDB.
   *
   * @type {string}
   */
  cacheKey;

  /**
   * IndexedDB store instance.
   *
   * @type {IndexedDBStore}
   */
  store;

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
    this.cacheKey = `provider:${providerId}`;
    this.store = getSharedStore();
  }

  /**
   * Load configuration from cache or REST API.
   *
   * Checks IndexedDB cache first, falls back to REST API if cache is stale or missing.
   *
   * @return {Promise<Object>} Configuration object
   */
  async load() {
    // Try to load from cache first
    const cached = await this.getFromCache();
    if (cached !== null) {
      return cached;
    }

    // Load from REST API
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

      // Cache the result
      this.saveToCache(config);

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
   * Save configuration to REST API and update cache.
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

      // Update cache
      this.saveToCache(config);

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
   * Delete configuration from REST API and clear cache.
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

      // Clear cache
      this.clearCache();

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

  /**
   * Get configuration from IndexedDB cache.
   *
   * Returns null if cache is missing or stale.
   *
   * @private
   * @return {Promise<Object|null>} Cached configuration or null
   */
  async getFromCache() {
    try {
      const cached = await this.store.get(this.cacheKey);
      if (!cached) {
        return null;
      }

      // Check if cache is stale
      const now = Date.now();
      if (now - cached.timestamp > CACHE_DURATION) {
        await this.clearCache();
        return null;
      }
      return cached.config;
    } catch (error) {
      await this.clearCache();
      return null;
    }
  }

  /**
   * Save configuration to IndexedDB cache.
   *
   * @private
   * @param {Object} config Configuration object.
   * @return {Promise<void>}
   */
  async saveToCache(config) {
    try {
      await this.store.set(this.cacheKey, {
        config
      }, {
        providerId: this.providerId
      });
    } catch (error) {
      // Failed to save to cache - log but don't throw
      console.error(`[ConfigStorage] Failed to cache config for ${this.providerId}:`, error);
    }
  }

  /**
   * Clear configuration from IndexedDB cache.
   *
   * @private
   * @return {Promise<void>}
   */
  async clearCache() {
    try {
      await this.store.delete(this.cacheKey);
    } catch (error) {
      // Failed to clear cache - log but don't throw
      console.error(`[ConfigStorage] Failed to clear cache for ${this.providerId}:`, error);
    }
  }

  /**
   * Invalidate cache for a specific provider.
   *
   * Forces the next load() to fetch from REST API.
   *
   * @param {string} providerId Provider ID.
   * @return {Promise<void>}
   */
  static async invalidateCache(providerId) {
    const storage = new ConfigStorage(providerId);
    await storage.clearCache();
  }

  /**
   * Clear all provider configuration caches.
   *
   * Useful when logging out or switching users.
   *
   * @return {Promise<void>}
   */
  static async clearAllCaches() {
    try {
      const store = getSharedStore();
      await store.clear();
    } catch (error) {
      // Failed to clear all caches - log but don't throw
      console.error('[ConfigStorage] Failed to clear all caches:', error);
    }
  }
}
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (ConfigStorage)));

/***/ }),

/***/ 991:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ay: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports IndexedDBStore, isIndexedDBAvailable, deleteDatabase */
/* harmony import */ var idb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(602);
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
    const db = await (0,idb__WEBPACK_IMPORTED_MODULE_0__/* .openDB */ .P2)(config.dbName, config.version, {
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (IndexedDBStore);

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

// UNUSED EXPORTS: SecretField, useAPI

// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
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
;// ./assets/src/providers/utils/configFieldBuilder.js
/**
 * Config Field Builder
 *
 * Provides a fluent interface for defining configuration fields.
 * JavaScript equivalent of includes/Providers/ConfigFieldBuilder.php
 *
 * Example usage:
 * ```javascript
 * const field = ConfigFieldBuilder.text('api_key')
 *     .label('API Key')
 *     .description('Your API key from the provider')
 *     .required()
 *     .placeholder('Enter your API key')
 *     .pattern('[A-Za-z0-9]+')
 *     .build();
 * ```
 *
 * @package
 */




/**
 * ConfigFieldBuilder class
 *
 * Provides a fluent interface for building field configurations.
 */
class ConfigFieldBuilder {
  /**
   * Field configuration object
   *
   * @type {Object}
   */
  field = {};

  /**
   * Private constructor to enforce factory methods
   *
   * @param {string} name Field name/key.
   * @param {string} type Field type.
   */
  constructor(name, type) {
    this.field = {
      name,
      type
    };
  }

  /**
   * Create a text field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static text(name) {
    return new ConfigFieldBuilder(name, 'text');
  }

  /**
   * Create a password field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static password(name) {
    return new ConfigFieldBuilder(name, 'password');
  }

  /**
   * Create a select field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static select(name) {
    return new ConfigFieldBuilder(name, 'select');
  }

  /**
   * Create a textarea field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static textarea(name) {
    return new ConfigFieldBuilder(name, 'textarea');
  }

  /**
   * Create a checkbox field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static checkbox(name) {
    return new ConfigFieldBuilder(name, 'checkbox');
  }

  /**
   * Create a number field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static number(name) {
    return new ConfigFieldBuilder(name, 'number');
  }

  /**
   * Create an email field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static email(name) {
    return new ConfigFieldBuilder(name, 'email');
  }

  /**
   * Create a URL field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static url(name) {
    return new ConfigFieldBuilder(name, 'url');
  }

  /**
   * Set the field label
   *
   * @param {string} label Field label for display.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  label(label) {
    this.field.label = label;
    return this;
  }

  /**
   * Set the field description
   *
   * @param {string} description Help text for the field.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  description(description) {
    this.field.description = description;
    return this;
  }

  /**
   * Mark field as required
   *
   * @param {boolean} required Whether field is required.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  required(required = true) {
    this.field.required = required;
    return this;
  }

  /**
   * Set validation pattern (regex)
   *
   * @param {string} pattern Regular expression pattern.
   * @param {string} message Optional error message for pattern mismatch.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  pattern(pattern, message = '') {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.pattern = pattern;
    if (message) {
      this.field.validation.message = message;
    }
    return this;
  }

  /**
   * Set placeholder text
   *
   * @param {string} placeholder Placeholder text.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  placeholder(placeholder) {
    this.field.placeholder = placeholder;
    return this;
  }

  /**
   * Set default value
   *
   * @param {*} value Default value.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  default(value) {
    this.field.default = value;
    return this;
  }

  /**
   * Set options for select field
   *
   * @param {Array<{value: string, label: string}>} options Array of option objects.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  options(options) {
    this.field.options = options;
    return this;
  }

  /**
   * Set minimum value/length
   *
   * @param {number} min Minimum value for number fields or minimum length for text.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  min(min) {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.minLength = min;
    this.field.min = min; // Also set for HTML input
    return this;
  }

  /**
   * Set maximum value/length
   *
   * @param {number} max Maximum value for number fields or maximum length for text.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  max(max) {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.maxLength = max;
    this.field.max = max; // Also set for HTML input
    return this;
  }

  /**
   * Set step for number fields
   *
   * @param {number} step Step value for number inputs.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  step(step) {
    this.field.step = step;
    return this;
  }

  /**
   * Set rows for textarea
   *
   * @param {number} rows Number of visible text rows.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  rows(rows) {
    this.field.rows = rows;
    return this;
  }

  /**
   * Mark field as sensitive (for passwords, API keys, etc.)
   *
   * Note: Actual encryption happens server-side via REST API
   *
   * @param {boolean} sensitive Whether field contains sensitive data.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  sensitive(sensitive = true) {
    this.field.sensitive = sensitive;
    return this;
  }

  /**
   * Set custom validation callback
   *
   * @param {Function} callback Validation callback that receives value and returns string (error) or null (valid).
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  validate(callback) {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.callback = callback;
    return this;
  }

  /**
   * Set custom sanitization callback
   *
   * @param {Function} callback Sanitization callback that receives and returns value.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  sanitize(callback) {
    this.field.sanitize = callback;
    return this;
  }

  /**
   * Add conditional visibility
   *
   * @param {string} dependsOn Field name this field depends on.
   * @param {*}      value     Value the dependent field must have.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  showIf(dependsOn, value) {
    this.field.showIf = {
      field: dependsOn,
      value
    };
    return this;
  }

  /**
   * Set field group (for grouping related fields)
   *
   * @param {string} group Group identifier.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  group(group) {
    this.field.group = group;
    return this;
  }

  /**
   * Add CSS class to field
   *
   * @param {string} className CSS class name.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  cssClass(className) {
    this.field.class = className;
    return this;
  }

  /**
   * Set field width (for layout)
   *
   * @param {string} width Width value (e.g., '50%', '200px', 'half').
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  width(width) {
    this.field.width = width;
    return this;
  }

  /**
   * Build and return the field configuration object
   *
   * @return {Object} The complete field configuration
   */
  build() {
    // Set default label if not provided
    if (!this.field.label) {
      this.field.label = this.field.name.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    // Set 'id' as an alias for 'name'
    if (!this.field.id) {
      this.field.id = this.field.name;
    }
    return {
      ...this.field
    };
  }

  /**
   * Create multiple fields at once
   *
   * @param {Array<ConfigFieldBuilder>} builders Array of ConfigFieldBuilder instances.
   * @return {Array<Object>} Array of built field configurations
   */
  static buildAll(builders) {
    return builders.map(builder => builder.build());
  }
}

/**
 * Build deployment types checkbox field for a provider.
 *
 * Creates a checkbox-group field showing only the deployment types
 * that the provider supports. Returns null if provider supports no types.
 *
 * @param {Object} provider Provider instance with getSupportedDeploymentTypes() method.
 * @return {Object|null} Field configuration object or null if no supported types
 */
function buildDeploymentTypesField(provider) {
  const supportedTypes = provider.getSupportedDeploymentTypes();
  if (!supportedTypes || supportedTypes.length === 0) {
    return null; // No deployment types = no field
  }
  return {
    id: 'deployment_types',
    type: 'checkbox-group',
    label: (0,external_wp_i18n_namespaceObject.__)('Deployment Types', 'aether-site-exporter'),
    help: (0,external_wp_i18n_namespaceObject.__)('Select which types of deployments to use this provider for', 'aether-site-exporter'),
    required: false,
    options: supportedTypes.map(type => ({
      value: type,
      label: DEPLOYMENT_TYPE_LABELS[type] || type,
      description: DEPLOYMENT_TYPE_DESCRIPTIONS[type] || ''
    })),
    defaultValue: supportedTypes // All supported types enabled by default
  };
}
/* harmony default export */ const configFieldBuilder = ((/* unused pure expression or super */ null && (ConfigFieldBuilder)));
;// ./assets/src/providers/base/AbstractProvider.js
/**
 * Abstract Provider Base Class
 *
 * Provides common functionality for all providers.
 * JavaScript equivalent of includes/Providers/AbstractProvider.php
 *
 * @package
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
   * Returns the deployment types the user has chosen to use this provider for.
   * If not set in config, defaults to all supported deployment types.
   *
   * @return {Array<string>} Array of enabled deployment types
   */
  getEnabledDeploymentTypes() {
    const config = this.config || {};
    // If deployment_types is set in config, use it
    if (config.deployment_types && Array.isArray(config.deployment_types) && config.deployment_types.length > 0) {
      return config.deployment_types;
    }
    // Otherwise, default to all supported deployment types
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
      throw new Error('Configuration validation failed: ' + JSON.stringify(errors));
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

    // Check that all required fields are present
    const fields = this.getConfigFields();
    for (const field of fields) {
      if (field.required && !config[field.id]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate the provider configuration.
   *
   * @param {Object} config Configuration object to validate.
   * @return {Promise<Object>} Validation errors object (empty if valid)
   */
  async validateConfig(config) {
    const errors = {};
    const fields = this.getConfigFields();
    for (const field of fields) {
      const fieldId = field.id;
      const value = config[fieldId];

      // Check required fields
      if (field.required && !value) {
        errors[fieldId] = `${field.label} is required.`;
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value) {
        continue;
      }

      // Type validation
      if (field.validation) {
        const validation = field.validation;

        // Pattern validation
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors[fieldId] = validation.message || `${field.label} format is invalid.`;
          }
        }

        // Min length validation
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          errors[fieldId] = `${field.label} must be at least ${validation.minLength} characters.`;
        }

        // Max length validation
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          errors[fieldId] = `${field.label} must be no more than ${validation.maxLength} characters.`;
        }

        // Custom validator callback
        if (validation.callback && typeof validation.callback === 'function') {
          const result = await validation.callback(value, config);
          if (typeof result === 'string') {
            errors[fieldId] = result;
          }
        }
      }
    }

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
    const sanitized = {};
    const fields = this.getConfigFields();
    for (const field of fields) {
      const fieldId = field.id;
      if (!(fieldId in config)) {
        continue;
      }
      let value = config[fieldId];
      const type = field.type || 'text';

      // Sanitize based on type
      switch (type) {
        case 'password':
        case 'text':
        case 'textarea':
          value = String(value).trim();
          break;
        case 'email':
          value = String(value).trim().toLowerCase();
          break;
        case 'url':
          value = String(value).trim();
          // Remove trailing slash
          value = value.replace(/\/$/, '');
          break;
        case 'checkbox':
          value = Boolean(value);
          break;
        case 'number':
          value = Number(value) || 0;
          break;
        case 'select':
          // Ensure value is in allowed options
          const options = (field.options || []).map(opt => opt.value);
          if (options.includes(value)) {
            sanitized[fieldId] = value;
          }
          continue;
        case 'checkbox-group':
          // Ensure value is an array and filter to valid options
          if (!Array.isArray(value)) {
            value = [];
          } else {
            // Validate against allowed options if defined
            const allowedOptions = (field.options || []).map(opt => opt.value);
            if (allowedOptions.length > 0) {
              value = value.filter(v => allowedOptions.includes(v));
            }
          }
          sanitized[fieldId] = value;
          continue;
        default:
          value = String(value).trim();
          break;
      }
      sanitized[fieldId] = value;

      // Note: Encryption of sensitive fields handled server-side via REST API
    }

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
   * Automatically includes deployment types field, then adds provider-specific fields.
   * Subclasses should override getProviderSpecificConfigFields() instead of this method.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getConfigFields() {
    const fields = [];

    // Add deployment types field automatically
    const deploymentTypesField = buildDeploymentTypesField(this);
    if (deploymentTypesField) {
      fields.push(deploymentTypesField);
    }

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
   * @return {string} Upload strategy: 'git', 'storage', 'direct', or 'api'
   *
   * Strategies:
   * - 'git': Uses Git-based upload
   * - 'storage': Uses object storage upload (R2, S3, Spaces)
   * - 'direct': Direct HTTP upload to provider API
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
   * @param {Object} options         Optional upload options.
   * @return {Promise<Object>} Upload result with success status and URL.
   */
  async uploadFile(sourcePath, destinationPath, options = {}) {
    // Options parameter kept for API consistency, but not used in abstract implementation
    // eslint-disable-next-line no-unused-vars
    const _unused = options;
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
   * @param {HTMLElement} container Container element to render into.
   * @param {Function}    onSave    Callback to call after successful save.
   * @return {void|null} Returns null to indicate no custom rendering (default behavior).
   */
  // eslint-disable-next-line no-unused-vars
  renderSettings(container, onSave) {
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
;// ./assets/src/providers/local-filesystem/LocalFilesystemProvider.js
/**
 * Local Filesystem Provider
 *
 * Provider for local file storage without cloud deployment.
 * Stores exported sites locally in the WordPress uploads directory.
 *
 * @package
 */





/**
 * LocalFilesystemProvider class
 *
 * Handles local file storage for exported sites.
 * Files are stored in wp-content/aether-exports/.
 */
class LocalFilesystemProvider extends AbstractProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'local-filesystem';

  /**
   * Get the unique provider identifier.
   *
   * @return {string} Provider ID
   */
  getId() {
    return this.registeredId || LocalFilesystemProvider.ID;
  }

  /**
   * Get the human-readable provider name.
   *
   * @return {string} Provider name
   */
  getName() {
    return (0,external_wp_i18n_namespaceObject.__)('Local Filesystem', 'aether');
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
    return (0,external_wp_i18n_namespaceObject.__)('Store exported sites locally in the WordPress uploads directory. No cloud deployment required.', 'aether');
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
   * LocalFilesystem supports static sites and blueprint bundles.
   *
   * @return {Array<string>} Array of DEPLOYMENT_TYPES constants
   */
  getSupportedDeploymentTypes() {
    return [DEPLOYMENT_TYPES.STATIC_SITE, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
  }

  /**
   * Get provider-specific configuration fields.
   *
   * LocalFilesystem provider has minimal configuration since it uses local storage.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getProviderSpecificConfigFields() {
    return [{
      id: 'export_path',
      label: (0,external_wp_i18n_namespaceObject.__)('Blueprint-bundle file path', 'aether'),
      type: 'text',
      required: true,
      secure: false,
      placeholder: 'blueprint-bundle/bundle.zip',
      help: (0,external_wp_i18n_namespaceObject.__)('Full path to the blueprint bundle ZIP file (relative to WordPress root), including filename.', 'aether'),
      validation: {
        pattern: /^[a-zA-Z0-9/_.-]+\.zip$/,
        message: (0,external_wp_i18n_namespaceObject.__)('Blueprint bundle path must end with .zip and contain only letters, numbers, slashes, hyphens, underscores, and dots.', 'aether')
      }
    }, {
      id: 'public_url',
      label: (0,external_wp_i18n_namespaceObject.__)('Public URL', 'aether'),
      type: 'text',
      required: false,
      secure: false,
      placeholder: 'https://example.com',
      help: (0,external_wp_i18n_namespaceObject.__)('URL where exported files will be publicly accessible. Used for blueprint generation and URL replacements in exported HTML. Leave empty to use WordPress home URL.', 'aether'),
      validation: {
        pattern: /^https?:\/\/.+/,
        message: (0,external_wp_i18n_namespaceObject.__)('Public URL must be a valid HTTP or HTTPS URL', 'aether')
      }
    }, {
      id: 'static_files_path',
      label: (0,external_wp_i18n_namespaceObject.__)('Static Files Directory', 'aether'),
      type: 'text',
      required: true,
      secure: false,
      placeholder: 'static/',
      help: (0,external_wp_i18n_namespaceObject.__)('Directory where static site files will be written (relative to WordPress root). Each export overwrites the previous one.', 'aether'),
      validation: {
        pattern: /^[a-zA-Z0-9/_.-]+$/,
        message: (0,external_wp_i18n_namespaceObject.__)('Static files path must contain only letters, numbers, slashes, hyphens, underscores, and dots. Cannot be empty.', 'aether')
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

    // Additional validation for LocalFilesystem
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

    // Sanitize static_files_path - default to 'static/' if empty
    if (sanitized.static_files_path) {
      sanitized.static_files_path = sanitized.static_files_path.trim();
      if (sanitized.static_files_path === '') {
        sanitized.static_files_path = 'static/';
      }
    } else {
      sanitized.static_files_path = 'static/';
    }

    // Sanitize max_exports
    if (sanitized.max_exports) {
      sanitized.max_exports = parseInt(sanitized.max_exports, 10);
      if (isNaN(sanitized.max_exports) || sanitized.max_exports < 1) {
        delete sanitized.max_exports;
      }
    }
    return sanitized;
  }

  /**
   * Test connection to provider.
   *
   * For LocalFilesystem, this checks if the export directory is writable.
   *
   * @param {Object} config Provider configuration.
   * @return {Promise<Object>} Connection test result
   */
  async testConnection(config) {
    // Config parameter kept for API consistency, but not used for local filesystem
    // eslint-disable-next-line no-unused-vars
    const _unused = config;
    try {
      // For LocalFilesystem, we don't need to test anything
      // The server-side will handle directory creation and permissions
      return {
        success: true,
        message: (0,external_wp_i18n_namespaceObject.__)('Local filesystem is ready for exports', 'aether')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_namespaceObject.__)('Connection test failed', 'aether')
      };
    }
  }

  /**
   * Deploy to provider.
   *
   * For LocalFilesystem, this is a no-op since files are already local.
   * The actual export happens server-side in PHP.
   *
   * @param {Object} deploymentConfig Deployment configuration.
   * @return {Promise<Object>} Deployment result
   */
  async deploy(deploymentConfig) {
    // DeploymentConfig parameter kept for API consistency, but not used for local filesystem
    // eslint-disable-next-line no-unused-vars
    const _unused = deploymentConfig;
    try {
      // For LocalFilesystem, deployment is handled server-side
      // This method is called during the publish workflow,
      // but the actual file operations happen in PHP

      return {
        success: true,
        message: (0,external_wp_i18n_namespaceObject.__)('Export saved locally. Files are available in the exports directory.', 'aether'),
        deploymentUrl: '' // No deployment URL for local storage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_namespaceObject.__)('Deployment failed', 'aether')
      };
    }
  }

  /**
   * Get deployment status.
   *
   * @param {Object} config Provider configuration.
   * @return {Promise<Object>} Status result
   */
  async getStatus(config) {
    // Config parameter kept for API consistency, but not used for local filesystem
    // eslint-disable-next-line no-unused-vars
    const _unused = config;
    const configured = await this.isConfigured();
    return {
      success: true,
      status: configured ? 'active' : 'inactive',
      configured,
      healthy: true,
      // LocalFilesystem is always healthy
      message: configured ? (0,external_wp_i18n_namespaceObject.__)('Local filesystem storage is active', 'aether') : (0,external_wp_i18n_namespaceObject.__)('Local filesystem storage is available', 'aether')
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
   * Upload a file to local filesystem.
   *
   * For LocalFilesystem, this ensures the file is in the correct location
   * within the aether-exports directory. Since we're working locally,
   * this is essentially a verification that the file exists and is accessible.
   *
   * @param {string} sourcePath      Local file path (relative to WordPress root).
   * @param {string} destinationPath Destination path within exports directory.
   * @param {Object} options         Optional upload options.
   * @return {Promise<Object>} Upload result with success status and URL.
   */
  async uploadFile(sourcePath, destinationPath, options = {}) {
    // Options parameter kept for API consistency, but not used for local filesystem
    // eslint-disable-next-line no-unused-vars
    const _unused = options;
    try {
      // For local filesystem, files are already local and don't need to be uploaded
      // The blueprint-bundle.zip was created by the generateBlueprint step
      // and is already in the correct location (aether-exports directory)

      // We just return success to indicate the file is available
      return {
        success: true,
        url: '',
        // Local filesystem doesn't have a public URL
        path: sourcePath,
        message: (0,external_wp_i18n_namespaceObject.__)('File is available locally', 'aether')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_namespaceObject.__)('File upload failed', 'aether')
      };
    }
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
/* harmony default export */ const local_filesystem_LocalFilesystemProvider = ((/* unused pure expression or super */ null && (LocalFilesystemProvider)));
;// ./assets/src/providers/local-filesystem/index.js
/**
 * Local Filesystem Provider Registration
 *
 * This file registers hooks for the LocalFilesystem provider implementation.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */




// Create provider instance for hook registration
const provider = new LocalFilesystemProvider();

/**
 * Register upload handler hook.
 *
 * Providers register upload handlers via aether.provider.upload filter.
 */
(0,external_wp_hooks_.addFilter)('aether.provider.upload', 'aether/local-filesystem', (handler, providerId, uploadData) => {
  // Only handle requests for this provider
  if (providerId !== 'local-filesystem') {
    return handler; // Return existing handler or null
  }

  // Return upload handler function
  return async (filePath, fileName, context) => {
    return await provider.uploadFile(filePath, fileName);
  };
}, 10);

/**
 * Register test connection handler hook.
 *
 * Providers register test handlers via aether.provider.test filter.
 */
(0,external_wp_hooks_.addFilter)('aether.provider.test', 'aether/local-filesystem', (handler, providerId, config) => {
  // Only handle requests for this provider
  if (providerId !== 'local-filesystem') {
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
(0,external_wp_hooks_.addFilter)('aether.provider.upload_strategy', 'aether/local-filesystem', (strategy, providerId) => {
  if (providerId === 'local-filesystem') {
    return 'direct';
  }
  return strategy;
}, 10);
;// ./assets/src/admin-common/providers-init.js
/**
 * Provider Initialization
 *
 * Providers are registered via PHP using the 'aether_providers' filter for metadata/settings.
 * JavaScript providers register implementation hooks (aether.provider.upload, aether.provider.test, etc.).
 *
 * This import ensures the local-filesystem JavaScript provider implementation is bundled.
 * Note: This is just for loading the implementation code, not for hardcoded logic references.
 *
 * @package
 */

// Import local-filesystem provider JavaScript implementation.
// PHP handles registration and settings; JS handles upload/deployment logic.

// EXTERNAL MODULE: ./assets/src/utils/api.js
var api = __webpack_require__(444);
;// external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
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
const styles_spacing = {
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
    marginBottom: styles_spacing.lg,
    padding: 0
  },
  sectionHeader: {
    borderBottom: `1px solid ${colors.borderLight}`,
    paddingTop: styles_spacing.lg,
    paddingBottom: styles_spacing.lg,
    paddingLeft: styles_spacing.lg,
    paddingRight: styles_spacing.lg,
    background: colors.background
  },
  card: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.sm,
    padding: styles_spacing.lg
  }
};
const statusBadgeStyles = {
  base: {
    display: 'inline-block',
    paddingTop: '3px',
    paddingBottom: '3px',
    paddingLeft: styles_spacing.sm,
    paddingRight: styles_spacing.sm,
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
    paddingTop: styles_spacing.md,
    paddingBottom: styles_spacing.md,
    paddingLeft: styles_spacing.lg,
    paddingRight: styles_spacing.lg,
    marginBottom: styles_spacing.md,
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
const createFlexStyle = (direction = 'row', gap = styles_spacing.md) => ({
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
const createGridStyle = (minColumnWidth = '16rem', gap = styles_spacing.md) => ({
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
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/components/SecretField.js
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
  const [isVisible, setIsVisible] = useState(false);
  const containerStyle = {
    position: 'relative'
  };
  const toggleStyle = {
    marginTop: spacing.sm
  };
  return /*#__PURE__*/_jsxs("div", {
    className: "aether-secret-field",
    style: containerStyle,
    children: [/*#__PURE__*/_jsx(TextControl, {
      className: "aether-secret-field__input",
      label: label,
      help: help,
      value: value,
      onChange: onChange,
      type: isVisible ? 'text' : 'password',
      placeholder: placeholder,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      ...props
    }), /*#__PURE__*/_jsx(Button, {
      className: "aether-secret-field__toggle",
      variant: "secondary",
      onClick: () => setIsVisible(!isVisible),
      style: toggleStyle,
      children: isVisible ? __('Hide', 'aether-site-exporter') : __('Show', 'aether-site-exporter')
    })]
  });
}
;// ./assets/src/admin-common/index.js
/**
 * Admin Common Utilities
 *
 * @package
 */

// This file can be used for shared utilities, hooks, or components
// that are used across multiple admin pages.

// Import local-filesystem provider to ensure it's registered
// This is the default/fallback provider and must always be available



/******/ })()
;