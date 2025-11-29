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
use Altolith\Deploy\Utilities\PathValidator;
use Altolith\Deploy\Utilities\TempDirectoryManager;
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

		// Serve export file by path (for R2 and other cloud providers).
		\register_rest_route(
			$this->getNamespace(),
			'/export-file',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'serveExportFile' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'path' => [
						'required' => true,
						'type'     => 'string',
						'validate_callback' => [ $this, 'validateFilePath' ],
					],
				],
			]
		);
	}

	/**
	 * Export core WordPress content (database, uploads, mu-plugins).
	 *
	 * Creates wp-content.zip containing only core content, excluding
	 * custom plugins and themes which are exported separately.
	 *
	 * @param WP_REST_Request<array<string, mixed>> $_request Request object (unused but required by REST API callback signature).
	 * @return \WP_REST_Response|WP_Error
	 */
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by REST API callback signature
	public function exportCoreContent(WP_REST_Request $_request)
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

	/**
	 * Serve an export file by path.
	 *
	 * This endpoint allows cloud providers (like R2) to fetch export files
	 * that are stored locally on the server.
	 *
	 * @param WP_REST_Request $request Request object with 'path' parameter.
	 * @return \WP_REST_Response|WP_Error File response or error.
	 */
	public function serveExportFile(WP_REST_Request $request)
	{
		$path = $request->get_param('path');

		if (empty($path)) {
			return new WP_Error(
				'missing_path',
				\__('File path is required.', 'altolith-deploy'),
				['status' => 400]
			);
		}

		// Determine if path is absolute or relative
		$fullPath = $path;
		if (!\preg_match('#^[/\\\\]#', $path) && !\preg_match('#^[A-Za-z]:[/\\\\]#', $path)) {
			// Relative path - assume it's relative to WordPress temp directory
			$tempDir = TempDirectoryManager::getTempDirectory();
			$fullPath = $tempDir . '/' . \ltrim($path, '/');
		}

		// Security: Validate path to prevent path traversal attacks
		// Allow paths within ABSPATH or the temp directory
		$tempDir = TempDirectoryManager::getTempDirectory();
		$validation = PathValidator::validatePath($fullPath, \ABSPATH, false);

		// If validation against ABSPATH fails, try temp directory
		if (!$validation['valid']) {
			$tempValidation = PathValidator::validatePath($fullPath, $tempDir, false);
			if (!$tempValidation['valid']) {
				return new WP_Error(
					'invalid_path',
					/* translators: %s: Validation error message */
					\sprintf(\__('Invalid file path: %s', 'altolith-deploy'), $validation['error']),
					['status' => 400]
				);
			}
		}

		// Verify file exists
		if (!\file_exists($fullPath) || !\is_file($fullPath)) {
			return new WP_Error(
				'file_not_found',
				\__('Export file not found.', 'altolith-deploy'),
				['status' => 404]
			);
		}

		// Get file MIME type
		$mimeType = \wp_check_filetype($fullPath);
		$contentType = $mimeType['type'] ?: 'application/octet-stream';

		// Read and serve file
		$fileContent = \file_get_contents($fullPath);
		if ($fileContent === false) {
			return new WP_Error(
				'read_failed',
				\__('Failed to read export file.', 'altolith-deploy'),
				['status' => 500]
			);
		}

		// Return file with appropriate headers
		// WordPress REST API will serve binary data correctly when Content-Type is set
		$response = new \WP_REST_Response($fileContent, 200);
		$response->header('Content-Type', $contentType);
		$response->header('Content-Disposition', 'attachment; filename="' . \basename($fullPath) . '"');
		$response->header('Content-Length', (string) \strlen($fileContent));

		// Prevent JSON encoding of binary data by using rest_pre_serve_request filter
		// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by WordPress filter callback signature
		\add_filter('rest_pre_serve_request', function ($served, $result, $request, $_server) use ($response, $fileContent, $contentType, $fullPath) {
			// Only handle our export-file endpoint
			if ($result === $response && \strpos($request->get_route(), '/export-file') !== false) {
				// Send headers and binary content directly
				\header('Content-Type: ' . $contentType);
				\header('Content-Disposition: attachment; filename="' . \basename($fullPath) . '"');
				\header('Content-Length: ' . \strlen($fileContent));
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Binary file content should not be escaped
				echo $fileContent;
				return true; // Mark as served, prevent default handling
			}
			return $served;
		}, 10, 4);

		return $response;
	}

	/**
	 * Validate file path parameter.
	 *
	 * @param mixed $path File path to validate.
	 * @return bool True if valid, false otherwise.
	 */
	public function validateFilePath($path)
	{
		if (!\is_string($path) || empty($path)) {
			return false;
		}

		// Basic validation - no path traversal
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $path)) {
			return false;
		}

		return true;
	}
}
