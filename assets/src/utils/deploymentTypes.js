/**
 * Deployment Types
 *
 * Provides filterable deployment types for the export system.
 * 3rd-party plugins can add custom deployment types via the
 * 'altolith.deploymentTypes' filter.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Get deployment types. Filterable by 3rd-party plugins.
 *
 * @return {Object} Deployment types keyed by type ID with label property.
 */
export function getDeploymentTypes() {
	return applyFilters( 'altolith.deploymentTypes', {
		static_site: {
			label: __( 'Static Site', 'altolith-deploy' ),
		},
		blueprint_bundle: {
			label: __( 'Blueprint Bundle', 'altolith-deploy' ),
		},
	} );
}

/**
 * Get label for a deployment type.
 *
 * @param {string} typeId - Deployment type ID (e.g., 'static_site').
 * @return {string} Human-readable label, or the typeId if not found.
 */
export function getDeploymentTypeLabel( typeId ) {
	const types = getDeploymentTypes();
	return types[ typeId ]?.label || typeId;
}
