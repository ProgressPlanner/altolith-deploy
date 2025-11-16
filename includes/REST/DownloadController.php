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
	 * TODO: Implement file serving.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function download_static_site(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		// Verify job exists.
		$status = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($status)) {
			return $status;
		}

		// TODO: Implement secure file serving.
		// - Verify file exists
		// - Set appropriate headers
		// - Stream file to browser
		// - Exit to prevent WordPress from adding extra output

		return $this->error_response(
			'not_implemented',
			\__('Download not implemented yet', 'aether-site-exporter'),
			501
		);
	}

	/**
	 * Download blueprint bundle.
	 *
	 * TODO: Implement file serving.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function download_blueprint(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		// Verify job exists.
		$status = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($status)) {
			return $status;
		}

		// TODO: Implement secure file serving.

		return $this->error_response(
			'not_implemented',
			\__('Download not implemented yet', 'aether-site-exporter'),
			501
		);
	}
}
