/**
 * Step Executor
 *
 * Executes export workflow steps with automatic dependency resolution
 * and parallel execution support.
 */

import { doAction, applyFilters } from '@wordpress/hooks';
import { buildParallelPlan, validateDependencies } from './DependencyResolver';
import { createDependencyTracker } from './DependencyTracker';
import { errorHandler, handleStepError } from '../utils/errorHandler';
import { createProgressTracker } from '../utils/progressTracker';
import DataValidator from './DataValidator';

/**
 * Execute a workflow with the given steps.
 *
 * @param {Array<Object>} steps              Array of step definitions to execute.
 * @param {Object}        context            Initial context with dependencies and state.
 * @param {Object}        options            Execution options.
 * @param {Array<Object>} [options.allSteps] Optional: All steps (for dependency validation when executing subset).
 * @return {Promise<Object>} Final execution state.
 */
export async function executeSteps( steps, context, options = {} ) {
	const {
		onStepStart = () => {},
		onStepComplete = () => {},
		onStepSkipped = () => {},
		onError = () => {},
		allSteps = null, // Optional: All steps for dependency validation
	} = options;

	// Validate dependencies
	// Use allSteps if provided (for thread steps that depend on global steps),
	// otherwise use the steps array itself
	const stepsForValidation = allSteps || steps;
	const errors = validateDependencies( stepsForValidation, steps );
	if ( errors.length > 0 ) {
		throw new Error(
			`Invalid step dependencies: ${ errors.join( '; ' ) }`
		);
	}

	// Create dependency tracker for true dependency-based execution
	const tracker = createDependencyTracker( steps );

	// Get all step IDs
	const stepIds = steps.map( ( step ) => step.id );

	// Create workflow ID
	const workflowId = context.workflowId || `workflow-${ Date.now() }`;

	// Create progress tracker with equal step weights
	const progressTracker = createProgressTracker( workflowId, stepIds );

	// Create execution context
	const executionContext = {
		...context,
		workflowId,
		progressTracker,
		completedSteps: [],
		skippedSteps: [],
		state: {},
	};

	// Fire workflow start action
	doAction(
		'aether.export.workflow.before',
		executionContext,
		steps,
		executionContext.currentProviderInstance || null
	);

	try {
		// True dependency-based execution: start all steps simultaneously,
		// each step waits only for its specific dependencies to complete
		const stepPromises = steps.map( ( step ) =>
			executeStepWhenReady( step, steps, executionContext, tracker, {
				onStepStart,
				onStepComplete,
				onStepSkipped,
				onError,
			} )
		);

		// Wait for all steps to complete
		// Using Promise.all since executeStepWhenReady never rejects (returns error object instead)
		const results = await Promise.all( stepPromises );

		// Check for failures - find first error result
		const firstFailure = results.find(
			( r ) => r && r.success === false && r.error
		);
		if ( firstFailure ) {
			throw firstFailure.error;
		}

		// Fire workflow complete action
		doAction(
			'aether.export.workflow.after',
			executionContext.state,
			executionContext,
			executionContext.currentProviderInstance || null
		);

		// Clear progress tracker on successful completion
		progressTracker.clear();

		return executionContext.state;
	} catch ( error ) {
		doAction(
			'aether.export.workflow.error',
			error,
			executionContext,
			executionContext.currentProviderInstance || null
		);
		throw error;
	}
}

/**
 * Execute a step when its dependencies are ready.
 *
 * @param {Object} step             Step definition.
 * @param {Array}  allSteps         All step definitions.
 * @param {Object} executionContext Current execution context.
 * @param {Object} tracker          Dependency tracker.
 * @param {Object} options          Execution options with callbacks.
 * @return {Promise<Object|undefined>} Step result or undefined if skipped/failed dependency.
 */
