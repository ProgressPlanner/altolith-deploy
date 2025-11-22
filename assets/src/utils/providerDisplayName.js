/**
 * Provider Display Name Utilities
 *
 * Helper functions to get human-readable names for provider instances.
 *
 */

import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

/**
 * Get display name for a provider instance ID.
 *
 * Instance IDs are in format: `{provider_type}:{uuid}`
 * This function extracts the provider type and gets the provider's display name.
 *
 * @param {string} instanceId Provider instance ID (e.g., 'local-filesystem:123')
 * @return {string} Display name (e.g., 'Local Filesystem') or instance ID if not found
 */
export function getProviderDisplayName( instanceId ) {
	if ( ! instanceId || typeof instanceId !== 'string' ) {
		return 'Unknown Provider';
	}

	// Extract provider type from instance ID
	const providerType = instanceId.split( ':' )[ 0 ];
	if ( ! providerType ) {
		return instanceId;
	}

	// Get provider from registry
	const provider = ProviderRegistry.get( providerType );
	if ( ! provider ) {
		// Fallback: format provider type nicely
		return providerType
			.split( '-' )
			.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
			.join( ' ' );
	}

	return provider.getName();
}

/**
 * Get short display name for a provider instance ID.
 *
 * Returns just the provider type name without the UUID.
 *
 * @param {string} instanceId Provider instance ID (e.g., 'local-filesystem:123')
 * @return {string} Short name (e.g., 'Local Filesystem')
 */
export function getProviderShortName( instanceId ) {
	return getProviderDisplayName( instanceId );
}

/**
 * Get unique identifier from instance ID.
 *
 * Extracts the UUID portion for display (useful when multiple instances of same type).
 *
 * @param {string} instanceId Provider instance ID (e.g., 'local-filesystem:a1b2c3')
 * @return {string} UUID or empty string
 */
export function getProviderInstanceUUID( instanceId ) {
	if ( ! instanceId || typeof instanceId !== 'string' ) {
		return '';
	}

	const parts = instanceId.split( ':' );
	return parts[ 1 ] || '';
}

/**
 * Format provider instance for display.
 *
 * If there's only one instance of this provider type, returns just the name.
 * If there are multiple, includes a shortened UUID for identification.
 *
 * @param {string} instanceId    Provider instance ID
 * @param {Array}  allInstanceIds All provider instance IDs in the workflow
 * @return {string} Formatted display name
 */
export function formatProviderInstanceName( instanceId, allInstanceIds = [] ) {
	const providerName = getProviderDisplayName( instanceId );
	const providerType = instanceId.split( ':' )[ 0 ];

	// Count how many instances of this provider type exist
	const sameTypeCount = allInstanceIds.filter( ( id ) =>
		id.startsWith( `${ providerType }:` )
	).length;

	// If only one instance, just return the provider name
	if ( sameTypeCount <= 1 ) {
		return providerName;
	}

	// Multiple instances: add shortened UUID for identification
	const uuid = getProviderInstanceUUID( instanceId );
	const shortUuid = uuid ? uuid.substring( 0, 8 ) : '';

	return shortUuid ? `${ providerName } (${ shortUuid })` : providerName;
}
