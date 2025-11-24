/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * aether.providers.register hooks. This replaces the PHP ProviderRegistry.
 *
 */

import { addAction, doAction } from '@wordpress/hooks';

/**
 * Internal registry storage.
 *
 * @type {Map<string, Function>}
 */
const providers = new Map();

/**
 * Provider Registry
 *
 * Singleton registry for managing all JavaScript provider classes.
 */
class ProviderRegistry {
	/**
	 * Register a provider class.
	 *
	 * @param {string}   providerId    Provider ID
	 * @param {Function} ProviderClass Provider class (must have static ID, NAME, etc.)
	 * @return {void}
	 */
	register( providerId, ProviderClass ) {
		if ( ! providerId || typeof providerId !== 'string' ) {
			throw new Error(
				'ProviderRegistry.register() requires a valid provider ID string'
			);
		}

		if ( ! ProviderClass || typeof ProviderClass !== 'function' ) {
			throw new Error(
				'ProviderRegistry.register() requires a provider class'
			);
		}

		// Validate provider has required static properties
		if ( ! ProviderClass.ID ) {
			throw new Error(
				`Provider ${ providerId } must have static ID property`
			);
		}

		if ( ! ProviderClass.NAME ) {
			throw new Error(
				`Provider ${ providerId } must have static NAME property`
			);
		}

		providers.set( providerId, ProviderClass );

		/**
		 * Action fired after a provider is registered.
		 *
		 * @param {string}   providerId    Provider ID
		 * @param {Function} ProviderClass Provider class
		 */
		doAction( 'aether.providers.registered', providerId, ProviderClass );
	}

	/**
	 * Get a provider class by ID.
	 *
	 * @param {string} providerId Provider ID
	 * @return {Function|null} Provider class or null if not found
	 */
	get( providerId ) {
		return providers.get( providerId ) || null;
	}

	/**
	 * Get all registered provider classes.
	 *
	 * @return {Array<Function>} Array of provider classes
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
	 * @return {Array<Function>} Array of provider classes that support the deployment type
	 */
	getByDeploymentType( deploymentType ) {
		return this.getAll().filter( ( ProviderClass ) => {
			return ProviderClass.DEPLOYMENT_TYPE === deploymentType;
		} );
	}

	/**
	 * Get default provider.
	 *
	 * Returns the first provider that supports static_site deployment,
	 * or the first registered provider if none found.
	 *
	 * @return {Function|null} Default provider class or null if none registered
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
	 * @return {Function|null} Provider class or null if not found
	 */
	getForDeploymentType( deploymentType ) {
		const matchingProviders = this.getByDeploymentType( deploymentType );
		return matchingProviders.length > 0 ? matchingProviders[ 0 ] : null;
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
	 * Extracts the provider type from the instance ID and returns the corresponding provider class.
	 *
	 * @param {string} instanceId Instance ID (format: {provider_type}:{uuid})
	 * @return {Function|null} Provider class or null if not found
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
				// eslint-disable-next-line no-bitwise
				const r = ( Math.random() * 16 ) | 0;
				// eslint-disable-next-line no-bitwise
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
 * When providers call doAction('aether.providers.register', ProviderClass),
 * this will automatically register them.
 */
addAction(
	'aether.providers.register',
	'aether/provider-registry',
	( ProviderClass ) => {
		if ( ! ProviderClass || typeof ProviderClass !== 'function' ) {
			return;
		}

		// Get provider ID from static property
		const providerId = ProviderClass.ID;
		if ( ! providerId ) {
			return; // Invalid provider - must have static ID
		}

		// Register the provider class
		registry.register( providerId, ProviderClass );
	}
);

// Make registry globally available so all bundles share the same instance
// This is necessary because webpack creates separate module instances for each bundle
let exportedRegistry = registry;

if ( typeof window !== 'undefined' ) {
	window.aether = window.aether || {};
	// Only create global registry if it doesn't exist (first bundle to load)
	if ( ! window.aether.ProviderRegistry ) {
		window.aether.ProviderRegistry = registry;
		// eslint-disable-next-line no-console
		console.log( 'ProviderRegistry: Created global registry instance' );
	} else {
		// If registry already exists, use the global one and sync providers
		const globalRegistry = window.aether.ProviderRegistry;
		// Copy any providers from this instance to the global one
		const localProviders = Array.from( providers.values() );
		localProviders.forEach( ( ProviderClass ) => {
			const providerId = ProviderClass.ID;
			if ( ! globalRegistry.get( providerId ) ) {
				globalRegistry.register( providerId, ProviderClass );
			}
		} );
		// Use the global registry instead
		exportedRegistry = globalRegistry;
		// eslint-disable-next-line no-console
		console.log(
			'ProviderRegistry: Using global registry instance,',
			globalRegistry.getAll().length,
			'providers registered'
		);
	}
}

export default exportedRegistry;
