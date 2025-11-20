/**
 * Dependency Resolver
 *
 * Resolves dependencies at job, phase, and step levels.
 * Performs topological sort to determine execution order.
 * Detects circular dependencies.
 *
 * @package
 */

import { parseDependencyId } from './HookManager';

/**
 * Dependency Resolver class
 */
class DependencyResolver {
	/**
	 * Resolve execution order for jobs
	 *
	 * @param {Array} jobs Array of job objects
	 * @return {Array} Array of job IDs in execution order
	 */
	resolveJobOrder( jobs ) {
		const graph = new Map();
		const inDegree = new Map();

		// Build graph
		jobs.forEach( ( job ) => {
			graph.set( job.id, job.dependencies || [] );
			inDegree.set( job.id, 0 );
		} );

		// Calculate in-degrees
		jobs.forEach( ( job ) => {
			( job.dependencies || [] ).forEach( ( depId ) => {
				const { jobId } = parseDependencyId( depId );
				if ( inDegree.has( jobId ) ) {
					inDegree.set( jobId, inDegree.get( jobId ) + 1 );
				}
			} );
		} );

		// Topological sort (Kahn's algorithm)
		const queue = [];
		const result = [];

		// Add jobs with no dependencies to queue
		for ( const [ jobId, degree ] of inDegree ) {
			if ( degree === 0 ) {
				queue.push( jobId );
			}
		}

		while ( queue.length > 0 ) {
			const jobId = queue.shift();
			result.push( jobId );

			// Get job's dependencies
			const deps = graph.get( jobId ) || [];
			deps.forEach( ( depId ) => {
				const { jobId: depJobId } = parseDependencyId( depId );
				if ( inDegree.has( depJobId ) ) {
					const newDegree = inDegree.get( depJobId ) - 1;
					inDegree.set( depJobId, newDegree );
					if ( newDegree === 0 ) {
						queue.push( depJobId );
					}
				}
			} );
		}

		// Check for circular dependencies
		if ( result.length !== jobs.length ) {
			throw new Error(
				'Circular dependency detected in jobs: ' +
					jobs.map( ( j ) => j.id ).join( ', ' )
			);
		}

		return result;
	}

	/**
	 * Resolve execution order for phases within each job
	 *
	 * @param {Array} jobs     Array of job objects
	 * @param {Array} jobOrder Job execution order
	 * @return {Object} Map of jobId to array of phase IDs in execution order
	 */
	resolvePhaseOrder( jobs, jobOrder ) {
		const phasePlan = {};

		jobs.forEach( ( job ) => {
			const phases = job.phases || [];
			if ( phases.length === 0 ) {
				phasePlan[ job.id ] = [];
				return;
			}

			const graph = new Map();
			const inDegree = new Map();

			// Build graph
			phases.forEach( ( phase ) => {
				const fullPhaseId = `${ job.id }.${ phase.id }`;
				graph.set( phase.id, phase.dependencies || [] );
				inDegree.set( phase.id, 0 );
			} );

			// Calculate in-degrees
			phases.forEach( ( phase ) => {
				( phase.dependencies || [] ).forEach( ( depId ) => {
					const { jobId: depJobId, phaseId: depPhaseId } =
						parseDependencyId( depId );

					// Only count dependencies within the same job
					if ( depJobId === job.id && inDegree.has( depPhaseId ) ) {
						inDegree.set(
							depPhaseId,
							inDegree.get( depPhaseId ) + 1
						);
					}
				} );
			} );

			// Topological sort
			const queue = [];
			const result = [];

			for ( const [ phaseId, degree ] of inDegree ) {
				if ( degree === 0 ) {
					queue.push( phaseId );
				}
			}

			while ( queue.length > 0 ) {
				const phaseId = queue.shift();
				result.push( phaseId );

				const deps = graph.get( phaseId ) || [];
				deps.forEach( ( depId ) => {
					const { jobId: depJobId, phaseId: depPhaseId } =
						parseDependencyId( depId );

					// Only process dependencies within same job
					if (
						depJobId === job.id &&
						inDegree.has( depPhaseId )
					) {
						const newDegree = inDegree.get( depPhaseId ) - 1;
						inDegree.set( depPhaseId, newDegree );
						if ( newDegree === 0 ) {
							queue.push( depPhaseId );
						}
					}
				} );
			}

			// Check for circular dependencies
			if ( result.length !== phases.length ) {
				throw new Error(
					`Circular dependency detected in phases for job ${ job.id }`
				);
			}

			phasePlan[ job.id ] = result;
		} );

		return phasePlan;
	}

