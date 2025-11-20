/**
 * Info Card Component
 *
 * Reusable card component for displaying informational content.
 * Used in help/documentation sections to present organized information.
 *
 * @package
 */

import {
	colors,
	borderRadius,
	fontSize,
	fontWeight,
	utilityStyles,
} from '../../utils/styles';

// Styles - extracted to module level for performance
const cardStyle = {
	marginBottom: '2rem',
	padding: '1.5rem',
	background: colors.white,
	border: `1px solid ${ colors.borderLighter }`,
	borderRadius: borderRadius.sm,
};

const titleStyle = {
	margin: '0 0 1rem',
	fontSize: fontSize.xl,
	fontWeight: fontWeight.semibold,
	color: colors.text,
};

const paragraphStyle = {
	margin: '0 0 1rem',
	color: colors.textSecondary,
	lineHeight: 1.6,
};

const lastParagraphStyle = {
	...paragraphStyle,
	...utilityStyles.noMarginBottom,
};

/**
 * InfoCard Component
 *
 * @param {Object}      props           Component props
 * @param {string}      props.title     Card title
 * @param {JSX.Element} props.children  Card content
 * @param {string}      props.className Optional additional CSS class
 * @param {Object}      props.style     Optional style overrides
 * @param {boolean}     props.isLast    Whether this is the last card (removes bottom margin)
 * @return {JSX.Element} Rendered info card
 */
export default function InfoCard( {
	title,
	children,
	className = '',
	style = {},
	isLast = false,
} ) {
	const cardClassName = `aether-info-card ${ className }`.trim();
	const finalCardStyle = isLast
		? { ...cardStyle, ...utilityStyles.noMarginBottom, ...style }
		: { ...cardStyle, ...style };

	return (
		<div className={ cardClassName } style={ finalCardStyle }>
			<h4 className="aether-info-card__title" style={ titleStyle }>
				{ title }
			</h4>
			<div className="aether-info-card__content">{ children }</div>
		</div>
	);
}

// Export helper components for common content patterns
export function InfoParagraph( { children, isLast = false } ) {
	return (
		<p
			className="aether-info-card__paragraph"
			style={ isLast ? lastParagraphStyle : paragraphStyle }
		>
			{ children }
		</p>
	);
}
