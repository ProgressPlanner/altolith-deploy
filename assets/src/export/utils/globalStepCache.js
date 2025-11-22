/**
 * Global Step Cache
 *
 * IndexedDB-backed cache for global step results.
 * Provides locking mechanism to ensure global steps run only once.
 */

const DB_NAME = 'aether-global-step-cache';
const DB_VERSION = 1;
const STORE_NAME = 'stepResults';

/**
 * Global step cache for sharing results across provider instances
 */
export class GlobalStepCache {
	constructor() {
		this.db = null;
		this.jobId = null;
	}

	/**
	 * Initialize cache and flush old data
	 *
	 * @param {string} jobId - Current export job ID
	 * @return {Promise<void>}
	 */
	async initialize( jobId ) {
		this.jobId = jobId;
		this.db = await this._openDatabase();
		await this.clearCache();
	}

	/**
	 * Open IndexedDB database
	 *
	 * @private
	 * @return {Promise<IDBDatabase>} Database instance
	 */
	_openDatabase() {
		return new Promise( ( resolve, reject ) => {
			if ( ! window.indexedDB ) {
				reject(
					new Error(
						'IndexedDB not available - global cache requires IndexedDB support'
					)
				);
				return;
			}

			const request = window.indexedDB.open( DB_NAME, DB_VERSION );

			request.onerror = () => reject( request.error );
			request.onsuccess = () => resolve( request.result );

			request.onupgradeneeded = ( event ) => {
				const db = event.target.result;

				if ( ! db.objectStoreNames.contains( STORE_NAME ) ) {
					const store = db.createObjectStore( STORE_NAME, {
						keyPath: 'stepId',
					} );
					store.createIndex( 'timestamp', 'timestamp', {
						unique: false,
					} );
					store.createIndex( 'jobId', 'jobId', { unique: false } );
				}
			};
		} );
	}

	/**
	 * Get cached step result
	 *
	 * @param {string} stepId - Step identifier
	 * @return {Promise<Object|null>} Cached result or null
	 */
	async getStepResult( stepId ) {
		const entry = await this._getEntry( stepId );

		if ( ! entry ) {
			return null;
		}

		if ( entry.status !== 'completed' ) {
			return null;
		}

		return entry.result;
	}

	/**
	 * Try to acquire lock for running a step
	 *
	 * @param {string} stepId - Step identifier
	 * @return {Promise<boolean>} True if lock acquired, false otherwise
	 */
	async setStepRunning( stepId ) {
		// Use a single transaction to check and set atomically
		return new Promise( ( resolve, reject ) => {
			const transaction = this.db.transaction( STORE_NAME, 'readwrite' );
			const store = transaction.objectStore( STORE_NAME );

			// First check if entry exists
			const getRequest = store.get( stepId );

			getRequest.onerror = () => reject( getRequest.error );

			getRequest.onsuccess = () => {
				const existing = getRequest.result;

				// Lock already held or step already completed
				if ( existing ) {
					resolve( false );
					return;
				}

				// Acquire lock by creating entry
				const entry = {
					stepId,
					jobId: this.jobId,
					status: 'running',
					timestamp: Date.now(),
					result: null,
				};

				const putRequest = store.put( entry );

				putRequest.onerror = () => reject( putRequest.error );
				putRequest.onsuccess = () => resolve( true );
			};
		} );
	}

	/**
	 * Store step result
	 *
	 * @param {string} stepId - Step identifier
	 * @param {Object} result - Step execution result
	 * @return {Promise<void>}
	 */
	async setStepResult( stepId, result ) {
		await this._putEntry( {
			stepId,
			jobId: this.jobId,
			status: 'completed',
			result,
			timestamp: Date.now(),
		} );
	}

	/**
	 * Store step error
	 *
	 * @param {string} stepId - Step identifier
	 * @param {Error}  error  - Error object
	 * @return {Promise<void>}
	 */
	async setStepError( stepId, error ) {
		await this._putEntry( {
			stepId,
			jobId: this.jobId,
			status: 'error',
			error: error.message || String( error ),
			timestamp: Date.now(),
		} );
	}

