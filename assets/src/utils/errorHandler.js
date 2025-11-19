/**
 * Global Error Handler
 *
 * Handles unhandled promise rejections and runtime errors globally.
 *
 * @package
 */

import { debugError } from './debug';

/**
 * Initialize global error handlers
 */
export function initializeErrorHandlers() {
	// Handle unhandled promise rejections
	window.addEventListener( 'unhandledrejection', ( event ) => {
		debugError( 'Unhandled promise rejection:', {
			reason: event.reason,
			promise: event.promise,
		} );

		// Prevent default browser behavior (console error)
		event.preventDefault();

		// Show user-friendly error notification
		showErrorNotification(
			'An unexpected error occurred. Please try again or refresh the page.'
		);
	} );

	// Handle uncaught errors
	window.addEventListener( 'error', ( event ) => {
		debugError( 'Uncaught error:', {
			message: event.message,
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			error: event.error,
		} );

		// Don't prevent default for syntax errors - let them show in console
		if ( event.error && event.error.stack ) {
			event.preventDefault();
			showErrorNotification(
				'An unexpected error occurred. Please refresh the page.'
			);
		}
	} );
}

/**
 * Show error notification to user
 *
 * @param {string} message Error message to display
 */
function showErrorNotification( message ) {
	// Use WordPress notices if available
	if ( window.wp && window.wp.data && window.wp.data.dispatch ) {
		const { createErrorNotice } = window.wp.data.dispatch( 'core/notices' );
		if ( createErrorNotice ) {
			createErrorNotice( message, {
				id: 'aether-global-error',
				isDismissible: true,
			} );
			return;
		}
	}

	// Fallback to console error
	console.error( message );
}
