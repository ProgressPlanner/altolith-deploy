/**
 * Provider Metadata Reload Hook
 *
 * Reloads provider metadata when deployment types change to ensure
 * the correct settings fields are displayed.
 *
 * @package
 */

import { useEffect, useRef, useCallback } from '@wordpress/element';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

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

		const reloadProviders = () => {
			try {
				// Get providers from JavaScript registry
				const allProviders = ProviderRegistry.getAll();
				const providerMetadata = allProviders.map( ( provider ) => {
					const configFields = provider.getProviderSpecificConfigFields?.() || [];
					return {
						id: provider.getId(),
						metadata: {
							name: provider.getName(),
							description: provider.getDescription?.() || '',
							supportedDeploymentTypes:
								provider.getSupportedDeploymentTypes?.() || [],
							type: provider.getType?.() || 'generic',
							dependencies: provider.getDependencies?.() || [],
							icon: provider.getIcon?.() || '',
						},
						settingsFields: configFields.map( ( field ) => ( {
							...field,
							id: field.id || field.name,
							name: field.name || field.id,
						} ) ),
					};
				} );

				setProviders( providerMetadata );

				// If a provider modal is open, update the selected provider with latest metadata
				// This ensures the modal shows the correct fields when deployment types change
				if ( selectedProvider && isModalOpen ) {
					const updatedProvider = providerMetadata.find(
						( p ) => p.id === selectedProvider.id
					);
					if ( updatedProvider ) {
						setSelectedProvider( updatedProvider );
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
