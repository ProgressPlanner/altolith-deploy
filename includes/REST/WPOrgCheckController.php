<?php

/**
 * WordPress.org Check Controller
 *
 * REST API endpoint to check if plugins/themes exist on WordPress.org.
 * Server-side implementation avoids CORS issues.
 *
 * @package Aether\SiteExporter
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Controller;
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
class WPOrgCheckController extends WP_REST_Controller
{
	/**
	 * Namespace for REST routes
	 *
	 * @var string
	 */
	protected $namespace = 'aether/site-exporter';

	/**
	 * REST base for this controller
	 *
	 * @var string
	 */
	protected $rest_base = 'check-wporg';

	/**
	 * Register routes
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		\register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'checkItem' ],
					'permission_callback' => [ $this, 'checkPermissions' ],
					'args'                => $this->getCheckParams(),
				],
			]
		);
	}

	/**
	 * Check if a plugin or theme exists on WordPress.org
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function checkItem($request)
	{
		$slug = $request->get_param('slug');
		$type = $request->get_param('type');

		// Allow plugins to completely override the check logic
		$customResponse = \apply_filters(
			'aether_site_exporter_wporg_check_response',
			null,
			$slug,
			$type
		);

		if (null !== $customResponse) {
			return \rest_ensure_response($customResponse);
		}

		// Perform the WordPress.org API check
		$result = $this->checkWporgApi($slug, $type);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response($result);
	}

	/**
	 * Check WordPress.org API to see if asset exists
	 *
	 * @param string $slug Plugin or theme slug.
	 * @param string $type 'plugin' or 'theme'.
	 * @return array<string, mixed>|WP_Error Response array or WP_Error on failure.
	 */
	private function checkWporgApi(string $slug, string $type): array|WP_Error
	{
		// Construct WordPress.org API URL
		$apiUrl = $this->getWporgApiUrl($slug, $type);

		// Make HTTP request
		$response = \wp_remote_get(
			$apiUrl,
			[
				'timeout' => 10,
				'headers' => [
					'Accept' => 'application/json',
				],
			]
		);

		// Check for HTTP errors
		if (\is_wp_error($response)) {
			return new WP_Error(
				'wporg_api_error',
				\sprintf('Failed to connect to WordPress.org API: %s', $response->get_error_message()),
				[ 'status' => 500 ]
			);
		}

		$statusCode = \wp_remote_retrieve_response_code($response);
		$body       = \wp_remote_retrieve_body($response);

		// Parse JSON response
		$data = \json_decode($body, true);

		if (null === $data) {
			return new WP_Error(
				'wporg_api_invalid_json',
				'Invalid JSON response from WordPress.org API',
				[ 'status' => 500 ]
			);
		}

		// Determine if asset exists
		// WordPress.org returns 'error' field if not found, or 'slug' field if found
		$exists = ! isset($data['error']) && ( isset($data['slug']) || isset($data['name']) );

		// Build standardized response
		return [
			'success'    => true,
			'exists'     => $exists,
			'slug'       => $slug,
			'type'       => $type,
			'method'     => 'php',
			'cached'     => false,
			'checked_at' => \gmdate('Y-m-d\TH:i:s\Z'),
		];
	}

	/**
	 * Get WordPress.org API URL for slug and type
	 *
	 * @param string $slug Plugin or theme slug.
	 * @param string $type 'plugin' or 'theme'.
	 * @return string API URL.
	 */
	private function getWporgApiUrl(string $slug, string $type): string
	{
		if ('theme' === $type) {
			return \sprintf(
				'https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=%s',
				\rawurlencode($slug)
			);
		}

		// Default to plugin
		return \sprintf(
			'https://api.wordpress.org/plugins/info/1.0/%s.json',
			\rawurlencode($slug)
		);
	}

	/**
	 * Check permissions
	 *
	 * Require user to be logged in.
	 * WordPress.org data is public, but we require authentication to prevent abuse.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True if user is logged in.
	 */
	public function checkPermissions($request): bool
	{
		return \is_user_logged_in();
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
