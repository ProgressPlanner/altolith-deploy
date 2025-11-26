/**
 * VerticalStepper Component
 *
 * Displays steps in a vertical layout with connected nodes.
 * Each step shows its status icon and dynamic label based on status.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import { spacing, borderRadius } from '@aether/utils/styles';
import { StepNode } from '@aether/components/StepNode';
import { StepConnector } from '@aether/components/StepConnector';

const containerStyle = {
	display: 'flex',
	flexDirection: 'column',
	padding: spacing.md,
	borderRadius: borderRadius.md,
	marginBottom: spacing.lg,
};

/**
 * VerticalStepper Component
 *
 * @param {Object} props                   Component props
 * @param {Array}  props.steps             Array of step objects with id, label, status, statusLabels, statusData
 * @param {Object} props.providerProgress  Provider progress object from context
 * @param {Array}  props.providerInstances Provider instances array from context
 * @return {JSX.Element} VerticalStepper component
 */
export function VerticalStepper( {
	steps,
	providerProgress,
	providerInstances,
} ) {
	return (
		<div
			className="aether-vertical-stepper"
			style={ containerStyle }
			role="list"
			aria-label={ __( 'Export progress', 'aether-site-exporter' ) }
		>
			{ steps.map( ( step, index ) => {
				const isLastStep = index === steps.length - 1;
				const isStepComplete = step.status === 'complete';

				return (
					<div key={ step.id }>
						<StepNode
							stepNumber={ index + 1 }
							label={ step.label }
							status={ step.status }
							statusLabels={ step.statusLabels }
							statusData={ step.statusData }
							stepId={ step.id }
							providerProgress={ providerProgress }
							providerInstances={ providerInstances }
						/>
						{ ! isLastStep && (
							<StepConnector isComplete={ isStepComplete } />
						) }
					</div>
				);
			} ) }
		</div>
	);
}

export default VerticalStepper;
