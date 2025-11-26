/**
 * Thread Orchestrator
 *
 * Orchestrates multi-threaded workflow execution where each provider instance
 * runs in its own isolated thread. Categorizes steps into global (run once)
 * and per-thread (run per provider instance), then executes them in parallel.
 *
 * @since 1.0.0
 */

import { isThreadStep } from './DataValidator';
import { executeSteps } from './StepExecutor';

/**
 * Execute async functions with concurrency limit
 *
 * Limits number of concurrent executions to prevent resource exhaustion.
 * Uses a sliding window approach to maintain max concurrent executions.
 *
 * @param {Array}    items       - Array of items to process
 * @param {Function} fn          - Async function to call for each item
 * @param {number}   concurrency - Max concurrent executions (default: 5)
 * @return {Promise<Array>} Results array in original order
 */
async function limitConcurrency( items, fn, concurrency = 5 ) {
	const results = new Array( items.length );
	const executing = [];

	for ( let index = 0; index < items.length; index++ ) {
		// Create promise for this item and wrap it with cleanup
		const promise = Promise.resolve( fn( items[ index ], index ) ).then(
			( result ) => {
				// Store result in correct position
				results[ index ] = result;
				return result;
			}
		);

		// Create cleanup promise that removes from executing array
		const cleanup = promise.then( () => {
			const execIndex = executing.indexOf( cleanup );
			if ( execIndex !== -1 ) {
				executing.splice( execIndex, 1 );
			}
		} );

		// Add cleanup promise to executing array (not the original promise)
		executing.push( cleanup );

		// If we've hit concurrency limit, wait for one to complete
		if ( executing.length >= concurrency ) {
			await Promise.race( executing );
		}
	}

	// Wait for all remaining promises to complete
	await Promise.all( executing );

	return results;
}

/**
 * Deep clone global context to ensure thread isolation
 *
 * Creates a truly deep copy of global context so threads cannot mutate shared data.
 * Handles Maps, Arrays, and nested objects recursively.
 * Tracks visited objects to handle circular references.
 *
 * @param {Object}  context Global context to clone
 * @param {WeakMap} visited Internal: tracks cloned objects to handle circular refs
 * @return {Object} Deep cloned context
 */
function deepCloneContext( context, visited = new WeakMap() ) {
	// Handle primitives and null
	if ( context === null || typeof context !== 'object' ) {
		return context;
	}

	// Check if already cloned (handles circular references)
	if ( visited.has( context ) ) {
		return visited.get( context );
	}

	const cloned = {};
	// Mark this object as visited BEFORE recursing to handle circular references
	visited.set( context, cloned );

	for ( const [ key, value ] of Object.entries( context ) ) {
		// Skip functions (callbacks are handled separately)
		if ( typeof value === 'function' ) {
			continue;
		}

		// Handle null
		if ( value === null ) {
			cloned[ key ] = null;
			continue;
		}

		// Handle Map objects (deep clone entries, including keys)
		if ( value instanceof Map ) {
			const clonedMap = new Map();
			visited.set( value, clonedMap );

			for ( const [ mapKey, mapValue ] of value.entries() ) {
				// Recursively clone both keys and values
				const clonedKey =
					typeof mapKey === 'object' && mapKey !== null
						? deepCloneValue( mapKey, visited )
						: mapKey;
				const clonedValue =
					typeof mapValue === 'object' && mapValue !== null
						? deepCloneValue( mapValue, visited )
						: mapValue;
				clonedMap.set( clonedKey, clonedValue );
			}
			cloned[ key ] = clonedMap;
			continue;
		}

		// Handle Set objects (deep clone values)
		if ( value instanceof Set ) {
			const clonedSet = new Set();
			visited.set( value, clonedSet );

			for ( const item of value.values() ) {
				// Recursively clone set items
				const clonedItem =
					typeof item === 'object' && item !== null
						? deepCloneValue( item, visited )
						: item;
				clonedSet.add( clonedItem );
			}
			cloned[ key ] = clonedSet;
			continue;
		}

		// Handle Arrays (deep clone elements)
		if ( Array.isArray( value ) ) {
			const clonedArray = [];
			visited.set( value, clonedArray );

			for ( let i = 0; i < value.length; i++ ) {
				clonedArray[ i ] =
					typeof value[ i ] === 'object' && value[ i ] !== null
						? deepCloneValue( value[ i ], visited )
						: value[ i ];
			}
			cloned[ key ] = clonedArray;
			continue;
		}

		// Handle plain objects (deep clone recursively)
		if ( typeof value === 'object' && value.constructor === Object ) {
			cloned[ key ] = deepCloneContext( value, visited );
			continue;
		}

		// Handle Date objects
		if ( value instanceof Date ) {
			cloned[ key ] = new Date( value.getTime() );
			continue;
		}

		// Handle RegExp objects
		if ( value instanceof RegExp ) {
			cloned[ key ] = new RegExp( value.source, value.flags );
			continue;
		}

		// Primitive values or unhandled types (e.g., DOM nodes)
		// For unhandled types, we keep the reference (can't clone everything)
		cloned[ key ] = value;
	}

	return cloned;
}

