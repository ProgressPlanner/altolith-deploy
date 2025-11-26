/**
 * Dependency Tracker
 *
 * Tracks step completion and provides Promise-based dependency resolution.
 * Enables true dependency-based execution where each step starts immediately
 * when its specific dependencies complete.
 *
 * @since 1.0.0
 */

/**
 * Create a dependency tracker for workflow steps.
 *
 * @param {Array<Object>} steps Array of step definitions with id and dependencies.
 * @return {Object} Tracker with methods for managing step completion.
 */
export function createDependencyTracker( steps ) {
	const completed = new Set();
	const failed = new Set();
	const results = new Map(); // stepId -> result
	const resolvers = new Map(); // stepId -> { resolve, reject, promise }

	// Initialize a promise for each step
	for ( const step of steps ) {
		let resolve, reject;
		const promise = new Promise( ( res, rej ) => {
			resolve = res;
			reject = rej;
		} );
		// Add a no-op catch to prevent unhandled rejection warnings
		// when steps fail but have no dependents waiting on them
		promise.catch( () => {} );
		resolvers.set( step.id, { resolve, reject, promise } );
	}

	return {
		/**
		 * Mark a step as complete with its result.
		 *
		 * @param {string} stepId Step ID that completed.
		 * @param {Object} result Step result data.
		 */
		complete( stepId, result ) {
			completed.add( stepId );
			results.set( stepId, result );
			resolvers.get( stepId )?.resolve( result );
		},

		/**
		 * Mark a step as failed with an error.
		 *
		 * @param {string} stepId Step ID that failed.
		 * @param {Error}  error  Error that caused failure.
		 */
		fail( stepId, error ) {
			failed.add( stepId );
			resolvers.get( stepId )?.reject( error );
		},

		/**
		 * Wait for a step's dependencies to complete.
		 *
		 * @param {Object} step Step definition with dependencies array.
		 * @return {Promise} Resolves when all dependencies complete.
		 */
		async waitForDependencies( step ) {
			const deps = step.dependencies || [];
			const promises = deps.map( ( depId ) => {
				const resolver = resolvers.get( depId );
				if ( ! resolver ) {
					// External dependency (e.g., global step for thread step)
					// Already completed, return resolved promise
					return Promise.resolve();
				}
				return resolver.promise;
			} );
			await Promise.all( promises );
		},

		/**
		 * Check if any of a step's dependencies failed.
		 *
		 * @param {Object} step Step definition with dependencies array.
		 * @return {boolean} True if any dependency failed.
		 */
		hasDependencyFailed( step ) {
			const deps = step.dependencies || [];
			return deps.some( ( depId ) => failed.has( depId ) );
		},

		/**
		 * Get aggregated results from all completed steps.
		 *
		 * @return {Object} Merged results object.
		 */
		getResults() {
			const aggregated = {};
			for ( const [ , result ] of results ) {
				if ( result ) {
					Object.assign( aggregated, result );
				}
			}
			return aggregated;
		},

		/**
		 * Check if a step has completed.
		 *
		 * @param {string} stepId Step ID to check.
		 * @return {boolean} True if step completed.
		 */
		isCompleted( stepId ) {
			return completed.has( stepId );
		},

		/**
		 * Check if a step has failed.
		 *
		 * @param {string} stepId Step ID to check.
		 * @return {boolean} True if step failed.
		 */
		isFailed( stepId ) {
			return failed.has( stepId );
		},

		/**
		 * Get the set of completed step IDs.
		 *
		 * @return {Set<string>} Set of completed step IDs.
		 */
		getCompletedSteps() {
			return completed;
		},

		/**
		 * Get the set of failed step IDs.
		 *
		 * @return {Set<string>} Set of failed step IDs.
		 */
		getFailedSteps() {
			return failed;
		},
	};
}

export default { createDependencyTracker };
