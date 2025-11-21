/**
 * Step Executor
 *
 * Executes publish workflow steps with automatic dependency resolution
 * and parallel execution support.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { doAction, applyFilters } from '@wordpress/hooks';
import { buildParallelPlan, validateDependencies } from './DependencyResolver';
import {
	errorHandler,
	formatErrorMessage,
	determineSeverity,
	ERROR_SEVERITY,
} from '../utils/errorHandler';

/**
 * Execute a workflow with the given steps.
 *
 * @param {Array<Object>} steps   Array of step definitions to execute.
 * @param {Object}        context Initial context with dependencies and state.
 * @param {Object}        options Execution options.
 * @return {Promise<Object>} Final execution state.
 */
export async function executeSteps( steps, context, options = {} ) {
	const {
		onStepStart = () => {},
		onStepComplete = () => {},
		onStepSkipped = () => {},
		onError = () => {},
	} = options;

	// Validate dependencies
	const errors = validateDependencies( steps );
	if ( errors.length > 0 ) {
		throw new Error(
			`Invalid step dependencies: ${ errors.join( '; ' ) }`
		);
	}

	// Build execution plan with parallel groups
	const executionPlan = buildParallelPlan( steps );

	// Create execution context
	const executionContext = {
		...context,
		completedSteps: [],
		skippedSteps: [],
		state: {},
	};

	// Fire workflow start action
	doAction( 'aether.publish.workflow.before', executionContext, steps );

	try {
		for ( const parallelGroup of executionPlan ) {
			// Determine which steps to run vs skip
			const stepsToRun = [];
			const stepsToSkip = [];

			for ( const stepId of parallelGroup ) {
				const step = steps.find( ( s ) => s.id === stepId );
				const shouldSkip = applyFilters(
					`aether.publish.step.${ stepId }.skip`,
					step.skip ? step.skip( executionContext ) : false,
					executionContext
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
					`aether.publish.step.${ stepId }.skipped`,
					executionContext
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
		}

		// Fire workflow complete action
		doAction(
			'aether.publish.workflow.after',
			executionContext.state,
			executionContext
		);

		return executionContext.state;
	} catch ( error ) {
		doAction( 'aether.publish.workflow.error', error, executionContext );
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
	doAction( `aether.publish.step.${ stepId }.before`, executionContext );

	onStepStart( stepId, step );

	try {
		// Build context for this step (merge state into context)
		const stepContext = {
			...executionContext,
			...executionContext.state,
		};

		// Execute handler with retry logic
		const result = await errorHandler.executeWithRetry(
			async () => {
				return await step.handler( stepContext );
			},
			{
				onRetry: ( error, attempt, delay ) => {
					// Fire retry action
					doAction(
						`aether.publish.step.${ stepId }.retry`,
						error,
						attempt,
						delay,
						executionContext
					);
				},
			}
		);

		// Apply result filter
		const filteredResult = applyFilters(
			`aether.publish.step.${ stepId }.result`,
			result || {},
			executionContext
		);

		onStepComplete( stepId, filteredResult );

		// Fire after hook
		doAction(
			`aether.publish.step.${ stepId }.after`,
			filteredResult,
			executionContext
		);

		return filteredResult;
	} catch ( error ) {
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
			`aether.publish.step.${ stepId }.error`,
			enhancedError,
			executionContext
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
