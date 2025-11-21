/**
 * Progress Manager
 *
 * Calculates progress based on step progress values.
 * With the job-based workflow system, progress is calculated differently.
 *
 * @package
 */

import { MAX_PROGRESS } from '../../utils/constants';

// Hardcoded step weights for step-based progress tracking
// Order matters! Steps are executed in this order.
const STEP_WEIGHTS = {
	discoverAssets: 5, // Phase 1: 0-5%
	getStaticSiteUrls: 8, // Phase 2: 5-13%
	createSiteArchive: 20, // Phase 3: 13-33%
	generateBlueprint: 1, // Phase 4: 33-34%
	uploadSiteArchive: 16, // Phase 5: 34-50% (parallel with uploadStaticSiteFiles)
	uploadStaticSiteFiles: 50, // Phase 5: 34-84% (parallel with uploadSiteArchive)
};

/**
 * Get cumulative progress before a step.
 *
 * @param {string} step Step identifier.
 * @return {number} Cumulative progress (0-100).
 */
function getCumulativeProgress( step ) {
	const stepOrder = Object.keys( STEP_WEIGHTS );
	const stepIndex = stepOrder.indexOf( step );

	if ( stepIndex === -1 ) {
		return 0;
	}

	let cumulative = 0;
	for ( let i = 0; i < stepIndex; i++ ) {
		cumulative += STEP_WEIGHTS[ stepOrder[ i ] ];
	}

	return cumulative;
}

/**
 * Get weight allocated to a step.
 *
 * @param {string} step Step identifier.
 * @return {number} Step weight (0-100).
 */
function getStepWeight( step ) {
	return STEP_WEIGHTS[ step ] || 0;
}

/**
 * Calculate overall progress percentage based on current step and step progress.
 *
 * Uses PUBLISH_WORKFLOW to dynamically determine:
 * - Cumulative progress before this step (sum of all previous step weights)
 * - Weight of current step (percentage allocated to this step)
 * - Progress within current step (0-100%)
 *
 * Formula: overallProgress = cumulativeProgress + (stepProgress * stepWeight / 100)
 *
 * @param {Object} stepProgress          Step progress information.
 * @param {string} stepProgress.step     Step identifier.
 * @param {number} stepProgress.progress Step progress (0-100).
 * @return {number} Overall progress percentage (0-100).
 */
export function calculateOverallProgress( stepProgress ) {
	const { step, progress } = stepProgress;

	// Get cumulative progress before this step (sum of all previous weights)
	const cumulativeProgress = getCumulativeProgress( step );

	// Get weight allocated to this step
	const stepWeight = getStepWeight( step );

	if ( stepWeight === 0 ) {
		// Step not found in workflow, return 0
		return 0;
	}

	// Calculate progress within step (0-100), clamped to valid range
	const stepProgressValue =
		progress !== undefined
			? Math.min( MAX_PROGRESS, Math.max( 0, progress ) )
			: 0;

	// Calculate overall progress
	// Example: If cumulative is 45% and step weight is 30%, and step is 50% complete:
	// overall = 45 + (50 * 30 / 100) = 45 + 15 = 60%
	const overall =
		cumulativeProgress + ( stepProgressValue * stepWeight ) / MAX_PROGRESS;

	// Ensure progress is between 0-100 and rounded
	return Math.min( MAX_PROGRESS, Math.max( 0, Math.round( overall ) ) );
}
