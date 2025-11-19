/**
 * Dependency Validation Hook
 *
 * Monitors provider dependencies and automatically disables providers
 * when their dependencies become unsatisfied.
 *
 * @package
 */

import { useEffect, useRef } from '@wordpress/element';
import { areAllDependenciesSatisfied } from '../utils/dependencyValidation';
import { useProviderSettings } from '../../hooks/useProviderSettings';

/**
 * Hook to validate and auto-disable providers with unsatisfied dependencies
 *
 * @param {Array}    providers       Array of provider metadata objects
 * @param {Object}   configs         Provider configurations object
 * @param {Function} onConfigsUpdate Callback when configs are updated
 */
export function useDependencyValidation( providers, configs, onConfigsUpdate ) {
	const { updateMultipleProviders } = useProviderSettings();
	const previousConfigsRef = useRef( null );

	useEffect( () => {
		// Skip if no providers or configs yet
		if ( providers.length === 0 || Object.keys( configs ).length === 0 ) {
			return;
		}

		// Create a stable string representation of configs for comparison
		const configsString = JSON.stringify(
			Object.keys( configs )
				.sort()
				.reduce( ( acc, key ) => {
					acc[ key ] = configs[ key ];
					return acc;
				}, {} )
		);

		// Skip if configs haven't actually changed
		if ( previousConfigsRef.current === configsString ) {
			return;
		}

		previousConfigsRef.current = configsString;

		const validateAndDisableProviders = async () => {
			// Check all providers for unsatisfied dependencies
			const providersToDisable = {};

			providers.forEach( ( provider ) => {
				const providerConfig = configs[ provider.id ] || {};
				const isEnabled = providerConfig.enabled !== false;

				// Only check enabled providers
				if ( isEnabled ) {
					const allDependenciesSatisfied =
						areAllDependenciesSatisfied(
							provider,
							providers,
							configs
						);

					if ( ! allDependenciesSatisfied ) {
						// Mark for disabling
						providersToDisable[ provider.id ] = {
							...providerConfig,
							enabled: false,
						};
					}
				}
			} );

			// If any providers need to be disabled, save the updated configs
			if ( Object.keys( providersToDisable ).length > 0 ) {
				try {
					const updatedProviders =
						await updateMultipleProviders( providersToDisable );

					if ( onConfigsUpdate ) {
						onConfigsUpdate( updatedProviders );
					}
				} catch ( error ) {
					console.error(
						'Failed to disable providers with unsatisfied dependencies:',
						error
					);
				}
			}
		};

		validateAndDisableProviders();
	}, [ providers, configs, onConfigsUpdate, updateMultipleProviders ] );
}
