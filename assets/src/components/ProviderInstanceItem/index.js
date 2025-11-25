/**
 * Provider Instance Item Component
 *
 * Displays a single provider instance as a table row.
 * Handles inline name editing, toggle, and settings modal.
 *
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Modal, Icon } from '@wordpress/components';
import { settings, trash, check, close } from '@wordpress/icons';
import ProviderForm from '@aether/components/ProviderForm';
import StatusNotice from '@aether/components/StatusNotice';
import { hasRequiredFields } from '@aether/providers/utils/configValidation';
import {
	colors,
	spacing,
	fontWeight,
	fontSize,
	borderRadius,
	createFlexStyle,
} from '@aether/utils/styles';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';

// Styles - extracted to module level for performance
const tableCellStyle = {
	padding: `${ spacing.md } ${ spacing.lg }`,
	verticalAlign: 'middle',
};

const tableCellStyleWithoutHorizontalBorder = {
	...tableCellStyle,
	borderRightColor: 'transparent',
	borderLeftColor: 'transparent',
	borderTopColor: colors.borderLight,
	borderBottomColor: colors.borderLight,
};

const nameStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	cursor: 'pointer',
	padding: `${ spacing.xs } ${ spacing.sm }`,
	borderRadius: borderRadius.sm,
	transition: 'background-color 0.2s ease',
};

const nameInputStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	padding: `${ spacing.xs } ${ spacing.sm }`,
	border: `2px solid ${ colors.primary }`,
	borderRadius: borderRadius.sm,
	outline: 'none',
	transition: 'border-color 0.2s ease',
	width: '100%',
};

const tagBaseStyle = {
	fontSize: fontSize.xs,
	fontWeight: fontWeight.medium,
	padding: '4px 8px',
	borderRadius: borderRadius.sm,
	color: colors.white,
	display: 'inline-block',
};

/**
 * Get deployment type tag color
 *
 * @param {string|null} deploymentType Deployment type identifier.
 * @return {string} Background color for the tag.
 */
const getDeploymentTypeColor = ( deploymentType ) => {
	switch ( deploymentType ) {
		case DEPLOYMENT_TYPES.STATIC_SITE:
			return colors.deploymentStaticSite;
		case DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE:
			return colors.deploymentBlueprintBundle;
		case DEPLOYMENT_TYPES.EDGE_FUNCTIONS:
			return colors.deploymentEdgeFunctions;
		default:
			return colors.primary;
	}
};

const tableRowStyle = {
	transition: 'background-color 0.2s ease',
	cursor: 'default',
	borderBottom: `1px solid ${ colors.borderLight }`,
};

const actionsCellStyle = {
	...createFlexStyle( 'row', spacing.sm ),
	alignItems: 'center',
};

