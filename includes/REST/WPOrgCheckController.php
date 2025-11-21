<?php

/**
 * WordPress.org Check Controller
 *
 * REST API endpoint to check if plugins/themes exist on WordPress.org.
 *
 * Note: External API calls (wp_remote_*) don't work in all environments
 * (e.g., WordPress Playground blocks them). This endpoint relies on the
 * 'aether_site_exporter_wporg_check_response' filter for actual checks.
 *
 * Implementations should use browser-based fetch() or CORS proxies
 * to perform the actual WordPress.org API calls.
 *
 * @package Aether\SiteExporter
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Server;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Class WPOrgCheckController
 *
 * Provides REST endpoint to check if assets exist on WordPress.org
 *
 * @since 1.0.0
 */
class WPOrgCheckController
{
	use RESTHelpersTrait;

	/**
	 * Register routes
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		\register_rest_route(
			$this->getNamespace(),
			'/check-wporg',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'checkItem' ],
					'permission_callback' => [ $this, 'permissionCheck' ],
					'args'                => $this->getCheckParams(),
				],
			]
		);
	}

	/**
	 * Check if a plugin or theme exists on WordPress.org
	 *
	 * Checks WordPress.org API using wp_remote_get(). If that fails (e.g., in
	 * WordPress Playground), clients should fallback to CORS proxy method.
	 *
	 * Filter Hook: 'aether_site_exporter_wporg_check_response'
	 * Filter parameters:
	 *   - null|array $response Default null, return array to provide response
	 *   - string     $slug     Plugin or theme slug
	 *   - string     $type     'plugin' or 'theme'
	 *
	 * Expected response format:
	 * [
	 *   'success'    => true,
	 *   'exists'     => bool,
	 *   'slug'       => string,
	 *   'type'       => string,
	 *   'method'     => string,   // e.g., 'wp-api', 'browser-fetch', 'cors-proxy'
	 *   'cached'     => bool,
	 *   'checked_at' => string,   // ISO 8601 format
	 * ]
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function checkItem($request)
	{
		$slug = $request->get_param('slug');
		$type = $request->get_param('type');

		/**
		 * Filter WordPress.org check response
		 *
		 * Use this filter to override the default WordPress.org API check.
		 * Useful for custom implementations or testing.
		 *
		 * @param null|array $response Default null, return array to provide response
		 * @param string     $slug     Plugin or theme slug
		 * @param string     $type     'plugin' or 'theme'
		 */
		$response = \apply_filters(
			'aether_site_exporter_wporg_check_response',
			null,
			$slug,
			$type
		);

		// If filter provided a response, use it
		if (null !== $response) {
			return \rest_ensure_response($response);
		}

		// Otherwise, check WordPress.org API directly
		$response = $this->checkWordPressOrgAPI($slug, $type);

		return \rest_ensure_response($response);
	}

	/**
	 * Check WordPress.org API for plugin/theme existence
	 *
	 * Makes actual API call to WordPress.org. This may fail in some
	 * environments (e.g., WordPress Playground WASM).
	 *
	 * @param string $slug Plugin or theme slug.
	 * @param string $type 'plugin' or 'theme'.
	 * @return array<string, mixed> Response array.
	 */
	private function checkWordPressOrgAPI(string $slug, string $type): array
	{
		// Build API URL based on type
		if ('plugin' === $type) {
			$url = \sprintf(
				'https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&slug=%s',
				\urlencode($slug)
			);
		} else {
			$url = \sprintf(
				'https://api.wordpress.org/themes/info/1.2/?action=theme_information&slug=%s',
				\urlencode($slug)
			);
		}

		// Make API request
		$responseData = \wp_remote_get(
			$url,
			[
				'timeout' => 10,
				'headers' => [
					'Accept' => 'application/json',
				],
			]
		);

		// Check for WP_Error
		if (\is_wp_error($responseData)) {
			return [
				'success'    => true,
				'exists'     => null, // null = unable to check
				'slug'       => $slug,
				'type'       => $type,
				'method'     => 'wp-api',
				'cached'     => false,
				'checked_at' => \gmdate('Y-m-d\TH:i:s\Z'),
				'error'      => $responseData->get_error_message(),
				'message'    => \__('WordPress.org API check failed. Client should fallback to CORS proxy.', 'aether-site-exporter'),
			];
		}

		// Get response code
		$responseCode = \wp_remote_retrieve_response_code($responseData);
		$body         = \wp_remote_retrieve_body($responseData);

		// 404 = doesn't exist
		if (404 === $responseCode) {
			return [
				'success'    => true,
				'exists'     => false,
				'slug'       => $slug,
				'type'       => $type,
				'method'     => 'wp-api',
				'cached'     => false,
				'checked_at' => \gmdate('Y-m-d\TH:i:s\Z'),
			];
		}

		// 200 = exists (verify JSON is valid)
		if (200 === $responseCode) {
			$data = \json_decode($body, true);

			// Check if response contains error (e.g., closed plugin)
			if (isset($data['error'])) {
				return [
					'success'    => true,
					'exists'     => false,
					'slug'       => $slug,
					'type'       => $type,
					'method'     => 'wp-api',
					'cached'     => false,
					'checked_at' => \gmdate('Y-m-d\TH:i:s\Z'),
					'reason'     => $data['error'],
				];
			}

			// Valid response - plugin/theme exists
			return [
				'success'    => true,
				'exists'     => true,
				'slug'       => $slug,
				'type'       => $type,
				'method'     => 'wp-api',
				'cached'     => false,
				'checked_at' => \gmdate('Y-m-d\TH:i:s\Z'),
			];
		}

		// Other status codes - unable to determine
		return [
			'success'     => true,
			'exists'      => null,
			'slug'        => $slug,
			'type'        => $type,
			'method'      => 'wp-api',
			'cached'      => false,
			'checked_at'  => \gmdate('Y-m-d\TH:i:s\Z'),
			'message'     => \__('Unexpected response from WordPress.org API', 'aether-site-exporter'),
			'statusCode'  => $responseCode,
		];
	}

	/**
	 * Get query parameters for check endpoint
	 *
	 * @return array<string, array<string, mixed>> Query parameters schema.
	 */
	private function getCheckParams(): array
	{
		return [
			'slug' => [
				'description'       => 'Plugin or theme slug to check',
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => function ($param) {
					return ! empty($param);
				},
			],
			'type' => [
				'description'       => 'Asset type (plugin or theme)',
				'type'              => 'string',
				'required'          => true,
				'enum'              => [ 'plugin', 'theme' ],
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => function ($param) {
					return \in_array($param, [ 'plugin', 'theme' ], true);
				},
			],
		];
	}
}
