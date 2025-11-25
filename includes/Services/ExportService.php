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
	 * @param string             $progressId       Progress ID for tracking (not used, kept for compatibility).
	 * @param mixed              $unused           Unused parameter (formerly stateManager, kept for compatibility).
	 * @param array<string>|null $customAssetSlugs Optional array of custom plugin/theme slugs to include in zip.
	 *                                             If provided, only these assets are added. If null, all custom assets are added.
	 * @return array<string, mixed>|\WP_Error Result array with zipPath and zipSize, or WP_Error on failure.
	 */
	public function exportCompleteSite(string $progressId = '', $unused = null, ?array $customAssetSlugs = null)
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

		// Get export path from enabled instance config.
		$instance = $this->getEnabledInstanceForDeploymentType('blueprint_bundle');
		$exportPath = 'blueprint-bundle/bundle.zip';

		if ($instance && isset($instance['config']['export_path'])) {
			$exportPath = $instance['config']['export_path'];
		}

		// Security: Validate export_path is a string and doesn't contain null bytes
		if (!\is_string($exportPath) || !SecurityValidator::isValidPath($exportPath)) {
			$exportPath = 'blueprint-bundle/bundle.zip';
		}

		// Extract directory and validate it to prevent path traversal attacks.
		$exportDir = \dirname($exportPath);

		// Security: Reject paths with path traversal sequences, absolute paths, or null bytes.
		// CRITICAL: Validate BEFORE any filesystem operations.
		$exportDirValidation = SecurityValidator::validateExportPath($exportDir);
		if (! $exportDirValidation['valid']) {
			return new \WP_Error(
				'invalid_export_path',
				\__('Invalid export path: path traversal not allowed', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$fullExportDir = \rtrim(ABSPATH, '/') . '/' . \ltrim($exportDir, '/');

		// Security: Validate parent directory exists and is within ABSPATH BEFORE creating anything.
		// This prevents creating directories outside ABSPATH via traversal.
		$parentDir = \dirname($fullExportDir);

		// Find the nearest existing ancestor directory to validate
		$checkDir = $parentDir;
		while (!\is_dir($checkDir) && \strlen($checkDir) > \strlen(ABSPATH)) {
			$checkDir = \dirname($checkDir);
		}

		// Validate the existing ancestor is within ABSPATH
		$realCheckDir = \realpath($checkDir);
		$realAbspath = \realpath(ABSPATH);
		if (
			false === $realCheckDir || false === $realAbspath ||
			0 !== \strpos($realCheckDir, $realAbspath)
		) {
			return new \WP_Error(
				'invalid_export_directory',
				\__('Invalid export directory: must be within WordPress installation', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// NOW safe to create the directory
		if (!\is_dir($fullExportDir)) {
			$created = \wp_mkdir_p($fullExportDir);
			if (!$created) {
				return new \WP_Error(
					'directory_creation_failed',
					\__('Failed to create export directory', 'aether-site-exporter'),
					[ 'status' => 500 ]
				);
			}
		}

		// Final security check: Validate the created directory is within ABSPATH.
		$realExportDir = \realpath($fullExportDir);
		$realAbspath = \realpath(ABSPATH);
		if (false === $realExportDir || false === $realAbspath || 0 !== \strpos($realExportDir, $realAbspath)) {
			// Clean up created directory if validation fails
			if (\is_dir($fullExportDir)) {
				@\rmdir($fullExportDir);
			}
			return new \WP_Error(
				'invalid_export_directory',
				\__('Invalid export directory: must be within WordPress installation', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Final location: Use the directory from export_path with wp-content.zip filename.
		$zipPath = $realExportDir . '/wp-content.zip';

		// Initialize zip archive with CREATE and OVERWRITE flags.
		// CREATE: Create archive if it doesn't exist.
		// OVERWRITE: Replace existing archive (cleanup from failed previous attempts).
		// Create in temp directory first, then move atomically to final location.
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
		//
		// If $customAssetSlugs is provided, only those assets are included.
		// Otherwise, use getAllCustomAssets() for backward compatibility.
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
			// Fallback: Use PHP-based detection (includes ALL active plugins).
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
			// Fallback: Use PHP-based detection (includes ALL active themes).
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

		// Move zip from temp directory to final web-accessible location.
		// This is an atomic operation - either succeeds or fails completely.
		if (! \rename($tempZipPath, $zipPath)) {
			// Cleanup temp file if move failed.
			@\unlink($tempZipPath);
			return new \WP_Error(
				'zip_move_failed',
				\__('Failed to move zip file to final location', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// Get final file size for response (used for progress tracking in UI).
		$zipSize = \filesize($zipPath);

		$result = [
			'success'  => true,
			'zipPath' => $zipPath,
			'zipUrl'  => 'wp-content/wp-content.zip', // Web-accessible URL path.
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
	 * Add directory to zip archive recursively.
	 *
	 * Delegates to ZipService for the actual implementation.
	 *
	 * @param \ZipArchive             $zip          ZipArchive instance.
	 * @param string                  $sourceDir   Source directory path.
	 * @param string                  $zipPath     Path inside zip.
	 * @param string                  $relativePath Relative path for recursion.
	 * @param array<int, string>|null $excludePatterns Exclusion patterns.
	 * @param array<int, string>|null $offloadedFiles Offloaded file paths.
	 * @return void
	 */
	public function addDirectoryToZip(\ZipArchive $zip, string $sourceDir, string $zipPath, string $relativePath = '', ?array $excludePatterns = null, ?array $offloadedFiles = null): void
	{
		// Delegate to ZipService for backward compatibility.
		$this->zipService->addDirectoryToZip($zip, $sourceDir, $zipPath, $relativePath, $excludePatterns, $offloadedFiles);
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

	/**
	 * Get exclusion patterns for development files and large dependencies.
	 *
	 * Delegates to FileBatchService for the actual implementation.
	 *
	 * @param string $sourceDir Source directory path to check for large folders.
	 * @param bool   $autoExclude Enable automatic exclusion of .git and large vendor folders.
	 * @return array<string> Array of exclusion patterns.
	 */
	public static function getExclusionPatterns(string $sourceDir, bool $autoExclude = true): array
	{
		$fileBatchService = new FileBatchService();
		return $fileBatchService->getExclusionPatterns($sourceDir, $autoExclude);
	}

	/**
	 * Get instance for a deployment type.
	 *
	 * Finds the first provider instance that supports the given deployment type.
	 *
	 * @param string $deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
	 * @return array{instanceId: string, config: array<string, mixed>}|null Instance data or null if not found
	 */
	private function getEnabledInstanceForDeploymentType(string $deploymentType): ?array
	{
		$settings = \get_option('aether_site_exporter_settings', []);
		$providers = $settings['providers'] ?? [];

		foreach ($providers as $instanceId => $config) {
			// Check if provider type supports this deployment type
			// Since providers have single responsibility, we check the provider_type
			$providerType = $config['provider_type'] ?? '';
			if (empty($providerType)) {
				continue;
			}

			// Map deployment types to provider type patterns
			$deploymentTypePatterns = [
				'static_site' => 'static-site',
				'blueprint_bundle' => 'blueprint-bundle',
				'edge_functions' => 'edge-functions',
			];

			$pattern = $deploymentTypePatterns[$deploymentType] ?? $deploymentType;

			// Check if provider type contains the deployment type pattern
			// e.g., 'local-filesystem-static-site' contains 'static-site'
			if (\strpos($providerType, $pattern) === false) {
				continue;
			}

			return [
				'instanceId' => $instanceId,
				'config' => $config,
			];
		}

		return null;
	}
}
