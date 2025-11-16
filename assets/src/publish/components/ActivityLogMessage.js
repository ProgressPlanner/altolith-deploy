/**
 * Activity Log Message Component
 *
 * Renders a single activity log message with icon, text, and optional progress bar
 *
 * @package
 */

import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	noticeStyles,
	createFlexStyle,
} from '../../utils/styles';

/**
 * Get activity item style based on message type
 *
 * @param {string} type Message type: 'info' | 'success' | 'error' | 'progress'
 * @return {Object} Style object
 */
const getActivityItemStyle = ( type ) => {
	const baseStyle = {
		...createFlexStyle( 'row', spacing.sm ),
		alignItems: 'flex-start',
		padding: spacing.sm,
		borderRadius: borderRadius.sm,
		transition: 'background-color 0.2s ease',
	};

	const typeStyles = {
		progress: {
			backgroundColor: noticeStyles.info.background,
		},
		success: {
			backgroundColor: noticeStyles.success.background,
		},
		error: {
			backgroundColor: noticeStyles.error.background,
		},
		info: {
			backgroundColor: colors.backgroundLighter,
		},
	};

	return {
		...baseStyle,
		...( typeStyles[ type ] || typeStyles.info ),
	};
};

/**
 * Get icon color based on message type
 *
 * @param {string} type Message type: 'info' | 'success' | 'error' | 'progress'
 * @return {string} Color value
 */
const getActivityIconColor = ( type ) => {
	const iconColors = {
		progress: colors.primary,
		success: colors.success,
		error: colors.error,
		info: colors.textMuted,
	};
	return iconColors[ type ] || iconColors.info;
};

const activityIconStyle = {
	flexShrink: 0,
	width: '1rem',
	height: '1rem',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontWeight: fontWeight.bold,
};

const activityMessageStyle = {
	flex: 1,
	lineHeight: 1.4,
	wordBreak: 'break-word',
	minWidth: 0, // Allow flex item to shrink below content size
};

const fileProgressBarContainerStyle = {
	flexShrink: 0,
	width: '120px',
	display: 'flex',
	alignItems: 'center',
	gap: spacing.xs,
	marginLeft: spacing.sm,
};

const fileProgressBarStyle = {
	flex: 1,
	height: '4px',
	backgroundColor: colors.borderLighter,
	borderRadius: borderRadius.full,
	overflow: 'hidden',
};

const fileProgressBarFillStyle = {
	height: '100%',
	backgroundColor: colors.primary,
	transition: 'width 0.2s ease',
};

const fileProgressPercentageStyle = {
	fontSize: fontSize.xs,
	color: colors.textMuted,
	fontWeight: fontWeight.medium,
	minWidth: '35px',
	textAlign: 'right',
};

/**
 * Get icon character for message type
 *
 * @param {string} type Message type
 * @return {string} Icon character
 */
const getIcon = ( type ) => {
	const icons = {
		success: '✓',
		error: '✕',
		progress: '◉',
		info: '•',
	};
	return icons[ type ] || icons.info;
};

/**
 * Activity Log Message Component
 *
 * @param {Object}      props          Component props
 * @param {string}      props.message  Message text (can contain HTML)
 * @param {string}      props.type     Message type: 'info' | 'success' | 'error' | 'progress'
 * @param {Object|null} props.progress Optional progress data { percent: number, loaded?: number, total?: number }
 * @return {JSX.Element} Activity log message item
 */
export default function ActivityLogMessage( { message, type, progress } ) {
	return (
		<li
			className={ `aether-publish-progress-modal__activity-item aether-publish-progress-modal__activity-item--${ type }` }
			style={ getActivityItemStyle( type ) }
		>
			<span
				className={ `aether-publish-progress-modal__activity-icon aether-publish-progress-modal__activity-icon--${ type }` }
				style={ {
					...activityIconStyle,
					color: getActivityIconColor( type ),
				} }
			>
				{ getIcon( type ) }
			</span>
			<span
				className="aether-publish-progress-modal__activity-message"
				style={ activityMessageStyle }
				dangerouslySetInnerHTML={ {
					__html: message,
				} }
			/>
			{ progress && (
				<div
					className="aether-publish-progress-modal__file-progress"
					style={ fileProgressBarContainerStyle }
				>
					<div
						className="aether-publish-progress-modal__file-progress-bar"
						style={ fileProgressBarStyle }
					>
						<div
							className="aether-publish-progress-modal__file-progress-fill"
							style={ {
								...fileProgressBarFillStyle,
								width: `${ progress.percent }%`,
							} }
						/>
					</div>
					<span
						className="aether-publish-progress-modal__file-progress-percentage"
						style={ fileProgressPercentageStyle }
					>
						{ progress.percent }%
					</span>
				</div>
			) }
		</li>
	);
}
