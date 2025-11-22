/**
 * Provider Metadata Utilities
 *
 * Gets provider metadata from JavaScript ProviderRegistry.
 *
 */

import ProviderRegistry from '../registry/ProviderRegistry';

/**
 * Get all provider metadata.
 *
 * @return {Array<Object>} Array of provider metadata objects
 */
export function getProviderMetadata() {
	const providers = ProviderRegistry.getAll();
	return providers.map( ( provider ) => ( {
		id: provider.getId(),
		name: provider.getName(),
		description: provider.getDescription?.() || '',
		type: provider.getType?.() || 'generic',
		deployment_types: provider.getSupportedDeploymentTypes?.() || [],
	} ) );
}

/**
 * Get providers by deployment type.
 *
 * @param {string} deploymentType Deployment type
 * @return {Array<Object>} Array of provider metadata objects
 */
export function getProvidersByDeploymentType( deploymentType ) {
	const providers = ProviderRegistry.getByDeploymentType( deploymentType );
	return providers.map( ( provider ) => ( {
		id: provider.getId(),
		name: provider.getName(),
		description: provider.getDescription?.() || '',
		type: provider.getType?.() || 'generic',
		deployment_types: provider.getSupportedDeploymentTypes?.() || [],
	} ) );
}

/**
 * Get specific provider metadata.
 *
 * @param {string} providerId Provider ID
 * @return {Object|null} Provider metadata or null if not found
 */
export function getProviderById( providerId ) {
	const provider = ProviderRegistry.get( providerId );
	if ( ! provider ) {
		return null;
	}

	return {
		id: provider.getId(),
		name: provider.getName(),
		description: provider.getDescription?.() || '',
		type: provider.getType?.() || 'generic',
		deployment_types: provider.getSupportedDeploymentTypes?.() || [],
	};
}

/**
 * Clear metadata cache.
 *
 * No-op since we're using the registry directly now.
 * Kept for backward compatibility.
 *
 * @return {void}
 */
export function clearMetadataCache() {
	// No-op: metadata comes directly from registry
}
