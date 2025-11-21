<?php

/**
 * Provider Configuration REST Controller
 *
 * Handles CRUD operations for provider configurations.
 * Server-side encryption for sensitive fields (tokens, keys, secrets).
 * React handles client-side validation; PHP provides security layer.
 *
 * IMPORTANT: This controller provides essential endpoints still used by React:
 * - /providers/{id}/config - GET/POST/DELETE (configStorage.js, credentialManager.js)
 * - /providers/{id}/status - GET (useProviderStatus.js, usePublishReadiness.js)
 * - /providers/{id}/test - POST (useConnectionTest.js)
 * - /providers/{id}/edge/worker-script/{type} - GET (edgeService.js, useEdgeService.js)
 * - /providers/{id}/settings - GET/POST (useProviderSettings.js)
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Aether\SiteExporter\Utilities\CredentialEncryption;
use Aether\SiteExporter\Utilities\EncryptionHelper;
use Aether\SiteExporter\Providers\ProviderRegistry;

/**
 * Provider configuration REST endpoints.
 */
class ProviderConfigController
{
	use RESTHelpersTrait;
	use EncryptionHelper;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Provider config CRUD (instance_id format: provider_type:uuid).
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<instance_id>[a-z0-9_:-]+)/config',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'getConfig' ],
					'permission_callback' => [ $this, 'permissionCheck' ],
				],
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'saveConfig' ],
					'permission_callback' => [ $this, 'permissionCheck' ],
					'args'                => [
						'config' => [
							'required' => true,
							'type'     => 'object',
						],
					],
				],
				[
					'methods'             => 'DELETE',
					'callback'            => [ $this, 'deleteConfig' ],
					'permission_callback' => [ $this, 'permissionCheck' ],
				],
			]
		);

		// Get provider status (configured or not).
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<instance_id>[a-z0-9_:-]+)/status',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getStatus' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Test provider connection.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<instance_id>[a-z0-9_:-]+)/test',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'testConnection' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'config' => [
						'required' => false,
						'type'     => 'object',
					],
				],
			]
		);
	}

	/**
	 * Get provider configuration.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function getConfig(WP_REST_Request $request)
	{
		$instanceId = $request->get_param('instance_id');

		// Get provider instance from registry using instance ID.
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->getProviderForInstance($instanceId);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				/* translators: %s: Provider instance ID */
				\sprintf(\__('Provider not found for instance: %s', 'aether-site-exporter'), $instanceId),
				[ 'status' => 404 ]
			);
		}

		// Get config from database.
		$settings = \get_option('aether_site_exporter_settings', []);
		$config = $settings['providers'][$instanceId] ?? [];

		// Decrypt sensitive fields for client.
		$config = $this->decryptSensitiveFields($config);

		/**
		 * Filter provider configuration after loading.
		 *
		 * @param array  $config      The provider configuration.
		 * @param string $instanceId  The instance ID.
		 *
		 * @example
		 * add_filter('aether_provider_config_load', function($config, $instanceId) {
		 *     if (str_starts_with($instanceId, 'my-provider:')) {
		 *         $config['custom_field'] = 'custom value';
		 *     }
		 *     return $config;
		 * }, 10, 2);
		 */
		$config = \apply_filters('aether_provider_config_load', $config, $instanceId);

		/**
		 * Action fired after provider configuration is loaded.
		 *
		 * @param string $instanceId The instance ID.
		 * @param array  $config     The loaded configuration.
		 */
		\do_action('aether_provider_config_loaded', $instanceId, $config);

		return new WP_REST_Response(
			[
				'success' => true,
				'config'  => $config,
			],
			200
		);
	}

	/**
	 * Save provider configuration.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function saveConfig(WP_REST_Request $request)
	{
		$instanceId = $request->get_param('instance_id');
		$config     = $request->get_param('config');

		if (! \is_array($config)) {
			return new WP_Error('invalid_config', \__('Config must be an object.', 'aether-site-exporter'), [ 'status' => 400 ]);
		}

		// Get provider instance from registry using instance ID.
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->getProviderForInstance($instanceId);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				/* translators: %s: Provider instance ID */
				\sprintf(\__('Provider not found for instance: %s', 'aether-site-exporter'), $instanceId),
				[ 'status' => 404 ]
			);
		}

		// Ensure provider_type and instance_name are preserved.
		$parsed = $registry->parseInstanceId($instanceId);
		if ($parsed) {
			$config['provider_type'] = $parsed['provider_type'];
		}

		/**
		 * Filter provider configuration before saving.
		 *
		 * @param array  $config      The provider configuration to save.
		 * @param string $instanceId  The instance ID.
		 *
		 * @example
		 * add_filter('aether_provider_config_save', function($config, $instanceId) {
		 *     if (str_starts_with($instanceId, 'my-provider:')) {
		 *         $config['custom_field'] = 'processed value';
		 *     }
		 *     return $config;
		 * }, 10, 2);
		 */
		$config = \apply_filters('aether_provider_config_save', $config, $instanceId);

		// Sanitize config recursively.
		$sanitized = $this->sanitizeConfig($config);

		// Encrypt sensitive fields and save to options.
		$encrypted = $this->encryptSensitiveFields($sanitized);
		$settingsOption = \get_option('aether_site_exporter_settings', []);
		if (! isset($settingsOption['providers']) || ! \is_array($settingsOption['providers'])) {
			$settingsOption['providers'] = [];
		}
		$settingsOption['providers'][$instanceId] = $encrypted;
		\update_option('aether_site_exporter_settings', $settingsOption);

		/**
		 * Action fired after provider configuration is saved.
		 *
		 * @param string $instanceId The instance ID.
		 * @param array  $config     The saved configuration (decrypted for hook access).
		 *
		 * @example
		 * add_action('aether_provider_config_saved', function($instanceId, $config) {
		 *     error_log("Instance {$instanceId} configuration updated");
		 * }, 10, 2);
		 */
		\do_action('aether_provider_config_saved', $instanceId, $sanitized);

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Provider configuration saved successfully.', 'aether-site-exporter'),
			],
			200
		);
	}

	/**
	 * Delete provider configuration.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function deleteConfig(WP_REST_Request $request)
	{
		$instanceId = $request->get_param('instance_id');

		/**
		 * Action fired before provider configuration is deleted.
		 *
		 * Allows cleanup or validation before deletion.
		 *
		 * @param string $instanceId The instance ID being deleted.
		 *
		 * @example
		 * add_action('aether_provider_config_before_delete', function($instanceId) {
		 *     // Clean up associated resources
		 *     delete_option("my_provider_{$instanceId}_cache");
		 * });
		 */
		\do_action('aether_provider_config_before_delete', $instanceId);

		// Delete from aether_settings['providers'][instanceId]
		$settings = \get_option('aether_site_exporter_settings', []);
		if (isset($settings['providers'][$instanceId])) {
			unset($settings['providers'][$instanceId]);
			\update_option('aether_site_exporter_settings', $settings);
		}

		/**
		 * Action fired after provider configuration is deleted.
		 *
		 * @param string $instanceId The instance ID that was deleted.
		 *
		 * @example
		 * add_action('aether_provider_config_deleted', function($instanceId) {
		 *     error_log("Instance {$instanceId} configuration removed");
		 * });
		 */
		\do_action('aether_provider_config_deleted', $instanceId);

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Provider configuration deleted successfully.', 'aether-site-exporter'),
			],
			200
		);
	}

	/**
	 * Sanitize configuration array recursively with depth limit.
	 *
	 * Preserves snake_case keys (unlike sanitize_key which converts to lowercase).
	 * Prevents stack overflow by limiting recursion to 10 levels.
	 *
	 * @param array<string, mixed> $config Configuration to sanitize.
	 * @param int                  $depth  Current recursion depth.
	 * @return array<string, mixed> Sanitized configuration.
	 */
	protected function sanitizeConfig(array $config, int $depth = 0): array
	{
		// Prevent stack overflow attacks by limiting recursion depth
		if ($depth > 10) {
			return [];
		}

		$sanitized = [];

		foreach ($config as $key => $value) {
			// Preserve case for snake_case keys instead of lowercasing with sanitize_key()
			// Allow alphanumeric, underscore, and hyphen
			$sanitizedKey = \preg_replace('/[^a-zA-Z0-9_-]/', '', $key);

			// Skip empty keys after sanitization
			if ('' === $sanitizedKey) {
				continue;
			}

			if (\is_array($value)) {
				$sanitized[ $sanitizedKey ] = $this->sanitizeConfig($value, $depth + 1);
			} elseif (\is_bool($value)) {
				$sanitized[ $sanitizedKey ] = (bool) $value;
			} elseif (\is_numeric($value)) {
				$sanitized[ $sanitizedKey ] = $value;
			} elseif (\is_string($value) && \preg_match('/^https?:\/\//i', $value)) {
				$sanitized[ $sanitizedKey ] = \esc_url_raw($value);
			} else {
				$sanitized[ $sanitizedKey ] = \sanitize_text_field($value);
			}
		}

		/**
		 * Filter sanitized configuration values.
		 *
		 * Allows custom sanitization rules for specific configuration fields.
		 *
		 * @param array $sanitized The sanitized configuration array.
		 * @param array $config    The original (unsanitized) configuration array.
		 * @param int   $depth     Current recursion depth.
		 *
		 * @example
		 * add_filter('aether_provider_config_sanitize', function($sanitized, $config, $depth) {
		 *     // Only process at root level
		 *     if ($depth === 0 && isset($sanitized['custom_field'])) {
		 *         $sanitized['custom_field'] = strtoupper($sanitized['custom_field']);
		 *     }
		 *     return $sanitized;
		 * }, 10, 3);
		 */
		return \apply_filters('aether_provider_config_sanitize', $sanitized, $config, $depth);
	}

	/**
	 * Get provider status (configured or not).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with provider status.
	 */
	public function getStatus(WP_REST_Request $request)
	{
		$instanceId = $request->get_param('instance_id');

		// Check provider config in aether_settings (where settings are actually stored)
		$settings = \get_option('aether_site_exporter_settings', []);
		$providers = $settings['providers'] ?? [];
		$config = $providers[ $instanceId ] ?? [];

		// Check if provider is configured by verifying required fields exist
		$configured = $this->isProviderConfigured($instanceId, $config);

		return new WP_REST_Response(
			[
				'success'    => true,
				'configured' => $configured,
			],
			200
		);
	}

	/**
	 * Check if provider has required configuration fields filled.
	 *
	 * @param string         $instanceId Instance ID.
	 * @param array<string, mixed> $config     Provider configuration.
	 * @return bool True if configured, false otherwise.
	 */
	private function isProviderConfigured(string $instanceId, array $config): bool
	{
		if (empty($config)) {
			return false;
		}

		// Decrypt config to check actual values (encrypted values are non-empty strings)
		$decryptedConfig = $this->decryptSensitiveFields($config);

		// Check if config has any non-empty values (excluding meta fields)
		$hasValues = false;
		foreach ($decryptedConfig as $key => $value) {
			if (\in_array($key, ['provider_type', 'instance_name'], true)) {
				continue;
			}
			if (! empty($value) && ! \is_array($value)) {
				$hasValues = true;
				break;
			}
		}
		return $hasValues;
	}

	/**
	 * Test provider connection.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function testConnection(WP_REST_Request $request)
	{
		$instanceId = $request->get_param('instance_id');

		// Get provider instance from registry using instance ID.
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->getProviderForInstance($instanceId);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				/* translators: %s: Provider instance ID */
				\sprintf(\__('Provider not found for instance: %s', 'aether-site-exporter'), $instanceId),
				[ 'status' => 404 ]
			);
		}

		// For local filesystem provider, verify export directory is writable.
		// This check is provider-specific, so we check by provider type.
		if ($provider->getType() === 'local-storage') {
			$exportDir = \trailingslashit(WP_CONTENT_DIR) . 'aether-exports';

			// Check if directory exists and is writable
			if (! \file_exists($exportDir)) {
				return new WP_Error(
					'export_dir_not_found',
					/* translators: %s: Export directory path */
					\sprintf(\__('Export directory not found: %s', 'aether-site-exporter'), $exportDir),
					[ 'status' => 404 ]
				);
			}

			if (! \is_writable($exportDir)) {
				return new WP_Error(
					'export_dir_not_writable',
					/* translators: %s: Export directory path */
					\sprintf(\__('Export directory is not writable: %s', 'aether-site-exporter'), $exportDir),
					[ 'status' => 500 ]
				);
			}

			return new WP_REST_Response(
				[
					'success' => true,
					'message' => \__('Local filesystem is ready for exports', 'aether-site-exporter'),
				],
				200
			);
		}

		// For other providers, return not implemented
		return new WP_Error(
			'not_implemented',
			/* translators: %s: Provider ID */
			\sprintf(\__('Connection testing is not implemented for provider: %s', 'aether-site-exporter'), $provider->getId()),
			[ 'status' => 501 ]
		);
	}
}
