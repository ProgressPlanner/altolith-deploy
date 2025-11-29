/**
 * Dependency Resolver
 *
 * Resolves step dependencies and builds parallel execution plan.
 * Uses topological sort to determine execution order.
 *
 */

/**
 * Filter step dependencies to only include active steps.
 *
 * This is critical for deploymentType filtering - when a step like
 * discoverAndScanSite is filtered out (because static_site export is disabled),
 * downstream steps shouldn't wait for it.
 *
 * @param {Array<string>} dependencies  The step's declared dependencies.
 * @param {Set<string>}   activeStepIds Set of step IDs that are active.
 * @return {Array<string>} Filtered dependencies (only those in activeStepIds).
 */
function filterActiveDependencies( dependencies, activeStepIds ) {
	return ( dependencies || [] ).filter( ( depId ) =>
		activeStepIds.has( depId )
	);
}

/**
 * Build a parallel execution plan from steps with dependencies.
 *
 * Returns an array of arrays, where each inner array contains step IDs
 * that can be executed in parallel.
 *
 * IMPORTANT: Dependencies are filtered to only include active steps.
 * This allows steps to declare dependencies on steps that may be filtered
 * out by deploymentType without causing execution issues.
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
			// Filter dependencies to only include active steps
			const deps = filterActiveDependencies( step.dependencies, stepIds );
			// All active dependencies must be completed (not in remaining)
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
 * This validation checks against allSteps (which should be ALL registered steps,
 * not just active steps) to catch typos and bugs in step definitions.
 *
 * Note: With deploymentType filtering, steps may depend on steps that are filtered out
 * at runtime. This is valid - such dependencies are simply ignored during execution
 * in buildParallelPlan(). Validation still passes because the step exists in the
 * full registry.
 *
 * @param {Array<Object>} allSteps     All step definitions (for dependency lookup).
 * @param {Array<Object>} stepsToCheck Steps to validate (defaults to allSteps).
 * @return {Array<string>} Array of validation errors (empty if valid).
 */
export function validateDependencies( allSteps, stepsToCheck = null ) {
	const errors = [];
	const stepsToValidate = stepsToCheck || allSteps;
	const stepIds = new Set( allSteps.map( ( s ) => s.id ) );

	stepsToValidate.forEach( ( step ) => {
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
