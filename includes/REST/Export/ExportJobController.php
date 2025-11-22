<?php

/**
 * Export Job Controller
 *
 * Handles job management endpoints (start job, get status, list jobs).
 *
 * @package Aether\REST\Export
 */

namespace Aether\SiteExporter\REST\Export;

use Aether\SiteExporter\REST\RESTHelpersTrait;
use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Sync\JobStateManager;
use Aether\SiteExporter\Utilities\EncryptionHelper;
use WP_REST_Request;
use WP_Error;

/**
 * Handles export job management endpoints.
 */
class ExportJobController
{
	use RESTHelpersTrait;
	use ExportHelpersTrait;
	use EncryptionHelper;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct(Plugin $plugin)
	{
		$this->initExportHelpers($plugin);
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Start export job.
		\register_rest_route(
			$this->getNamespace(),
			'/export',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'startPublish' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get job status (simple getter, no orchestration).
		\register_rest_route(
			$this->getNamespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/status',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'getStatus' ],
					'permission_callback' => [ $this, 'permissionCheck' ],
				],
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'updateStatus' ],
					'permission_callback' => [ $this, 'permissionCheck' ],
				],
			]
		);

		// Get recent export jobs.
		\register_rest_route(
			$this->getNamespace(),
			'/export/jobs',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getRecentJobs' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Mark uploads as complete and transition to next step.
		\register_rest_route(
			$this->getNamespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/mark-uploads-complete',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'markUploadsComplete' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Start export operation.
	 *
	 * Initializes job and returns jobId immediately.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function startPublish(WP_REST_Request $request)
	{
		// Get changed assets and discovered assets from request body.
		$body = $request->get_params();

		// Validate array complexity BEFORE processing to prevent DoS attacks
		$complexityCheck = $this->validateArrayComplexity($body, 10, 1000);
		if (\is_wp_error($complexityCheck)) {
			return $complexityCheck;
		}

		// Recursively sanitize array values with depth limit.
		$sanitizeArrayRecursive = function ($data, $depth = 0) use (&$sanitizeArrayRecursive) {
			// Prevent stack overflow - this should never happen due to validation above,
			// but included as defense in depth
			if ($depth > 10) {
				return [];
			}

			if (\is_array($data)) {
				$sanitized = [];
				foreach ($data as $key => $value) {
					$sanitized[$key] = $sanitizeArrayRecursive($value, $depth + 1);
				}
				return $sanitized;
			}
			if (\is_string($data)) {
				return \sanitize_text_field($data);
			}
			return $data;
		};

		$changedAssets    = $sanitizeArrayRecursive($body['changedAssets'] ?? []);
		$discoveredAssets = isset($body['discoveredAssets']) ? $sanitizeArrayRecursive($body['discoveredAssets']) : null;

		// Note: Array complexity validation above already checks both depth and element count
		// This redundant check is kept for defense in depth
		$maxAssetCount = 1000; // Maximum 1000 assets per request
		if (\is_array($changedAssets) && \count($changedAssets, COUNT_RECURSIVE) > $maxAssetCount) {
			return new \WP_Error(
				'too_many_assets',
				\sprintf(
					/* translators: %d: Maximum number of assets */
					\__('Too many changed assets provided. Maximum allowed: %d', 'aether-site-exporter'),
					$maxAssetCount
				),
				['status' => 400]
			);
		}

		if (\is_array($discoveredAssets) && \count($discoveredAssets, COUNT_RECURSIVE) > $maxAssetCount) {
			return new \WP_Error(
				'too_many_assets',
				\sprintf(
					/* translators: %d: Maximum number of assets */
					\__('Too many discovered assets provided. Maximum allowed: %d', 'aether-site-exporter'),
					$maxAssetCount
				),
				['status' => 400]
			);
		}

		// Generate unique job ID using full random generation for better security.
		// Using 16 characters of randomness instead of time() + 8 chars to prevent predictability.
		$jobId = 'aether_site_exporter_' . \wp_generate_password(16, false);

		// Initialize job status.
		// Workflow starts with: discoverBlueprintBundleAssets (first tracked step).
		$jobData = [
			'status'         => 'pending',
			'message'        => \__('Queued...', 'aether-site-exporter'),
			'currentStep'   => 'discoverBlueprintBundleAssets',
			'started'        => \time(),
			'changedAssets' => $changedAssets,
		];

		// Store discovered assets if provided (avoids re-discovery).
		if ($discoveredAssets) {
			$jobData['discoveredAssets'] = $discoveredAssets;
		}

		/**
		 * Filter initial job data before creating export job.
		 *
		 * Allows modification of job initialization data.
		 *
		 * @param array  $jobData         Initial job data.
		 * @param string $jobId           Job ID.
		 * @param array  $changedAssets   Changed assets array.
		 * @param array  $discoveredAssets Discovered assets array.
		 *
		 * @example
		 * add_filter('aether_export_job_data', function($jobData, $jobId, $changedAssets, $discoveredAssets) {
		 *     $jobData['custom_metadata'] = 'added by filter';
		 *     return $jobData;
		 * }, 10, 4);
		 */
		$jobData = \apply_filters('aether_export_job_data', $jobData, $jobId, $changedAssets, $discoveredAssets);

		/**
		 * Action fired before export job is created.
		 *
		 * @param string $jobId  Job ID.
		 * @param array  $jobData Job initialization data.
		 *
		 * @example
		 * add_action('aether_export_job_before_create', function($jobId, $jobData) {
		 *     error_log("Creating export job: {$jobId}");
		 * }, 10, 2);
		 */
		\do_action('aether_export_job_before_create', $jobId, $jobData);

		$this->stateManager->updateStatus($jobId, $jobData);

		/**
		 * Action fired after export job is created.
		 *
		 * @param string $jobId   Job ID.
		 * @param array  $jobData Job data.
		 *
		 * @example
		 * add_action('aether_export_job_created', function($jobId, $jobData) {
		 *     error_log("Publish job created: {$jobId}");
		 * }, 10, 2);
		 */
		\do_action('aether_export_job_created', $jobId, $jobData);

		return \rest_ensure_response([
			'success' => true,
			'data' => [
				'jobId' => $jobId,
			],
			'message' => \__('Publish queued', 'aether-site-exporter')
		]);
	}

	/**
	 * Update job status.
	 *
	 * Allows React to update job status directly.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function updateStatus(WP_REST_Request $request)
	{
		$jobId = $this->validateJobId($request);
		if (\is_wp_error($jobId)) {
			return $jobId;
		}

		$bodyParams = $request->get_json_params();

		// Security: Whitelist allowed fields to prevent overwriting critical server-controlled fields
		$allowedFields = ['message', 'progress', 'deployment_url', 'completedAt', 'currentStep'];

		// Recursively sanitize array values.
		$sanitizeArrayRecursive = function ($data) use (&$sanitizeArrayRecursive) {
			if (\is_array($data)) {
				return \array_map($sanitizeArrayRecursive, $data);
			}
			if (\is_string($data)) {
				return \sanitize_text_field($data);
			}
			return $data;
		};

		// Only allow updates to whitelisted fields
		$newStatus = [];
		foreach ($allowedFields as $field) {
			if (isset($bodyParams[$field])) {
				$newStatus[$field] = $sanitizeArrayRecursive($bodyParams[$field]);
			}
		}

		if (empty($newStatus)) {
			return new WP_Error('missing_status', \__('Status data is required', 'aether-site-exporter'), ['status' => 422]);
		}

		// Verify job exists.
		$currentStatus = $this->getJobStatusOrError($jobId);
		if (\is_wp_error($currentStatus)) {
			return $currentStatus;
		}

		// Merge with current status to preserve existing data.
		$mergedStatus = \array_merge($currentStatus, $newStatus);

		/**
		 * Filter job status before update.
		 *
		 * Allows modification of status data before saving.
		 *
		 * @param array  $mergedStatus  Merged status data.
		 * @param string $jobId         Job ID.
		 * @param array  $currentStatus Previous status.
		 * @param array  $newStatus     New status fields.
		 *
		 * @example
		 * add_filter('aether_export_job_status_update', function($mergedStatus, $jobId, $currentStatus, $newStatus) {
		 *     $mergedStatus['last_modified'] = time();
		 *     return $mergedStatus;
		 * }, 10, 4);
		 */
		$mergedStatus = \apply_filters('aether_export_job_status_update', $mergedStatus, $jobId, $currentStatus, $newStatus);

		// Update job status.
		$this->stateManager->updateStatus($jobId, $mergedStatus);

		/**
		 * Action fired after job status is updated.
		 *
		 * @param string $jobId        Job ID.
		 * @param array  $mergedStatus Updated status.
		 * @param array  $newStatus    New status fields that were merged.
		 *
		 * @example
		 * add_action('aether_export_job_status_updated', function($jobId, $mergedStatus, $newStatus) {
		 *     error_log("Job {$jobId} status updated");
		 * }, 10, 3);
		 */
		\do_action('aether_export_job_status_updated', $jobId, $mergedStatus, $newStatus);

		return \rest_ensure_response([
			'success' => true,
			'data' => $mergedStatus,
			'message' => \__('Job status updated', 'aether-site-exporter')
		]);
	}

	/**
	 * Get job status (simple getter, no orchestration).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getStatus(WP_REST_Request $request)
	{
		$jobId = $this->validateJobId($request);
		if (\is_wp_error($jobId)) {
			return $jobId;
		}

		$status = $this->getJobStatusOrError($jobId);
		if (\is_wp_error($status)) {
			return $status;
		}

		// Add database upload result to response for Playground debugging.
		$dbResult = \get_transient('aether_site_exporter_db_upload_result');
		if ($dbResult && isset($dbResult['success'], $dbResult['message'])) {
			$status['debugDbUpload'] = $dbResult;
		}

		// Return status with value wrapper for consistency.
		return \rest_ensure_response([
			'success' => true,
			'value' => $status
		]);
	}

	/**
	 * Get recent export jobs.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getRecentJobs(WP_REST_Request $request)
	{
		$limit = \absint($request->get_param('limit') ?? 5);
		$limit = \min($limit, 50); // Cap at 50 jobs.

		$jobs = $this->stateManager->getAllJobs($limit);

		/**
		 * Filter recent export jobs list.
		 *
		 * Allows modification of jobs array before returning to client.
		 *
		 * @param array $jobs  Array of job status objects.
		 * @param int   $limit Requested limit.
		 *
		 * @example
		 * add_filter('aether_export_jobs_list', function($jobs, $limit) {
		 *     // Add custom metadata to each job
		 *     return array_map(function($job) {
		 *         $job['custom_field'] = 'added by filter';
		 *         return $job;
		 *     }, $jobs);
		 * }, 10, 2);
		 */
		$jobs = \apply_filters('aether_export_jobs_list', $jobs, $limit);

		return \rest_ensure_response([
			'success' => true,
			'data' => [ 'jobs' => $jobs ],
			'message' => \__('Recent jobs retrieved', 'aether-site-exporter')
		]);
	}

	/**
	 * Mark uploads as complete and transition to completed state.
	 *
	 * Since we upload directly to production, the job is complete after uploads.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function markUploadsComplete(WP_REST_Request $request)
	{
		$jobId = $this->validateJobId($request);
		if (\is_wp_error($jobId)) {
			return $jobId;
		}

		$status = $this->getJobStatusOrError($jobId);
		if (\is_wp_error($status)) {
			return $status;
		}

		// Verify job is in correct state.
		if (($status['currentStep'] ?? '') !== 'uploadSiteArchive' || ($status['status'] ?? '') !== 'waitingForUpload') {
			return new WP_Error(
				'invalid_state',
				\__('Job is not waiting for upload completion', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		/**
		 * Action fired before marking export job as complete.
		 *
		 * @param string $jobId  Job ID.
		 * @param array  $status Current job status.
		 *
		 * @example
		 * add_action('aether_export_job_before_complete', function($jobId, $status) {
		 *     error_log("Job {$jobId} completing");
		 * }, 10, 2);
		 */
		\do_action('aether_export_job_before_complete', $jobId, $status);

		// Mark job as complete.
		$newStatus = \array_merge($status, [
			'status'       => 'complete',
			'currentStep' => 'completed',
			'message'      => \__('Site published successfully!', 'aether-site-exporter'),
			'completedAt' => \current_time('mysql'),
		]);

		// Save deployment URL to settings for admin bar button.
		$deploymentUrl = '';
		// Get provider settings.
		$settings = \get_option('aether_site_exporter_settings', []);
		$providerTypes = $settings['provider_types'] ?? [];
		$staticSiteProviderId = $providerTypes['static_site'] ?? '';

		// Try to get base URL from provider configuration.
		// Check multiple possible URL keys (matching AbstractProvider.getDeploymentUrl() logic).
		$baseUrl = '';
		if (!empty($staticSiteProviderId) && isset($settings['providers'][$staticSiteProviderId])) {
			$providerConfig = $settings['providers'][$staticSiteProviderId];

			// Decrypt if needed (provider configs are encrypted)
			$decryptedConfig = $this->decryptSensitiveFields($providerConfig);

			// Check in priority order (matching JavaScript getDeploymentUrl()):
			// 1. pages_url (hosted pages)
			if (!empty($decryptedConfig['pages_url'])) {
				$baseUrl = $decryptedConfig['pages_url'];
			} elseif (!empty($decryptedConfig['custom_domain'])) { // 2. custom_domain (custom domain for R2)
				$baseUrl = $decryptedConfig['custom_domain'];
			} elseif (!empty($decryptedConfig['worker_endpoint'])) { // 3. worker_endpoint (R2, Spaces)
				$baseUrl = $decryptedConfig['worker_endpoint'];
			} elseif (!empty($decryptedConfig['public_url'])) { // 4. public_url (R2 bucket direct access)
				$baseUrl = $decryptedConfig['public_url'];
			}
		} else {
			// Log debug info if base URL not found
			if (\defined('WP_DEBUG') && \WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Could not find base URL. staticSiteProviderId: %s, hasProviders: %s',
					$staticSiteProviderId ?: 'empty',
					isset($settings['providers']) ? 'yes' : 'no'
				));
			}
		}

		// Build deployment URL: {baseUrl}/
		if (!empty($baseUrl)) {
			$deploymentUrl = \rtrim($baseUrl, '/') . '/';
			$settings['deployment_url'] = $deploymentUrl;
			\update_option('aether_site_exporter_settings', $settings);
		}

		// Add deployment URL to status response for frontend
		if (!empty($deploymentUrl)) {
			$newStatus['deployment_url'] = $deploymentUrl;
		}

		/**
		 * Filter job completion status.
		 *
		 * Allows modification of final job status before marking as complete.
		 *
		 * @param array  $newStatus     Final job status.
		 * @param string $jobId         Job ID.
		 * @param string $deploymentUrl Deployment URL (may be empty).
		 *
		 * @example
		 * add_filter('aether_export_job_complete_status', function($newStatus, $jobId, $deploymentUrl) {
		 *     $newStatus['completion_metadata'] = 'added by filter';
		 *     return $newStatus;
		 * }, 10, 3);
		 */
		$newStatus = \apply_filters('aether_export_job_complete_status', $newStatus, $jobId, $deploymentUrl);

		$this->stateManager->updateStatus($jobId, $newStatus);

		/**
		 * Action fired after export job is marked as complete.
		 *
		 * @param string $jobId         Job ID.
		 * @param array  $newStatus     Final job status.
		 * @param string $deploymentUrl Deployment URL (may be empty).
		 *
		 * @example
		 * add_action('aether_export_job_completed', function($jobId, $newStatus, $deploymentUrl) {
		 *     error_log("Job {$jobId} completed. Site URL: {$deploymentUrl}");
		 * }, 10, 3);
		 */
		\do_action('aether_export_job_completed', $jobId, $newStatus, $deploymentUrl);

		return \rest_ensure_response([
			'success' => true,
			'data' => $newStatus,
			'message' => \__('Uploads marked as complete', 'aether-site-exporter')
		]);
	}
}
