<?php

/**
 * Export Steps Controller
 *
 * Handles PHP-based export workflow steps (URL discovery, archive creation, etc.).
 *
 * @package AetherSiteExporter\REST
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\REST;

use AetherSiteExporter\Sync\JobStateManager;
use AetherSiteExporter\Services\URLDiscoveryService;
use AetherSiteExporter\Services\StaticSiteGenerator;
use AetherSiteExporter\Services\BlueprintBundleExporter;
use WP_REST_Request;
use WP_Error;

/**
 * Export steps controller.
 *
 * @since 1.0.0
 */
class ExportStepsController
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
		// Discover URLs.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/discover-urls',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'discover_urls' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Generate blueprint bundle.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/generate-blueprint',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'generate_blueprint_bundle' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Create static site archive.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/create-archive',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'create_static_site_archive' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Cleanup old exports.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/cleanup',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'cleanup' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);
	}

	/**
	 * Discover URLs step.
	 *
	 * Uses URLDiscoveryService to find all URLs on the site that need to be exported.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function discover_urls(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		try {
			// Use URLDiscoveryService to find all URLs.
			$discovery_service = new URLDiscoveryService();
			$urls = $discovery_service->discoverAllUrls();

			// Update job state with discovered URLs.
			$this->state_manager->update_status(
				$job_id,
				[
					'workflow_state' => [
						'urls'     => $urls,
						'urlCount' => \count($urls),
					],
				]
			);

			return $this->success_response(
				[
					'urls'     => $urls,
					'urlCount' => \count($urls),
					'stats'    => $discovery_service->getStats(),
				],
				\sprintf(
					/* translators: %d: number of URLs */
					\__('Discovered %d URLs', 'aether-site-exporter'),
					\count($urls)
				)
			);
		} catch (\Exception $e) {
			return $this->error_response(
				$e->getMessage(),
				'url_discovery_failed',
				500
			);
		}
	}

	/**
	 * Generate blueprint bundle step.
	 *
	 * Creates a WordPress Playground blueprint bundle with SQLite database.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function generate_blueprint_bundle(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		try {
			// Get job configuration.
			$job = $this->state_manager->get_status($job_id);
			if (! $job) {
				return $this->error_response(
					\__('Job not found', 'aether-site-exporter'),
					'job_not_found',
					404
				);
			}

			$config = $job['config'] ?? [];

			// Check for SQLite database.
			// WordPress Playground uses SQLite, so we need to convert MySQL to SQLite.
			// For now, we'll check if a SQLite database already exists.
			$sqlite_path = WP_CONTENT_DIR . '/database/.ht.sqlite';

			if (! \file_exists($sqlite_path)) {
				return $this->error_response(
					\__('SQLite database not found. Please install a SQLite integration plugin first.', 'aether-site-exporter'),
					'sqlite_not_found',
					400
				);
			}

			// Determine bundle directory (use custom path if provided).
			$bundle_dir = ! empty($config['blueprintPath'])
				? \rtrim($config['blueprintPath'], '/') . '/' . $job_id
				: AETHER_EXPORTS_DIR . '/' . $job_id . '/blueprint-bundle';

			if (! \file_exists($bundle_dir)) {
				\wp_mkdir_p($bundle_dir);
			}

			// Generate blueprint bundle.
			$exporter = new BlueprintBundleExporter();

			// Prepare config for blueprint generator.
			$blueprint_config = \array_merge(
				$config,
				[
					'includeWpContent' => true,
					'wpContentPath' => WP_CONTENT_DIR,
					'landingPage' => $config['landingPage'] ?? '/',
				]
			);

			$result = $exporter->create_blueprint($sqlite_path, $bundle_dir, $blueprint_config);

			if (! $result['success']) {
				return $this->error_response(
					$result['error'] ?? \__('Failed to create blueprint', 'aether-site-exporter'),
					'blueprint_creation_failed',
					500
				);
			}

			// Create bundle ZIP.
			$zip_path = AETHER_EXPORTS_DIR . '/' . $job_id . '-blueprint.zip';
			$zip_result = $exporter->create_bundle_zip($bundle_dir, $zip_path);

			if (! $zip_result['success']) {
				return $this->error_response(
					$zip_result['error'] ?? \__('Failed to create blueprint ZIP', 'aether-site-exporter'),
					'blueprint_zip_failed',
					500
				);
			}

			// Update job state.
			$this->state_manager->update_status(
				$job_id,
				[
					'workflow_state' => \array_merge(
						$job['workflow_state'] ?? [],
						[
							'blueprintZip' => $zip_path,
							'blueprintSize' => $zip_result['size'] ?? 0,
						]
					),
				]
			);

			return $this->success_response(
				[
					'zipPath' => $zip_path,
					'size'    => $zip_result['size'] ?? 0,
				],
				\__('Blueprint bundle generated', 'aether-site-exporter')
			);
		} catch (\Exception $e) {
			return $this->error_response(
				$e->getMessage(),
				'blueprint_generation_failed',
				500
			);
		}
	}

	/**
	 * Create static site archive step.
	 *
	 * Generates static HTML files and creates a ZIP archive.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function create_static_site_archive(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		try {
			// Get job configuration.
			$job = $this->state_manager->get_status($job_id);
			if (! $job) {
				return $this->error_response(
					\__('Job not found', 'aether-site-exporter'),
					'job_not_found',
					404
				);
			}

			$config = $job['config'] ?? [];

			// Determine output directory (use custom path if provided).
			$output_dir = ! empty($config['staticSitePath'])
				? \rtrim($config['staticSitePath'], '/') . '/' . $job_id
				: AETHER_EXPORTS_DIR . '/' . $job_id . '/static-site';

			if (! \file_exists($output_dir)) {
				\wp_mkdir_p($output_dir);
			}

			// Generate static site.
			$generator = new StaticSiteGenerator();
			$result = $generator->generate_static_site($output_dir, $config);

			if (! $result['success']) {
				return $this->error_response(
					$result['error'] ?? \__('Failed to generate static site', 'aether-site-exporter'),
					'static_generation_failed',
					500
				);
			}

			// Create ZIP archive.
			$zip_path = AETHER_EXPORTS_DIR . '/' . $job_id . '-static-site.zip';
			$zip_result = $generator->create_static_zip($output_dir, $zip_path);

			if (! $zip_result['success']) {
				return $this->error_response(
					$zip_result['error'] ?? \__('Failed to create ZIP archive', 'aether-site-exporter'),
					'zip_creation_failed',
					500
				);
			}

			// Update job state.
			$this->state_manager->update_status(
				$job_id,
				[
					'workflow_state' => \array_merge(
						$job['workflow_state'] ?? [],
						[
							'staticSiteZip' => $zip_path,
							'staticSiteSize' => $zip_result['size'] ?? 0,
						]
					),
				]
			);

			return $this->success_response(
				[
					'zipPath' => $zip_path,
					'size'    => $zip_result['size'] ?? 0,
					'progress' => $result,
				],
				\__('Static site archive created', 'aether-site-exporter')
			);
		} catch (\Exception $e) {
			return $this->error_response(
				$e->getMessage(),
				'static_archive_failed',
				500
			);
		}
	}

	/**
	 * Cleanup step.
	 *
	 * Cleans up temporary files created during export process.
	 * Keeps final ZIP files but removes intermediate directories.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function cleanup(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		try {
			$cleaned = 0;

			// Clean up static site directory (keep only ZIP).
			$static_dir = AETHER_EXPORTS_DIR . '/' . $job_id . '/static-site';
			if (\is_dir($static_dir)) {
				$this->delete_directory($static_dir);
				$cleaned++;
			}

			// Clean up blueprint bundle directory (keep only ZIP).
			$bundle_dir = AETHER_EXPORTS_DIR . '/' . $job_id . '/blueprint-bundle';
			if (\is_dir($bundle_dir)) {
				$this->delete_directory($bundle_dir);
				$cleaned++;
			}

			// Clean up job directory if it's now empty.
			$job_dir = AETHER_EXPORTS_DIR . '/' . $job_id;
			if (\is_dir($job_dir) && $this->is_directory_empty($job_dir)) {
				\rmdir($job_dir);
			}

			return $this->success_response(
				[
					'cleanedItems' => $cleaned,
				],
				\sprintf(
					/* translators: %d: number of items cleaned */
					\__('Cleanup complete. Removed %d temporary items.', 'aether-site-exporter'),
					$cleaned
				)
			);
		} catch (\Exception $e) {
			return $this->error_response(
				$e->getMessage(),
				'cleanup_failed',
				500
			);
		}
	}

	/**
	 * Delete directory recursively.
	 *
	 * @since 1.0.0
	 * @param string $dir Directory path.
	 * @return void
	 */
	private function delete_directory(string $dir): void
	{
		if (! \is_dir($dir)) {
			return;
		}

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
			\RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ($files as $file) {
			if ($file->isDir()) {
				\rmdir($file->getRealPath());
			} else {
				\unlink($file->getRealPath());
			}
		}

		\rmdir($dir);
	}

	/**
	 * Check if directory is empty.
	 *
	 * @since 1.0.0
	 * @param string $dir Directory path.
	 * @return bool True if empty.
	 */
	private function is_directory_empty(string $dir): bool
	{
		if (! \is_dir($dir)) {
			return true;
		}

		$handle = \opendir($dir);
		if (false === $handle) {
			return true;
		}

		while (false !== ($entry = \readdir($handle))) {
			if ('.' !== $entry && '..' !== $entry) {
				\closedir($handle);
				return false;
			}
		}

		\closedir($handle);
		return true;
	}
}
