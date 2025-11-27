/**
 * Provider Family Utilities
 *
 * Functions for determining provider compatibility based on family groupings.
 * Provider families share common configuration fields (e.g., cloudflare-r2-static-site
 * and cloudflare-r2-media-offload both use the same R2 credentials).
 *
 * Family is determined by the static FAMILY property on provider classes.
 */

import ProviderRegistry from '../registry/ProviderRegistry';

/**
 * Extract provider family from provider type ID or provider class.
 *
 * Provider families are determined by the static FAMILY property on provider classes.
 * If a provider class is passed directly, reads FAMILY from it.
 * If a string (provider type ID) is passed, looks up the class from the registry.
 * Falls back to the provider type ID if no FAMILY is defined.
 *
 * Examples:
 * - CloudflareR2StaticSiteProvider (with FAMILY = 'cloudflare-r2') → 'cloudflare-r2'
 * - 'cloudflare-r2-static-site' (looked up, has FAMILY) → 'cloudflare-r2'
 * - 'unknown-provider' (no FAMILY defined) → 'unknown-provider'
 *
 * @param {string|Function} providerTypeOrClass Provider type ID or provider class.
 * @return {string} Provider family.
 */
export function getProviderFamily( providerTypeOrClass ) {
	// If it's a provider class with FAMILY property, use it directly.
	if (
		typeof providerTypeOrClass === 'function' &&
		providerTypeOrClass.FAMILY
	) {
		return providerTypeOrClass.FAMILY;
	}

	// If it's a string (provider type ID), look up the class from registry.
	if ( typeof providerTypeOrClass === 'string' ) {
		const ProviderClass = ProviderRegistry.get( providerTypeOrClass );
		if ( ProviderClass?.FAMILY ) {
			return ProviderClass.FAMILY;
		}
		// Fallback: use ID as family (for providers without FAMILY property).
		return providerTypeOrClass;
	}

	return '';
}

/**
 * Get instances compatible with target for config copying.
 *
 * Returns instances that:
 * 1. Belong to the same provider family as the target
 * 2. Are not the target instance itself
 *
 * @param {string} targetInstanceId Target instance ID (format: provider_type:uuid).
 * @param {Array}  allInstances     Array of all instance objects with { instanceId, config }.
 * @return {Array} Array of compatible instances.
 */
export function getCompatibleInstances( targetInstanceId, allInstances ) {
	if ( ! targetInstanceId || ! Array.isArray( allInstances ) ) {
		return [];
	}

	const targetProviderType = targetInstanceId.split( ':' )[ 0 ];
	const targetFamily = getProviderFamily( targetProviderType );

	if ( ! targetFamily ) {
		return [];
	}

	return allInstances.filter( ( inst ) => {
		// Skip instances without valid instance IDs.
		if ( ! inst.instanceId || typeof inst.instanceId !== 'string' ) {
			return false;
		}

		// Exclude the target instance itself.
		if ( inst.instanceId === targetInstanceId ) {
			return false;
		}

		// Get provider type from config or instance ID.
		const instProviderType =
			inst.config?.provider_type || inst.instanceId.split( ':' )[ 0 ];

		if ( ! instProviderType ) {
			return false;
		}

		// Check if same family.
		return getProviderFamily( instProviderType ) === targetFamily;
	} );
}

/**
 * Check if two provider types belong to the same family.
 *
 * @param {string} providerType1 First provider type.
 * @param {string} providerType2 Second provider type.
 * @return {boolean} True if same family, false otherwise.
 */
export function isSameProviderFamily( providerType1, providerType2 ) {
	return (
		getProviderFamily( providerType1 ) ===
		getProviderFamily( providerType2 )
	);
}
