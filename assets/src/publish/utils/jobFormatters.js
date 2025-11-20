/**
 * Job Formatting Utilities
 *
 * Pure functions for formatting job-related data.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

/**
 * Format job timestamp as relative time string.
 *
 * @param {number} timestamp Unix timestamp in seconds
 * @return {string} Formatted relative time string
 */
export function formatJobTime( timestamp ) {
	if ( ! timestamp ) {
		return __( 'Unknown', 'aether-site-exporter' );
	}

	const now = Math.floor( Date.now() / 1000 ); // Current time in seconds
	const diff = now - timestamp;
	const minutes = Math.floor( diff / 60 );
	const hours = Math.floor( diff / 3600 );
	const days = Math.floor( diff / 86400 );

	if ( days > 0 ) {
		return `${ days } ${
			days === 1
				? __( 'day', 'aether-site-exporter' )
				: __( 'days', 'aether-site-exporter' )
		} ${ __( 'ago', 'aether-site-exporter' ) }`;
	}
	if ( hours > 0 ) {
		return `${ hours } ${
			hours === 1
				? __( 'hour', 'aether-site-exporter' )
				: __( 'hours', 'aether-site-exporter' )
		} ${ __( 'ago', 'aether-site-exporter' ) }`;
	}
	if ( minutes > 0 ) {
		return `${ minutes } ${
			minutes === 1
				? __( 'minute', 'aether-site-exporter' )
				: __( 'minutes', 'aether-site-exporter' )
		} ${ __( 'ago', 'aether-site-exporter' ) }`;
	}
	return __( 'Just now', 'aether-site-exporter' );
}

/**
 * Get display configuration for job status.
 *
 * @param {string} status Job status
 * @return {Object} Display configuration with label and class
 */
export function getStatusDisplay( status ) {
	const displays = {
		complete: {
			label: __( 'Completed', 'aether-site-exporter' ),
			class: 'success',
		},
		failed: {
			label: __( 'Failed', 'aether-site-exporter' ),
			class: 'error',
		},
		running: {
			label: __( 'Running', 'aether-site-exporter' ),
			class: 'info',
		},
	};

	return (
		displays[ status ] || {
			label: status.charAt( 0 ).toUpperCase() + status.slice( 1 ),
			class: 'warning',
		}
	);
}
