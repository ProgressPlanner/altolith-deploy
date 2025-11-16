/**
 * Admin Bar Publish Modal Component
 *
 * Wrapper component that manages the publish modal state when triggered from the admin bar.
 * Handles modal lifecycle, close events, and updates the admin bar "View Static Site" button
 * with deployment URL upon completion.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import PublishProgressModal from '../publish/components/PublishProgressModal';
import { PublishProvider } from '../contexts/PublishContext';

/**
 * Update the admin bar "View Static Site" button with deployment URL.
 *
 * @param {string} deploymentUrl - Deployment URL to set.
 */
function updateViewSiteButton( deploymentUrl ) {
	const viewSiteButton = document.querySelector(
		'#wp-admin-bar-aether-view-site .ab-item'
	);
	if ( ! viewSiteButton ) {
		return;
	}

	if ( deploymentUrl && deploymentUrl !== '#' ) {
		// Enable the button
		viewSiteButton.href = deploymentUrl;
		viewSiteButton.target = '_blank';
		viewSiteButton.rel = 'noopener noreferrer';
		viewSiteButton.title = 'View your deployed static site';

		// Remove disabled class from parent <li> element
		const parentLi = viewSiteButton.closest( 'li' );
		if ( parentLi ) {
			parentLi.classList.remove( 'aether-disabled' );
			// Also remove from class attribute string if present
			const classAttr = parentLi.getAttribute( 'class' );
			if ( classAttr ) {
				parentLi.setAttribute(
					'class',
					classAttr.replace( /\baether-disabled\b/g, '' ).trim()
				);
			}
		}

		// Remove disabled class from link's class attribute if present
		const linkClass = viewSiteButton.getAttribute( 'class' );
		if ( linkClass ) {
			viewSiteButton.setAttribute(
				'class',
				linkClass.replace( /\baether-disabled\b/g, '' ).trim()
			);
		}
	}
}

/**
 * Admin Bar Publish Modal
 *
 * Wrapper component to manage modal state when publish is triggered from the admin bar.
 * Displays the PublishProgressModal and handles cleanup when closed.
 *
 * @param {Object}   props           - Component props
 * @param {Function} props.onUnmount - Callback function to execute when modal is unmounted
 * @return {JSX.Element} PublishProgressModal wrapped with state management
 */
export function AdminBarPublishModal( { onUnmount } ) {
	const [ isOpen, setIsOpen ] = useState( true );

	const handleClose = () => {
		setIsOpen( false );
	};

	const handleComplete = ( finalStatus ) => {
		// Update admin bar button if deployment URL is available
		if ( finalStatus?.deploymentUrl ) {
			updateViewSiteButton( finalStatus.deploymentUrl );
		}
		// Don't set isOpen to false here - let the auto-close timer in PublishProgressModal handle it
	};

	// Cleanup when modal is closed
	useEffect( () => {
		if ( ! isOpen ) {
			// Small delay to allow close animation to complete
			const timer = setTimeout( () => {
				onUnmount();
			}, 300 );
			return () => clearTimeout( timer );
		}
	}, [ isOpen, onUnmount ] );

	return (
		<PublishProvider>
			<PublishProgressModal
				isOpen={ isOpen }
				onClose={ handleClose }
				onComplete={ handleComplete }
			/>
		</PublishProvider>
	);
}