/**
 * Deep clone a single value (used by Map/Array cloning)
 *
 * @param {*}       value   Value to clone
 * @param {WeakMap} visited Tracks cloned objects
 * @return {*} Cloned value
 */
function deepCloneValue( value, visited ) {
	if ( value === null || typeof value !== 'object' ) {
		return value;
	}

	if ( visited.has( value ) ) {
		return visited.get( value );
	}

	if ( value instanceof Map ) {
		const clonedMap = new Map();
		visited.set( value, clonedMap );
		for ( const [ k, v ] of value.entries() ) {
			// Clone both keys and values
			const clonedKey =
				typeof k === 'object' && k !== null
					? deepCloneValue( k, visited )
					: k;
			const clonedValue =
				typeof v === 'object' && v !== null
					? deepCloneValue( v, visited )
					: v;
			clonedMap.set( clonedKey, clonedValue );
		}
		return clonedMap;
	}

	if ( value instanceof Set ) {
		const clonedSet = new Set();
		visited.set( value, clonedSet );
		for ( const item of value.values() ) {
			const clonedItem =
				typeof item === 'object' && item !== null
					? deepCloneValue( item, visited )
					: item;
			clonedSet.add( clonedItem );
		}
		return clonedSet;
	}

	if ( Array.isArray( value ) ) {
		const clonedArray = [];
		visited.set( value, clonedArray );
		for ( let i = 0; i < value.length; i++ ) {
			clonedArray[ i ] = deepCloneValue( value[ i ], visited );
		}
		return clonedArray;
	}

	if ( value instanceof Date ) {
		return new Date( value.getTime() );
	}

	if ( value instanceof RegExp ) {
		return new RegExp( value.source, value.flags );
	}

	if ( typeof value === 'object' && value.constructor === Object ) {
		return deepCloneContext( value, visited );
	}

	// Unhandled types - return reference
	return value;
}

/**
 * Categorize steps into global and per-thread
 *
 * @param {Array} steps - All registered steps
 * @return {Object} { globalSteps: Array, threadSteps: Array }
 */
export function categorizeSteps( steps ) {
	const globalSteps = [];
	const threadSteps = [];

	steps.forEach( ( step ) => {
		if ( isThreadStep( step ) ) {
			threadSteps.push( step );
		} else {
			globalSteps.push( step );
		}
	} );

	return { globalSteps, threadSteps };
}

/**
 * Build thread context from global context and provider instance
 *
 * Creates an isolated thread context by deep cloning global context
 * and adding thread-specific properties.
 *
 * @param {Object} globalContext    - Global execution context
 * @param {Object} providerInstance - Provider instance object
 * @param {Object} callbacks        - Thread-specific callbacks
 * @return {Object} Thread context
 */
