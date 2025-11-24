/**
 * Add Provider Instance Modal Component
 *
 * Modal for creating a new provider instance.
 * Shows provider type selector and instance name input.
 *
 */

import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Modal, TextControl, SelectControl } from '@wordpress/components';
// eslint-disable-next-line import/no-unresolved
import { v4 as uuidv4 } from 'uuid';
import ModalActions from '../ModalActions';
import { spacing } from '@aether/utils/styles';
import { DEPLOYMENT_TYPE_LABELS } from '@aether/constants/deploymentTypes';

// Styles - extracted to module level for performance
const formStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.lg,
};

/**
 * Add Provider Instance Modal Component.
 *
 * @param {Object}   props             Component props.
 * @param {boolean}  props.isOpen      Whether modal is open.
 * @param {Function} props.onClose     Callback to close modal.
 * @param {Array}    props.providers   Array of available provider types.
 * @param {string}   props.deploymentType Optional deployment type to filter providers.
 * @param {Function} props.onCreate    Callback to create instance (instanceId, providerType, instanceName).
 * @return {JSX.Element|null} Rendered component.
 */
export default function AddProviderInstanceModal( {
	isOpen,
	onClose,
	providers,
	deploymentType = null,
	onCreate,
} ) {
	const [ selectedProviderType, setSelectedProviderType ] = useState( '' );
	const [ instanceName, setInstanceName ] = useState( '' );
	const [ isCreating, setIsCreating ] = useState( false );

	// Reset form when modal closes
	useEffect( () => {
		if ( ! isOpen ) {
			setSelectedProviderType( '' );
			setInstanceName( '' );
		}
	}, [ isOpen ] );

	// Auto-select provider if only one is available for the deployment type
	useEffect( () => {
		if ( isOpen && providers.length === 1 && ! selectedProviderType ) {
			setSelectedProviderType( providers[ 0 ].id );
		} else if ( isOpen && providers.length > 1 && selectedProviderType ) {
			// Reset if providers change and we had a selection
			const stillAvailable = providers.some(
				( p ) => p.id === selectedProviderType
			);
			if ( ! stillAvailable ) {
				setSelectedProviderType( '' );
			}
		}
	}, [ isOpen, providers, selectedProviderType ] );

	const handleCreate = async () => {
		if ( ! selectedProviderType || ! instanceName.trim() ) {
			return;
		}

		// Generate UUID client-side for instant feedback
		const instanceId = `${ selectedProviderType }:${ uuidv4() }`;

		setIsCreating( true );
		try {
			await onCreate(
				instanceId,
				selectedProviderType,
				instanceName.trim()
			);
			// Reset form and close
			setSelectedProviderType( '' );
			setInstanceName( '' );
			onClose();
		} catch ( error ) {
			console.error( 'Failed to create instance:', error );
			// eslint-disable-next-line no-alert
			alert(
				__(
					'Failed to create instance. Please try again.',
					'aether-site-exporter'
				)
			);
		} finally {
			setIsCreating( false );
		}
	};

	const handleClose = () => {
		setSelectedProviderType( '' );
		setInstanceName( '' );
		onClose();
	};

	if ( ! isOpen ) {
		return null;
	}

	const selectedProvider = providers.find(
		( p ) => p.id === selectedProviderType
	);

	// Generate modal title based on deployment type
	const modalTitle = deploymentType
		? sprintf(
				/* translators: %s: deployment type label */
				__( 'Add %s Provider', 'aether-site-exporter' ),
				DEPLOYMENT_TYPE_LABELS[ deploymentType ] || deploymentType
		  )
		: __( 'Add Provider Instance', 'aether-site-exporter' );

	// Always show provider selection if there are any providers
	const showProviderSelection = providers.length > 0;

	return (
		<Modal
			className="aether-add-provider-instance-modal"
			title={ modalTitle }
			onRequestClose={ handleClose }
			size="medium"
		>
			<div
				className="aether-add-provider-instance-modal__form"
				style={ formStyle }
			>
				{ showProviderSelection && (
					<SelectControl
						className="aether-add-provider-instance-modal__provider-select"
						label={ __( 'Provider Type', 'aether-site-exporter' ) }
						value={ selectedProviderType }
						onChange={ setSelectedProviderType }
						options={ [
							{
								label: __(
									'Select a provider…',
									'aether-site-exporter'
								),
								value: '',
							},
							...providers.map( ( provider ) => ( {
								label: provider.name,
								value: provider.id,
							} ) ),
						] }
						help={
							selectedProvider
								? selectedProvider.description
								: __(
										'Choose which type of provider to create',
										'aether-site-exporter'
								  )
						}
					/>
				) }

				{ selectedProviderType && (
					<TextControl
						className="aether-add-provider-instance-modal__instance-name"
						label={ __( 'Instance Name', 'aether-site-exporter' ) }
						value={ instanceName }
						onChange={ setInstanceName }
						placeholder={ sprintf(
							/* translators: %s: provider name */
							__(
								'e.g., "%s Production"',
								'aether-site-exporter'
							),
							selectedProvider?.name || 'My'
						) }
						help={ __(
							'Choose a descriptive name for this instance',
							'aether-site-exporter'
						) }
					/>
				) }

				<ModalActions
					onCancel={ handleClose }
					onSubmit={ handleCreate }
					cancelLabel={ __( 'Cancel', 'aether-site-exporter' ) }
					submitLabel={ __(
						'Create Instance',
						'aether-site-exporter'
					) }
					isSubmitting={ isCreating }
					isSubmitDisabled={
						! selectedProviderType ||
						! instanceName.trim() ||
						isCreating
					}
					className="aether-add-provider-instance-modal__actions"
				/>
			</div>
		</Modal>
	);
}
