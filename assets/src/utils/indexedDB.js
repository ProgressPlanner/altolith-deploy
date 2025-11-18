/**
 * IndexedDB Wrapper - Abstract storage interface for browser persistent storage
 *
 * Provides a simple, promise-based API for storing data in IndexedDB.
 * Works in all modern browsers including WordPress Playground WASM environment.
 *
 * Features:
 * - Simple key-value storage interface
 * - Automatic database initialization
 * - Promise-based async API
 * - Error handling and quota management
 * - Support for multiple stores
 * - Automatic cleanup of expired data
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
			indexes: [
				{ name: 'timestamp', keyPath: 'timestamp', unique: false },
				{ name: 'type', keyPath: 'type', unique: false },
			],
		},
	},
};

/**
 * Open IndexedDB database with configuration
 *
 * @param {Object} config         - Database configuration
 * @param {string} config.dbName  - Database name
 * @param {number} config.version - Database version
 * @param {Object} config.stores  - Object stores configuration
 * @return {Promise<IDBDatabase>} Database instance
 */
async function openDatabase( config = DEFAULT_CONFIG ) {
	const cacheKey = `${ config.dbName }_v${ config.version }`;

	// Return cached instance if available
	if ( dbInstances.has( cacheKey ) ) {
		return dbInstances.get( cacheKey );
	}

	return new Promise( ( resolve, reject ) => {
		const request = indexedDB.open( config.dbName, config.version );

		request.onerror = () => {
			reject(
				new Error(
					`Failed to open IndexedDB: ${
						request.error?.message || 'Unknown error'
					}`
				)
			);
		};

		request.onsuccess = () => {
			const db = request.result;
			dbInstances.set( cacheKey, db );
			resolve( db );
		};

		request.onupgradeneeded = ( event ) => {
			const db = event.target.result;

			// Create object stores based on configuration
			Object.entries( config.stores ).forEach(
				( [ storeName, storeConfig ] ) => {
					// Delete existing store if it exists (for upgrades)
					if ( db.objectStoreNames.contains( storeName ) ) {
						db.deleteObjectStore( storeName );
					}

					// Create new store
					const store = db.createObjectStore( storeName, {
						keyPath: storeConfig.keyPath,
						autoIncrement: storeConfig.autoIncrement || false,
					} );

					// Create indexes
					if ( storeConfig.indexes ) {
						storeConfig.indexes.forEach( ( index ) => {
							store.createIndex( index.name, index.keyPath, {
								unique: index.unique || false,
							} );
						} );
					}
				}
			);
		};
	} );
}

/**
 * IndexedDB Store - Abstract interface for a single object store
 */
export class IndexedDBStore {
	/**
	 * Constructor
	 *
	 * @param {string} storeName - Name of the object store
	 * @param {Object} config    - Database configuration (optional)
	 */
	constructor( storeName, config = DEFAULT_CONFIG ) {
		this.storeName = storeName;
		this.config = config;
		this.db = null;
	}

	/**
	 * Ensure database is initialized
	 *
	 * @return {Promise<IDBDatabase>} Database instance
	 */
	async ensureDatabase() {
		if ( ! this.db ) {
			this.db = await openDatabase( this.config );
		}
		return this.db;
	}

	/**
	 * Get transaction for the store
	 *
	 * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
	 * @return {Promise<IDBObjectStore>} Object store instance
	 */
	async getStore( mode = 'readonly' ) {
		const db = await this.ensureDatabase();
		const transaction = db.transaction( [ this.storeName ], mode );
		return transaction.objectStore( this.storeName );
	}

