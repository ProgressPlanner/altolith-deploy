/**
 * Local Filesystem Provider
 *
 * Unified provider for local file storage. Handles all output types
 * (static site, blueprint, etc.) based on user configuration.
 *
 * This replaces the separate LocalFilesystemStaticSiteProvider and
 * LocalFilesystemBlueprintBundleProvider with a single, extensible provider.
 */

import { __ } from '@wordpress/i18n';
import { getOutputTypeFields } from '@altolith/utils/outputTypes';

/**
 * LocalFilesystemProvider class
 *
 * Handles local file storage for all output types.
 * Files are stored relative to WordPress root directory.
 */
export class LocalFilesystemProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'local-filesystem';

	/**
	 * Provider family for config copying compatibility.
	 *
	 * @type {string}
	 */
	static FAMILY = 'local-filesystem';

	/**
	 * Provider name.
	 *
	 * @type {string}
	 */
	static NAME = __( 'Local Filesystem', 'altolith-deploy' );

	/**
	 * Provider type.
	 *
	 * @type {string}
	 */
	static TYPE = 'local-storage';

	/**
	 * Provider description.
	 *
	 * @type {string}
	 */
	static DESCRIPTION = __(
		'Store exported files locally in the WordPress directory. No cloud deployment required.',
		'altolith-deploy'
	);

	/**
	 * Provider icon.
	 *
	 * @type {string}
	 */
	static ICON = '💾';

	/**
	 * Whether this provider supports parallel execution with other instances.
	 *
	 * Local filesystem providers should run sequentially to avoid PHP request
	 * contention when multiple instances upload to the same WordPress REST endpoint.
	 *
	 * @type {boolean}
	 */
	static SUPPORTS_PARALLEL_EXECUTION = false;

	/**
	 * Core configuration fields (provider-specific).
	 *
	 * Output type fields are added dynamically via getConfigFields().
	 *
	 * @type {Array<Object>}
	 */
	static CONFIG_FIELDS = [
		{
			id: 'public_url',
			label: __( 'Public URL', 'altolith-deploy' ),
			type: 'text',
			required: false,
			secure: false,
			placeholder: 'https://example.com',
			help: __(
				'URL where exported files will be publicly accessible. Used for URL replacements in exported HTML and blueprint references. Leave empty to use WordPress home URL.',
				'altolith-deploy'
			),
			validation: {
				pattern: /^https?:\/\/.+/,
				message: __(
					'Public URL must be a valid HTTP or HTTPS URL',
					'altolith-deploy'
				),
			},
		},
		{
			id: 'base_path',
			label: __( 'Base Directory', 'altolith-deploy' ),
			type: 'text',
			required: true,
			secure: false,
			placeholder: 'static/',
			help: __(
				'Directory where files will be written (relative to WordPress root). Each export overwrites the previous one.',
				'altolith-deploy'
			),
			validation: {
				pattern: /^[a-zA-Z0-9/_.-]+$/,
				message: __(
					'Path must contain only letters, numbers, slashes, hyphens, underscores, and dots.',
					'altolith-deploy'
				),
			},
		},
	];

	/**
	 * Get all configuration fields including output type fields.
	 *
	 * This method merges the provider's core fields with fields from all
	 * registered output types (static_site, blueprint, media_offload, etc.).
	 *
	 * @return {Array<Object>} Complete array of config field definitions.
	 */
	static getConfigFields() {
		const coreFields = [ ...LocalFilesystemProvider.CONFIG_FIELDS ];
		const outputTypeFields = getOutputTypeFields();

		return [ ...coreFields, ...outputTypeFields ];
	}
}

export default LocalFilesystemProvider;
