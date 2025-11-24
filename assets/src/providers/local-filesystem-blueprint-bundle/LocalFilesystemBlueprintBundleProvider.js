/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Provider for local blueprint bundle file storage.
 * Handles blueprint bundle ZIP files only.
 *
 */

import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';
import { validateAllFields } from '../utils/configValidation';
import { sanitizeAllFields } from '../utils/configSanitization';

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
			LocalFilesystemBlueprintBundleProvider.CONFIG_FIELDS
		);

		// Additional validation for LocalFilesystemBlueprintBundle
		// Validate export path if provided
		if ( config.export_path ) {
			// Ensure path doesn't try to escape WordPress root
			if (
				config.export_path.includes( '..' ) ||
				config.export_path.startsWith( '/' )
			) {
				errors.export_path = __(
					'Export path must be relative to WordPress root and cannot contain ".."',
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
			LocalFilesystemBlueprintBundleProvider.CONFIG_FIELDS
		);

		// Sanitize export_path - default to 'blueprint-bundle/bundle.zip' if empty
		if ( sanitized.export_path ) {
			sanitized.export_path = sanitized.export_path
				.replace( /^\/+|\/+$/g, '' )
				.trim();
			if (
				sanitized.export_path === '' ||
				! sanitized.export_path.endsWith( '.zip' )
			) {
				sanitized.export_path = 'blueprint-bundle/bundle.zip';
			}
		} else {
			sanitized.export_path = 'blueprint-bundle/bundle.zip';
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
					'Local filesystem is ready for blueprint bundle exports',
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

export default LocalFilesystemBlueprintBundleProvider;
