<?php

/**
 * Export Job Controller
 *
 * Handles export job management endpoints (start job, get status, list jobs).
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
 * Export job management controller.
 *
 * @since 1.0.0
 */
class ExportJobController
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
		// Start export job.
		\register_rest_route(
			$this->get_namespace(),
			'/export',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'start_export' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Get job status.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/status',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'get_status' ],
					'permission_callback' => [ $this, 'permission_check' ],
				],
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'update_status' ],
					'permission_callback' => [ $this, 'permission_check' ],
				],
			]
		);

		// Get recent export jobs.
		\register_rest_route(
			$this->get_namespace(),
			'/export/jobs',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_recent_jobs' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Delete export job.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ $this, 'delete_job' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);
	}

	/**
	 * Start export operation.
	 *
	 * Initializes job and returns jobId immediately.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function start_export(WP_REST_Request $request)
	{
		$body = $request->get_json_params();

		// Get export configuration from request.
		$config = [
			'exportStaticSite' => (bool) ( $body['exportStaticSite'] ?? false ),
			'exportBlueprint'  => (bool) ( $body['exportBlueprint'] ?? false ),
			'targetUrl'        => \sanitize_text_field($body['targetUrl'] ?? ''),
		];

		// Validate: at least one export type must be selected.
		if (! $config['exportStaticSite'] && ! $config['exportBlueprint']) {
			return $this->error_response(
				'invalid_config',
				\__('At least one export type must be selected', 'aether-site-exporter'),
				400
			);
		}

		// Validate: target URL required if static site export selected.
		if ($config['exportStaticSite'] && empty($config['targetUrl'])) {
			return $this->error_response(
				'missing_target_url',
				\__('Target URL is required for static site export', 'aether-site-exporter'),
				400
			);
		}

		// Create job.
		$job_id = $this->state_manager->create_job($config);

		if (false === $job_id) {
			return $this->error_response(
				'job_creation_failed',
				\__('Failed to create export job', 'aether-site-exporter'),
				500
			);
		}

		return $this->success_response(
			[ 'jobId' => $job_id ],
			\__('Export job created', 'aether-site-exporter')
		);
	}

	/**
	 * Get job status.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function get_status(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		$status = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($status)) {
			return $status;
		}

		return $this->success_response($status);
	}

	/**
	 * Update job status.
	 *
	 * Allows React to update job status directly.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function update_status(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		$body = $request->get_json_params();

		if (empty($body)) {
			return $this->error_response(
				'missing_status',
				\__('Status data is required', 'aether-site-exporter'),
				400
			);
		}

		// Verify job exists.
		$current_status = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($current_status)) {
			return $current_status;
		}

		// Update job status.
		$success = $this->state_manager->update_status($job_id, $body);

		if (! $success) {
			return $this->error_response(
				'update_failed',
				\__('Failed to update job status', 'aether-site-exporter'),
				500
			);
		}

		// Get updated status.
		$updated_status = $this->state_manager->get_status($job_id);

		return $this->success_response(
			$updated_status,
			\__('Job status updated', 'aether-site-exporter')
		);
	}

	/**
	 * Get recent export jobs.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function get_recent_jobs(WP_REST_Request $request)
	{
		$limit = \absint($request->get_param('limit') ?? 10);
		$limit = \min($limit, 50); // Cap at 50 jobs.

		$jobs = $this->state_manager->get_all_jobs($limit);

		return $this->success_response(
			[ 'jobs' => $jobs ],
			\__('Recent jobs retrieved', 'aether-site-exporter')
		);
	}

	/**
	 * Delete export job.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function delete_job(WP_REST_Request $request)
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

		// Delete from database.
		$success = $this->state_manager->delete_job($job_id);

		if (! $success) {
			return $this->error_response(
				'delete_failed',
				\__('Failed to delete export job', 'aether-site-exporter'),
				500
			);
		}

		// TODO: Also delete export files from filesystem.

		return $this->success_response(
			null,
			\__('Export job deleted', 'aether-site-exporter')
		);
	}
}
