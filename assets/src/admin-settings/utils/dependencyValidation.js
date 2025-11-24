/**
 * Dependency Validation Utility
 *
 * Provides functions to validate provider dependencies.
 * A dependency is satisfied when:
 * - Dependency provider exists in registry
 * - Dependency provider is enabled
 * - Dependency provider is configured
 *
 */

/**
 * Check if a dependency is satisfied.
 *
 * @param {string} dependencyId    Provider ID of the dependency.
 * @param {Array}  providers       Array of all provider metadata.
 * @param {Object} providerConfigs Object mapping provider IDs to their configs.
 * @return {boolean} True if dependency is satisfied.
 */
export function isDependencySatisfied(
	dependencyId,
	providers,
	providerConfigs
) {
	// Check if dependency provider exists
	const dependencyProvider = providers.find( ( p ) => p.id === dependencyId );

	if ( ! dependencyProvider ) {
		return false;
	}

	// Check if dependency provider is enabled
	const dependencyConfig = providerConfigs[ dependencyId ] || {};
	const isEnabled = dependencyConfig.enabled !== false;

	if ( ! isEnabled ) {
		return false;
	}

	// Check if dependency provider is configured
	const isConfigured =
		dependencyConfig &&
		Object.keys( dependencyConfig ).length > 0 &&
		// Exclude enabled from configured check
		Object.keys( dependencyConfig ).some( ( key ) => key !== 'enabled' );

	return isConfigured;
}

/**
 * Get all unsatisfied dependencies for a provider.
 *
 * @param {Object} provider        Provider metadata object.
 * @param {Array}  providers       Array of all provider metadata.
 * @param {Object} providerConfigs Object mapping provider IDs to their configs.
 * @return {Array<string>} Array of unsatisfied dependency provider IDs.
 */
export function getUnsatisfiedDependencies(
	provider,
	providers,
	providerConfigs
) {
	const dependencies = provider.dependencies || [];
	const unsatisfied = [];

	dependencies.forEach( ( dependencyId ) => {
		if (
			! isDependencySatisfied( dependencyId, providers, providerConfigs )
		) {
			unsatisfied.push( dependencyId );
		}
	} );

	return unsatisfied;
}

/**
 * Check if all dependencies are satisfied for a provider.
 *
 * @param {Object} provider        Provider metadata object.
 * @param {Array}  providers       Array of all provider metadata.
 * @param {Object} providerConfigs Object mapping provider IDs to their configs.
 * @return {boolean} True if all dependencies are satisfied.
 */
export function areAllDependenciesSatisfied(
	provider,
	providers,
	providerConfigs
) {
	const unsatisfied = getUnsatisfiedDependencies(
		provider,
		providers,
		providerConfigs
	);
	return unsatisfied.length === 0;
}
