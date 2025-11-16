/**
 * Settings Modal Component
 *
 * Modal for provider configuration using @wordpress/components Modal.
 * Uses the new ProviderSettings component for declarative rendering.
 *
 * @package
 */

import {
	useEffect,
	useRef,
	useState,
	createElement,
	render,
	unmountComponentAtNode,
} from '@wordpress/element';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addAction, removeAction } from '@wordpress/hooks';
import { ProviderRegistry } from '../../providers/registry/ProviderRegistry';
import { ProviderSettings } from '../../components/ProviderSettings';

export default function SettingsModal( {
	isOpen,
	onClose,
	providerId,
	title,
} ) {
	const modalContentRef = useRef( null );
	const containerRef = useRef( null );
	const autoCloseTimeoutRef = useRef( null );
	const [ provider, setProvider ] = useState( null );
	const [ providerError, setProviderError ] = useState( null );

	// Get provider instance from registry
	useEffect( () => {
		if ( isOpen && providerId ) {
			const registry = ProviderRegistry.getInstance();
			const providerInstance = registry.getProvider( providerId );

			if ( providerInstance ) {
				setProvider( providerInstance );
				setProviderError( null );
			} else {
				setProvider( null );
				setProviderError(
					__(
						'Provider not found. Please try reloading the page.',
						'aether'
					)
				);
			}
		} else {
			setProvider( null );
			setProviderError( null );
		}
	}, [ isOpen, providerId ] );

	// Cleanup function to clear modal content
	const cleanupModalContent = () => {
		if ( containerRef.current ) {
			unmountComponentAtNode( containerRef.current );
			containerRef.current = null;
		}
		if ( modalContentRef.current ) {
			modalContentRef.current.innerHTML = '';
		}
	};

	useEffect( () => {
		return () => {
			if ( autoCloseTimeoutRef.current ) {
				clearTimeout( autoCloseTimeoutRef.current );
				autoCloseTimeoutRef.current = null;
			}
			cleanupModalContent();
		};
	}, [] );

	// Render provider settings
	useEffect( () => {
		if ( isOpen && provider && modalContentRef.current ) {
			cleanupModalContent();

			const container = document.createElement( 'div' );
			container.className = 'aether-settings-modal__settings-container';
			modalContentRef.current.appendChild( container );
			containerRef.current = container;

			// Check if provider has custom settings rendering
			if ( provider.hasCustomSettings && provider.hasCustomSettings() ) {
				// Use provider's custom renderSettings
				provider.renderSettings( container, () => {
					// Handle save callback - same as onSave below
				} );
			} else {
				// Use declarative ProviderSettings component
				render(
					createElement( ProviderSettings, {
						provider,
						onSave: () => {
							// Config saved successfully
							// The auto-close logic will handle closing the modal
						},
					} ),
					container
				);
			}
		} else if ( ! isOpen ) {
			cleanupModalContent();
		}
	}, [ isOpen, provider ] );

	// Listen for successful save to auto-close modal
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		if ( autoCloseTimeoutRef.current ) {
			clearTimeout( autoCloseTimeoutRef.current );
			autoCloseTimeoutRef.current = null;
		}

		const namespace = `settings-modal-auto-close-${ providerId }`;
		const handleSaveSuccess = ( savedProviderId ) => {
			if ( savedProviderId === providerId ) {
				if ( autoCloseTimeoutRef.current ) {
					clearTimeout( autoCloseTimeoutRef.current );
				}

				autoCloseTimeoutRef.current = setTimeout( () => {
					onClose();
					autoCloseTimeoutRef.current = null;
				}, 3000 );
			}
		};

		addAction(
			'aether.admin.provider.settings.saved',
			namespace,
			handleSaveSuccess
		);

		return () => {
			if ( autoCloseTimeoutRef.current ) {
				clearTimeout( autoCloseTimeoutRef.current );
				autoCloseTimeoutRef.current = null;
			}
			removeAction( 'aether.admin.provider.settings.saved', namespace );
		};
	}, [ isOpen, providerId, onClose ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			className="aether-settings-modal"
			title={ title || __( 'Provider Settings', 'aether' ) }
			onRequestClose={ onClose }
		>
			<div
				className="aether-settings-modal__content"
				ref={ modalContentRef }
			>
				{ ! providerId && (
					<p className="aether-settings-modal__message">
						{ __( 'Please select a provider first.', 'aether' ) }
					</p>
				) }
				{ providerId && providerError && (
					<p className="aether-settings-modal__error">
						{ providerError }
					</p>
				) }
				{ providerId && ! provider && ! providerError && (
					<p className="aether-settings-modal__loading">
						{ __( 'Loading provider settings…', 'aether' ) }
					</p>
				) }
			</div>
		</Modal>
	);
}
