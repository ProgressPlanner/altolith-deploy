/**
 * Provider Progress List Component
 *
 * Displays a list of provider progress bars.
 * Shows progress for each provider instance running in parallel.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import ProviderProgressBar from '../ProviderProgressBar';
import './style.scss';

/**
 * Provider Progress List Component
 *
 * @param {Object} props                    - Component props
 * @param {Object} props.providerProgress   - Provider progress object { [providerId]: { stepId, stepLabel, progress, status, error } }
 * @param {Array}  props.providerInstances  - Array of provider instances { id, label, config }
 * @return {JSX.Element|null} Provider progress list component
 */
export function ProviderProgressList( {
	providerProgress = {},
	providerInstances = [],
} ) {
	// If no provider instances, don't render anything
	if ( providerInstances.length === 0 ) {
		return null;
	}

	// If only one provider, don't show the list (show normal progress instead)
	if ( providerInstances.length === 1 ) {
		return null;
	}

	return (
		<div className="provider-progress-list">
			<div className="provider-progress-list__header">
				<h4>
					{ __( 'Provider Progress', 'aether' ) }
				</h4>
				<span className="provider-progress-list__count">
					{ providerInstances.length } { __( 'providers', 'aether' ) }
				</span>
			</div>

			<div className="provider-progress-list__items">
				{ providerInstances.map( ( instance ) => {
					const progress = providerProgress[ instance.id ] || {
						stepId: null,
						stepLabel: __( 'Pending', 'aether' ),
						progress: 0,
						status: 'pending',
					};

					return (
						<ProviderProgressBar
							key={ instance.id }
							providerId={ instance.id }
							providerLabel={ instance.label || instance.id }
							stepLabel={ progress.stepLabel }
							progress={ progress.progress }
							status={ progress.status }
							error={ progress.error }
						/>
					);
				} ) }
			</div>
		</div>
	);
}

export default ProviderProgressList;
