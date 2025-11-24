/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Provider for local blueprint bundle file storage.
 * Handles blueprint bundle ZIP files only.
 *
 */

import { __ } from '@wordpress/i18n';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';

/**
 * LocalFilesystemBlueprintBundleProvider class
 *
 * Handles local file storage for blueprint bundles only.
 * Files are stored in wp-content/aether-exports/.
 */
export class LocalFilesystemBlueprintBundleProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'local-filesystem-blueprint-bundle';

	/**
	 * Provider name.
	 *
	 * @type {string}
	 */
	static NAME = __(
		'Local Filesystem (Blueprint Bundle)',
		'aether-site-exporter'
	);

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
		'aether'
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
	static DEPLOYMENT_TYPE = DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE;

	/**
	 * Configuration fields.
	 *
	 * @type {Array<Object>}
	 */
	static CONFIG_FIELDS = [
		{
			id: 'export_path',
			label: __( 'Blueprint-bundle file path', 'aether-site-exporter' ),
			type: 'text',
			required: true,
			secure: false,
			placeholder: 'blueprint-bundle/bundle.zip',
			help: __(
				'Full path to the blueprint bundle ZIP file (relative to WordPress root), including filename.',
				'aether'
			),
			validation: {
				pattern: /^[a-zA-Z0-9/_.-]+\.zip$/,
				message: __(
					'Blueprint bundle path must end with .zip and contain only letters, numbers, slashes, hyphens, underscores, and dots.',
					'aether'
				),
			},
		},
	];
}

export default LocalFilesystemBlueprintBundleProvider;
