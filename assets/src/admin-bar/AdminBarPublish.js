/**
 * Admin Bar Publish Button Handler
 *
 * Handles clicks on the admin bar Publish button and mounts the PublishProgressModal.
 *
 * @package
 */

// Set webpack publicPath before any imports to ensure chunks load correctly
// This must be set before any dynamic imports or chunk loading
// eslint-disable-next-line camelcase, no-undef
if ( typeof __webpack_public_path__ !== 'undefined' ) {
	const pluginUrlMeta = document.querySelector(
		'meta[name="aether-plugin-url"]'
	);
	if ( pluginUrlMeta ) {
		// eslint-disable-next-line camelcase, no-undef
		__webpack_public_path__ =
			pluginUrlMeta.getAttribute( 'content' ) + 'assets/build/';
	}
}

import { render, unmountComponentAtNode } from '@wordpress/element';
import { AdminBarPublishModal } from '../components/AdminBarPublishModal';
import { loadAllProviders } from '../providers/utils/providerLoader';

// Import local-filesystem provider to ensure it's registered
// This is the default/fallback provider and must always be available
import '../providers/local-filesystem/index';

// Load providers dynamically to reduce initial bundle size
// Providers may already be enqueued by PHP, but we call this to ensure they're loaded
loadAllProviders().catch( () => {
	// Provider loading failed, but don't block functionality
	// Providers may already be loaded via PHP enqueuing
} );

/**
 * Initialize admin bar publish functionality.
 */
function initAdminBarPublish() {
	// Find the publish button in the admin bar
	const publishButton = document.querySelector(
		'#wp-admin-bar-aether-publish .ab-item'
	);

	if ( ! publishButton ) {
		// Retry after a short delay in case admin bar hasn't loaded yet
		setTimeout( initAdminBarPublish, 100 );
		return;
	}

	// Check if listener already attached
	if ( publishButton.dataset.aetherListenerAttached === 'true' ) {
		return;
	}

	// Mark as attached to prevent duplicate listeners
	publishButton.dataset.aetherListenerAttached = 'true';

	// Create container for React modal (will be added to body when needed)
	let modalContainer = null;

	// Handle publish button click - use capture phase to ensure we catch it first
	publishButton.addEventListener(
		'click',
		( event ) => {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			// Create container if it doesn't exist
			if ( ! modalContainer ) {
				modalContainer = document.createElement( 'div' );
				modalContainer.id = 'aether-admin-bar-publish-modal';
				modalContainer.className = 'aether-publish-modal-wrapper';
				document.body.appendChild( modalContainer );
			}

			// Unmount function to clean up after modal closes
			const handleUnmount = () => {
				if ( modalContainer ) {
					unmountComponentAtNode( modalContainer );
					modalContainer.remove();
					modalContainer = null;
				}
			};

			// Mount the modal component
			render(
				<AdminBarPublishModal onUnmount={ handleUnmount } />,
				modalContainer
			);
		},
		{ capture: true }
	);
}

// Initialize when DOM is ready
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initAdminBarPublish );
} else {
	// DOM already loaded
	initAdminBarPublish();
}
