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
use Aether\SiteExporter\Utilities\CredentialEncryption;
use Aether\SiteExporter\Utilities\EncryptionHelper;
use Aether\SiteExporter\Admin\Settings;

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

		// Get playground notice state.
		\register_rest_route(
			$this->getNamespace(),
			'/notices/playground',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getPlaygroundNotice' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Dismiss playground notice.
		\register_rest_route(
			$this->getNamespace(),
			'/notices/playground/dismiss',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'dismissPlaygroundNotice' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get i18n strings.
		\register_rest_route(
			$this->getNamespace(),
			'/i18n',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getI18n' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
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

		// Ensure provider_types exists in settings (even if empty)
		if (!isset($settings['provider_types']) || !\is_array($settings['provider_types'])) {
			$settings['provider_types'] = [];
		}

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
		// This ensures that updating one provider (e.g., cloudflare-r2) doesn't remove
		// configuration from other providers (e.g., cloudflare edge provider).
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
			$value = \array_merge($existingProviders, $value);

			try {
				$value = $this->sanitizeProviderSettings($value);
				$value = $this->encryptProviderSettings($value);
			} catch (\Exception $e) {
				return new WP_Error(
					'encryption_failed',
					\sprintf(\__('Failed to encrypt provider settings: %s', 'aether-site-exporter'), $e->getMessage()),
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
	 * Sanitize provider settings recursively.
	 *
	 * @param array<string, mixed> $providers Providers settings array.
	 * @return array<string, mixed> Sanitized providers settings.
	 */
	private function sanitizeProviderSettings(array $providers): array
	{
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
	 * @return array<string, mixed> Sanitized configuration.
	 */
	private function sanitizeConfig(array $config): array
	{
		$sanitized = [];

		foreach ($config as $key => $value) {
			// Preserve snake_case keys - only sanitize the key name (remove invalid chars but keep case)
			// Allow alphanumeric, underscores, and hyphens
			$sanitizedKey = \preg_replace('/[^a-zA-Z0-9_-]/', '', $key);

			if (\is_array($value)) {
				$sanitized[ $sanitizedKey ] = $this->sanitizeConfig($value);
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

			// Special validation for export_types - ensure it's an array with valid values
			if ($sanitizedKey === 'export_types') {
				$validExportTypes = [ 'static_site', 'blueprint_bundle' ];

				// Ensure it's an array
				if (!\is_array($sanitized[ $sanitizedKey ])) {
					$sanitized[ $sanitizedKey ] = [ 'static_site', 'blueprint_bundle' ];
				} else {
					// Filter to only valid values
					$sanitized[ $sanitizedKey ] = \array_intersect(
						$sanitized[ $sanitizedKey ],
						$validExportTypes
					);

					// Re-index array (array_intersect preserves keys)
					$sanitized[ $sanitizedKey ] = \array_values($sanitized[ $sanitizedKey ]);

					// If no valid values remain, use defaults
					if (empty($sanitized[ $sanitizedKey ])) {
						$sanitized[ $sanitizedKey ] = [ 'static_site', 'blueprint_bundle' ];
					}
				}
			}
		}

		return $sanitized;
	}

		// Encryption helper methods now provided by EncryptionHelper trait



	/**
	 * Get playground notice state.
	 *
	 * Merged from NoticesController.
	 *
	 * @param \WP_REST_Request<array<string, mixed>> $_request Request object (unused, required by REST API interface).
	 * @return WP_REST_Response Response with notice state.
	 */
	public function getPlaygroundNotice(\WP_REST_Request $_request)
	{

		// Check if in Playground.
		$isPlayground = \defined('AETHER_SITE_EXPORTER_PLAYGROUND_SITE') && AETHER_SITE_EXPORTER_PLAYGROUND_SITE === true;

		// Check if dismissed.
		$isDismissed = (bool) \get_user_meta(\get_current_user_id(), 'aether_site_exporter_dismiss_playground_notice', true);

		// Check if skip check is defined.
		$skipCheck = \defined('AETHER_SITE_EXPORTER_SKIP_PLAYGROUND_CHECK') && AETHER_SITE_EXPORTER_SKIP_PLAYGROUND_CHECK;

		// Determine if notice should be shown.
		$shouldShow = ! $isPlayground && ! $isDismissed && ! $skipCheck;

		return new WP_REST_Response(
			[
				'success'     => true,
				'shouldShow'  => $shouldShow,
				'isPlayground' => $isPlayground,
				'isDismissed' => $isDismissed,
			],
			200
		);
	}

	/**
	 * Dismiss playground notice.
	 *
	 * Merged from NoticesController.
	 *
	 * @param \WP_REST_Request<array<string, mixed>> $_request Request object (unused, required by REST API interface).
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function dismissPlaygroundNotice(\WP_REST_Request $_request)
	{

		$result = \update_user_meta(\get_current_user_id(), 'aether_site_exporter_dismiss_playground_notice', true);

		if (! $result) {
			return new WP_Error(
				'dismiss_failed',
				\__('Failed to dismiss notice.', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Notice dismissed successfully.', 'aether-site-exporter'),
			],
			200
		);
	}

	/**
	 * Get i18n strings.
	 *
	 * Returns translation strings for the client.
	 *
	 * @param \WP_REST_Request<array<string, mixed>> $_request Request object (unused, required by REST API interface).
	 * @return WP_REST_Response Response with i18n strings.
	 */
	public function getI18n(\WP_REST_Request $_request)
	{

		// Return common i18n strings.
		$i18n = [
			'confirm'    => \__('Are you sure?', 'aether-site-exporter'),
			'error'      => \__('An error occurred.', 'aether-site-exporter'),
			'success'    => \__('Operation completed successfully.', 'aether-site-exporter'),
			'processing' => \__('Processing...', 'aether-site-exporter'),
			'saving'     => \__('Saving...', 'aether-site-exporter'),
			'loading'    => \__('Loading...', 'aether-site-exporter'),
			'delete'     => \__('Delete', 'aether-site-exporter'),
			'cancel'     => \__('Cancel', 'aether-site-exporter'),
		];

		return new WP_REST_Response(
			[
				'success' => true,
				'i18n'    => $i18n,
			],
			200
		);
	}
}
