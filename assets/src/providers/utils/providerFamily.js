/**
 * Provider Family Utilities
 *
 * Functions for determining provider compatibility based on family groupings.
 * Provider families share common configuration fields (e.g., cloudflare-r2-static-site
 * and cloudflare-r2-blueprint-bundle both use the same credentials).
 */

/**
 * Known deployment type suffixes that identify variants within a provider family.
 *
 * @type {string[]}
 */
const DEPLOYMENT_SUFFIXES = [
	'-static-site',
	'-blueprint-bundle',
	'-edge-functions',
];

/**
 * Extract provider family from provider type ID.
 *
 * Provider families are determined by removing known deployment type suffixes.
 * Examples:
 * - 'cloudflare-r2-static-site' → 'cloudflare-r2'
 * - 'local-filesystem-blueprint-bundle' → 'local-filesystem'
 * - 'simple-provider' → 'simple-provider' (no suffix, returns as-is)
 *
 * @param {string} providerType Provider type identifier (e.g., 'cloudflare-r2-static-site').
 * @return {string} Provider family (e.g., 'cloudflare-r2').
 */
export function getProviderFamily( providerType ) {
	if ( ! providerType || typeof providerType !== 'string' ) {
		return '';
	}

	for ( const suffix of DEPLOYMENT_SUFFIXES ) {
		if ( providerType.endsWith( suffix ) ) {
			return providerType.slice( 0, -suffix.length );
		}
	}

	return providerType;
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
