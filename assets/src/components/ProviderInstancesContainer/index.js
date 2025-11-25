/**
 * Provider Instances Container Component
 *
 * Displays provider instances in a table format.
 * Wraps the table structure and header.
 *
 */

import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { settings, trash } from '@wordpress/icons';
import {
	colors,
	spacing,
	fontWeight,
	fontSize,
	borderRadius,
	createFlexStyle,
} from '@aether/utils/styles';
import ProviderInstanceItem from '@aether/components/ProviderInstanceItem';
import ProviderForm from '@aether/components/ProviderForm';
import StatusNotice from '@aether/components/StatusNotice';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
import {
	DEPLOYMENT_TYPES,
	DEPLOYMENT_TYPE_LABELS,
} from '@aether/constants/deploymentTypes';

// Styles - extracted to module level for performance
const wrapperStyle = {
	width: '100%',
};

const tableStyle = {
	width: '100%',
	borderCollapse: 'collapse',
	backgroundColor: colors.white,
	border: `1px solid ${ colors.borderLight }`,
	borderRadius: borderRadius.md,
	overflow: 'hidden',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
};

const tableHeaderStyle = {
	backgroundColor: colors.backgroundLighter,
	borderBottom: `2px solid ${ colors.borderLight }`,
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
	borderRight: `1px solid ${ colors.borderLight }`,
};

const mobileCardStyle = {
	backgroundColor: colors.white,
	border: `1px solid ${ colors.borderLight }`,
	borderRadius: borderRadius.md,
	padding: spacing.lg,
	marginBottom: spacing.md,
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
};

const mobileCardRowStyle = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: `${ spacing.sm } 0`,
	borderBottom: `1px solid ${ colors.borderLight }`,
};

const mobileCardRowStyleLast = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: `${ spacing.sm } 0`,
	borderBottom: 'none',
};

const mobileCardLabelStyle = {
	fontWeight: fontWeight.semibold,
	fontSize: fontSize.sm,
	color: colors.textMuted,
	letterSpacing: '0.5px',
	marginRight: spacing.md,
};

