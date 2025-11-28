/**
 * Progress Bar Component
 *
 * Displays progress using a native HTML progress element with optional description text.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { colors, spacing, fontSize } from '@altolith/utils/styles';

/**
 * Progress Bar Component
 *
 * Displays a progress bar with current/total values and optional description.
 *
 * @param {Object} props               - Component props
 * @param {Object} props.progress      - Progress object with `current` (number) and `total` (number) properties
 * @param {string} [props.description] - Optional description text displayed below progress bar
 * @param {number} props.height        - Height of the progress element in pixels
 * @return {JSX.Element} Progress bar component
 */
export function ProgressBar( { progress, description, height } ) {
	// Calculate percentage for display
	const percentage =
		progress.total > 0
			? Math.round( ( progress.current / progress.total ) * 100 )
			: 0;

	// Container style
	const containerStyle = {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.xs,
	};

	// Progress element style
	const progressStyle = {
		width: '100%',
		height: `${ height }px`,
	};

	// Description style
	const descriptionStyle = {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		margin: 0,
	};

	return (
		<div style={ containerStyle } className="altolith-progress-bar">
			<progress
				className="altolith-progress-bar__element"
				style={ progressStyle }
				max={ progress.total }
				value={ progress.current }
				aria-valuenow={ progress.current }
				aria-valuemin={ 0 }
				aria-valuemax={ progress.total }
				aria-label={
					description ||
					sprintf(
						/* translators: %1$d: Progress percentage */
						__( 'Progress: %1$d%%', 'altolith-deploy' ),
						percentage
					)
				}
			/>
			{ description && (
				<p
					style={ descriptionStyle }
					className="altolith-progress-bar__description"
				>
					{ description }
				</p>
			) }
		</div>
	);
}

export default ProgressBar;
