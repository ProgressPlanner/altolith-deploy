<?php

/**
 * Consolidated Publish Steps Controller
 *
 * Handles all publish workflow step endpoints in a single controller.
 * Consolidates: GenerateBlueprintController, createBlueprintBundleController,
 * GenerateStaticSiteController, PrepareUploadManifestController.
 *
 * @package Aether\REST\Publish
 */

namespace Aether\SiteExporter\REST\Publish;

use Aether\SiteExporter\REST\RESTHelpersTrait;
use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Services\ExportService;
use Aether\SiteExporter\Services\BlueprintBundleGenerator;
use Aether\SiteExporter\Utilities\HTTPClient;
use Aether\SiteExporter\Providers\ProviderRegistry;
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
			'/publish/steps/createBlueprintBundle',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'executecreateBlueprintBundle' ],
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

		// Initialize archive (modular approach).
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/init',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'initArchive' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Add database phase.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/database',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'addDatabasePhase' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get uploads batches.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/uploads/batches',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getUploadsBatches' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Add uploads batch.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/uploads/batch',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'addUploadsBatch' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get plugins list.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/plugins/list',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getPluginsList' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Add plugin.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/plugins/add',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'addPlugin' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get themes list.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/themes/list',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getThemesList' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Add theme.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/themes/add',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'addTheme' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get mu-plugins batches.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/mu-plugins/batches',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getMuPluginsBatches' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Add mu-plugins batch.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/phase/mu-plugins/batch',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'addMuPluginsBatch' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Finalize archive.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/createArchive/finalize',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'finalizeArchive' ],
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

		// Generate blueprint bundle.
		\register_rest_route(
			$this->getNamespace(),
			'/publish/generateBlueprintBundle',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'generateBlueprintBundle' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Execute the createBlueprintBundle step.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function executecreateBlueprintBundle(WP_REST_Request $request)
	{
		return $this->executeStep($request, 'createBlueprintBundle', function ($status, $jobId) {
			// Get export service.
			$exportService = new ExportService($this->plugin);

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
		return $this->executeStep($request, 'generateStaticSite', function ($status) {
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
				/* translators: 1: Expected step name, 2: Current step name */
				\sprintf(\__('Job is not on %1$s step. Current step: %2$s', 'aether-site-exporter'), $stepName, $status['currentStep'] ?? 'unknown'),
				['status' => 422]
			);
		}

		/**
		 * Action fired before a publish step executes.
		 *
		 * @param string $stepName Step identifier.
		 * @param string $jobId    Job ID.
		 * @param array  $status   Current job status.
		 *
		 * @example
		 * add_action('aether_publish_step_before', function($stepName, $jobId, $status) {
		 *     error_log("Starting step: {$stepName} for job: {$jobId}");
		 * }, 10, 3);
		 */
		\do_action('aether_publish_step_before', $stepName, $jobId, $status);

		try {
			// Execute step-specific logic.
			$result = $stepLogic($status, $jobId);

			/**
			 * Filter step execution result before saving.
			 *
			 * Allows modification of step results before they're persisted.
			 *
			 * @param array  $result   Step result (contains 'status' and 'message').
			 * @param string $stepName Step identifier.
			 * @param string $jobId    Job ID.
			 *
			 * @example
			 * add_filter('aether_publish_step_result', function($result, $stepName, $jobId) {
			 *     if ($stepName === 'createBlueprintBundle') {
			 *         $result['status']['custom_data'] = 'added by filter';
			 *     }
			 *     return $result;
			 * }, 10, 3);
			 */
			$result = \apply_filters('aether_publish_step_result', $result, $stepName, $jobId);

			// Update job status.
			$this->stateManager->updateStatus($jobId, $result['status']);

			/**
			 * Action fired after a publish step completes successfully.
			 *
			 * @param string $stepName Step identifier.
			 * @param string $jobId    Job ID.
			 * @param array  $result   Step result.
			 *
			 * @example
			 * add_action('aether_publish_step_after', function($stepName, $jobId, $result) {
			 *     if ($stepName === 'createBlueprintBundle') {
			 *         error_log("Archive created: " . $result['status']['exportResult']['zipPath']);
			 *     }
			 * }, 10, 3);
			 */
			\do_action('aether_publish_step_after', $stepName, $jobId, $result);

			return \rest_ensure_response([
				'success' => true,
				'value' => $result['status'],
				'data' => $result['status'], // Also include data for compatibility
				'message' => $result['message'],
			]);
		} catch (\Exception $e) {
			// Sanitize exception message to prevent information disclosure
			$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());

			/**
			 * Action fired when a publish step fails.
			 *
			 * @param string     $stepName Step identifier.
			 * @param string     $jobId    Job ID.
			 * @param \Exception $error    Exception object.
			 * @param string     $message  Sanitized error message.
			 *
			 * @example
			 * add_action('aether_publish_step_error', function($stepName, $jobId, $error, $message) {
			 *     // Log to external monitoring service
			 *     error_log("Step failed: {$stepName} - {$message}");
			 * }, 10, 4);
			 */
			\do_action('aether_publish_step_error', $stepName, $jobId, $e, $sanitizedMessage);

			// Mark job as failed with sanitized message
			$this->stateManager->markFailed($jobId, $sanitizedMessage, $stepName);

			return new WP_Error(
				'step_execution_failed',
				/* translators: %s: Error message */
				\sprintf(\__('Step execution failed: %s', 'aether-site-exporter'), $sanitizedMessage),
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

		// Save current user ID so we can restore it after fetching.
		$currentUserId = \get_current_user_id();

		try {
			// CRITICAL: Switch to logged-out user context (user ID = 0).
			// Why: We need to fetch the page as an anonymous visitor would see it,
			// not as an authenticated admin. This ensures:
			// 1. No admin bar in the HTML
			// 2. No user-specific content (private posts, drafts, etc)
			// 3. Accurate representation of what public users will see
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

			// Validate the HTTP response.
			// Check both success flag and that we actually got HTML content.
			if (! $result['success'] || empty($result['body'])) {
				return new WP_Error(
					'fetch_failed',
					/* translators: %s: URL */
					\sprintf(\__('Failed to fetch HTML content from URL: %s', 'aether-site-exporter'), $url),
					['status' => 500]
				);
			}

			$html = $result['body'];

			/**
			 * Filter HTML content before sending to client.
			 *
			 * Allows modification of HTML before static site processing.
			 *
			 * @param string $html The HTML content.
			 * @param string $url  The URL that was fetched.
			 *
			 * @example
			 * add_filter('aether_html_content', function($html, $url) {
			 *     // Remove specific scripts
			 *     $html = preg_replace('/<script.*?analytics.*?<\/script>/s', '', $html);
			 *     return $html;
			 * }, 10, 2);
			 */
			$html = \apply_filters('aether_html_content', $html, $url);

			// Return the fetched HTML to the client.
			// Client will process this HTML to extract assets and rewrite URLs.
			return \rest_ensure_response([
				'success' => true,
				'html' => $html,
				'url' => $url,
			]);
		} catch (\Exception $e) {
			// Sanitize exception message to prevent information disclosure
			$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());

			return new WP_Error(
				'html_fetch_failed',
				/* translators: %s: Error message */
				\sprintf(\__('Failed to fetch HTML: %s', 'aether-site-exporter'), $sanitizedMessage),
				['status' => 500]
			);
		} finally {
			// CRITICAL: Always restore the original user context, even if an exception occurred.
			// Using finally block ensures this runs regardless of return/exception in try block.
			// This prevents the REST API request from continuing as user ID 0,
			// which could cause permission issues for subsequent operations.
			\wp_set_current_user($currentUserId);
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

		/**
		 * Action fired before site archive creation starts.
		 *
		 * @param string     $progressId    Progress ID for tracking.
		 * @param array|null $customAssets  Custom assets filter (plugin/theme slugs).
		 *
		 * @example
		 * add_action('aether_archive_before_create', function($progressId, $customAssets) {
		 *     error_log("Starting archive creation: {$progressId}");
		 * }, 10, 2);
		 */
		\do_action('aether_archive_before_create', $progressId, $customAssets);

		// Initialize progress transient.
		\set_transient($progressId, ['progress' => 0], 1800); // 30 minutes

		// Create export service.
		$exportService = new ExportService($this->plugin);

		// Export complete site with progress tracking via transient.
		// Progress is reported via $progressId transient, NOT job tracking.
		// If customAssets provided, only those plugins/themes are included in zip.
		$result = $exportService->exportCompleteSite($progressId, null, $customAssets);

		if (\is_wp_error($result)) {
			return $result;
		}

		/**
		 * Filter archive creation result.
		 *
		 * Allows modification of export result before returning.
		 *
		 * @param array  $result      Export result with zipPath, zipSize, etc.
		 * @param string $progressId  Progress ID used for tracking.
		 *
		 * @example
		 * add_filter('aether_archive_result', function($result, $progressId) {
		 *     $result['custom_metadata'] = 'added by filter';
		 *     return $result;
		 * }, 10, 2);
		 */
		$result = \apply_filters('aether_archive_result', $result, $progressId);

		// Mark progress as complete.
		\set_transient($progressId, ['progress' => 100, 'complete' => true], 1800);

		/**
		 * Action fired after site archive is created successfully.
		 *
		 * @param array  $result      Export result.
		 * @param string $progressId  Progress ID.
		 *
		 * @example
		 * add_action('aether_archive_created', function($result, $progressId) {
		 *     error_log("Archive created: " . $result['zipPath']);
		 * }, 10, 2);
		 */
		\do_action('aether_archive_created', $result, $progressId);

		return \rest_ensure_response([
			'success' => true,
			'data' => $result,
			'message' => \__('Site archive created successfully', 'aether-site-exporter'),
		]);
	}

	/**
	 * Initialize archive creation (modular approach).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function initArchive(WP_REST_Request $request)
	{
		$jsonParams = $request->get_json_params();
		$customAssets = $jsonParams['custom_assets'] ?? null;

		if ($customAssets !== null && !\is_array($customAssets)) {
			return new WP_Error(
				'invalid_custom_assets',
				\__('custom_assets must be an array of plugin/theme slugs', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$exportService = new ExportService($this->plugin);
		$result = $exportService->initArchive($customAssets);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response($result);
	}

	/**
	 * Add database phase.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function addDatabasePhase(WP_REST_Request $request)
	{
		$jsonParams = $request->get_json_params();
		$zipPath = $jsonParams['zipPath'] ?? '';
		$currentProgress = $jsonParams['progress'] ?? [];

		if (empty($zipPath)) {
			return new WP_Error(
				'missing_zip_path',
				\__('zipPath is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$exportService = new ExportService($this->plugin);
		$result = $exportService->addDatabaseToZip($zipPath, $currentProgress);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response($result);
	}

	/**
	 * Get uploads batches.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getUploadsBatches(WP_REST_Request $request) // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	{
		$exportService = new ExportService($this->plugin);
		$batches = $exportService->getUploadsBatches();

		return \rest_ensure_response([
			'success' => true,
			'data' => [
				'batches' => \count($batches),
				'batchList' => \array_keys($batches),
			],
		]);
	}

	/**
	 * Add uploads batch.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function addUploadsBatch(WP_REST_Request $request)
	{
		$jsonParams = $request->get_json_params();
		$zipPath = $jsonParams['zipPath'] ?? '';
		$batchIndex = isset($jsonParams['batch']) ? (int) $jsonParams['batch'] : -1;
		$currentProgress = $jsonParams['progress'] ?? [];

		if (empty($zipPath)) {
			return new WP_Error(
				'missing_zip_path',
				\__('zipPath is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		if ($batchIndex < 0) {
			return new WP_Error(
				'missing_batch_index',
				\__('batch index is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$exportService = new ExportService($this->plugin);
		$result = $exportService->addUploadsBatchToZip($zipPath, $batchIndex, $currentProgress);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response($result);
	}

	/**
	 * Get plugins list.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getPluginsList(WP_REST_Request $request)
	{
		// Support both query params and JSON body for flexibility.
		$customAssets = $request->get_param('custom_assets');
		if (null === $customAssets) {
			$jsonParams = $request->get_json_params();
			$customAssets = $jsonParams['custom_assets'] ?? null;
		}
		if (\is_string($customAssets)) {
			$customAssets = \json_decode($customAssets, true);
		}

		$exportService = new ExportService($this->plugin);
		$plugins = $exportService->getPluginsList($customAssets);

		return \rest_ensure_response([
			'success' => true,
			'data' => [
				'plugins' => $plugins,
			],
		]);
	}

	/**
	 * Add plugin.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function addPlugin(WP_REST_Request $request)
	{
		$jsonParams = $request->get_json_params();
		$zipPath = $jsonParams['zipPath'] ?? '';
		$pluginSlug = $jsonParams['slug'] ?? '';
		$currentProgress = $jsonParams['progress'] ?? [];

		if (empty($zipPath)) {
			return new WP_Error(
				'missing_zip_path',
				\__('zipPath is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		if (empty($pluginSlug)) {
			return new WP_Error(
				'missing_plugin_slug',
				\__('slug is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$exportService = new ExportService($this->plugin);
		$result = $exportService->addPluginToZip($zipPath, $pluginSlug, $currentProgress);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response($result);
	}

	/**
	 * Get themes list.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getThemesList(WP_REST_Request $request)
	{
		// Support both query params and JSON body for flexibility.
		$customAssets = $request->get_param('custom_assets');
		if (null === $customAssets) {
			$jsonParams = $request->get_json_params();
			$customAssets = $jsonParams['custom_assets'] ?? null;
		}
		if (\is_string($customAssets)) {
			$customAssets = \json_decode($customAssets, true);
		}

		$exportService = new ExportService($this->plugin);
		$themes = $exportService->getThemesList($customAssets);

		return \rest_ensure_response([
			'success' => true,
			'data' => [
				'themes' => $themes,
			],
		]);
	}

	/**
	 * Add theme.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function addTheme(WP_REST_Request $request)
	{
		$jsonParams = $request->get_json_params();
		$zipPath = $jsonParams['zipPath'] ?? '';
		$themeSlug = $jsonParams['slug'] ?? '';
		$currentProgress = $jsonParams['progress'] ?? [];

		if (empty($zipPath)) {
			return new WP_Error(
				'missing_zip_path',
				\__('zipPath is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		if (empty($themeSlug)) {
			return new WP_Error(
				'missing_theme_slug',
				\__('slug is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$exportService = new ExportService($this->plugin);
		$result = $exportService->addThemeToZip($zipPath, $themeSlug, $currentProgress);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response($result);
	}

	/**
	 * Get mu-plugins batches.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getMuPluginsBatches(WP_REST_Request $request) // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	{
		$exportService = new ExportService($this->plugin);
		$batches = $exportService->getMuPluginsBatches();

		return \rest_ensure_response([
			'success' => true,
			'data' => [
				'batches' => \count($batches),
				'batchList' => \array_keys($batches),
			],
		]);
	}

	/**
	 * Add mu-plugins batch.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function addMuPluginsBatch(WP_REST_Request $request)
	{
		$jsonParams = $request->get_json_params();
		$zipPath = $jsonParams['zipPath'] ?? '';
		$batchIndex = isset($jsonParams['batch']) ? (int) $jsonParams['batch'] : -1;
		$currentProgress = $jsonParams['progress'] ?? [];

		if (empty($zipPath)) {
			return new WP_Error(
				'missing_zip_path',
				\__('zipPath is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		if ($batchIndex < 0) {
			return new WP_Error(
				'missing_batch_index',
				\__('batch index is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$exportService = new ExportService($this->plugin);
		$result = $exportService->addMuPluginsBatchToZip($zipPath, $batchIndex, $currentProgress);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response($result);
	}

	/**
	 * Finalize archive.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function finalizeArchive(WP_REST_Request $request)
	{
		$jsonParams = $request->get_json_params();
		$zipPath = $jsonParams['zipPath'] ?? '';

		if (empty($zipPath)) {
			return new WP_Error(
				'missing_zip_path',
				\__('zipPath is required', 'aether-site-exporter'),
				['status' => 422]
			);
		}

		$exportService = new ExportService($this->plugin);
		$result = $exportService->finalizeArchive($zipPath);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response([
			'success' => true,
			'data' => $result,
			'message' => \__('Archive finalized successfully', 'aether-site-exporter'),
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

		// Note: Progress is now tracked in frontend (React state + IndexedDB)
		// This endpoint is kept for backward compatibility but returns empty progress
		// Frontend should manage progress state internally
		return \rest_ensure_response([
			'success' => true,
			'data' => [
				'progress' => 0,
				'message' => 'Progress is tracked in frontend',
			],
		]);
	}

	/**
	 * Generate blueprint bundle.
	 *
	 * Creates a blueprint-bundle.zip file containing blueprint.json and wp-content.zip.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error Response object.
	 */
	public function generateBlueprintBundle(WP_REST_Request $request)
	{
		$params = $request->get_json_params();
		$blueprintData = $params['blueprintData'] ?? [];
		$archiveResult = $params['archiveResult'] ?? [];

		// Validate inputs
		if (empty($blueprintData)) {
			return new WP_Error(
				'missing_blueprint_data',
				\__('Blueprint data is required', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		// Validate blueprint schema to prevent malformed data
		if (! \is_array($blueprintData)) {
			return new WP_Error(
				'invalid_blueprint_structure',
				\__('Blueprint data must be an array', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		// Blueprint must have required fields
		if (! isset($blueprintData['landingPage']) || ! isset($blueprintData['steps'])) {
			return new WP_Error(
				'invalid_blueprint_schema',
				\__('Blueprint must contain landingPage and steps', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		if (empty($archiveResult['zipPath'])) {
			return new WP_Error(
				'missing_archive_path',
				\__('Archive path is required', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		$zipPath = $archiveResult['zipPath'];

		// Resolve to absolute path if relative
		// Check if path is absolute (starts with / on Unix or C:\ on Windows)
		$isAbsolute = (
			\strpos($zipPath, '/') === 0 ||
			\preg_match('/^[a-zA-Z]:[\\\\\\/]/', $zipPath)
		);

		if (!$isAbsolute) {
			$zipPath = ABSPATH . $zipPath;
		}

		// Verify wp-content.zip exists
		if (!\file_exists($zipPath)) {
			return new WP_Error(
				'archive_not_found',
				\__('Archive file not found', 'aether-site-exporter'),
				['status' => 404]
			);
		}

		/**
		 * Filter blueprint data before bundle generation.
		 *
		 * Allows modification of blueprint steps, landing page, and other settings.
		 *
		 * @param array $blueprintData Blueprint data array with steps and landingPage.
		 * @param array $archiveResult Archive result with zipPath.
		 *
		 * @example
		 * add_filter('aether_blueprint_data', function($blueprintData, $archiveResult) {
		 *     // Add custom step to blueprint
		 *     $blueprintData['steps'][] = [
		 *         'step' => 'runPHP',
		 *         'code' => '<?php echo "Custom setup"; ?>',
		 *     ];
		 *     return $blueprintData;
		 * }, 10, 2);
		 */
		$blueprintData = \apply_filters('aether_blueprint_data', $blueprintData, $archiveResult);

		// Get bundle filename from enabled instance config.
		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType('blueprint_bundle');
		$exportPath = 'blueprint-bundle/bundle.zip';

		if ($instance && isset($instance['config']['export_path'])) {
			$exportPath = $instance['config']['export_path'];
		}
		$bundleFilename = \basename($exportPath);

		/**
		 * Action fired before blueprint bundle generation.
		 *
		 * @param array  $blueprintData Blueprint data.
		 * @param string $zipPath       Path to wp-content.zip.
		 * @param string $outputDir     Output directory for bundle.
		 *
		 * @example
		 * add_action('aether_blueprint_before_generate', function($blueprintData, $zipPath, $outputDir) {
		 *     error_log("Generating blueprint bundle in: {$outputDir}");
		 * }, 10, 3);
		 */
		\do_action('aether_blueprint_before_generate', $blueprintData, $zipPath, \dirname($zipPath));

		// Generate blueprint bundle
		$generator = new BlueprintBundleGenerator();
		$outputDir = \dirname($zipPath); // Same directory as wp-content.zip
		$bundlePath = $generator->generate($blueprintData, $zipPath, $outputDir, $bundleFilename);

		if ($bundlePath === false) {
			return new WP_Error(
				'generation_failed',
				\__('Failed to generate blueprint bundle', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		// Get bundle URL (convert absolute path to URL)
		$bundleUrl = \str_replace(ABSPATH, \trailingslashit(\site_url()), $bundlePath);
		$bundleSize = \filesize($bundlePath);

		$bundleResult = [
			'bundlePath' => $bundlePath,
			'bundleUrl' => $bundleUrl,
			'bundleSize' => $bundleSize,
		];

		/**
		 * Filter blueprint bundle result.
		 *
		 * Allows modification of bundle result data.
		 *
		 * @param array $bundleResult Result data with bundlePath, bundleUrl, bundleSize.
		 *
		 * @example
		 * add_filter('aether_blueprint_bundle_result', function($result) {
		 *     $result['custom_metadata'] = 'added by filter';
		 *     return $result;
		 * });
		 */
		$bundleResult = \apply_filters('aether_blueprint_bundle_result', $bundleResult);

		/**
		 * Action fired after blueprint bundle is generated successfully.
		 *
		 * @param array $bundleResult Bundle result data.
		 *
		 * @example
		 * add_action('aether_blueprint_generated', function($result) {
		 *     error_log("Blueprint bundle created: " . $result['bundlePath']);
		 * });
		 */
		\do_action('aether_blueprint_generated', $bundleResult);

		return \rest_ensure_response([
			'success' => true,
			'data' => $bundleResult,
		]);
	}
}
