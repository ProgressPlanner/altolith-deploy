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
} from '@altolith/utils/styles';
import ProviderInstanceItem from '@altolith/components/ProviderInstanceItem';
import { getEnabledOutputTypes } from '@altolith/utils/outputTypes';

// Styles - extracted to module level for performance
const wrapperStyle = {
	width: '100%',
};

const tableStyle = {
	width: '100%',
	borderCollapse: 'collapse',
	backgroundColor: colors.white,
	borderRadius: borderRadius.md,
	overflow: 'hidden',
	boxShadow: `0 1px 3px ${ colors.shadowLighter }`,
};

const tableHeaderStyle = {
	backgroundColor: colors.backgroundLighter,
};

const tableHeaderCellStyle = {
	padding: `${ spacing.md } ${ spacing.lg }`,
	textAlign: 'left',
	fontWeight: fontWeight.semibold,
	fontSize: fontSize.sm,
	color: colors.text,
	letterSpacing: '0.5px',
};

const tableHeaderCellStyleWithBorder = {
	...tableHeaderCellStyle,
};

/**
 * Provider Instances Container Component
 *
 * @param {Object}   props           Component props.
 * @param {Array}    props.instances Array of instance objects.
 * @param {Array}    props.providers Array of provider metadata.
 * @param {Function} props.onDelete  Callback to delete instance.
 * @param {Function} props.onRename  Callback to rename instance.
 * @param {Function} props.onSave    Callback to save config changes.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderInstancesContainer( {
	instances,
	providers,
	onDelete,
	onRename,
	onSave,
} ) {
	// Prepare instance data once to avoid duplication
	const preparedInstances = instances.map( ( instance ) => {
		const providerType =
			instance.config.provider_type ||
			instance.instanceId.split( ':' )[ 0 ];
		const fullProvider = providers.find( ( p ) => p.id === providerType );

		// Get enabled output types from instance config
		const enabledOutputTypes = getEnabledOutputTypes( instance.config );

		const providerName =
			fullProvider?.name || fullProvider?.id || providerType;

		return {
			instance,
			providerType,
			fullProvider,
			enabledOutputTypes,
			providerName,
			providerData: {
				id: fullProvider?.id || providerType,
				metadata: {
					name: fullProvider?.name || providerType,
					description: fullProvider?.description || '',
				},
				settingsFields: ( fullProvider?.settings_fields || [] ).map(
					( field ) => ( {
						...field,
						id: field.id || field.name,
					} )
				),
			},
		};
	} );

	return (
		<div style={ wrapperStyle }>
			<table
				style={ tableStyle }
				role="table"
				aria-label={ __(
					'Provider instances table',
					'altolith-deploy'
				) }
			>
				<thead style={ tableHeaderStyle }>
					<tr>
						<th style={ tableHeaderCellStyleWithBorder }>
							{ __( 'Instance Name', 'altolith-deploy' ) }
						</th>
						<th style={ tableHeaderCellStyleWithBorder }>
							{ __( 'Provider Type', 'altolith-deploy' ) }
						</th>
						<th style={ tableHeaderCellStyleWithBorder }>
							{ __( 'Output Types', 'altolith-deploy' ) }
						</th>
						<th
							style={ {
								...tableHeaderCellStyleWithBorder,
								textAlign: 'center',
							} }
						>
							{ __( 'Settings', 'altolith-deploy' ) }
						</th>
						<th
							style={ {
								...tableHeaderCellStyle,
								textAlign: 'right',
							} }
						>
							{ __( 'Actions', 'altolith-deploy' ) }
						</th>
					</tr>
				</thead>
				<tbody>
					{ preparedInstances.map(
						( { instance, providerData, enabledOutputTypes } ) => (
							<ProviderInstanceItem
								key={ instance.instanceId }
								instance={ instance }
								provider={ providerData }
								enabledOutputTypes={ enabledOutputTypes }
								allInstances={ instances }
								onDelete={ () =>
									onDelete( instance.instanceId )
								}
								onRename={ ( instanceId, newName ) =>
									onRename( instanceId, newName )
								}
								onSave={ ( instanceId, updatedConfig ) =>
									onSave( instanceId, updatedConfig )
								}
							/>
						)
					) }
				</tbody>
			</table>
		</div>
	);
}
