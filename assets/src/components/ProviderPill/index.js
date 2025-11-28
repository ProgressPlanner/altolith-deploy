/**
 * Provider Pill Component
 *
 * Compact pill showing provider status inline with step labels.
 * Displays provider name + status icon (checkmark, percentage, spinner, or error).
 */

import { Spinner } from '@wordpress/components';
import {
	colors,
	fontSize,
	spacing,
	borderRadius,
} from '@altolith/utils/styles';

/**
 * Get pill styles based on status
 *
 * @param {string} status Provider status
 * @return {Object} Style object
 */
function getPillStyles( status ) {
	const base = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '4px',
		padding: `2px ${ spacing.sm }`,
		borderRadius: borderRadius.full,
		fontSize: fontSize.xs,
		fontWeight: 500,
		whiteSpace: 'nowrap',
	};

	switch ( status ) {
		case 'complete':
			return {
				...base,
				backgroundColor: colors.backgroundSuccess,
				color: colors.successDark,
			};
		case 'error':
			return {
				...base,
				backgroundColor: colors.backgroundError,
				color: colors.errorDark,
			};
		case 'active':
			return {
				...base,
				backgroundColor: colors.backgroundInfo,
				color: colors.primary,
			};
		case 'pending':
		default:
			return {
				...base,
				backgroundColor: colors.backgroundLighter,
				color: colors.textMuted,
			};
	}
}

/**
 * Get status icon based on status
 *
 * @param {string} status   Provider status
 * @param {number} progress Progress percentage (0-100)
 * @return {JSX.Element|string} Icon element or text
 */
function getStatusIcon( status, progress ) {
	switch ( status ) {
		case 'complete':
			return '✓';
		case 'error':
			return '✗';
		case 'active':
			return progress > 0 ? `${ progress }%` : <Spinner />;
		case 'pending':
		default:
			return '⏳';
	}
}

/**
 * Provider Pill Component
 *
 * @param {Object} props          Component props
 * @param {string} props.label    Provider label/name
 * @param {string} props.status   Provider status: 'pending', 'active', 'complete', 'error'
 * @param {number} props.progress Progress percentage (0-100), used when status is 'active'
 * @return {JSX.Element} Pill element
 */
export function ProviderPill( { label, status = 'pending', progress = 0 } ) {
	const pillStyle = getPillStyles( status );
	const icon = getStatusIcon( status, progress );

	// Shorten long labels
	const shortLabel =
		label.length > 12 ? label.substring( 0, 10 ) + '…' : label;

	return (
		<span style={ pillStyle } title={ `${ label }: ${ status }` }>
			<span>{ shortLabel }</span>
			<span style={ { display: 'inline-flex', alignItems: 'center' } }>
				{ icon }
			</span>
		</span>
	);
}

export default ProviderPill;
