<?php

/**
 * REST Controller for Export Operations
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use Aether\Plugin;
use Aether\Services\ExportService;
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
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	private $plugin;

	/**
	 * Export service.
	 *
	 * @var ExportService
	 */
	private $exportService;

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

		\register_rest_route(
			$this->getNamespace(),
			'/export-site/status/(?P<jobId>[a-zA-Z0-9_]+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'exportStatus' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		\register_rest_route(
			$this->getNamespace(),
			'/export-site/download/(?P<jobId>[a-zA-Z0-9_]+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'downloadExport' ],
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

		// Note: WordPress Playground requires SQLite database.
		// This endpoint assumes SQLite is being used.

		// Generate job ID.
		$jobId = 'export_' . \time() . '_' . \wp_generate_password(8, false);

		// Create temp zip file path.
		$tempDir = \sys_get_temp_dir();
		$zipPath = $tempDir . '/wp-content-export-' . $jobId . '.zip';

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
		$customAssets = $this->plugin->getAllCustomAssets();

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

		// Store job state in transient.
		$totalItems = \count($itemsToAdd);

		\set_transient(
			$jobId,
			[
				'status'        => 'processing',
				'zipPath'      => $zipPath,
				'itemsToAdd'  => $itemsToAdd,
				'itemsAdded'   => [],
				'currentIndex' => 0,
				'totalItems'   => $totalItems,
				'started'       => \time(),
			],
			600 // 10 minutes.
		);

		return \rest_ensure_response(
			[
				'success'     => true,
				'jobId'      => $jobId,
				'totalItems' => $totalItems,
				'message'     => \__('Export started', 'aether-site-exporter'),
			]
		);
	}

	/**
	 * Get export job status and process next item.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function exportStatus(WP_REST_Request $request)
	{
		$jobId = \sanitize_key($request->get_param('jobId'));

		$status = \get_transient($jobId);

		if (false === $status) {
			return new WP_Error(
				'job_not_found',
				\__('Export job not found or expired', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		// If complete, return completion status.
		if ('complete' === $status['status']) {
			return \rest_ensure_response(
				[
					'success' => true,
					'status'  => 'complete',
					'message' => \__('Export complete', 'aether-site-exporter'),
				]
			);
		}

		// Get next item to process.
		$currentIndex = $status['currentIndex'];
		$itemsToAdd  = $status['itemsToAdd'];
		$totalItems   = \count($itemsToAdd);

		if ($currentIndex >= $totalItems) {
			// All items added - mark as complete.
			$status['status'] = 'complete';
			\set_transient($jobId, $status, 600);

			return \rest_ensure_response(
				[
					'success' => true,
					'status'  => 'complete',
					'message' => \__('Export complete', 'aether-site-exporter'),
				]
			);
		}

		// Process current item.
		$item = $itemsToAdd[ $currentIndex ];

		// Open zip file.
		$zip = new \ZipArchive();
		if (true !== $zip->open($status['zipPath'], \ZipArchive::CREATE)) {
			return new WP_Error(
				'zip_open_failed',
				\__('Failed to open export zip', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// Add file or directory to zip based on type.
		if ('database' === $item['type'] && \is_file($item['source'])) {
			// Database is a single file - add directly.
			$zip->addFile($item['source'], $item['dest']);
		} elseif (\is_dir($item['source'])) {
			// Everything else is a directory - add recursively.
			$this->exportService->addDirectoryToZip($zip, $item['source'], $item['dest']);
		}

		// Close zip.
		$zip->close();

		// Update status.
		$status['itemsAdded'][]  = $item;
		$status['currentIndex'] += 1;
		\set_transient($jobId, $status, 600);

		$progressPercent = \round(( $status['currentIndex'] / $status['totalItems'] ) * 100);

		return \rest_ensure_response(
			[
				'success'  => true,
				'status'   => 'processing',
				'progress' => $progressPercent,
				'current'  => $status['currentIndex'],
				'total'    => $status['totalItems'],
				'message'  => \sprintf(
					/* translators: 1: item type, 2: item name */
					\__('Added %1$s: %2$s', 'aether-site-exporter'),
					$item['type'],
					$item['name']
				),
			]
		);
	}

	/**
	 * Download completed export.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error|void
	 */
	public function downloadExport(WP_REST_Request $request)
	{
		$jobId = \sanitize_key($request->get_param('jobId'));

		$status = \get_transient($jobId);

		if (false === $status) {
			return new WP_Error(
				'job_not_found',
				\__('Export job not found or expired', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		if ('complete' !== $status['status']) {
			return new WP_Error(
				'export_incomplete',
				\__('Export not yet complete', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$zipPath = $status['zipPath'];

		if (! \file_exists($zipPath)) {
			return new WP_Error(
				'file_not_found',
				\__('Export file not found', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		$zipSize = \filesize($zipPath);

		// Return binary response directly (bypass REST API JSON encoding).
		// We MUST stream the file instead of loading it into memory to avoid
		// memory exhaustion with large files (179+ MB).

		// Set headers directly.
		\header('Content-Type: application/zip');
		\header('Content-Length: ' . $zipSize);
		\header('Content-Disposition: attachment; filename="wp-content-complete.zip"');

		// Stream the file directly without loading it into memory.
		// readfile() reads and outputs a file in chunks (8KB by default).
		\readfile($zipPath);

		// Clean up after successful download.
		@\unlink($zipPath);
		\delete_transient($jobId);

		exit;
	}
}
