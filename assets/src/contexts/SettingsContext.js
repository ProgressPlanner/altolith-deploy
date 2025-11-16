/**
 * Settings Context
 *
 * Centralized provider settings management using React Context API.
 * Provides global settings state with caching, optimistic updates, and validation.
 *
 * @package
 */

import {
	createContext,
	useState,
	useEffect,
	useCallback,
	useMemo,
} from '@wordpress/element';
import apiFetch, { invalidateCache as invalidateAPICache } from '../utils/api';
import { debugError } from '../utils/debug';

/**
 * Settings Context
 *
 * @type {Object}
 */
export const SettingsContext = createContext( {
	settings: {},
	loading: true,
	error: null,
	provider_types: {},
	setProviderType: () => {},
	refetch: () => {},
	invalidateCache: () => {},
} );

/**
 * Settings Provider Component
 *
 * Wraps the application to provide global settings state.
 * Features:
 * - Single API fetch shared across all consumers
 * - Optimistic updates for provider selection
 * - Automatic cache invalidation on updates
 * - Error handling with rollback
 * - Loading state management
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
export function SettingsProvider( { children } ) {
	const [ settings, setSettings ] = useState( {} );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	/**
	 * Fetch settings from API
	 *
	 * @return {Promise<Object|null>} Settings object or null on error
	 */
	const fetchSettings = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			const response = await apiFetch( {
				path: '/aether/v1/settings',
			} );

			if ( response.success ) {
				const newSettings = response.settings || response.value || {};
				setSettings( newSettings );
				setLoading( false );
				return newSettings;
			}

			throw new Error( response.message || 'Failed to load settings' );
		} catch ( err ) {
			const errorMessage = err.message || 'Failed to load settings';
			setError( errorMessage );
			setLoading( false );
			debugError( 'Settings fetch error:', err );
			return null;
		}
	}, [] );

	/**
	 * Set a specific provider type
	 *
	 * Uses optimistic updates for instant UI feedback,
	 * then saves to API and rolls back on error.
	 *
	 * @param {string} providerTypeKey Provider type key (edge, storage, staticSite, media)
	 * @param {string} providerId      Provider ID to set
	 * @return {Promise<boolean>} True if successful, false on error
	 */
	const setProviderType = useCallback(
		async ( providerTypeKey, providerId ) => {
			// Store previous state for rollback
			const previousSettings = settings;
			const previousProviderTypes = settings.provider_types || {};

			// Optimistic update
			const updatedProviderTypes = {
				...previousProviderTypes,
				[ providerTypeKey ]: providerId || null,
			};

			setSettings( ( prev ) => ( {
				...prev,
				provider_types: updatedProviderTypes,
			} ) );

			// Clear error state
			setError( null );

			try {
				// Save to API
				const response = await apiFetch( {
					path: '/aether/v1/settings',
					method: 'POST',
					data: {
						key: 'provider_types',
						value: updatedProviderTypes,
					},
				} );

				if ( ! response.success ) {
					throw new Error(
						response.message || 'Failed to save provider selection'
					);
				}

				// Invalidate cache for settings endpoint
				invalidateAPICache( '/aether/v1/settings' );

				return true;
			} catch ( err ) {
				const errorMessage =
					err.message || 'Failed to save provider selection';
				setError( errorMessage );
				debugError( 'Provider type save error:', err );

				// Rollback to previous state
				setSettings( previousSettings );

				return false;
			}
		},
		[ settings ]
	);

	/**
	 * Invalidate cache and refetch settings
	 */
	const invalidateCache = useCallback( () => {
		invalidateAPICache( '/aether/v1/settings' );
		fetchSettings();
	}, [ fetchSettings ] );

	/**
	 * Load settings on mount
	 */
	useEffect( () => {
		fetchSettings();
	}, [ fetchSettings ] );

	/**
	 * Extract provider types from settings
	 */
	// eslint-disable-next-line camelcase
	const provider_types = useMemo( () => {
		return settings.provider_types || {};
	}, [ settings ] );

	// Provide context value
	const value = useMemo(
		() => ( {
			settings,
			loading,
			error,
			// eslint-disable-next-line camelcase
			provider_types,
			setProviderType,
			refetch: fetchSettings,
			invalidateCache,
		} ),
		[
			settings,
			loading,
			error,
			// eslint-disable-next-line camelcase
			provider_types,
			setProviderType,
			fetchSettings,
			invalidateCache,
		]
	);

	return (
		<SettingsContext.Provider value={ value }>
			{ children }
		</SettingsContext.Provider>
	);
}
