/**
 * Steps Progress Component
 *
 * Displays progress for all export steps using a compact horizontal stepper layout.
 * Step labels are derived dynamically from step definitions.
 *
 * @since 1.0.0
 */

import { HorizontalStepper } from './HorizontalStepper';
import { isThreadStep } from '@aether/export/executor/DataValidator';

/**
 * Check if all steps are complete
 *
 * @param {Array} steps - Array of step objects with id and status
 * @return {boolean} True if all steps are complete
 */
export function areAllStepsComplete( steps ) {
	if ( ! steps || steps.length === 0 ) {
		return false;
	}
	return steps.every( ( step ) => step.status === 'complete' );
}

/**
 * Check if all global (non-thread) steps are complete
 *
 * Global steps run once before per-provider thread steps.
 * This is used to determine when to show the provider progress list.
 *
 * @param {Array} steps - Array of step objects with id, status, and requires
 * @return {boolean} True if all global steps are complete
 */
export function areGlobalStepsComplete( steps ) {
	if ( ! steps || steps.length === 0 ) {
		return false;
	}
	const globalSteps = steps.filter( ( step ) => ! isThreadStep( step ) );
	if ( globalSteps.length === 0 ) {
		return false;
	}
	return globalSteps.every( ( step ) => step.status === 'complete' );
}

/**
 * Steps Progress Component
 *
 * @param {Object} props       - Component props
 * @param {Array}  props.steps - Array of step objects with id, label, status
 * @return {JSX.Element|null} Steps progress component or null if no steps
 */
export function GlobalStepsProgress( { steps } ) {
	// Don't render if no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	// Build labels dynamically from step definitions
	const stepLabels = steps.reduce( ( acc, step ) => {
		acc[ step.id ] = step.label;
		return acc;
	}, {} );

	return <HorizontalStepper steps={ steps } stepLabels={ stepLabels } />;
}

export default GlobalStepsProgress;
