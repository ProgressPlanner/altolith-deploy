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
use Aether\SiteExporter\Core\ZipHelper;
use Aether\SiteExporter\Sync\JobStateManager;

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
	private $plugin;

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
	 * Export complete site as single zip file.
	 *
	 * Creates wp-content.zip containing:
	 * - Database (SQLite)
	 * - Uploads directory
	 * - Custom plugins
	 * - Custom themes
	 * - MU-plugins directory
	 *
	 * @param string|null            $jobId          Optional job ID for progress tracking.
	 * @param JobStateManager|null   $stateManager   Optional state manager for progress updates.
	 * @param array<string>|null     $customAssetSlugs Optional array of custom plugin/theme slugs to include in zip.
	 *                                               If provided, only these assets are added. If null, all custom assets are added.
	 * @return array<string, mixed>|\WP_Error Result array with zipPath and zipSize, or WP_Error on failure.
	 */
	public function exportCompleteSite(?string $jobId = null, ?JobStateManager $stateManager = null, ?array $customAssetSlugs = null)
	{
		// Note: WordPress Playground requires SQLite database.
		// This method assumes SQLite is being used.

		// Ensure file.php is loaded for wp_tempnam() function.
		// REST API context doesn't automatically load admin files.
		if (! \function_exists('wp_tempnam')) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		// Create temporary file with unique name in system temp directory.
		// wp_tempnam() uses sys_get_temp_dir() to avoid permission issues.
		// We create in temp first, then move atomically to final location.
		$tempZipPath = \wp_tempnam('wp-content-complete-');

		// wp_tempnam creates an empty file - remove it so we can use the path for a zip.
		// Append .zip extension for proper file type identification.
		@\unlink($tempZipPath);
		$tempZipPath .= '.zip';

		// Get export path from settings.
		$settings = \get_option('aether_site_exporter_settings', []);
		$exportPath = $settings['providers']['local-filesystem']['export_path'] ?? 'blueprint-bundle/bundle.zip';

		// Extract directory and validate it to prevent path traversal attacks.
		$exportDir = \dirname($exportPath);

		// Security: Reject paths with path traversal sequences or absolute paths.
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $exportDir) || \preg_match('#^[/\\\\]#', $exportDir)) {
			return new \WP_Error(
				'invalid_export_path',
				\__('Invalid export path: path traversal not allowed', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$fullExportDir = \rtrim(ABSPATH, '/') . '/' . \ltrim($exportDir, '/');

		if (!\is_dir($fullExportDir)) {
			\wp_mkdir_p($fullExportDir);
		}

		// Security: Validate that the created directory is within ABSPATH.
		$realExportDir = \realpath($fullExportDir);
		$realAbspath = \realpath(ABSPATH);
		if (false === $realExportDir || false === $realAbspath || 0 !== \strpos($realExportDir, $realAbspath)) {
			return new \WP_Error(
				'invalid_export_directory',
				\__('Invalid export directory: must be within WordPress installation', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Final location: Use the directory from export_path with wp-content.zip filename.
		$zipPath = $realExportDir . '/wp-content.zip';

		// Count total files first (for progress tracking).
		// This is a quick scan that doesn't process files, just counts them.
		$totalFiles = 0;
		if ($jobId) {
			$totalFiles = $this->countTotalFiles();
		}

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

		// Initialize progress tracking.
		// Supports both job-based (with JobStateManager) and simple transient-based tracking.
		$processedFiles = 0;
		$progressCallback = null;
		if ($jobId && $totalFiles > 0) {
			$progressCallback = function () use ($jobId, $stateManager, $totalFiles, &$processedFiles) {
				$processedFiles++;
				// Update progress every 50 files or every 2% to avoid too many status updates
				if ($processedFiles % 50 === 0 || \fmod(($processedFiles / $totalFiles * 100), 2) < 0.1) {
					$progress = \min(100, \round(($processedFiles / $totalFiles) * 100));

					// Use JobStateManager if provided (job tracking).
					if ($stateManager) {
						$status = $stateManager->getStatus($jobId);
						if ($status) {
							$status['createSiteArchive_progress'] = $progress;
							$stateManager->updateStatus($jobId, $status);
						}
					} else {
						// Use simple transient for stateless progress tracking.
						\set_transient($jobId, ['progress' => $progress], 1800);
					}
				}
			};
		}

		// 1. Add database file first (most critical for site restoration).
		// Database is stored in wp-content/database/ subdirectory in the zip.
		// This maintains WordPress Playground's expected structure.
		$dbPath = $this->getDatabasePath();
		if (false !== $dbPath && \file_exists($dbPath)) {
			$dbRelativePath = 'wp-content/database/' . \basename($dbPath);
			$zip->addFile($dbPath, $dbRelativePath);
			if ($progressCallback) {
				$progressCallback();
			}
		}

		// 2. Add uploads directory (user media files).
		// Skips files already offloaded to external storage (Cloudflare Images/R2).
		// This prevents duplicate uploads and reduces zip size.
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		if (\is_dir($uploadsDir)) {
			$this->addDirectoryToZip($zip, $uploadsDir, 'wp-content/uploads', '', null, null, $progressCallback);
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
				$pluginDir = WP_PLUGIN_DIR . '/' . $slug;
				if (\is_dir($pluginDir)) {
					$this->addDirectoryToZip($zip, $pluginDir, 'wp-content/plugins/' . $slug, '', null, null, $progressCallback);
				}
			}
		} else {
			// Fallback: Use PHP-based detection (includes ALL active plugins).
			$customAssets = $this->plugin->getAllCustomAssets() ?? [];
			foreach ($customAssets as $asset) {
				if ('plugin' === $asset['type']) {
					// Skip 'aether' plugin - it's added separately in blueprint from aether.zip URL.
					if ('aether' === $asset['slug']) {
						continue;
					}
					$pluginDir = WP_PLUGIN_DIR . '/' . $asset['slug'];
					if (\is_dir($pluginDir)) {
						$this->addDirectoryToZip($zip, $pluginDir, 'wp-content/plugins/' . $asset['slug'], '', null, null, $progressCallback);
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
				$themeDir = \get_theme_root() . '/' . $slug;
				if (\is_dir($themeDir)) {
					$this->addDirectoryToZip($zip, $themeDir, 'wp-content/themes/' . $slug, '', null, null, $progressCallback);
				}
			}
		} else {
			// Fallback: Use PHP-based detection (includes ALL active themes).
			foreach ($customAssets as $asset) {
				if ('theme' === $asset['type']) {
					$themeDir = \get_theme_root() . '/' . $asset['slug'];
					if (\is_dir($themeDir)) {
						$this->addDirectoryToZip($zip, $themeDir, 'wp-content/themes/' . $asset['slug'], '', null, null, $progressCallback);
					}
				}
			}
		}

		// 5. Add mu-plugins directory (must-use plugins).
		// MU-plugins are always custom and must be included in full.
		// No wordpress.org equivalent exists for mu-plugins.
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		if (\is_dir($mupluginsDir)) {
			$this->addDirectoryToZip($zip, $mupluginsDir, 'wp-content/mu-plugins', '', null, null, $progressCallback);
		}

		// Final progress update (100%).
		if ($progressCallback && $totalFiles > 0 && $jobId && $stateManager) {
			$status = $stateManager->getStatus($jobId);
			if ($status) {
				$status['createSiteArchive_progress'] = 100;
				$stateManager->updateStatus($jobId, $status);
			}
		}

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
	 * @param \ZipArchive             $zip          ZipArchive instance.
	 * @param string                  $sourceDir   Source directory path.
	 * @param string                  $zipPath     Path inside zip.
	 * @param string                  $relativePath Relative path for recursion.
	 * @param array<int, string>|null $excludePatterns Exclusion patterns.
	 * @param array<int, string>|null $offloadedFiles Offloaded file paths.
	 * @param callable|null           $progressCallback Optional callback for progress updates (receives file count).
	 * @return void
	 */
	public function addDirectoryToZip(\ZipArchive $zip, string $sourceDir, string $zipPath, string $relativePath = '', ?array $excludePatterns = null, ?array $offloadedFiles = null, ?callable $progressCallback = null): void
	{
		// Normalize directory paths (remove trailing slashes for consistent handling).
		$sourceDir = \rtrim($sourceDir, '/');
		$zipPath   = \rtrim($zipPath, '/');

		// Build full filesystem path for the current directory being processed.
		// On first call: $relativePath is empty, so fullPath = sourceDir.
		// On recursive calls: $relativePath contains subdirectory structure.
		$fullPath = $sourceDir . ( $relativePath ? '/' . $relativePath : '' );

		// Security: use realpath() to resolve symlinks and prevent path traversal.
		$realFullPath = \realpath($fullPath);
		$realSourceDir = \realpath($sourceDir);

		// Guard against non-existent or invalid directories, and path traversal attacks.
		// Allow processing the root directory itself, but check subdirectories are within sourceDir.
		if (false === $realFullPath || false === $realSourceDir || ($realFullPath !== $realSourceDir && 0 !== \strpos($realFullPath, $realSourceDir . DIRECTORY_SEPARATOR))) {
			return;
		}

		// Use resolved path for directory operations.
		$fullPath = $realFullPath;

		// Detect if we're processing the uploads directory.
		// This determines whether to skip offloaded files (Cloudflare Images/R2).
		$isUploadsDir = false !== \strpos($zipPath, 'wp-content/uploads');

		// Detect if we're processing plugin/theme/mu-plugin directories.
		// These directories need development files excluded (node_modules, .git, etc).
		$shouldExcludeDevFiles = (
			false !== \strpos($zipPath, 'wp-content/plugins') ||
			false !== \strpos($zipPath, 'wp-content/themes') ||
			false !== \strpos($zipPath, 'wp-content/mu-plugins')
		);

		// Lazy-load offloaded files list (only on first call, not on recursive calls).
		// Query database once and pass result through recursion for performance.
		// Check: null (not set) + isUploadsDir + empty relativePath (first call).
		if (null === $offloadedFiles && $isUploadsDir && '' === $relativePath) {
			$offloadedFiles = $this->getOffloadedFilePaths();
		}
		if (null === $offloadedFiles) {
			$offloadedFiles = [];
		}

		// Lazy-load exclusion patterns (only on first call, not on recursive calls).
		// Patterns are generated once from composer.json, package.json, etc.
		// Pass through recursion to avoid regenerating on every subdirectory.
		if (null === $excludePatterns && $shouldExcludeDevFiles && '' === $relativePath) {
			$excludePatterns = ZipHelper::getExclusionPatterns($sourceDir, true);
		}
		if (null === $excludePatterns) {
			$excludePatterns = [];
		}

		// Read directory contents (files + subdirectories).
		$files = \scandir($fullPath);

		// Process each file/directory in the current directory.
		foreach ($files as $file) {
			// Skip Unix directory navigation entries.
			if ('.' === $file || '..' === $file) {
				continue;
			}

			// Build absolute filesystem path for this file/directory.
			$filePath     = $fullPath . '/' . $file;

			// Security: validate file path to prevent path traversal.
			$realFilePath = \realpath($filePath);
			if (false === $realFilePath || 0 !== \strpos($realFilePath, $realSourceDir . DIRECTORY_SEPARATOR)) {
				continue;
			}

			// Use resolved path for file operations.
			$filePath = $realFilePath;

			// Build path as it will appear inside the zip archive.
			$zipFilePath = $zipPath . ( $relativePath ? '/' . $relativePath : '' ) . '/' . $file;

			// Check if this file/directory matches any exclusion patterns.
			// Patterns include: node_modules, .git, vendor, tests, etc.
			// Simple substring matching for performance (vs regex).
			$excluded = false;
			if (! empty($excludePatterns)) {
				foreach ($excludePatterns as $pattern) {
					if (false !== \strpos($filePath, $pattern)) {
						$excluded = true;
						break;
					}
				}
			}

			if ($excluded) {
				continue;
			}

			// Handle directories recursively.
			if (\is_dir($filePath)) {
				// Create the directory structure in the zip (even if empty).
				$zip->addEmptyDir($zipFilePath);

				// Recurse into subdirectory.
				// Pass exclusion patterns and offloaded files through to avoid re-querying.
				// Build new relativePath by appending current directory name.
				$this->addDirectoryToZip(
					$zip,
					$sourceDir,
					$zipPath,
					$relativePath ? $relativePath . '/' . $file : $file,
					$excludePatterns,
					$offloadedFiles,
					$progressCallback
				);
			} else {
				// Handle regular files.

				// Skip files that have been offloaded to external storage.
				// Offloaded files are already on Cloudflare Images/R2, no need to include in zip.
				if ($isUploadsDir && ! empty($offloadedFiles)) {
					// Normalize file path before comparison to handle symlinks and path variations.
					$normalizedFilePath = \realpath($filePath);
					$pathToCheck = false !== $normalizedFilePath ? $normalizedFilePath : $filePath;
					if (\in_array($pathToCheck, $offloadedFiles, true)) {
						continue;
					}
				}

				// Add file to zip archive.
				$zip->addFile($filePath, $zipFilePath);

				// Update progress if callback provided.
				if ($progressCallback) {
					$progressCallback();
				}
			}
		}
	}

	/**
	 * Count total files that will be added to the zip archive.
	 *
	 * This is a quick scan that doesn't process files, just counts them.
	 * Used for progress tracking.
	 *
	 * @return int Total number of files.
	 */
	private function countTotalFiles(): int
	{
		$count = 0;

		// Count database file.
		$dbPath = $this->getDatabasePath();
		if (false !== $dbPath && \file_exists($dbPath)) {
			$count++;
		}

		// Count files in uploads directory.
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		if (\is_dir($uploadsDir)) {
			$count += $this->countFilesInDirectory($uploadsDir);
		}

		// Count files in custom plugins.
		$customAssets = $this->plugin->getAllCustomAssets() ?? [];
		foreach ($customAssets as $asset) {
			if ('plugin' === $asset['type']) {
				$pluginDir = WP_PLUGIN_DIR . '/' . $asset['slug'];
				if (\is_dir($pluginDir)) {
					$count += $this->countFilesInDirectory($pluginDir);
				}
			}
		}

		// Count files in custom themes.
		foreach ($customAssets as $asset) {
			if ('theme' === $asset['type']) {
				$themeDir = \get_theme_root() . '/' . $asset['slug'];
				if (\is_dir($themeDir)) {
					$count += $this->countFilesInDirectory($themeDir);
				}
			}
		}

		// Count files in mu-plugins directory.
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		if (\is_dir($mupluginsDir)) {
			$count += $this->countFilesInDirectory($mupluginsDir);
		}

		return $count;
	}

	/**
	 * Count files in a directory recursively.
	 *
	 * @param string $dir Directory path.
	 * @return int Number of files.
	 */
	private function countFilesInDirectory(string $dir): int
	{
		$count = 0;
		$realDir = \realpath($dir);

		if (false === $realDir || ! \is_dir($realDir)) {
			return 0;
		}

		$files = \scandir($realDir);
		if (false === $files) {
			return 0;
		}

		foreach ($files as $file) {
			if ('.' === $file || '..' === $file) {
				continue;
			}

			$filePath = $realDir . '/' . $file;
			$realFilePath = \realpath($filePath);

			if (false === $realFilePath || 0 !== \strpos($realFilePath, $realDir . DIRECTORY_SEPARATOR)) {
				continue;
			}

			if (\is_dir($realFilePath)) {
				// Recurse into subdirectory.
				$count += $this->countFilesInDirectory($realFilePath);
			} else {
				// Count regular file.
				$count++;
			}
		}

		return $count;
	}

	/**
	 * Get file paths of all attachments offloaded to external storage.
	 *
	 * @return array<string> Array of absolute file paths.
	 */
	private function getOffloadedFilePaths(): array
	{
		global $wpdb;

		// Query for all attachments with external storage metadata.
		$attachmentIds = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT post_id FROM {$wpdb->postmeta}
				WHERE meta_key = %s
				AND post_id IN (
					SELECT ID FROM {$wpdb->posts}
					WHERE post_type = 'attachment'
				)",
				'_aether_media_metadata'
			)
		);

		if (empty($attachmentIds)) {
			return [];
		}

		$filePaths = [];
		foreach ($attachmentIds as $attachmentId) {
			$filePath = \get_attached_file($attachmentId);
			if ($filePath && \file_exists($filePath)) {
				// Normalize path using realpath() to handle symlinks and ensure exact match.
				$normalizedPath = \realpath($filePath);
				if (false !== $normalizedPath) {
					$filePaths[] = $normalizedPath;
				} else {
					// Fallback to original path if realpath() fails (shouldn't happen if file exists).
					$filePaths[] = $filePath;
				}

				// Also get image sizes.
				$metadata = \wp_get_attachment_metadata($attachmentId);
				if (\is_array($metadata) && ! empty($metadata['sizes'])) {
					$baseDir = \dirname($filePath);

					foreach ($metadata['sizes'] as $sizeData) {
						if (isset($sizeData['file'])) {
							$sizeFile = $baseDir . '/' . $sizeData['file'];
							if (\file_exists($sizeFile)) {
								// Normalize path for size variants too.
								$normalizedSizePath = \realpath($sizeFile);
								if (false !== $normalizedSizePath) {
									$filePaths[] = $normalizedSizePath;
								} else {
									$filePaths[] = $sizeFile;
								}
							}
						}
					}
				}
			}
		}

		return $filePaths;
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
