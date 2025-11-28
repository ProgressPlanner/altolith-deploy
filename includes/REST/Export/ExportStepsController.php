<?php

/**
 * Consolidated Export Steps Controller
 *
 * Handles export workflow step endpoints for core content, plugins, and themes.
 *
 * @package Altolith\REST\Export
 */

namespace Altolith\Deploy\REST\Export;

use Altolith\Deploy\REST\RESTHelpersTrait;
use Altolith\Deploy\Services\ExportService;
use WP_REST_Request;
use WP_Error;

/**
 * Unified controller for all export workflow steps.
 */
class ExportStepsController
{
	use RESTHelpersTrait;

	/**
	 * Register REST routes for all steps.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Export core content (database, uploads, mu-plugins).
		\register_rest_route(
			$this->getNamespace(),
			'/export/coreContent',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'exportCoreContent' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Export a single plugin as zip.
		\register_rest_route(
			$this->getNamespace(),
			'/export/plugin',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'exportPlugin' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Export a single theme as zip.
		\register_rest_route(
			$this->getNamespace(),
			'/export/theme',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'exportTheme' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Export core WordPress content (database, uploads, mu-plugins).
	 *
	 * Creates wp-content.zip containing only core content, excluding
	 * custom plugins and themes which are exported separately.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function exportCoreContent(WP_REST_Request $request)
	{
		/**
		 * Action fired before core content export starts.
		 *
		 * @example
		 * add_action('altolith_core_content_before_export', function() {
		 *     error_log("Starting core content export");
		 * });
		 */
		\do_action('altolith_core_content_before_export');

		$exportService = new ExportService();
		$result = $exportService->exportCoreContent();

		if (\is_wp_error($result)) {
			return $result;
		}

		/**
		 * Filter core content export result.
		 *
		 * @param array $result Export result with zipPath, zipSize, etc.
		 *
		 * @example
		 * add_filter('altolith_core_content_result', function($result) {
		 *     $result['custom_metadata'] = 'added by filter';
		 *     return $result;
		 * });
		 */
		$result = \apply_filters('altolith_core_content_result', $result);

		/**
		 * Action fired after core content is exported successfully.
		 *
		 * @param array $result Export result.
		 *
		 * @example
		 * add_action('altolith_core_content_exported', function($result) {
		 *     error_log("Core content exported: " . $result['zipPath']);
		 * });
		 */
		\do_action('altolith_core_content_exported', $result);

		return \rest_ensure_response([
			'success' => true,
			'data' => $result,
			'message' => \__('Core content exported successfully', 'altolith-deploy'),
		]);
	}

	/**
	 * Export a single plugin as a zip file.
	 *
	 * @param WP_REST_Request $request Request object with 'slug' parameter.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function exportPlugin(WP_REST_Request $request)
	{
		$params = $request->get_json_params();
		$slug = $params['slug'] ?? null;

		$validationError = $this->validateRequiredParam($slug, 'slug');
		if ($validationError) {
			return $validationError;
		}

		$exportService = new ExportService();
		$result = $exportService->exportPlugin($slug);

		if (\is_wp_error($result)) {
			return $result;
		}

		/**
		 * Filter plugin export result.
		 *
		 * @param array  $result Export result with zipPath, zipSize, slug.
		 * @param string $slug   Plugin slug.
		 */
		$result = \apply_filters('altolith_plugin_export_result', $result, $slug);

		return \rest_ensure_response([
			'success' => true,
			'data' => $result,
		]);
	}

	/**
	 * Export a single theme as a zip file.
	 *
	 * @param WP_REST_Request $request Request object with 'slug' parameter.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function exportTheme(WP_REST_Request $request)
	{
		$params = $request->get_json_params();
		$slug = $params['slug'] ?? null;

		$validationError = $this->validateRequiredParam($slug, 'slug');
		if ($validationError) {
			return $validationError;
		}

		$exportService = new ExportService();
		$result = $exportService->exportTheme($slug);

		if (\is_wp_error($result)) {
			return $result;
		}

		/**
		 * Filter theme export result.
		 *
		 * @param array  $result Export result with zipPath, zipSize, slug.
		 * @param string $slug   Theme slug.
		 */
		$result = \apply_filters('altolith_theme_export_result', $result, $slug);

		return \rest_ensure_response([
			'success' => true,
			'data' => $result,
		]);
	}
}
