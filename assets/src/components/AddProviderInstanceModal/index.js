/**
 * Add Provider Instance Modal Component
 *
 * Modal for creating a new provider instance.
 * Shows provider type selector and instance name input.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Modal, TextControl, SelectControl } from '@wordpress/components';
// eslint-disable-next-line import/no-unresolved
import { v4 as uuidv4 } from 'uuid';
import ModalActions from '../ModalActions';
import { spacing } from '../../utils/styles';

// Styles - extracted to module level for performance
const formStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.lg,
};

/**
 * Add Provider Instance Modal Component.
 *
 * @param {Object}   props           Component props.
 * @param {boolean}  props.isOpen    Whether modal is open.
 * @param {Function} props.onClose   Callback to close modal.
 * @param {Array}    props.providers Array of available provider types.
 * @param {Function} props.onCreate  Callback to create instance (instanceId, providerType, instanceName).
 * @return {JSX.Element|null} Rendered component.
 */
export default function AddProviderInstanceModal( {
	isOpen,
	onClose,
	providers,
	onCreate,
} ) {
	const [ selectedProviderType, setSelectedProviderType ] = useState( '' );
	const [ instanceName, setInstanceName ] = useState( '' );
	const [ isCreating, setIsCreating ] = useState( false );

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

	return (
		<Modal
			className="aether-add-provider-instance-modal"
			title={ __( 'Add Provider Instance', 'aether-site-exporter' ) }
			onRequestClose={ handleClose }
			size="medium"
		>
			<div
				className="aether-add-provider-instance-modal__form"
				style={ formStyle }
			>
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
