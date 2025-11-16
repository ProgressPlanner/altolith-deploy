/**
 * useProviderOptions Hook
 *
 * Fetches provider options filtered by capability for dropdown menus.
 * Providers are loaded via dynamic imports in admin-settings/index.js,
 * so they should already be registered when this hook runs.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { applyFilters, doAction } from '@wordpress/hooks';
import ProviderRegistry from '../../providers/registry/ProviderRegistry';
import {
	CAP_STORAGE,
	CAP_EDGE,
	CAP_MEDIA,
	CAP_STATIC_SITE,
} from '../../providers/base/AbstractProvider';
import { debugError } from '../../utils/debug';

/**
 * Map provider type to capability constant.
 *
 * @param {string} type Provider type (edge, storage, media, staticSite).
 * @return {string|null} Capability constant or null if not found.
 */
function mapTypeToCapability( type ) {
	const mapping = {
		edge: CAP_EDGE,
		storage: CAP_STORAGE,
		media: CAP_MEDIA,
		staticSite: CAP_STATIC_SITE,
	};
	return mapping[ type ] || null;
}

/**
 * Hook to get provider options for a specific type.
 *
 * @param {string} type Provider type (edge, storage, mediaImages, etc.).
 * @return {Object} { options, loading, error }
 */
export default function useProviderOptions( type ) {
	const [ options, setOptions ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		let isMounted = true;

		const fetchOptions = async () => {
			try {
				setLoading( true );
				setError( null );

				// Map type to capability
				const capability = mapTypeToCapability( type );

				if ( ! capability ) {
					if ( isMounted ) {
						setOptions( [] );
						setLoading( false );
					}
					return;
				}

				// Providers are loaded via dynamic imports in admin-settings/index.js
				// Trigger registration action to ensure any late-loading providers register
				doAction( 'aether.providers.register', ProviderRegistry );
				ProviderRegistry.autoDiscover();

				// Check immediately - providers should already be registered
				let providers = ProviderRegistry.getByCapability( capability );

				// If no providers found, wait briefly (max 1 second) for dynamic imports to complete
				if ( providers.length === 0 ) {
					const maxWaitTime = 1000;
					const checkInterval = 100;
					const startTime = Date.now();

					while ( Date.now() - startTime < maxWaitTime ) {
						doAction(
							'aether.providers.register',
							ProviderRegistry
						);
						ProviderRegistry.autoDiscover();
						providers =
							ProviderRegistry.getByCapability( capability );

						if ( providers.length > 0 ) {
							break;
						}

						await new Promise( ( resolve ) =>
							setTimeout( resolve, checkInterval )
						);

						if ( ! isMounted ) {
							return;
						}
					}
				}

				if ( ! isMounted ) {
					return;
				}

				// Map providers to dropdown options
				const providerOptions = providers.map( ( provider ) => {
					const metadata = provider.getMetadata();
					return {
						value: metadata.id,
						label: metadata.name,
						metadata,
					};
				} );

				// Apply filter hook to allow providers to modify options
				const filteredProviders = applyFilters(
					'aether.admin.provider.options',
					providerOptions,
					type
				);

				setOptions( filteredProviders );
			} catch ( err ) {
				debugError(
					'[useProviderOptions] Error loading providers:',
					err
				);
				if ( isMounted ) {
					setError( err.message || 'Failed to load providers' );
				}
			} finally {
				if ( isMounted ) {
					setLoading( false );
				}
			}
		};

		fetchOptions();

		return () => {
			isMounted = false;
		};
	}, [ type ] );

	return { options, loading, error };
}
