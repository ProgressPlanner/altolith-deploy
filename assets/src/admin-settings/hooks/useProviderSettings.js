/**
 * useProviderSettings Hook
 *
 * Load and save provider settings via REST API.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import apiFetch from '../../utils/api';

/**
 * Hook to manage provider settings.
 *
 * @param {string} providerId Provider ID.
 * @return {Object} { settings, loading, error, loadSettings, saveSettings }
 */
export default function useProviderSettings( providerId ) {
	const [ settings, setSettings ] = useState( {} );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	const loadSettings = useCallback( async () => {
		if ( ! providerId ) {
			return;
		}

		try {
			setLoading( true );
			setError( null );

			// Load providers settings from /aether/v1/settings endpoint
			const response = await apiFetch( {
				path: '/aether/v1/settings?key=providers',
			} );

			if ( ! response.success ) {
				throw new Error( 'Failed to load settings' );
			}

			// Extract provider-specific settings
			const providers = response.value || {};
			setSettings( providers[ providerId ] || {} );
		} catch ( err ) {
			setError( err.message || 'Failed to load settings' );
		} finally {
			setLoading( false );
		}
	}, [ providerId ] );

	const saveSettings = useCallback(
		async ( newSettings ) => {
			if ( ! providerId ) {
				return { success: false, error: 'No provider selected' };
			}

			try {
				setLoading( true );
				setError( null );

				// Get current providers settings
				const getResponse = await apiFetch( {
					path: '/aether/v1/settings?key=providers',
				} );

				if ( ! getResponse.success ) {
					throw new Error( 'Failed to load current settings' );
				}

				// Merge new provider settings with existing providers
				const currentProviders = getResponse.value || {};
				const updatedProviders = {
					...currentProviders,
					[ providerId ]: newSettings,
				};

				// Save updated providers object using /aether/v1/settings endpoint
				const saveResponse = await apiFetch( {
					path: '/aether/v1/settings',
					method: 'POST',
					data: {
						key: 'providers',
						value: updatedProviders,
					},
				} );

				if ( ! saveResponse.success ) {
					throw new Error(
						saveResponse.message || 'Failed to save settings'
					);
				}

				setSettings( newSettings );
				return { success: true, data: saveResponse };
			} catch ( err ) {
				const errorMessage = err.message || 'Failed to save settings';
				setError( errorMessage );
				return { success: false, error: errorMessage };
			} finally {
				setLoading( false );
			}
		},
		[ providerId ]
	);

	return {
		settings,
		loading,
		error,
		loadSettings,
		saveSettings,
	};
}
