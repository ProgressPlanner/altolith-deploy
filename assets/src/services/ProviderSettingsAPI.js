/**
 * Provider Settings API Service
 *
 * Service class for managing provider settings via REST API.
 * Extracted from useProviderSettings hook for testability.
 *
 */

/**
 * Merge provider configurations
 *
 * Pure function for merging provider configs.
 *
 * @param {Object} currentConfig Current provider configuration
 * @param {Object} updatedConfig Updated configuration
 * @return {Object} Merged configuration
 */
export function mergeProviderConfig( currentConfig, updatedConfig ) {
	// Start with existing config to preserve all fields, then overlay updates
	return {
		...( currentConfig || {} ),
		...( updatedConfig || {} ),
	};
}

/**
 * Merge multiple provider updates
 *
 * Pure function for merging multiple provider config updates.
 *
 * @param {Object} currentProviders Current provider configurations
 * @param {Object} updates          Object mapping provider IDs to their updated configs
 * @return {Object} Updated provider configurations
 */
export function mergeMultipleProviders( currentProviders, updates ) {
	if ( ! updates || typeof updates !== 'object' ) {
		return currentProviders || {};
	}

	return {
		...( currentProviders || {} ),
		...Object.entries( updates ).reduce(
			( acc, [ providerId, config ] ) => {
				acc[ providerId ] = {
					...( currentProviders?.[ providerId ] || {} ),
					...( config || {} ),
				};
				return acc;
			},
			{}
		),
	};
}

/**
 * Provider Settings API Service Class
 *
 * Handles all provider settings operations via REST API.
 */
export class ProviderSettingsAPI {
	/**
	 * Create API service instance
	 *
	 * @param {Function} apiFetch WordPress apiFetch function (injectable for testing)
	 */
	constructor( apiFetch ) {
		this.apiFetch = apiFetch;
	}

	/**
	 * Fetch all provider settings
	 *
	 * @return {Promise<Object>} Provider configurations object
	 */
	async fetchAll() {
		const response = await this.apiFetch( {
			path: '/altolith/deploy/settings?key=providers',
		} );

		if ( ! response.success ) {
			throw new Error( 'Failed to load provider settings' );
		}

		return response.value || {};
	}

	/**
	 * Save provider settings
	 *
	 * @param {Object} providers Provider configurations to save
	 * @return {Promise<Object>} Saved provider configurations
	 */
	async save( providers ) {
		const response = await this.apiFetch( {
			path: '/altolith/deploy/settings',
			method: 'POST',
			data: {
				key: 'providers',
				value: providers,
			},
		} );

		if ( ! response.success ) {
			throw new Error( 'Failed to save provider settings' );
		}

		return providers;
	}

	/**
	 * Update a single provider's configuration
	 *
	 * @param {string} providerId    Provider ID
	 * @param {Object} updatedConfig Updated configuration
	 * @return {Promise<Object>} Updated provider configurations
	 */
	async update( providerId, updatedConfig ) {
		// Fetch current settings
		const currentProviders = await this.fetchAll();
		const currentConfig = currentProviders[ providerId ] || {};

		// Merge configurations using pure function
		const mergedConfig = mergeProviderConfig(
			currentConfig,
			updatedConfig
		);

		// Build updated providers object
		const updatedProviders = {
			...currentProviders,
			[ providerId ]: mergedConfig,
		};

		// Save to API
		return await this.save( updatedProviders );
	}

	/**
	 * Update multiple providers at once
	 *
	 * @param {Object} updates Object mapping provider IDs to their updated configs
	 * @return {Promise<Object>} Updated provider configurations
	 */
	async updateMultiple( updates ) {
		// Fetch current settings
		const currentProviders = await this.fetchAll();

		// Merge all updates using pure function
		const updatedProviders = mergeMultipleProviders(
			currentProviders,
			updates
		);

		// Save to API
		return await this.save( updatedProviders );
	}

	/**
	 * Create a new provider instance
	 *
	 * @param {string} instanceId   Client-generated instance ID (provider_type:uuid)
	 * @param {string} providerType Provider type (e.g., 'local-filesystem')
	 * @param {string} instanceName User-friendly instance name
	 * @return {Promise<Object>} Created instance info
	 */
	async createInstance( instanceId, providerType, instanceName ) {
		const response = await this.apiFetch( {
			path: `/altolith/deploy/providers/${ providerType }/instances`,
			method: 'POST',
			data: {
				instance_id: instanceId,
				instance_name: instanceName,
			},
		} );

		if ( ! response.success ) {
			throw new Error( 'Failed to create provider instance' );
		}

		return response;
	}

	/**
	 * Rename a provider instance
	 *
	 * @param {string} instanceId   Instance ID
	 * @param {string} instanceName New instance name
	 * @return {Promise<Object>} Updated provider configurations
	 */
	async renameInstance( instanceId, instanceName ) {
		return await this.update( instanceId, {
			instance_name: instanceName,
		} );
	}

	/**
	 * Delete a provider instance
	 *
	 * @param {string} instanceId Instance ID
	 * @return {Promise<Object>} Updated provider configurations
	 */
	async deleteInstance( instanceId ) {
		// Delete via REST API
		await this.apiFetch( {
			path: `/altolith/deploy/providers/${ instanceId }/config`,
			method: 'DELETE',
		} );

		// Fetch and return updated settings
		return await this.fetchAll();
	}
}
