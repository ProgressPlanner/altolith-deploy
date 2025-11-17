<?php

/**
 * Publish REST API Helpers Trait
 *
 * Provides common functionality for publish REST controllers.
 * Replaces BasePublishController inheritance.
 *
 * @package Aether\REST\Publish
 */

namespace Aether\SiteExporter\REST\Publish;

use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Sync\JobStateManager;
use WP_REST_Request;
use WP_Error;

/**
 * Trait providing publish REST API helper methods.
 */
trait PublishHelpersTrait
{
	/**
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	protected $plugin;

	/**
	 * Job state manager.
	 *
	 * @var JobStateManager
	 */
	protected $stateManager;

	/**
	 * Initialize publish helpers.
	 *
	 * Call this from your controller's constructor.
	 *
	 * @param Plugin               $plugin Plugin instance.
	 * @param JobStateManager|null $stateManager Job state manager (optional, will create if null).
	 * @return void
	 */
	protected function initPublishHelpers(Plugin $plugin, ?JobStateManager $stateManager = null): void
	{
		$this->plugin       = $plugin;
		$this->stateManager = $stateManager ?? new JobStateManager();
	}

	/**
	 * Get job status and validate it exists.
	 *
	 * @param string $jobId Job ID.
	 * @return array<string, mixed>|WP_Error Job status array or WP_Error if not found.
	 */
	protected function getJobStatusOrError(string $jobId)
	{
		$status = $this->stateManager->getStatus($jobId);

		if (false === $status) {
			return new WP_Error(
				'job_not_found',
				\__('Job not found or expired', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		return $status;
	}

	/**
	 * Validate job ID from request.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return string|WP_Error Job ID or WP_Error if invalid.
	 */
	protected function validateJobId(WP_REST_Request $request)
	{
		$jobId = \sanitize_key($request->get_param('jobId') ?? '');

		if (empty($jobId)) {
			return new WP_Error(
				'missing_job_id',
				\__('Job ID is required', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		return $jobId;
	}
}
