/**
 * Provider Instance Table Component
 *
 * Displays provider instances in a table-like layout using CSS Grid.
 * Each provider instance is displayed as a single row with columns.
 *
 * @package
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, ToggleControl, Icon } from '@wordpress/components';
import { cog, trash } from '@wordpress/icons';
import {
	colors,
	spacing,
	fontWeight,
	fontSize,
	borderRadius,
	statusBadgeStyles,
} from '@aether/utils/styles';
import {
	DEPLOYMENT_TYPES,
	DEPLOYMENT_TYPE_LABELS,
} from '@aether/constants/deploymentTypes';

// Grid column template: Instance Name | Provider Type | Deployment Types | Enabled | Configure | Delete
const GRID_TEMPLATE_COLUMNS = '200px auto 1fr auto 40px 40px';

// Styles - extracted to module level for performance
const tableContainerStyle = {
	display: 'grid',
	gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
	border: `1px solid ${ colors.borderLight }`,
	borderRadius: borderRadius.sm,
	overflow: 'hidden',
	background: colors.white,
};

const headerRowStyle = {
	display: 'contents',
};

const headerCellStyle = {
	padding: `${ spacing.md } ${ spacing.lg }`,
	background: colors.background,
	borderBottom: `1px solid ${ colors.borderLight }`,
	fontSize: fontSize.sm,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
};

const dataRowStyle = {
	display: 'contents',
};

const getCellStyle = ( isLastRow ) => ( {
	padding: `${ spacing.md } ${ spacing.lg }`,
	borderBottom: isLastRow ? 'none' : `1px solid ${ colors.borderLighter }`,
	display: 'flex',
	alignItems: 'center',
	minHeight: '48px',
} );

const nameStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	cursor: 'pointer',
	padding: `${ spacing.xs } ${ spacing.sm }`,
	borderRadius: borderRadius.sm,
	transition: 'background-color 0.2s ease',
	flex: 1,
};

const nameInputStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	padding: `${ spacing.xs } ${ spacing.sm }`,
	border: `2px solid ${ colors.primary }`,
	borderRadius: borderRadius.sm,
	flex: 1,
	outline: 'none',
	transition: 'border-color 0.2s ease',
	width: '100%',
};

const providerTypeTagStyle = {
	fontSize: fontSize.xs,
	fontWeight: fontWeight.medium,
	padding: '4px 8px',
	borderRadius: borderRadius.sm,
	backgroundColor: '#000',
	color: '#fff',
	display: 'inline-block',
};

const deploymentTypesContainerStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: spacing.xs,
};

const rowHoverStyle = {
	backgroundColor: colors.backgroundLighter,
};

/**
 * Get color styling for a deployment type tag
 *
 * @param {string} deploymentType Deployment type identifier
 * @return {Object} Style object with backgroundColor and color
 */
const getDeploymentTypeTagStyle = ( deploymentType ) => {
	const baseStyle = {
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		padding: '3px 8px',
		borderRadius: borderRadius.sm,
		display: 'inline-block',
	};

	// Assign different colors based on deployment type using WordPress statusBadgeStyles
	switch ( deploymentType ) {
		case DEPLOYMENT_TYPES.STATIC_SITE:
			return {
				...baseStyle,
				...statusBadgeStyles.success,
			};
		case DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE:
			return {
				...baseStyle,
				...statusBadgeStyles.info,
			};
		case DEPLOYMENT_TYPES.EDGE_FUNCTIONS:
			return {
				...baseStyle,
				...statusBadgeStyles.warning,
			};
		default:
			return {
				...baseStyle,
				backgroundColor: colors.backgroundLighter,
				color: colors.textSecondary,
			};
	}
};

/**
 * Provider Instance Table Row Component
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.provider    Provider metadata.
 * @param {Object}   props.instance    Instance config.
 * @param {boolean}  props.isLast      Whether this is the last row.
 * @param {Function} props.onConfigure Callback to configure instance.
 * @param {Function} props.onToggle    Callback to toggle enabled state.
 * @param {Function} props.onDelete    Callback to delete instance.
 * @param {Function} props.onRename    Callback to rename instance.
 * @return {JSX.Element} Rendered component.
 */