	/**
	 * Get a value by key
	 *
	 * @param {string|number} key - The key to retrieve
	 * @return {Promise<any|null>} The stored value or null if not found
	 */
	async get( key ) {
		try {
			const store = await this.getStore( 'readonly' );
			return new Promise( ( resolve, reject ) => {
				const request = store.get( key );
				request.onsuccess = () => resolve( request.result || null );
				request.onerror = () =>
					reject(
						new Error(
							`Failed to get key "${ key }": ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error( `[IndexedDB] Error getting key "${ key }":`, error );
			return null;
		}
	}

	/**
	 * Get all values from the store
	 *
	 * @param {number} limit - Maximum number of items to return (optional)
	 * @return {Promise<Array>} Array of all stored values
	 */
	async getAll( limit = undefined ) {
		try {
			const store = await this.getStore( 'readonly' );
			return new Promise( ( resolve, reject ) => {
				const request = store.getAll( undefined, limit );
				request.onsuccess = () => resolve( request.result || [] );
				request.onerror = () =>
					reject(
						new Error(
							`Failed to get all values: ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error( '[IndexedDB] Error getting all values:', error );
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
			const store = await this.getStore( 'readonly' );
			return new Promise( ( resolve, reject ) => {
				const request = store.getAllKeys();
				request.onsuccess = () => resolve( request.result || [] );
				request.onerror = () =>
					reject(
						new Error(
							`Failed to get all keys: ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error( '[IndexedDB] Error getting all keys:', error );
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
	async set( key, value, metadata = {} ) {
		try {
			const store = await this.getStore( 'readwrite' );
			const data = {
				key,
				value,
				timestamp: Date.now(),
				...metadata,
			};

			return new Promise( ( resolve, reject ) => {
				const request = store.put( data );
				request.onsuccess = () => resolve( true );
				request.onerror = () => {
					// Check for quota exceeded error
					if (
						request.error?.name === 'QuotaExceededError' ||
						request.error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
					) {
						console.warn(
							'[IndexedDB] Storage quota exceeded. Consider cleaning up old data.'
						);
					}
					reject(
						new Error(
							`Failed to set key "${ key }": ${ request.error?.message }`
						)
					);
				};
			} );
		} catch ( error ) {
			console.error( `[IndexedDB] Error setting key "${ key }":`, error );
			return false;
		}
	}

	/**
	 * Delete a value by key
	 *
	 * @param {string|number} key - The key to delete
	 * @return {Promise<boolean>} True if successful, false otherwise
	 */
	async delete( key ) {
		try {
			const store = await this.getStore( 'readwrite' );
			return new Promise( ( resolve, reject ) => {
				const request = store.delete( key );
				request.onsuccess = () => resolve( true );
				request.onerror = () =>
					reject(
						new Error(
							`Failed to delete key "${ key }": ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error(
				`[IndexedDB] Error deleting key "${ key }":`,
				error
			);
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
			const store = await this.getStore( 'readwrite' );
			return new Promise( ( resolve, reject ) => {
				const request = store.clear();
				request.onsuccess = () => resolve( true );
				request.onerror = () =>
					reject(
						new Error(
							`Failed to clear store: ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error( '[IndexedDB] Error clearing store:', error );
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
			const store = await this.getStore( 'readonly' );
			return new Promise( ( resolve, reject ) => {
				const request = store.count();
				request.onsuccess = () => resolve( request.result || 0 );
				request.onerror = () =>
					reject(
						new Error(
							`Failed to count items: ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error( '[IndexedDB] Error counting items:', error );
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
	async getByIndex( indexName, indexValue ) {
		try {
			const store = await this.getStore( 'readonly' );
			const index = store.index( indexName );

			return new Promise( ( resolve, reject ) => {
				const request = index.getAll( indexValue );
				request.onsuccess = () => resolve( request.result || [] );
				request.onerror = () =>
					reject(
						new Error(
							`Failed to get by index "${ indexName }": ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error(
				`[IndexedDB] Error getting by index "${ indexName }":`,
				error
			);
			return [];
		}
	}

	/**
	 * Delete items older than specified age
	 *
	 * @param {number} maxAgeMs - Maximum age in milliseconds
	 * @return {Promise<number>} Number of items deleted
	 */
	async deleteOlderThan( maxAgeMs ) {
		try {
			const store = await this.getStore( 'readwrite' );
			const index = store.index( 'timestamp' );
			const cutoffTime = Date.now() - maxAgeMs;

			return new Promise( ( resolve, reject ) => {
				const request = index.openCursor(
					IDBKeyRange.upperBound( cutoffTime )
				);
				let deletedCount = 0;

				request.onsuccess = ( event ) => {
					const cursor = event.target.result;
					if ( cursor ) {
						cursor.delete();
						deletedCount++;
						cursor.continue();
					} else {
						resolve( deletedCount );
					}
				};

				request.onerror = () =>
					reject(
						new Error(
							`Failed to delete old items: ${ request.error?.message }`
						)
					);
			} );
		} catch ( error ) {
			console.error( '[IndexedDB] Error deleting old items:', error );
			return 0;
		}
	}

	/**
	 * Get storage estimate (quota and usage)
	 *
	 * @return {Promise<Object>} Storage estimate with quota and usage
	 */
	async getStorageEstimate() {
		if ( navigator.storage && navigator.storage.estimate ) {
			try {
				const estimate = await navigator.storage.estimate();
				return {
					quota: estimate.quota,
					usage: estimate.usage,
					percentUsed:
						estimate.quota > 0
							? ( estimate.usage / estimate.quota ) * 100
							: 0,
				};
			} catch ( error ) {
				console.error(
					'[IndexedDB] Error getting storage estimate:',
					error
				);
			}
		}
		return { quota: null, usage: null, percentUsed: null };
	}
}

/**
 * Check if IndexedDB is available
 *
 * @return {boolean} True if IndexedDB is supported
 */
export function isIndexedDBAvailable() {
	try {
		return typeof indexedDB !== 'undefined' && indexedDB !== null;
	} catch ( error ) {
		return false;
	}
}

/**
 * Delete entire database
 *
 * @param {string} dbName - Database name to delete
 * @return {Promise<boolean>} True if successful
 */
export async function deleteDatabase( dbName ) {
	return new Promise( ( resolve, reject ) => {
		const request = indexedDB.deleteDatabase( dbName );
		request.onsuccess = () => {
			dbInstances.delete( dbName );
			resolve( true );
		};
		request.onerror = () =>
			reject(
				new Error(
					`Failed to delete database: ${ request.error?.message }`
				)
			);
	} );
}

export default IndexedDBStore;
