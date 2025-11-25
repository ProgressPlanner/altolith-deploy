/**
 * Local Filesystem Static Site Provider
 *
 * Provider for local static site file storage.
 * Handles static HTML, CSS, and JS files only.
 *
 */

import { __ } from '@wordpress/i18n';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';

/**
 * LocalFilesystemStaticSiteProvider class
 *
 * Handles local file storage for static sites only.
 * Files are stored in wp-content/aether-exports/.
 */
export class LocalFilesystemStaticSiteProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'local-filesystem-static-site';

	/**
	 * Provider name.
	 *
	 * @type {string}
	 */
	static NAME = __( 'Local Filesystem', 'aether-site-exporter' );

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
		'Store static site files (HTML, CSS, JS) locally in the WordPress uploads directory. No cloud deployment required.',
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
	static DEPLOYMENT_TYPE = DEPLOYMENT_TYPES.STATIC_SITE;

	/**
	 * Configuration fields.
	 *
	 * @type {Array<Object>}
	 */
	static CONFIG_FIELDS = [
		{
			id: 'public_url',
			label: __( 'Public URL', 'aether-site-exporter' ),
			type: 'text',
			required: false,
			secure: false,
			placeholder: 'https://example.com',
			help: __(
				'URL where exported files will be publicly accessible. Used for URL replacements in exported HTML. Leave empty to use WordPress home URL.',
				'aether'
			),
			validation: {
				pattern: /^https?:\/\/.+/,
				message: __(
					'Public URL must be a valid HTTP or HTTPS URL',
					'aether'
				),
			},
		},
		{
			id: 'static_files_path',
			label: __( 'Static Files Directory', 'aether-site-exporter' ),
			type: 'text',
			required: true,
			secure: false,
			placeholder: 'static/',
			help: __(
				'Directory where static site files will be written (relative to WordPress root). Each export overwrites the previous one.',
				'aether'
			),
			validation: {
				pattern: /^[a-zA-Z0-9/_.-]+$/,
				message: __(
					'Static files path must contain only letters, numbers, slashes, hyphens, underscores, and dots. Cannot be empty.',
					'aether'
				),
			},
		},
	];
}

export default LocalFilesystemStaticSiteProvider;
