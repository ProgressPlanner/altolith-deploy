/**
 * Provider Configuration Modal Component
 *
 * Modal dialog wrapping ProviderForm for configuring a provider.
 *
 * @package
 */

import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { Modal, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
import ProviderForm from '../ProviderForm';
import StatusNotice from '../StatusNotice';
import apiFetch from '../../utils/api';
import { colors, spacing, fontWeight } from '../../utils/styles';
import { DEPLOYMENT_TYPES } from '../../constants/deploymentTypes';

// Styles - extracted to module level for performance
const headerStyle = {
	marginBottom: spacing.md,
};

const descriptionStyle = {
	fontSize: '0.875rem',
	color: colors.textSecondary,
	margin: 0,
};

const sectionTitleStyle = {
	fontSize: '1rem',
	fontWeight: fontWeight.semibold,
	color: colors.text,
	marginTop: spacing.lg,
	marginBottom: spacing.md,
};

const deploymentTypesSectionStyle = {
	padding: spacing.md,
	backgroundColor: colors.surfaceAlt,
	borderRadius: '6px',
	border: `1px solid ${ colors.borderLight }`,
	marginBottom: spacing.lg,
};

const deploymentTypesDescriptionStyle = {
	fontSize: '0.875rem',
	color: colors.textSecondary,
	marginBottom: spacing.md,
};

/**
 * Provider Configuration Modal Component.
 *
 * @param {Object}   props               Component props.
 * @param {boolean}  props.isOpen        Whether modal is open.
 * @param {Function} props.onClose       Close modal handler.
 * @param {Object}   props.provider      Provider metadata.
 * @param {Object}   props.initialConfig Initial configuration values.
 * @param {string}   props.instanceId    Instance ID for saving config.
 * @param {Function} props.onSave        Callback called after successful save with updated config.
 * @return {JSX.Element} Rendered modal component.
 */
export default function ProviderConfigModal( {
	isOpen,
	onClose,
	provider,
	initialConfig = {},
	instanceId,
	onSave,
} ) {
	const [ config, setConfig ] = useState( initialConfig );
	const [ hasChanges, setHasChanges ] = useState( false );
	const [ saveError, setSaveError ] = useState( null );
	const closeTimeoutRef = useRef( null );

	// Refs for hook container elements
	const beforeFormRef = useRef( null );
	const afterFormRef = useRef( null );

	const handleFormChange = useCallback(
		( newValues ) => {
			// Include deployment_types in the merged config
			setConfig( {
				...newValues,
				// eslint-disable-next-line camelcase
				deployment_types: config.deployment_types || [],
			} );
			setHasChanges( true );
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
			setHasChanges( true );
		},
		[]
	);

	// Reset config when modal opens/closes or provider changes
	useEffect( () => {
		if ( ! provider ) {
			return;
		}
		if ( isOpen ) {
			// Keep deployment_types in config for visibility logic, but don't show it in form
			setConfig( initialConfig );
			setHasChanges( false );
			setSaveError( null );
		} else if ( closeTimeoutRef.current ) {
			// Clear timeout if modal is closed
			clearTimeout( closeTimeoutRef.current );
			closeTimeoutRef.current = null;
		}
	}, [ isOpen, initialConfig, provider ] );

	// Trigger hooks when modal is open and config/provider changes
	useEffect( () => {
		if ( ! isOpen || ! provider || ! instanceId ) {
			return;
		}

		const { id } = provider;

		const hookContext = {
			providerId: id, // Provider type
			instanceId, // Instance ID (for instance-specific operations)
			provider,
			config,
			onConfigChange: handleFormChange,
		};

		// Trigger before_form hook
		if ( beforeFormRef.current ) {
			doAction( 'aether.provider.modal.before_form', hookContext );
		}

		// Trigger after_form hook
		if ( afterFormRef.current ) {
			doAction( 'aether.provider.modal.after_form', hookContext );
		}
	}, [ isOpen, provider, config, handleFormChange, instanceId ] );

	const handleFormSubmit = async ( values ) => {
		if ( ! provider || ! instanceId ) {
			return;
		}

		// Use instanceId for saving (not provider.id which is the provider type)
		setSaveError( null );

		try {
			const configResponse = await apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} );

			if ( ! configResponse.success ) {
				throw new Error( 'Failed to load current settings' );
			}

			const providerConfigs = configResponse.value || {};
			const currentConfig = providerConfigs[ instanceId ] || {};
			const enabled = currentConfig.enabled !== false; // Default to enabled

			// Include deployment_types from config state (managed in modal checkboxes)
			const updatedConfig = {
				...values,
				enabled,
				// eslint-disable-next-line camelcase
				deployment_types: config.deployment_types || [],
			};

			// Save with enabled state preserved
			const updatedProviders = {
				...providerConfigs,
				[ instanceId ]: updatedConfig,
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

			setHasChanges( false );

			// Notify parent of successful save with updated config for immediate reactivity
			if ( onSave ) {
				onSave( instanceId, updatedConfig );
			}

			// Close modal after 2 seconds
			closeTimeoutRef.current = setTimeout( () => {
				onClose();
				closeTimeoutRef.current = null;
			}, 2000 );
		} catch ( err ) {
			console.error( 'Failed to save provider config:', err );
			setSaveError(
				err.message ||
					__( 'Failed to save settings', 'aether-site-exporter' )
			);
			// Re-throw error so ProviderForm can also handle it
			throw err;
		}
	};

	const handleClose = () => {
		// Clear any pending timeout
		if ( closeTimeoutRef.current ) {
			clearTimeout( closeTimeoutRef.current );
			closeTimeoutRef.current = null;
		}
		if ( hasChanges ) {
			// Could show a confirmation dialog here
			// For now, just close and discard changes
		}
		setHasChanges( false );
		setSaveError( null );
		onClose();
	};

	if ( ! provider ) {
		return null;
	}

	const { id, metadata, settingsFields } = provider;
	const { name, description } = metadata;

	// Get supported deployment types from provider metadata
	const supportedDeploymentTypes = metadata.supportedDeploymentTypes || [];

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

	return (
		<Modal
			title={ name }
			onRequestClose={ handleClose }
			isFullScreen={ false }
			className="aether-provider-config-modal"
		>
			{ description && (
				<div
					className="aether-provider-config-modal__header"
					style={ headerStyle }
				>
					<p
						className="aether-provider-config-modal__description"
						style={ descriptionStyle }
					>
						{ description }
					</p>
				</div>
			) }

			{ saveError && (
				<StatusNotice
					status="error"
					message={ saveError }
					isDismissible
					onRemove={ () => setSaveError( null ) }
					className="aether-provider-config-modal__notice"
				/>
			) }

			{ /* Deployment Types Section */ }
			{ supportedDeploymentTypes.length > 0 && (
				<div
					className="aether-provider-config-modal__deployment-types"
					style={ deploymentTypesSectionStyle }
				>
					<div
						className="aether-provider-config-modal__deployment-types-title"
						style={ sectionTitleStyle }
					>
						{ __( 'Deployment Types', 'aether-site-exporter' ) }
					</div>
					<p
						className="aether-provider-config-modal__deployment-types-description"
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
							className="aether-provider-config-modal__deployment-type-checkbox"
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
				className="aether-provider-modal__before-form"
				data-provider-id={ id }
				data-instance-id={ instanceId }
			/>

			<ProviderForm
				providerId={ id }
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

			{ /* Hook: after_form */ }
			<div
				ref={ afterFormRef }
				className="aether-provider-modal__after-form"
				data-provider-id={ id }
				data-instance-id={ instanceId }
			/>
		</Modal>
	);
}
