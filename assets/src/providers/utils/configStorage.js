/**
 * Provider Configuration Storage
 *
 * Handles provider configuration persistence with localStorage caching
 * and REST API backend storage.
 *
 * @package
 */

import apiFetch from '../../utils/api';

/**
 * Cache duration in milliseconds (5 minutes).
 */
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Configuration storage class.
 *
 * Provides localStorage caching on top of REST API persistence.
 */
export class ConfigStorage {
	/**
	 * Provider ID.
	 *
	 * @type {string}
	 */
	providerId;

	/**
	 * Cache key for localStorage.
	 *
	 * @type {string}
	 */
	cacheKey;

	/**
	 * Constructor.
	 *
	 * @param {string} providerId Provider ID.
	 */
	constructor( providerId ) {
		if ( ! providerId || typeof providerId !== 'string' ) {
			throw new Error( 'ConfigStorage requires a valid provider ID' );
		}
		this.providerId = providerId;
		this.cacheKey = `aetherProviderConfig${
			providerId.charAt( 0 ).toUpperCase() + providerId.slice( 1 )
		}`;
	}

	/**
	 * Load configuration from cache or REST API.
	 *
	 * Checks localStorage cache first, falls back to REST API if cache is stale or missing.
	 *
	 * @return {Promise<Object>} Configuration object
	 */
	async load() {
		// Try to load from cache first
		const cached = this.getFromCache();
		if ( cached !== null ) {
			return cached;
		}

		// Load from REST API
		try {
			const response = await apiFetch( {
				path: `/aether/site-exporter/providers/${ this.providerId }/config`,
				method: 'GET',
			} );

			const config = response.config || {};

			// Cache the result
			this.saveToCache( config );

			return config;
		} catch ( error ) {
			// If provider not configured, return empty object
			if (
				error.code === 'restProviderNotConfigured' ||
				error.status === 404
			) {
				return {};
			}

			// Re-throw other errors
			throw error;
		}
	}

	/**
	 * Save configuration to REST API and update cache.
	 *
	 * @param {Object} config Configuration object to save.
	 * @return {Promise<boolean>} True if saved successfully
	 */
	async save( config ) {
		try {
			await apiFetch( {
				path: `/aether/site-exporter/providers/${ this.providerId }/config`,
				method: 'POST',
				data: { config },
			} );

			// Update cache
			this.saveToCache( config );

			return true;
		} catch ( error ) {
			throw error;
		}
	}

	/**
	 * Delete configuration from REST API and clear cache.
	 *
	 * @return {Promise<boolean>} True if deleted successfully
	 */
	async delete() {
		try {
			await apiFetch( {
				path: `/aether/site-exporter/providers/${ this.providerId }/config`,
				method: 'DELETE',
			} );

			// Clear cache
			this.clearCache();

			return true;
		} catch ( error ) {
			throw error;
		}
	}

	/**
	 * Get configuration from localStorage cache.
	 *
	 * Returns null if cache is missing or stale.
	 *
	 * @private
	 * @return {Object|null} Cached configuration or null
	 */
	getFromCache() {
		try {
			const cached = localStorage.getItem( this.cacheKey );
			if ( ! cached ) {
				return null;
			}

			const data = JSON.parse( cached );

			// Check if cache is stale
			const now = Date.now();
			if ( now - data.timestamp > CACHE_DURATION ) {
				this.clearCache();
				return null;
			}

			return data.config;
		} catch ( error ) {
			this.clearCache();
			return null;
		}
	}

	/**
	 * Save configuration to localStorage cache.
	 *
	 * @private
	 * @param {Object} config Configuration object.
	 */
	saveToCache( config ) {
		try {
			const data = {
				config,
				timestamp: Date.now(),
			};
			localStorage.setItem( this.cacheKey, JSON.stringify( data ) );
		} catch ( error ) {
			// Failed to save to cache
		}
	}

	/**
	 * Clear configuration from localStorage cache.
	 *
	 * @private
	 */
	clearCache() {
		try {
			localStorage.removeItem( this.cacheKey );
		} catch ( error ) {
			// Failed to clear cache
		}
	}

	/**
	 * Invalidate cache for a specific provider.
	 *
	 * Forces the next load() to fetch from REST API.
	 *
	 * @param {string} providerId Provider ID.
	 */
	static invalidateCache( providerId ) {
		const storage = new ConfigStorage( providerId );
		storage.clearCache();
	}

	/**
	 * Clear all provider configuration caches.
	 *
	 * Useful when logging out or switching users.
	 */
	static clearAllCaches() {
		try {
			// Find all aetherProviderConfig keys
			const keys = [];
			for ( let i = 0; i < localStorage.length; i++ ) {
				const key = localStorage.key( i );
				if ( key && key.startsWith( 'aetherProviderConfig' ) ) {
					keys.push( key );
				}
			}

			// Remove all found keys
			keys.forEach( ( key ) => localStorage.removeItem( key ) );
		} catch ( error ) {
			// Failed to clear all caches
		}
	}
}

export default ConfigStorage;
