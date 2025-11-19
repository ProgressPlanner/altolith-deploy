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
		// Provider config CRUD.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<provider_id>[a-z0-9_-]+)/config',
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
			'/providers/(?P<provider_id>[a-z0-9_-]+)/status',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getStatus' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Test provider connection.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<provider_id>[a-z0-9_-]+)/test',
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
		$providerId = \sanitize_key($request->get_param('provider_id'));

		// Get provider instance from registry.
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->get($providerId);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				\sprintf(\__('Provider not found: %s', 'aether-site-exporter'), $providerId),
				[ 'status' => 404 ]
			);
		}

		// Get config using provider's get callbacks.
		$config = [];
		$settings = $provider->getSettings();
		foreach ($settings as $field) {
			$fieldName = $field['name'] ?? '';
			if (empty($fieldName)) {
				continue;
			}

			// Handle nested field names like 'foo[bar]'.
			if (\preg_match('/^([^[]+)\[([^\]]+)\]$/', $fieldName, $matches)) {
				$parentKey = $matches[1];
				$childKey = $matches[2];
				if (! isset($config[$parentKey]) || ! \is_array($config[$parentKey])) {
					$config[$parentKey] = [];
				}
				if (isset($field['get']) && \is_callable($field['get'])) {
					try {
						$config[$parentKey][$childKey] = \call_user_func($field['get']);
					} catch (\Exception $e) {
						// If get callback fails, use empty value
						$config[$parentKey][$childKey] = '';
					}
				}
			} else {
				if (isset($field['get']) && \is_callable($field['get'])) {
					try {
						$config[$fieldName] = \call_user_func($field['get']);
					} catch (\Exception $e) {
						// If get callback fails, use empty value
						$config[$fieldName] = '';
					}
				}
			}
		}

		// Decrypt sensitive fields for client.
		$config = $this->decryptSensitiveFields($config);

		/**
		 * Filter provider configuration after loading.
		 *
		 * Allows modification of configuration before sending to client.
		 *
		 * @param array  $config      The provider configuration.
		 * @param string $providerId  The provider ID.
		 *
		 * @example
		 * add_filter('aether_provider_config_load', function($config, $providerId) {
		 *     if ($providerId === 'my-provider') {
		 *         $config['custom_field'] = 'custom value';
		 *     }
		 *     return $config;
		 * }, 10, 2);
		 */
		$config = \apply_filters('aether_provider_config_load', $config, $providerId);

		/**
		 * Action fired after provider configuration is loaded.
		 *
		 * @param string $providerId The provider ID.
		 * @param array  $config     The loaded configuration.
		 */
		\do_action('aether_provider_config_loaded', $providerId, $config);

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
		$providerId = \sanitize_key($request->get_param('provider_id'));
		$config     = $request->get_param('config');

		if (! \is_array($config)) {
			return new WP_Error('invalid_config', \__('Config must be an object.', 'aether-site-exporter'), [ 'status' => 400 ]);
		}

		// Get provider instance from registry.
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->get($providerId);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				\sprintf(\__('Provider not found: %s', 'aether-site-exporter'), $providerId),
				[ 'status' => 404 ]
			);
		}

		/**
		 * Filter provider configuration before saving.
		 *
		 * Allows modification of configuration before sanitization and encryption.
		 *
		 * @param array  $config      The provider configuration to save.
		 * @param string $providerId  The provider ID.
		 *
		 * @example
		 * add_filter('aether_provider_config_save', function($config, $providerId) {
		 *     if ($providerId === 'my-provider') {
		 *         $config['custom_field'] = 'processed value';
		 *     }
		 *     return $config;
		 * }, 10, 2);
		 */
		$config = \apply_filters('aether_provider_config_save', $config, $providerId);

		// Use provider's sanitize and set callbacks.
		$settings = $provider->getSettings();
		$sanitized = [];

		foreach ($settings as $field) {
			$fieldName = $field['name'] ?? '';
			if (empty($fieldName)) {
				continue;
			}

			// Skip hidden fields - they're not editable and shouldn't be saved from form submissions
			if (isset($field['hidden']) && $field['hidden'] === true) {
				continue;
			}

			// Handle nested field names like 'foo[bar]'.
			if (\preg_match('/^([^[]+)\[([^\]]+)\]$/', $fieldName, $matches)) {
				$parentKey = $matches[1];
				$childKey = $matches[2];
				$value = $config[$parentKey][$childKey] ?? null;

				// Sanitize using provider's callback.
				if (isset($field['sanitize_callback']) && \is_callable($field['sanitize_callback'])) {
					try {
						$value = \call_user_func($field['sanitize_callback'], $value);
					} catch (\Exception $e) {
						// If sanitization fails, skip this field
						continue;
					}
				}

				// Save using provider's set callback.
				if (isset($field['set']) && \is_callable($field['set'])) {
					try {
						\call_user_func($field['set'], $value);
					} catch (\Exception $e) {
						// Log error but continue with other fields
						if (\defined('WP_DEBUG') && WP_DEBUG) {
							\error_log(\sprintf(
								'Aether: Failed to save field %s[%s] for provider %s: %s',
								$parentKey,
								$childKey,
								$providerId,
								$e->getMessage()
							));
						}
					}
				}

				// Also store in sanitized array for encryption.
				if (! isset($sanitized[$parentKey]) || ! \is_array($sanitized[$parentKey])) {
					$sanitized[$parentKey] = [];
				}
				$sanitized[$parentKey][$childKey] = $value;
			} else {
				$value = $config[$fieldName] ?? null;

				// Sanitize using provider's callback.
				if (isset($field['sanitize_callback']) && \is_callable($field['sanitize_callback'])) {
					try {
						$value = \call_user_func($field['sanitize_callback'], $value);
					} catch (\Exception $e) {
						// If sanitization fails, skip this field
						continue;
					}
				}

				// Save using provider's set callback.
				if (isset($field['set']) && \is_callable($field['set'])) {
					try {
						\call_user_func($field['set'], $value);
					} catch (\Exception $e) {
						// Log error but continue with other fields
						if (\defined('WP_DEBUG') && WP_DEBUG) {
							\error_log(\sprintf(
								'Aether: Failed to save field %s for provider %s: %s',
								$fieldName,
								$providerId,
								$e->getMessage()
							));
						}
					}
				}

				// Also store in sanitized array for encryption.
				$sanitized[$fieldName] = $value;
			}
		}

		/**
		 * Filter provider-specific configuration after sanitization.
		 *
		 * Allows provider-specific sanitization logic before encryption.
		 *
		 * @param array  $sanitized  The sanitized configuration.
		 * @param string $providerId The provider ID.
		 *
		 * @example
		 * add_filter('aether_provider_my-provider_sanitize', function($config) {
		 *     // Add provider-specific validation
		 *     if (empty($config['required_field'])) {
		 *         $config['required_field'] = 'default_value';
		 *     }
		 *     return $config;
		 * });
		 */
		$sanitized = \apply_filters("aether_provider_{$providerId}_sanitize", $sanitized, $providerId);

		// Encrypt sensitive fields and save to options for backward compatibility.
		$encrypted = $this->encryptSensitiveFields($sanitized);
		$settingsOption = \get_option('aether_site_exporter_settings', []);
		if (! isset($settingsOption['providers']) || ! \is_array($settingsOption['providers'])) {
			$settingsOption['providers'] = [];
		}
		$settingsOption['providers'][$providerId] = $encrypted;
		\update_option('aether_site_exporter_settings', $settingsOption);

		/**
		 * Action fired after provider configuration is saved.
		 *
		 * @param string $providerId The provider ID.
		 * @param array  $config     The saved configuration (decrypted for hook access).
		 *
		 * @example
		 * add_action('aether_provider_config_saved', function($providerId, $config) {
		 *     error_log("Provider {$providerId} configuration updated");
		 * }, 10, 2);
		 */
		\do_action('aether_provider_config_saved', $providerId, $sanitized);

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
		$providerId = \sanitize_key($request->get_param('provider_id'));

		/**
		 * Action fired before provider configuration is deleted.
		 *
		 * Allows cleanup or validation before deletion.
		 *
		 * @param string $providerId The provider ID being deleted.
		 *
		 * @example
		 * add_action('aether_provider_config_before_delete', function($providerId) {
		 *     // Clean up associated resources
		 *     delete_option("my_provider_{$providerId}_cache");
		 * });
		 */
		\do_action('aether_provider_config_before_delete', $providerId);

		// Delete from aether_settings['providers'][providerId]
		$settings = \get_option('aether_site_exporter_settings', []);
		if (isset($settings['providers'][$providerId])) {
			unset($settings['providers'][$providerId]);
			\update_option('aether_site_exporter_settings', $settings);
		}

		/**
		 * Action fired after provider configuration is deleted.
		 *
		 * @param string $providerId The provider ID that was deleted.
		 *
		 * @example
		 * add_action('aether_provider_config_deleted', function($providerId) {
		 *     error_log("Provider {$providerId} configuration removed");
		 * });
		 */
		\do_action('aether_provider_config_deleted', $providerId);

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
		$providerId = \sanitize_key($request->get_param('provider_id'));

		// Check provider config in aether_settings (where settings are actually stored)
		$settings = \get_option('aether_site_exporter_settings', []);
		$providers = $settings['providers'] ?? [];
		$config = $providers[ $providerId ] ?? [];

		// Check if provider is configured by verifying required fields exist
		$configured = $this->isProviderConfigured($providerId, $config);

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
	 * @param string         $providerId Provider ID.
	 * @param array<string, mixed> $config     Provider configuration.
	 * @return bool True if configured, false otherwise.
	 */
	private function isProviderConfigured(string $providerId, array $config): bool
	{
		if (empty($config)) {
			return false;
		}

		// Decrypt config to check actual values (encrypted values are non-empty strings)
		$decryptedConfig = $this->decryptSensitiveFields($config);

		// For local filesystem provider, check if config has any non-empty values
		$hasValues = false;
		foreach ($decryptedConfig as $value) {
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
		$providerId = \sanitize_key($request->get_param('provider_id'));

		// Get provider instance from registry.
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->get($providerId);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				\sprintf(\__('Provider not found: %s', 'aether-site-exporter'), $providerId),
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
					\sprintf(\__('Export directory not found: %s', 'aether-site-exporter'), $exportDir),
					[ 'status' => 404 ]
				);
			}

			if (! \is_writable($exportDir)) {
				return new WP_Error(
					'export_dir_not_writable',
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
			\sprintf(\__('Connection testing is not implemented for provider: %s', 'aether-site-exporter'), $providerId),
			[ 'status' => 501 ]
		);
	}
}
