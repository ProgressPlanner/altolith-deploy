/**
 * useProfiles Hook
 *
 * React hook for managing profiles (CRUD operations).
 * Provides state management and API interactions for profile instances.
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import ProfileRegistry from '../ProfileRegistry';

/**
 * Hook for managing profiles.
 *
 * @param {Object}  options          Hook options.
 * @param {string}  options.category Optional category filter.
 * @param {string}  options.type     Optional type filter (requires category).
 * @param {boolean} options.autoLoad Whether to load profiles on mount (default: true).
 * @return {Object} Hook state and methods.
 */
export function useProfiles( options = {} ) {
	const { category = null, type = null, autoLoad = true } = options;

	const [ profiles, setProfiles ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ isLoaded, setIsLoaded ] = useState( false );

	/**
	 * Load profiles from server/cache.
	 *
	 * @param {boolean} forceRefresh Force reload from server.
	 * @return {Promise<Array>} Array of profiles.
	 */
	const loadProfiles = useCallback(
		async ( forceRefresh = false ) => {
			setIsLoading( true );
			setError( null );

			try {
				await ProfileRegistry.loadAll( forceRefresh );

				// Get filtered profiles based on options.
				let loadedProfiles;
				if ( category && type ) {
					loadedProfiles = ProfileRegistry.getByType(
						category,
						type
					);
				} else if ( category ) {
					loadedProfiles = ProfileRegistry.getByCategory( category );
				} else {
					loadedProfiles = ProfileRegistry.getAll();
				}

				setProfiles( loadedProfiles );
				setIsLoaded( true );
				return loadedProfiles;
			} catch ( err ) {
				setError( err.message || 'Failed to load profiles' );
				throw err;
			} finally {
				setIsLoading( false );
			}
		},
		[ category, type ]
	);

	/**
	 * Create a new profile.
	 *
	 * @param {Object} profileData Profile data (name, category, type, fields).
	 * @return {Promise<Object>} Created profile.
	 */
	const createProfile = useCallback( async ( profileData ) => {
		setError( null );

		try {
			const createdProfile = await ProfileRegistry.create( profileData );
			// Update local state.
			setProfiles( ( prev ) => [ ...prev, createdProfile ] );
			return createdProfile;
		} catch ( err ) {
			setError( err.message || 'Failed to create profile' );
			throw err;
		}
	}, [] );

	/**
	 * Update an existing profile.
	 *
	 * @param {string} profileId   Profile ID.
	 * @param {Object} profileData Updated profile data.
	 * @return {Promise<Object>} Updated profile.
	 */
	const updateProfile = useCallback( async ( profileId, profileData ) => {
		setError( null );

		try {
			const updatedProfile = await ProfileRegistry.update(
				profileId,
				profileData
			);
			// Update local state.
			setProfiles( ( prev ) =>
				prev.map( ( p ) => ( p.id === profileId ? updatedProfile : p ) )
			);
			return updatedProfile;
		} catch ( err ) {
			setError( err.message || 'Failed to update profile' );
			throw err;
		}
	}, [] );

	/**
	 * Delete a profile.
	 *
	 * @param {string} profileId Profile ID.
	 * @return {Promise<boolean>} True if deleted.
	 */
	const deleteProfile = useCallback( async ( profileId ) => {
		setError( null );

		try {
			await ProfileRegistry.delete( profileId );
			// Update local state.
			setProfiles( ( prev ) =>
				prev.filter( ( p ) => p.id !== profileId )
			);
			return true;
		} catch ( err ) {
			setError( err.message || 'Failed to delete profile' );
			throw err;
		}
	}, [] );

	/**
	 * Get references for a profile.
	 *
	 * @param {string} profileId Profile ID.
	 * @return {Promise<Array>} Array of referencing instances.
	 */
	const getReferences = useCallback( async ( profileId ) => {
		try {
			return await ProfileRegistry.getReferences( profileId );
		} catch ( err ) {
			setError( err.message || 'Failed to get profile references' );
			throw err;
		}
	}, [] );

	/**
	 * Test profile credentials.
	 *
	 * @param {string} profileId Profile ID.
	 * @return {Promise<Object>} Test result.
	 */
	const testProfile = useCallback( async ( profileId ) => {
		try {
			return await ProfileRegistry.test( profileId );
		} catch ( err ) {
			setError( err.message || 'Failed to test profile' );
			throw err;
		}
	}, [] );

	/**
	 * Get a profile by ID.
	 *
	 * @param {string} profileId Profile ID.
	 * @return {Object|null} Profile or null.
	 */
	const getProfile = useCallback(
		( profileId ) => {
			return profiles.find( ( p ) => p.id === profileId ) || null;
		},
		[ profiles ]
	);

	/**
	 * Refresh profiles from server.
	 *
	 * @return {Promise<Array>} Array of profiles.
	 */
	const refresh = useCallback( () => loadProfiles( true ), [ loadProfiles ] );

	// Auto-load profiles on mount if enabled.
	useEffect( () => {
		if ( autoLoad && ! isLoaded && ! isLoading ) {
			loadProfiles();
		}
	}, [ autoLoad, isLoaded, isLoading, loadProfiles ] );

	// Memoized profile lookup by ID.
	const profilesById = useMemo( () => {
		const map = {};
		profiles.forEach( ( profile ) => {
			map[ profile.id ] = profile;
		} );
		return map;
	}, [ profiles ] );

	return {
		// State
		profiles,
		profilesById,
		isLoading,
		isLoaded,
		error,

		// Actions
		loadProfiles,
		createProfile,
		updateProfile,
		deleteProfile,
		getReferences,
		testProfile,
		getProfile,
		refresh,

		// Clear error
		clearError: () => setError( null ),
	};
}

export default useProfiles;
