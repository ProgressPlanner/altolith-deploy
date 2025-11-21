/**
 * Provider Metadata Reload Hook
 *
 * Reloads provider metadata when deployment types change to ensure
 * the correct settings fields are displayed.
 *
 * @package
 */

import { useEffect, useRef, useCallback } from '@wordpress/element';
import apiFetch from '@aether/utils/api';

/**
 * Hook to reload provider metadata when deployment types change
 *
 * @param {Object}   configs             Provider configurations object
 * @param {boolean}  isModalOpen         Whether a provider modal is currently open
 * @param {Object}   selectedProvider    Currently selected provider
 * @param {Function} setProviders        Callback to update providers list
 * @param {Function} setSelectedProvider Callback to update selected provider
 */
export function useProviderMetadataReload(
	configs,
	isModalOpen,
	selectedProvider,
	setProviders,
	setSelectedProvider
) {
	const previousDeploymentTypesRef = useRef( null );

	// Extract and serialize deployment types for comparison
	const getDeploymentTypesString = useCallback( () => {
		return JSON.stringify(
			Object.keys( configs )
				.sort()
				.reduce( ( acc, providerId ) => {
					const deploymentTypes =
						configs[ providerId ]?.deployment_types;
					if ( Array.isArray( deploymentTypes ) ) {
						acc[ providerId ] = deploymentTypes.sort().join( ',' );
					}
					return acc;
				}, {} )
		);
	}, [ configs ] );

	useEffect( () => {
		// Skip if no configs yet
		if ( Object.keys( configs ).length === 0 ) {
			return;
		}

		const deploymentTypesString = getDeploymentTypesString();

		// Skip if deployment types haven't changed
		if (
			previousDeploymentTypesRef.current === deploymentTypesString &&
			previousDeploymentTypesRef.current !== null
		) {
			return;
		}

		previousDeploymentTypesRef.current = deploymentTypesString;

		const reloadProviders = async () => {
			try {
				const providersResponse = await apiFetch( {
					path: '/aether/site-exporter/providers',
				} );

				if (
					providersResponse.success &&
					providersResponse.providers
				) {
					const providerMetadata = providersResponse.providers.map(
						( provider ) => ( {
							id: provider.id,
							metadata: {
								name: provider.name,
								description: provider.description,
								supportedDeploymentTypes:
									provider.deployment_types || [],
								type: provider.type,
								dependencies: provider.dependencies || [],
								icon: '',
							},
							settingsFields: (
								provider.settings_fields || []
							).map( ( field ) => ( {
								...field,
								id: field.name,
							} ) ),
						} )
					);

					setProviders( providerMetadata );

					// If a provider modal is open, update the selected provider with latest metadata
					// This ensures the modal shows the correct fields when deployment types change
					if ( selectedProvider && isModalOpen ) {
						const updatedProvider = providerMetadata.find(
							( p ) => p.id === selectedProvider.id
						);
						if ( updatedProvider ) {
							// Reload the provider from the API to get filtered settings fields
							try {
								const providerResponse = await apiFetch( {
									path: `/aether/site-exporter/providers/${ updatedProvider.id }`,
								} );

								if (
									providerResponse.success &&
									providerResponse.provider
								) {
									const refreshedProvider = {
										...updatedProvider,
										settingsFields: (
											providerResponse.provider
												.settings_fields || []
										).map( ( field ) => ( {
											...field,
											id: field.name,
										} ) ),
									};
									setSelectedProvider( refreshedProvider );
								} else {
									setSelectedProvider( updatedProvider );
								}
							} catch ( error ) {
								console.error(
									'Failed to refresh provider metadata:',
									error
								);
								setSelectedProvider( updatedProvider );
							}
						}
					}
				}
			} catch ( error ) {
				console.error( 'Failed to reload providers:', error );
			}
		};

		reloadProviders();
	}, [
		configs,
		isModalOpen,
		selectedProvider,
		setProviders,
		setSelectedProvider,
		getDeploymentTypesString,
	] );
}
