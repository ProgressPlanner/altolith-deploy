/**
 * useProfileTypes Hook
 *
 * React hook for accessing registered profile types.
 * Profile types define the schema (fields, validation) for different profile kinds.
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import ProfileTypeRegistry from '../ProfileTypeRegistry';

/**
 * Hook for accessing profile types.
 *
 * @param {Object} options          Hook options.
 * @param {string} options.category Optional category filter.
 * @return {Object} Hook state and methods.
 */
export function useProfileTypes( options = {} ) {
	const { category = null } = options;

	const [ profileTypes, setProfileTypes ] = useState( [] );
	const [ categories, setCategories ] = useState( [] );
	const [ isReady, setIsReady ] = useState( false );

	/**
	 * Load profile types from registry.
	 */
	const loadProfileTypes = useCallback( () => {
		// Get profile types (optionally filtered by category).
		let types;
		if ( category ) {
			types = ProfileTypeRegistry.getByCategory( category );
		} else {
			types = ProfileTypeRegistry.getAll();
		}

		setProfileTypes( types );

		// Get all categories with metadata.
		setCategories( ProfileTypeRegistry.getCategoryMetadata() );

		setIsReady( true );
	}, [ category ] );

	/**
	 * Get a specific profile type.
	 *
	 * @param {string} typeCategory Category ID.
	 * @param {string} typeId       Type ID.
	 * @return {Function|null} Profile type class or null.
	 */
	const getProfileType = useCallback( ( typeCategory, typeId ) => {
		return ProfileTypeRegistry.get( typeCategory, typeId );
	}, [] );

	/**
	 * Get fields for a profile type.
	 *
	 * @param {string} typeCategory Category ID.
	 * @param {string} typeId       Type ID.
	 * @return {Array} Array of field definitions.
	 */
	const getTypeFields = useCallback( ( typeCategory, typeId ) => {
		const ProfileType = ProfileTypeRegistry.get( typeCategory, typeId );
		return ProfileType?.FIELDS || [];
	}, [] );

	/**
	 * Get metadata for a category.
	 *
	 * @param {string} categoryId Category ID.
	 * @return {Object|null} Category metadata or null.
	 */
	const getCategoryMetadata = useCallback(
		( categoryId ) => {
			return categories.find( ( cat ) => cat.id === categoryId ) || null;
		},
		[ categories ]
	);

	/**
	 * Check if a profile type is registered.
	 *
	 * @param {string} typeCategory Category ID.
	 * @param {string} typeId       Type ID.
	 * @return {boolean} True if registered.
	 */
	const hasProfileType = useCallback( ( typeCategory, typeId ) => {
		return ProfileTypeRegistry.has( typeCategory, typeId );
	}, [] );

	// Load profile types on mount.
	useEffect( () => {
		loadProfileTypes();
	}, [ loadProfileTypes ] );

	// Memoized profile types grouped by category.
	const typesByCategory = useMemo( () => {
		const grouped = {};
		profileTypes.forEach( ( ProfileType ) => {
			const cat = ProfileType.CATEGORY;
			if ( ! grouped[ cat ] ) {
				grouped[ cat ] = [];
			}
			grouped[ cat ].push( ProfileType );
		} );
		return grouped;
	}, [ profileTypes ] );

	// Memoized list of unique categories from registered types.
	const registeredCategories = useMemo( () => {
		return ProfileTypeRegistry.getCategories();
	}, [] );

	return {
		// State
		profileTypes,
		categories,
		typesByCategory,
		registeredCategories,
		isReady,

		// Methods
		getProfileType,
		getTypeFields,
		getCategoryMetadata,
		hasProfileType,
		reload: loadProfileTypes,
	};
}

export default useProfileTypes;
