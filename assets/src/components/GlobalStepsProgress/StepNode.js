/**
 * StepNode Component
 *
 * Renders an individual step in the vertical stepper.
 * Shows status via icon/number and color, with label displayed next to it.
 *
 * @since 1.0.0
 */

import { Spinner } from '@wordpress/components';
import { colors, fontSize, fontWeight, spacing } from '@aether/utils/styles';

const NODE_SIZE = 28;

const stepRowStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: spacing.sm,
};

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

const labelBaseStyle = {
	fontSize: fontSize.sm,
	transition: 'color 0.2s ease',
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
 * Get status-specific styles for the label
 *
 * @param {string} status Step status
 * @return {Object} Style object
 */
function getLabelStatusStyle( status ) {
	switch ( status ) {
		case 'active':
			return {
				color: colors.primary,
				fontWeight: fontWeight.medium,
			};
		case 'complete':
			return {
				color: colors.success,
			};
		case 'error':
			return {
				color: colors.error,
			};
		default: // pending
			return {
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
 * @param {string} props.label      Step label
 * @param {string} props.status     Step status ('pending', 'active', 'complete', 'error')
 * @return {JSX.Element} StepNode component
 */
export function StepNode( { stepNumber, label, status } ) {
	const nodeStatusStyle = getNodeStatusStyle( status );
	const labelStatusStyle = getLabelStatusStyle( status );
	const content = getNodeContent( status, stepNumber );

	return (
		<div
			className={ `aether-step-node aether-step-node--${ status }` }
			style={ stepRowStyle }
			role="listitem"
			aria-label={ `Step ${ stepNumber }: ${ label } - ${ status }` }
		>
			<span
				className="aether-step-node__circle"
				style={ { ...nodeBaseStyle, ...nodeStatusStyle } }
			>
				{ content }
			</span>
			<span
				className="aether-step-node__label"
				style={ { ...labelBaseStyle, ...labelStatusStyle } }
			>
				{ label }
			</span>
		</div>
	);
}

export default StepNode;
