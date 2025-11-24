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
	return providers.map( ( ProviderClass ) => {
		return {
			id: ProviderClass.ID,
			name: ProviderClass.NAME || '',
			description: ProviderClass.DESCRIPTION || '',
			type: ProviderClass.TYPE || 'generic',
		};
	} );
}

/**
 * Get providers by deployment type.
 *
 * @param {string} deploymentType Deployment type
 * @return {Array<Object>} Array of provider metadata objects
 */
export function getProvidersByDeploymentType( deploymentType ) {
	const providers = ProviderRegistry.getByDeploymentType( deploymentType );
	return providers.map( ( ProviderClass ) => {
		return {
			id: ProviderClass.ID,
			name: ProviderClass.NAME || '',
			description: ProviderClass.DESCRIPTION || '',
			type: ProviderClass.TYPE || 'generic',
		};
	} );
}

/**
 * Get specific provider metadata.
 *
 * @param {string} providerId Provider ID
 * @return {Object|null} Provider metadata or null if not found
 */
export function getProviderById( providerId ) {
	const ProviderClass = ProviderRegistry.get( providerId );
	if ( ! ProviderClass ) {
		return null;
	}

	return {
		id: ProviderClass.ID,
		name: ProviderClass.NAME || '',
		description: ProviderClass.DESCRIPTION || '',
		type: ProviderClass.TYPE || 'generic',
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