const mobileCardValueStyle = {
	flex: 1,
	textAlign: 'right',
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

/**
 * Mobile Card Component for Provider Instance
 *
 * @param {Object}   props                     Component props.
 * @param {Object}   props.instance            Instance data with instanceId and config.
 * @param {Object}   props.provider            Provider metadata.
 * @param {string}   props.providerName        Provider name to display.
 * @param {string}   props.deploymentType      Deployment type identifier.
 * @param {string}   props.deploymentTypeLabel Deployment type label.
 * @param {Function} props.onDelete            Callback to delete instance.
 * @param {Function} props.onRename            Callback to rename instance.
 * @param {Function} props.onSave              Callback to save config changes.
 * @return {JSX.Element} Rendered component.
 */
function MobileInstanceCard( {
	instance,
	provider,
	providerName,
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

	useEffect( () => {
		setInstanceConfig( instance.config );
		setEditedName( instance.config.instance_name || '' );
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

	return (
		<>
			<div style={ mobileCardStyle } role="listitem">
				<div style={ mobileCardRowStyle }>
					<span style={ mobileCardLabelStyle }>
						{ __( 'Instance Name', 'aether-site-exporter' ) }
					</span>
					<span style={ mobileCardValueStyle }>
						{ isEditing ? (
							<input
								ref={ inputRef }
								type="text"
								value={ editedName }
								onChange={ ( e ) =>
									setEditedName( e.target.value )
								}
								onBlur={ handleNameSave }
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' ) {
										handleNameSave();
									} else if ( e.key === 'Escape' ) {
										handleNameCancel();
									}
								} }
								style={ {
									fontSize: fontSize.base,
									fontWeight: fontWeight.semibold,
									padding: `${ spacing.xs } ${ spacing.sm }`,
									border: `2px solid ${ colors.primary }`,
									borderRadius: borderRadius.sm,
									outline: 'none',
									transition: 'border-color 0.2s ease',
									width: '100%',
									textAlign: 'right',
								} }
							/>
						) : (
							<span
								style={ {
									fontSize: fontSize.base,
									fontWeight: fontWeight.semibold,
									color: colors.text,
									cursor: 'pointer',
									padding: `${ spacing.xs } ${ spacing.sm }`,
									borderRadius: borderRadius.sm,
									transition: 'background-color 0.2s ease',
									display: 'inline-block',
								} }
								onClick={ handleNameEdit }
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' || e.key === ' ' ) {
										handleNameEdit();
									}
								} }
								role="button"
								tabIndex={ 0 }
								title={ __(
									'Click to edit name',
									'aether-site-exporter'
								) }
								onMouseEnter={ ( e ) => {
									e.currentTarget.style.backgroundColor =
										colors.backgroundLighter;
								} }
								onMouseLeave={ ( e ) => {
									e.currentTarget.style.backgroundColor =
										'transparent';
								} }
							>
								{ instanceConfig.instance_name || '' }
							</span>
						) }
					</span>
				</div>
				<div style={ mobileCardRowStyle }>
					<span style={ mobileCardLabelStyle }>
						{ __( 'Provider Type', 'aether-site-exporter' ) }
					</span>
					<span style={ mobileCardValueStyle }>
						<span
							style={ {
								fontSize: fontSize.xs,
								fontWeight: fontWeight.medium,
								padding: '4px 8px',
								borderRadius: borderRadius.sm,
								backgroundColor: '#000',
								color: '#fff',
								display: 'inline-block',
							} }
						>
							{ providerName }
						</span>
					</span>
				</div>
				{ deploymentTypeLabel && (
					<div style={ mobileCardRowStyle }>
						<span style={ mobileCardLabelStyle }>
							{ __( 'Deployment Type', 'aether-site-exporter' ) }
						</span>
						<span style={ mobileCardValueStyle }>
							<span
								style={ {
									fontSize: fontSize.xs,
									fontWeight: fontWeight.medium,
									padding: '4px 8px',
									borderRadius: borderRadius.sm,
									backgroundColor:
										getDeploymentTypeColor(
											deploymentType
										),
									color: '#fff',
									display: 'inline-block',
								} }
							>
								{ deploymentTypeLabel }
							</span>
						</span>
					</div>
				) }
				<div style={ mobileCardRowStyleLast }>
					<div
						style={ {
							...createFlexStyle( 'row', spacing.sm ),
							justifyContent: 'flex-end',
							width: '100%',
						} }
					>
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
				</div>
			</div>

			{ isModalOpen && (
				<Modal
					className="aether-provider-instance-settings-modal"
					title={ sprintf(
						/* translators: %s: instance name */
						__( 'Settings: %s', 'aether-site-exporter' ),
						instanceConfig.instance_name ||
							__( 'Provider Instance', 'aether-site-exporter' )
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
								providerId={ provider?.id || providerType }
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
								onClick={ () => setIsModalOpen( false ) }
							>
								{ __( 'Close', 'aether-site-exporter' ) }
							</Button>
						</div>
					</div>
				</Modal>
			) }
		</>
	);
}

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

		// Get deployment type from provider class
		const ProviderClass = ProviderRegistry.get( providerType );
		const deploymentType = ProviderClass?.DEPLOYMENT_TYPE || null;
		const deploymentTypeLabel =
			deploymentType && DEPLOYMENT_TYPE_LABELS[ deploymentType ]
				? DEPLOYMENT_TYPE_LABELS[ deploymentType ]
				: deploymentType || '';

		const providerName =
			fullProvider?.name || fullProvider?.id || providerType;

		return {
			instance,
			providerType,
			fullProvider,
			deploymentType,
			deploymentTypeLabel,
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
		<>
			{ /* Responsive CSS */ }
			<style>
				{ `
					@media (max-width: 767px) {
						.aether-provider-instances-table--desktop {
							display: none !important;
						}
						.aether-provider-instances-table--mobile {
							display: block !important;
						}
					}
					@media (min-width: 768px) {
						.aether-provider-instances-table--mobile {
							display: none !important;
						}
					}
				` }
			</style>

			<div style={ wrapperStyle }>
				{ /* Desktop Table View */ }
				<table
					className="aether-provider-instances-table aether-provider-instances-table--desktop"
					style={ tableStyle }
					role="table"
					aria-label={ __(
						'Provider instances table',
						'aether-site-exporter'
					) }
				>
					<thead style={ tableHeaderStyle }>
						<tr>
							<th style={ tableHeaderCellStyleWithBorder }>
								{ __(
									'Instance Name',
									'aether-site-exporter'
								) }
							</th>
							<th style={ tableHeaderCellStyleWithBorder }>
								{ __(
									'Provider Type',
									'aether-site-exporter'
								) }
							</th>
							<th style={ tableHeaderCellStyleWithBorder }>
								{ __(
									'Deployment Type',
									'aether-site-exporter'
								) }
							</th>
							<th
								style={ {
									...tableHeaderCellStyle,
									textAlign: 'right',
								} }
							>
								{ __( 'Actions', 'aether-site-exporter' ) }
							</th>
						</tr>
					</thead>
					<tbody>
						{ preparedInstances.map(
							( {
								instance,
								providerData,
								deploymentType,
								deploymentTypeLabel,
							} ) => (
								<ProviderInstanceItem
									key={ instance.instanceId }
									instance={ instance }
									provider={ providerData }
									deploymentType={ deploymentType }
									deploymentTypeLabel={ deploymentTypeLabel }
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

				{ /* Mobile Card View */ }
				<div
					className="aether-provider-instances-table--mobile"
					style={ { display: 'none' } }
					role="list"
					aria-label={ __(
						'Provider instances list',
						'aether-site-exporter'
					) }
				>
					{ preparedInstances.map(
						( {
							instance,
							providerData,
							providerName,
							deploymentType,
							deploymentTypeLabel,
						} ) => (
							<MobileInstanceCard
								key={ instance.instanceId }
								instance={ instance }
								provider={ providerData }
								providerName={ providerName }
								deploymentType={ deploymentType }
								deploymentTypeLabel={ deploymentTypeLabel }
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
				</div>
			</div>
		</>
	);
}
