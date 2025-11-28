/**
 * Output Types
 *
 * Defines core output types and provides a filterable hook for 3rd-party plugins
 * to register additional output types with their configuration fields.
 *
 * Output types replace the old DEPLOYMENT_TYPE concept. Instead of providers
 * being classified by deployment type, providers are now generic storage backends
 * and users choose which output types to enable via config toggles.
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
		fields: [
			{
				id: 'enable_static_site',
				type: 'toggle',
				label: __( 'Export Static Site', 'altolith-deploy' ),
				default: true,
				help: __(
					'Export static HTML, CSS, JS, and media files.',
					'altolith-deploy'
				),
			},
		],
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
				id: 'enable_blueprint',
				type: 'toggle',
				label: __( 'Export Blueprint', 'altolith-deploy' ),
				default: false,
				help: __(
					'Export blueprint.json and supporting ZIP files for WordPress Playground.',
					'altolith-deploy'
				),
			},
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
				showWhen: ( config ) => config.enable_blueprint === true,
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
 *             { id: 'enable_media_offload', type: 'toggle', label: 'Offload Media', default: false },
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
 * Check which output types are enabled in a config object.
 *
 * @param {Object} config Provider instance config.
 * @return {Array<string>} Array of enabled output type IDs.
 */
export function getEnabledOutputTypes( config ) {
	const outputTypes = getOutputTypes();
	return outputTypes
		.filter( ( type ) => {
			// Find the enable toggle field for this type
			const enableField = type.fields?.find(
				( field ) =>
					field.id === `enable_${ type.id }` &&
					field.type === 'toggle'
			);
			if ( ! enableField ) {
				return false;
			}
			// Check if enabled in config (default to field's default value)
			const fieldValue = config?.[ enableField.id ];
			return fieldValue !== undefined
				? fieldValue
				: enableField.default || false;
		} )
		.map( ( type ) => type.id );
}
