/**
 * Profile Registry
 *
 * Manages profile instances - the actual saved profiles that contain
 * user data (e.g., specific Cloudflare account credentials).
 *
 * Profile instances are stored in the database via REST API and cached
 * locally for quick access. This registry handles CRUD operations and
 * tracks which provider instances reference each profile.
 */

import apiFetch from '@wordpress/api-fetch';
import { doAction } from '@wordpress/hooks';

/**
 * Local cache of profile instances.
 *
 * @type {Map<string, Object>}
 */
const profiles = new Map();

/**
 * Flag indicating if profiles have been loaded from server.
 *
 * @type {boolean}
 */
let loaded = false;

/**
 * Promise for ongoing load operation (prevents duplicate fetches).
 *
 * @type {Promise|null}
 */
let loadPromise = null;

/**
 * Profile Registry
 *
 * Singleton registry for managing profile instances.
 * Handles CRUD operations via REST API and local caching.
 */
class ProfileRegistry {
	/**
	 * Load all profiles from the server.
	 *
	 * @param {boolean} forceRefresh Force reload even if already loaded
	 * @return {Promise<Array<Object>>} Array of profile objects
	 */
	async loadAll( forceRefresh = false ) {
		// Return cached data if already loaded and not forcing refresh
		if ( loaded && ! forceRefresh ) {
			return this.getAll();
		}

		// Return existing promise if load is in progress
		if ( loadPromise ) {
			return loadPromise;
		}

		// Start new load operation
		loadPromise = this._fetchProfiles();

		try {
			const result = await loadPromise;
			return result;
		} finally {
			loadPromise = null;
		}
	}

	/**
	 * Internal method to fetch profiles from server.
	 *
	 * @return {Promise<Array<Object>>} Array of profile objects
	 */
	async _fetchProfiles() {
		try {
			const response = await apiFetch( {
				path: '/altolith/deploy/profiles',
				method: 'GET',
			} );

			// Clear existing cache
			profiles.clear();

			// Populate cache with fetched profiles
			if ( response.profiles && Array.isArray( response.profiles ) ) {
				response.profiles.forEach( ( profile ) => {
					profiles.set( profile.id, profile );
				} );
			}

			loaded = true;

			/**
			 * Action fired after profiles are loaded from server.
			 *
			 * @param {Array<Object>} profiles Array of profile objects
			 */
			doAction( 'altolith.profiles.loaded', this.getAll() );

			return this.getAll();
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to load profiles:', error );
			throw error;
		}
	}

	/**
	 * Get a profile by ID.
	 *
	 * @param {string} profileId Profile ID (UUID)
	 * @return {Object|null} Profile object or null if not found
	 */
	get( profileId ) {
		return profiles.get( profileId ) || null;
	}

	/**
	 * Get all cached profiles.
	 *
	 * @return {Array<Object>} Array of profile objects
	 */
	getAll() {
		return Array.from( profiles.values() );
	}

	/**
	 * Get profiles by category.
	 *
	 * @param {string} category Category ID (e.g., 'credentials', 'edge')
	 * @return {Array<Object>} Array of profile objects in the category
	 */
	getByCategory( category ) {
		return this.getAll().filter(
			( profile ) => profile.category === category
		);
	}

	/**
	 * Get profiles by type (within a category).
	 *
	 * @param {string} category Category ID (e.g., 'credentials')
	 * @param {string} typeId   Type ID (e.g., 'cloudflare')
	 * @return {Array<Object>} Array of profile objects of the specified type
	 */
	getByType( category, typeId ) {
		return this.getAll().filter(
			( profile ) =>
				profile.category === category && profile.type === typeId
		);
	}

