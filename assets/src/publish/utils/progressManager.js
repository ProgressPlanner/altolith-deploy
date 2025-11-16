/**
 * Progress Manager
 *
 * Dynamically calculates progress based on PUBLISH_WORKFLOW configuration.
 * Automatically adapts to workflow changes without hardcoded values.
 *
 * @package
 */

import { MAX_PROGRESS } from '../../utils/constants';
import {
	getCumulativeProgress,
	getStepWeight,
} from '../workflows/publishWorkflow';

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

/**
 * Get progress weight configuration for a step.
 *
 * Returns an object with start and range for backwards compatibility.
 *
 * @param {string} step Step identifier.
 * @return {Object|null} Progress weight configuration { start, range } or null if step not found.
 */
export function getProgressWeight( step ) {
	const weight = getStepWeight( step );
	const start = getCumulativeProgress( step );

	if ( weight === 0 ) {
		return null;
	}

	return {
		start,
		range: weight,
	};
}
