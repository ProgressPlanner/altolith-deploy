/**
 * Step Executor
 *
 * Executes export workflow steps with automatic dependency resolution
 * and parallel execution support.
 *
 */

import { doAction, applyFilters } from '@wordpress/hooks';
import { buildParallelPlan, validateDependencies } from './DependencyResolver';
import {
	errorHandler,
	formatErrorMessage,
	determineSeverity,
	ERROR_SEVERITY,
} from '../utils/errorHandler';
import { createProgressTracker } from '../utils/progressTracker';
import {
	createStateManager,
	saveExecutionContext,
	restoreExecutionContext,
} from '../utils/stateManager';
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

	// Build execution plan with parallel groups
	const executionPlan = buildParallelPlan( steps );

	// Get all step IDs in execution order
	const stepIds = steps.map( ( step ) => step.id );

	// Create workflow ID
	const workflowId = context.workflowId || `workflow-${ Date.now() }`;

	// Create progress tracker with equal step weights
	const progressTracker = createProgressTracker( workflowId, stepIds );

	// Create state manager
	const stateManager = createStateManager( workflowId );

	// Try to restore previous state (for resume capability)
	let restoredState = null;
	try {
		const savedProgress = await progressTracker.load();
		if ( savedProgress ) {
		}

		// Try to restore execution context
		restoredState = await restoreExecutionContext( stateManager, context );
		if ( restoredState && restoredState.completedSteps?.length > 0 ) {
		}
	} catch ( error ) {}

	// Create execution context (use restored state if available)
	const executionContext = {
		...( restoredState || context ),
		workflowId,
		progressTracker,
		stateManager,
		completedSteps: restoredState?.completedSteps || [],
		skippedSteps: restoredState?.skippedSteps || [],
		state: restoredState?.state || {},
	};

	// Fire workflow start action
	doAction(
		'aether.export.workflow.before',
		executionContext,
		steps,
		executionContext.currentProviderInstance || null
	);

	try {
		for ( const parallelGroup of executionPlan ) {
			// Determine which steps to run vs skip
			const stepsToRun = [];
			const stepsToSkip = [];

			for ( const stepId of parallelGroup ) {
				const step = steps.find( ( s ) => s.id === stepId );
				const shouldSkip = applyFilters(
					`aether.export.step.${ stepId }.skip`,
					step.skip ? step.skip( executionContext ) : false,
					executionContext,
					executionContext.currentProviderInstance || null
				);

				if ( shouldSkip ) {
					stepsToSkip.push( stepId );
				} else {
					stepsToRun.push( stepId );
				}
			}

			// Mark skipped steps
			for ( const stepId of stepsToSkip ) {
				executionContext.skippedSteps.push( stepId );
				onStepSkipped( stepId );
				doAction(
					`aether.export.step.${ stepId }.skipped`,
					executionContext,
					executionContext.currentProviderInstance || null
				);
			}

			if ( stepsToRun.length === 0 ) {
				continue;
			}

			// Execute steps in parallel
			const results = await Promise.all(
				stepsToRun.map( ( stepId ) =>
					executeStep( stepId, steps, executionContext, {
						onStepStart,
						onStepComplete,
						onError,
					} )
				)
			);

			// Merge results into state
			for ( const result of results ) {
				if ( result ) {
					Object.assign( executionContext.state, result );
				}
			}

			// Mark as completed
			executionContext.completedSteps.push( ...stepsToRun );

			// Save state after each parallel group completes
			try {
				await saveExecutionContext( stateManager, executionContext );
			} catch ( error ) {
				// Don't throw - state saving is non-critical
			}
		}

		// Fire workflow complete action
		doAction(
			'aether.export.workflow.after',
			executionContext.state,
			executionContext,
			executionContext.currentProviderInstance || null
		);

		// Clear progress tracker and state on successful completion
		await progressTracker.clear();
		await stateManager.clear();

		return executionContext.state;
	} catch ( error ) {
		doAction(
			'aether.export.workflow.error',
			error,
			executionContext,
			executionContext.currentProviderInstance || null
		);
		// Don't clear progress on error - allows for resume
		throw error;
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
		await executionContext.progressTracker.updateStepProgress( stepId, 0 );
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
			await executionContext.progressTracker.completeStep( stepId );
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
		// Log error for debugging
		if ( typeof window !== 'undefined' && window.console ) {
			// eslint-disable-next-line no-console
			console.error(
				`[Aether] StepExecutor - Step "${ stepId }" failed:`,
				error
			);
			// eslint-disable-next-line no-console
			console.error( '[Aether] Error details:', {
				message: error.message,
				stack: error.stack,
				stepId,
				providerInstance:
					executionContext.currentProviderInstance?.id || 'N/A',
			} );
		}

		// Categorize and format error
		const category = errorHandler.categorize( error );
		const severity = determineSeverity( category, { stepId } );
		const formattedMessage = formatErrorMessage( error, {
			stepId,
			operation: step.label || stepId,
		} );

		// Create enhanced error object
		const enhancedError = {
			...error,
			category,
			severity,
			stepId,
			formattedMessage,
			originalMessage: error.message,
		};

		onError( stepId, enhancedError );
		doAction(
			`aether.export.step.${ stepId }.error`,
			enhancedError,
			executionContext,
			executionContext.currentProviderInstance || null
		);

		// For critical errors, stop workflow immediately
		if ( severity === ERROR_SEVERITY.CRITICAL ) {
			throw new Error( formattedMessage );
		}

		// For other errors, wrap with step context
		throw new Error( formattedMessage );
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
