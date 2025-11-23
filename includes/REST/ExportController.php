<?php

/**
 * REST Controller for Export Operations
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Services\ExportService;
use Aether\SiteExporter\Utilities\FileManager;
use Aether\SiteExporter\Utilities\TempDirectoryManager;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Handles REST API endpoints for site export operations.
 */
class ExportController
{
	use RESTHelpersTrait;

	/**
	 * Transient expiration time for export jobs (10 minutes).
	 *
	 * @var int
	 */
	private const EXPORT_JOB_EXPIRATION = 600;

	/**
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	private Plugin $plugin;

	/**
	 * Export service.
	 *
	 * @var ExportService
	 */
	private ExportService $exportService;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct(Plugin $plugin)
	{
		$this->plugin         = $plugin;
		$this->exportService = new ExportService($plugin);
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Chunked export endpoints (new, memory-efficient).
		\register_rest_route(
			$this->getNamespace(),
			'/export-site/start',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'startExport' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

	}

	/**
	 * Start chunked export process.
	 *
	 * Creates job ID, initializes zip file with database, returns items to add.
	 *
	 * @param \WP_REST_Request<array<string, mixed>> $_request Request object (unused, required by REST API interface).
	 * @return WP_REST_Response|WP_Error
	 */
	public function startExport(\WP_REST_Request $_request)
	{
		// CSRF protection: Verify nonce for state-changing operation
		$nonceCheck = $this->verifyNonce($_request);
		if (\is_wp_error($nonceCheck)) {
			return $nonceCheck;
		}

		// Rate limiting: Prevent DoS by limiting export frequency
		// Allow 5 exports per 5 minutes
		$rateLimitCheck = $this->checkRateLimit('export_start', 5, 300); // 300 seconds = 5 minutes
		if (\is_wp_error($rateLimitCheck)) {
			return $rateLimitCheck;
		}

		// Note: WordPress Playground requires SQLite database.
		// This endpoint assumes SQLite is being used.

		// Create temp zip file path using managed temp directory.
		$zipPath = TempDirectoryManager::getTempFilePath('wp-content-export-', '.zip');

		if (false === $zipPath) {
			return new WP_Error(
				'temp_directory_unavailable',
				\__('Could not create temporary directory for export. Please check file permissions.', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		// Initialize empty zip (don't add anything yet to avoid memory issues).
		$zip = new \ZipArchive();
		if (true !== $zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE)) {
			return new WP_Error(
				'zip_create_failed',
				\__('Failed to create export zip', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// Close empty zip (will be reopened in status calls).
		$zip->close();

		// Build list of items to add (including database as first item).
		$itemsToAdd = [];

		// Add database as the FIRST item in the manifest (will be added in chunked request).
		$dbPath = $this->exportService->getDatabasePath();
		if (false !== $dbPath && \file_exists($dbPath)) {
			$itemsToAdd[] = [
				'type'   => 'database',
				'slug'   => 'database',
				'name'   => 'Database',
				'source' => $dbPath,
				'dest'   => 'wp-content/database/' . \basename($dbPath),
			];
		}

		// Get custom assets (plugins/themes).
		$customAssets = $this->plugin->getAssetDiscovery()->getAllCustomAssets();

		// Add each custom plugin.
		foreach ($customAssets as $asset) {
			if ('plugin' === $asset['type']) {
				$pluginDir = WP_PLUGIN_DIR . '/' . $asset['slug'];
				if (\is_dir($pluginDir)) {
					$itemsToAdd[] = [
						'type'   => 'plugin',
						'slug'   => $asset['slug'],
						'name'   => $asset['name'],
						'source' => $pluginDir,
						'dest'   => 'wp-content/plugins/' . $asset['slug'],
					];
				}
			}
		}

		// Add each custom theme.
		foreach ($customAssets as $asset) {
			if ('theme' === $asset['type']) {
				$themeDir = \get_theme_root() . '/' . $asset['slug'];
				if (\is_dir($themeDir)) {
					$itemsToAdd[] = [
						'type'   => 'theme',
						'slug'   => $asset['slug'],
						'name'   => $asset['name'],
						'source' => $themeDir,
						'dest'   => 'wp-content/themes/' . $asset['slug'],
					];
				}
			}
		}

		// Add entire mu-plugins directory (includes both subdirectories and root-level files).
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		if (\is_dir($mupluginsDir)) {
			$itemsToAdd[] = [
				'type'   => 'mu-plugins',
				'slug'   => 'mu-plugins',
				'name'   => 'MU-Plugins',
				'source' => $mupluginsDir,
				'dest'   => 'wp-content/mu-plugins',
			];
		}

		// Add uploads directory as special item.
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		if (\is_dir($uploadsDir)) {
			$itemsToAdd[] = [
				'type'   => 'uploads',
				'slug'   => 'uploads',
				'name'   => 'Uploads',
				'source' => $uploadsDir,
				'dest'   => 'wp-content/uploads',
			];
		}

		$totalItems = \count($itemsToAdd);

		return \rest_ensure_response(
			[
				'success'     => true,
				'totalItems' => $totalItems,
				'message'     => \__('Export started', 'aether-site-exporter'),
			]
		);
	}
}
