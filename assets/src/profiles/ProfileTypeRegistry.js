/**
 * Profile Type Registry
 *
 * JavaScript-based profile type registry that collects profile types from
 * altolith.profiles.types.register hooks. Profile types define the schema
 * for different kinds of profiles (e.g., Cloudflare credentials, AWS credentials).
 *
 * Profile types are registered by 3rd-party plugins - nothing is hardcoded here.
 */

import { addAction, doAction, applyFilters } from '@wordpress/hooks';

/**
 * Internal registry storage for profile types.
 *
 * @type {Map<string, Function>}
 */
const profileTypes = new Map();

/**
 * Profile Type Registry
 *
 * Singleton registry for managing profile type definitions.
 * Profile types define the schema (fields, validation, etc.) for profiles.
 */
class ProfileTypeRegistry {
	/**
	 * Register a profile type class.
	 *
	 * @param {Function} ProfileTypeClass Profile type class (must have static ID, CATEGORY, NAME, FIELDS, etc.)
	 * @return {void}
	 */
	register( ProfileTypeClass ) {
		if ( ! ProfileTypeClass || typeof ProfileTypeClass !== 'function' ) {
			throw new Error(
				'ProfileTypeRegistry.register() requires a profile type class'
			);
		}

		// Validate profile type has required static properties
		if ( ! ProfileTypeClass.ID ) {
			throw new Error( 'Profile type must have static ID property' );
		}

		if ( ! ProfileTypeClass.CATEGORY ) {
			throw new Error(
				`Profile type ${ ProfileTypeClass.ID } must have static CATEGORY property`
			);
		}

		if ( ! ProfileTypeClass.NAME ) {
			throw new Error(
				`Profile type ${ ProfileTypeClass.ID } must have static NAME property`
			);
		}

		if (
			! ProfileTypeClass.FIELDS ||
			! Array.isArray( ProfileTypeClass.FIELDS )
		) {
			throw new Error(
				`Profile type ${ ProfileTypeClass.ID } must have static FIELDS array`
			);
		}

		// Create composite key: category:type
		const key = `${ ProfileTypeClass.CATEGORY }:${ ProfileTypeClass.ID }`;
		profileTypes.set( key, ProfileTypeClass );

		/**
		 * Action fired after a profile type is registered.
		 *
		 * @param {Function} ProfileTypeClass Profile type class
		 * @param {string}   key              Composite key (category:type)
		 */
		doAction( 'altolith.profiles.types.registered', ProfileTypeClass, key );
	}

	/**
	 * Get a profile type class by category and type ID.
	 *
	 * @param {string} category Category ID (e.g., 'credentials')
	 * @param {string} typeId   Type ID (e.g., 'cloudflare')
	 * @return {Function|null} Profile type class or null if not found
	 */
	get( category, typeId ) {
		const key = `${ category }:${ typeId }`;
		return profileTypes.get( key ) || null;
	}

	/**
	 * Get a profile type class by composite key.
	 *
	 * @param {string} key Composite key (category:type)
	 * @return {Function|null} Profile type class or null if not found
	 */
	getByKey( key ) {
		return profileTypes.get( key ) || null;
	}

	/**
	 * Get all registered profile type classes.
	 *
	 * @return {Array<Function>} Array of profile type classes
	 */
	getAll() {
		return Array.from( profileTypes.values() );
	}

	/**
	 * Get all profile types for a specific category.
	 *
	 * @param {string} category Category ID (e.g., 'credentials', 'edge')
	 * @return {Array<Function>} Array of profile type classes in the category
	 */
	getByCategory( category ) {
		return this.getAll().filter(
			( ProfileTypeClass ) => ProfileTypeClass.CATEGORY === category
		);
	}

	/**
	 * Get all unique categories that have registered types.
	 *
	 * @return {Array<string>} Array of category IDs
	 */
	getCategories() {
		const categories = new Set();
		for ( const ProfileTypeClass of profileTypes.values() ) {
			categories.add( ProfileTypeClass.CATEGORY );
		}
		return Array.from( categories );
	}

	/**
	 * Get category metadata from registered filters.
	 *
	 * Categories are registered via addFilter('altolith.profiles.categories', ...).
	 *
	 * @return {Array<Object>} Array of category objects with id, name, description, icon
	 */
	getCategoryMetadata() {
		/**
		 * Filter to register profile categories.
		 *
		 * @param {Array<Object>} categories Array of category objects
		 * @return {Array<Object>} Modified array of category objects
		 *
		 * @example
		 * addFilter('altolith.profiles.categories', 'my-plugin/credentials', (categories) => {
		 *   return [...categories, {
		 *     id: 'credentials',
		 *     name: 'Credentials',
		 *     description: 'Authentication credentials',
		 *     icon: 'key'
		 *   }];
		 * });
		 */
		return applyFilters( 'altolith.profiles.categories', [] );
	}

	/**
	 * Check if a profile type is registered.
	 *
	 * @param {string} category Category ID
	 * @param {string} typeId   Type ID
	 * @return {boolean} True if registered
	 */
	has( category, typeId ) {
		const key = `${ category }:${ typeId }`;
		return profileTypes.has( key );
	}

	/**
	 * Get count of registered profile types.
	 *
	 * @return {number} Number of registered profile types
	 */
	count() {
		return profileTypes.size;
	}

	/**
	 * Clear all registered profile types.
	 *
	 * Useful for testing or resetting state.
	 *
	 * @return {void}
	 */
	clear() {
		profileTypes.clear();
	}
}

// Create singleton instance
const registry = new ProfileTypeRegistry();

/**
 * Hook into altolith.profiles.types.register to auto-register profile types.
 *
 * When profile types call doAction('altolith.profiles.types.register', ProfileTypeClass),
 * this will automatically register them.
 */
addAction(
	'altolith.profiles.types.register',
	'altolith/profile-type-registry',
	( ProfileTypeClass ) => {
		if ( ! ProfileTypeClass || typeof ProfileTypeClass !== 'function' ) {
			return;
		}

		// Get type ID from static property
		const typeId = ProfileTypeClass.ID;
		if ( ! typeId ) {
			return; // Invalid type - must have static ID
		}

		// Register the profile type class
		registry.register( ProfileTypeClass );
	}
);

// Make registry globally available so all bundles share the same instance
// This is necessary because webpack creates separate module instances for each bundle
let exportedRegistry = registry;

if ( typeof window !== 'undefined' ) {
	window.altolith = window.altolith || {};
	// Only create global registry if it doesn't exist (first bundle to load)
	if ( ! window.altolith.ProfileTypeRegistry ) {
		window.altolith.ProfileTypeRegistry = registry;
	} else {
		// If registry already exists, use the global one and sync types
		const globalRegistry = window.altolith.ProfileTypeRegistry;
		// Copy any types from this instance to the global one
		const localTypes = Array.from( profileTypes.values() );
		localTypes.forEach( ( ProfileTypeClass ) => {
			const category = ProfileTypeClass.CATEGORY;
			const typeId = ProfileTypeClass.ID;
			if ( ! globalRegistry.has( category, typeId ) ) {
				globalRegistry.register( ProfileTypeClass );
			}
		} );
		// Use the global registry instead
		exportedRegistry = globalRegistry;
	}
}

export default exportedRegistry;
