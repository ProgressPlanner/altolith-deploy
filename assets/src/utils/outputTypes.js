/**
 * Output Types
 *
 * Defines core output types and provides a filterable hook for 3rd-party plugins
 * to register additional output types with their configuration fields.
 *
 * Output types are controlled via global settings, not per-provider toggles.
 * Provider-specific fields (like blueprint_subfolder) are still defined here.
 */

import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Hook name for registering output types.
 *
 * @type {string}
 */
export const OUTPUT_TYPES_HOOK = 'altolith.provider.outputTypes';

/**
 * Core output types provided by altolith-deploy.
 *
 * Note: Enable toggles are now in global settings, not per-provider.
 * Only provider-specific configuration fields are defined here.
 *
 * @type {Array<Object>}
 */
const CORE_OUTPUT_TYPES = [
	{
		id: 'static_site',
		label: __( 'Static Site', 'altolith-deploy' ),
		description: __(
			'Export your WordPress site as static HTML files.',
			'altolith-deploy'
		),
		// No provider-specific fields for static site
		fields: [],
	},
	{
		id: 'blueprint',
		label: __( 'Blueprint', 'altolith-deploy' ),
		description: __(
			'Export WordPress Playground blueprint files.',
			'altolith-deploy'
		),
		fields: [
			{
				id: 'blueprint_subfolder',
				type: 'text',
				label: __( 'Blueprint Subfolder', 'altolith-deploy' ),
				default: 'playground',
				placeholder: 'playground',
				help: __(
					'Subfolder where blueprint files will be stored (e.g., "playground" creates /playground/blueprint.json).',
					'altolith-deploy'
				),
				validation: {
					pattern: /^[a-zA-Z0-9_-]+$/,
					message: __(
						'Subfolder must contain only letters, numbers, hyphens, and underscores.',
						'altolith-deploy'
					),
				},
			},
		],
	},
];

/**
 * Get all registered output types.
 *
 * Returns core output types plus any added by 3rd-party plugins via the
 * 'altolith.provider.outputTypes' filter.
 *
 * @example
 * // In a 3rd-party plugin:
 * import { addFilter } from '@wordpress/hooks';
 *
 * addFilter('altolith.provider.outputTypes', 'my-plugin', (types) => {
 *     return [...types, {
 *         id: 'media_offload',
 *         label: 'Media Offloading',
 *         fields: [
 *             { id: 'media_subfolder', type: 'text', label: 'Media Subfolder', default: 'wp-content/uploads' },
 *         ],
 *     }];
 * });
 *
 * @return {Array<Object>} Array of output type definitions.
 */
export function getOutputTypes() {
	return applyFilters( OUTPUT_TYPES_HOOK, CORE_OUTPUT_TYPES );
}

/**
 * Get all output type config fields.
 *
 * Flattens the fields from all output types into a single array,
 * suitable for merging with provider config fields.
 *
 * @return {Array<Object>} Array of config field definitions.
 */
export function getOutputTypeFields() {
	const outputTypes = getOutputTypes();
	return outputTypes.flatMap( ( type ) => type.fields || [] );
}

/**
 * Get an output type by ID.
 *
 * @param {string} typeId Output type ID (e.g., 'static_site', 'blueprint').
 * @return {Object|null} Output type definition or null if not found.
 */
export function getOutputType( typeId ) {
	const outputTypes = getOutputTypes();
	return outputTypes.find( ( type ) => type.id === typeId ) || null;
}

/**
 * Get IDs of all registered output types.
 *
 * @return {Array<string>} Array of output type IDs.
 */
export function getOutputTypeIds() {
	return getOutputTypes().map( ( type ) => type.id );
}

/**
 * Get global settings.
 *
 * Returns global settings from window.altolithData.globalSettings
 * or defaults.
 *
 * @return {Object} Global settings object.
 */
export function getGlobalSettings() {
	return window?.altolithData?.globalSettings || {};
}

/**
 * Get crawl batch size from global settings.
 *
 * Returns the configured batch size for URL crawling (1-50, default: 10).
 *
 * @return {number} Batch size for URL crawling.
 */
export function getCrawlBatchSize() {
	const globalSettings = getGlobalSettings();
	const batchSize = globalSettings.crawlBatchSize;

	// Validate and clamp to range 1-50
	if ( typeof batchSize === 'number' && batchSize >= 1 && batchSize <= 50 ) {
		return batchSize;
	}

	return 10; // Default
}

/**
 * Check which output types are enabled based on global settings.
 *
 * Reads from global settings stored in window.altolithData.globalSettings
 * or falls back to defaults.
 *
 * @return {Array<string>} Array of enabled output type IDs.
 */
export function getEnabledOutputTypes() {
	// Get global settings from window or use defaults
	const globalSettings = getGlobalSettings();

	const enabled = [];

	// Check static site (default: true)
	if ( globalSettings.exportStaticSite !== false ) {
		enabled.push( 'static_site' );
	}

	// Check blueprint (default: true)
	if ( globalSettings.exportBlueprint !== false ) {
		enabled.push( 'blueprint' );
	}

	// Allow 3rd-party output types to check their own settings
	const outputTypes = getOutputTypes();
	for ( const type of outputTypes ) {
		// Skip core types already handled
		if ( type.id === 'static_site' || type.id === 'blueprint' ) {
			continue;
		}

		// Check for a matching global setting (e.g., exportMediaOffload for media_offload)
		const settingKey = `export${ type.id
			.split( '_' )
			.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
			.join( '' ) }`;

		if ( globalSettings[ settingKey ] === true ) {
			enabled.push( type.id );
		}
	}

	return enabled;
}
