/**
 * StepNode Component
 *
 * Renders an individual step circle in the horizontal stepper.
 * Shows status via icon/number and color.
 *
 * @since 1.0.0
 */

import { Spinner, Tooltip } from '@wordpress/components';
import { colors, fontSize, fontWeight } from '@aether/utils/styles';

const NODE_SIZE = 28;

const nodeBaseStyle = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: `${ NODE_SIZE }px`,
	height: `${ NODE_SIZE }px`,
	borderRadius: '50%',
	fontSize: fontSize.xs,
	fontWeight: fontWeight.bold,
	flexShrink: 0,
	transition: 'all 0.2s ease',
	border: '2px solid transparent',
};

const spinnerStyle = {
	width: '16px',
	height: '16px',
	margin: 0,
};

/**
 * Get status-specific styles for the node
 *
 * @param {string} status Step status
 * @return {Object} Style object
 */
function getNodeStatusStyle( status ) {
	switch ( status ) {
		case 'active':
			return {
				background: colors.backgroundInfo,
				borderColor: colors.primary,
				color: colors.primary,
				boxShadow: `0 0 0 4px ${ colors.backgroundInfo }`,
			};
		case 'complete':
			return {
				background: colors.success,
				borderColor: colors.success,
				color: colors.white,
			};
		case 'error':
			return {
				background: colors.error,
				borderColor: colors.error,
				color: colors.white,
			};
		default: // pending
			return {
				background: colors.white,
				borderColor: colors.borderLighter,
				color: colors.textMuted,
			};
	}
}

/**
 * Get the content to display inside the node
 *
 * @param {string} status     Step status
 * @param {number} stepNumber Step number (1-indexed)
 * @return {JSX.Element|string} Node content
 */
function getNodeContent( status, stepNumber ) {
	switch ( status ) {
		case 'active':
			return <Spinner style={ spinnerStyle } />;
		case 'complete':
			return '✓';
		case 'error':
			return '✗';
		default:
			return stepNumber;
	}
}

/**
 * StepNode Component
 *
 * @param {Object} props            Component props
 * @param {number} props.stepNumber Step number (1-indexed)
 * @param {string} props.label      Step label for tooltip
 * @param {string} props.status     Step status ('pending', 'active', 'complete', 'error')
 * @return {JSX.Element} StepNode component
 */
export function StepNode( { stepNumber, label, status } ) {
	const statusStyle = getNodeStatusStyle( status );
	const content = getNodeContent( status, stepNumber );

	const node = (
		<span
			className={ `aether-step-node aether-step-node--${ status }` }
			style={ { ...nodeBaseStyle, ...statusStyle } }
			role="listitem"
			aria-label={ `Step ${ stepNumber }: ${ label } - ${ status }` }
		>
			{ content }
		</span>
	);

	return (
		<Tooltip text={ label } position="bottom center">
			{ node }
		</Tooltip>
	);
}

export default StepNode;
