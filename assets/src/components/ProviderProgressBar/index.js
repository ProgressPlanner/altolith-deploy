/**
 * Provider Progress Bar Component
 *
 * Displays progress for a single provider instance.
 * Shows provider label, current step, and progress percentage.
 *
 * @since 1.0.0
 */

import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
} from '@aether/utils/styles';

/**
 * Provider Progress Bar Component
 *
 * @param {Object} props               - Component props
 * @param {string} props.providerId    - Provider instance ID
 * @param {string} props.providerLabel - Provider display label
 * @param {string} props.stepLabel     - Current step label
 * @param {number} props.progress      - Progress percentage (0-100)
 * @param {string} props.status        - Status: 'active', 'complete', 'error'
 * @param {string} props.error         - Error message (if status is 'error')
 * @return {JSX.Element} Provider progress bar component
 */
export function ProviderProgressBar( {
	providerId,
	providerLabel,
	stepLabel,
	progress,
	status,
	error,
} ) {
	const getStatusIcon = () => {
		switch ( status ) {
			case 'complete':
				return '✓';
			case 'error':
				return '✗';
			default:
				return null;
		}
	};

	const statusIcon = getStatusIcon();

	// Base container style
	const containerStyle = {
		marginBottom: spacing.lg,
		padding: spacing.md,
		border: `1px solid ${ colors.borderLighter }`,
		borderRadius: borderRadius.sm,
		background: colors.white,
		transition: 'all 0.3s ease',
	};

	// Status-specific styles
	if ( status === 'active' ) {
		containerStyle.borderColor = '#007cba';
		containerStyle.boxShadow = '0 0 0 1px rgba(0, 124, 186, 0.1)';
	} else if ( status === 'complete' ) {
		containerStyle.borderColor = colors.success;
		containerStyle.background = colors.background;
	} else if ( status === 'error' ) {
		containerStyle.borderColor = colors.error;
		containerStyle.background = colors.backgroundError;
	}

	// Header style
	const headerStyle = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.sm,
	};

	// Label style
	const labelStyle = {
		display: 'flex',
		alignItems: 'center',
		gap: spacing.sm,
		fontSize: fontSize.sm,
	};

	// Status icon style
	const statusIconStyle = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '20px',
		height: '20px',
		borderRadius: '50%',
		fontSize: fontSize.xs,
		fontWeight: fontWeight.bold,
	};

	if ( status === 'active' ) {
		statusIconStyle.animation = 'pulse 1.5s ease-in-out infinite';
	} else if ( status === 'complete' ) {
		statusIconStyle.background = colors.success;
		statusIconStyle.color = colors.white;
	} else if ( status === 'error' ) {
		statusIconStyle.background = colors.error;
		statusIconStyle.color = colors.white;
	}

	// Percentage style
	const percentageStyle = {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		fontWeight: fontWeight.semibold,
	};

	// Step label style
	const stepStyle = {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		marginBottom: spacing.sm,
		fontStyle: 'italic',
	};

	// Error message style
	const errorStyle = {
		fontSize: fontSize.xs,
		color: colors.error,
		marginBottom: spacing.sm,
		padding: spacing.sm,
		background: colors.backgroundError,
		borderRadius: '2px',
	};

	// Complete message style
	const completeMessageStyle = {
		fontSize: fontSize.xs,
		color: colors.success,
		marginBottom: spacing.sm,
		fontWeight: fontWeight.medium,
	};

	// Progress bar wrapper style
	const progressBarWrapperStyle = {
		position: 'relative',
	};

	// Progress bar style override
	const progressBarStyle = {
		height: '8px',
	};

	return (
		<>
			<style>
				{ `
					@keyframes pulse {
						0%, 100% {
							opacity: 1;
						}
						50% {
							opacity: 0.5;
						}
					}
					.provider-progress-bar__progress .components-progress-bar {
						height: 8px;
					}
					.provider-progress-bar__progress .components-progress-bar__indicator {
						${ status === 'complete' ? `background: ${ colors.success };` : '' }
						${ status === 'error' ? `background: ${ colors.error };` : '' }
					}
				` }
			</style>
			<div style={ containerStyle } data-provider-id={ providerId }>
				<div style={ headerStyle }>
					<div style={ labelStyle }>
						{ statusIcon && (
							<span style={ statusIconStyle }>
								{ statusIcon }
							</span>
						) }
						<strong>{ providerLabel }</strong>
					</div>
					<div style={ percentageStyle }>
						{ Math.round( progress ) }%
					</div>
				</div>

				{ stepLabel && status === 'active' && (
					<div style={ stepStyle }>{ stepLabel }</div>
				) }

				{ error && status === 'error' && (
					<div style={ errorStyle }>{ error }</div>
				) }

				{ status === 'complete' && (
					<div style={ completeMessageStyle }>
						{ __( 'Complete', 'aether' ) }
					</div>
				) }

				<div style={ progressBarWrapperStyle }>
					<ProgressBar
						className="provider-progress-bar__progress"
						style={ progressBarStyle }
						value={ progress }
					/>
				</div>
			</div>
		</>
	);
}

export default ProviderProgressBar;
