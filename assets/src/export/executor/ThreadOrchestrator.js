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
 *
 * @param {Array}    items       - Array of items to process
 * @param {Function} fn          - Async function to call for each item
 * @param {number}   concurrency - Max concurrent executions (default: 5)
 * @return {Promise<Array>} Results array in original order
 */
async function limitConcurrency( items, fn, concurrency = 5 ) {
	const results = [];
	const executing = [];

	for ( const [ index, item ] of items.entries() ) {
		const promise = Promise.resolve().then( () => fn( item, index ) );
		results[ index ] = promise;

		if ( concurrency <= items.length ) {
			const e = promise.then( () =>
				executing.splice( executing.indexOf( e ), 1 )
			);
			executing.push( e );

			if ( executing.length >= concurrency ) {
				await Promise.race( executing );
			}
		}
	}

	return Promise.all( results );
}

/**
 * Deep clone global context to ensure thread isolation
 *
 * Creates a deep copy of global context so threads cannot mutate shared data.
 * Special handling for Maps, Arrays, and nested objects.
 *
 * @param {Object} context - Global context to clone
 * @return {Object} Deep cloned context
 */
function deepCloneContext( context ) {
	const cloned = {};

	for ( const [ key, value ] of Object.entries( context ) ) {
		// Skip functions (callbacks are handled separately)
		if ( typeof value === 'function' ) {
			continue;
		}

		// Handle Map objects
		if ( value instanceof Map ) {
			cloned[ key ] = new Map( value );
			continue;
		}

		// Handle Arrays
		if ( Array.isArray( value ) ) {
			cloned[ key ] = [ ...value ];
			continue;
		}

		// Handle plain objects (deep clone)
		if ( value && typeof value === 'object' && value.constructor === Object ) {
			cloned[ key ] = JSON.parse( JSON.stringify( value ) );
			continue;
		}

		// Primitive values
		cloned[ key ] = value;
	}

	return cloned;
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

	// Deep clone global context to ensure thread isolation
	// Prevents threads from mutating shared data
	const clonedContext = deepCloneContext( globalContext );

	// Add thread-specific properties
	return {
		...clonedContext,
		currentProviderInstance: providerInstance,
		providerInstanceConfig: providerInstance.config || {},
		// Thread-specific callbacks (functions not cloned)
		setStatusMessage:
			callbacks.setStatusMessage || globalContext.setStatusMessage,
		setStepProgress:
			callbacks.setStepProgress || globalContext.setStepProgress,
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

	// Handle case where no provider instances but thread steps exist
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
				setStatusMessage: (
					message,
					type,
					key,
					progress,
					metadata
				) => {
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
				const threadState = await executeSteps(
					threadSteps,
					threadContext,
					options
				);

				// Mark provider as complete
				if ( initialContext.setProviderProgress ) {
					initialContext.setProviderProgress( providerInstance.id, {
						stepId: null,
						stepLabel: 'Complete',
						progress: 100,
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
				// Mark provider as error
				if ( initialContext.setProviderProgress ) {
					initialContext.setProviderProgress( providerInstance.id, {
						stepId: null,
						stepLabel: 'Error',
						progress: 0,
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
	const noneSucceeded = successfulThreads.length === 0;

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
