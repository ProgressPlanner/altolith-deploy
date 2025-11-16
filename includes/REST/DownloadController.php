<?php

/**
 * Download Controller
 *
 * Handles secure file download endpoints for exported files.
 *
 * @package AetherSiteExporter\REST
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\REST;

use AetherSiteExporter\Sync\JobStateManager;
use WP_REST_Request;
use WP_Error;

/**
 * Download controller.
 *
 * @since 1.0.0
 */
class DownloadController
{
	use RESTHelpersTrait;

	/**
	 * Job state manager instance.
	 *
	 * @var JobStateManager
	 */
	private JobStateManager $state_manager;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct()
	{
		$this->state_manager = new JobStateManager();
	}

	/**
	 * Register REST routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void
	{
		// Download static site archive.
		\register_rest_route(
			$this->get_namespace(),
			'/download/(?P<jobId>[a-zA-Z0-9_]+)/static-site',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'download_static_site' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Download blueprint bundle.
		\register_rest_route(
			$this->get_namespace(),
			'/download/(?P<jobId>[a-zA-Z0-9_]+)/blueprint',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'download_blueprint' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);
	}

	/**
	 * Download static site archive.
	 *
	 * Serves the static site ZIP file with appropriate security checks.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error|void Returns error on failure, exits on success.
	 */
	public function download_static_site(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		// Verify job exists.
		$job = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($job)) {
			return $job;
		}

		// Get file path from job state.
		$workflow_state = $job['workflow_state'] ?? [];
		$file_path = $workflow_state['staticSiteZip'] ?? AETHER_EXPORTS_DIR . '/' . $job_id . '-static-site.zip';

		// Verify file exists.
		if (! \file_exists($file_path)) {
			return $this->error_response(
				'file_not_found',
				\__('Static site archive not found. The export may not be complete.', 'aether-site-exporter'),
				404
			);
		}

		// Verify file is within exports directory (security check).
		$real_path = \realpath($file_path);
		$exports_dir = \realpath(AETHER_EXPORTS_DIR);

		if (false === $real_path || false === $exports_dir || ! \str_starts_with($real_path, $exports_dir)) {
			return $this->error_response(
				'invalid_file_path',
				\__('Invalid file path', 'aether-site-exporter'),
				403
			);
		}

		// Serve the file.
		$this->serve_file(
			$file_path,
			\sanitize_file_name($job_id . '-static-site.zip'),
			'application/zip'
		);
	}

	/**
	 * Download blueprint bundle.
	 *
	 * Serves the blueprint bundle ZIP file with appropriate security checks.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error|void Returns error on failure, exits on success.
	 */
	public function download_blueprint(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		// Verify job exists.
		$job = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($job)) {
			return $job;
		}

		// Get file path from job state.
		$workflow_state = $job['workflow_state'] ?? [];
		$file_path = $workflow_state['blueprintZip'] ?? AETHER_EXPORTS_DIR . '/' . $job_id . '-blueprint.zip';

		// Verify file exists.
		if (! \file_exists($file_path)) {
			return $this->error_response(
				'file_not_found',
				\__('Blueprint bundle not found. The export may not be complete.', 'aether-site-exporter'),
				404
			);
		}

		// Verify file is within exports directory (security check).
		$real_path = \realpath($file_path);
		$exports_dir = \realpath(AETHER_EXPORTS_DIR);

		if (false === $real_path || false === $exports_dir || ! \str_starts_with($real_path, $exports_dir)) {
			return $this->error_response(
				'invalid_file_path',
				\__('Invalid file path', 'aether-site-exporter'),
				403
			);
		}

		// Serve the file.
		$this->serve_file(
			$file_path,
			\sanitize_file_name($job_id . '-blueprint.zip'),
			'application/zip'
		);
	}

	/**
	 * Serve a file for download.
	 *
	 * Sets appropriate headers and streams the file to the browser.
	 * Exits after sending the file to prevent WordPress from adding extra output.
	 *
	 * @since 1.0.0
	 * @param string $file_path Path to file.
	 * @param string $filename  Download filename.
	 * @param string $mime_type MIME type.
	 * @return void This function exits after sending the file.
	 */
	private function serve_file(string $file_path, string $filename, string $mime_type): void
	{
		// Clear any previous output.
		if (\ob_get_level()) {
			\ob_end_clean();
		}

		// Set headers for file download.
		\header('Content-Type: ' . $mime_type);
		\header('Content-Disposition: attachment; filename="' . $filename . '"');
		\header('Content-Length: ' . \filesize($file_path));
		\header('Cache-Control: no-cache, must-revalidate');
		\header('Expires: 0');
		\header('Pragma: public');

		// Disable WordPress output buffering.
		\nocache_headers();

		// Stream the file in chunks to handle large files.
		$handle = \fopen($file_path, 'rb');
		if (false !== $handle) {
			while (! \feof($handle)) {
				$buffer = \fread($handle, 8192);
				if (false !== $buffer) {
					echo $buffer; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					\flush();
				}
			}
			\fclose($handle);
		}

		exit;
	}
}
