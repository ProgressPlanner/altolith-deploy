/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ }),

/***/ 723:
/***/ ((module) => {

module.exports = window["wp"]["i18n"];

/***/ }),

/***/ 966:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ConfigStorage: () => (/* binding */ ConfigStorage)
});

// UNUSED EXPORTS: default

// EXTERNAL MODULE: ./assets/src/utils/api.js + 1 modules
var api = __webpack_require__(186);
// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
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
function build_openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
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
    const db = await build_openDB(config.dbName, config.version, {
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
;// ./assets/src/providers/utils/configStorage.js
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
    sharedStore = new utils_indexedDB('configs', PROVIDER_CONFIG_DB);
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
      const response = await (0,api/* default */.Ay)({
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
      config = (0,external_wp_hooks_.applyFilters)('aether.storage.config.load', config, this.providerId);

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
      (0,external_wp_hooks_.doAction)('aether.storage.config.loaded', config, this.providerId);
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
    config = (0,external_wp_hooks_.applyFilters)('aether.storage.config.before_save', config, this.providerId);
    try {
      await (0,api/* default */.Ay)({
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
      (0,external_wp_hooks_.doAction)('aether.storage.config.saved', config, this.providerId);
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
    (0,external_wp_hooks_.doAction)('aether.storage.config.before_delete', this.providerId);
    try {
      await (0,api/* default */.Ay)({
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
      (0,external_wp_hooks_.doAction)('aether.storage.config.deleted', this.providerId);
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
/* harmony default export */ const configStorage = ((/* unused pure expression or super */ null && (ConfigStorage)));

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
// EXTERNAL MODULE: external ["wp","apiFetch"]
var external_wp_apiFetch_ = __webpack_require__(455);
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_);
// EXTERNAL MODULE: external ["wp","i18n"]
var external_wp_i18n_ = __webpack_require__(723);
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
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_.__)('Static Site', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_.__)('Blueprint Bundle', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_.__)('Edge Functions', 'aether-site-exporter')
};

/**
 * Descriptions for deployment types
 */
const DEPLOYMENT_TYPE_DESCRIPTIONS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_.__)('Deploy static HTML/CSS/JS files for web hosting', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_.__)('Deploy WordPress Playground blueprint bundle (ZIP file)', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_.__)('Deploy serverless functions to edge computing platforms', 'aether-site-exporter')
};
;// ./assets/src/providers/utils/configFieldBuilder.js
/**
 * Config Field Builder
 *
 * Provides a fluent interface for defining configuration fields.
 * Configuration field builder utility (JavaScript-only)
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
    label: (0,external_wp_i18n_.__)('Deployment Types', 'aether-site-exporter'),
    help: (0,external_wp_i18n_.__)('Select which types of deployments to use this provider for', 'aether-site-exporter'),
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
;// ./assets/src/providers/utils/configValidation.js
/**
 * Configuration Validation Utilities
 *
 * Pure functions for validating provider configurations.
 *
 * @package
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
    return (0,external_wp_i18n_.sprintf)(/* translators: %s: Field label */
    (0,external_wp_i18n_.__)('%s is required.', 'aether-site-exporter'), field.label);
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
        return (0,external_wp_i18n_.sprintf)(/* translators: %s: Field label */
        (0,external_wp_i18n_.__)('%s format is invalid.', 'aether-site-exporter'), field.label);
      }
    }

    // Min length validation
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      return (0,external_wp_i18n_.sprintf)(/* translators: 1: Field label, 2: Minimum length */
      (0,external_wp_i18n_.__)('%1$s must be at least %2$d characters.', 'aether-site-exporter'), field.label, validation.minLength);
    }

    // Max length validation
    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      return (0,external_wp_i18n_.sprintf)(/* translators: 1: Field label, 2: Maximum length */
      (0,external_wp_i18n_.__)('%1$s must be no more than %2$d characters.', 'aether-site-exporter'), field.label, validation.maxLength);
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
 * @package
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
      throw new Error((0,external_wp_i18n_.sprintf)(/* translators: %s: JSON string of validation errors */
      (0,external_wp_i18n_.__)('Configuration validation failed: %s', 'aether-site-exporter'), JSON.stringify(errors)));
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
      } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 966));
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
    return (0,external_wp_i18n_.__)('Local Filesystem', 'aether');
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
    return (0,external_wp_i18n_.__)('Store exported sites locally in the WordPress uploads directory. No cloud deployment required.', 'aether');
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
      label: (0,external_wp_i18n_.__)('Blueprint-bundle file path', 'aether'),
      type: 'text',
      required: true,
      secure: false,
      placeholder: 'blueprint-bundle/bundle.zip',
      help: (0,external_wp_i18n_.__)('Full path to the blueprint bundle ZIP file (relative to WordPress root), including filename.', 'aether'),
      validation: {
        pattern: /^[a-zA-Z0-9/_.-]+\.zip$/,
        message: (0,external_wp_i18n_.__)('Blueprint bundle path must end with .zip and contain only letters, numbers, slashes, hyphens, underscores, and dots.', 'aether')
      }
    }, {
      id: 'public_url',
      label: (0,external_wp_i18n_.__)('Public URL', 'aether'),
      type: 'text',
      required: false,
      secure: false,
      placeholder: 'https://example.com',
      help: (0,external_wp_i18n_.__)('URL where exported files will be publicly accessible. Used for blueprint generation and URL replacements in exported HTML. Leave empty to use WordPress home URL.', 'aether'),
      validation: {
        pattern: /^https?:\/\/.+/,
        message: (0,external_wp_i18n_.__)('Public URL must be a valid HTTP or HTTPS URL', 'aether')
      }
    }, {
      id: 'static_files_path',
      label: (0,external_wp_i18n_.__)('Static Files Directory', 'aether'),
      type: 'text',
      required: true,
      secure: false,
      placeholder: 'static/',
      help: (0,external_wp_i18n_.__)('Directory where static site files will be written (relative to WordPress root). Each export overwrites the previous one.', 'aether'),
      validation: {
        pattern: /^[a-zA-Z0-9/_.-]+$/,
        message: (0,external_wp_i18n_.__)('Static files path must contain only letters, numbers, slashes, hyphens, underscores, and dots. Cannot be empty.', 'aether')
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
        errors.export_path = (0,external_wp_i18n_.__)('Export path must be relative to WordPress root and cannot contain ".."', 'aether');
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
        message: (0,external_wp_i18n_.__)('Local filesystem is ready for exports', 'aether')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_.__)('Connection test failed', 'aether')
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
        message: (0,external_wp_i18n_.__)('Export saved locally. Files are available in the exports directory.', 'aether'),
        deploymentUrl: '' // No deployment URL for local storage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_.__)('Deployment failed', 'aether')
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
      message: configured ? (0,external_wp_i18n_.__)('Local filesystem storage is active', 'aether') : (0,external_wp_i18n_.__)('Local filesystem storage is available', 'aether')
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
        message: (0,external_wp_i18n_.__)('File is available locally', 'aether')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_.__)('File upload failed', 'aether')
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
// EXTERNAL MODULE: ./assets/src/utils/api.js + 1 modules
var api = __webpack_require__(186);
;// ./assets/src/utils/debug.js
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
function debug_debug(...args) {
  if (isDebugEnabled() && window.console && window.console.log) {
    window.console.log('[Aether]', ...args);
  }
}

