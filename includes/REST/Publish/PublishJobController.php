<?php

/**
 * Publish Job Controller
 *
 * Handles job management endpoints (start job, get status, list jobs).
 *
 * @package Aether\REST\Publish
 */

namespace Aether\SiteExporter\REST\Publish;

use Aether\SiteExporter\REST\RESTHelpersTrait;
use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Sync\JobStateManager;
use Aether\SiteExporter\Utilities\EncryptionHelper;
use WP_REST_Request;
use WP_Error;

/**
 * Handles publish job management endpoints.
 */
class PublishJobController
{
	use RESTHelpersTrait;
	use PublishHelpersTrait;
	use EncryptionHelper;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct(Plugin $plugin)
	{
		$this->initPublishHelpers($plugin);
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Start publish job.
		\register_rest_route(
			$this->getNamespace(),
			'/publish',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'startPublish' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get job status (simple getter, no orchestration).
		\register_rest_route(
			$this->getNamespace(),
			'/publish/(?P<jobId>[a-zA-Z0-9_]+)/status',
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

		// Get recent publish jobs.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/jobs',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getRecentJobs' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Mark uploads as complete and transition to next step.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/(?P<jobId>[a-zA-Z0-9_]+)/mark-uploads-complete',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'markUploadsComplete' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Start publish operation.
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
		// This redundant check is kept for backwards compatibility and defense in depth
		$maxAssetCount = 1000; // Maximum 1000 assets per request
		if (\is_array($changedAssets) && \count($changedAssets, COUNT_RECURSIVE) > $maxAssetCount) {
			return new \WP_Error(
				'too_many_assets',
				\sprintf(
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
		// Workflow starts with: discoverAssets (first tracked step).
		$jobData = [
			'status'         => 'pending',
			'message'        => \__('Queued...', 'aether-site-exporter'),
			'currentStep'   => 'discoverAssets',
			'started'        => \time(),
			'changedAssets' => $changedAssets,
		];

		// Store discovered assets if provided (avoids re-discovery).
		if ($discoveredAssets) {
			$jobData['discoveredAssets'] = $discoveredAssets;
		}

		$this->stateManager->updateStatus($jobId, $jobData);

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

		$newStatus = $sanitizeArrayRecursive($bodyParams);

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

		// Update job status.
		$this->stateManager->updateStatus($jobId, $mergedStatus);

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
	 * Get recent publish jobs.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getRecentJobs(WP_REST_Request $request)
	{
		$limit = \absint($request->get_param('limit') ?? 5);
		$limit = \min($limit, 50); // Cap at 50 jobs.

		$jobs = $this->stateManager->getAllJobs($limit);

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
			// 1. pages_url (GitHub Pages, GitLab Pages)
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

		$this->stateManager->updateStatus($jobId, $newStatus);

		return \rest_ensure_response([
			'success' => true,
			'data' => $newStatus,
			'message' => \__('Uploads marked as complete', 'aether-site-exporter')
		]);
	}
}
