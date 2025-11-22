/**
 * Progress Tracker Utility
 *
 * Tracks export workflow progress with equal step weights and IndexedDB persistence.
 * Each step gets equal weight: 100% / number of steps.
 *
 * @package
 */

import { debug, debugWarn } from '@aether/utils/debug';
import IndexedDBStore, { isIndexedDBAvailable } from '@aether/utils/indexedDB';

const DB_CONFIG = {
	dbName: 'aether-export-progress',
	version: 1,
	stores: {
		progress: {
			keyPath: 'workflowId',
		},
	},
};

// Initialize store instance
let storeInstance = null;

/**
 * Get or create IndexedDB store instance.
 *
 * @return {IndexedDBStore|null} Store instance or null if unavailable.
 */
function getStore() {
	if ( ! isIndexedDBAvailable() ) {
		debugWarn(
			'[ProgressTracker] IndexedDB not available, progress will not persist'
		);
		return null;
	}

	if ( ! storeInstance ) {
		storeInstance = new IndexedDBStore( 'progress', DB_CONFIG );
	}

	return storeInstance;
}

/**
 * Save progress to IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @param {Object} progress   Progress data.
 * @return {Promise<void>}
 */
async function saveProgress( workflowId, progress ) {
	const store = getStore();
	if ( ! store ) {
		return; // Silently fail if IndexedDB unavailable
	}

	try {
		await store.set( workflowId, {
			...progress,
			timestamp: Date.now(),
		} );
	} catch ( error ) {
		debugWarn( '[ProgressTracker] Failed to save progress:', error );
		// Don't throw - progress tracking is non-critical
	}
}

/**
 * Load progress from IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<Object|null>} Progress data or null if not found.
 */
async function loadProgress( workflowId ) {
	const store = getStore();
	if ( ! store ) {
		return null;
	}

	try {
		const result = await store.get( workflowId );
		return result || null;
	} catch ( error ) {
		debugWarn( '[ProgressTracker] Failed to load progress:', error );
		return null;
	}
}

/**
 * Delete progress from IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<void>}
 */
async function deleteProgress( workflowId ) {
	const store = getStore();
	if ( ! store ) {
		return;
	}

	try {
		await store.delete( workflowId );
	} catch ( error ) {
		debugWarn( '[ProgressTracker] Failed to delete progress:', error );
		// Don't throw - cleanup is non-critical
	}
}

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
	 * @return {Promise<void>}
	 */
	async function updateStepProgress( stepId, progress ) {
		// Validate step ID
		if ( ! stepIds.includes( stepId ) ) {
			debugWarn( `[ProgressTracker] Unknown step ID: ${ stepId }` );
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

		// Save to IndexedDB
		await saveProgress( workflowId, progressState );

		// Notify callback
		if ( onProgressChange ) {
			onProgressChange( {
				stepId,
				stepProgress: clampedProgress,
				overallProgress: progressState.overallProgress,
				progressState,
			} );
		}

		debug(
			`[ProgressTracker] Step ${ stepId }: ${ clampedProgress }% | Overall: ${ progressState.overallProgress }%`
		);
	}

	/**
	 * Mark a step as completed.
	 *
	 * @param {string} stepId Step identifier.
	 * @return {Promise<void>}
	 */
	async function completeStep( stepId ) {
		await updateStepProgress( stepId, 100 );

		if ( ! progressState.completedSteps.includes( stepId ) ) {
			progressState.completedSteps.push( stepId );
			await saveProgress( workflowId, progressState );
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
	 * Load progress from IndexedDB.
	 *
	 * @return {Promise<Object|null>} Progress state or null.
	 */
	async function load() {
		const saved = await loadProgress( workflowId );
		if ( saved ) {
			progressState = {
				...progressState,
				...saved,
			};
			return progressState;
		}
		return null;
	}

	/**
	 * Clear progress from IndexedDB.
	 *
	 * @return {Promise<void>}
	 */
	async function clear() {
		await deleteProgress( workflowId );
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
		load,
		clear,
	};
}

/**
 * Calculate overall progress with equal step weights.
 *
 * @param {Array<string>} stepIds      Array of step IDs.
 * @param {Object}        stepProgress Object mapping step IDs to progress (0-100).
 * @return {number} Overall progress (0-100).
 */
export function calculateOverallProgress( stepIds, stepProgress ) {
	if ( stepIds.length === 0 ) {
		return 0;
	}

	const stepWeight = 100 / stepIds.length;
	let totalProgress = 0;

	for ( const stepId of stepIds ) {
		const progress = stepProgress[ stepId ] || 0;
		totalProgress += ( stepWeight * progress ) / 100;
	}

	return Math.min( 100, Math.round( totalProgress ) );
}
