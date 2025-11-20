/**
 * Status Badge Component
 *
 * Reusable badge component for displaying status with consistent styling.
 * Supports different status types (success, error, warning, info) with
 * automatic color theming from statusBadgeStyles.
 *
 * @package
 */

import { statusBadgeStyles } from '../../utils/styles';

// Base badge style - extracted to module level for performance
const baseBadgeStyle = {
	...statusBadgeStyles.base,
};

/**
 * Get style for a specific badge type
 *
 * @param {string} type Badge type (success, error, warning, info)
 * @return {Object} Style object
 */
const getBadgeStyle = ( type ) => ( {
	...baseBadgeStyle,
	...( statusBadgeStyles[ type ] || statusBadgeStyles.info ),
} );

/**
 * StatusBadge Component
 *
 * @param {Object} props           Component props
 * @param {string} props.type      Badge type (success, error, warning, info)
 * @param {string} props.label     Text to display in badge
 * @param {string} props.className Optional additional CSS class
 * @return {JSX.Element} Rendered badge
 */
export default function StatusBadge( {
	type = 'info',
	label,
	className = '',
} ) {
	const badgeClassName =
		`aether-status-badge aether-status-badge--${ type } ${ className }`.trim();

	return (
		<span className={ badgeClassName } style={ getBadgeStyle( type ) }>
			{ label }
		</span>
	);
}