	/**
	 * Create a new profile.
	 *
	 * @param {Object} profileData Profile data (name, category, type, fields)
	 * @return {Promise<Object>} Created profile object
	 */
	async create( profileData ) {
		try {
			const response = await apiFetch( {
				path: '/altolith/deploy/profiles',
				method: 'POST',
				data: profileData,
			} );

			if ( response.profile ) {
				profiles.set( response.profile.id, response.profile );

				/**
				 * Action fired after a profile is created.
				 *
				 * @param {Object} profile The created profile
				 */
				doAction( 'altolith.profiles.created', response.profile );

				return response.profile;
			}

			throw new Error( response.message || 'Failed to create profile' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to create profile:', error );
			throw error;
		}
	}

	/**
	 * Update an existing profile.
	 *
	 * @param {string} profileId   Profile ID (UUID)
	 * @param {Object} profileData Updated profile data
	 * @return {Promise<Object>} Updated profile object
	 */
	async update( profileId, profileData ) {
		try {
			const response = await apiFetch( {
				path: `/altolith/deploy/profiles/${ profileId }`,
				method: 'PUT',
				data: profileData,
			} );

			if ( response.profile ) {
				profiles.set( profileId, response.profile );

				/**
				 * Action fired after a profile is updated.
				 *
				 * @param {Object} profile The updated profile
				 */
				doAction( 'altolith.profiles.updated', response.profile );

				return response.profile;
			}

			throw new Error( response.message || 'Failed to update profile' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to update profile:', error );
			throw error;
		}
	}

	/**
	 * Delete a profile.
	 *
	 * Will fail if the profile is referenced by provider instances.
	 *
	 * @param {string} profileId Profile ID (UUID)
	 * @return {Promise<boolean>} True if deleted successfully
	 */
	async delete( profileId ) {
		try {
			const response = await apiFetch( {
				path: `/altolith/deploy/profiles/${ profileId }`,
				method: 'DELETE',
			} );

			if ( response.success ) {
				const deletedProfile = profiles.get( profileId );
				profiles.delete( profileId );

				/**
				 * Action fired after a profile is deleted.
				 *
				 * @param {string} profileId The deleted profile ID
				 * @param {Object} profile   The deleted profile object
				 */
				doAction(
					'altolith.profiles.deleted',
					profileId,
					deletedProfile
				);

				return true;
			}

			throw new Error( response.message || 'Failed to delete profile' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to delete profile:', error );
			throw error;
		}
	}

	/**
	 * Get provider instances that reference a profile.
	 *
	 * @param {string} profileId Profile ID (UUID)
	 * @return {Promise<Array<Object>>} Array of referencing instance objects
	 */
	async getReferences( profileId ) {
		try {
			const response = await apiFetch( {
				path: `/altolith/deploy/profiles/${ profileId }/references`,
				method: 'GET',
			} );

			return response.references || [];
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to get profile references:', error );
			throw error;
		}
	}

	/**
	 * Test profile credentials.
	 *
	 * Calls the profile type's test endpoint to validate credentials.
	 *
	 * @param {string} profileId Profile ID (UUID)
	 * @return {Promise<Object>} Test result with success status and message
	 */
	async test( profileId ) {
		try {
			const response = await apiFetch( {
				path: `/altolith/deploy/profiles/${ profileId }/test`,
				method: 'POST',
			} );

			return response;
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to test profile:', error );
			throw error;
		}
	}

	/**
	 * Check if profiles have been loaded.
	 *
	 * @return {boolean} True if profiles have been loaded from server
	 */
	isLoaded() {
		return loaded;
	}

	/**
	 * Get count of cached profiles.
	 *
	 * @return {number} Number of cached profiles
	 */
	count() {
		return profiles.size;
	}

	/**
	 * Clear the local cache.
	 *
	 * Does not delete profiles from server, just clears local cache.
	 * Useful for testing or forcing a fresh load.
	 *
	 * @return {void}
	 */
	clearCache() {
		profiles.clear();
		loaded = false;
		loadPromise = null;
	}

	/**
	 * Register a profile in the local cache.
	 *
	 * Used internally after create/update operations.
	 * Not typically called directly - use create() or update() instead.
	 *
	 * @param {Object} profile Profile object
	 * @return {void}
	 */
	_cacheProfile( profile ) {
		if ( profile && profile.id ) {
			profiles.set( profile.id, profile );
		}
	}
}

// Create singleton instance
const registry = new ProfileRegistry();

// Make registry globally available so all bundles share the same instance
let exportedRegistry = registry;

if ( typeof window !== 'undefined' ) {
	window.altolith = window.altolith || {};
	// Only create global registry if it doesn't exist (first bundle to load)
	if ( ! window.altolith.ProfileRegistry ) {
		window.altolith.ProfileRegistry = registry;
	} else {
		// Use the global registry instead
		exportedRegistry = window.altolith.ProfileRegistry;
	}
}

export default exportedRegistry;
