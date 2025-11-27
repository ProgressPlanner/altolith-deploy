<?php

/**
 * Export Service
 *
 * Handles site export operations (database + wp-content).
 *
 * @package Aether\Services
 */

namespace Aether\SiteExporter\Services;

use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Utilities\TempDirectoryManager;
use Aether\SiteExporter\Utilities\SecurityValidator;
use Aether\SiteExporter\Services\ZipService;
use Aether\SiteExporter\Services\FileBatchService;

\defined('ABSPATH') || exit;

/**
 * Service for exporting complete site.
 */
class ExportService
{
	/**
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	private Plugin $plugin;

	/**
	 * ZIP service instance.
	 *
	 * @var ZipService
	 */
	private ZipService $zipService;

	/**
	 * File batch service instance.
	 *
	 * @var FileBatchService
	 */
	private FileBatchService $fileBatchService;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct(Plugin $plugin)
	{
		$this->plugin = $plugin;
		$this->fileBatchService = new FileBatchService();
		$this->zipService = new ZipService($this->fileBatchService);
	}

	/**
	 * Export complete site as single zip file.
	 *
	 * Creates wp-content.zip containing:
	 * - Database (SQLite)
	 * - Uploads directory
	 * - Custom plugins
	 * - Custom themes
	 * - MU-plugins directory
	 *
	 * @param string             $progressId       Progress ID for tracking (unused).
	 * @param array<string>|null $customAssetSlugs Optional array of custom plugin/theme slugs to include in zip.
	 *                                             If provided, only these assets are added. If null, all custom assets are added.
	 * @return array<string, mixed>|\WP_Error Result array with zipPath and zipSize, or WP_Error on failure.
	 */
	public function exportCompleteSite(string $progressId = '', ?array $customAssetSlugs = null)
	{
		// Note: WordPress Playground requires SQLite database.
		// This method assumes SQLite is being used.

		// WordPress Playground Compatibility:
		// Use TempDirectoryManager instead of sys_get_temp_dir() because
		// WordPress Playground's WASM environment may not have /tmp access.
		// This uses wp-content/uploads/aether-temp instead.
		$tempZipPath = TempDirectoryManager::getTempFilePath('wp-content-complete-', '.zip');

		if (false === $tempZipPath) {
			return new \WP_Error(
				'temp_directory_unavailable',
				\__('Could not create temporary directory for export. Please check file permissions.', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		// Create wp-content.zip in temp location.
		// Each provider instance will handle moving it to their export_path.
		$zipPath = $tempZipPath;

		// Initialize zip archive with CREATE and OVERWRITE flags.
		// CREATE: Create archive if it doesn't exist.
		// OVERWRITE: Replace existing archive if it exists.
		// Create in temp directory - each provider instance will handle moving it to their export_path.
		$zip = new \ZipArchive();
		if (true !== $zip->open($tempZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE)) {
			return new \WP_Error(
				'zip_create_failed',
				\__('Failed to create site export zip', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// 1. Add database file first (most critical for site restoration).
		// Database is stored in wp-content/database/ subdirectory in the zip.
		// This maintains WordPress Playground's expected structure.
		$dbPath = $this->getDatabasePath();
		if (false !== $dbPath && \file_exists($dbPath)) {
			$dbRelativePath = 'wp-content/database/' . \basename($dbPath);
			$zip->addFile($dbPath, $dbRelativePath);
		}

		// 2. Add uploads directory (user media files).
		// Skips files already offloaded to external storage (external storage).
		// This prevents duplicate uploads and reduces zip size.
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		if (\is_dir($uploadsDir)) {
			$this->zipService->addDirectoryToZip($zip, $uploadsDir, 'wp-content/uploads');
		}

		// 3. Add custom plugins only (non-wordpress.org plugins).
		// WordPress.org plugins are excluded from the blueprint as they'll be downloaded
		// from the WordPress.org API when Playground loads the blueprint.
		// This dramatically reduces zip size (potentially GB → MB).
		if (null !== $customAssetSlugs) {
			// Use provided custom asset slugs (from browser-based WordPress.org detection).
			foreach ($customAssetSlugs as $slug) {
				// Skip 'aether' plugin - it's added separately in blueprint from aether.zip URL.
				if ('aether' === $slug) {
					continue;
				}

				// Security: Type check first
				if (!\is_string($slug)) {
					continue;
				}

				// Security: Sanitize BEFORE validation to prevent bypasses
				$slug = \sanitize_file_name($slug);

				// Security: Validate slug doesn't contain path traversal, null bytes, or dangerous values
				$slugValidation = SecurityValidator::validateSlug($slug);
				if (! $slugValidation['valid']) {
					continue;
				}

				$pluginDir = WP_PLUGIN_DIR . '/' . $slug;
				if (\is_dir($pluginDir)) {
					$this->zipService->addDirectoryToZip($zip, $pluginDir, 'wp-content/plugins/' . $slug, '', null, null);
				}
			}
		} else {
			// Use PHP-based detection to get all custom assets (includes all active plugins).
			$customAssets = $this->plugin->getAssetDiscovery()->getAllCustomAssets();
			foreach ($customAssets as $asset) {
				if ('plugin' === $asset['type']) {
					// Skip 'aether' plugin - it's added separately in blueprint from aether.zip URL.
					if ('aether' === $asset['slug']) {
						continue;
					}
					$pluginDir = WP_PLUGIN_DIR . '/' . $asset['slug'];
					if (\is_dir($pluginDir)) {
						$this->zipService->addDirectoryToZip($zip, $pluginDir, 'wp-content/plugins/' . $asset['slug'], '', null, null);
					}
				}
			}
		}

		// 4. Add custom themes only (non-wordpress.org themes).
		// Same exclusion strategy as plugins - wordpress.org themes are downloaded
		// from the API, only custom themes need to be included in the zip.
		if (null !== $customAssetSlugs) {
			// Use provided custom asset slugs (from browser-based WordPress.org detection).
			// Note: We need to detect which slugs are themes vs plugins.
			// For now, check if directory exists in themes directory.
			foreach ($customAssetSlugs as $slug) {
				// Security: Type check first
				if (!\is_string($slug)) {
					continue;
				}

				// Security: Sanitize BEFORE validation to prevent bypasses
				$slug = \sanitize_file_name($slug);

				// Security: Validate slug doesn't contain path traversal, null bytes, or dangerous values
				$slugValidation = SecurityValidator::validateSlug($slug);
				if (! $slugValidation['valid']) {
					continue;
				}

				$themeDir = \get_theme_root() . '/' . $slug;
				if (\is_dir($themeDir)) {
					$this->zipService->addDirectoryToZip($zip, $themeDir, 'wp-content/themes/' . $slug, '', null, null);
				}
			}
		} else {
			// Use PHP-based detection to get all custom themes (includes all active themes).
			foreach ($customAssets as $asset) {
				if ('theme' === $asset['type']) {
					$themeDir = \get_theme_root() . '/' . $asset['slug'];
					if (\is_dir($themeDir)) {
						$this->zipService->addDirectoryToZip($zip, $themeDir, 'wp-content/themes/' . $asset['slug'], '', null, null);
					}
				}
			}
		}

		// 5. Add mu-plugins directory (must-use plugins).
		// MU-plugins are always custom and must be included in full.
		// No wordpress.org equivalent exists for mu-plugins.
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		if (\is_dir($mupluginsDir)) {
			$this->zipService->addDirectoryToZip($zip, $mupluginsDir, 'wp-content/mu-plugins', '', null, null);
		}

		// Final progress update (100%).

		// Close zip archive to finalize writing.
		$zip->close();

		// Get final file size for response (used for progress tracking in UI).
		$zipSize = \filesize($zipPath);

		// Generate URL for temp file.
		// Note: Temp directory has .htaccess protection, so files aren't directly web-accessible.
		// The URL is used for metadata/reference; actual file access is via PHP file operations.
		// Convert absolute path to URL using content_url().
		$relativePath = \str_replace(WP_CONTENT_DIR, '', $zipPath);
		$zipUrl = \content_url($relativePath);

		$result = [
			'success'  => true,
			'zipPath' => $zipPath,
			'zipUrl'  => $zipUrl,
			'zipSize' => $zipSize,
		];

		/**
		 * Filter the export complete site result.
		 *
		 * Allows tests to override the result.
		 *
		 * @param array<string, mixed>|\WP_Error $result Export result.
		 */
		return \apply_filters('aether_site_exporter_export_complete_site', $result);
	}

	/**
	 * Get the path to the SQLite database file.
	 *
	 * @return string|false Path to database file, or false if not found.
	 */
	public function getDatabasePath()
	{
		// Standard location for SQLite Database Integration plugin.
		$databaseFile = WP_CONTENT_DIR . '/database/.ht.sqlite';

		if (\file_exists($databaseFile)) {
			return $databaseFile;
		}

		// Check alternative locations.
		$alternativePaths = [
			WP_CONTENT_DIR . '/database/wordpress.db',
			WP_CONTENT_DIR . '/database.sqlite',
			WP_CONTENT_DIR . '/.ht.sqlite',
		];

		foreach ($alternativePaths as $path) {
			if (\file_exists($path)) {
				return $path;
			}
		}

		return false;
	}
}
