/**
 * Provider Instance Panel Component
 *
 * Displays provider instances in a collapsible panel layout using WordPress PanelBody.
 * Each provider instance is displayed as a collapsible panel with basic info in the header
 * and settings form (deployment types and provider settings) in the body.
 *
 * @package
 */

import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	ToggleControl,
	PanelBody,
	CheckboxControl,
} from '@wordpress/components';
import { trash } from '@wordpress/icons';
import { doAction } from '@wordpress/hooks';
import ProviderForm from '@aether/components/ProviderForm';
import StatusNotice from '@aether/components/StatusNotice';
import apiFetch from '@aether/utils/api';
import {
	colors,
	spacing,
	fontWeight,
	fontSize,
	borderRadius,
	statusBadgeStyles,
	createFlexStyle,
} from '@aether/utils/styles';
import {
	DEPLOYMENT_TYPES,
	DEPLOYMENT_TYPE_LABELS,
} from '@aether/constants/deploymentTypes';

// Styles for settings form
const deploymentTypesSectionStyle = {
	padding: spacing.md,
	backgroundColor: colors.backgroundLighter,
	borderRadius: borderRadius.sm,
	border: `1px solid ${ colors.borderLight }`,
	marginBottom: spacing.lg,
};

const sectionTitleStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	marginTop: 0,
	marginBottom: spacing.md,
};

const deploymentTypesDescriptionStyle = {
	fontSize: fontSize.sm,
	color: colors.textSecondary,
	marginBottom: spacing.md,
};

const deleteButtonContainerStyle = {
	...createFlexStyle( 'row', spacing.md ),
	justifyContent: 'flex-end',
	marginTop: spacing.lg,
	paddingTop: spacing.lg,
	borderTop: `1px solid ${ colors.borderLight }`,
};

// Styles - extracted to module level for performance
const panelHeaderStyle = {
	...createFlexStyle( 'row', spacing.md ),
	alignItems: 'center',
	flexWrap: 'wrap',
	gap: spacing.md,
	width: '100%',
};

const nameStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	cursor: 'pointer',
	padding: `${ spacing.xs } ${ spacing.sm }`,
	borderRadius: borderRadius.sm,
	transition: 'background-color 0.2s ease',
	flex: '0 1 auto',
	minWidth: '150px',
};

const nameInputStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	padding: `${ spacing.xs } ${ spacing.sm }`,
	border: `2px solid ${ colors.primary }`,
	borderRadius: borderRadius.sm,
	outline: 'none',
	transition: 'border-color 0.2s ease',
	width: '200px',
	flex: '0 0 auto',
};

const providerTypeTagStyle = {
	fontSize: fontSize.xs,
	fontWeight: fontWeight.medium,
	padding: '4px 8px',
	borderRadius: borderRadius.sm,
	backgroundColor: '#000',
	color: '#fff',
	display: 'inline-block',
	flex: '0 0 auto',
};

const deploymentTypesContainerStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: spacing.xs,
	flex: '1 1 auto',
	minWidth: '200px',
};

const toggleContainerStyle = {
	flex: '0 0 auto',
};

