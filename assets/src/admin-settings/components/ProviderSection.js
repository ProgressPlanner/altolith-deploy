/**
 * Provider Section Component
 *
 * Groups all instances of a single provider type.
 * Shows provider type metadata and lists instance cards.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import ProviderInstanceCard from './ProviderInstanceCard';
import { colors, spacing, fontWeight } from '../../utils/styles';

/**
 * Provider Section Component.
 *
 * @param {Object}   props                      Component props.
 * @param {Object}   props.provider             Provider metadata (from PHP).
 * @param {Array}    props.instances            Array of instance configs for this provider type.
 * @param {Function} props.onCreateInstance     Callback to create new instance.
 * @param {Function} props.onConfigureInstance  Callback to configure instance.
 * @param {Function} props.onToggleInstance     Callback to toggle instance enabled.
 * @param {Function} props.onDeleteInstance     Callback to delete instance.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderSection( {
	provider,
	instances,
	onCreateInstance,
	onConfigureInstance,
	onToggleInstance,
	onDeleteInstance,
} ) {
	const [ isExpanded, setIsExpanded ] = useState( true );

	const sectionStyle = {
		marginBottom: spacing.xl,
		border: `1px solid ${ colors.borderLight }`,
		borderRadius: '8px',
		overflow: 'hidden',
		backgroundColor: colors.surface,
	};

	const headerStyle = {
		padding: spacing.lg,
		backgroundColor: colors.surfaceAlt,
		borderBottom: `1px solid ${ colors.borderLight }`,
		cursor: 'pointer',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	};

	const headerLeftStyle = {
		flex: 1,
	};

	const headerTitleStyle = {
		fontSize: '1.125rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
		marginBottom: spacing.xs,
	};

	const headerDescriptionStyle = {
		fontSize: '0.875rem',
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	};

	const headerMetaStyle = {
		fontSize: '0.75rem',
		color: colors.textTertiary,
	};

	const contentStyle = {
		padding: spacing.lg,
		display: isExpanded ? 'block' : 'none',
	};

	const instancesGridStyle = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
		gap: spacing.md,
		marginBottom: spacing.md,
	};

	const emptyStateStyle = {
		padding: spacing.xl,
		textAlign: 'center',
		color: colors.textSecondary,
		fontSize: '0.875rem',
	};

	const toggleIcon = isExpanded ? '▼' : '▶';

	return (
		<div style={ sectionStyle }>
			<div
				style={ headerStyle }
				onClick={ () => setIsExpanded( ! isExpanded ) }
				onKeyDown={ ( e ) => {
					if ( e.key === 'Enter' || e.key === ' ' ) {
						setIsExpanded( ! isExpanded );
					}
				} }
				role="button"
				tabIndex={ 0 }
			>
				<div style={ headerLeftStyle }>
					<div style={ headerTitleStyle }>
						<span style={ { marginRight: spacing.sm } }>
							{ toggleIcon }
						</span>
						{ provider.name }
					</div>
					<div style={ headerDescriptionStyle }>
						{ provider.description }
					</div>
					<div style={ headerMetaStyle }>
						{ __( 'Instances:', 'aether-site-exporter' ) }{ ' ' }
						{ instances.length } •{ ' ' }
						{ __(
							'Deployment Types:',
							'aether-site-exporter'
						) }{ ' ' }
						{ provider.deployment_types.join( ', ' ) }
					</div>
				</div>
				<Button
					variant="secondary"
					onClick={ ( e ) => {
						e.stopPropagation();
						onCreateInstance( provider.id );
					} }
				>
					{ __( 'Add Instance', 'aether-site-exporter' ) }
				</Button>
			</div>

			<div style={ contentStyle }>
				{ instances.length > 0 ? (
					<div style={ instancesGridStyle }>
						{ instances.map( ( instance ) => (
							<ProviderInstanceCard
								key={ instance.instanceId }
								provider={ provider }
								instance={ instance }
								onConfigure={ () =>
									onConfigureInstance( instance.instanceId )
								}
								onToggle={ ( enabled ) =>
									onToggleInstance(
										instance.instanceId,
										enabled
									)
								}
								onDelete={ () =>
									onDeleteInstance( instance.instanceId )
								}
							/>
						) ) }
					</div>
				) : (
					<div style={ emptyStateStyle }>
						{ __(
							'No instances yet. Click "Add Instance" to create one.',
							'aether-site-exporter'
						) }
					</div>
				) }
			</div>
		</div>
	);
}
