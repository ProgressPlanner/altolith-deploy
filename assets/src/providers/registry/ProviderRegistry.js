/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * aether.providers.register hooks. This replaces the PHP ProviderRegistry.
 *
 * @package
 */

import { addAction, doAction } from '@wordpress/hooks';

/**
 * Internal registry storage.
 *
 * @type {Map<string, Object>}
 */
const providers = new Map();

/**
 * Provider Registry
 *
 * Singleton registry for managing all JavaScript provider instances.
 */
class ProviderRegistry {
	/**
	 * Register a provider instance.
	 *
	 * @param {string} providerId Provider ID
	 * @param {Object} provider   Provider instance (must have getId, getName, etc.)
	 * @return {void}
	 */
	register( providerId, provider ) {
		if ( ! providerId || typeof providerId !== 'string' ) {
			throw new Error(
				'ProviderRegistry.register() requires a valid provider ID string'
			);
		}

		if ( ! provider || typeof provider !== 'object' ) {
			throw new Error(
				'ProviderRegistry.register() requires a provider instance'
			);
		}

		// Validate provider has required methods
		if ( typeof provider.getId !== 'function' ) {
			throw new Error(
				`Provider ${ providerId } must implement getId() method`
			);
		}

		if ( typeof provider.getName !== 'function' ) {
			throw new Error(
				`Provider ${ providerId } must implement getName() method`
			);
		}

		providers.set( providerId, provider );

		/**
		 * Action fired after a provider is registered.
		 *
		 * @param {string} providerId Provider ID
		 * @param {Object} provider   Provider instance
		 */
		doAction( 'aether.providers.registered', providerId, provider );
	}

	/**
	 * Get a provider by ID.
	 *
	 * @param {string} providerId Provider ID
	 * @return {Object|null} Provider instance or null if not found
	 */
	get( providerId ) {
		return providers.get( providerId ) || null;
	}

	/**
	 * Get all registered providers.
	 *
	 * @return {Array<Object>} Array of provider instances
	 */
	getAll() {
		return Array.from( providers.values() );
	}

	/**
	 * Get all provider IDs.
	 *
	 * @return {Array<string>} Array of provider IDs
	 */
	getAllIds() {
		return Array.from( providers.keys() );
	}

	/**
	 * Get providers that support a specific deployment type.
	 *
	 * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
	 * @return {Array<Object>} Array of providers that support the deployment type
	 */
	getByDeploymentType( deploymentType ) {
		return this.getAll().filter( ( provider ) => {
			const supportedTypes =
				provider.getSupportedDeploymentTypes?.() || [];
			return supportedTypes.includes( deploymentType );
		} );
	}

	/**
	 * Get default provider.
	 *
	 * Returns the first provider that supports static_site deployment,
	 * or the first registered provider if none found.
	 *
	 * @return {Object|null} Default provider or null if none registered
	 */
	getDefault() {
		const staticSiteProviders = this.getByDeploymentType( 'static_site' );
		if ( staticSiteProviders.length > 0 ) {
			return staticSiteProviders[ 0 ];
		}

		const allProviders = this.getAll();
		return allProviders.length > 0 ? allProviders[ 0 ] : null;
	}

	/**
	 * Get provider for a specific deployment type.
	 *
	 * Returns the first provider that supports the deployment type.
	 *
	 * @param {string} deploymentType Deployment type
	 * @return {Object|null} Provider instance or null if not found
	 */
	getForDeploymentType( deploymentType ) {
		const providers = this.getByDeploymentType( deploymentType );
		return providers.length > 0 ? providers[ 0 ] : null;
	}

	/**
	 * Check if a provider is registered.
	 *
	 * @param {string} providerId Provider ID
	 * @return {boolean} True if registered
	 */
	has( providerId ) {
		return providers.has( providerId );
	}

	/**
	 * Get count of registered providers.
	 *
	 * @return {number} Number of registered providers
	 */
	count() {
		return providers.size;
	}

	/**
	 * Parse instance ID into provider type and UUID.
	 *
	 * Instance IDs have format: {provider_type}:{uuid}
	 * Example: "local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890"
	 *
	 * @param {string} instanceId Instance ID to parse
	 * @return {{provider_type: string, uuid: string}|null} Parsed components or null if invalid format
	 */
	parseInstanceId( instanceId ) {
		if ( ! instanceId || typeof instanceId !== 'string' ) {
			return null;
		}

		const parts = instanceId.split( ':', 2 );
		if ( parts.length !== 2 || ! parts[ 0 ] || ! parts[ 1 ] ) {
			return null;
		}

		return {
			provider_type: parts[ 0 ],
			uuid: parts[ 1 ],
		};
	}

	/**
	 * Get provider class for an instance ID.
	 *
	 * Extracts the provider type from the instance ID and returns the corresponding provider.
	 *
	 * @param {string} instanceId Instance ID (format: {provider_type}:{uuid})
	 * @return {Object|null} Provider instance or null if not found
	 */
	getProviderForInstance( instanceId ) {
		const parsed = this.parseInstanceId( instanceId );
		if ( ! parsed ) {
			return null;
		}

		return this.get( parsed.provider_type );
	}

	/**
	 * Create a new instance ID for a provider type.
	 *
	 * Generates a UUID v4 and combines it with the provider type.
	 *
	 * @param {string} providerType Provider type (e.g., 'local-filesystem')
	 * @return {string} Instance ID (format: {provider_type}:{uuid})
	 */
	createInstanceId( providerType ) {
		// Generate UUID v4
		const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
			/[xy]/g,
			( c ) => {
				const r = ( Math.random() * 16 ) | 0;
				const v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
				return v.toString( 16 );
			}
		);

		return `${ providerType }:${ uuid }`;
	}

	/**
	 * Clear all registered providers.
	 *
	 * Useful for testing or resetting state.
	 *
	 * @return {void}
	 */
	clear() {
		providers.clear();
	}
}

// Create singleton instance
const registry = new ProviderRegistry();

/**
 * Hook into aether.providers.register to auto-register providers.
 *
 * When providers call doAction('aether.providers.register', provider),
 * this will automatically register them.
 */
addAction( 'aether.providers.register', 'aether/provider-registry', ( provider ) => {
	if ( ! provider || typeof provider !== 'object' ) {
		return;
	}

	// Get provider ID
	let providerId;
	if ( typeof provider.getId === 'function' ) {
		providerId = provider.getId();
	} else if ( provider.id ) {
		providerId = provider.id;
	} else {
		return; // Invalid provider
	}

	// Register the provider
	registry.register( providerId, provider );
} );

export default registry;

