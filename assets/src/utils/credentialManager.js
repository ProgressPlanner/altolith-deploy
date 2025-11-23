/**
 * Credential Manager
 *
 * Fetches credentials from REST endpoint. No caching.
 * Credentials are decrypted server-side before being sent to the client.
 *
 */

import apiFetch from './api';

/**
 * Fetch credentials for a provider.
 *
 * @param {string} providerId Provider ID (e.g., 'local-filesystem').
 * @return {Promise<Object>} Credentials object.
 */
export async function getCredentials( providerId ) {
	// Fetch from REST endpoint (using /config endpoint) - no caching
	const response = await apiFetch( {
		path: `/aether/site-exporter/providers/${ providerId }/config`,
		method: 'GET',
	} );

	if ( ! response || ! response.success ) {
		throw new Error( response?.error || 'Failed to fetch credentials' );
	}

	return response.config || {};
}
