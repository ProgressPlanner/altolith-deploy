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
 * Creates an isolated thread context by merging:
 * - Global context (read-only, shared across threads)
 * - Thread-specific properties (currentProviderInstance, etc.)
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
	// Thread context extends global context with thread-specific properties
	return {
		...globalContext, // All global data is read-only in threads
		currentProviderInstance: providerInstance,
		providerInstanceConfig: providerInstance.config || {},
		// Thread-specific callbacks override global ones
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
		const globalResult = await executeSteps(
			globalSteps,
			initialContext,
			options
		);

		// Extract global state from result
		globalState = globalResult.state || {};
	}

	// Build global context (initial + global step results)
	const globalContext = {
		...initialContext,
		...globalState,
	};

	// If no provider instances, just return global results
	if ( providerInstances.length === 0 ) {
		return {
			success: true,
			globalState,
			threadResults: [],
		};
	}

	// Execute per-thread steps in parallel for each provider instance
	const threadPromises = providerInstances.map(
		async ( providerInstance ) => {
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
					// Prefix step ID with provider instance for unique tracking
					const threadStepId = `${ providerInstance.id }:${ stepId }`;

					if ( initialContext.setStepProgress ) {
						initialContext.setStepProgress(
							threadStepId,
							progress
						);
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
				const threadResult = await executeSteps(
					threadSteps,
					threadContext,
					options
				);

				return {
					success: true,
					providerInstance: providerInstance.id,
					state: threadResult.state || {},
					error: null,
				};
			} catch ( error ) {
				return {
					success: false,
					providerInstance: providerInstance.id,
					state: {},
					error: error.message || 'Unknown error',
				};
			}
		}
	);

	// Wait for all threads to complete
	const threadResults = await Promise.all( threadPromises );

	// Check if any threads succeeded
	const successfulThreads = threadResults.filter( ( r ) => r.success );
	const failedThreads = threadResults.filter( ( r ) => ! r.success );

	// Workflow succeeds if at least one thread succeeded
	const overallSuccess = successfulThreads.length > 0;

	return {
		success: overallSuccess,
		globalState,
		threadResults,
		successCount: successfulThreads.length,
		failureCount: failedThreads.length,
	};
}

export default {
	categorizeSteps,
	buildThreadContext,
	executeThreadedWorkflow,
};
