/**
 * Settings Context
 *
 * Centralized provider settings management using React Context API.
 * Provides global settings state with caching, optimistic updates, and validation.
 *
 */

import {
	createContext,
	useState,
	useEffect,
	useCallback,
	useMemo,
} from '@wordpress/element';
import apiFetch from '../utils/api';
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
	refetch: () => {},
	invalidateCache: () => {},
} );

/**
 * Settings Provider Component
 *
 * Wraps the application to provide global settings state.
 * Features:
 * - Single API fetch shared across all consumers
 * - Automatic cache invalidation on updates
 * - Error handling
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
				path: '/aether/site-exporter/settings',
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
	 * Refetch settings (no cache invalidation needed)
	 */
	const invalidateCache = useCallback( () => {
		fetchSettings();
	}, [ fetchSettings ] );

	/**
	 * Load settings on mount
	 */
	useEffect( () => {
		fetchSettings();
	}, [ fetchSettings ] );

	// Provide context value
	const value = useMemo(
		() => ( {
			settings,
			loading,
			error,
			refetch: fetchSettings,
			invalidateCache,
		} ),
		[ settings, loading, error, fetchSettings, invalidateCache ]
	);

	return (
		<SettingsContext.Provider value={ value }>
			{ children }
		</SettingsContext.Provider>
	);
}
