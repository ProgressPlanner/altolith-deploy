/**
 * Provider Instance Item Component
 *
 * Displays a single provider instance as a table row.
 * Handles inline name editing, toggle, and settings modal.
 *
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { settings, trash } from '@wordpress/icons';
import ProviderForm from '@aether/components/ProviderForm';
import StatusNotice from '@aether/components/StatusNotice';
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
	borderBottom: `1px solid ${ colors.borderLight }`,
	verticalAlign: 'middle',
};

const tableCellStyleWithBorder = {
	...tableCellStyle,
	borderRight: `1px solid ${ colors.borderLight }`,
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
	color: '#fff',
	display: 'inline-block',
};

const providerTypeTagStyle = {
	...tagBaseStyle,
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
			return '#2271b1'; // Blue
		case DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE:
			return '#00a32a'; // Green
		case DEPLOYMENT_TYPES.EDGE_FUNCTIONS:
			return '#986800'; // Orange/Brown
		default:
			return colors.primary;
	}
};

const tableRowStyle = {
	transition: 'background-color 0.2s ease',
	cursor: 'default',
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
			<td style={ tableCellStyleWithBorder }>
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
			<td style={ tableCellStyleWithBorder }>
				<span style={ providerTypeTagStyle }>
					{ providerMetadata.name || provider?.id || providerType }
				</span>
			</td>

			{ /* Deployment Type */ }
			<td style={ tableCellStyleWithBorder }>
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
										providerId={
											provider?.id || providerType
										}
										fields={ settingsFields }
										initialValues={ formInitialValues }
										onChange={ handleFormChange }
										onSubmit={ handleFormSubmit }
									/>
								) }

								<div
									style={ {
										...createFlexStyle( 'row', spacing.sm ),
										justifyContent: 'flex-end',
										marginTop: spacing.md,
										paddingTop: spacing.md,
										borderTop: `1px solid ${ colors.borderLight }`,
									} }
								>
									<Button
										variant="secondary"
										onClick={ () =>
											setIsModalOpen( false )
										}
									>
										{ __(
											'Close',
											'aether-site-exporter'
										) }
									</Button>
								</div>
							</div>
						</Modal>
					) }
				</div>
			</td>
		</tr>
	);
}
