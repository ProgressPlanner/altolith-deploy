/**
 * Job Executor
 *
 * Executes jobs, phases, and steps from JobRegistry with hierarchical hooks.
 * Handles dependency resolution, state management, and progress tracking.
 *
 * @package
 */

import { doAction, applyFilters } from '@wordpress/hooks';
import { debug, debugError } from '../../utils/debug';
import JobRegistry from '../registry/JobRegistry';
import DependencyResolver from '../registry/DependencyResolver';
import { getJobHook, getPhaseHook, getStepHook } from '../registry/HookManager';

/**
 * Execute jobs with dependency resolution.
 *
 * @param {Array}  jobIds                 Array of job IDs to execute.
 * @param {Object} context                Execution context passed to handlers.
 * @param {Object} options                Execution options.
 * @param {Function} options.onJobStart    Called when job starts.
 * @param {Function} options.onJobComplete Called when job completes.
 * @param {Function} options.onPhaseStart  Called when phase starts.
 * @param {Function} options.onPhaseComplete Called when phase completes.
 * @param {Function} options.onStepStart   Called when step starts.
 * @param {Function} options.onStepComplete Called when step completes.
 * @param {Function} options.onProgress    Called on progress updates.
 * @return {Promise<Object>} Final execution state.
 */
export async function executeJobs( jobIds, context, options = {} ) {
	const {
		onJobStart = () => {},
		onJobComplete = () => {},
		onPhaseStart = () => {},
		onPhaseComplete = () => {},
		onStepStart = () => {},
		onStepComplete = () => {},
		onProgress = () => {},
	} = options;

	// Load jobs from registry
	const allJobs = JobRegistry.loadJobs();
	const jobsToExecute = allJobs.filter( ( job ) =>
		jobIds.includes( job.id )
	);

	if ( jobsToExecute.length === 0 ) {
		throw new Error( `No jobs found for IDs: ${ jobIds.join( ', ' ) }` );
	}

	// Build execution plan
	const executionPlan = DependencyResolver.buildExecutionPlan( jobsToExecute );
	const { jobOrder, phasePlan, stepPlan } = executionPlan;

	debug( '[JobExecutor] Execution plan:', {
		jobOrder,
		phasePlan,
		stepPlan,
	} );

	// Track completed jobs, phases, and steps for dependency checking
	const executionContext = {
		...context,
		completedJobs: [],
		completedPhases: [],
		completedSteps: [],
		state: {}, // Accumulated state from all steps
	};

	try {
		// Execute jobs in dependency order
		for ( const jobId of jobOrder ) {
			const job = jobsToExecute.find( ( j ) => j.id === jobId );
			if ( ! job ) {
				continue;
			}

			debug( `[JobExecutor] Executing job: ${ jobId }` );
			onJobStart( jobId, job );

			// Fire job.before hook
			doAction( getJobHook( jobId, 'before' ), executionContext );

			try {
				// Execute job
				await executeJob(
					job,
					phasePlan[ jobId ],
					stepPlan[ jobId ],
					executionContext,
					{
						onPhaseStart,
						onPhaseComplete,
						onStepStart,
						onStepComplete,
						onProgress,
					}
				);

				// Mark job as completed
				executionContext.completedJobs.push( jobId );

				debug( `[JobExecutor] Job completed: ${ jobId }` );
				onJobComplete( jobId, executionContext.state );

				// Fire job.after hook
				doAction(
					getJobHook( jobId, 'after' ),
					executionContext.state,
					executionContext
				);
			} catch ( error ) {
				debugError( `[JobExecutor] Job failed: ${ jobId }`, error );

				// Fire job.error hook
				doAction(
					getJobHook( jobId, 'error' ),
					error,
					executionContext
				);

				throw error;
			}
		}

		debug( '[JobExecutor] All jobs completed successfully' );
		return executionContext.state;
	} catch ( error ) {
		debugError( '[JobExecutor] Job execution failed:', error );
		throw error;
	}
}

/**
 * Execute a single job.
 *
 * @param {Object} job              Job object from registry.
 * @param {Array}  phaseOrder       Array of phase IDs in execution order.
 * @param {Object} stepPlan         Map of phaseId to array of step IDs.
 * @param {Object} executionContext Execution context with state and completed tracking.
 * @param {Object} options          Execution options.
 * @return {Promise<void>}
 */
