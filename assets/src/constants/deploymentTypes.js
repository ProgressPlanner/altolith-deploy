/**
 * Deployment type constants and labels
 *
 * @package Aether
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

/**
 * Descriptions for deployment types
 */
export const DEPLOYMENT_TYPE_DESCRIPTIONS = {
	[ DEPLOYMENT_TYPES.STATIC_SITE ]: __(
		'Deploy static HTML/CSS/JS files for web hosting',
		'aether-site-exporter'
	),
	[ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ]: __(
		'Deploy WordPress Playground blueprint bundle (ZIP file)',
		'aether-site-exporter'
	),
	[ DEPLOYMENT_TYPES.EDGE_FUNCTIONS ]: __(
		'Deploy serverless functions to edge computing platforms',
		'aether-site-exporter'
	),
};