	/**
	 * Wait for a step to complete
	 *
	 * @param {string} stepId       - Step identifier
	 * @param {number} pollInterval - Polling interval in ms (default: 500)
	 * @param {number} timeout      - Maximum wait time in ms (default: 300000 = 5 minutes)
	 * @return {Promise<Object>} Completed step result
	 * @throws {Error} If step fails or times out
	 */
	async waitForStep( stepId, pollInterval = 500, timeout = 300000 ) {
		const startTime = Date.now();

		while ( Date.now() - startTime < timeout ) {
			const entry = await this._getEntry( stepId );

			if ( ! entry ) {
				// Not started yet, keep waiting
				await this._sleep( pollInterval );
				continue;
			}

			if ( entry.status === 'completed' ) {
				return entry.result;
			}

			if ( entry.status === 'error' ) {
				throw new Error( entry.error );
			}

			// Still running, keep waiting
			await this._sleep( pollInterval );
		}

		throw new Error( `Timeout waiting for step: ${ stepId }` );
	}

	/**
	 * Clear cached data for old jobs and stale locks
	 *
	 * Clears entries older than 1 hour, from different jobs, or with stale locks.
	 * This prevents interference between concurrent exports and handles crashed providers.
	 *
	 * Stale lock detection: Locks held for more than 10 minutes are considered stale
	 * (indicating the provider crashed or hung). These are cleared to prevent
	 * indefinite waiting by other providers.
	 *
	 * @return {Promise<void>}
	 */
	async clearCache() {
		const ONE_HOUR = 60 * 60 * 1000;
		const STALE_LOCK_THRESHOLD = 10 * 60 * 1000; // 10 minutes
		const cutoffTime = Date.now() - ONE_HOUR;
		const staleLockTime = Date.now() - STALE_LOCK_THRESHOLD;

		return new Promise( ( resolve, reject ) => {
			const transaction = this.db.transaction( STORE_NAME, 'readwrite' );
			const store = transaction.objectStore( STORE_NAME );
			const request = store.openCursor();

			request.onerror = () => reject( request.error );

			request.onsuccess = ( event ) => {
				const cursor = event.target.result;
				if ( cursor ) {
					const entry = cursor.value;

					// Delete if:
					// 1. Old (> 1 hour)
					// 2. From different job
					// 3. Stale lock (running status but > 10 minutes old)
					const isOld =
						entry.timestamp && entry.timestamp < cutoffTime;
					const isDifferentJob =
						entry.jobId && entry.jobId !== this.jobId;
					const isStaleLock =
						entry.status === 'running' &&
						entry.timestamp &&
						entry.timestamp < staleLockTime;

					if ( isOld || isDifferentJob || isStaleLock ) {
						cursor.delete();
					}

					cursor.continue();
				} else {
					// Done iterating
					resolve();
				}
			};
		} );
	}

	/**
	 * Get entry from database
	 *
	 * @private
	 * @param {string} stepId - Step identifier
	 * @return {Promise<Object|null>} Step entry or null
	 */
	async _getEntry( stepId ) {
		return new Promise( ( resolve, reject ) => {
			const transaction = this.db.transaction( STORE_NAME, 'readonly' );
			const store = transaction.objectStore( STORE_NAME );
			const request = store.get( stepId );

			request.onerror = () => reject( request.error );
			request.onsuccess = () => resolve( request.result || null );
		} );
	}

	/**
	 * Put entry into database
	 *
	 * @private
	 * @param {Object} entry - Entry to store
	 * @return {Promise<void>}
	 */
	async _putEntry( entry ) {
		return new Promise( ( resolve, reject ) => {
			const transaction = this.db.transaction( STORE_NAME, 'readwrite' );
			const store = transaction.objectStore( STORE_NAME );
			const request = store.put( entry );

			request.onerror = () => reject( request.error );
			request.onsuccess = () => resolve();
		} );
	}

	/**
	 * Sleep for specified duration
	 *
	 * @private
	 * @param {number} ms - Milliseconds to sleep
	 * @return {Promise<void>}
	 */
	_sleep( ms ) {
		return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	}
}
