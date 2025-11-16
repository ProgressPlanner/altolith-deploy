<?php

/**
 * Config REST Controller
 *
 * Provides configuration values needed by the frontend (siteKey, URLs, etc.).
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use Aether\Plugin;

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
	public function getConfig(WP_REST_Request $request)
	{
		return new WP_REST_Response(
			[
				'success'       => true,
				'siteKey'       => Plugin::getSiteKey(),
				'playgroundUrl' => Plugin::getPlaygroundUrl(),
				'publicUrl'     => \home_url(),
				'adminUrl'      => \admin_url(),
			],
			200
		);
	}
}
