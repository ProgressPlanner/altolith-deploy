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
	 * Get installed plugins and themes with pagination.
	 *
	 * Returns installed plugins and themes with metadata, paginated for performance.
	 * The JavaScript code will determine which are from WordPress.org.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with plugins and themes arrays.
	 */
	public function getAssets(WP_REST_Request $request)
	{
		try {
			// Get pagination parameters
			$page = \absint($request->get_param('page') ?? 1);
			$perPage = \absint($request->get_param('per_page') ?? 50);

			// Validate and cap per_page to prevent memory issues
			$perPage = \min(\max($perPage, 1), 100); // Min 1, max 100
			$page = \max($page, 1); // Min 1

			$allPlugins = $this->assetDiscoveryService->getInstalledPlugins();
			$allThemes  = $this->assetDiscoveryService->getInstalledThemes();

			// Calculate pagination for plugins
			$totalPlugins = \count($allPlugins);
			$pluginOffset = ($page - 1) * $perPage;
			$plugins = \array_slice($allPlugins, $pluginOffset, $perPage);

			// Calculate pagination for themes (use same page/per_page)
			$totalThemes = \count($allThemes);
			$themeOffset = ($page - 1) * $perPage;
			$themes = \array_slice($allThemes, $themeOffset, $perPage);

			return new WP_REST_Response(
				[
					'success' => true,
					'plugins' => $plugins,
					'themes'  => $themes,
					'pagination' => [
						'page' => $page,
						'per_page' => $perPage,
						'total_plugins' => $totalPlugins,
						'total_themes' => $totalThemes,
						'total_pages_plugins' => \ceil($totalPlugins / $perPage),
						'total_pages_themes' => \ceil($totalThemes / $perPage),
					],
				],
				200
			);
		} catch (\Exception $e) {
			// Sanitize exception message to prevent information disclosure
			$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());

			return new WP_REST_Response(
				[
					'success' => false,
					'error'   => $sanitizedMessage,
				],
				500
			);
		}
	}
}
