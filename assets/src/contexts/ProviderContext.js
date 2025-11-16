/**
 * Provider Context
 *
 * Centralized provider management using React Context API.
 * Provides global provider registry state with caching and operations.
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
import { ProviderRegistry } from '../providers/registry/ProviderRegistry';
import { debugError } from '../utils/debug';

/**
 * Provider Context
 *
 * @type {Object}
 */
export const ProviderContext = createContext( {
	registry: null,
	providers: [],
	providerIds: [],
	loading: true,
	error: null,
	getProvider: () => null,
	getProvidersByCapability: () => [],
	getProvidersByType: () => [],
	getProvidersGroupedByType: () => ( {} ),
	getProvidersGroupedByCapability: () => ( {} ),
	providerExists: () => false,
	providerCount: 0,
	refresh: () => {},
} );

/**
 * Provider Provider Component
 *
 * Wraps the application to provide global provider registry state.
 * Features:
 * - Single source of truth for provider registry
 * - Cached provider metadata
 * - Efficient queries (by capability, type, etc.)
 * - Provider config caching
 * - Provider status tracking
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
export function ProviderProvider( { children } ) {
	const [ providers, setProviders ] = useState( [] );
	const [ providerIds, setProviderIds ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	// Get singleton registry instance
	const registry = useMemo( () => {
		return ProviderRegistry.getInstance();
	}, [] );

	/**
	 * Load providers from registry
	 */
	const loadProviders = useCallback( () => {
		setLoading( true );
		setError( null );

		try {
			// Get all provider IDs
			const ids = registry.getAllIds();
			setProviderIds( ids );

			// Get all provider metadata
			const metadata = registry.getAllMetadata();
			setProviders( metadata );

			setLoading( false );
		} catch ( err ) {
			const errorMessage = err.message || 'Failed to load providers';
			setError( errorMessage );
			setLoading( false );
			debugError( 'Provider loading error:', err );
		}
	}, [ registry ] );

	/**
	 * Get a provider instance by ID
	 *
	 * @param {string} providerId Provider ID
	 * @param {Object} config     Optional config
	 * @return {Object|null} Provider instance or null
	 */
	const getProvider = useCallback(
		( providerId, config = {} ) => {
			if ( ! providerId ) {
				return null;
			}

			try {
				return registry.getProvider( providerId, config );
			} catch ( err ) {
				debugError( `Failed to get provider ${ providerId }:`, err );
				return null;
			}
		},
		[ registry ]
	);

	/**
	 * Get providers by capability
	 *
	 * @param {string} capability Capability constant
	 * @return {Array<Object>} Providers with that capability
	 */
	const getProvidersByCapability = useCallback(
		( capability ) => {
			try {
				return registry.getByCapability( capability );
			} catch ( err ) {
				debugError(
					`Failed to get providers by capability ${ capability }:`,
					err
				);
				return [];
			}
		},
		[ registry ]
	);

	/**
	 * Get providers by type
	 *
	 * @param {string} type Provider type
	 * @return {Array<Object>} Providers of that type
	 */
	const getProvidersByType = useCallback(
		( type ) => {
			try {
				return registry.getByType( type );
			} catch ( err ) {
				debugError( `Failed to get providers by type ${ type }:`, err );
				return [];
			}
		},
		[ registry ]
	);

	/**
	 * Get providers grouped by type
	 *
	 * @return {Object} Providers grouped by type
	 */
	const getProvidersGroupedByType = useCallback( () => {
		return providers.reduce( ( acc, provider ) => {
			const type = provider.type || 'other';
			if ( ! acc[ type ] ) {
				acc[ type ] = [];
			}
			acc[ type ].push( provider );
			return acc;
		}, {} );
	}, [ providers ] );

	/**
	 * Get providers grouped by capability
	 *
	 * @return {Object} Providers grouped by capability
	 */
	const getProvidersGroupedByCapability = useCallback( () => {
		const grouped = {};

		providers.forEach( ( provider ) => {
			( provider.capabilities || [] ).forEach( ( capability ) => {
				if ( ! grouped[ capability ] ) {
					grouped[ capability ] = [];
				}
				grouped[ capability ].push( provider );
			} );
		} );

		return grouped;
	}, [ providers ] );

	/**
	 * Check if a provider exists
	 *
	 * @param {string} providerId Provider ID
	 * @return {boolean} True if provider exists
	 */
	const providerExists = useCallback(
		( providerId ) => {
			return registry.has( providerId );
		},
		[ registry ]
	);

	/**
	 * Get provider count
	 *
	 * @return {number} Number of registered providers
	 */
	const providerCount = useMemo( () => {
		return providers.length;
	}, [ providers ] );

	// Load providers on mount
	useEffect( () => {
		loadProviders();
	}, [ loadProviders ] );

	// Provide context value
	const value = useMemo(
		() => ( {
			registry,
			providers,
			providerIds,
			loading,
			error,
			getProvider,
			getProvidersByCapability,
			getProvidersByType,
			getProvidersGroupedByType,
			getProvidersGroupedByCapability,
			providerExists,
			providerCount,
			refresh: loadProviders,
		} ),
		[
			registry,
			providers,
			providerIds,
			loading,
			error,
			getProvider,
			getProvidersByCapability,
			getProvidersByType,
			getProvidersGroupedByType,
			getProvidersGroupedByCapability,
			providerExists,
			providerCount,
			loadProviders,
		]
	);

	return (
		<ProviderContext.Provider value={ value }>
			{ children }
		</ProviderContext.Provider>
	);
}
