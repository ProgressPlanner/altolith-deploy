/**
 * Global Steps Progress Component
 *
 * Displays progress for global export steps (those that run once before
 * per-provider thread steps). Uses a compact horizontal stepper layout.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import { HorizontalStepper } from './HorizontalStepper';

/**
 * IDs of global steps (steps that run once, not per-provider)
 * These are the steps that need visual feedback at the start of export.
 */
export const GLOBAL_STEP_IDS = [
	'discoverBlueprintBundleAssets',
	'getStaticSiteUrls',
	'preScanStaticSite',
	'createWpContentArchive',
	'createBlueprintBundle',
];

/**
 * Check if all global steps are complete
 *
 * @param {Array} steps - Array of step objects with id and status
 * @return {boolean} True if all global steps are complete
 */
export function areGlobalStepsComplete( steps ) {
	if ( ! steps || steps.length === 0 ) {
		return false;
	}
	const globalSteps = steps.filter( ( step ) =>
		GLOBAL_STEP_IDS.includes( step.id )
	);
	if ( globalSteps.length === 0 ) {
		return false;
	}
	return globalSteps.every( ( step ) => step.status === 'complete' );
}

/**
 * Human-readable labels for global steps
 */
const STEP_LABELS = {
	discoverBlueprintBundleAssets: __(
		'Discovering assets',
		'aether-site-exporter'
	),
	getStaticSiteUrls: __( 'Discovering URLs', 'aether-site-exporter' ),
	preScanStaticSite: __( 'Scanning pages', 'aether-site-exporter' ),
	createWpContentArchive: __( 'Creating archive', 'aether-site-exporter' ),
	createBlueprintBundle: __( 'Building blueprint', 'aether-site-exporter' ),
};

/**
 * Global Steps Progress Component
 *
 * @param {Object} props       - Component props
 * @param {Array}  props.steps - Array of step objects with id, label, status
 * @return {JSX.Element|null} Global steps progress component or null if no global steps
 */
export function GlobalStepsProgress( { steps } ) {
	// Filter to only show global steps that exist in the steps array
	const globalSteps = steps.filter( ( step ) =>
		GLOBAL_STEP_IDS.includes( step.id )
	);

	// Don't render if no global steps
	if ( globalSteps.length === 0 ) {
		return null;
	}

	return (
		<HorizontalStepper steps={ globalSteps } stepLabels={ STEP_LABELS } />
	);
}

export default GlobalStepsProgress;