const panelBodyContentStyle = {
	...createFlexStyle( 'column', spacing.lg ),
	paddingTop: spacing.md,
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
 * Provider Instance Panel Component
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.provider    Provider metadata with settingsFields.
 * @param {Object}   props.instance    Instance config.
 * @param {Function} props.onToggle    Callback to toggle enabled state.
 * @param {Function} props.onDelete    Callback to delete instance.
 * @param {Function} props.onRename    Callback to rename instance.
 * @param {Function} props.onSave      Callback to save config changes.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderInstancePanel( {
	provider,
	instance,
	onToggle,
	onDelete,
	onRename,
	onSave,
} ) {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editedName, setEditedName ] = useState(
		instance.config.instance_name || ''
	);
	const [ config, setConfig ] = useState( instance.config );
	const [ saveError, setSaveError ] = useState( null );
	const inputRef = useRef( null );
	const beforeFormRef = useRef( null );
	const afterFormRef = useRef( null );

	// Update config when instance config changes
	useEffect( () => {
		setConfig( instance.config );
	}, [ instance.config ] );

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

	// Get provider metadata
	const providerMetadata = provider?.metadata || {};
	const supportedDeploymentTypes =
		providerMetadata.supportedDeploymentTypes || [];
	const settingsFields = provider?.settingsFields || [];

	// Deployment type labels
	const deploymentTypeLabels = {
		[ DEPLOYMENT_TYPES.STATIC_SITE ]: __(
			'Static Site',
			'aether-site-exporter'
		),
		[ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ]: __(
			'Blueprint Bundle',
			'aether-site-exporter'
		),
		[ DEPLOYMENT_TYPES.EDGE_FUNCTIONS ]: __(
			'Edge Functions',
			'aether-site-exporter'
		),
	};

	const handleFormChange = useCallback(
		( newValues ) => {
			// Include deployment_types in the merged config
			setConfig( {
				...newValues,
				// eslint-disable-next-line camelcase
				deployment_types: config.deployment_types || [],
			} );
		},
		[ config.deployment_types ]
	);

	const handleDeploymentTypeToggle = useCallback(
		( deploymentType, checked ) => {
			setConfig( ( prevConfig ) => {
				const currentTypes = prevConfig.deployment_types || [];
				const newTypes = checked
					? [ ...currentTypes, deploymentType ]
					: currentTypes.filter( ( t ) => t !== deploymentType );

				return {
					...prevConfig,
					// eslint-disable-next-line camelcase
					deployment_types: newTypes,
				};
			} );
		},
		[]
	);

	const handleFormSubmit = async ( values ) => {
		if ( ! instance.instanceId ) {
			return;
		}

		setSaveError( null );

		try {
			const configResponse = await apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} );

			if ( ! configResponse.success ) {
				throw new Error(
					__(
						'Failed to load current settings',
						'aether-site-exporter'
					)
				);
			}

			const providerConfigs = configResponse.value || {};
			const currentConfig = providerConfigs[ instance.instanceId ] || {};
			const enabled = currentConfig.enabled !== false; // Default to enabled

			// Include deployment_types from config state
			const updatedConfig = {
				...values,
				enabled,
				// eslint-disable-next-line camelcase
				deployment_types: config.deployment_types || [],
			};

			// Save with enabled state preserved
			const updatedProviders = {
				...providerConfigs,
				[ instance.instanceId ]: updatedConfig,
			};

			const saveResponse = await apiFetch( {
				path: '/aether/site-exporter/settings',
				method: 'POST',
				data: {
					key: 'providers',
					value: updatedProviders,
				},
			} );

			if ( ! saveResponse.success ) {
				throw new Error(
					saveResponse.message || 'Failed to save settings'
				);
			}

			// Notify parent of successful save
			if ( onSave ) {
				onSave( instance.instanceId, updatedConfig );
			}
		} catch ( err ) {
			console.error( 'Failed to save provider config:', err );
			setSaveError(
				err.message ||
					__( 'Failed to save settings', 'aether-site-exporter' )
			);
			throw err;
		}
	};

	// Trigger hooks when panel is open and config/provider changes
	useEffect( () => {
		if ( ! provider || ! instance.instanceId ) {
			return;
		}

		const { id } = provider;

		const hookContext = {
			providerId: id,
			instanceId: instance.instanceId,
			provider,
			config,
			onConfigChange: handleFormChange,
		};

		// Trigger before_form hook
		if ( beforeFormRef.current ) {
			doAction( 'aether.provider.panel.before_form', hookContext );
		}

		// Trigger after_form hook
		if ( afterFormRef.current ) {
			doAction( 'aether.provider.panel.after_form', hookContext );
		}
	}, [ provider, config, handleFormChange, instance.instanceId ] );

	// Custom header content
	const headerContent = (
		<div
			className="aether-provider-instance-panel__header-content"
			style={ panelHeaderStyle }
		>
			{ /* Instance Name */ }
			{ isEditing ? (
				<input
					ref={ inputRef }
					className="aether-provider-instance-panel__name-input"
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
					onClick={ ( e ) => e.stopPropagation() }
				/>
			) : (
				<div
					className="aether-provider-instance-panel__name"
					style={ nameStyle }
					onClick={ ( e ) => {
						e.stopPropagation();
						setIsEditing( true );
					} }
					onKeyDown={ ( e ) => {
						if ( e.key === 'Enter' || e.key === ' ' ) {
							e.stopPropagation();
							setIsEditing( true );
						}
					} }
					onMouseEnter={ ( e ) => {
						e.currentTarget.style.backgroundColor =
							colors.backgroundLighter;
					} }
					onMouseLeave={ ( e ) => {
						e.currentTarget.style.backgroundColor = 'transparent';
					} }
					role="button"
					tabIndex={ 0 }
					title={ __( 'Click to edit name', 'aether-site-exporter' ) }
				>
					{ instance.config.instance_name }
				</div>
			) }

			{ /* Provider Type Tag */ }
			<span
				className="aether-provider-instance-panel__type-tag"
				style={ providerTypeTagStyle }
			>
				{ providerMetadata.name || provider?.id || '' }
			</span>

			{ /* Deployment Types Tags */ }
			{ enabledDeploymentTypes.length > 0 ? (
				<div
					className="aether-provider-instance-panel__deployment-types"
					style={ deploymentTypesContainerStyle }
				>
					{ enabledDeploymentTypes.map( ( deploymentType ) => (
						<span
							key={ deploymentType }
							className={ `aether-provider-instance-panel__deployment-type-tag aether-provider-instance-panel__deployment-type-tag--${ deploymentType }` }
							style={ getDeploymentTypeTagStyle( deploymentType ) }
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
						flex: '1 1 auto',
					} }
				>
					{ __( 'None', 'aether-site-exporter' ) }
				</span>
			) }

			{ /* Enabled Toggle */ }
			<div
				className="aether-provider-instance-panel__toggle"
				style={ toggleContainerStyle }
				onClick={ ( e ) => e.stopPropagation() }
			>
				<ToggleControl
					className="aether-provider-instance-panel__toggle-control"
					label={ __(
						'Enable this instance',
						'aether-site-exporter'
					) }
					checked={ instance.config.enabled !== false }
					onChange={ onToggle }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		</div>
	);

	return (
		<PanelBody
			className="aether-provider-instance-panel"
			title={ headerContent }
			initialOpen={ false }
		>
			<div
				className="aether-provider-instance-panel__body"
				style={ panelBodyContentStyle }
			>
				{ saveError && (
					<StatusNotice
						status="error"
						message={ saveError }
						isDismissible
						onRemove={ () => setSaveError( null ) }
						className="aether-provider-instance-panel__notice"
					/>
				) }

				{ /* Deployment Types Section */ }
				{ supportedDeploymentTypes.length > 0 && (
					<div
						className="aether-provider-instance-panel__deployment-types"
						style={ deploymentTypesSectionStyle }
					>
						<div
							className="aether-provider-instance-panel__deployment-types-title"
							style={ sectionTitleStyle }
						>
							{ __( 'Deployment Types', 'aether-site-exporter' ) }
						</div>
						<p
							className="aether-provider-instance-panel__deployment-types-description"
							style={ deploymentTypesDescriptionStyle }
						>
							{ __(
								'Select which deployment types this provider instance should handle.',
								'aether-site-exporter'
							) }
						</p>
						{ supportedDeploymentTypes.map( ( deploymentType ) => (
							<CheckboxControl
								key={ deploymentType }
								className="aether-provider-instance-panel__deployment-type-checkbox"
								label={ deploymentTypeLabels[ deploymentType ] }
								checked={
									config.deployment_types?.includes(
										deploymentType
									) || false
								}
								onChange={ ( checked ) =>
									handleDeploymentTypeToggle(
										deploymentType,
										checked
									)
								}
							/>
						) ) }
					</div>
				) }

				{ /* Hook: before_form */ }
				<div
					ref={ beforeFormRef }
					className="aether-provider-panel__before-form"
					data-provider-id={ provider?.id }
					data-instance-id={ instance.instanceId }
				/>

				{ /* Provider Settings Form */ }
				{ settingsFields.length > 0 && (
					<ProviderForm
						providerId={ provider?.id }
						fields={ settingsFields }
						initialValues={ {
							...config,
							// Include deployment_types in initialValues for reactive field visibility
							// eslint-disable-next-line camelcase
							deployment_types: config.deployment_types || [],
						} }
						onChange={ handleFormChange }
						onSubmit={ handleFormSubmit }
					/>
				) }

				{ /* Hook: after_form */ }
				<div
					ref={ afterFormRef }
					className="aether-provider-panel__after-form"
					data-provider-id={ provider?.id }
					data-instance-id={ instance.instanceId }
				/>

				{ /* Delete Button */ }
				<div
					className="aether-provider-instance-panel__delete-container"
					style={ deleteButtonContainerStyle }
				>
					<Button
						className="aether-provider-instance-panel__delete-button"
						variant="secondary"
						isDestructive
						onClick={ handleDelete }
						icon={ trash }
					>
						{ __( 'Delete Instance', 'aether-site-exporter' ) }
					</Button>
				</div>
			</div>
		</PanelBody>
	);
}

