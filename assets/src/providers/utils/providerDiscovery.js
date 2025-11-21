/**
 * Provider Discovery Utilities
 *
 * Helper functions for discovering and working with providers.
 * Now uses JavaScript ProviderRegistry instead of REST API.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import ProviderRegistry from '../registry/ProviderRegistry';

/**
 * Get default provider ID.
 *
 * Uses filter to allow customization, then queries JavaScript registry.
 *
 * @return {string|null} Default provider ID or null if none available
 */
export function getDefaultProvider() {
	// Try filter first (allows customization).
	const filtered = applyFilters( 'aether.provider.getDefault', null );
	if ( filtered ) {
		return filtered;
	}

	// Get from JavaScript registry.
	const defaultProvider = ProviderRegistry.getDefault();
	return defaultProvider ? defaultProvider.getId() : null;
}

/**
 * Get provider ID for a specific deployment type.
 *
 * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
 * @return {string|null} Provider ID or null if none found
 */
export function getProviderForDeploymentType( deploymentType ) {
	// Try filter first (allows customization).
	const filtered = applyFilters(
		'aether.provider.getForDeploymentType',
		null,
		deploymentType
	);
	if ( filtered ) {
		return filtered;
	}

	// Get from JavaScript registry.
	const provider = ProviderRegistry.getForDeploymentType( deploymentType );
	return provider ? provider.getId() : null;
}
