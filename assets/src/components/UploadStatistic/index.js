/**
 * Upload Statistic Component
 *
 * Reusable component for displaying individual statistics with a labeled badge
 * and flexible content area. Used within UploadStatistics to show metrics like
 * provider count, file count, and total size.
 *
 * @package
 */

import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	createFlexStyle,
} from '@aether/utils/styles';

/**
 * Upload Statistic Component
 *
 * @param {Object}      props          Component props
 * @param {string}      props.label    Label text displayed in badge
 * @param {Object}      props.color    Color configuration for label badge (with backgroundColor and textColor properties)
 * @param {JSX.Element} props.children Content to display below the label
 * @return {JSX.Element} Statistic item
 */
export default function UploadStatistic( {
	label,
	color = {
		backgroundColor: colors.backgroundLight,
		textColor: colors.textMuted,
	},
	children,
} ) {
	// Styles
	const itemStyle = {
		...createFlexStyle( 'column', spacing.xs ),
		alignItems: 'center',
		minWidth: '120px',
	};

	const labelStyle = {
		fontSize: fontSize.xs,
		color: color.textColor,
		backgroundColor: color.backgroundColor,
		fontWeight: fontWeight.medium,
		textTransform: 'uppercase',
		letterSpacing: '0.5px',
		padding: `${ spacing.xs } ${ spacing.sm }`,
		borderRadius: borderRadius.sm,
	};

	return (
		<div
			className="aether-export-progress-modal__detail-item"
			style={ itemStyle }
		>
			<span
				className="aether-export-progress-modal__detail-label"
				style={ labelStyle }
			>
				{ label }
			</span>
			<div className="aether-export-progress-modal__detail-value">
				{ children }
			</div>
		</div>
	);
}
