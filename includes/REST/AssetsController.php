<?php

/**
 * Assets REST Controller
 *
 * Provides installed plugin and theme data for blueprint generation.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Aether\SiteExporter\Sync\AssetDiscoveryService;

/**
 * Assets REST endpoints.
 */
class AssetsController
{
	use RESTHelpersTrait;

	/**
	 * Asset Discovery Service instance.
	 *
	 * @var AssetDiscoveryService
	 */
	private AssetDiscoveryService $assetDiscoveryService;

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$this->assetDiscoveryService = new AssetDiscoveryService();
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		\register_rest_route(
			$this->getNamespace(),
			'/assets',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getAssets' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Get installed plugins and themes.
	 *
	 * Returns all installed plugins and themes with metadata.
	 * The JavaScript code will determine which are from WordPress.org.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response with plugins and themes arrays, or WP_Error on failure.
	 */
	public function getAssets(WP_REST_Request $request) // phpcs:ignore VariableAnalysis
	{
		try {
			$plugins = $this->assetDiscoveryService->getInstalledPlugins();
			$themes  = $this->assetDiscoveryService->getInstalledThemes();

			return new WP_REST_Response(
				[
					'success' => true,
					'plugins' => $plugins,
					'themes'  => $themes,
				],
				200
			);
		} catch (\Exception $e) {
			// Sanitize exception message to prevent information disclosure
			$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());

			return new WP_Error(
				'asset_discovery_failed',
				$sanitizedMessage,
				['status' => 500]
			);
		}
	}
}
