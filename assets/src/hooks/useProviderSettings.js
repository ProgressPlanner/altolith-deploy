/**
 * Provider Settings Hook
 *
 * Centralized hook for fetching and updating provider settings.
 * Eliminates duplicate code across components that manage provider configurations.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Custom hook for managing provider settings
 *
 * @return {Object} Settings management functions and state
 */
export function useProviderSettings() {
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	/**
	 * Fetch all provider settings
	 *
	 * @return {Promise<Object>} Provider configurations object
	 */
	const fetchProviderSettings = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			const response = await apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} );

			if ( ! response.success ) {
				throw new Error( 'Failed to load provider settings' );
			}

			setLoading( false );
			return response.value || {};
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [] );

	/**
	 * Update a single provider's configuration
	 *
	 * @param {string}  providerId                      Provider ID
	 * @param {Object}  updatedConfig                   Updated configuration for the provider
	 * @param {Object}  options                         Options
	 * @param {boolean} options.preserveEnabled         Preserve existing enabled state (default: false)
	 * @param {boolean} options.preserveDeploymentTypes Preserve existing deployment_types (default: false)
	 * @return {Promise<Object>} Updated provider configurations
	 */
	const updateProviderConfig = useCallback(
		async ( providerId, updatedConfig, options = {} ) => {
			const { preserveEnabled = false, preserveDeploymentTypes = false } =
				options;

			setLoading( true );
			setError( null );

			try {
				// Fetch current settings
				const currentProviders = await fetchProviderSettings();
				const currentConfig = currentProviders[ providerId ] || {};

				// Merge configurations with preservation options
				const mergedConfig = {
					...updatedConfig,
				};

				// Preserve enabled state if requested
				if ( preserveEnabled && 'enabled' in currentConfig ) {
					mergedConfig.enabled = currentConfig.enabled;
				}

				// Preserve deployment_types if requested and exists
				if (
					preserveDeploymentTypes &&
					'deployment_types' in currentConfig
				) {
					mergedConfig.deployment_types =
						currentConfig.deployment_types;
				}

				// Build updated providers object
				const updatedProviders = {
					...currentProviders,
					[ providerId ]: mergedConfig,
				};

				// Save to API
				const saveResponse = await apiFetch( {
					path: '/aether/site-exporter/settings',
					method: 'POST',
					data: {
						key: 'providers',
						value: updatedProviders,
					},
				} );

				if ( ! saveResponse.success ) {
					throw new Error( 'Failed to save provider settings' );
				}

				setLoading( false );
				return updatedProviders;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ fetchProviderSettings ]
	);

	/**
	 * Update multiple providers at once
	 *
	 * @param {Object} updates Object mapping provider IDs to their updated configs
	 * @return {Promise<Object>} Updated provider configurations
	 */
	const updateMultipleProviders = useCallback(
		async ( updates ) => {
			setLoading( true );
			setError( null );

			try {
				// Fetch current settings
				const currentProviders = await fetchProviderSettings();

				// Merge all updates
				const updatedProviders = {
					...currentProviders,
					...Object.entries( updates ).reduce(
						( acc, [ providerId, config ] ) => {
							acc[ providerId ] = {
								...( currentProviders[ providerId ] || {} ),
								...config,
							};
							return acc;
						},
						{}
					),
				};

				// Save to API
				const saveResponse = await apiFetch( {
					path: '/aether/site-exporter/settings',
					method: 'POST',
					data: {
						key: 'providers',
						value: updatedProviders,
					},
				} );

				if ( ! saveResponse.success ) {
					throw new Error( 'Failed to save provider settings' );
				}

				setLoading( false );
				return updatedProviders;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ fetchProviderSettings ]
	);

	/**
	 * Toggle provider enabled state
	 *
	 * @param {string}  providerId Provider ID
	 * @param {boolean} enabled    New enabled state
	 * @return {Promise<Object>} Updated provider configurations
	 */
	const toggleProviderEnabled = useCallback(
		async ( providerId, enabled ) => {
			return updateProviderConfig(
				providerId,
				{ enabled },
				{ preserveDeploymentTypes: true }
			);
		},
		[ updateProviderConfig ]
	);

	return {
		loading,
		error,
		fetchProviderSettings,
		updateProviderConfig,
		updateMultipleProviders,
		toggleProviderEnabled,
	};
}
