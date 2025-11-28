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
import { spacing } from '@altolith/utils/styles';
import { getDeploymentTypeLabel } from '@altolith/utils/deploymentTypes';

// Styles - extracted to module level for performance
const formStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.lg,
};

/**
 * Add Provider Instance Modal Component.
 *
 * @param {Object}   props                Component props.
 * @param {boolean}  props.isOpen         Whether modal is open.
 * @param {Function} props.onClose        Callback to close modal.
 * @param {Array}    props.providers      Array of available provider types.
 * @param {string}   props.deploymentType Optional deployment type to filter providers.
 * @param {Function} props.onCreate       Callback to create instance (instanceId, providerType, instanceName).
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
					'altolith-deploy'
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
				__( 'Add %s Provider', 'altolith-deploy' ),
				getDeploymentTypeLabel( deploymentType )
		  )
		: __( 'Add Provider Instance', 'altolith-deploy' );

	// Always show provider selection if there are any providers
	const showProviderSelection = providers.length > 0;

	return (
		<Modal
			className="altolith-add-provider-instance-modal"
			title={ modalTitle }
			onRequestClose={ handleClose }
			size="medium"
		>
			<div
				className="altolith-add-provider-instance-modal__form"
				style={ formStyle }
			>
				{ showProviderSelection && (
					<SelectControl
						className="altolith-add-provider-instance-modal__provider-select"
						label={ __( 'Provider Type', 'altolith-deploy' ) }
						value={ selectedProviderType }
						onChange={ setSelectedProviderType }
						options={ [
							{
								label: __(
									'Select a provider…',
									'altolith-deploy'
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
										'altolith-deploy'
								  )
						}
					/>
				) }

				{ selectedProviderType && (
					<TextControl
						className="altolith-add-provider-instance-modal__instance-name"
						label={ __( 'Instance Name', 'altolith-deploy' ) }
						value={ instanceName }
						onChange={ setInstanceName }
						placeholder={ sprintf(
							/* translators: %s: provider name */
							__( 'e.g., "%s Production"', 'altolith-deploy' ),
							selectedProvider?.name || 'My'
						) }
						help={ __(
							'Choose a descriptive name for this instance',
							'altolith-deploy'
						) }
					/>
				) }

				<ModalActions
					onCancel={ handleClose }
					onSubmit={ handleCreate }
					cancelLabel={ __( 'Cancel', 'altolith-deploy' ) }
					submitLabel={ __( 'Create Instance', 'altolith-deploy' ) }
					isSubmitting={ isCreating }
					isSubmitDisabled={
						! selectedProviderType ||
						! instanceName.trim() ||
						isCreating
					}
					className="altolith-add-provider-instance-modal__actions"
				/>
			</div>
		</Modal>
	);
}
