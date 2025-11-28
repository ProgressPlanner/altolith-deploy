/**
 * Export Modal Entry Point
 *
 * Self-contained bundle with ExportProgressModal and all dependencies.
 * Loaded dynamically when admin bar export button is clicked.
 *
 */

// Set webpack publicPath before any imports
// Note: Webpack is configured to never create chunks - all code is bundled into single files
/* global __webpack_public_path__ */
/* eslint-disable camelcase */
if ( typeof __webpack_public_path__ !== 'undefined' ) {
	if (
		typeof window !== 'undefined' &&
		window.altolithData &&
		window.altolithData.pluginUrl
	) {
		const pluginUrl = window.altolithData.pluginUrl;
		// Ensure plugin URL ends with slash
		const publicPath = pluginUrl.endsWith( '/' )
			? pluginUrl + 'assets/build/'
			: pluginUrl + '/assets/build/';
		__webpack_public_path__ = publicPath;
	}
}
/* eslint-enable camelcase */

import { render } from '@wordpress/element';
import ExportProgressModal from '../components/ExportProgressModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { ExportProvider } from '../contexts/ExportContext';
import { initializeErrorHandlers } from '../utils/errorHandler';

// Initialize global error handlers
initializeErrorHandlers();

/**
 * Initialize export modal from admin bar
 *
 * @return {void}
 */
function initExportModal() {
	// Create or get root container
	let container = document.getElementById( 'altolith-export-modal-root' );
	if ( ! container ) {
		container = document.createElement( 'div' );
		container.id = 'altolith-export-modal-root';
		document.body.appendChild( container );
	}

	// Handle modal close
	const handleClose = () => {
		const containerEl = document.getElementById(
			'altolith-export-modal-root'
		);
		if ( containerEl ) {
			render( null, containerEl );
		}
		// Reset loading flag after delay to allow modal to close
		setTimeout( () => {
			window.altolithExportLoaded = false;
		}, 300 );
	};

	try {
		render(
			<ErrorBoundary>
				<ExportProvider>
					<ExportProgressModal
						isOpen={ true }
						onClose={ handleClose }
					/>
				</ExportProvider>
			</ErrorBoundary>,
			container
		);
	} catch ( error ) {
		// eslint-disable-line no-console
		console.error( 'Altolith: Error rendering export modal:', error );
	}
}

// Auto-initialize when script loads
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initExportModal );
} else {
	initExportModal();
}