async function executeJob(
	job,
	phaseOrder,
	stepPlan,
	executionContext,
	options
) {
	const {
		onPhaseStart,
		onPhaseComplete,
		onStepStart,
		onStepComplete,
		onProgress,
	} = options;

	// Execute phases in dependency order
	for ( const phaseId of phaseOrder ) {
		const phase = job.phases.find( ( p ) => p.id === phaseId );
		if ( ! phase ) {
			continue;
		}

		// Check phase dependencies
		if (
			phase.dependencies &&
			! DependencyResolver.areDependenciesSatisfied(
				phase.dependencies,
				executionContext
			)
		) {
			throw new Error(
				`Phase ${ job.id }.${ phaseId } dependencies not satisfied: ${ phase.dependencies.join(
					', '
				) }`
			);
		}

		debug( `[JobExecutor] Executing phase: ${ job.id }.${ phaseId }` );
		onPhaseStart( job.id, phaseId, phase );

		// Fire phase.before hook
		doAction(
			getPhaseHook( job.id, phaseId, 'before' ),
			executionContext
		);

		try {
			// Execute phase
			await executePhase(
				job,
				phase,
				stepPlan[ phaseId ] || [],
				executionContext,
				{
					onStepStart,
					onStepComplete,
					onProgress,
				}
			);

			// Mark phase as completed
			const fullPhaseId = `${ job.id }.${ phaseId }`;
			executionContext.completedPhases.push( fullPhaseId );

			debug( `[JobExecutor] Phase completed: ${ fullPhaseId }` );
			onPhaseComplete( job.id, phaseId, executionContext.state );

			// Fire phase.after hook
			doAction(
				getPhaseHook( job.id, phaseId, 'after' ),
				executionContext.state,
				executionContext
			);
		} catch ( error ) {
			debugError(
				`[JobExecutor] Phase failed: ${ job.id }.${ phaseId }`,
				error
			);

			// Fire phase.error hook
			doAction(
				getPhaseHook( job.id, phaseId, 'error' ),
				error,
				executionContext
			);

			throw error;
		}
	}
}

/**
 * Execute a single phase.
 *
 * @param {Object} job              Job object.
 * @param {Object} phase            Phase object.
 * @param {Array}  stepOrder        Array of step IDs in execution order.
 * @param {Object} executionContext Execution context with state and completed tracking.
 * @param {Object} options          Execution options.
 * @return {Promise<void>}
 */
async function executePhase(
	job,
	phase,
	stepOrder,
	executionContext,
	options
) {
	const { onStepStart, onStepComplete, onProgress } = options;

	// Execute steps in dependency order
	for ( const stepId of stepOrder ) {
		const step = phase.steps.find( ( s ) => s.id === stepId );
		if ( ! step ) {
			continue;
		}

		// Check step dependencies
		if (
			step.dependencies &&
			! DependencyResolver.areDependenciesSatisfied(
				step.dependencies,
				executionContext
			)
		) {
			throw new Error(
				`Step ${ job.id }.${ phase.id }.${ stepId } dependencies not satisfied: ${ step.dependencies.join(
					', '
				) }`
			);
		}

		debug(
			`[JobExecutor] Executing step: ${ job.id }.${ phase.id }.${ stepId }`
		);
		onStepStart( job.id, phase.id, stepId, step );

		// Fire step.before hook
		doAction(
			getStepHook( job.id, phase.id, stepId, 'before' ),
			executionContext
		);

		try {
			// Execute step handler
			if ( ! step.handler ) {
				throw new Error(
					`No handler found for step: ${ job.id }.${ phase.id }.${ stepId }`
				);
			}

			const result = await step.handler( executionContext );

			// Apply result filter
			const filteredResult = applyFilters(
				getStepHook( job.id, phase.id, stepId, 'result' ),
				result || {},
				executionContext
			);

			// Merge result into state
			Object.assign( executionContext.state, filteredResult );

			// Mark step as completed
			const fullStepId = `${ job.id }.${ phase.id }.${ stepId }`;
			executionContext.completedSteps.push( fullStepId );

			debug( `[JobExecutor] Step completed: ${ fullStepId }` );
			onStepComplete( job.id, phase.id, stepId, filteredResult );

			// Fire step.after hook
			doAction(
				getStepHook( job.id, phase.id, stepId, 'after' ),
				filteredResult,
				executionContext
			);
		} catch ( error ) {
			debugError(
				`[JobExecutor] Step failed: ${ job.id }.${ phase.id }.${ stepId }`,
				error
			);

			// Fire step.error hook
			doAction(
				getStepHook( job.id, phase.id, stepId, 'error' ),
				error,
				executionContext
			);

			throw new Error(
				`Step ${ job.id }.${ phase.id }.${ stepId } failed: ${ error.message }`
			);
		}
	}
}
