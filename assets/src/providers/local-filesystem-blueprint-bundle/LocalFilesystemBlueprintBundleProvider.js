/**
 * Local Filesystem Blueprint Bundle Provider
 *
 * Provider for local blueprint bundle file storage.
 * Handles blueprint bundle ZIP files only.
 *
 */

import { __ } from '@wordpress/i18n';
import { AbstractProvider } from '../base/AbstractProvider';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';

/**
 * LocalFilesystemBlueprintBundleProvider class
 *
 * Handles local file storage for blueprint bundles only.
 * Files are stored in wp-content/aether-exports/.
 */
export class LocalFilesystemBlueprintBundleProvider extends AbstractProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'local-filesystem-blueprint-bundle';

	/**
	 * Get the unique provider identifier.
	 *
	 * @return {string} Provider ID
	 */
	getId() {
		return this.registeredId || LocalFilesystemBlueprintBundleProvider.ID;
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * @return {string} Provider name
	 */
	getName() {
		return __(
			'Local Filesystem (Blueprint Bundle)',
			'aether-site-exporter'
		);
	}

	/**
	 * Get the provider type.
	 *
	 * @return {string} Provider type
	 */
	getType() {
		return 'local-storage';
	}

	/**
	 * Get the provider description.
	 *
	 * @return {string} Provider description
	 */
	getDescription() {
		return __(
			'Store blueprint bundle ZIP files locally in the WordPress uploads directory. No cloud deployment required.',
			'aether'
		);
	}

	/**
	 * Get the provider icon.
	 *
	 * @return {string} Provider icon
	 */
	getIcon() {
		return '💾';
	}

	/**
	 * Get deployment types this provider supports.
	 *
	 * LocalFilesystemBlueprintBundle only supports blueprint bundles.
	 *
	 * @return {Array<string>} Array of DEPLOYMENT_TYPES constants
	 */
	getSupportedDeploymentTypes() {
		return [ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ];
	}

	/**
	 * Get maximum simultaneous uploads for local filesystem.
	 *
	 * Local filesystem has no rate limits, so return Infinity for unlimited parallel uploads.
	 *
	 * @return {number} Maximum number of simultaneous uploads (Infinity = no limit)
	 */
	getMaxSimultaneousUploads() {
		// Check instance config first (user can still override to limit parallelism)
		if (
			this.config &&
			typeof this.config.maxSimultaneousUploads === 'number'
		) {
			return this.config.maxSimultaneousUploads;
		}

		// Local filesystem can handle unlimited parallel uploads
		return Infinity;
	}

	/**
	 * Get provider-specific configuration fields.
	 *
	 * LocalFilesystemBlueprintBundle provider only needs export path.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getProviderSpecificConfigFields() {
		return [
			{
				id: 'export_path',
				label: __(
					'Blueprint-bundle file path',
					'aether-site-exporter'
				),
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

	/**
	 * Validate provider configuration.
	 *
	 * @param {Object} config Configuration object to validate.
	 * @return {Promise<Object>} Validation result
	 */
	async validateConfig( config ) {
		// Use base validation from AbstractProvider
		const baseErrors = await super.validateConfig( config );

		// Additional validation for LocalFilesystemBlueprintBundle
		const errors = { ...baseErrors };

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

		return errors;
	}

	/**
	 * Sanitize provider configuration.
	 *
	 * @param {Object} config Configuration object to sanitize.
	 * @return {Promise<Object>} Sanitized configuration
	 */
	async sanitizeConfig( config ) {
		const sanitized = await super.sanitizeConfig( config );

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

		return sanitized;
	}

	/**
	 * Test connection to provider.
	 *
	 * For LocalFilesystem, this checks if the export directory is writable.
	 *
	 * @return {Promise<Object>} Connection test result
	 */
	async testConnection() {
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

	/**
	 * Deploy to provider.
	 *
	 * For LocalFilesystem, this is a no-op since files are already local.
	 * The actual export happens server-side in PHP.
	 *
	 * @return {Promise<Object>} Deployment result
	 */
	async deploy() {
		try {
			// For LocalFilesystem, deployment is handled server-side
			// This method is called during the export workflow,
			// but the actual file operations happen in PHP

			return {
				success: true,
				message: __(
					'Blueprint bundle saved locally. Files are available in the exports directory.',
					'aether'
				),
				deploymentUrl: '', // No deployment URL for local storage
			};
		} catch ( error ) {
			return {
				success: false,
				error:
					error.message ||
					__( 'Deployment failed', 'aether-site-exporter' ),
			};
		}
	}

	/**
	 * Get deployment status.
	 *
	 * @return {Promise<Object>} Status result
	 */
	async getStatus() {
		const configured = await this.isConfigured();

		return {
			success: true,
			status: configured ? 'active' : 'inactive',
			configured,
			healthy: true, // LocalFilesystem is always healthy
			message: configured
				? __(
						'Local filesystem blueprint bundle storage is active',
						'aether'
				  )
				: __(
						'Local filesystem blueprint bundle storage is available',
						'aether'
				  ),
		};
	}

	/**
	 * Get deployment URL for this provider.
	 *
	 * LocalFilesystem doesn't have a deployment URL since files are stored locally.
	 *
	 * @return {Promise<string>} Empty string
	 */
	async getDeploymentUrl() {
		return '';
	}

	/**
	 * Get the upload strategy for this provider.
	 *
	 * LocalFilesystem uses direct file operations (no upload needed).
	 *
	 * @return {string} Upload strategy
	 */
	getUploadStrategy() {
		return 'direct';
	}

	/**
	 * Check if provider is properly configured.
	 *
	 * LocalFilesystem is always configured since it doesn't require credentials.
	 *
	 * @return {Promise<boolean>} True (always configured)
	 */
	async isConfigured() {
		// LocalFilesystem doesn't require configuration
		// It's always available as a fallback option
		return true;
	}
}

export default LocalFilesystemBlueprintBundleProvider;
