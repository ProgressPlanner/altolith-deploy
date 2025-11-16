<?php

/**
 * REST Helpers Trait
 *
 * Common utilities for REST API controllers.
 *
 * @package AetherSiteExporter\REST
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\REST;

use WP_Error;
use WP_REST_Request;

/**
 * REST helpers trait.
 *
 * @since 1.0.0
 */
trait RESTHelpersTrait
{
	/**
	 * Get REST API namespace.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_namespace(): string
	{
		return 'aether-site-exporter/v1';
	}

	/**
	 * Permission check for REST endpoints.
	 *
	 * Requires manage_options capability.
	 *
	 * @since 1.0.0
	 * @return bool
	 */
	public function permission_check(): bool
	{
		return \current_user_can('manage_options');
	}

	/**
	 * Validate job ID from request.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return string|WP_Error Job ID or error.
	 */
	protected function validate_job_id(WP_REST_Request $request)
	{
		$job_id = $request->get_param('jobId');

		if (empty($job_id)) {
			return new WP_Error(
				'missing_job_id',
				\__('Job ID is required', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Validate format (export_timestamp_randomchars).
		if (! \preg_match('/^export_\d+_[a-zA-Z0-9]{8}$/', $job_id)) {
			return new WP_Error(
				'invalid_job_id',
				\__('Invalid job ID format', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		return $job_id;
	}

	/**
	 * Get job status or return error.
	 *
	 * @since 1.0.0
	 * @param string $job_id Job ID.
	 * @return array<string, mixed>|WP_Error Job status or error.
	 */
	protected function get_job_status_or_error(string $job_id)
	{
		$status = $this->state_manager->get_status($job_id);

		if (false === $status) {
			return new WP_Error(
				'job_not_found',
				\__('Export job not found', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		return $status;
	}

	/**
	 * Send success response.
	 *
	 * @since 1.0.0
	 * @param mixed  $data Response data.
	 * @param string $message Optional message.
	 * @return \WP_REST_Response
	 */
	protected function success_response($data = null, string $message = ''): \WP_REST_Response
	{
		$response = [
			'success' => true,
		];

		if (null !== $data) {
			$response['data'] = $data;
		}

		if (! empty($message)) {
			$response['message'] = $message;
		}

		return \rest_ensure_response($response);
	}

	/**
	 * Send error response.
	 *
	 * @since 1.0.0
	 * @param string $code Error code.
	 * @param string $message Error message.
	 * @param int    $status HTTP status code.
	 * @return WP_Error
	 */
	protected function error_response(string $code, string $message, int $status = 400): WP_Error
	{
		return new WP_Error($code, $message, [ 'status' => $status ]);
	}
}
