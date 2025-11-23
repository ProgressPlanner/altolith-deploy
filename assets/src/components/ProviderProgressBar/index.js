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
import './style.scss';

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

	const getStatusClass = () => {
		switch ( status ) {
			case 'complete':
				return 'provider-progress-bar--complete';
			case 'error':
				return 'provider-progress-bar--error';
			case 'active':
				return 'provider-progress-bar--active';
			default:
				return '';
		}
	};

	const statusIcon = getStatusIcon();
	const statusClass = getStatusClass();

	return (
		<div
			className={ `provider-progress-bar ${ statusClass }` }
			data-provider-id={ providerId }
		>
			<div className="provider-progress-bar__header">
				<div className="provider-progress-bar__label">
					{ statusIcon && (
						<span className="provider-progress-bar__status-icon">
							{ statusIcon }
						</span>
					) }
					<strong>{ providerLabel }</strong>
				</div>
				<div className="provider-progress-bar__percentage">
					{ Math.round( progress ) }%
				</div>
			</div>

			{ stepLabel && status === 'active' && (
				<div className="provider-progress-bar__step">{ stepLabel }</div>
			) }

			{ error && status === 'error' && (
				<div className="provider-progress-bar__error">{ error }</div>
			) }

			{ status === 'complete' && (
				<div className="provider-progress-bar__complete-message">
					{ __( 'Complete', 'aether' ) }
				</div>
			) }

			<ProgressBar
				className="provider-progress-bar__progress"
				value={ progress }
			/>
		</div>
	);
}

export default ProviderProgressBar;
