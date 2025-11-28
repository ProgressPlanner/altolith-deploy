/**
 * API Fetch Utility
 *
 * Wrapper around @wordpress/api-fetch with:
 * - Nonce handling from window.altolithData
 * - Auth header utilities for external APIs
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * Get REST API base URL from window.altolithData or default.
 *
 * @return {string} REST API base URL (without namespace).
 */
function getRestUrl() {
	if (
		typeof window !== 'undefined' &&
		window.altolithData &&
		window.altolithData.restUrl
	) {
		return window.altolithData.restUrl;
	}
	return '/wp-json/';
}

/**
 * Get REST API nonce from window.altolithData or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
	if (
		typeof window !== 'undefined' &&
		window.altolithData &&
		window.altolithData.nonce
	) {
		return window.altolithData.nonce;
	}
	return '';
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
export function setAPINonce( nonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( nonce ) );
}

/**
 * Configure API fetch with base URL and nonce.
 * Automatically fetches from window.altolithData if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from window.altolithData if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from window.altolithData if not provided).
 */
export function configureAPI( restUrl, nonce ) {
	const url = restUrl || getRestUrl();
	const token = nonce || getNonce();

	apiFetch.use( apiFetch.createRootURLMiddleware( url ) );
	if ( token ) {
		setAPINonce( token );
	}
}

// Auto-configure on module load.
configureAPI();

export default apiFetch;
