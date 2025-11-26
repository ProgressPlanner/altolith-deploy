/**
 * VerticalStepper Component
 *
 * Displays steps in a vertical layout with connected nodes.
 * Each step shows its status icon and label.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import { colors, spacing, borderRadius } from '@aether/utils/styles';
import { StepNode } from './StepNode';
import { StepConnector } from './StepConnector';

const containerStyle = {
	display: 'flex',
	flexDirection: 'column',
	padding: spacing.md,
	background: colors.backgroundInfo,
	borderRadius: borderRadius.md,
	marginBottom: spacing.lg,
};

/**
 * VerticalStepper Component
 *
 * @param {Object} props            Component props
 * @param {Array}  props.steps      Array of step objects with id, label, status
 * @param {Object} props.stepLabels Map of step ID to human-readable label
 * @return {JSX.Element} VerticalStepper component
 */
export function HorizontalStepper( { steps, stepLabels } ) {
	return (
		<div
			className="aether-vertical-stepper"
			style={ containerStyle }
			role="list"
			aria-label={ __( 'Export progress', 'aether-site-exporter' ) }
		>
			{ steps.map( ( step, index ) => {
				const stepLabel = stepLabels[ step.id ] || step.label;
				const isLastStep = index === steps.length - 1;
				const isStepComplete = step.status === 'complete';

				return (
					<div key={ step.id }>
						<StepNode
							stepNumber={ index + 1 }
							label={ stepLabel }
							status={ step.status }
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

export default HorizontalStepper;
