/**
 * Publish Step Constants
 *
 * Centralized step names and statuses for publish workflow
 *
 * @package
 */

/**
 * Publish Step IDs
 *
 * Unique identifiers for each step in the publish workflow.
 * Use these constants instead of hardcoded strings.
 */
export const PUBLISH_STEPS = {
	/**
	 * Discover and extract assets from the site
	 * @constant {string}
	 */
	DISCOVER_ASSETS: 'discoverAssets',

	/**
	 * Get list of URLs for static site generation
	 * @constant {string}
	 */
	GET_STATIC_SITE_URLS: 'getStaticSiteUrls',

	/**
	 * Generate WordPress Playground blueprint
	 * @constant {string}
	 */
	GENERATE_BLUEPRINT: 'generateBlueprint',

	/**
	 * Create site archive (wp-content.zip)
	 * @constant {string}
	 */
	CREATE_SITE_ARCHIVE: 'createSiteArchive',

	/**
	 * Upload static site files (HTML, CSS, JS, assets)
	 * @constant {string}
	 */
	UPLOAD_STATIC_SITE_FILES: 'uploadStaticSiteFiles',

	/**
	 * Upload site archive to provider
	 * @constant {string}
	 */
	UPLOAD_SITE_ARCHIVE: 'uploadSiteArchive',

	/**
	 * Complete publish workflow
	 * @constant {string}
	 */
	COMPLETE: 'complete',
};

/**
 * Step Status Values
 *
 * Possible states for each step in the workflow.
 */
export const STEP_STATUS = {
	/**
	 * Step has not started yet
	 * @constant {string}
	 */
	PENDING: 'pending',

	/**
	 * Step is currently in progress
	 * @constant {string}
	 */
	ACTIVE: 'active',

	/**
	 * Step is processing (server-side)
	 * @constant {string}
	 */
	PROCESSING: 'processing',

	/**
	 * Step completed successfully
	 * @constant {string}
	 */
	COMPLETE: 'complete',

	/**
	 * Step encountered an error
	 * @constant {string}
	 */
	ERROR: 'error',

	/**
	 * Step was skipped
	 * @constant {string}
	 */
	SKIPPED: 'skipped',
};

/**
 * Publish Workflow Status
 *
 * Overall status of the publish job.
 */
export const PUBLISH_STATUS = {
	/**
	 * Workflow not started
	 * @constant {string}
	 */
	IDLE: 'idle',

	/**
	 * Workflow pending start
	 * @constant {string}
	 */
	PENDING: 'pending',

	/**
	 * Workflow is running
	 * @constant {string}
	 */
	RUNNING: 'running',

	/**
	 * Workflow is processing
	 * @constant {string}
	 */
	PROCESSING: 'processing',

	/**
	 * Waiting for file upload
	 * @constant {string}
	 */
	WAITING_FOR_UPLOAD: 'waitingForUpload',

	/**
	 * Workflow completed successfully
	 * @constant {string}
	 */
	COMPLETE: 'complete',

	/**
	 * Workflow completed with errors
	 * @constant {string}
	 */
	ERROR: 'error',

	/**
	 * Workflow was cancelled
	 * @constant {string}
	 */
	CANCELLED: 'cancelled',
};

/**
 * Step Labels
 *
 * Human-readable labels for each publish step.
 */
export const STEP_LABELS = {
	[ PUBLISH_STEPS.DISCOVER_ASSETS ]: 'Discovering Assets',
	[ PUBLISH_STEPS.GET_STATIC_SITE_URLS ]: 'Getting URLs',
	[ PUBLISH_STEPS.GENERATE_BLUEPRINT ]: 'Generating Blueprint',
	[ PUBLISH_STEPS.CREATE_SITE_ARCHIVE ]: 'Creating Archive',
	[ PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES ]: 'Uploading Static Site',
	[ PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE ]: 'Uploading Archive',
	[ PUBLISH_STEPS.COMPLETE ]: 'Complete',
};

/**
 * Step Descriptions
 *
 * Detailed descriptions for each publish step.
 */
export const STEP_DESCRIPTIONS = {
	[ PUBLISH_STEPS.DISCOVER_ASSETS ]:
		'Scanning your site for assets (images, CSS, JavaScript, etc.)',
	[ PUBLISH_STEPS.GET_STATIC_SITE_URLS ]:
		'Collecting all URLs to be included in the static site',
	[ PUBLISH_STEPS.GENERATE_BLUEPRINT ]:
		'Creating WordPress Playground blueprint file',
	[ PUBLISH_STEPS.CREATE_SITE_ARCHIVE ]:
		'Packaging your site into a portable archive',
	[ PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES ]:
		'Uploading static HTML files and assets to your provider',
	[ PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE ]:
		'Uploading site archive to your provider',
	[ PUBLISH_STEPS.COMPLETE ]: 'Publish workflow completed successfully',
};

