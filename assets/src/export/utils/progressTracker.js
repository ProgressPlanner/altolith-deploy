/**
 * Progress Tracker Utility
 *
 * Tracks export workflow progress with equal step weights.
 * Each step gets equal weight: 100% / number of steps.
 * Progress is tracked in-memory only (no persistence).
 */

/**
 * Create a progress tracker instance.
 *
 * @param {string}        workflowId         Unique workflow identifier.
 * @param {Array<string>} stepIds            Array of step IDs in execution order.
 * @param {Function}      [onProgressChange] Callback when progress changes.
 * @return {Object} Progress tracker instance.
 */
export function createProgressTracker(
	workflowId,
	stepIds,
	onProgressChange = null
) {
	// Calculate equal step weight
	const stepWeight = stepIds.length > 0 ? 100 / stepIds.length : 0;

	// Initialize progress state
	let progressState = {
		workflowId,
		stepIds,
		stepWeight,
		stepProgress: {},
		overallProgress: 0,
		completedSteps: [],
		startedAt: Date.now(),
		updatedAt: Date.now(),
	};

	/**
	 * Update progress for a specific step.
	 *
	 * @param {string} stepId   Step identifier.
	 * @param {number} progress Step progress (0-100).
	 */
	function updateStepProgress( stepId, progress ) {
		// Validate step ID
		if ( ! stepIds.includes( stepId ) ) {
			return;
		}

		// Clamp progress to 0-100
		const clampedProgress = Math.min( 100, Math.max( 0, progress ) );

		// Update step progress
		progressState.stepProgress[ stepId ] = clampedProgress;
		progressState.updatedAt = Date.now();

		// Calculate overall progress
		// Sum of (stepWeight * stepProgress / 100) for all steps
		let totalProgress = 0;
		for ( const id of stepIds ) {
			const stepProg = progressState.stepProgress[ id ] || 0;
			totalProgress += ( stepWeight * stepProg ) / 100;
		}

		progressState.overallProgress = Math.min(
			100,
			Math.round( totalProgress )
		);

		// Notify callback
		if ( onProgressChange ) {
			onProgressChange( {
				stepId,
				stepProgress: clampedProgress,
				overallProgress: progressState.overallProgress,
				progressState,
			} );
		}
	}

	/**
	 * Mark a step as completed.
	 *
	 * @param {string} stepId Step identifier.
	 */
	function completeStep( stepId ) {
		updateStepProgress( stepId, 100 );

		if ( ! progressState.completedSteps.includes( stepId ) ) {
			progressState.completedSteps.push( stepId );
		}
	}

	/**
	 * Get current progress state.
	 *
	 * @return {Object} Progress state.
	 */
	function getProgress() {
		return { ...progressState };
	}

	/**
	 * Clear progress and reset to initial state.
	 */
	function clear() {
		progressState = {
			workflowId,
			stepIds,
			stepWeight,
			stepProgress: {},
			overallProgress: 0,
			completedSteps: [],
			startedAt: Date.now(),
			updatedAt: Date.now(),
		};
	}

	return {
		updateStepProgress,
		completeStep,
		getProgress,
		clear,
	};
}
