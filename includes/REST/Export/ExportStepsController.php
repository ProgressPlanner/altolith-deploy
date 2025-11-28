<?php

/**
 * Consolidated Export Steps Controller
 *
 * Handles all export workflow step endpoints in a single controller.
 * Consolidates: GenerateBlueprintController, createBlueprintBundleController,
 * GenerateStaticSiteController, PrepareUploadManifestController.
 *
 * @package Altolith\REST\Export
 */

namespace Altolith\Deploy\REST\Export;

use Altolith\Deploy\REST\RESTHelpersTrait;
use Altolith\Deploy\Plugin;
use Altolith\Deploy\Services\ExportService;
use Altolith\Deploy\Services\BlueprintBundleGenerator;
use WP_REST_Request;
use WP_Error;

/**
 * Unified controller for all export workflow steps.
 */
class ExportStepsController
{
	use RESTHelpersTrait;

	/**
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	private Plugin $plugin;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct(Plugin $plugin)
	{
		$this->plugin = $plugin;
	}

	/**
	 * Register REST routes for all steps.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Create archive without job tracking (stateless).
		\register_rest_route(
			$this->getNamespace(),
			'/export/createArchive',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'createArchive' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Generate blueprint bundle.
		\register_rest_route(
			$this->getNamespace(),
			'/export/generateBlueprintBundle',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'generateBlueprintBundle' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
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
				\__('custom_assets must be an array of plugin/theme slugs', 'altolith-deploy'),
				['status' => 422]
			);
		}

		// Generate unique progress ID.
		$progressId = 'altolith_deploy_archive_' . \time() . '_' . \wp_generate_password(8, false);

		/**
		 * Action fired before site archive creation starts.
		 *
		 * @param string     $progressId    Progress ID for tracking.
		 * @param array|null $customAssets  Custom assets filter (plugin/theme slugs).
		 *
		 * @example
		 * add_action('altolith_archive_before_create', function($progressId, $customAssets) {
		 *     error_log("Starting archive creation: {$progressId}");
		 * }, 10, 2);
		 */
		\do_action('altolith_archive_before_create', $progressId, $customAssets);

		// Create export service.
		$exportService = new ExportService($this->plugin);

		// Export complete site.
		// If customAssets provided, only those plugins/themes are included in zip.
		$result = $exportService->exportCompleteSite($progressId, $customAssets);

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
		 * add_filter('altolith_archive_result', function($result, $progressId) {
		 *     $result['custom_metadata'] = 'added by filter';
		 *     return $result;
		 * }, 10, 2);
		 */
		$result = \apply_filters('altolith_archive_result', $result, $progressId);

		/**
		 * Action fired after site archive is created successfully.
		 *
		 * @param array  $result      Export result.
		 * @param string $progressId  Progress ID.
		 *
		 * @example
		 * add_action('altolith_archive_created', function($result, $progressId) {
		 *     error_log("Archive created: " . $result['zipPath']);
		 * }, 10, 2);
		 */
		\do_action('altolith_archive_created', $result, $progressId);

		return \rest_ensure_response([
			'success' => true,
			'data' => $result,
			'message' => \__('Site archive created successfully', 'altolith-deploy'),
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
		$validationError = $this->validateRequiredParam($blueprintData, 'blueprint_data');
		if ($validationError) {
			return $validationError;
		}

		// Validate blueprint schema to prevent malformed data
		if (! \is_array($blueprintData)) {
			return new WP_Error(
				'invalid_blueprint_structure',
				\__('Blueprint data must be an array', 'altolith-deploy'),
				['status' => 400]
			);
		}

		// Blueprint must have required fields
		if (! isset($blueprintData['landingPage']) || ! isset($blueprintData['steps'])) {
			return new WP_Error(
				'invalid_blueprint_schema',
				\__('Blueprint must contain landingPage and steps', 'altolith-deploy'),
				['status' => 400]
			);
		}

		$validationError = $this->validateRequiredParam($archiveResult['zipPath'] ?? null, 'archive_path');
		if ($validationError) {
			return $validationError;
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
				\__('Archive file not found', 'altolith-deploy'),
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
		 * add_filter('altolith_blueprint_data', function($blueprintData, $archiveResult) {
		 *     // Add custom step to blueprint
		 *     $blueprintData['steps'][] = [
		 *         'step' => 'runPHP',
		 *         'code' => '<?php echo "Custom setup"; ?>',
		 *     ];
		 *     return $blueprintData;
		 * }, 10, 2);
		 */
		$blueprintData = \apply_filters('altolith_blueprint_data', $blueprintData, $archiveResult);

		// Use default bundle filename - providers handle their own paths.
		$bundleFilename = 'blueprint-bundle.zip';

		/**
		 * Action fired before blueprint bundle generation.
		 *
		 * @param array  $blueprintData Blueprint data.
		 * @param string $zipPath       Path to wp-content.zip.
		 * @param string $outputDir     Output directory for bundle.
		 *
		 * @example
		 * add_action('altolith_blueprint_before_generate', function($blueprintData, $zipPath, $outputDir) {
		 *     error_log("Generating blueprint bundle in: {$outputDir}");
		 * }, 10, 3);
		 */
		$outputDir = \dirname($zipPath); // Same directory as wp-content.zip (temp directory)
		\do_action('altolith_blueprint_before_generate', $blueprintData, $zipPath, $outputDir);

		// Generate blueprint bundle
		$generator = new BlueprintBundleGenerator();
		$bundlePath = $generator->generate($blueprintData, $zipPath, $outputDir, $bundleFilename);

		if ($bundlePath === false) {
			return new WP_Error(
				'generation_failed',
				\__('Failed to generate blueprint bundle', 'altolith-deploy'),
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
		 * add_filter('altolith_blueprint_bundle_result', function($result) {
		 *     $result['custom_metadata'] = 'added by filter';
		 *     return $result;
		 * });
		 */
		$bundleResult = \apply_filters('altolith_blueprint_bundle_result', $bundleResult);

		/**
		 * Action fired after blueprint bundle is generated successfully.
		 *
		 * @param array $bundleResult Bundle result data.
		 *
		 * @example
		 * add_action('altolith_blueprint_generated', function($result) {
		 *     error_log("Blueprint bundle created: " . $result['bundlePath']);
		 * });
		 */
		\do_action('altolith_blueprint_generated', $bundleResult);

		return \rest_ensure_response([
			'success' => true,
			'data' => $bundleResult,
		]);
	}
}
