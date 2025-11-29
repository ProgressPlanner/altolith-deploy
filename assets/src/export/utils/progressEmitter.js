/**
 * Progress Emitter
 *
 * Unified event emitter for progress tracking across the export workflow.
 * Consolidates step progress, file progress, provider progress, and status
 * messages into a single event-driven system.
 *
 * @since 1.0.0
 */

/**
 * Progress event types.
 *
 * @type {Object}
 */
export const PROGRESS_EVENTS = {
	/** Step progress update */
	STEP: 'step',
	/** File upload/processing progress */
	FILE: 'file',
	/** Per-provider progress */
	PROVIDER: 'provider',
	/** Overall workflow progress */
	OVERALL: 'overall',
	/** Status message update */
	STATUS: 'status',
};

/**
 * Create a progress event emitter.
 *
 * Provides a simple pub/sub system for progress events with support for:
 * - Multiple handlers per event type
 * - One-time handlers (once)
 * - Handler removal (off)
 * - Bulk cleanup (clear)
 *
 * @example
 * const emitter = createProgressEmitter();
 *
 * // Subscribe to events
 * emitter.on('step', (data) => updateStepUI(data));
 * emitter.on('file', (data) => updateFileUI(data));
 * emitter.on('provider', (data) => updateProviderUI(data));
 *
 * // Emit events
 * emitter.emit('step', { stepId: 'deploy', current: 5, total: 10 });
 * emitter.emit('file', { fileName: 'style.css', current: 1, total: 5 });
 *
 * // Cleanup
 * emitter.off('step', handler);
 * emitter.clear();
 *
 * @return {Object} Progress emitter instance with on, off, once, emit, clear methods.
 */
export function createProgressEmitter() {
	/** @type {Map<string, Set<Function>>} */
	const handlers = new Map();

	/**
	 * Get handlers for an event type, creating if needed.
	 *
	 * @param {string} eventType Event type.
	 * @return {Set<Function>} Set of handlers.
	 */
	function getHandlers( eventType ) {
		if ( ! handlers.has( eventType ) ) {
			handlers.set( eventType, new Set() );
		}
		return handlers.get( eventType );
	}

	/**
	 * Subscribe to an event.
	 *
	 * @param {string}   eventType Event type (step, file, provider, overall, status).
	 * @param {Function} handler   Handler function to call when event is emitted.
	 * @return {Object} Emitter instance for chaining.
	 */
	function on( eventType, handler ) {
		if ( typeof handler !== 'function' ) {
			return emitter;
		}
		getHandlers( eventType ).add( handler );
		return emitter;
	}

	/**
	 * Unsubscribe from an event.
	 *
	 * @param {string}   eventType Event type.
	 * @param {Function} handler   Handler function to remove.
	 * @return {Object} Emitter instance for chaining.
	 */
	function off( eventType, handler ) {
		const eventHandlers = handlers.get( eventType );
		if ( eventHandlers ) {
			eventHandlers.delete( handler );
		}
		return emitter;
	}

	/**
	 * Subscribe to an event for a single emission.
	 *
	 * Handler is automatically removed after first call.
	 *
	 * @param {string}   eventType Event type.
	 * @param {Function} handler   Handler function to call once.
	 * @return {Object} Emitter instance for chaining.
	 */
	function once( eventType, handler ) {
		if ( typeof handler !== 'function' ) {
			return emitter;
		}

		const wrappedHandler = ( data ) => {
			off( eventType, wrappedHandler );
			handler( data );
		};

		return on( eventType, wrappedHandler );
	}

	/**
	 * Emit an event with data.
	 *
	 * Calls all registered handlers for the event type.
	 *
	 * @param {string} eventType Event type.
	 * @param {Object} data      Event data to pass to handlers.
	 * @return {Object} Emitter instance for chaining.
	 */
	function emit( eventType, data ) {
		const eventHandlers = handlers.get( eventType );
		if ( eventHandlers ) {
			// Create a copy of handlers to safely iterate
			// (handlers might be removed during iteration via once)
			for ( const handler of [ ...eventHandlers ] ) {
				try {
					handler( data );
				} catch ( error ) {
					// Log error but don't stop other handlers
					// eslint-disable-next-line no-console
					console.error(
						`[Altolith] Progress emitter handler error for ${ eventType }:`,
						error
					);
				}
			}
		}
		return emitter;
	}

	/**
	 * Remove all handlers.
	 *
	 * @return {Object} Emitter instance for chaining.
	 */
	function clear() {
		handlers.clear();
		return emitter;
	}

	const emitter = {
		on,
		off,
		once,
		emit,
		clear,
	};

	return emitter;
}

/**
 * Create a global progress emitter singleton.
 *
 * Use this for workflow-wide progress tracking that spans multiple
 * components and steps.
 *
 * @return {Object} Singleton progress emitter instance.
 */
let globalEmitter = null;

export function getGlobalProgressEmitter() {
	if ( ! globalEmitter ) {
		globalEmitter = createProgressEmitter();
	}
	return globalEmitter;
}

/**
 * Reset the global progress emitter.
 *
 * Clears all handlers and resets state. Useful for testing
 * or between export runs.
 */
export function resetGlobalProgressEmitter() {
	if ( globalEmitter ) {
		globalEmitter.clear();
	}
	globalEmitter = null;
}
