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
 * Check if a step supports progress reporting.
 *
 * @param {string} stepId Step identifier.
 * @return {boolean} True if step supports progress.
 */
export function supportsProgress( stepId ) {
	const step = getStep( stepId );
	return step?.supportsProgress || false;
}
