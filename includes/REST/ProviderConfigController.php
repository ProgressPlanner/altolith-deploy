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

		// Copy configuration from another instance.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<target_id>[a-z0-9_:-]+)/copy-from/(?P<source_id>[a-z0-9_:-]+)',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'copyConfig' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'target_fields' => [
						'required' => true,
						'type'     => 'array',
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

		// Validate instance ID format: {provider_type}:{uuid}
		if (! $this->isValidInstanceId($instanceId)) {
			return new WP_Error(
				'invalid_instance_id',
				/* translators: %s: Provider instance ID */
				\sprintf(\__('Invalid instance ID format: %s. Expected format: provider_type:uuid', 'aether-site-exporter'), $instanceId),
				[ 'status' => 400 ]
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

		// Validate instance ID format: {provider_type}:{uuid}
		if (! $this->isValidInstanceId($instanceId)) {
			return new WP_Error(
				'invalid_instance_id',
				/* translators: %s: Provider instance ID */
				\sprintf(\__('Invalid instance ID format: %s. Expected format: provider_type:uuid', 'aether-site-exporter'), $instanceId),
				[ 'status' => 400 ]
			);
		}

		// Ensure provider_type and instance_name are preserved.
		$parsed = $this->parseInstanceId($instanceId);
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
	 * Copy configuration from one provider instance to another.
	 *
	 * Copies configuration fields from source instance to be used in target instance.
	 * Only copies fields that exist in the target_fields array.
	 * Decrypts sensitive fields from source so they can be used in target form.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function copyConfig(WP_REST_Request $request)
	{
		$targetId = $request->get_param('target_id');
		$sourceId = $request->get_param('source_id');
		$targetFields = $request->get_param('target_fields');

		// Validate instance ID formats.
		if (! $this->isValidInstanceId($targetId)) {
			return new WP_Error(
				'invalid_target_id',
				/* translators: %s: Provider instance ID */
				\sprintf(\__('Invalid target instance ID format: %s', 'aether-site-exporter'), $targetId),
				[ 'status' => 400 ]
			);
		}

		if (! $this->isValidInstanceId($sourceId)) {
			return new WP_Error(
				'invalid_source_id',
				/* translators: %s: Provider instance ID */
				\sprintf(\__('Invalid source instance ID format: %s', 'aether-site-exporter'), $sourceId),
				[ 'status' => 400 ]
			);
		}

		// Prevent copying to self.
		if ($targetId === $sourceId) {
			return new WP_Error(
				'same_instance',
				\__('Cannot copy configuration to the same instance.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Check provider family compatibility.
		$targetParsed = $this->parseInstanceId($targetId);
		$sourceParsed = $this->parseInstanceId($sourceId);

		if (! $targetParsed || ! $sourceParsed) {
			return new WP_Error(
				'invalid_instance_format',
				\__('Could not parse instance IDs.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$targetFamily = $this->getProviderFamily($targetParsed['provider_type']);
		$sourceFamily = $this->getProviderFamily($sourceParsed['provider_type']);

		if ($targetFamily !== $sourceFamily) {
			return new WP_Error(
				'incompatible_providers',
				/* translators: 1: Target provider family, 2: Source provider family */
				\sprintf(
					/* translators: 1: Target provider family, 2: Source provider family */
					\__('Cannot copy configuration between incompatible provider families: %1$s and %2$s', 'aether-site-exporter'),
					$targetFamily,
					$sourceFamily
				),
				[ 'status' => 400 ]
			);
		}

		// Get source config from database.
		$settings = \get_option('aether_site_exporter_settings', []);
		$sourceConfig = $settings['providers'][$sourceId] ?? [];

		if (empty($sourceConfig)) {
			return new WP_Error(
				'source_not_found',
				/* translators: %s: Source instance ID */
				\sprintf(\__('Source instance not found: %s', 'aether-site-exporter'), $sourceId),
				[ 'status' => 404 ]
			);
		}

		// Decrypt sensitive fields from source.
		$decryptedSource = $this->decryptSensitiveFields($sourceConfig);

		// Filter to only fields that exist in target_fields array.
		$copiedFields = [];
		$skippedFields = [];

		foreach ($decryptedSource as $key => $value) {
			// Skip metadata fields.
			if (\in_array($key, ['provider_type', 'instance_name'], true)) {
				$skippedFields[] = $key;
				continue;
			}

			// Only copy fields that the target provider uses.
			if (\in_array($key, $targetFields, true)) {
				$copiedFields[$key] = $value;
			} else {
				$skippedFields[] = $key;
			}
		}

		/**
		 * Filter copied configuration fields.
		 *
		 * @param array  $copiedFields  Fields being copied.
		 * @param string $sourceId      Source instance ID.
		 * @param string $targetId      Target instance ID.
		 * @param array  $targetFields  Target provider's field IDs.
		 */
		$copiedFields = \apply_filters(
			'aether_provider_config_copy',
			$copiedFields,
			$sourceId,
			$targetId,
			$targetFields
		);

		return new WP_REST_Response(
			[
				'success'       => true,
				'copiedFields'  => $copiedFields,
				'skippedFields' => $skippedFields,
			],
			200
		);
	}

	/**
	 * Extract provider family from provider type.
	 *
	 * Provider families are determined by removing known deployment type suffixes.
	 * Examples:
	 * - 'cloudflare-r2-static-site' → 'cloudflare-r2'
	 * - 'local-filesystem-blueprint-bundle' → 'local-filesystem'
	 *
	 * @param string $providerType Provider type identifier.
	 * @return string Provider family.
	 */
	private function getProviderFamily(string $providerType): string
	{
		$suffixes = ['-static-site', '-blueprint-bundle', '-edge-functions'];

		foreach ($suffixes as $suffix) {
			if (\str_ends_with($providerType, $suffix)) {
				return \substr($providerType, 0, -\strlen($suffix));
			}
		}

		return $providerType;
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
	 * Validate instance ID format.
	 *
	 * Instance IDs have format: {provider_type}:{uuid}
	 * Example: "local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890"
	 *
	 * @param string $instanceId Instance ID to validate.
	 * @return bool True if valid format, false otherwise.
	 */
	private function isValidInstanceId(string $instanceId): bool
	{
		if (empty($instanceId)) {
			return false;
		}

		// Check format: provider_type:uuid
		// Provider type: lowercase alphanumeric, hyphens, underscores
		// UUID: standard UUID v4 format
		return (bool) \preg_match(
			'/^[a-z0-9_-]+:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
			$instanceId
		);
	}

	/**
	 * Parse instance ID into provider type and UUID.
	 *
	 * Instance IDs have format: {provider_type}:{uuid}
	 * Example: "local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890"
	 *
	 * @param string $instanceId Instance ID to parse.
	 * @return array{provider_type: string, uuid: string}|null Parsed components or null if invalid format.
	 */
	private function parseInstanceId(string $instanceId): ?array
	{
		$parts = \explode(':', $instanceId, 2);
		if (\count($parts) !== 2 || empty($parts[0]) || empty($parts[1])) {
			return null;
		}

		return [
			'provider_type' => $parts[0],
			'uuid' => $parts[1],
		];
	}
}
