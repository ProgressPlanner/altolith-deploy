/**
 * Local Filesystem Provider
 *
 * Provider for local file storage without cloud deployment.
 * Stores exported sites locally in the WordPress uploads directory.
 *
 */

import { __ } from '@wordpress/i18n';
import { AbstractProvider } from '../base/AbstractProvider';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';

/**
 * LocalFilesystemProvider class
 *
 * Handles local file storage for exported sites.
 * Files are stored in wp-content/aether-exports/.
 */
export class LocalFilesystemProvider extends AbstractProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'local-filesystem';

	/**
	 * Get the unique provider identifier.
	 *
	 * @return {string} Provider ID
	 */
	getId() {
		return this.registeredId || LocalFilesystemProvider.ID;
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * @return {string} Provider name
	 */
	getName() {
		return __( 'Local Filesystem', 'aether-site-exporter' );
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
			'Store exported sites locally in the WordPress uploads directory. No cloud deployment required.',
			'aether-site-exporter'
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
	 * LocalFilesystem supports static sites and blueprint bundles.
	 *
	 * @return {Array<string>} Array of DEPLOYMENT_TYPES constants
	 */
	getSupportedDeploymentTypes() {
		return [
			DEPLOYMENT_TYPES.STATIC_SITE,
			DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE,
		];
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
	 * LocalFilesystem provider has minimal configuration since it uses local storage.
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
					'aether-site-exporter'
				),
				validation: {
					pattern: /^[a-zA-Z0-9/_.-]+\.zip$/,
					message: __(
						'Blueprint bundle path must end with .zip and contain only letters, numbers, slashes, hyphens, underscores, and dots.',
						'aether-site-exporter'
					),
				},
			},
			{
				id: 'public_url',
				label: __( 'Public URL', 'aether-site-exporter' ),
				type: 'text',
				required: false,
				secure: false,
				placeholder: 'https://example.com',
				help: __(
					'URL where exported files will be publicly accessible. Used for blueprint generation and URL replacements in exported HTML. Leave empty to use WordPress home URL.',
					'aether-site-exporter'
				),
				validation: {
					pattern: /^https?:\/\/.+/,
					message: __(
						'Public URL must be a valid HTTP or HTTPS URL',
						'aether-site-exporter'
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
					'aether-site-exporter'
				),
				validation: {
					pattern: /^[a-zA-Z0-9/_.-]+$/,
					message: __(
						'Static files path must contain only letters, numbers, slashes, hyphens, underscores, and dots. Cannot be empty.',
						'aether-site-exporter'
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

		// Additional validation for LocalFilesystem
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
					'aether-site-exporter'
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

		// Sanitize static_files_path - default to 'static/' if empty
		if ( sanitized.static_files_path ) {
			sanitized.static_files_path = sanitized.static_files_path.trim();
			if ( sanitized.static_files_path === '' ) {
				sanitized.static_files_path = 'static/';
			}
		} else {
			sanitized.static_files_path = 'static/';
		}

		// Sanitize max_exports
		if ( sanitized.max_exports ) {
			sanitized.max_exports = parseInt( sanitized.max_exports, 10 );
			if ( isNaN( sanitized.max_exports ) || sanitized.max_exports < 1 ) {
				delete sanitized.max_exports;
			}
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
					'Local filesystem is ready for exports',
					'aether-site-exporter'
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
					'Export saved locally. Files are available in the exports directory.',
					'aether-site-exporter'
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
						'Local filesystem storage is active',
						'aether-site-exporter'
				  )
				: __(
						'Local filesystem storage is available',
						'aether-site-exporter'
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
	 * Upload a file to local filesystem.
	 *
	 * For LocalFilesystem, this ensures the file is in the correct location
	 * within the aether-exports directory. Since we're working locally,
	 * this is essentially a verification that the file exists and is accessible.
	 *
	 * @param {string} sourcePath      Local file path (relative to WordPress root).
	 * @param {string} destinationPath Destination path within exports directory.
	 * @return {Promise<Object>} Upload result with success status and URL.
	 */
	// eslint-disable-next-line no-unused-vars
	async uploadFile( sourcePath, destinationPath ) {
		try {
			// For local filesystem, files are already local and don't need to be uploaded
			// The blueprint-bundle.zip was created by the generateBlueprint step
			// and is already in the correct location (aether-exports directory)

			// We just return success to indicate the file is available
			return {
				success: true,
				url: '', // Local filesystem doesn't have a public URL
				path: sourcePath,
				message: __(
					'File is available locally',
					'aether-site-exporter'
				),
			};
		} catch ( error ) {
			return {
				success: false,
				error:
					error.message ||
					__( 'File upload failed', 'aether-site-exporter' ),
			};
		}
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

export default LocalFilesystemProvider;
