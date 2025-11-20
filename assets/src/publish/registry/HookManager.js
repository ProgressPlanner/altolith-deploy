/**
 * Hook Manager
 *
 * Helper utilities for generating hierarchical hook names and working with hooks.
 * Provides consistent hook naming across the job/phase/step hierarchy.
 *
 * @package
 */

/**
 * Generate hook name for job-level hooks
 *
 * @param {string} jobId Job ID
 * @param {string} action Action name (before, after, error, skip, result, etc.)
 * @return {string} Hook name
 */
export function getJobHook( jobId, action ) {
	return `aether.publish.${ jobId }.${ action }`;
}

/**
 * Generate hook name for phase-level hooks
 *
 * @param {string} jobId   Job ID
 * @param {string} phaseId Phase ID
 * @param {string} action  Action name (before, after, error, skip, result, etc.)
 * @return {string} Hook name
 */
export function getPhaseHook( jobId, phaseId, action ) {
	return `aether.publish.${ jobId }.${ phaseId }.${ action }`;
}

/**
 * Generate hook name for step-level hooks
 *
 * @param {string} jobId   Job ID
 * @param {string} phaseId Phase ID
 * @param {string} stepId  Step ID
 * @param {string} action  Action name (before, after, error, skip, result, progress, etc.)
 * @return {string} Hook name
 */
export function getStepHook( jobId, phaseId, stepId, action ) {
	return `aether.publish.${ jobId }.${ phaseId }.${ stepId }.${ action }`;
}

/**
 * Generate phase registration hook name
 *
 * @param {string} jobId Job ID
 * @return {string} Hook name for registering phases
 */
export function getPhaseRegistrationHook( jobId ) {
	return `aether.publish.${ jobId }.phases.register`;
}

/**
 * Generate step registration hook name
 *
 * @param {string} jobId   Job ID
 * @param {string} phaseId Phase ID
 * @return {string} Hook name for registering steps
 */
export function getStepRegistrationHook( jobId, phaseId ) {
	return `aether.publish.${ jobId }.${ phaseId }.steps.register`;
}

/**
 * Parse a dependency ID into its components
 *
 * @param {string} depId Dependency ID (e.g., 'jobId', 'jobId.phaseId', 'jobId.phaseId.stepId')
 * @return {Object} Parsed dependency with jobId, phaseId, stepId
 */
export function parseDependencyId( depId ) {
	const parts = depId.split( '.' );
	return {
		jobId: parts[ 0 ],
		phaseId: parts[ 1 ] || null,
		stepId: parts[ 2 ] || null,
		type: parts.length === 1 ? 'job' : parts.length === 2 ? 'phase' : 'step',
	};
}

/**
 * Build a dependency ID from components
 *
 * @param {string}      jobId   Job ID
 * @param {string|null} phaseId Phase ID (optional)
 * @param {string|null} stepId  Step ID (optional)
 * @return {string} Dependency ID
 */
export function buildDependencyId( jobId, phaseId = null, stepId = null ) {
	if ( stepId ) {
		return `${ jobId }.${ phaseId }.${ stepId }`;
	}
	if ( phaseId ) {
		return `${ jobId }.${ phaseId }`;
	}
	return jobId;
}