export function buildThreadContext(
	globalContext,
	providerInstance,
	callbacks = {}
) {
	// Validate provider instance
	if ( ! providerInstance || ! providerInstance.id ) {
		throw new Error( 'Invalid provider instance: missing id' );
	}

	// Preserve function references before cloning (functions are skipped during clone)
	// These functions need to be preserved in thread context
	const preservedFunctions = {
		setStatusMessage: globalContext.setStatusMessage,
		setStepProgress: globalContext.setStepProgress,
		processStaticSiteUrls: globalContext.processStaticSiteUrls,
		generateBlueprintJson: globalContext.generateBlueprintJson,
		updateStaticSiteProgressContext:
			globalContext.updateStaticSiteProgressContext,
		assetManager: globalContext.assetManager,
		api: globalContext.api,
		removeMessage: globalContext.removeMessage,
		setOverallProgressValue: globalContext.setOverallProgressValue,
	};

	// Deep clone global context to ensure thread isolation
	// Prevents threads from mutating shared data
	const clonedContext = deepCloneContext( globalContext, new WeakMap() );

	// Add thread-specific properties
	return {
		...clonedContext,
		currentProviderInstance: providerInstance,
		providerInstanceConfig: providerInstance.config || {},
		// Preserve function references (functions not cloned, need to be restored)
		setStatusMessage:
			callbacks.setStatusMessage || preservedFunctions.setStatusMessage,
		setStepProgress:
			callbacks.setStepProgress || preservedFunctions.setStepProgress,
		processStaticSiteUrls: preservedFunctions.processStaticSiteUrls,
		generateBlueprintJson: preservedFunctions.generateBlueprintJson,
		updateStaticSiteProgressContext:
			preservedFunctions.updateStaticSiteProgressContext,
		assetManager: preservedFunctions.assetManager,
		api: preservedFunctions.api,
		removeMessage: preservedFunctions.removeMessage,
		setOverallProgressValue: preservedFunctions.setOverallProgressValue,
	};
}

/**
 * Execute workflow in multi-threaded mode
 *
 * Executes global steps first (once), then executes per-thread steps
 * in parallel for each provider instance.
 *
 * @param {Array}  steps             - All registered steps
 * @param {Object} initialContext    - Initial execution context
 * @param {Array}  providerInstances - Provider instances to execute in parallel
 * @param {Object} options           - Execution options
 * @return {Promise<Object>} Execution results
 */
