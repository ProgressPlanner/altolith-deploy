<?php

/**
 * Settings REST Controller
 *
 * Handles REST API endpoints for plugin settings.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Aether\SiteExporter\Utilities\EncryptionHelper;

/**
 * Handles REST API endpoints for settings operations.
 */
class SettingsController
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
		// Get plugin settings.
		\register_rest_route(
			$this->getNamespace(),
			'/settings',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getSettings' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'key' => [
						'required'          => false,
						'type'              => 'string',
						'description'       => \__('Setting key (top-level only, e.g., "providers")', 'aether-site-exporter'),
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);

		// Update plugin settings.
		\register_rest_route(
			$this->getNamespace(),
			'/settings',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'updateSettings' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'key' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Setting key (top-level only, e.g., "providers")', 'aether-site-exporter'),
						'sanitize_callback' => 'sanitize_text_field',
					],
					'value' => [
						'required'    => true,
						'description' => \__('Setting value (can be nested array)', 'aether-site-exporter'),
					],
				],
			]
		);

		// Create provider instance.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<provider_type>[a-z0-9_-]+)/instances',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'createProviderInstance' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'provider_type' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Provider type (e.g., "cloudflare-r2")', 'aether-site-exporter'),
						'sanitize_callback' => 'sanitize_key',
					],
					'instance_id' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Instance ID (format: provider_type:uuid)', 'aether-site-exporter'),
						'sanitize_callback' => 'sanitize_text_field',
					],
					'instance_name' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('User-friendly instance name', 'aether-site-exporter'),
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
	}

	/**
	 * Get plugin settings.
	 *
	 * Returns raw settings without transformation.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response with settings or error.
	 */
	public function getSettings(WP_REST_Request $request)
	{
		$key = $request->get_param('key');
		$settings = \get_option('aether_site_exporter_settings', []);

		// If no key specified, return all settings.
		if (empty($key)) {
			// Decrypt provider settings if present
			if (isset($settings['providers']) && \is_array($settings['providers'])) {
				$settings['providers'] = $this->decryptProviderSettings($settings['providers']);
			}
			$sanitizedSettings = $this->sanitizeSettingsForResponse($settings);
			return new WP_REST_Response(
				[
					'success'  => true,
					'settings' => $sanitizedSettings,
				],
				200
			);
		}

		// Get top-level key only (no dot notation).
		$value = $settings[ $key ] ?? null;

		if (\is_array($value)) {
			// Decrypt provider settings if this is the providers key
			if ($key === 'providers') {
				$value = $this->decryptProviderSettings($value);
			}
			$value = $this->sanitizeSettingsForResponse($value);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'key'     => $key,
				'value'   => $value,
			],
			200
		);
	}

	/**
	 * Update plugin settings.
	 *
	 * Accepts raw data structures. Only accepts top-level keys (no dot notation).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function updateSettings(WP_REST_Request $request)
	{
		$key   = $request->get_param('key');
		$value = $request->get_param('value');

		if (empty($key)) {
			return new WP_Error(
				'missing_key',
				\__('Setting key is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Get current settings.
		$settings = \get_option('aether_site_exporter_settings', []);

		// If updating providers, merge with existing providers to preserve other provider configs
		// This ensures that updating one provider doesn't remove
		// configuration from other providers.
		if ($key === 'providers' && \is_array($value)) {
			// Get existing providers to merge with
			$existingProviders = $settings['providers'] ?? [];

			// Decrypt existing providers before merging (they're encrypted in the database)
			// The incoming $value is already decrypted (from API response)
			if (!empty($existingProviders) && \is_array($existingProviders)) {
				try {
					$existingProviders = $this->decryptProviderSettings($existingProviders);
				} catch (\Exception $e) {
					// If decryption fails, use empty array (shouldn't happen, but be safe)
					$existingProviders = [];
				}
			}

			// Ensure both are arrays before merging
			if (!\is_array($existingProviders)) {
				$existingProviders = [];
			}
			// At this point, both $existingProviders and $value are guaranteed to be arrays.
			/** @var array<string, mixed> $existingProviders */
			/** @var array<string, mixed> $value */

			// Input validation: Limit number of providers and config size to prevent DoS attacks
			$maxProviders = 50; // Maximum 50 provider configurations
			$maxConfigSize = 100; // Maximum 100 fields per provider config (recursive count)

			// $value is guaranteed to be array from PHPDoc above
			if (\count($value) > $maxProviders) {
				return new WP_Error(
					'too_many_providers',
					\sprintf(
						/* translators: %d: Maximum number of providers */
						\__('Too many provider configurations. Maximum allowed: %d', 'aether-site-exporter'),
						$maxProviders
					),
					['status' => 400]
				);
			}

			// Validate each provider config size
			foreach ($value as $providerId => $config) {
				if (\is_array($config) && \count($config, COUNT_RECURSIVE) > $maxConfigSize) {
					return new WP_Error(
						'provider_config_too_large',
						\sprintf(
							/* translators: 1: Provider ID, 2: Maximum number of fields */
							\__('Provider configuration "%1$s" is too large. Maximum allowed fields: %2$d', 'aether-site-exporter'),
							\sanitize_text_field((string) $providerId),
							$maxConfigSize
						),
						['status' => 400]
					);
				}
			}

			// Deep merge provider configs to preserve existing fields
			// This ensures that updating one provider doesn't lose other fields
			$value = $this->deepMergeProviderConfigs($existingProviders, $value);

			try {
				$value = $this->sanitizeProviderSettings($value);
				$value = $this->encryptProviderSettings($value);
			} catch (\Exception $e) {
				// Sanitize exception message to prevent information disclosure
				$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());

				return new WP_Error(
					'encryption_failed',
					/* translators: %s: Error message */
					\sprintf(\__('Failed to encrypt provider settings: %s', 'aether-site-exporter'), $sanitizedMessage),
					[ 'status' => 500 ]
				);
			}
		}

		// Set top-level key only (no dot notation).
		$settings[ $key ] = $value;

		// Update settings.
		$result = \update_option('aether_site_exporter_settings', $settings);

		// update_option returns false if value hasn't changed, which is not an error
		if ($result === false && \get_option('aether_site_exporter_settings') !== $settings) {
			return new WP_Error(
				'settings_update_failed',
				\__('Failed to update settings.', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// Get updated value to return.
		$updatedValue = $settings[ $key ] ?? null;
		if (\is_array($updatedValue)) {
			$updatedValue = $this->sanitizeSettingsForResponse($updatedValue);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Setting updated successfully.', 'aether-site-exporter'),
				'key'     => $key,
				'value'   => $updatedValue,
			],
			200
		);
	}

	/**
	 * Sanitize settings for API response.
	 *
	 * Removes encrypted values from response (security measure).
	 *
	 * @param array<string, mixed> $settings Settings array.
	 * @return array<string, mixed> Sanitized settings.
	 */
	private function sanitizeSettingsForResponse(array $settings): array
	{
		$sanitized = [];

		foreach ($settings as $key => $value) {
			if (\is_array($value)) {
				$sanitized[ $key ] = $this->sanitizeSettingsForResponse($value);
			} elseif (\is_string($value) && \strpos($value, 'encrypted:') === 0) {
				// Skip encrypted values.
				continue;
			} else {
				$sanitized[ $key ] = $value;
			}
		}

		return $sanitized;
	}

	/**
	 * Deep merge provider configs, preserving existing fields.
	 *
	 * Merges provider configs field-by-field instead of replacing entire configs.
	 * This ensures that updating one field doesn't lose other fields.
	 *
	 * @param array<string, mixed> $existing Existing provider configs.
	 * @param array<string, mixed> $incoming Incoming provider configs to merge.
	 * @return array<string, mixed> Merged provider configs.
	 */
	private function deepMergeProviderConfigs(array $existing, array $incoming): array
	{
		$merged = $existing;

		foreach ($incoming as $providerId => $incomingConfig) {
			if (!\is_array($incomingConfig)) {
				// Non-array values replace existing
				$merged[$providerId] = $incomingConfig;
				continue;
			}

			// Get existing config for this provider
			$existingConfig = $merged[$providerId] ?? [];

			if (!\is_array($existingConfig)) {
				// Existing config is not an array, replace with incoming
				$merged[$providerId] = $incomingConfig;
				continue;
			}

			// Merge configs field-by-field
			// Start with existing config to preserve fields not in incoming config
			$mergedConfig = $existingConfig;
			foreach ($incomingConfig as $key => $value) {
				// For all fields (including arrays), replace with incoming value
				// The frontend sends complete form values, so incoming value is the source of truth
				$mergedConfig[$key] = $value;
			}

			$merged[$providerId] = $mergedConfig;
		}

		return $merged;
	}

	/**
	 * Sanitize provider settings recursively.
	 *
	 * @param array<string, mixed> $providers Providers settings array.
	 * @return array<string, mixed> Sanitized providers settings.
	 */
	private function sanitizeProviderSettings(array $providers): array
	{
		// Security: Validate total nesting depth BEFORE processing to prevent stack overflow
		// This prevents attackers from sending deeply nested arrays
		$maxDepth = 10; // Must match sanitizeConfig() depth limit
		if ($this->getArrayDepth($providers) > $maxDepth) {
			// Return empty array to reject malicious deeply-nested input
			return [];
		}

		$sanitized = [];

		foreach ($providers as $providerId => $config) {
			if (! \is_array($config)) {
				$sanitized[ $providerId ] = \sanitize_text_field($config);
				continue;
			}

			$sanitized[ $providerId ] = $this->sanitizeConfig($config);
		}

		return $sanitized;
	}

	/**
	 * Sanitize configuration recursively.
	 *
	 * Preserves snake_case keys (unlike sanitize_key which converts to lowercase).
	 *
	 * @param array<string, mixed> $config Configuration array.
	 * @param int                   $depth  Current recursion depth (internal use).
	 * @return array<string, mixed> Sanitized configuration.
	 */
	private function sanitizeConfig(array $config, int $depth = 0): array
	{
		// Prevent stack overflow: limit recursion depth to 10 levels
		// Most config structures are 2-3 levels deep, 10 is generous
		$maxDepth = 10;
		if ($depth >= $maxDepth) {
			// Return empty array instead of recursing further
			// This prevents infinite recursion attacks via circular references
			return [];
		}

		$sanitized = [];

		foreach ($config as $key => $value) {
			// Preserve snake_case keys - only sanitize the key name (remove invalid chars but keep case)
			// Allow alphanumeric, underscores, and hyphens
			$sanitizedKey = \preg_replace('/[^a-zA-Z0-9_-]/', '', $key);

			// Skip empty keys after sanitization to prevent data loss or collisions
			if (empty($sanitizedKey)) {
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

			// Special validation for static_files_path - default to 'static/' if empty
			if ($sanitizedKey === 'static_files_path' && \is_string($sanitized[ $sanitizedKey ])) {
				$sanitized[ $sanitizedKey ] = \trim($sanitized[ $sanitizedKey ]);
				if (empty($sanitized[ $sanitizedKey ])) {
					$sanitized[ $sanitizedKey ] = 'static/';
				}
			}

			// Special validation for export_path - default to 'blueprint-bundle/bundle.zip' if empty
			if ($sanitizedKey === 'export_path' && \is_string($sanitized[ $sanitizedKey ])) {
				$sanitized[ $sanitizedKey ] = \trim($sanitized[ $sanitizedKey ]);
				if (empty($sanitized[ $sanitizedKey ]) || !\preg_match('/\.zip$/i', $sanitized[ $sanitizedKey ])) {
					$sanitized[ $sanitizedKey ] = 'blueprint-bundle/bundle.zip';
				}
			}
		}

		return $sanitized;
	}

	/**
	 * Calculate the maximum nesting depth of an array.
	 *
	 * Used to prevent stack overflow attacks via deeply nested arrays.
	 *
	 * @param mixed $array The array to analyze (or other value).
	 * @param int   $currentDepth Current recursion depth (internal use).
	 * @return int Maximum depth of the array structure.
	 */
	private function getArrayDepth($array, int $currentDepth = 0): int
	{
		// If not an array, depth is current depth
		if (! \is_array($array)) {
			return $currentDepth;
		}

		// If empty array, depth is current depth
		if (empty($array)) {
			return $currentDepth;
		}

		// Find the maximum depth among all array values
		$maxDepth = $currentDepth;
		foreach ($array as $value) {
			if (\is_array($value)) {
				$depth = $this->getArrayDepth($value, $currentDepth + 1);
				$maxDepth = \max($maxDepth, $depth);
			}
		}

		return $maxDepth;
	}

	/**
	 * Create a provider instance.
	 *
	 * Creates a new provider instance configuration in the providers settings.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response with created instance or error.
	 */
	public function createProviderInstance(WP_REST_Request $request)
	{
		$providerType = $request->get_param('provider_type');
		$instanceId   = $request->get_param('instance_id');
		$instanceName = $request->get_param('instance_name');

		if (empty($providerType) || empty($instanceId) || empty($instanceName)) {
			return new WP_Error(
				'missing_params',
				\__('Provider type, instance ID, and instance name are required.', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		// Validate instance ID format (should be provider_type:uuid)
		if (!\preg_match('/^[a-z0-9_-]+:[a-z0-9-]+$/', $instanceId)) {
			return new WP_Error(
				'invalid_instance_id',
				\__('Instance ID must be in format: provider_type:uuid', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		// Get current settings
		$settings = \get_option('aether_site_exporter_settings', []);
		$providers = $settings['providers'] ?? [];

		// Decrypt existing providers if needed
		if (!empty($providers) && \is_array($providers)) {
			try {
				$providers = $this->decryptProviderSettings($providers);
			} catch (\Exception $e) {
				// If decryption fails, start fresh
				$providers = [];
			}
		}

		// Check if instance already exists
		if (isset($providers[$instanceId])) {
			return new WP_Error(
				'instance_exists',
				\__('Provider instance with this ID already exists.', 'aether-site-exporter'),
				['status' => 409]
			);
		}

		// Create new instance configuration
		$providers[$instanceId] = [
			'instance_name' => $instanceName,
			'provider_type' => $providerType,
		];

		// Encrypt and save
		try {
			$encryptedProviders = $this->encryptProviderSettings($providers);
			$settings['providers'] = $encryptedProviders;
			\update_option('aether_site_exporter_settings', $settings);
		} catch (\Exception $e) {
			$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());
			return new WP_Error(
				'encryption_failed',
				/* translators: %s: Error message */
				\sprintf(\__('Failed to save provider instance: %s', 'aether-site-exporter'), $sanitizedMessage),
				['status' => 500]
			);
		}

		// Return created instance (decrypted for response)
		$createdInstance = $providers[$instanceId];

		return new WP_REST_Response(
			[
				'success'       => true,
				'message'       => \__('Provider instance created successfully.', 'aether-site-exporter'),
				'instance_id'   => $instanceId,
				'instance'      => $createdInstance,
				'providers'     => $this->sanitizeSettingsForResponse($providers),
			],
			201
		);
	}
}
