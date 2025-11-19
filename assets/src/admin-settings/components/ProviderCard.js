/**
 * Provider Card Component
 *
 * Displays a compact card for a provider with enable/disable toggle,
 * status indicators, and a Configure button that opens the modal.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { Button, ToggleControl } from '@wordpress/components';
import { colors, spacing, fontWeight, borderRadius } from '../../utils/styles';
import { DEPLOYMENT_TYPE_LABELS } from '../../constants/deploymentTypes';

/**
 * Provider Card Component.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.provider    Provider metadata.
 * @param {Object}   props.config      Provider configuration.
 * @param {boolean}  props.enabled     Whether provider is enabled.
 * @param {Function} props.onToggle    Toggle enable/disable handler.
 * @param {Function} props.onConfigure Open configuration modal handler.
 * @return {JSX.Element} Rendered card component.
 */
export default function ProviderCard( {
	provider,
	config = {},
	enabled = false,
	onToggle,
	onConfigure,
} ) {
	const { metadata } = provider;
	const { name, description, supportedDeploymentTypes = [], type } = metadata;

	// Check if provider is configured (has any non-default config values)
	const isConfigured = config && Object.keys( config ).length > 0;

	// Get deployment types from config or use supported types as default
	const deploymentTypes =
		config.deployment_types || supportedDeploymentTypes || [];

	const cardStyle = {
		position: 'relative',
		opacity: enabled ? 1 : 0.6,
		transition: 'opacity 0.2s ease',
	};

	const headerStyle = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: spacing.md,
	};

	const titleStyle = {
		fontSize: '1.125rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
		margin: 0,
		marginBottom: spacing.xs,
	};

	const descriptionStyle = {
		fontSize: '0.875rem',
		color: colors.textSecondary,
		margin: 0,
		marginBottom: spacing.md,
		lineHeight: '1.5',
	};

	const badgeContainerStyle = {
		display: 'flex',
		flexWrap: 'wrap',
		gap: spacing.xs,
		marginBottom: spacing.md,
	};

	const badgeStyle = {
		display: 'inline-block',
		padding: `${ spacing.xs } ${ spacing.sm }`,
		backgroundColor: '#d7edff',
		color: '#135e96',
		borderRadius: borderRadius.sm,
		fontSize: '0.75rem',
		fontWeight: fontWeight.medium,
	};

	const statusBadgeStyle = {
		display: 'inline-block',
		padding: `${ spacing.xs } ${ spacing.sm }`,
		borderRadius: borderRadius.sm,
		fontSize: '0.75rem',
		fontWeight: fontWeight.medium,
		textTransform: 'uppercase',
		letterSpacing: '0.5px',
	};

	const actionsStyle = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	const statusIndicatorStyle = {
		position: 'absolute',
		top: spacing.sm,
		right: spacing.sm,
		width: '8px',
		height: '8px',
		borderRadius: '50%',
		backgroundColor: isConfigured ? colors.success : colors.borderLight,
	};

	const cardContainerStyle = {
		...cardStyle,
		border: `1px solid ${ colors.borderLight }`,
		borderRadius: '4px',
		padding: spacing.lg,
		backgroundColor: colors.white,
	};

	return (
		<div style={ cardContainerStyle }>
			{ /* Status indicator dot */ }
			<div style={ statusIndicatorStyle } />

			<div style={ headerStyle }>
				<div style={ { flex: 1 } }>
					<h3 style={ titleStyle }>{ name }</h3>
					{ description && (
						<p style={ descriptionStyle }>{ description }</p>
					) }
				</div>
			</div>

			{ /* Deployment types badges */ }
			{ deploymentTypes.length > 0 && (
				<div style={ badgeContainerStyle }>
					{ deploymentTypes.map( ( deploymentType ) => (
						<span key={ deploymentType } style={ badgeStyle }>
							{ DEPLOYMENT_TYPE_LABELS[ deploymentType ] ||
								deploymentType }
						</span>
					) ) }
				</div>
			) }

			{ /* Status badges */ }
			<div style={ badgeContainerStyle }>
				<span
					style={ {
						...statusBadgeStyle,
						backgroundColor: isConfigured ? '#d5f0dd' : '#f0f0f1',
						color: isConfigured ? '#00833e' : '#646970',
					} }
				>
					{ isConfigured
						? __( 'Configured', 'aether-site-exporter' )
						: __( 'Not Configured', 'aether-site-exporter' ) }
				</span>
				{ type && (
					<span
						style={ {
							...statusBadgeStyle,
							backgroundColor: '#f0f0f1',
							color: '#646970',
						} }
					>
						{ type }
					</span>
				) }
			</div>

			{ /* Actions */ }
			<div style={ actionsStyle }>
				<ToggleControl
					label={
						enabled
							? __( 'Enabled', 'aether-site-exporter' )
							: __( 'Disabled', 'aether-site-exporter' )
					}
					checked={ enabled }
					onChange={ onToggle }
					__nextHasNoMarginBottom={ true }
				/>
				<Button
					variant="secondary"
					onClick={ onConfigure }
					disabled={ ! enabled }
				>
					{ __( 'Configure', 'aether-site-exporter' ) }
				</Button>
			</div>
		</div>
	);
}