function ProviderInstanceTableRow( {
	provider,
	instance,
	isLast = false,
	onConfigure,
	onToggle,
	onDelete,
	onRename,
} ) {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editedName, setEditedName ] = useState(
		instance.config.instance_name || ''
	);
	const [ isHovered, setIsHovered ] = useState( false );
	const inputRef = useRef( null );

	// Focus input when editing starts
	useEffect( () => {
		if ( isEditing && inputRef.current ) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [ isEditing ] );

	const handleNameSave = async () => {
		if ( editedName.trim() === '' ) {
			setEditedName( instance.config.instance_name || '' );
			setIsEditing( false );
			return;
		}

		// Don't save if name hasn't changed
		if ( editedName === instance.config.instance_name ) {
			setIsEditing( false );
			return;
		}

		// Save the new name via API
		if ( onRename ) {
			try {
				await onRename( instance.instanceId, editedName );
			} catch ( error ) {
				console.error( 'Failed to rename instance:', error );
				// Revert to original name on error
				setEditedName( instance.config.instance_name || '' );
			}
		}
		setIsEditing( false );
	};

	const handleNameCancel = () => {
		setEditedName( instance.config.instance_name || '' );
		setIsEditing( false );
	};

	const handleDelete = () => {
		// eslint-disable-next-line no-alert
		const confirmed = confirm(
			sprintf(
				/* translators: %s: instance name */
				__(
					'Are you sure you want to delete the instance "%s"? This cannot be undone.',
					'aether-site-exporter'
				),
				instance.config.instance_name
			)
		);

		if ( confirmed ) {
			onDelete();
		}
	};

	// Get enabled deployment types from instance config
	const enabledDeploymentTypes = instance?.config?.deployment_types || [];

	const handleCellMouseEnter = () => setIsHovered( true );
	const handleCellMouseLeave = () => setIsHovered( false );

	return (
		<div
			className="aether-provider-instance-table__row"
			style={ dataRowStyle }
		>
			{ /* Instance Name Column */ }
			<div
				className="aether-provider-instance-table__cell aether-provider-instance-table__cell--name"
				style={ {
					...getCellStyle( isLast ),
					...( isHovered ? rowHoverStyle : {} ),
				} }
				onMouseEnter={ handleCellMouseEnter }
				onMouseLeave={ handleCellMouseLeave }
			>
				{ isEditing ? (
					<input
						ref={ inputRef }
						className="aether-provider-instance-table__name-input"
						type="text"
						value={ editedName }
						onChange={ ( e ) => setEditedName( e.target.value ) }
						onBlur={ handleNameSave }
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' ) {
								handleNameSave();
							} else if ( e.key === 'Escape' ) {
								handleNameCancel();
							}
						} }
						style={ nameInputStyle }
					/>
				) : (
					<div
						className="aether-provider-instance-table__name"
						style={ nameStyle }
						onClick={ () => setIsEditing( true ) }
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' || e.key === ' ' ) {
								setIsEditing( true );
							}
						} }
						onMouseEnter={ ( e ) => {
							e.currentTarget.style.backgroundColor =
								colors.backgroundLighter;
						} }
						onMouseLeave={ ( e ) => {
							e.currentTarget.style.backgroundColor =
								'transparent';
						} }
						role="button"
						tabIndex={ 0 }
						title={ __(
							'Click to edit name',
							'aether-site-exporter'
						) }
					>
						{ instance.config.instance_name }
					</div>
				) }
			</div>

			{ /* Provider Type Column */ }
			<div
				className="aether-provider-instance-table__cell aether-provider-instance-table__cell--type"
				style={ {
					...getCellStyle( isLast ),
					...( isHovered ? rowHoverStyle : {} ),
				} }
				onMouseEnter={ handleCellMouseEnter }
				onMouseLeave={ handleCellMouseLeave }
			>
				<span
					className="aether-provider-instance-table__type-tag"
					style={ providerTypeTagStyle }
				>
					{ provider.name }
				</span>
			</div>

			{ /* Deployment Types Column */ }
			<div
				className="aether-provider-instance-table__cell aether-provider-instance-table__cell--deployment-types"
				style={ {
					...getCellStyle( isLast ),
					...( isHovered ? rowHoverStyle : {} ),
				} }
				onMouseEnter={ handleCellMouseEnter }
				onMouseLeave={ handleCellMouseLeave }
			>
				{ enabledDeploymentTypes.length > 0 ? (
					<div
						className="aether-provider-instance-table__deployment-types"
						style={ deploymentTypesContainerStyle }
					>
						{ enabledDeploymentTypes.map( ( deploymentType ) => (
							<span
								key={ deploymentType }
								className={ `aether-provider-instance-table__deployment-type-tag aether-provider-instance-table__deployment-type-tag--${ deploymentType }` }
								style={ getDeploymentTypeTagStyle(
									deploymentType
								) }
							>
								{ DEPLOYMENT_TYPE_LABELS[ deploymentType ] ||
									deploymentType }
							</span>
						) ) }
					</div>
				) : (
					<span
						style={ {
							color: colors.textSecondary,
							fontSize: fontSize.sm,
							fontStyle: 'italic',
						} }
					>
						{ __( 'None', 'aether-site-exporter' ) }
					</span>
				) }
			</div>

			{ /* Enabled Column */ }
			<div
				className="aether-provider-instance-table__cell aether-provider-instance-table__cell--enabled"
				style={ {
					...getCellStyle( isLast ),
					...( isHovered ? rowHoverStyle : {} ),
				} }
				onMouseEnter={ handleCellMouseEnter }
				onMouseLeave={ handleCellMouseLeave }
			>
				<ToggleControl
					className="aether-provider-instance-table__toggle-control"
					label={ __(
						'Enable this instance',
						'aether-site-exporter'
					) }
					checked={ instance.config.enabled !== false }
					onChange={ onToggle }
					__nextHasNoMarginBottom={ true }
				/>
			</div>

			{ /* Configure Column */ }
			<div
				className="aether-provider-instance-table__cell aether-provider-instance-table__cell--configure"
				style={ {
					...getCellStyle( isLast ),
					...( isHovered ? rowHoverStyle : {} ),
				} }
				onMouseEnter={ handleCellMouseEnter }
				onMouseLeave={ handleCellMouseLeave }
			>
				<Button
					className="aether-provider-instance-table__configure-button"
					variant="secondary"
					onClick={ onConfigure }
					size="small"
					icon={ cog }
					label={ __( 'Configure', 'aether-site-exporter' ) }
					showTooltip={ true }
				/>
			</div>

			{ /* Delete Column */ }
			<div
				className="aether-provider-instance-table__cell aether-provider-instance-table__cell--delete"
				style={ {
					...getCellStyle( isLast ),
					...( isHovered ? rowHoverStyle : {} ),
				} }
				onMouseEnter={ handleCellMouseEnter }
				onMouseLeave={ handleCellMouseLeave }
			>
				<Button
					className="aether-provider-instance-table__delete-button"
					variant="secondary"
					isDestructive
					onClick={ handleDelete }
					size="small"
					icon={ trash }
					label={ __(
						'Delete this instance',
						'aether-site-exporter'
					) }
					showTooltip={ true }
				/>
			</div>
		</div>
	);
}

