/**
 * Loading Spinner Component
 *
 * Reusable loading indicator with optional message.
 * Wraps WordPress Spinner component with consistent styling and layout.
 *
 * @package
 */

import { Spinner } from '@wordpress/components';
import { colors, spacing, fontSize } from '../utils/styles';

// Styles - extracted to module level for performance
const containerStyle = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: spacing.md,
	padding: spacing.xl,
	textAlign: 'center',
};

const messageStyle = {
	fontSize: fontSize.base,
	color: colors.textSecondary,
	margin: 0,
};

/**
 * LoadingSpinner Component
 *
 * @param {Object} props           Component props
 * @param {string} props.message   Optional loading message to display
 * @param {string} props.className Optional additional CSS class
 * @param {Object} props.style     Optional inline style overrides
 * @return {JSX.Element} Rendered loading spinner
 */
export default function LoadingSpinner( {
	message = '',
	className = '',
	style = {},
} ) {
	const containerClassName = `aether-loading-spinner ${ className }`.trim();

	return (
		<div
			className={ containerClassName }
			style={ { ...containerStyle, ...style } }
		>
			<Spinner className="aether-loading-spinner__spinner" />
			{ message && (
				<p
					className="aether-loading-spinner__message"
					style={ messageStyle }
				>
					{ message }
				</p>
			) }
		</div>
	);
}
