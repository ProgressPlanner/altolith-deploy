/**
 * Global Step State - In-Memory Coordination for Global Steps
 *
 * Provides lightweight coordination for global steps across parallel provider queues.
 * Uses module-level Map storage (no IndexedDB) to preserve class instances and methods.
 *
 * Features:
 * - In-memory result storage (preserves class instances)
 * - Lock-based coordination (one provider executes, others wait)
 * - BroadcastChannel notifications for instant updates
 * - Stale lock detection (10-minute timeout)
 * - WordPress hooks integration for extensibility
 *
 * Architecture:
 * - Provider A acquires lock, executes step, stores result, broadcasts
 * - Provider B sees lock held, waits via polling
 * - Provider B receives broadcast, retrieves result from Map
 * - No serialization = class instances with methods work perfectly
 */

import { doAction } from '@wordpress/hooks';

/**
 * Lock timeout - locks older than this are considered stale
 */
const STALE_LOCK_THRESHOLD = 10 * 60 * 1000; // 10 minutes

/**
 * Polling interval when waiting for step completion
 */
const POLL_INTERVAL = 500; // 500ms

/**
 * Maximum wait time for step completion
 */
const WAIT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Global Step State Manager
 *
 * Module-level singleton managing step coordination.
 */
class GlobalStepState {
	constructor() {
		/**
		 * Step results storage
		 * Map<stepId, {status: 'running'|'completed'|'error', result?: any, error?: string, timestamp: number}>
		 */
		this.results = new Map();

		/**
		 * BroadcastChannel for cross-provider notifications
		 * Allows instant notification when steps complete
		 */
		this.channel = null;

		/**
		 * Current job ID (for cleanup on new job)
		 */
		this.jobId = null;

		this._initializeChannel();
	}

	/**
	 * Initialize BroadcastChannel if available
	 *
	 * @private
	 */
	_initializeChannel() {
		if ( typeof BroadcastChannel !== 'undefined' ) {
			try {
				this.channel = new BroadcastChannel( 'aether-export-steps' );

				// Listen for step completion broadcasts
				this.channel.onmessage = ( event ) => {
					if ( event.data?.type === 'step-complete' ) {
						// Fire hook when receiving broadcast
						doAction(
							'aether.step.broadcast-received',
							event.data.stepId,
							event.data.jobId
						);
					}
				};
			} catch ( error ) {
				// BroadcastChannel not available or failed to initialize
				// Fallback to polling-only mode
				this.channel = null;
			}
		}
	}

	/**
	 * Clear all state (call at start of new job)
	 *
	 * @param {string} jobId - New job ID
	 */
	clear( jobId ) {
		this.jobId = jobId;
		this.results.clear();

		// Clean up stale locks from any previous jobs
		this._cleanupStaleLocks();

		doAction( 'aether.globalStepState.cleared', jobId );
	}

	/**
	 * Clean up stale locks (locks held > 10 minutes)
	 *
	 * @private
	 */
	_cleanupStaleLocks() {
		const now = Date.now();
		const staleLockTime = now - STALE_LOCK_THRESHOLD;

		for ( const [ stepId, entry ] of this.results.entries() ) {
			if (
				entry.status === 'running' &&
				entry.timestamp < staleLockTime
			) {
				// Stale lock detected - remove it
				this.results.delete( stepId );

				doAction(
					'aether.globalStepState.stale-lock-removed',
					stepId
				);
			}
		}
	}

	/**
	 * Try to acquire lock for running a step
	 *
	 * @param {string} stepId - Step identifier
	 * @return {boolean} True if lock acquired, false if already held
	 */
	lock( stepId ) {
		// Check if lock already held
		if ( this.results.has( stepId ) ) {
			return false;
		}

		// Acquire lock
		this.results.set( stepId, {
			status: 'running',
			timestamp: Date.now(),
		} );

		return true;
	}

	/**
	 * Release lock (not typically needed - set() replaces lock)
	 *
	 * @param {string} stepId - Step identifier
	 */
	unlock( stepId ) {
		this.results.delete( stepId );
	}

