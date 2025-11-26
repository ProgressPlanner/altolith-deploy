/**
 * HorizontalStepper Component
 *
 * Displays steps in a compact horizontal layout with connected nodes.
 * Shows current step label and progress count.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
} from '@aether/utils/styles';
import { StepNode } from './StepNode';
import { StepConnector } from './StepConnector';

const containerStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.sm,
	padding: spacing.md,
	background: colors.backgroundInfo,
	borderRadius: borderRadius.md,
	marginBottom: spacing.lg,
};

const stepsRowStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: spacing.xs,
};

const infoRowStyle = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	fontSize: fontSize.sm,
};

const currentStepStyle = {
	color: colors.primary,
	fontWeight: fontWeight.medium,
};

const countStyle = {
	color: colors.textMuted,
	fontSize: fontSize.xs,
};

/**
 * HorizontalStepper Component
 *
 * @param {Object} props            Component props
 * @param {Array}  props.steps      Array of step objects with id, label, status
 * @param {Object} props.stepLabels Map of step ID to human-readable label
 * @return {JSX.Element} HorizontalStepper component
 */
export function HorizontalStepper( { steps, stepLabels } ) {
	const completedCount = steps.filter(
		( step ) => step.status === 'complete'
	).length;

	const activeStep = steps.find( ( step ) => step.status === 'active' );
	const activeStepLabel = activeStep
		? stepLabels[ activeStep.id ] || activeStep.label
		: __( 'Preparing…', 'aether-site-exporter' );

	return (
		<div
			className="aether-horizontal-stepper"
			style={ containerStyle }
			role="list"
			aria-label={ __( 'Export progress', 'aether-site-exporter' ) }
		>
			<div
				className="aether-horizontal-stepper__steps"
				style={ stepsRowStyle }
			>
				{ steps.map( ( step, index ) => {
					const stepLabel = stepLabels[ step.id ] || step.label;
					const isLastStep = index === steps.length - 1;
					const isStepComplete = step.status === 'complete';

					return (
						<>
							<StepNode
								key={ step.id }
								stepNumber={ index + 1 }
								label={ stepLabel }
								status={ step.status }
							/>
							{ ! isLastStep && (
								<StepConnector
									key={ `connector-${ index }` }
									isComplete={ isStepComplete }
								/>
							) }
						</>
					);
				} ) }
			</div>

			<div
				className="aether-horizontal-stepper__info"
				style={ infoRowStyle }
			>
				<span style={ currentStepStyle }>{ activeStepLabel }</span>
				<span style={ countStyle }>
					({ completedCount }/{ steps.length })
				</span>
			</div>
		</div>
	);
}

export default HorizontalStepper;
