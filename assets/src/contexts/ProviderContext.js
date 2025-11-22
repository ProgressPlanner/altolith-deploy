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
import ProviderRegistry from '../providers/registry/ProviderRegistry';
import { debugError } from '../utils/debug';

/**
 * Provider Context
 *
 * @type {Object}
 */
export const ProviderContext = createContext( {
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

	/**
	 * Load providers from JavaScript registry
	 * Waits for providers to register if registry is empty
	 */
	const loadProviders = useCallback( () => {
		setLoading( true );
		setError( null );

		// eslint-disable-next-line no-console
		console.log( 'Aether ProviderContext: Loading providers...' );

		// Wait for providers to register (they load asynchronously)
		const checkProviders = () => {
			try {
				// Get all providers from JavaScript registry
				const allProviders = ProviderRegistry.getAll();

				// eslint-disable-next-line no-console
				console.log(
					'Aether ProviderContext: Found',
					allProviders.length,
					'providers'
				);

				// If no providers yet, wait a bit and try again
				// This handles the case where provider scripts haven't loaded yet
				if ( allProviders.length === 0 ) {
					// eslint-disable-next-line no-console
					console.log(
						'Aether ProviderContext: No providers yet, waiting...'
					);
					// Wait up to 2 seconds for providers to register
					let attempts = 0;
					const maxAttempts = 20; // 20 attempts * 100ms = 2 seconds
					const interval = setInterval( () => {
						attempts++;
						const foundProviders = ProviderRegistry.getAll();
						// eslint-disable-next-line no-console
						console.log(
							'Aether ProviderContext: Attempt',
							attempts,
							'- Found',
							foundProviders.length,
							'providers'
						);
						if (
							foundProviders.length > 0 ||
							attempts >= maxAttempts
						) {
							clearInterval( interval );
							if ( foundProviders.length > 0 ) {
								// eslint-disable-next-line no-console
								console.log(
									'Aether ProviderContext: Providers found after',
									attempts,
									'attempts'
								);
								// Providers found, process them
								processProviders( foundProviders );
							} else {
								// Still no providers after waiting
								// eslint-disable-next-line no-console
								console.warn(
									'Aether ProviderContext: No providers found after waiting'
								);
								setLoading( false );
								setError(
									'No providers found. Please ensure provider plugins are active.'
								);
							}
						}
					}, 100 );
					return;
				}

				// Providers found immediately, process them
				// eslint-disable-next-line no-console
				console.log(
					'Aether ProviderContext: Providers found immediately'
				);
				processProviders( allProviders );
			} catch ( err ) {
				const errorMessage = err.message || 'Failed to load providers';
				setError( errorMessage );
				setLoading( false );
				// eslint-disable-next-line no-console
				console.error( 'Aether ProviderContext: Error:', err );
				debugError( 'Provider loading error:', err );
			}
		};

		// Helper to process providers
		const processProviders = ( allProviders ) => {
			// eslint-disable-next-line no-console
			console.log(
				'Aether ProviderContext: Processing',
				allProviders.length,
				'providers'
			);
			// Transform to match expected format
			const providerMetadata = allProviders.map( ( provider ) => {
				const supportedTypes =
					provider.getSupportedDeploymentTypes?.() || [];
				return {
					id: provider.getId(),
					name: provider.getName(),
					description: provider.getDescription?.() || '',
					type: provider.getType?.() || 'generic',
					supportedDeploymentTypes: supportedTypes,
					configured: false, // Will be determined from config
				};
			} );

			// eslint-disable-next-line no-console
			console.log(
				'Aether ProviderContext: Processed providers:',
				providerMetadata.map( ( p ) => p.id )
			);

			setProviderIds( providerMetadata.map( ( p ) => p.id ) );
			setProviders( providerMetadata );
			setLoading( false );
			// eslint-disable-next-line no-console
			console.log( 'Aether ProviderContext: Loading complete' );
		};

		checkProviders();
	}, [] );

	/**
	 * Get a provider metadata by ID
	 *
	 * @param {string} providerId Provider ID
	 * @return {Object|null} Provider metadata or null
	 */
	const getProvider = useCallback(
		( providerId ) => {
			if ( ! providerId ) {
				return null;
			}

			return providers.find( ( p ) => p.id === providerId ) || null;
		},
		[ providers ]
	);

	/**
	 * Get providers by capability
	 *
	 * @param {string} capability Capability constant
	 * @return {Array<Object>} Providers with that capability
	 */
	const getProvidersByCapability = useCallback(
		( capability ) => {
			// Filter providers by deployment type (capability)
			return providers.filter( ( p ) =>
				p.supportedDeploymentTypes?.includes( capability )
			);
		},
		[ providers ]
	);

	/**
	 * Get providers by type
	 *
	 * @param {string} type Provider type
	 * @return {Array<Object>} Providers of that type
	 */
	const getProvidersByType = useCallback(
		( type ) => {
			return providers.filter( ( p ) => p.type === type );
		},
		[ providers ]
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
			return providerIds.includes( providerId );
		},
		[ providerIds ]
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
