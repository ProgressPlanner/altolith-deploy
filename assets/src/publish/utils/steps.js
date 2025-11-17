/**
 * Publish Step Definitions
 *
 * Single source of truth for all publish workflow steps.
 * Defines step order, metadata, phases, and messages.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

export const PUBLISH_STEPS = [
	{
		id: 'discoverAssets',
		label: __( 'Discover Assets', 'aether-site-exporter' ),
		supportsProgress: false,
		phase: 'discover',
		waitingMessage: __(
			'Discovering plugins and themes…',
			'aether-site-exporter'
		),
		completionMessage: __(
			'Assets discovered successfully',
			'aether-site-exporter'
		),
	},
	{
		id: 'offloadMedia',
		label: __( 'Offload Media', 'aether-site-exporter' ),
		supportsProgress: true,
		phase: 'upload',
		waitingMessage: __( 'Offloading media to R2…', 'aether-site-exporter' ),
		completionMessage: __(
			'Media offloaded successfully',
			'aether-site-exporter'
		),
	},
	{
		id: 'getStaticSiteUrls',
		label: __( 'Get Static Site URLs', 'aether-site-exporter' ),
		supportsProgress: false,
		phase: 'prepare',
		waitingMessage: __(
			'Discovering URLs for static site…',
			'aether-site-exporter'
		),
		completionMessage: __(
			'URLs discovered successfully',
			'aether-site-exporter'
		),
	},
	{
		id: 'generateBlueprint',
		label: __( 'Generate Blueprint', 'aether-site-exporter' ),
		supportsProgress: false,
		phase: 'generate',
		waitingMessage: __( 'Generating blueprint…', 'aether-site-exporter' ),
		completionMessage: __(
			'Blueprint generated successfully',
			'aether-site-exporter'
		),
	},
	{
		id: 'createSiteArchive',
		label: __( 'Create Site Archive', 'aether-site-exporter' ),
		supportsProgress: true,
		phase: 'generate',
		waitingMessage: __(
			'Creating administration archive…',
			'aether-site-exporter'
		),
		completionMessage: __(
			'Administration archive created successfully',
			'aether'
		),
	},
	{
		id: 'uploadStaticSiteFiles',
		label: __( 'Upload Static Site Files', 'aether-site-exporter' ),
		supportsProgress: true,
		phase: 'upload',
		waitingMessage: __(
			'Uploading static site files…',
			'aether-site-exporter'
		),
		completionMessage: __(
			'Static site files uploaded successfully',
			'aether'
		),
	},
	{
		id: 'uploadSiteArchive',
		label: __( 'Upload Site Archive', 'aether-site-exporter' ),
		supportsProgress: true,
		phase: 'upload',
		waitingMessage: __( 'Uploading site archive…', 'aether-site-exporter' ),
		completionMessage: __(
			'Site archive uploaded successfully',
			'aether-site-exporter'
		),
	},
];

/**
 * Get step definition by ID.
 *
 * @param {string} stepId Step identifier.
 * @return {Object|null} Step definition or null if not found.
 */
export function getStep( stepId ) {
	return PUBLISH_STEPS.find( ( step ) => step.id === stepId ) || null;
}

/**
 * Get the next step ID in the workflow.
 *
 * @param {string} currentStepId Current step identifier.
 * @return {string|null} Next step ID or null if this is the final step.
 */
export function getNextStep( currentStepId ) {
	const currentIndex = PUBLISH_STEPS.findIndex(
		( step ) => step.id === currentStepId
	);

	if ( currentIndex === -1 || currentIndex === PUBLISH_STEPS.length - 1 ) {
		return null;
	}

	return PUBLISH_STEPS[ currentIndex + 1 ].id;
}

/**
 * Get the completion message for a step.
 *
 * @param {string} stepId Step identifier.
 * @return {string|null} Completion message or null if not defined.
 */
export function getCompletionMessage( stepId ) {
	const step = getStep( stepId );
	return step?.completionMessage || null;
}

/**
 * Get the waiting message for a step.
 *
 * @param {string} stepId Step identifier.
 * @return {string|null} Waiting message or null if not defined.
 */
export function getWaitingMessage( stepId ) {
	const step = getStep( stepId );
	return step?.waitingMessage || null;
}

/**
 * Get the label for a step.
 *
 * @param {string} stepId Step identifier.
 * @return {string|null} Step label or null if not found.
 */
export function getLabel( stepId ) {
	const step = getStep( stepId );
	return step?.label || null;
}

/**
 * Check if a step supports progress reporting.
 *
 * @param {string} stepId Step identifier.
 * @return {boolean} True if step supports progress.
 */
export function supportsProgress( stepId ) {
	const step = getStep( stepId );
	return step?.supportsProgress || false;
}

/**
 * Check if a step requires browser upload.
 *
 * @param {string} stepId Step identifier.
 * @return {boolean} True if step requires browser upload.
 */
export function requiresBrowserUpload( stepId ) {
	const step = getStep( stepId );
	return step?.requiresBrowserUpload || false;
}
