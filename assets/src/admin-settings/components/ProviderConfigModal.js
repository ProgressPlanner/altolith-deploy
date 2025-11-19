/**
 * Provider Configuration Modal Component
 *
 * Modal dialog wrapping ProviderForm for configuring a provider.
 *
 * @package
 */

import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { Modal, Notice, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
import ProviderForm from '../../providers/components/ProviderForm';
import apiFetch from '../../utils/api';
import { colors, spacing, fontWeight } from '../../utils/styles';
import { DEPLOYMENT_TYPES } from '../../constants/deploymentTypes';

/**
 * Provider Configuration Modal Component.
 *
 * @param {Object}   props               Component props.
 * @param {boolean}  props.isOpen        Whether modal is open.
 * @param {Function} props.onClose       Close modal handler.
 * @param {Object}   props.provider      Provider metadata.
 * @param {Object}   props.initialConfig Initial configuration values.
 * @return {JSX.Element} Rendered modal component.
 */
export default function ProviderConfigModal( {
	isOpen,
	onClose,
	provider,
	initialConfig = {},
} ) {
	const [ config, setConfig ] = useState( initialConfig );
	const [ hasChanges, setHasChanges ] = useState( false );
	const [ saveError, setSaveError ] = useState( null );
	const closeTimeoutRef = useRef( null );

	// Refs for hook container elements
	const beforeFormRef = useRef( null );
	const afterFormRef = useRef( null );

	// Get current deployment types from initialConfig for visibility logic
	// eslint-disable-next-line camelcase
	const currentDeploymentTypes = initialConfig.deployment_types || [];

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
		if ( ! isOpen || ! provider ) {
			return;
		}

		const { id } = provider;

		const hookContext = {
			providerId: id,
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
	}, [ isOpen, provider, config, handleFormChange ] );

	const handleFormSubmit = async ( values ) => {
		if ( ! provider ) {
			return;
		}

		const { id } = provider;

		// ProviderForm handles the save, but we need to preserve the enabled state
		// Get current provider config to preserve enabled state
		setSaveError( null );

		try {
			const configResponse = await apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} );

			if ( ! configResponse.success ) {
				throw new Error( 'Failed to load current settings' );
			}

			const providerConfigs = configResponse.value || {};
			const currentConfig = providerConfigs[ id ] || {};
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
				[ id ]: updatedConfig,
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
			// Close modal after 2 seconds - parent will refresh configs
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
				<div style={ headerStyle }>
					<p style={ descriptionStyle }>{ description }</p>
				</div>
			) }

			{ saveError && (
				<Notice
					status="error"
					isDismissible
					onRemove={ () => setSaveError( null ) }
				>
					{ saveError }
				</Notice>
			) }

			{ /* Deployment Types Section */ }
			{ supportedDeploymentTypes.length > 0 && (
				<div style={ deploymentTypesSectionStyle }>
					<div style={ sectionTitleStyle }>
						{ __( 'Deployment Types', 'aether-site-exporter' ) }
					</div>
					<p
						style={ {
							fontSize: '0.875rem',
							color: colors.textSecondary,
							marginBottom: spacing.md,
						} }
					>
						{ __(
							'Select which deployment types this provider instance should handle.',
							'aether-site-exporter'
						) }
					</p>
					{ supportedDeploymentTypes.map( ( deploymentType ) => (
						<CheckboxControl
							key={ deploymentType }
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
			/>

			<ProviderForm
				providerId={ id }
				fields={ settingsFields }
				initialValues={ {
					...config,
					// Include deployment_types in initialValues for visibility logic
					// eslint-disable-next-line camelcase
					deployment_types: currentDeploymentTypes,
				} }
				onChange={ handleFormChange }
				onSubmit={ handleFormSubmit }
			/>

			{ /* Hook: after_form */ }
			<div
				ref={ afterFormRef }
				className="aether-provider-modal__after-form"
				data-provider-id={ id }
			/>
		</Modal>
	);
}
