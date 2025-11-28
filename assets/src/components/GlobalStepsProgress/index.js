/**
 * Steps Progress Component
 *
 * Displays progress for all export steps using a compact horizontal stepper layout.
 * Step labels are derived dynamically from step definitions.
 *
 * @since 1.0.0
 */

import { VerticalStepper } from '@altolith/components/VerticalStepper';

/**
 * Steps Progress Component
 *
 * @param {Object} props                   - Component props
 * @param {Array}  props.steps             - Array of step objects with id, label, status, statusLabels, statusData
 * @param {Object} props.providerProgress  - Provider progress object from context
 * @param {Array}  props.providerInstances - Provider instances array from context
 * @return {JSX.Element|null} Steps progress component or null if no steps
 */
export function GlobalStepsProgress( {
	steps,
	providerProgress,
	providerInstances,
} ) {
	// Don't render if no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	return (
		<VerticalStepper
			steps={ steps }
			providerProgress={ providerProgress }
			providerInstances={ providerInstances }
		/>
	);
}

export default GlobalStepsProgress;
