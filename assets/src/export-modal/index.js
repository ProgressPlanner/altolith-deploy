/**
 * Export Modal Entry Point
 *
 * Self-contained bundle with ExportProgressModal and all dependencies.
 * Loaded dynamically when admin bar export button is clicked.
 *
 * @package
 */

// Set webpack publicPath before any imports
// Note: Webpack is configured to never create chunks - all code is bundled into single files
// eslint-disable-line camelcase, no-undef
if ( typeof __webpack_public_path__ !== 'undefined' ) {
	if (
		typeof window !== 'undefined' &&
		window.aetherData &&
		window.aetherData.pluginUrl
	) {
		const pluginUrl = window.aetherData.pluginUrl;
		// Ensure plugin URL ends with slash
		const publicPath = pluginUrl.endsWith( '/' )
			? pluginUrl + 'assets/build/'
			: pluginUrl + '/assets/build/';
		// eslint-disable-line camelcase, no-undef
		__webpack_public_path__ = publicPath;
	}
}

import { render } from '@wordpress/element';
import ExportProgressModal from '../components/ExportProgressModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { ExportProvider } from '../contexts/ExportContext';
import { initializeErrorHandlers } from '../utils/errorHandler';
import './providers-init'; // Initialize providers

// Initialize global error handlers
initializeErrorHandlers();

/**
 * Initialize export modal from admin bar
 *
 * @return {void}
 */
function initExportModal() {
	// Create or get root container
	let container = document.getElementById( 'aether-export-modal-root' );
	if ( ! container ) {
		container = document.createElement( 'div' );
		container.id = 'aether-export-modal-root';
		document.body.appendChild( container );
	}

	// Handle modal close
	const handleClose = () => {
		const containerEl = document.getElementById(
			'aether-export-modal-root'
		);
		if ( containerEl ) {
			render( null, containerEl );
		}
		// Reset loading flag after delay to allow modal to close
		setTimeout( () => {
			window.aetherExportLoaded = false;
		}, 300 );
	};

	try {
		render(
			<ErrorBoundary>
				<ExportProvider>
					<ExportProgressModal isOpen={ true } onClose={ handleClose } />
				</ExportProvider>
			</ErrorBoundary>,
			container
		);
	} catch ( error ) {
		// eslint-disable-line no-console
		console.error( 'Aether: Error rendering export modal:', error );
	}
}

// Auto-initialize when script loads
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initExportModal );
} else {
	initExportModal();
}

