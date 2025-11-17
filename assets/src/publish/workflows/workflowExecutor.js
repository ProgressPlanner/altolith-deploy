/**
 * Workflow Executor
 *
 * Generic executor for running phase-based workflows with parallel step support.
 * Handles progress tracking, state transitions, and error handling.
 *
 * @package
 */

import { debug, debugError } from '../../utils/debug';

/**
 * Execute a workflow with sequential phases and parallel steps.
 *
 * @param {Array}    workflow                Workflow definition (phases with steps).
 * @param {Object}   handlers                Map of step IDs to handler functions.
 * @param {Object}   context                 Execution context passed to handlers.
 * @param {Object}   options                 Execution options.
 * @param {Function} options.onPhaseStart    Called when phase starts.
 * @param {Function} options.onPhaseComplete Called when phase completes.
 * @param {Function} options.onStepStart     Called when step starts.
 * @param {Function} options.onStepComplete  Called when step completes.
 * @param {Function} options.onProgress      Called on progress updates.
 * @return {Promise<Object>} Final execution state.
 */
export async function executeWorkflow(
	workflow,
	handlers,
	context,
	options = {}
) {
	const {
		onPhaseStart = () => {},
		onPhaseComplete = () => {},
		onStepStart = () => {},
		onStepComplete = () => {},
		onProgress = () => {},
	} = options;

	let cumulativeProgress = 0;
	const state = {}; // Accumulate state from all steps

	try {
		// Execute each phase sequentially
		for ( let phaseIndex = 0; phaseIndex < workflow.length; phaseIndex++ ) {
			const phase = workflow[ phaseIndex ];

			debug(
				`[WorkflowExecutor] Starting phase ${ phaseIndex + 1 }/${
					workflow.length
				} with ${ phase.length } step(s)`
			);
			onPhaseStart( phaseIndex, phase );

			// Execute all steps in phase in parallel
			const stepPromises = phase.map( ( [ stepId, weight ] ) => {
				return executeStep(
					stepId,
					weight,
					handlers[ stepId ],
					{
						...context,
						...state, // Include accumulated state from previous steps
						stepId,
						weight,
						cumulativeProgress,
					},
					{ onStepStart, onStepComplete, onProgress }
				);
			} );

			// Wait for all steps in phase to complete
			// Use Promise.allSettled() to collect results from all steps,
			// even if some fail. This allows better error recovery and cleanup.
			const stepResults = await Promise.allSettled( stepPromises );

			// Process results - merge successful results into state, throw on failures
			const errors = [];
			stepResults.forEach( ( result, index ) => {
				if ( result.status === 'fulfilled' ) {
					// Step succeeded - merge result into state
					Object.assign( state, result.value );
				} else {
					// Step failed - collect error
					const [ stepId ] = phase[ index ];
					errors.push( {
						stepId,
						error: result.reason,
					} );
				}
			} );

			// If any steps failed, throw error with details
			if ( errors.length > 0 ) {
				const errorMessages = errors
					.map( ( { stepId, error } ) => `${ stepId }: ${ error.message }` )
					.join( ', ' );
				throw new Error(
					`${ errors.length } step(s) failed: ${ errorMessages }`
				);
			}

			// Update cumulative progress
			const phaseProgress = phase.reduce(
				( sum, [ , weight ] ) => sum + weight,
				0
			);
			cumulativeProgress += phaseProgress;

			debug(
				`[WorkflowExecutor] Phase ${
					phaseIndex + 1
				} complete. Progress: ${ cumulativeProgress }%`
			);
			onPhaseComplete( phaseIndex, phase, cumulativeProgress );
			onProgress( cumulativeProgress, 100 );
		}

		debug( '[WorkflowExecutor] Workflow completed successfully' );
		return state;
	} catch ( error ) {
		debugError( '[WorkflowExecutor] Workflow failed:', error );
		throw error;
	}
}

/**
 * Execute a single step.
 *
 * @param {string}   stepId                 Step identifier.
 * @param {number}   weight                 Progress weight for this step.
 * @param {Function} handler                Step handler function (async).
 * @param {Object}   context                Execution context.
 * @param {Object}   options                Step options.
 * @param {Function} options.onStepStart    Called when step starts.
 * @param {Function} options.onStepComplete Called when step completes.
 * @return {Promise<Object>} Step result data.
 */
async function executeStep(
	stepId,
	weight,
	handler,
	context,
	{ onStepStart, onStepComplete }
) {
	if ( ! handler ) {
		throw new Error( `No handler found for step: ${ stepId }` );
	}

	debug(
		`[WorkflowExecutor] Executing step: ${ stepId } (weight: ${ weight }%)`
	);
	onStepStart( stepId, weight );

	try {
		// Execute step handler (returns Promise)
		const result = await handler( context );

		debug( `[WorkflowExecutor] Step completed: ${ stepId }` );
		onStepComplete( stepId, result );

		return result || {};
	} catch ( error ) {
		debugError( `[WorkflowExecutor] Step failed: ${ stepId }`, error );
		throw new Error( `Step ${ stepId } failed: ${ error.message }` );
	}
}

/**
 * Calculate overall progress based on step progress.
 *
 * @param {number} cumulativeProgress Progress completed before current step (0-100).
 * @param {number} stepWeight         Weight of current step (0-100).
 * @param {number} stepProgress       Progress within current step (0-100).
 * @return {number} Overall progress (0-100).
 */
export function calculateProgress(
	cumulativeProgress,
	stepWeight,
	stepProgress
) {
	const stepProgressContribution = ( stepWeight * stepProgress ) / 100;
	return Math.min(
		100,
		Math.round( cumulativeProgress + stepProgressContribution )
	);
}

/**
 * Validate workflow structure.
 *
 * @param {Array}  workflow Workflow definition.
 * @param {Object} handlers Handler map.
 * @return {Object} Validation result { isValid, errors }.
 */
export function validateWorkflowStructure( workflow, handlers ) {
	const errors = [];

	if ( ! Array.isArray( workflow ) ) {
		errors.push( 'Workflow must be an array' );
		return { isValid: false, errors };
	}

	workflow.forEach( ( phase, phaseIndex ) => {
		if ( ! Array.isArray( phase ) ) {
			errors.push( `Phase ${ phaseIndex } must be an array` );
			return;
		}

		if ( phase.length === 0 ) {
			errors.push( `Phase ${ phaseIndex } is empty` );
		}

		phase.forEach( ( step, stepIndex ) => {
			if ( ! Array.isArray( step ) || step.length !== 2 ) {
				errors.push(
					`Phase ${ phaseIndex }, step ${ stepIndex } must be [stepId, weight]`
				);
				return;
			}

			const [ stepId, weight ] = step;

			if ( typeof stepId !== 'string' ) {
				errors.push(
					`Phase ${ phaseIndex }, step ${ stepIndex }: stepId must be a string`
				);
			}

			if ( typeof weight !== 'number' || weight <= 0 || weight > 100 ) {
				errors.push(
					`Phase ${ phaseIndex }, step ${ stepIndex }: weight must be a number between 0 and 100`
				);
			}

			if ( ! handlers[ stepId ] ) {
				errors.push(
					`Phase ${ phaseIndex }, step ${ stepIndex }: no handler found for '${ stepId }'`
				);
			}
		} );
	} );

	return {
		isValid: errors.length === 0,
		errors,
	};
}
