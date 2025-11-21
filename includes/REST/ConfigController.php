<?php

/**
 * Config REST Controller
 *
 * Provides configuration values needed by the frontend (URLs, etc.).
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;

/**
 * Configuration REST endpoints.
 */
class ConfigController
{
	use RESTHelpersTrait;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		\register_rest_route(
			$this->getNamespace(),
			'/config',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getConfig' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Get configuration values.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with config values.
	 */
	public function getConfig(WP_REST_Request $request) // phpcs:ignore VariableAnalysis
	{
		// Get WordPress.org check method (filterable)
		$wporgCheckMethod = \apply_filters(
			'aether_site_exporter_wporg_check_method',
			'php' // Default to PHP server-side method
		);

		$config = [
			'success'            => true,
			'publicUrl'          => \home_url(),
			'adminUrl'           => \admin_url(),
			'wporgCheckMethod'   => $wporgCheckMethod,
		];

		// Add CORS proxy URL if using cors-proxy method
		if ('cors-proxy' === $wporgCheckMethod) {
			$config['corsProxyUrl'] = \apply_filters(
				'aether_site_exporter_cors_proxy_url',
				'https://cfp.s12y.org/check-wporg'
			);
		}

		return new WP_REST_Response($config, 200);
	}
}