	/**
	 * Resolve execution order for steps within each phase
	 *
	 * @param {Array}  jobs      Array of job objects
	 * @param {Object} phasePlan Phase execution plan
	 * @return {Object} Map of jobId.phaseId to array of step IDs in execution order
	 */
	resolveStepOrder( jobs, phasePlan ) {
		const stepPlan = {};

		jobs.forEach( ( job ) => {
			stepPlan[ job.id ] = {};

			const phases = job.phases || [];
			phases.forEach( ( phase ) => {
				const steps = phase.steps || [];
				if ( steps.length === 0 ) {
					stepPlan[ job.id ][ phase.id ] = [];
					return;
				}

				const graph = new Map();
				const inDegree = new Map();

				// Build graph
				steps.forEach( ( step ) => {
					graph.set( step.id, step.dependencies || [] );
					inDegree.set( step.id, 0 );
				} );

				// Calculate in-degrees
				steps.forEach( ( step ) => {
					( step.dependencies || [] ).forEach( ( depId ) => {
						const {
							jobId: depJobId,
							phaseId: depPhaseId,
							stepId: depStepId,
						} = parseDependencyId( depId );

						// Only count dependencies within the same phase
						if (
							depJobId === job.id &&
							depPhaseId === phase.id &&
							inDegree.has( depStepId )
						) {
							inDegree.set(
								depStepId,
								inDegree.get( depStepId ) + 1
							);
						}
					} );
				} );

				// Topological sort
				const queue = [];
				const result = [];

				for ( const [ stepId, degree ] of inDegree ) {
					if ( degree === 0 ) {
						queue.push( stepId );
					}
				}

				while ( queue.length > 0 ) {
					const stepId = queue.shift();
					result.push( stepId );

					const deps = graph.get( stepId ) || [];
					deps.forEach( ( depId ) => {
						const {
							jobId: depJobId,
							phaseId: depPhaseId,
							stepId: depStepId,
						} = parseDependencyId( depId );

						// Only process dependencies within same phase
						if (
							depJobId === job.id &&
							depPhaseId === phase.id &&
							inDegree.has( depStepId )
						) {
							const newDegree = inDegree.get( depStepId ) - 1;
							inDegree.set( depStepId, newDegree );
							if ( newDegree === 0 ) {
								queue.push( depStepId );
							}
						}
					} );
				}

				// Check for circular dependencies
				if ( result.length !== steps.length ) {
					throw new Error(
						`Circular dependency detected in steps for phase ${ job.id }.${ phase.id }`
					);
				}

				stepPlan[ job.id ][ phase.id ] = result;
			} );
		} );

		return stepPlan;
	}

	/**
	 * Build complete execution plan
	 *
	 * @param {Array} jobs Array of job objects
	 * @return {Object} Complete execution plan
	 */
	buildExecutionPlan( jobs ) {
		const jobOrder = this.resolveJobOrder( jobs );
		const phasePlan = this.resolvePhaseOrder( jobs, jobOrder );
		const stepPlan = this.resolveStepOrder( jobs, phasePlan );

		return {
			jobOrder,
			phasePlan,
			stepPlan,
		};
	}

	/**
	 * Check if dependencies are satisfied
	 *
	 * @param {Array}  dependencies Array of dependency IDs
	 * @param {Object} context      Workflow context with completed steps
	 * @return {boolean} True if all dependencies are satisfied
	 */
	areDependenciesSatisfied( dependencies, context ) {
		if ( ! dependencies || dependencies.length === 0 ) {
			return true;
		}

		return dependencies.every( ( depId ) => {
			const { jobId, phaseId, stepId } = parseDependencyId( depId );

			// Check if the dependency is marked as complete in context
			if ( stepId ) {
				return context.completedSteps?.includes( depId );
			}
			if ( phaseId ) {
				return context.completedPhases?.includes( depId );
			}
			return context.completedJobs?.includes( depId );
		} );
	}
}

// Export singleton instance
export default new DependencyResolver();
