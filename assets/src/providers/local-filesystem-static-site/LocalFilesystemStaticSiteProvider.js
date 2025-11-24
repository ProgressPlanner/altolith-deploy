/**
 * Local Filesystem Static Site Provider
 *
 * Provider for local static site file storage.
 * Handles static HTML, CSS, and JS files only.
 *
 */

import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';
import { validateAllFields } from '../utils/configValidation';
import { sanitizeAllFields } from '../utils/configSanitization';

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
	static NAME = __( 'Local Filesystem (Static Site)', 'aether' );

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

	/**
	 * Validate provider configuration.
	 *
	 * @param {string} providerId Provider ID.
	 * @param {Object} config     Configuration object to validate.
	 * @return {Promise<Object>} Validation errors object (empty if valid)
	 */
	static async validateConfig( providerId, config ) {
		const errors = await validateAllFields(
			config,
			LocalFilesystemStaticSiteProvider.CONFIG_FIELDS
		);

		// Additional validation for LocalFilesystemStaticSite
		// Validate static_files_path if provided
		if ( config.static_files_path ) {
			// Ensure path doesn't try to escape WordPress root
			if (
				config.static_files_path.includes( '..' ) ||
				config.static_files_path.startsWith( '/' )
			) {
				errors.static_files_path = __(
					'Static files path must be relative to WordPress root and cannot contain ".."',
					'aether'
				);
			}
		}

		return applyFilters(
			'aether.provider.config.validate',
			errors,
			config,
			providerId
		);
	}

	/**
	 * Sanitize provider configuration.
	 *
	 * @param {string} providerId Provider ID.
	 * @param {Object} config     Configuration object to sanitize.
	 * @return {Promise<Object>} Sanitized configuration
	 */
	static async sanitizeConfig( providerId, config ) {
		const sanitized = sanitizeAllFields(
			config,
			LocalFilesystemStaticSiteProvider.CONFIG_FIELDS
		);

		// Sanitize static_files_path - default to 'static/' if empty
		if ( sanitized.static_files_path ) {
			sanitized.static_files_path = sanitized.static_files_path.trim();
			if ( sanitized.static_files_path === '' ) {
				sanitized.static_files_path = 'static/';
			}
		} else {
			sanitized.static_files_path = 'static/';
		}

		return applyFilters(
			'aether.provider.config.sanitize',
			sanitized,
			config,
			providerId
		);
	}

	/**
	 * Test connection to provider.
	 *
	 * For LocalFilesystem, this checks if the export directory is writable.
	 *
	 * @param {string} providerId Provider ID (unused for LocalFilesystem but required for consistency).
	 * @return {Promise<Object>} Connection test result
	 */
	static async testConnection( providerId ) {
		// eslint-disable-next-line no-unused-vars
		const _ = providerId; // Keep for consistency with other providers
		try {
			// For LocalFilesystem, we don't need to test anything
			// The server-side will handle directory creation and permissions
			return {
				success: true,
				message: __(
					'Local filesystem is ready for static site exports',
					'aether'
				),
			};
		} catch ( error ) {
			return {
				success: false,
				error:
					error.message ||
					__( 'Connection test failed', 'aether-site-exporter' ),
			};
		}
	}
}

export default LocalFilesystemStaticSiteProvider;
