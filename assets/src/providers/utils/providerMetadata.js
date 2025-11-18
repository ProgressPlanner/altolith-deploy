/**
 * Provider Metadata Utilities
 *
 * Fetches and caches provider metadata from REST API.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * Cache for provider metadata.
 *
 * @type {Object<string, any>|null}
 */
let metadataCache = null;

/**
 * Get all provider metadata.
 *
 * @return {Promise<Array<Object>>} Array of provider metadata objects
 */
export async function getProviderMetadata() {
	if (metadataCache) {
		return metadataCache;
	}

	try {
		const response = await apiFetch({
			path: '/aether/site-exporter/providers',
		});

		if (response.success && response.providers) {
			metadataCache = response.providers;
			return response.providers;
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('[Aether] Failed to fetch provider metadata:', error);
	}

	return [];
}

/**
 * Get providers by deployment type.
 *
 * @param {string} deploymentType Deployment type
 * @return {Promise<Array<Object>>} Array of provider metadata objects
 */
export async function getProvidersByDeploymentType(deploymentType) {
	try {
		const response = await apiFetch({
			path: `/aether/site-exporter/providers/by-deployment-type/${deploymentType}`,
		});

		if (response.success && response.providers) {
			return response.providers;
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(
			`[Aether] Failed to fetch providers for deployment type ${deploymentType}:`,
			error
		);
	}

	return [];
}

/**
 * Get specific provider metadata.
 *
 * @param {string} providerId Provider ID
 * @return {Promise<Object|null>} Provider metadata or null if not found
 */
export async function getProviderById(providerId) {
	try {
		const response = await apiFetch({
			path: `/aether/site-exporter/providers/${providerId}`,
		});

		if (response.success && response.provider) {
			return response.provider;
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(
			`[Aether] Failed to fetch provider ${providerId}:`,
			error
		);
	}

	return null;
}

/**
 * Clear metadata cache.
 *
 * Call this when providers are registered/unregistered.
 *
 * @return {void}
 */
export function clearMetadataCache() {
	metadataCache = null;
}