/**
 * Provider Instance Table Component
 *
 * @param {Object}   props             Component props.
 * @param {Array}    props.instances   Array of provider instances with metadata.
 * @param {Function} props.onConfigure Callback to configure instance.
 * @param {Function} props.onToggle    Callback to toggle enabled state.
 * @param {Function} props.onDelete    Callback to delete instance.
 * @param {Function} props.onRename    Callback to rename instance.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderInstanceTable( {
	instances,
	onConfigure,
	onToggle,
	onDelete,
	onRename,
} ) {
	return (
		<div
			className="aether-provider-instance-table"
			style={ tableContainerStyle }
		>
			{ /* Header Row */ }
			<div
				className="aether-provider-instance-table__header-row"
				style={ headerRowStyle }
			>
				<div
					className="aether-provider-instance-table__header-cell aether-provider-instance-table__header-cell--name"
					style={ headerCellStyle }
				>
					{ __( 'Instance Name', 'aether-site-exporter' ) }
				</div>
				<div
					className="aether-provider-instance-table__header-cell aether-provider-instance-table__header-cell--type"
					style={ headerCellStyle }
				>
					{ __( 'Provider Type', 'aether-site-exporter' ) }
				</div>
				<div
					className="aether-provider-instance-table__header-cell aether-provider-instance-table__header-cell--deployment-types"
					style={ headerCellStyle }
				>
					{ __( 'Deployment Types', 'aether-site-exporter' ) }
				</div>
				<div
					className="aether-provider-instance-table__header-cell aether-provider-instance-table__header-cell--enabled"
					style={ headerCellStyle }
				>
					{ __( 'Enabled', 'aether-site-exporter' ) }
				</div>
				<div
					className="aether-provider-instance-table__header-cell aether-provider-instance-table__header-cell--configure"
					style={ {
						...headerCellStyle,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					} }
					title={ __( 'Configure', 'aether-site-exporter' ) }
				>
					<Icon icon={ cog } size={ 20 } />
				</div>
				<div
					className="aether-provider-instance-table__header-cell aether-provider-instance-table__header-cell--delete"
					style={ {
						...headerCellStyle,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					} }
					title={ __( 'Delete', 'aether-site-exporter' ) }
				>
					<Icon icon={ trash } size={ 20 } />
				</div>
			</div>

			{ /* Data Rows */ }
			{ instances.map( ( instance, index ) => (
				<ProviderInstanceTableRow
					key={ instance.instanceId }
					provider={ instance.provider }
					instance={ {
						instanceId: instance.instanceId,
						config: instance.config,
					} }
					isLast={ index === instances.length - 1 }
					onConfigure={ () => onConfigure( instance.instanceId ) }
					onToggle={ ( enabled ) =>
						onToggle( instance.instanceId, enabled )
					}
					onDelete={ () => onDelete( instance.instanceId ) }
					onRename={ onRename }
				/>
			) ) }
		</div>
	);
}