async function executeStepWhenReady(
	step,
	allSteps,
	executionContext,
	tracker,
	options
) {
	const { onStepStart, onStepComplete, onStepSkipped, onError } = options;

	// Wait for this step's dependencies to complete
	try {
		await tracker.waitForDependencies( step );
	} catch ( depError ) {
		// A dependency failed - mark this step as failed too (cascade)
		tracker.fail(
			step.id,
			new Error( `Dependency failed: ${ depError.message }` )
		);
		return;
	}

	// Check if any dependency failed (defensive check)
	if ( tracker.hasDependencyFailed( step ) ) {
		const error = new Error(
			`Skipping "${ step.id }" due to dependency failure`
		);
		tracker.fail( step.id, error );
		return;
	}

	// Check skip condition
	const shouldSkip = applyFilters(
		`aether.export.step.${ step.id }.skip`,
		step.skip ? step.skip( executionContext ) : false,
		executionContext,
		executionContext.currentProviderInstance || null
	);

	if ( shouldSkip ) {
		executionContext.skippedSteps.push( step.id );
		onStepSkipped( step.id );
		doAction(
			`aether.export.step.${ step.id }.skipped`,
			executionContext,
			executionContext.currentProviderInstance || null
		);
		// Mark as "complete" for dependency purposes (skipped is not failed)
		tracker.complete( step.id, {} );
		return;
	}

	// Execute the step
	try {
		const result = await executeStep( step.id, allSteps, executionContext, {
			onStepStart,
			onStepComplete,
			onError,
		} );

		// Merge result into execution state (for subsequent steps)
		if ( result ) {
			Object.assign( executionContext.state, result );
		}

		// Mark as completed
		executionContext.completedSteps.push( step.id );
		tracker.complete( step.id, result );

		return { success: true, result };
	} catch ( error ) {
		tracker.fail( step.id, error );
		// Return error instead of throwing - avoids unhandled rejection issues
		return { success: false, error };
	}
}

/**
 * Execute a single step.
 *
 * @param {string}        stepId           Step ID to execute.
 * @param {Array<Object>} allSteps         All step definitions.
 * @param {Object}        executionContext Current execution context.
 * @param {Object}        options          Execution options.
 * @return {Promise<Object>} Step result data.
 */
async function executeStep( stepId, allSteps, executionContext, options ) {
	const step = allSteps.find( ( s ) => s.id === stepId );
	const { onStepStart, onStepComplete, onError } = options;

	// Fire before hook
	doAction(
		`aether.export.step.${ stepId }.before`,
		executionContext,
		executionContext.currentProviderInstance || null
	);

	onStepStart( stepId, step );

	// Initialize step progress to 0
	if ( executionContext.progressTracker ) {
		executionContext.progressTracker.updateStepProgress( stepId, 0 );
	}

	try {
		// Build context for this step (merge state into context)
		const stepContext = {
			...executionContext,
			...executionContext.state,
		};

		// Validate data requirements before execution
		DataValidator.validate( step, stepContext );

		// Execute handler with retry logic
		const result = await errorHandler.executeWithRetry(
			async () => {
				return await step.handler( stepContext );
			},
			{
				onRetry: ( error, attempt, delay ) => {
					// Fire retry action
					doAction(
						`aether.export.step.${ stepId }.retry`,
						error,
						attempt,
						delay,
						executionContext,
						executionContext.currentProviderInstance || null
					);
				},
			}
		);

		// Validate output matches provides declaration
		DataValidator.validateOutput( step, result );

		// Apply result filter
		const filteredResult = applyFilters(
			`aether.export.step.${ stepId }.result`,
			result || {},
			executionContext,
			executionContext.currentProviderInstance || null
		);

		onStepComplete( stepId, filteredResult );

		// Mark step as completed in progress tracker
		if ( executionContext.progressTracker ) {
			executionContext.progressTracker.completeStep( stepId );
		}

		// Fire after hook
		doAction(
			`aether.export.step.${ stepId }.after`,
			filteredResult,
			executionContext,
			executionContext.currentProviderInstance || null
		);

		return filteredResult;
	} catch ( error ) {
		const enhancedError = handleStepError(
			error,
			stepId,
			executionContext,
			{ onError },
			step
		);

		// Throw enhanced error to propagate to caller
		throw enhancedError;
	}
}

/**
 * Get the parallel execution plan for steps.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
export function getExecutionPlan( steps ) {
	return buildParallelPlan( steps );
}
