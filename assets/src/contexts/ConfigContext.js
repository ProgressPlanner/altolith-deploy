/**
 * Config Context
 *
 * Centralized configuration management using React Context API.
 * Provides global config state with caching, optimistic updates, and invalidation.
 *
 * @package
 */

import {
	createContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	useMemo,
} from '@wordpress/element';
import apiFetch from '../utils/api';

/**
 * Config Context
 *
 * @type {Object}
 */
export const ConfigContext = createContext( {
	config: {},
	loading: true,
	error: null,
	refetch: () => {},
	updateConfig: () => {},
	invalidateCache: () => {},
} );

/**
 * Cache TTL in milliseconds (5 minutes)
 *
 * @type {number}
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Config Provider Component
 *
 * Wraps the application to provide global config state.
 * Features:
 * - Single API fetch shared across all consumers
 * - Cache with 5-minute TTL
 * - Optimistic updates
 * - Manual cache invalidation
 * - Error handling with retry
 * - Loading state management
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
export function ConfigProvider( { children } ) {
	const [ config, setConfig ] = useState( {} );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const cacheTimestampRef = useRef( null );
	const fetchInProgressRef = useRef( false );

	/**
	 * Check if cache is valid
	 *
	 * @return {boolean} True if cache is still valid
	 */
	const isCacheValid = useCallback( () => {
		if ( ! cacheTimestampRef.current ) {
			return false;
		}
		const now = Date.now();
		const age = now - cacheTimestampRef.current;
		return age < CACHE_TTL;
	}, [] );

	/**
	 * Fetch configuration from API
	 *
	 * @param {boolean} force Force fetch even if cache is valid
	 * @return {Promise<Object|null>} Config object or null on error
	 */
	const fetchConfig = useCallback(
		async ( force = false ) => {
			// Return cached config if valid and not forcing
			if ( ! force && isCacheValid() ) {
				return config;
			}

			// Prevent concurrent fetches
			if ( fetchInProgressRef.current ) {
				return null;
			}

			fetchInProgressRef.current = true;
			setLoading( true );
			setError( null );

			try {
				const response = await apiFetch( {
					path: '/aether/site-exporter/config',
				} );

				if ( response.success ) {
					const newConfig = {
						publicUrl: response.publicUrl || '',
						adminUrl: response.adminUrl || '',
						...response.config, // Include any additional config fields
					};

					setConfig( newConfig );
					cacheTimestampRef.current = Date.now();
					setLoading( false );
					fetchInProgressRef.current = false;

					return newConfig;
				}

				throw new Error(
					'Config fetch failed: response.success is false'
				);
			} catch ( err ) {
				const errorMessage =
					err.message || 'Failed to fetch configuration';
				setError( errorMessage );
				setLoading( false );
				fetchInProgressRef.current = false;

				return null;
			}
		},
		[ config, isCacheValid ]
	);

	/**
	 * Refetch configuration
	 *
	 * Forces a fresh fetch regardless of cache status.
	 *
	 * @return {Promise<void>}
	 */
	const refetch = useCallback( async () => {
		await fetchConfig( true );
	}, [ fetchConfig ] );

	/**
	 * Update config optimistically
	 *
	 * Updates config immediately in state without waiting for API.
	 * Useful for UI responsiveness.
	 *
	 * @param {Object} updates Config updates to apply
	 */
	const updateConfig = useCallback( ( updates ) => {
		setConfig( ( prevConfig ) => ( {
			...prevConfig,
			...updates,
		} ) );
		// Invalidate cache so next fetch gets fresh data
		cacheTimestampRef.current = null;
	}, [] );

	/**
	 * Invalidate cache
	 *
	 * Clears the cached config timestamp, forcing a fresh fetch on next access.
	 */
	const invalidateCache = useCallback( () => {
		cacheTimestampRef.current = null;
	}, [] );

	// Fetch config on mount
	useEffect( () => {
		let isMounted = true;

		async function initialFetch() {
			await fetchConfig();
		}

		if ( isMounted ) {
			initialFetch();
		}

		return () => {
			isMounted = false;
		};
	}, [ fetchConfig ] );

	// Provide context value
	const value = useMemo(
		() => ( {
			config,
			loading,
			error,
			refetch,
			updateConfig,
			invalidateCache,
		} ),
		[ config, loading, error, refetch, updateConfig, invalidateCache ]
	);

	return (
		<ConfigContext.Provider value={ value }>
			{ children }
		</ConfigContext.Provider>
	);
}
