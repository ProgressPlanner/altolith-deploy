/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Provider for local blueprint bundle file storage.
 * Handles blueprint bundle ZIP files only.
 *
 */

import { __ } from '@wordpress/i18n';

/**
 * LocalFilesystemBlueprintBundleProvider class
 *
 * Handles local file storage for blueprint bundles only.
 * Files are stored in wp-content/altolith-exports/.
 */
export class LocalFilesystemBlueprintBundleProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'local-filesystem-blueprint-bundle';

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
		'Store blueprint bundle ZIP files locally in the WordPress uploads directory. No cloud deployment required.',
		'altolith'
	);

	/**
	 * Provider icon.
	 *
	 * @type {string}
	 */
	static ICON = '💾';

	/**
	 * Deployment type this provider supports.
	 *
	 * @type {string}
	 */
	static DEPLOYMENT_TYPE = 'blueprint_bundle';

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
	 * Configuration fields.
	 *
	 * @type {Array<Object>}
	 */
	static CONFIG_FIELDS = [
		{
			id: 'export_path',
			label: __( 'Blueprint-bundle file path', 'altolith-deploy' ),
			type: 'text',
			required: true,
			secure: false,
			placeholder: 'blueprint-bundle/bundle.zip',
			help: __(
				'Full path to the blueprint bundle ZIP file (relative to WordPress root), including filename.',
				'altolith'
			),
			validation: {
				pattern: /^[a-zA-Z0-9/_.-]+\.zip$/,
				message: __(
					'Blueprint bundle path must end with .zip and contain only letters, numbers, slashes, hyphens, underscores, and dots.',
					'altolith'
				),
			},
		},
	];
}

export default LocalFilesystemBlueprintBundleProvider;