/**
 * Log an error to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debug_debugError(...args) {
  if (isDebugEnabled() && window.console && window.console.error) {
    window.console.error('[Aether Error]', ...args);
  }
}

/**
 * Log a warning to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debug_debugWarn(...args) {
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
    debug_debug('Debug mode enabled');
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
  debug: debug_debug,
  error: debug_debugError,
  warn: debug_debugWarn,
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
      return standardResponse_createErrorResponse(error.message);
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
      response = await (0,api/* default */.Ay)({
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
      debug_debug('filesystemAdapter.uploadFile API error:', apiError);
      return standardResponse_createErrorResponse(fullErrorMessage);
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
      return standardResponse_createErrorResponse(fullErrorMessage);
    }

    // Call progress callback if provided (100% since we don't have chunked upload yet)
    if (options.onProgress) {
      options.onProgress(file.size, file.size, 100);
    }
    return standardResponse_createSuccessResponse();
  } catch (error) {
    debug_debug('filesystemAdapter.uploadFile error:', error);
    return standardResponse_createErrorResponse(error.message || 'Upload failed');
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
  debug('filesystemAdapter.deleteFile:', {
    staticPath,
    key
  });
  try {
    const response = await apiFetch({
      path: '/aether/site-exporter/local-storage/delete',
      method: 'DELETE',
      data: {
        key,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    debug('filesystemAdapter.deleteFile error:', error);
    return createErrorResponse(error.message || 'Delete failed');
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
  debug('filesystemAdapter.copyFile: Not implemented (not needed for local storage)');
  return createSuccessResponse();
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
  debug('filesystemAdapter.listObjects: Not implemented (not needed for static site generation)');
  return createSuccessResponse({
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
  debug('filesystemAdapter.batchCopy: Not implemented (not needed for local storage)');
  return createSuccessResponse();
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
  debug('filesystemAdapter.batchDelete:', {
    staticPath,
    count: keys.length
  });
  try {
    const response = await apiFetch({
      path: '/aether/site-exporter/local-storage/batch-delete',
      method: 'DELETE',
      data: {
        keys,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Batch delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    debug('filesystemAdapter.batchDelete error:', error);
    return createErrorResponse(error.message || 'Batch delete failed');
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
  debug('filesystemAdapter.downloadFile:', {
    staticPath,
    key
  });
  try {
    const response = await apiFetch({
      path: `/aether/site-exporter/local-storage/download?key=${encodeURIComponent(key)}&static_path=${encodeURIComponent(staticPath)}&job_id=${options.jobId || ''}`,
      method: 'GET',
      parse: false // Get raw response
    });
    if (!response.ok) {
      return null;
    }
    return await response.blob();
  } catch (error) {
    debug('filesystemAdapter.downloadFile error:', error);
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
;// ./assets/src/export/utils/urlUtils.js
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
function urlUtils_resolveRelative(url, baseUrl) {
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
  return applyFilters('aether.url.resolve', resolvedUrl, url, baseUrl);
}

/**
 * Check if URL is external to the site.
 *
 * @param {string} url     URL to check.
 * @param {string} siteUrl Site URL for comparison.
 * @return {boolean} True if external.
 */
function urlUtils_isExternal(url, siteUrl) {
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
  return applyFilters('aether.url.is_external', isExternalUrl, url, siteUrl);
}

/**
 * Force URL to use HTTPS scheme.
 *
 * @param {string} url URL to convert.
 * @return {string} URL with HTTPS scheme.
 */
function urlUtils_forceHttps(url) {
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
function urlUtils_stripPlaygroundScope(path) {
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
function urlUtils_normalize(url, siteUrl) {
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
      urlObj.pathname = urlUtils_stripPlaygroundScope(urlObj.pathname);
      url = urlObj.toString();
    }
  } catch {
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      const strippedPath = urlUtils_stripPlaygroundScope(pathMatch[1]);
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
  return applyFilters('aether.url.normalize', url, siteUrl);
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
function urlUtils_escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract host from a URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string if invalid.
 */
function urlUtils_extractHost(url) {
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
function urlUtils_shouldSkipUrl(url) {
  return url.startsWith('#') || url.startsWith('data:') || url.includes('imagedelivery.net');
}
;// ./assets/src/export/utils/htmlRewriting.js
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
function htmlRewriting_protectScriptContent(html) {
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
function htmlRewriting_restoreScriptContent(html, placeholders) {
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
function htmlRewriting_collectSiteUrlMatches(html, siteHost) {
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
function htmlRewriting_replaceSiteUrlMatches(html, matches, rewriteUrl, contextUrl) {
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
function htmlRewriting_rewriteAbsolutePaths(html, basePath) {
  if (!basePath || basePath === '' || basePath === '/') {
    return html;
  }
  debug('[URL Rewriter] Rewriting absolute paths with base:', basePath);
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
    debug(`[URL Rewriter] Rewriting: ${path} -> ${rewrittenPath}`);
    return attrPart + quote + rewrittenPath + quote;
  });
  debug(`[URL Rewriter] Processed ${replaceCount} absolute path attributes`);
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
function htmlRewriting_rewriteSrcsetUrls(html, rewriteUrl, contextUrl) {
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
function htmlRewriting_rewriteImportMaps(html, rewriteUrl, contextUrl) {
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
function urlRewriter_createUrlRewriter(siteUrl, staticUrl = null, urlMap = {}) {
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
    return applyFilters('aether.url.rewrite', rewrittenUrl, url, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }

  /**
   * Rewrite all URLs in HTML content.
   *
   * @param {string} html       HTML content.
   * @param {string} contextUrl Current page URL for relative URL resolution.
   * @return {string} HTML with rewritten URLs.
   */
  function rewriteHtml(html, contextUrl) {
    debug('[URL Rewriter] rewriteHtml called with:');
    debug('  - contextUrl:', contextUrl);
    debug('  - siteUrl:', siteUrl);
    debug('  - normalizedStaticUrl:', normalizedStaticUrl);
    debug('  - HTML length:', html.length);

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
        debugError('[URL Rewriter] Error in absolute path rewriting:', error);
      }
    }

    // Rewrite srcset and import map URLs
    result = rewriteSrcsetUrls(result, rewriteUrl, contextUrl);
    result = rewriteImportMaps(result, rewriteUrl, contextUrl);

    // Restore inline script content
    result = restoreScriptContent(result, placeholders);
    return applyFilters('aether.url.rewrite_html', result, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
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
;// ./assets/src/export/utils/htmlProcessor.js
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
function htmlProcessor_processHtml(html, url, siteUrl, staticSiteUrl = null) {
  // STEP 1: Remove admin bar from HTML (in case source was generated while logged in).
  // This removes #wpadminbar div, related CSS/JS, and body classes.
  html = removeAdminBar(html);

  // STEP 2: Remove dynamic WordPress links (RSS comments feed, REST API, XML-RPC).
  // These features don't exist in static exports.
  html = removeDynamicWpLinks(html);

  // STEP 3: Replace all internal URLs (absolute → relative or custom domain).
  // This is the main URL rewriting step that makes the static site work.
  const urlRewriter = createUrlRewriter(siteUrl, staticSiteUrl);
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
  path = stripPlaygroundScope(path);

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
;// ./assets/src/export/utils/unifiedFileUpload.js
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
    const providerResponse = await apiFetch({
      path: `/aether/site-exporter/providers/${providerId}/config`
    });
    if (providerResponse.success && providerResponse.config && providerResponse.config.public_url) {
      return providerResponse.config.public_url;
    }
  } catch (error) {
    debugWarn(`Failed to fetch provider config for ${providerId}:`, error);
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
  doAction(actionName, fileContext);

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
async function unifiedFileUpload_uploadFile(fileContext) {
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
          debugWarn('Cannot process HTML: fileContent is not a string or Blob');
        }
        if (htmlText) {
          // Apply HTML filter hook (for consistency with Path 1)
          const filteredHtml = applyFilters('aether.export.step.uploadStaticSiteFiles.html.process', htmlText, filePath, metadata.siteUrl, staticSiteUrl, providerId);

          // Process HTML with URL rewriting
          const processedHtml = processHtml(filteredHtml, filePath, metadata.siteUrl, staticSiteUrl);

          // Convert processed HTML back to Blob with correct content type
          processedContent = new Blob([processedHtml], {
            type: 'text/html'
          });
        }
      } else {
        debugWarn(`Cannot process HTML for ${providerId}: staticSiteUrl not available`);
      }
    } catch (error) {
      debugWarn(`Failed to process HTML for ${filePath || 'unknown'}:`, error);
      // Continue with original content on error
    }
  }

  // Create context with processed content
  const contextWithProcessedContent = {
    ...fileContext,
    fileContent: processedContent
  };

  // Allow filtering of file context before upload
  const filteredContext = applyFilters('aether.file.upload.context', contextWithProcessedContent, providerId);

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
        const result = await unifiedFileUpload_uploadFile(contextWithProvider);
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
;// ./assets/src/providers/registry/ProviderRegistry.js
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
;// ./assets/src/providers/local-filesystem/index.js
/**
 * Local Filesystem Provider Registration
 *
 * This file registers hooks for the LocalFilesystem provider implementation.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * @package
 */









// Create provider instance for hook registration
const provider = new LocalFilesystemProvider();

// eslint-disable-next-line no-console
console.log('LocalFilesystemProvider: Registering provider...', provider.getId());

// Register provider in JavaScript registry
registry_ProviderRegistry.register(provider.getId(), provider);

// eslint-disable-next-line no-console
console.log('LocalFilesystemProvider: Provider registered successfully');

// Also trigger the hook for any listeners
(0,external_wp_hooks_.doAction)('aether.providers.register', provider);

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
async function handleUnifiedFileUpload(fileContext) {
  const {
    fileType,
    providerId,
    filePath,
    fileContent,
    contentType,
    storageKey,
    metadata = {}
  } = fileContext;

  // Only handle requests for local-filesystem providers
  if (!providerId || !providerId.startsWith('local-filesystem')) {
    return;
  }

  // Create a unique key for this file+provider combination
  const fileKey = `${providerId}:${filePath || storageKey}`;

  // Skip if already processed
  if (processedFiles.has(fileKey)) {
    return;
  }
  processedFiles.set(fileKey, true);

  // Initialize results tracking for this provider if needed
  if (!uploadResults[providerId]) {
    uploadResults[providerId] = {
      filesProcessed: 0,
      filesUploaded: 0,
      errors: []
    };
  }
  uploadResults[providerId].filesProcessed++;
  try {
    let staticPath = 'static/';
    let exportPath = 'blueprint-bundle/bundle.zip';

    // Fetch provider config
    try {
      const providerResponse = await external_wp_apiFetch_default()({
        path: `/aether/site-exporter/providers/${providerId}/config`
      });
      if (providerResponse.success && providerResponse.config) {
        const config = providerResponse.config;
        if (fileType === FILE_TYPES.BLUEPRINT_BUNDLE) {
          // For blueprint bundles, use export_path
          if (config.export_path) {
            exportPath = config.export_path;
          }
        } else {
          // For static files, use static_files_path
          staticPath = config.static_files_path || 'static/';
          staticPath = staticPath.replace(/\/$/, '');
        }
      }
    } catch (configError) {
      debug_debugWarn(`Failed to fetch provider config for ${providerId}:`, configError);
    }

    // Handle blueprint bundle upload
    if (fileType === FILE_TYPES.BLUEPRINT_BUNDLE) {
      // Blueprint bundle is a file path, not content
      if (!filePath) {
        throw new Error('Blueprint bundle file path is required');
      }

      // Trigger PHP action hook for blueprint bundle upload
      const response = await external_wp_apiFetch_default()({
        path: '/aether/site-exporter/local-storage/trigger-blueprint-bundle-upload',
        method: 'POST',
        data: {
          instance_id: providerId,
          source_path: filePath,
          destination_path: exportPath,
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
      debug_debug(`Uploaded blueprint bundle ${filePath} to ${exportPath} for provider ${providerId}`);
      // Set result on fileContext for unified upload system
      fileContext.result = {
        success: true
      };
      return;
    }

    // Handle static file uploads (HTML and assets)
    // Get file content as Blob
    let fileBlob = null;
    if (fileContent) {
      if (typeof fileContent === 'string') {
        fileBlob = new Blob([fileContent], {
          type: contentType || 'text/html'
        });
      } else if (fileContent instanceof Blob) {
        fileBlob = fileContent;
      }
    } else if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
      // Fetch from URL if content not provided
      try {
        const response = await fetch(filePath, {
          method: 'GET',
          credentials: 'omit'
        });
        if (response.ok) {
          fileBlob = await response.blob();
        } else {
          throw new Error(`Failed to fetch ${filePath}: HTTP ${response.status}`);
        }
      } catch (fetchError) {
        uploadResults[providerId].errors.push({
          url: filePath,
          error: fetchError.message
        });
        // Set result on fileContext for unified upload system
        fileContext.result = {
          success: false,
          error: fetchError.message
        };
        return;
      }
    } else {
      throw new Error('File content or valid URL is required');
    }
    if (!fileBlob) {
      uploadResults[providerId].errors.push({
        url: filePath,
        error: 'Failed to get file content'
      });
      // Set result on fileContext for unified upload system
      fileContext.result = {
        success: false,
        error: 'Failed to get file content'
      };
      return;
    }

    // HTML is already processed by the base layer (unifiedFileUpload.js)
    // Provider receives pre-processed HTML in fileContent

    // Check if file is HTML for path handling
    const isHtml = fileType === FILE_TYPES.STATIC_HTML || contentType && contentType.includes('text/html');

    // Determine storage key
    let finalStorageKey = storageKey;
    if (!finalStorageKey) {
      // Derive from filePath
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        try {
          const urlObj = new URL(filePath);
          finalStorageKey = urlObj.pathname;
          if (urlObj.search) {
            finalStorageKey = finalStorageKey.replace(urlObj.search, '');
          }
        } catch (urlError) {
          debug_debugWarn(`Failed to parse URL ${filePath}:`, urlError);
          finalStorageKey = filePath;
        }
      } else {
        finalStorageKey = filePath;
      }
    }

    // Remove leading slash and ensure relative path
    finalStorageKey = finalStorageKey.replace(/^\/+/, '');

    // Handle directory paths (add index.html)
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(finalStorageKey);
    if (finalStorageKey === '') {
      finalStorageKey = 'index.html';
    } else if (finalStorageKey.endsWith('/')) {
      finalStorageKey = finalStorageKey.replace(/\/+$/, '') + '/index.html';
    } else if (!hasFileExtension && isHtml) {
      finalStorageKey = finalStorageKey + '/index.html';
    }

    // Upload file via filesystemAdapter
    const uploadResult = await uploadFile(staticPath, finalStorageKey, fileBlob, {
      contentType: contentType || 'text/html',
      jobId: ''
    });
    if (uploadResult.success) {
      uploadResults[providerId].filesUploaded++;
      debug_debug(`Uploaded ${finalStorageKey} to ${staticPath} for provider ${providerId}`);
      // Set result on fileContext for unified upload system
      fileContext.result = {
        success: true
      };
    } else {
      uploadResults[providerId].errors.push({
        url: filePath,
        path: finalStorageKey,
        error: uploadResult.error || 'Upload failed'
      });
      debug_debugWarn(`Failed to upload ${finalStorageKey} for provider ${providerId}:`, uploadResult.error);
      // Set result on fileContext for unified upload system
      fileContext.result = {
        success: false,
        error: uploadResult.error || 'Upload failed'
      };
    }
  } catch (error) {
    uploadResults[providerId].errors.push({
      url: filePath,
      error: error.message || 'Unknown error'
    });
    debug_debugWarn(`Error processing file for provider ${providerId}:`, error);
    // Set result on fileContext for unified upload system
    fileContext.result = {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Register unified file upload action hook.
 *
 * Handles all file uploads (blueprint bundles, static HTML, static assets)
 * via the unified aether.file.upload action.
 */
(0,external_wp_hooks_.addAction)('aether.file.upload', 'aether/local-filesystem', fileContext => {
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
(0,external_wp_hooks_.addFilter)('aether.provider.test', 'aether/local-filesystem', (handler, providerId, config) => {
  // Only handle requests for local-filesystem providers (including instances)
  if (!providerId || !providerId.startsWith('local-filesystem')) {
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
  if (providerId && providerId.startsWith('local-filesystem')) {
    return 'direct';
  }
  return strategy;
}, 10);
/******/ })()
;