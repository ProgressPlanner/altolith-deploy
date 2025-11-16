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

namespace Aether\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Aether\Utilities\CredentialEncryption;
use Aether\Utilities\EncryptionHelper;

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

		// Get worker script for edge provider.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<provider_id>[a-z0-9_-]+)/edge/worker-script/(?P<worker_type>[a-z0-9_-]+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getWorkerScript' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
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

		// Get provider config from aether_settings (where settings are actually stored)
		$settings = \get_option('aether_settings', []);
		$providers = $settings['providers'] ?? [];
		$config = $providers[ $providerId ] ?? [];

		if (empty($config)) {
			return new WP_Error(
				'restProviderNotConfigured',
				\__('Provider is not configured.', 'aether'),
				[ 'status' => 404 ]
			);
		}

		// Decrypt sensitive fields for client.
		$config = $this->decryptSensitiveFields($config);

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
			return new WP_Error('invalid_config', \__('Config must be an object.', 'aether'), [ 'status' => 400 ]);
		}

		// Sanitize and encrypt.
		$sanitized = $this->sanitizeConfig($config);
		$encrypted = $this->encryptSensitiveFields($sanitized);

		// Save to aether_settings['providers'][providerId]
		$settings = \get_option('aether_settings', []);
		if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
			$settings['providers'] = [];
		}
		$settings['providers'][$providerId] = $encrypted;
		$result = \update_option('aether_settings', $settings);

		if (! $result && \get_option('aether_settings') !== $settings) {
			return new WP_Error('save_failed', \__('Failed to save provider configuration.', 'aether'), [ 'status' => 500 ]);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Provider configuration saved successfully.', 'aether'),
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

		// Delete from aether_settings['providers'][providerId]
		$settings = \get_option('aether_settings', []);
		if (isset($settings['providers'][$providerId])) {
			unset($settings['providers'][$providerId]);
			\update_option('aether_settings', $settings);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Provider configuration deleted successfully.', 'aether'),
			],
			200
		);
	}

	/**
	 * Sanitize configuration recursively.
	 *
	 * Preserves snake_case keys (unlike sanitize_key which converts to lowercase).
	 *
	 * @param array<string, mixed> $config Configuration array.
	 * @return array<string, mixed> Sanitized configuration.
	 */
	protected function sanitizeConfig(array $config): array
	{
		$sanitized = [];

		foreach ($config as $key => $value) {
			$sanitizedKey = \sanitize_key($key);

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
		}

		return $sanitized;
	}

	// Encryption helper methods now provided by EncryptionHelper trait


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
		$settings = \get_option('aether_settings', []);
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

		// Check required fields based on provider type
		switch ($providerId) {
			case 'cloudflare':
			case 'cloudflare-workers':
				// Cloudflare Edge requires account_id and api_token
				return ! empty($decryptedConfig['account_id'] ?? '') &&
					! empty($decryptedConfig['api_token'] ?? '');

			case 'cloudflare-r2':
				// Cloudflare R2 requires cloudflare_account_id, bucket_name, access_key_id, and secret_access_key
				return ! empty($decryptedConfig['cloudflare_account_id'] ?? '') &&
					! empty($decryptedConfig['bucket_name'] ?? '') &&
					! empty($decryptedConfig['access_key_id'] ?? '') &&
					! empty($decryptedConfig['secret_access_key'] ?? '');

			case 'gitlab-pages':
				// GitLab Pages requires personal_access_token and project_id
				return ! empty($decryptedConfig['personal_access_token'] ?? '') &&
					! empty($decryptedConfig['project_id'] ?? '');

			default:
				// For other providers, check if config has any non-empty values
				$hasValues = false;
				foreach ($decryptedConfig as $value) {
					if (! empty($value) && ! \is_array($value)) {
						$hasValues = true;
						break;
					}
				}
				return $hasValues;
		}
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
		$config     = $request->get_param('config');

		// If config is provided, use it; otherwise load from saved settings
		if (! \is_array($config) || empty($config)) {
			$settings = \get_option('aether_settings', []);
			$providers = $settings['providers'] ?? [];
			$savedConfig = $providers[ $providerId ] ?? [];
			$config = $this->decryptSensitiveFields($savedConfig);
		}

		// Handle Cloudflare Edge provider (NOT R2 - R2 is a storage provider)
		if ($providerId === 'cloudflare' || $providerId === 'cloudflare-workers') {
			$accountId = \sanitize_text_field($config['account_id'] ?? '');
			$apiToken  = \sanitize_text_field($config['api_token'] ?? '');

			if (empty($accountId) || empty($apiToken)) {
				return new WP_Error(
					'missing_credentials',
					\__('Account ID and API token are required.', 'aether'),
					[ 'status' => 400 ]
				);
			}

			// Validate account ID format
			if (! \preg_match('/^[a-f0-9]{32}$/i', $accountId)) {
				return new WP_Error(
					'invalid_account_id',
					\__('Invalid account ID format. Account ID must be a 32-character hexadecimal string', 'aether'),
					[ 'status' => 400 ]
				);
			}

			// Test connection via Cloudflare API (server-side, no CORS issues)
			$url = 'https://api.cloudflare.com/client/v4/accounts/' . \urlencode($accountId) . '/workers/scripts';
			$response = \wp_remote_get(
				$url,
				[
					'headers' => [
						'Authorization' => 'Bearer ' . $apiToken,
						'Content-Type'  => 'application/json',
					],
					'timeout' => 30,
				]
			);

			if (\is_wp_error($response)) {
				return new WP_Error(
					'connection_failed',
					$response->get_error_message(),
					[ 'status' => 500 ]
				);
			}

			$statusCode = \wp_remote_retrieve_response_code($response);
			$body       = \wp_remote_retrieve_body($response);
			$data       = \json_decode($body, true);

			if ($statusCode !== 200) {
				$errorMessage = isset($data['errors'][0]['message'])
					? $data['errors'][0]['message']
					: (isset($data['error']) ? $data['error'] : \sprintf(\__('HTTP %d: Connection test failed', 'aether'), $statusCode));

				return new WP_Error(
					'cloudflare_api_error',
					$errorMessage,
					[ 'status' => $statusCode ]
				);
			}

			return new WP_REST_Response(
				[
					'success' => true,
					'message' => \__('Successfully connected to Cloudflare Workers', 'aether'),
				],
				200
			);
		}

		// Handle Cloudflare R2 storage provider
		if ($providerId === 'cloudflare-r2') {
			$workerEndpoint = isset($config['worker_endpoint']) ? \esc_url_raw($config['worker_endpoint']) : '';
			$bucketName = isset($config['bucket_name']) ? \sanitize_text_field($config['bucket_name']) : '';

			if (empty($workerEndpoint)) {
				return new WP_Error(
					'missing_worker_endpoint',
					\__('Worker endpoint is required for R2 connection testing. Please deploy a worker first.', 'aether'),
					[ 'status' => 400 ]
				);
			}

			if (empty($bucketName)) {
				return new WP_Error(
					'missing_bucket_name',
					\__('Bucket name is required for R2 connection testing.', 'aether'),
					[ 'status' => 400 ]
				);
			}

			// Test connection via worker endpoint (server-side, no CORS issues)
			// Worker expects GET requests in format: /{site-key}/{filepath}
			// Use a test site-key and filepath to verify worker is accessible
			$testSiteKey = \md5('connection-test');
			$testUrl = \trailingslashit($workerEndpoint) . $testSiteKey . '/test.html';

			$response = \wp_remote_get(
				$testUrl,
				[
					'timeout' => 30,
				]
			);

			if (\is_wp_error($response)) {
				$errorMessage = $response->get_error_message();

				// Check for DNS resolution errors (worker might not be accessible yet)
				if (
					\strpos($errorMessage, 'Could not resolve host') !== false ||
					\strpos($errorMessage, 'getaddrinfo failed') !== false ||
					\strpos($errorMessage, 'Name or service not known') !== false
				) {
					return new WP_Error(
						'worker_not_accessible',
						\__('Worker endpoint is not accessible yet. This may be due to DNS propagation delay after deployment. Please wait a few minutes and try again.', 'aether'),
						[ 'status' => 503 ]
					);
				}

				return new WP_Error(
					'connection_failed',
					$errorMessage,
					[ 'status' => 500 ]
				);
			}

			$statusCode = \wp_remote_retrieve_response_code($response);
			$body       = \wp_remote_retrieve_body($response);

			// Accept both 200 (file exists) and 404 (worker accessible, file doesn't exist) as success
			// We're just testing if the worker endpoint is reachable and functioning
			if ($statusCode !== 200 && $statusCode !== 404) {
				// Try to parse error message from response
				$errorMessage = \sprintf(\__('HTTP %d: Connection test failed', 'aether'), $statusCode);
				$contentType = \wp_remote_retrieve_header($response, 'content-type');
				$contentTypeStr = \is_array($contentType) ? \implode(', ', $contentType) : (string) $contentType;
				if ($contentTypeStr && \strpos($contentTypeStr, 'application/json') !== false) {
					$data = \json_decode($body, true);
					if (isset($data['error'])) {
						$errorMessage = $data['error'];
					}
				}

				return new WP_Error(
					'r2_connection_failed',
					$errorMessage,
					[ 'status' => $statusCode ]
				);
			}

			// If we got a 404, it means the worker is accessible and functioning
			// (The test file doesn't exist, which is expected)
			$message = $statusCode === 404
				? \__('Worker endpoint is accessible and functioning correctly', 'aether')
				: \__('Successfully connected to Cloudflare R2', 'aether');

			return new WP_REST_Response(
				[
					'success' => true,
					'message' => $message,
				],
				200
			);
		}

		// For other providers, return not implemented
		return new WP_Error(
			'not_implemented',
			\sprintf(\__('Connection testing is not implemented for provider: %s', 'aether'), $providerId),
			[ 'status' => 501 ]
		);
	}

	/**
	 * Get worker script content.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response with worker script or error.
	 */
	public function getWorkerScript(WP_REST_Request $request)
	{
		$providerId = \sanitize_key($request->get_param('provider_id'));
		$workerType = \sanitize_key($request->get_param('worker_type'));

		// Map worker types to script files
		$workerScripts = [
			'r2' => 'CloudflareR2Worker.js',
		];

		if (! isset($workerScripts[ $workerType ])) {
			return new WP_Error(
				'invalid_worker_type',
				\sprintf(\__('Invalid worker type: %s', 'aether'), $workerType),
				[ 'status' => 400 ]
			);
		}

		$scriptFile = $workerScripts[ $workerType ];
		$scriptPath = AETHER_PLUGIN_DIR . 'assets/workers/' . $scriptFile;

		if (! \file_exists($scriptPath)) {
			return new WP_Error(
				'worker_script_not_found',
				\sprintf(\__('Worker script not found: %s', 'aether'), $scriptFile),
				[ 'status' => 404 ]
			);
		}

		$scriptContent = \file_get_contents($scriptPath);

		if ($scriptContent === false) {
			return new WP_Error(
				'failed_to_read_script',
				\__('Failed to read worker script', 'aether'),
				[ 'status' => 500 ]
			);
		}

		// Return script as plain text
		return new WP_REST_Response($scriptContent, 200, [
			'Content-Type' => 'text/javascript; charset=utf-8',
		]);
	}
}