/**
 * Provider Instance Item Component
 *
 * @param {Object}   props                     Component props.
 * @param {Object}   props.instance            Instance data with instanceId and config.
 * @param {Object}   props.provider            Provider metadata.
 * @param {string}   props.deploymentType      Deployment type identifier.
 * @param {string}   props.deploymentTypeLabel Deployment type label.
 * @param {Function} props.onDelete            Callback to delete instance.
 * @param {Function} props.onRename            Callback to rename instance.
 * @param {Function} props.onSave              Callback to save config changes.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderInstanceItem( {
	instance,
	provider,
	deploymentType,
	deploymentTypeLabel,
	onDelete,
	onRename,
	onSave,
} ) {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editedName, setEditedName ] = useState(
		instance.config.instance_name || ''
	);
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ instanceConfig, setInstanceConfig ] = useState( instance.config );
	const [ saveError, setSaveError ] = useState( null );
	const inputRef = useRef( null );

	// Sync config when instance config changes
	useEffect( () => {
		setInstanceConfig( instance.config );
	}, [ instance.config ] );

	// Focus input when editing starts
	useEffect( () => {
		if ( isEditing && inputRef.current ) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [ isEditing ] );

	const handleNameEdit = () => {
		setEditedName( instanceConfig.instance_name || '' );
		setIsEditing( true );
	};

	const handleNameSave = async () => {
		if ( editedName.trim() === '' ) {
			setEditedName( instanceConfig.instance_name || '' );
			setIsEditing( false );
			return;
		}

		if ( editedName === instanceConfig.instance_name ) {
			setIsEditing( false );
			return;
		}

		try {
			await onRename( instance.instanceId, editedName.trim() );
			setIsEditing( false );
		} catch ( error ) {
			// Error handling is done in parent
			setEditedName( instanceConfig.instance_name || '' );
			setIsEditing( false );
		}
	};

	const handleNameCancel = () => {
		setEditedName( instanceConfig.instance_name || '' );
		setIsEditing( false );
	};

	const handleFormChange = ( fieldId, value ) => {
		setInstanceConfig( ( prev ) => ( {
			...prev,
			[ fieldId ]: value,
		} ) );
	};

	const handleFormSubmit = async ( values ) => {
		setSaveError( null );

		try {
			await onSave( instance.instanceId, values );
			setIsModalOpen( false );
		} catch ( error ) {
			setSaveError(
				error.message ||
					__( 'Failed to save settings', 'aether-site-exporter' )
			);
			throw error;
		}
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
				instanceConfig.instance_name
			)
		);

		if ( confirmed ) {
			onDelete();
		}
	};

	// Get form initial values
	const settingsFields = provider?.settingsFields || [];
	const formInitialValues = settingsFields.reduce( ( acc, field ) => {
		const fieldId = field.id || field.name;
		const value = instanceConfig[ fieldId ];
		if ( value !== undefined && value !== null ) {
			acc[ fieldId ] = value;
		}
		return acc;
	}, {} );

	// Check if all required fields are filled
	const allRequiredFilled = hasRequiredFields(
		instanceConfig,
		settingsFields
	);
	const SettingsIcon = allRequiredFilled ? check : close;
	const settingsIconColor = allRequiredFilled ? colors.success : colors.error;

	const providerType =
		instance.config.provider_type || instance.instanceId.split( ':' )[ 0 ];
	const providerMetadata = provider?.metadata || {};

	return (
		<tr
			style={ tableRowStyle }
			onMouseEnter={ ( e ) => {
				e.currentTarget.style.backgroundColor =
					colors.backgroundLighter;
			} }
			onMouseLeave={ ( e ) => {
				e.currentTarget.style.backgroundColor = 'transparent';
			} }
		>
			{ /* Instance Name */ }
			<td style={ tableCellStyleWithoutHorizontalBorder }>
				{ isEditing ? (
					<input
						ref={ inputRef }
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
						style={ nameStyle }
						onClick={ handleNameEdit }
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' || e.key === ' ' ) {
								handleNameEdit();
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
						{ instanceConfig.instance_name || '' }
					</div>
				) }
			</td>

			{ /* Provider Type */ }
			<td style={ tableCellStyleWithoutHorizontalBorder }>
				{ providerMetadata.name || provider?.id || providerType }
			</td>

			{ /* Deployment Type */ }
			<td style={ tableCellStyleWithoutHorizontalBorder }>
				{ deploymentTypeLabel && (
					<span
						style={ {
							...tagBaseStyle,
							backgroundColor:
								getDeploymentTypeColor( deploymentType ),
						} }
					>
						{ deploymentTypeLabel }
					</span>
				) }
			</td>

			{ /* Settings Status */ }
			<td
				style={ {
					...tableCellStyleWithoutHorizontalBorder,
					textAlign: 'center',
				} }
			>
				<Icon
					icon={ SettingsIcon }
					style={ {
						color: settingsIconColor,
						width: '20px',
						height: '20px',
						verticalAlign: 'middle',
					} }
					aria-label={
						allRequiredFilled
							? __(
									'All required fields filled',
									'aether-site-exporter'
							  )
							: __(
									'Required fields missing',
									'aether-site-exporter'
							  )
					}
				/>
			</td>

			{ /* Actions */ }
			<td style={ tableCellStyle }>
				<div
					style={ {
						...createFlexStyle( 'row', spacing.sm ),
						justifyContent: 'flex-end',
					} }
				>
					<div style={ actionsCellStyle }>
						<Button
							variant="secondary"
							icon={ settings }
							onClick={ () => setIsModalOpen( true ) }
						>
							{ __( 'Settings', 'aether-site-exporter' ) }
						</Button>
						<Button
							variant="secondary"
							isDestructive
							icon={ trash }
							onClick={ handleDelete }
						>
							{ __( 'Delete', 'aether-site-exporter' ) }
						</Button>
					</div>

					{ /* Settings Modal */ }
					{ isModalOpen && (
						<Modal
							className="aether-provider-instance-settings-modal"
							title={ sprintf(
								/* translators: %s: instance name */
								__( 'Settings: %s', 'aether-site-exporter' ),
								instanceConfig.instance_name ||
									__(
										'Provider Instance',
										'aether-site-exporter'
									)
							) }
							onRequestClose={ () => setIsModalOpen( false ) }
							size="medium"
						>
							<div
								style={ {
									...createFlexStyle( 'column', spacing.lg ),
									paddingTop: spacing.md,
								} }
							>
								{ saveError && (
									<StatusNotice
										status="error"
										message={ saveError }
										isDismissible
										onRemove={ () => setSaveError( null ) }
									/>
								) }

								{ settingsFields.length > 0 && (
									<ProviderForm
										providerId={ instance.instanceId }
										fields={ settingsFields }
										initialValues={ formInitialValues }
										onChange={ handleFormChange }
										onSubmit={ handleFormSubmit }
									/>
								) }
							</div>
						</Modal>
					) }
				</div>
			</td>
		</tr>
	);
}
