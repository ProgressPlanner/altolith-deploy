/**
 * Provider Settings Hook
 *
 * Centralized hook for fetching and updating provider settings.
 * Eliminates duplicate code across components that manage provider configurations.
 *
 * Uses ProviderSettingsAPI service for all business logic.
 * Hook provides React state management (loading/error) around service calls.
 *
 */

import { useState, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { ProviderSettingsAPI } from '../services/ProviderSettingsAPI';

/**
 * Custom hook for managing provider settings
 *
 * @return {Object} Settings management functions and state
 */
export function useProviderSettings() {
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	// Create service instance with apiFetch (memoized to prevent recreation)
	const api = useMemo( () => new ProviderSettingsAPI( apiFetch ), [] );

	/**
	 * Fetch all provider settings
	 *
	 * @return {Promise<Object>} Provider configurations object
	 */
	const fetchProviderSettings = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			const providers = await api.fetchAll();
			setLoading( false );
			return providers;
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [ api ] );

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
			setLoading( true );
			setError( null );

			try {
				const updatedProviders = await api.update(
					providerId,
					updatedConfig,
					options
				);
				setLoading( false );
				return updatedProviders;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ api ]
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
				const updatedProviders = await api.updateMultiple( updates );
				setLoading( false );
				return updatedProviders;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ api ]
	);

	/**
	 * Toggle provider enabled state
	 *
	 * @param {string}  providerId Provider ID (can be instance ID)
	 * @param {boolean} enabled    New enabled state
	 * @return {Promise<Object>} Updated provider configurations
	 */
	const toggleProviderEnabled = useCallback(
		async ( providerId, enabled ) => {
			setLoading( true );
			setError( null );

			try {
				const updatedProviders = await api.toggleEnabled(
					providerId,
					enabled
				);
				setLoading( false );
				return updatedProviders;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ api ]
	);

	/**
	 * Create a new provider instance
	 *
	 * @param {string} instanceId   Client-generated instance ID (provider_type:uuid)
	 * @param {string} providerType Provider type (e.g., 'local-filesystem')
	 * @param {string} instanceName User-friendly instance name
	 * @return {Promise<Object>} Created instance info
	 */
	const createProviderInstance = useCallback(
		async ( instanceId, providerType, instanceName ) => {
			setLoading( true );
			setError( null );

			try {
				const response = await api.createInstance(
					instanceId,
					providerType,
					instanceName
				);
				setLoading( false );
				return response;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ api ]
	);

	/**
	 * Rename a provider instance
	 *
	 * @param {string} instanceId   Instance ID
	 * @param {string} instanceName New instance name
	 * @return {Promise<Object>} Updated provider configurations
	 */
	const renameProviderInstance = useCallback(
		async ( instanceId, instanceName ) => {
			setLoading( true );
			setError( null );

			try {
				const updatedProviders = await api.renameInstance(
					instanceId,
					instanceName
				);
				setLoading( false );
				return updatedProviders;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ api ]
	);

	/**
	 * Delete a provider instance
	 *
	 * @param {string} instanceId Instance ID
	 * @return {Promise<Object>} Updated provider configurations
	 */
	const deleteProviderInstance = useCallback(
		async ( instanceId ) => {
			setLoading( true );
			setError( null );

			try {
				const updatedProviders = await api.deleteInstance( instanceId );
				setLoading( false );
				return updatedProviders;
			} catch ( err ) {
				setError( err.message );
				setLoading( false );
				throw err;
			}
		},
		[ api ]
	);

	return {
		loading,
		error,
		fetchProviderSettings,
		updateProviderConfig,
		updateMultipleProviders,
		toggleProviderEnabled,
		createProviderInstance,
		renameProviderInstance,
		deleteProviderInstance,
	};
}
