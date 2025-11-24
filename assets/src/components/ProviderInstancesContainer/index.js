/**
 * Provider Instances Container Component
 *
 * Displays provider instances in a table format.
 * Wraps the table structure and header.
 *
 */

import { __ } from '@wordpress/i18n';
import {
	colors,
	spacing,
	fontWeight,
	fontSize,
	borderRadius,
} from '@aether/utils/styles';
import ProviderInstanceItem from '@aether/components/ProviderInstanceItem';

// Styles - extracted to module level for performance
const tableStyle = {
	width: '100%',
	borderCollapse: 'collapse',
	backgroundColor: colors.white,
	border: `1px solid ${ colors.borderLight }`,
	borderRadius: borderRadius.md,
	overflow: 'hidden',
};

const tableHeaderStyle = {
	backgroundColor: colors.backgroundLighter,
	borderBottom: `2px solid ${ colors.borderLight }`,
};

const tableHeaderCellStyle = {
	padding: spacing.md,
	textAlign: 'left',
	fontWeight: fontWeight.semibold,
	fontSize: fontSize.sm,
	color: colors.text,
};

const tableHeaderCellStyleWithBorder = {
	...tableHeaderCellStyle,
	borderRight: `1px solid ${ colors.borderLight }`,
};

/**
 * Provider Instances Container Component
 *
 * @param {Object}   props           Component props.
 * @param {Array}    props.instances Array of instance objects.
 * @param {Array}    props.providers Array of provider metadata.
 * @param {Function} props.onToggle  Callback to toggle enabled state.
 * @param {Function} props.onDelete  Callback to delete instance.
 * @param {Function} props.onRename  Callback to rename instance.
 * @param {Function} props.onSave    Callback to save config changes.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderInstancesContainer( {
	instances,
	providers,
	onToggle,
	onDelete,
	onRename,
	onSave,
} ) {
	return (
		<table className="aether-provider-instances-table" style={ tableStyle }>
			<thead style={ tableHeaderStyle }>
				<tr>
					<th style={ tableHeaderCellStyleWithBorder }>
						{ __( 'Enabled', 'aether-site-exporter' ) }
					</th>
					<th style={ tableHeaderCellStyleWithBorder }>
						{ __( 'Instance Name', 'aether-site-exporter' ) }
					</th>
					<th style={ tableHeaderCellStyleWithBorder }>
						{ __( 'Provider Type', 'aether-site-exporter' ) }
					</th>
					<th style={ tableHeaderCellStyle }>
						{ __( 'Actions', 'aether-site-exporter' ) }
					</th>
				</tr>
			</thead>
			<tbody>
				{ instances.map( ( instance ) => {
					const providerType =
						instance.config.provider_type ||
						instance.instanceId.split( ':' )[ 0 ];
					const fullProvider = providers.find(
						( p ) => p.id === providerType
					);

					return (
						<ProviderInstanceItem
							key={ instance.instanceId }
							instance={ instance }
							provider={ {
								id: fullProvider?.id || providerType,
								metadata: {
									name: fullProvider?.name || providerType,
									description:
										fullProvider?.description || '',
								},
								settingsFields: (
									fullProvider?.settings_fields || []
								).map( ( field ) => ( {
									...field,
									id: field.id || field.name,
								} ) ),
							} }
							onToggle={ ( enabled ) =>
								onToggle( instance.instanceId, enabled )
							}
							onDelete={ () => onDelete( instance.instanceId ) }
							onRename={ ( instanceId, newName ) =>
								onRename( instanceId, newName )
							}
							onSave={ ( instanceId, updatedConfig ) =>
								onSave( instanceId, updatedConfig )
							}
						/>
					);
				} ) }
			</tbody>
		</table>
	);
}
