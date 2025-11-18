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
	 * This endpoint doesn't make external HTTP calls directly because they
	 * don't work in all environments. Instead, it relies on the filter hook
	 * to provide the response.
	 *
	 * Filter Hook: 'aether_site_exporter_wporg_check_response'
	 *
	 * @param null|array $response Default null, return array to provide response
	 * @param string     $slug     Plugin or theme slug
	 * @param string     $type     'plugin' or 'theme'
	 *
	 * Expected response format:
	 * [
	 *   'success'    => true,
	 *   'exists'     => bool,
	 *   'slug'       => string,
	 *   'type'       => string,
	 *   'method'     => string,   // e.g., 'browser-fetch', 'cors-proxy'
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
		 * Use this filter to provide WordPress.org API check results.
		 * Since external HTTP calls don't work in all environments,
		 * implementations should use browser-based fetch() or CORS proxies.
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

		// If no filter provided a response, return default "unknown" response
		if (null === $response) {
			$response = [
				'success'    => true,
				'exists'     => null, // null = unknown/unable to check
				'slug'       => $slug,
				'type'       => $type,
				'method'     => 'none',
				'cached'     => false,
				'checked_at' => \gmdate('Y-m-d\TH:i:s\Z'),
				'message'    => 'WordPress.org check not available. Use browser-based fetch or CORS proxy.',
			];
		}

		return \rest_ensure_response($response);
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
		// Security: Require manage_options to prevent abuse and DoS attacks
		return \current_user_can('manage_options');
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
