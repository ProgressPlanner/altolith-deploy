/**
 * Dependency Resolver
 *
 * Resolves step dependencies and builds parallel execution plan.
 * Uses topological sort to determine execution order.
 *
 */

/**
 * Build a parallel execution plan from steps with dependencies.
 *
 * Returns an array of arrays, where each inner array contains step IDs
 * that can be executed in parallel.
 *
 * @param {Array<Object>} steps Array of step definitions with id and dependencies.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
export function buildParallelPlan( steps ) {
	const stepIds = new Set( steps.map( ( s ) => s.id ) );
	const remaining = new Set( stepIds );
	const result = [];

	while ( remaining.size > 0 ) {
		// Find all steps whose dependencies are satisfied (not in remaining)
		const ready = [ ...remaining ].filter( ( stepId ) => {
			const step = steps.find( ( s ) => s.id === stepId );
			const deps = step.dependencies || [];
			// All dependencies must be completed (not in remaining)
			return deps.every( ( depId ) => ! remaining.has( depId ) );
		} );

		if ( ready.length === 0 && remaining.size > 0 ) {
			const unresolved = [ ...remaining ].join( ', ' );
			throw new Error(
				`Circular dependency detected. Unresolved steps: ${ unresolved }`
			);
		}

		// These steps can run in parallel
		result.push( ready );

		// Remove from remaining
		ready.forEach( ( id ) => remaining.delete( id ) );
	}

	return result;
}

/**
 * Validate step dependencies.
 *
 * Checks that all declared dependencies reference existing steps.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<string>} Array of validation errors (empty if valid).
 */
export function validateDependencies( steps ) {
	const errors = [];
	const stepIds = new Set( steps.map( ( s ) => s.id ) );

	steps.forEach( ( step ) => {
		const deps = step.dependencies || [];
		deps.forEach( ( depId ) => {
			if ( ! stepIds.has( depId ) ) {
				errors.push(
					`Step "${ step.id }" depends on unknown step "${ depId }"`
				);
			}
		} );
	} );

	return errors;
}

/**
 * Get execution order as a flat array.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<string>} Flat array of step IDs in execution order.
 */
export function getExecutionOrder( steps ) {
	const plan = buildParallelPlan( steps );
	return plan.flat();
}
