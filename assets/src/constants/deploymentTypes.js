/**
 * Deployment type constants and labels
 *
 */

import { __ } from '@wordpress/i18n';

/**
 * Deployment type identifiers
 */
export const DEPLOYMENT_TYPES = {
	STATIC_SITE: 'static_site',
	BLUEPRINT_BUNDLE: 'blueprint_bundle',
	EDGE_FUNCTIONS: 'edge_functions',
};

/**
 * Human-readable labels for deployment types
 */
export const DEPLOYMENT_TYPE_LABELS = {
	[ DEPLOYMENT_TYPES.STATIC_SITE ]: __(
		'Static Site',
		'aether-site-exporter'
	),
	[ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ]: __(
		'Blueprint Bundle',
		'aether-site-exporter'
	),
	[ DEPLOYMENT_TYPES.EDGE_FUNCTIONS ]: __(
		'Edge Functions',
		'aether-site-exporter'
	),
};
