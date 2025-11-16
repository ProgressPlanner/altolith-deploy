<?php

/**
 * Consolidated Publish Steps Controller
 *
 * Handles all publish workflow step endpoints in a single controller.
 * Consolidates: GenerateBlueprintController, CreateSiteArchiveController,
 * GenerateStaticSiteController, PrepareUploadManifestController.
 *
 * @package Aether\REST\Publish
 */

namespace Aether\SiteExporter\REST\Publish;

use Aether\REST\RESTHelpersTrait;
use Aether\Plugin;
use Aether\Utilities\Static\HTMLGeneratorService;
use Aether\Utilities\Static\URLDiscoveryService;
use Aether\Utilities\HTTPClient;
use WP_REST_Request;
use WP_Error;

/**
 * Unified controller for all publish workflow steps.
 */
class PublishStepsController
{
	use RESTHelpersTrait;
	use PublishHelpersTrait;

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
	 * Register REST routes for all steps.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Create site archive step.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/steps/createSiteArchive',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'executeCreateSiteArchive' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Generate static site step.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/steps/generateStaticSite',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'executeGenerateStaticSite' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get static site URLs endpoint.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/steps/getStaticSiteUrls',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getStaticSiteUrls' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get HTML content endpoint.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/steps/getHtmlContent',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getHtmlContent' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Create archive without job tracking (stateless).
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'createArchive' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get archive progress (stateless).
		\register_rest_route(
			$this->getNamespace(),
			'/publish/archiveProgress/(?P<progressId>[a-zA-Z0-9_]+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getArchiveProgress' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Execute the createSiteArchive step.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function executeCreateSiteArchive(WP_REST_Request $request)
	{
		return $this->executeStep($request, 'createSiteArchive', function ($status, $jobId) {
			// Get export service.
			$exportService = new \Aether\Services\ExportService($this->plugin);

			// Export complete site (database + wp-content) with progress tracking.
			$result = $exportService->exportCompleteSite($jobId, $this->stateManager);

			if (\is_wp_error($result)) {
				throw new \Exception(\sprintf('Site export failed: %s', $result->get_error_message()));
			}

			// Update status with export result and transition to next step.
			$newStatus = \array_merge($status, [
				'exportResult' => $result,
			]);
			$newStatus['currentStep'] = 'uploadStaticSiteFiles';
			$newStatus['status'] = 'processing';

			return [
				'status' => $newStatus,
				'message' => \__('Site archive created successfully', 'aether-site-exporter'),
			];
		});
	}

	/**
	 * Execute the generateStaticSite step.
	 *
	 * This step is handled client-side. The endpoint transitions to the next step
	 * after the client completes static site generation and file uploads.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function executeGenerateStaticSite(WP_REST_Request $request)
	{
		return $this->executeStep($request, 'generateStaticSite', function ($status, $jobId) {
			// Client handles static site generation.
			// This endpoint transitions to the next step.

			// Update status to transition to next step (generateBlueprint).
			$newStatus = \array_merge($status, []);
			$newStatus['currentStep'] = 'generateBlueprint';
			$newStatus['status'] = 'processing';

			return [
				'status' => $newStatus,
				'message' => \__('Static site generation complete', 'aether-site-exporter'),
			];
		});
	}

	/**
	 * Execute a step with common validation and error handling.
	 *
	 * @param WP_REST_Request $request       Request object.
	 * @param string          $stepName      Step name to validate.
	 * @param callable        $stepLogic     Step-specific logic as callable.
	 * @return \WP_REST_Response|\WP_Error
	 */
	private function executeStep(WP_REST_Request $request, string $stepName, callable $stepLogic)
	{
		// Try to get jobId from JSON body first, then body params
		$jsonParams = $request->get_json_params();
		$bodyParams = $request->get_body_params();
		$jobId = '';

		if (!empty($jsonParams) && isset($jsonParams['jobId'])) {
			$jobId = \sanitize_key($jsonParams['jobId']);
		} elseif (!empty($bodyParams) && isset($bodyParams['jobId'])) {
			$jobId = \sanitize_key($bodyParams['jobId']);
		}

		if (empty($jobId)) {
			return new WP_Error('missing_job_id', \__('Job ID is required', 'aether-site-exporter'), ['status' => 422]);
		}

		$status = $this->getJobStatusOrError($jobId);
		if (\is_wp_error($status)) {
			return $status;
		}

		// Verify we're on the correct step.
		if (($status['currentStep'] ?? '') !== $stepName) {
			return new WP_Error(
				'invalid_step',
				\sprintf(\__('Job is not on %1$s step. Current step: %2$s', 'aether-site-exporter'), $stepName, $status['currentStep'] ?? 'unknown'),
				['status' => 422]
			);
		}

		try {
			// Execute step-specific logic.
			$result = $stepLogic($status, $jobId);

			// Update job status.
			$this->stateManager->updateStatus($jobId, $result['status']);

			return \rest_ensure_response([
				'success' => true,
				'value' => $result['status'],
				'data' => $result['status'], // Also include data for compatibility
				'message' => $result['message'],
			]);
		} catch (\Exception $e) {
			// Mark job as failed.
			$this->stateManager->markFailed($jobId, $e->getMessage(), $stepName);

			return new WP_Error(
				'step_execution_failed',
				\sprintf(\__('Step execution failed: %s', 'aether-site-exporter'), $e->getMessage()),
				['status' => 500]
			);
		}
	}

	/**
	 * Get static site URL for HTML generation.
	 *
	 * Calculates the deployment URL dynamically based on:
	 * - publicUrl (custom domain) if configured
	 * - workerEndpoint as fallback
	 * - siteKey for unique deployment path
	 *
	 * @return string Static site URL (e.g., "https://s12y.org/8859159e10186c131461e6bbe04123d0/").
	 */
	private function getStaticSiteUrl(): string
	{
		// Get site key (creates one if it doesn't exist).
		$siteKey = \Aether\Plugin::getSiteKey();

		// Get provider settings.
		$settings = \get_option('aether_site_exporter_settings', []);
		$providerTypes = $settings['provider_types'] ?? [];
		$staticSiteProviderId = $providerTypes['static_site'] ?? '';

		// If no static site provider is configured, use relative URLs.
		if (empty($staticSiteProviderId)) {
			return '';
		}

		// Try to get base URL from provider configuration.
		$baseUrl = '';

		// Priority order:
		// 1. custom_domain (if configured - this is the public-facing URL)
		// 2. worker_endpoint (fallback to worker URL)
		// Note: public_url is for R2 public buckets, NOT for worker-based static sites
		if (
			isset($settings['providers'][$staticSiteProviderId]['custom_domain']) &&
			! empty($settings['providers'][$staticSiteProviderId]['custom_domain'])
		) {
			$baseUrl = $settings['providers'][$staticSiteProviderId]['custom_domain'];
		} elseif (
			isset($settings['providers'][$staticSiteProviderId]['worker_endpoint']) &&
			! empty($settings['providers'][$staticSiteProviderId]['worker_endpoint'])
		) {
			$baseUrl = $settings['providers'][$staticSiteProviderId]['worker_endpoint'];
		}

		// If no base URL found, return empty string (will use relative URLs).
		if (empty($baseUrl)) {
			return '';
		}

		// Build deployment URL: {baseUrl}/{siteKey}/
		$deploymentUrl = \rtrim($baseUrl, '/') . '/' . $siteKey . '/';

		return $deploymentUrl;
	}

	/**
	 * Get static site URLs for React-based generation.
	 *
	 * Returns all URLs that need to be converted to static HTML,
	 * along with the static site deployment URL.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function getStaticSiteUrls(WP_REST_Request $request)
	{
		try {
			// Increase execution time limit for URL discovery (can be slow in Playground).
			// WordPress Playground may have strict timeout limits, so we try to increase it.
			@\set_time_limit(120); // 2 minutes

			// Discover all URLs.
			$urlDiscovery = new URLDiscoveryService();
			$urls = $urlDiscovery->discoverAllUrls();

			// Get static site URL for URL rewriting.
			$staticSiteUrl = $this->getStaticSiteUrl();

			return \rest_ensure_response([
				'success' => true,
				'urls' => $urls,
				'staticSiteUrl' => $staticSiteUrl,
			]);
		} catch (\Exception $e) {
			return new WP_Error(
				'url_discovery_failed',
				\sprintf(\__('Failed to discover URLs: %s', 'aether-site-exporter'), $e->getMessage()),
				['status' => 500]
			);
		}
	}

	/**
	 * Get HTML content for a specific URL.
	 *
	 * Fetches HTML as a logged-out user (visitor view) without processing.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function getHtmlContent(WP_REST_Request $request)
	{
		// Extract URL parameter from request.
		// This endpoint is called by the client to fetch HTML for static site generation.
		$url = $request->get_param('url');

		// Validate URL parameter presence.
		if (empty($url)) {
			return new WP_Error(
				'missing_url',
				\__('URL parameter is required', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		// Validate URL format using PHP's built-in filter.
		// This prevents malformed URLs and potential security issues.
		if (! \filter_var($url, FILTER_VALIDATE_URL)) {
			return new WP_Error(
				'invalid_url',
				\__('Invalid URL provided', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		try {
			// CRITICAL: Switch to logged-out user context (user ID = 0).
			// Why: We need to fetch the page as an anonymous visitor would see it,
			// not as an authenticated admin. This ensures:
			// 1. No admin bar in the HTML
			// 2. No user-specific content (private posts, drafts, etc)
			// 3. Accurate representation of what public users will see
			// Save current user ID so we can restore it after fetching.
			$currentUserId = \get_current_user_id();
			\wp_set_current_user(0);

			// Fetch the page HTML using internal HTTP request.
			// This is an internal request to the same WordPress site, but as an anonymous user.
			// Timeout of 30 seconds handles slow pages with many widgets/queries.
			// Empty cookies array ensures no session data is sent.
			$result = HTTPClient::get(
				$url,
				[
					'timeout'    => 30,
					'user-agent' => 'Aether Static Site Generator',
					'cookies'    => [], // Critical: No cookies = anonymous visitor
				]
			);

			// CRITICAL: Always restore the original user context after fetching.
			// This prevents the REST API request from continuing as user ID 0,
			// which could cause permission issues for subsequent operations.
			\wp_set_current_user($currentUserId);

			// Validate the HTTP response.
			// Check both success flag and that we actually got HTML content.
			if (! $result['success'] || empty($result['body'])) {
				return new WP_Error(
					'fetch_failed',
					\sprintf(\__('Failed to fetch HTML content from URL: %s', 'aether-site-exporter'), $url),
					['status' => 500]
				);
			}

			// Return the fetched HTML to the client.
			// Client will process this HTML to extract assets and rewrite URLs.
			return \rest_ensure_response([
				'success' => true,
				'html' => $result['body'],
				'url' => $url,
			]);
		} catch (\Exception $e) {
			// Error handler: Restore user context if an exception occurs.
			// This ensures we don't leave the request in user ID 0 state,
			// which could cause security issues or permission errors.
			if (isset($currentUserId)) {
				\wp_set_current_user($currentUserId);
			}

			return new WP_Error(
				'html_fetch_failed',
				\sprintf(\__('Failed to fetch HTML: %s', 'aether-site-exporter'), $e->getMessage()),
				['status' => 500]
			);
		}
	}

	/**
	 * Create site archive without job tracking (stateless).
	 *
	 * Generates a unique progress ID for progress polling.
	 * Returns immediately with progressId for client polling.
	 *
	 * Accepts optional custom_assets parameter to filter which plugins/themes
	 * are included in the zip (WordPress.org assets go in blueprint instead).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function createArchive(WP_REST_Request $request)
	{
		// Get custom assets from request body (array of slugs).
		$jsonParams = $request->get_json_params();
		$customAssets = $jsonParams['custom_assets'] ?? null;

		// Validate custom_assets if provided.
		if ($customAssets !== null && ! \is_array($customAssets)) {
			return new WP_Error(
				'invalid_custom_assets',
				\__('custom_assets must be an array of plugin/theme slugs', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		// Generate unique progress ID.
		$progressId = 'aether_site_exporter_archive_' . \time() . '_' . \wp_generate_password(8, false);

		// Initialize progress transient.
		\set_transient($progressId, ['progress' => 0], 1800); // 30 minutes

		// Create export service.
		$exportService = new \Aether\Services\ExportService($this->plugin);

		// Export complete site with progress tracking via transient.
		// Progress is reported via $progressId transient, NOT job tracking.
		// If customAssets provided, only those plugins/themes are included in zip.
		$result = $exportService->exportCompleteSite($progressId, null, $customAssets);

		if (\is_wp_error($result)) {
			return $result;
		}

		// Mark progress as complete.
		\set_transient($progressId, ['progress' => 100, 'complete' => true], 1800);

		return \rest_ensure_response([
			'success' => true,
			'data' => $result,
			'message' => \__('Site archive created successfully', 'aether-site-exporter'),
		]);
	}

	/**
	 * Get archive creation progress (stateless).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getArchiveProgress(WP_REST_Request $request)
	{
		$progressId = \sanitize_key($request->get_param('progressId'));

		if (empty($progressId)) {
			return new WP_Error(
				'missing_progress_id',
				\__('Progress ID is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$progress = \get_transient($progressId);

		if (false === $progress) {
			return new WP_Error(
				'progress_not_found',
				\__('Progress ID not found or expired', 'aether-site-exporter'),
				['status' => 404]
			);
		}

		return \rest_ensure_response([
			'success' => true,
			'data' => $progress,
		]);
	}
}