	/**
	 * Get step result if completed
	 *
	 * @param {string} stepId - Step identifier
	 * @return {Object|null} Result object or null if not completed
	 */
	get( stepId ) {
		const entry = this.results.get( stepId );

		if ( ! entry || entry.status !== 'completed' ) {
			return null;
		}

		return entry.result;
	}

	/**
	 * Store step result (replaces lock)
	 *
	 * @param {string} stepId - Step identifier
	 * @param {Object} result - Step execution result (can include class instances)
	 */
	set( stepId, result ) {
		this.results.set( stepId, {
			status: 'completed',
			result,
			timestamp: Date.now(),
		} );

		// Broadcast completion to other providers
		if ( this.channel ) {
			try {
				this.channel.postMessage( {
					type: 'step-complete',
					stepId,
					jobId: this.jobId,
				} );
			} catch ( error ) {
				// Broadcast failed - other providers will still get result via polling
			}
		}
	}

	/**
	 * Store step error
	 *
	 * @param {string} stepId - Step identifier
	 * @param {Error}  error  - Error object
	 */
	setError( stepId, error ) {
		this.results.set( stepId, {
			status: 'error',
			error: error.message || String( error ),
			timestamp: Date.now(),
		} );

		// Broadcast error to other providers
		if ( this.channel ) {
			try {
				this.channel.postMessage( {
					type: 'step-error',
					stepId,
					jobId: this.jobId,
					error: error.message || String( error ),
				} );
			} catch ( error ) {
				// Broadcast failed - other providers will still see error via polling
			}
		}
	}

	/**
	 * Wait for step to complete (polling + broadcast)
	 *
	 * @param {string} stepId - Step identifier
	 * @return {Promise<Object>} Completed step result
	 * @throws {Error} If step fails or times out
	 */
	async wait( stepId ) {
		const startTime = Date.now();

		// Create promise that resolves on broadcast (if available)
		let broadcastResolver = null;
		const broadcastPromise = this.channel
			? new Promise( ( resolve ) => {
					broadcastResolver = ( event ) => {
						if (
							event.data?.type === 'step-complete' &&
							event.data?.stepId === stepId
						) {
							resolve();
						} else if (
							event.data?.type === 'step-error' &&
							event.data?.stepId === stepId
						) {
							resolve(); // Will be handled by polling check
						}
					};
					this.channel.addEventListener(
						'message',
						broadcastResolver
					);
			  } )
			: null;

		try {
			// Polling loop
			while ( Date.now() - startTime < WAIT_TIMEOUT ) {
				const entry = this.results.get( stepId );

				if ( ! entry ) {
					// Not started yet, keep waiting
					await this._sleep( POLL_INTERVAL );
					continue;
				}

				if ( entry.status === 'completed' ) {
					return entry.result;
				}

				if ( entry.status === 'error' ) {
					throw new Error( entry.error );
				}

				// Still running, wait for either broadcast or poll interval
				if ( broadcastPromise ) {
					await Promise.race( [
						broadcastPromise,
						this._sleep( POLL_INTERVAL ),
					] );
				} else {
					await this._sleep( POLL_INTERVAL );
				}
			}

			throw new Error( `Timeout waiting for step: ${ stepId }` );
		} finally {
			// Clean up broadcast listener
			if ( this.channel && broadcastResolver ) {
				this.channel.removeEventListener(
					'message',
					broadcastResolver
				);
			}
		}
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

	/**
	 * Get current state (for debugging)
	 *
	 * @return {Object} Current state information
	 */
	getState() {
		return {
			jobId: this.jobId,
			stepCount: this.results.size,
			steps: Array.from( this.results.entries() ).map(
				( [ stepId, entry ] ) => ( {
					stepId,
					status: entry.status,
					timestamp: entry.timestamp,
					hasResult: entry.status === 'completed',
					error: entry.error || null,
				} )
			),
			hasBroadcastChannel: this.channel !== null,
		};
	}
}

// Export singleton instance
export const globalStepState = new GlobalStepState();

// Export class for testing
export { GlobalStepState };
