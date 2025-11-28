/**
 * Provider Configuration Storage
 *
 * Handles provider configuration persistence with REST API backend storage.
 */

import apiFetch from '@altolith/utils/api';
import { applyFilters, doAction } from '@wordpress/hooks';

/**
 * Configuration storage class.
 *
 * Provides REST API persistence for provider configurations.
 */
export class ConfigStorage {
	/**
	 * Provider ID.
	 *
	 * @type {string}
	 */
	providerId;

	/**
	 * Constructor.
	 *
	 * @param {string} providerId Provider ID.
	 */
	constructor( providerId ) {
		if ( ! providerId || typeof providerId !== 'string' ) {
			throw new Error( 'ConfigStorage requires a valid provider ID' );
		}
		this.providerId = providerId;
	}

	/**
	 * Load configuration from REST API.
	 *
	 * @return {Promise<Object>} Configuration object
	 */
	async load() {
		try {
			const response = await apiFetch( {
				path: `/altolith/deploy/providers/${ this.providerId }/config`,
				method: 'GET',
			} );

			let config = response.config || {};

			/**
			 * Filter provider configuration after loading from storage.
			 *
			 * Allows modification of config loaded from REST API.
			 *
			 * @param {Object} config     Loaded configuration.
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('altolith.storage.config.load', 'my-plugin', (config, providerId) => {
			 *     if (providerId === 'my-provider') {
			 *         config.autoLoaded = Date.now();
			 *     }
			 *     return config;
			 * });
			 */
			config = applyFilters(
				'altolith.storage.config.load',
				config,
				this.providerId
			);

			/**
			 * Action fired after configuration is loaded from storage.
			 *
			 * @param {Object} config     Loaded configuration.
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('altolith.storage.config.loaded', 'my-plugin', (config, providerId) => {
			 *     console.log(`Configuration loaded for ${providerId}`);
			 * });
			 */
			doAction(
				'altolith.storage.config.loaded',
				config,
				this.providerId
			);

			return config;
		} catch ( error ) {
			// If provider not configured, return empty object
			if (
				error.code === 'restProviderNotConfigured' ||
				error.status === 404
			) {
				return {};
			}

			// Re-throw other errors
			throw error;
		}
	}

	/**
	 * Save configuration to REST API.
	 *
	 * @param {Object} config Configuration object to save.
	 * @return {Promise<boolean>} True if saved successfully
	 */
	async save( config ) {
		/**
		 * Filter configuration before saving to storage.
		 *
		 * Allows modification of config before REST API call.
		 *
		 * @param {Object} config     Configuration to save.
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('altolith.storage.config.before_save', 'my-plugin', (config, providerId) => {
		 *     if (providerId === 'my-provider') {
		 *         config.lastSaved = Date.now();
		 *     }
		 *     return config;
		 * });
		 */
		config = applyFilters(
			'altolith.storage.config.before_save',
			config,
			this.providerId
		);

		try {
			await apiFetch( {
				path: `/altolith/deploy/providers/${ this.providerId }/config`,
				method: 'POST',
				data: { config },
			} );

			/**
			 * Action fired after configuration is saved to storage.
			 *
			 * @param {Object} config     Saved configuration.
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('altolith.storage.config.saved', 'my-plugin', (config, providerId) => {
			 *     console.log(`Configuration saved for ${providerId}`);
			 * });
			 */
			doAction(
				'altolith.storage.config.saved',
				config,
				this.providerId
			);

			return true;
		} catch ( error ) {
			throw error;
		}
	}

	/**
	 * Delete configuration from REST API.
	 *
	 * @return {Promise<boolean>} True if deleted successfully
	 */
	async delete() {
		/**
		 * Action fired before configuration is deleted from storage.
		 *
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addAction } from '@wordpress/hooks';
		 *
		 * addAction('altolith.storage.config.before_delete', 'my-plugin', (providerId) => {
		 *     console.log(`Deleting configuration for ${providerId}`);
		 * });
		 */
		doAction( 'altolith.storage.config.before_delete', this.providerId );

		try {
			await apiFetch( {
				path: `/altolith/deploy/providers/${ this.providerId }/config`,
				method: 'DELETE',
			} );

			/**
			 * Action fired after configuration is deleted from storage.
			 *
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('altolith.storage.config.deleted', 'my-plugin', (providerId) => {
			 *     console.log(`Configuration deleted for ${providerId}`);
			 * });
			 */
			doAction( 'altolith.storage.config.deleted', this.providerId );

			return true;
		} catch ( error ) {
			throw error;
		}
	}
}

export default ConfigStorage;
