/**
 * Section Header Component
 *
 * Reusable section header with title and optional description.
 * Provides consistent styling across admin pages.
 *
 * @package
 */

import { colors, fontSize, commonStyles } from '@aether/utils/styles';

// Styles - extracted to module level for performance
const sectionHeaderStyle = {
	...commonStyles.sectionHeader,
};

const headerTitleStyle = {
	margin: 0,
	fontSize: '1.3em',
	lineHeight: 1.4,
	color: colors.text,
};

const headerDescriptionStyle = {
	margin: '0.5rem 0 0',
	color: colors.textMuted,
	fontSize: fontSize.base,
};

/**
 * SectionHeader Component
 *
 * @param {Object}      props             Component props
 * @param {string}      props.title       Section title
 * @param {string}      props.description Optional section description
 * @param {string}      props.className   Optional additional CSS class
 * @param {JSX.Element} props.actions     Optional action buttons/elements to display in header
 * @return {JSX.Element} Rendered section header
 */
export default function SectionHeader( {
	title,
	description = '',
	className = '',
	actions = null,
} ) {
	const headerClassName = `aether-section-header ${ className }`.trim();

	return (
		<div className={ headerClassName } style={ sectionHeaderStyle }>
			<div className="aether-section-header__content">
				<h2
					className="aether-section-header__title"
					style={ headerTitleStyle }
				>
					{ title }
				</h2>
				{ description && (
					<p
						className="aether-section-header__description"
						style={ headerDescriptionStyle }
					>
						{ description }
					</p>
				) }
			</div>
			{ actions && (
				<div className="aether-section-header__actions">
					{ actions }
				</div>
			) }
		</div>
	);
}
