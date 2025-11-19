/**
 * Provider Configuration Modal Component
 *
 * Modal dialog wrapping ProviderForm for configuring a provider.
 *
 * @package
 */

import { useState, useEffect, useRef } from '@wordpress/element';
import { Modal, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ProviderForm from '../../providers/components/ProviderForm';
import apiFetch from '../../utils/api';
import { colors, spacing, fontWeight } from '../../utils/styles';

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

	// Reset config when modal opens/closes or provider changes
	useEffect( () => {
		if ( isOpen ) {
			// Remove deployment_types from config since it's managed in sidebar
			// eslint-disable-next-line camelcase
			const { deployment_types, ...configWithoutDeploymentTypes } =
				initialConfig;
			setConfig( configWithoutDeploymentTypes );
			setHasChanges( false );
			setSaveError( null );
		} else if ( closeTimeoutRef.current ) {
			// Clear timeout if modal is closed
			clearTimeout( closeTimeoutRef.current );
			closeTimeoutRef.current = null;
		}
	}, [ isOpen, initialConfig ] );

	if ( ! provider ) {
		return null;
	}

	const { id, metadata, settingsFields } = provider;
	const { name, description } = metadata;

	// Filter out deployment_types field - it's now managed in the sidebar
	const filteredSettingsFields = settingsFields.filter(
		( field ) => field.name !== 'deployment_types'
	);

	const headerStyle = {
		marginBottom: spacing.md,
	};

	const titleStyle = {
		fontSize: '1.25rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
		margin: 0,
		marginBottom: spacing.xs,
	};

	const descriptionStyle = {
		fontSize: '0.875rem',
		color: colors.textSecondary,
		margin: 0,
	};

	const handleFormChange = ( newValues ) => {
		setConfig( newValues );
		setHasChanges( true );
	};

	const handleFormSubmit = async ( values ) => {
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
			// Preserve deployment_types (managed in sidebar)
			// eslint-disable-next-line camelcase
			const deploymentTypes = currentConfig.deployment_types;

			// Merge form values with enabled state and deployment_types
			const updatedConfig = {
				...values,
				enabled,
				...( deploymentTypes && { deployment_types: deploymentTypes } ),
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

	return (
		<Modal
			title={ name }
			onRequestClose={ handleClose }
			isFullScreen={ false }
			className="aether-provider-config-modal"
		>
			<div style={ headerStyle }>
				<h2 style={ titleStyle }>{ name }</h2>
				{ description && (
					<p style={ descriptionStyle }>{ description }</p>
				) }
			</div>

			{ saveError && (
				<Notice
					status="error"
					isDismissible
					onRemove={ () => setSaveError( null ) }
				>
					{ saveError }
				</Notice>
			) }

			<ProviderForm
				providerId={ id }
				fields={ filteredSettingsFields }
				initialValues={ config }
				onChange={ handleFormChange }
				onSubmit={ handleFormSubmit }
			/>
		</Modal>
	);
}
