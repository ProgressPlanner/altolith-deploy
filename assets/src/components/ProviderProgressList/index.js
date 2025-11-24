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
import { colors, spacing, fontSize, fontWeight } from '@aether/utils/styles';

/**
 * Provider Progress List Component
 *
 * @param {Object} props                   - Component props
 * @param {Object} props.providerProgress  - Provider progress object { [providerId]: { stepId, stepLabel, progress, status, error } }
 * @param {Array}  props.providerInstances - Array of provider instances { id, label, config }
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

	// Container style
	const containerStyle = {
		margin: '20px 0',
	};

	// Header style
	const headerStyle = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.lg,
		paddingBottom: spacing.md,
		borderBottom: `2px solid ${ colors.borderLighter }`,
	};

	// Header h4 style
	const headerTitleStyle = {
		margin: 0,
		fontSize: '15px',
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	// Count badge style
	const countStyle = {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		fontWeight: fontWeight.medium,
		padding: '4px 8px',
		background: colors.background,
		borderRadius: '12px',
	};

	// Items container style
	const itemsStyle = {
		display: 'flex',
		flexDirection: 'column',
		gap: 0,
	};

	return (
		<div style={ containerStyle }>
			<div style={ headerStyle }>
				<h4 style={ headerTitleStyle }>
					{ __( 'Provider Progress', 'aether-site-exporter' ) }
				</h4>
				<span style={ countStyle }>
					{ providerInstances.length } { __( 'providers', 'aether-site-exporter' ) }
				</span>
			</div>

			<div style={ itemsStyle }>
				{ providerInstances.map( ( instance ) => {
					const progress = providerProgress[ instance.id ] || {
						stepId: null,
						stepLabel: __( 'Pending', 'aether-site-exporter' ),
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