export async function executeThreadedWorkflow(
	steps,
	initialContext,
	providerInstances = [],
	options = {}
) {
	// Categorize steps
	const { globalSteps, threadSteps } = categorizeSteps( steps );

	// Execute global steps first (run once, shared across all threads)
	let globalState = {};
	if ( globalSteps.length > 0 ) {
		// executeSteps returns the execution state directly
		globalState = await executeSteps(
			globalSteps,
			initialContext,
			options
		);
	}

	// Build global context (initial + global step results)
	const globalContext = {
		...initialContext,
		...globalState,
	};

	// Handle edge cases with providers and thread steps
	if ( providerInstances.length === 0 ) {
		// If there are thread steps, this is an error condition
		// Thread steps need providers to execute
		if ( threadSteps.length > 0 ) {
			const threadStepIds = threadSteps.map( ( s ) => s.id ).join( ', ' );
			throw new Error(
				`No provider instances configured, but thread steps require execution: ${ threadStepIds }. ` +
					`Please configure at least one provider instance or disable these steps.`
			);
		}

		// No thread steps and no providers - workflow completes successfully
		return {
			success: true,
			globalState,
			threadResults: [],
			successCount: 0,
			failureCount: 0,
		};
	}

	// If there are providers but no thread steps, return early (nothing to do)
	if ( threadSteps.length === 0 ) {
		return {
			success: true,
			globalState,
			threadResults: [],
			successCount: 0,
			failureCount: 0,
		};
	}

	// Execute per-thread steps for each provider instance
	// Use concurrency limiting to prevent resource exhaustion
	// Default: 5 concurrent providers (configurable via options)
	const maxConcurrency = options.maxConcurrency || 5;

	// Create step label lookup map for performance (avoid repeated array searches)
	const stepLabelMap = new Map(
		threadSteps.map( ( step ) => [ step.id, step.label ] )
	);

	const executeProviderThread = async ( providerInstance ) => {
		// Build thread-specific context
		const threadCallbacks = {
			setStatusMessage: ( message, type, key, progress, metadata ) => {
				// Add provider instance info to metadata
				const threadMetadata = {
					...metadata,
					providerInstance: providerInstance.id,
					providerLabel:
						providerInstance.label || providerInstance.id,
				};

				// Call original callback with thread info
				if ( initialContext.setStatusMessage ) {
					initialContext.setStatusMessage(
						message,
						type,
						key,
						progress,
						threadMetadata
					);
				}
			},
			setStepProgress: ( stepId, progress ) => {
				// Update step progress in context
				if ( initialContext.setStepProgress ) {
					initialContext.setStepProgress( stepId, progress );
				}

				// Update per-provider progress tracking
				if ( initialContext.setProviderProgress ) {
					// Get step label from cached map (O(1) lookup)
					const stepLabel = stepLabelMap.get( stepId ) || stepId;

					initialContext.setProviderProgress( providerInstance.id, {
						stepId,
						stepLabel,
						progress,
						status: 'active',
					} );
				}
			},
		};

		const threadContext = buildThreadContext(
			globalContext,
			providerInstance,
			threadCallbacks
		);

		// Execute thread steps for this provider instance
		try {
			// executeSteps returns the execution state directly
			// Pass all steps (global + thread) for dependency validation
			// since thread steps may depend on global steps
			const threadState = await executeSteps(
				threadSteps,
				threadContext,
				{
					...options,
					allSteps: [ ...globalSteps, ...threadSteps ],
				}
			);

			// Mark provider as complete
			if ( initialContext.setProviderProgress ) {
				initialContext.setProviderProgress( providerInstance.id, {
					stepId: null,
					stepLabel: 'Complete',
					progress: { current: 100, total: 100 },
					status: 'complete',
				} );
			}

			return {
				success: true,
				providerInstance: providerInstance.id,
				state: threadState || {},
				error: null,
			};
		} catch ( error ) {
			if ( typeof window !== 'undefined' && window.console ) {
				// eslint-disable-next-line no-console
				console.error(
					'[Aether] ThreadOrchestrator - Thread execution failed for provider:',
					providerInstance.id,
					error
				);
				// eslint-disable-next-line no-console
				console.error( '[Aether] Error stack:', error.stack );
			}

			// Mark provider as error
			if ( initialContext.setProviderProgress ) {
				initialContext.setProviderProgress( providerInstance.id, {
					stepId: null,
					stepLabel: 'Error',
					progress: { current: 0, total: 100 },
					status: 'error',
					error: error.message || 'Unknown error',
				} );
			}

			return {
				success: false,
				providerInstance: providerInstance.id,
				state: {},
				error: error.message || 'Unknown error',
			};
		}
	};

	// Execute provider threads with concurrency limiting
	const threadResults = await limitConcurrency(
		providerInstances,
		executeProviderThread,
		maxConcurrency
	);

	// Check if any threads succeeded
	const successfulThreads = threadResults.filter( ( r ) => r.success );
	const failedThreads = threadResults.filter( ( r ) => ! r.success );

	// Determine overall success:
	// - All succeeded: complete success
	// - Some succeeded: partial success (workflow continues but with warnings)
	// - None succeeded: failure
	const allSucceeded = successfulThreads.length === threadResults.length;
	const someSucceeded = successfulThreads.length > 0;

	// Collect failed provider details for error reporting
	const failedProviders = failedThreads.map( ( r ) => ( {
		providerId: r.providerInstance,
		error: r.error,
	} ) );

	return {
		success: someSucceeded, // Succeeds if at least one provider worked
		partialSuccess: someSucceeded && ! allSucceeded, // True if some failed
		allSucceeded, // True only if all providers succeeded
		globalState,
		threadResults,
		successCount: successfulThreads.length,
		failureCount: failedThreads.length,
		failedProviders, // Array of {providerId, error} for failed providers
	};
}

export default {
	categorizeSteps,
	buildThreadContext,
	executeThreadedWorkflow,
};