/**
 * Step Order
 *
 * Array of steps in the order they should be executed.
 * Use this for iterating through steps in sequence.
 */
export const STEP_ORDER = [
	PUBLISH_STEPS.DISCOVER_ASSETS,
	PUBLISH_STEPS.GET_STATIC_SITE_URLS,
	PUBLISH_STEPS.GENERATE_BLUEPRINT,
	PUBLISH_STEPS.CREATE_SITE_ARCHIVE,
	PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES,
	PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE,
	PUBLISH_STEPS.COMPLETE,
];

/**
 * Step Progress Weights
 *
 * Relative weights for calculating overall progress.
 * Steps that take longer should have higher weights.
 */
export const STEP_WEIGHTS = {
	[ PUBLISH_STEPS.DISCOVER_ASSETS ]: 10,
	[ PUBLISH_STEPS.GET_STATIC_SITE_URLS ]: 5,
	[ PUBLISH_STEPS.GENERATE_BLUEPRINT ]: 5,
	[ PUBLISH_STEPS.CREATE_SITE_ARCHIVE ]: 10,
	[ PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES ]: 50, // Longest step
	[ PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE ]: 15,
	[ PUBLISH_STEPS.COMPLETE ]: 5,
};

/**
 * Helper Functions
 */

/**
 * Get step index in workflow
 *
 * @param {string} stepId - Step ID
 * @return {number} Step index (0-based) or -1 if not found
 */
export function getStepIndex( stepId ) {
	return STEP_ORDER.indexOf( stepId );
}

/**
 * Get step label
 *
 * @param {string} stepId - Step ID
 * @return {string} Human-readable label
 */
export function getStepLabel( stepId ) {
	return STEP_LABELS[ stepId ] || stepId;
}

/**
 * Get step description
 *
 * @param {string} stepId - Step ID
 * @return {string} Detailed description
 */
export function getStepDescription( stepId ) {
	return STEP_DESCRIPTIONS[ stepId ] || '';
}

/**
 * Check if step is final step
 *
 * @param {string} stepId - Step ID
 * @return {boolean} True if this is the last step
 */
export function isFinalStep( stepId ) {
	return stepId === PUBLISH_STEPS.COMPLETE;
}

/**
 * Get next step in workflow
 *
 * @param {string} currentStepId - Current step ID
 * @return {string|null} Next step ID or null if at end
 */
export function getNextStep( currentStepId ) {
	const currentIndex = getStepIndex( currentStepId );
	if ( currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1 ) {
		return null;
	}
	return STEP_ORDER[ currentIndex + 1 ];
}

/**
 * Get previous step in workflow
 *
 * @param {string} currentStepId - Current step ID
 * @return {string|null} Previous step ID or null if at start
 */
export function getPreviousStep( currentStepId ) {
	const currentIndex = getStepIndex( currentStepId );
	if ( currentIndex <= 0 ) {
		return null;
	}
	return STEP_ORDER[ currentIndex - 1 ];
}

/**
 * Calculate overall progress percentage
 *
 * @param {string} currentStepId       - Current step ID
 * @param {number} currentStepProgress - Progress of current step (0-100)
 * @return {number} Overall progress percentage (0-100)
 */
export function calculateOverallProgress(
	currentStepId,
	currentStepProgress = 0
) {
	const currentIndex = getStepIndex( currentStepId );
	if ( currentIndex === -1 ) {
		return 0;
	}

	// Calculate total weight
	const totalWeight = Object.values( STEP_WEIGHTS ).reduce(
		( sum, weight ) => sum + weight,
		0
	);

	// Calculate completed weight (all steps before current)
	let completedWeight = 0;
	for ( let i = 0; i < currentIndex; i++ ) {
		completedWeight += STEP_WEIGHTS[ STEP_ORDER[ i ] ];
	}

	// Add partial weight for current step
	const currentStepWeight = STEP_WEIGHTS[ currentStepId ] || 0;
	const currentStepWeightCompleted =
		( currentStepWeight * currentStepProgress ) / 100;
	completedWeight += currentStepWeightCompleted;

	// Calculate percentage
	return Math.round( ( completedWeight / totalWeight ) * 100 );
}
