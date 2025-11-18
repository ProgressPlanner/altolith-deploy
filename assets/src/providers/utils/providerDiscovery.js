/**
 * Provider Discovery Utilities
 *
 * Helper functions for discovering and working with providers.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';

/**
 * Get default provider ID.
 *
 * Uses filter to allow customization, falls back to JavaScript registry, then REST API.
 *
 * @return {Promise<string|null>} Default provider ID or null if none available
 */
export async function getDefaultProvider() {
	// Try filter first (allows customization).
	const filtered = applyFilters( 'aether.provider.getDefault', null );
	if ( filtered ) {
		return filtered;
	}

	// Try JavaScript registry first (more efficient).
	try {
		const { default: ProviderRegistry } = await import(
			'../registry/ProviderRegistry'
		);
		const registry = ProviderRegistry.getInstance();
		const allIds = registry.getAllIds();

		if ( allIds.length > 0 ) {
			// Find provider that supports static_site, or use first provider
			for ( const providerId of allIds ) {
				const provider = registry.get( providerId );
				if (
					provider &&
					provider.getSupportedDeploymentTypes &&
					provider
						.getSupportedDeploymentTypes()
						.includes( 'static_site' )
				) {
					return providerId;
				}
			}
			// Fallback to first provider
			return allIds[ 0 ];
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			'[Aether] Failed to check JS registry for default provider:',
			error
		);
	}

	// Fallback: Get from REST API (which queries PHP registry).
	try {
		const response = await apiFetch( {
			path: '/aether/site-exporter/providers',
		} );

		if (
			response.success &&
			response.providers &&
			response.providers.length > 0
		) {
			// Return first provider that supports static_site, or first provider.
			const staticSiteProvider = response.providers.find(
				( p ) =>
					p.deployment_types &&
					p.deployment_types.includes( 'static_site' )
			);
			return staticSiteProvider
				? staticSiteProvider.id
				: response.providers[ 0 ].id;
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( '[Aether] Failed to fetch default provider:', error );
	}

	return null;
}

/**
 * Get provider ID for a specific deployment type.
 *
 * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
 * @return {Promise<string|null>} Provider ID or null if none found
 */
export async function getProviderForDeploymentType( deploymentType ) {
	// Try filter first (allows customization).
	const filtered = applyFilters(
		'aether.provider.getForDeploymentType',
		null,
		deploymentType
	);
	if ( filtered ) {
		return filtered;
	}

	// Try JavaScript registry first (more efficient).
	try {
		const { default: ProviderRegistry } = await import(
			'../registry/ProviderRegistry'
		);
		const registry = ProviderRegistry.getInstance();
		const allIds = registry.getAllIds();

		// Find provider that supports the deployment type
		for ( const providerId of allIds ) {
			const provider = registry.get( providerId );
			if (
				provider &&
				provider.getSupportedDeploymentTypes &&
				provider
					.getSupportedDeploymentTypes()
					.includes( deploymentType )
			) {
				return providerId;
			}
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			`[Aether] Failed to check JS registry for deployment type ${ deploymentType }:`,
			error
		);
	}

	// Fallback: Get from REST API.
	try {
		const response = await apiFetch( {
			path: `/aether/site-exporter/providers/by-deployment-type/${ deploymentType }`,
		} );

		if (
			response.success &&
			response.providers &&
			response.providers.length > 0
		) {
			return response.providers[ 0 ].id;
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error(
			`[Aether] Failed to fetch provider for deployment type ${ deploymentType }:`,
			error
		);
	}

	return null;
}
