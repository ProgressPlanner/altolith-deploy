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
use Aether\SiteExporter\Sync\JobStateManager;
use Aether\SiteExporter\Utilities\TempDirectoryManager;
use Aether\SiteExporter\Providers\ProviderRegistry;

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
		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType('blueprint_bundle');
		$exportPath = 'blueprint-bundle/bundle.zip';

		if ($instance && isset($instance['config']['export_path'])) {
			$exportPath = $instance['config']['export_path'];
		}

		// Security: Validate export_path is a string and doesn't contain null bytes
		if (!\is_string($exportPath) || \strpos($exportPath, "\0") !== false) {
			$exportPath = 'blueprint-bundle/bundle.zip';
		}

		// Extract directory and validate it to prevent path traversal attacks.
		$exportDir = \dirname($exportPath);

		// Security: Reject paths with path traversal sequences, absolute paths, or null bytes.
		// CRITICAL: Validate BEFORE any filesystem operations.
		if (
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $exportDir) ||
			\preg_match('#^[/\\\\]#', $exportDir) ||
			\strpos($exportDir, "\0") !== false
		) {
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

		// Parent must exist for realpath() to work
		if (!\is_dir($parentDir)) {
			// Recursively check parent's parent to ensure we stay within ABSPATH
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
		} else {
			// Parent exists, validate it's within ABSPATH
			$realParent = \realpath($parentDir);
			$realAbspath = \realpath(ABSPATH);
			if (
				false === $realParent || false === $realAbspath ||
				0 !== \strpos($realParent, $realAbspath)
			) {
				return new \WP_Error(
					'invalid_export_directory',
					\__('Invalid export directory: must be within WordPress installation', 'aether-site-exporter'),
					[ 'status' => 400 ]
				);
			}
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
				// Prevent integer overflow: use PHP_INT_MAX for portability across systems
				if ($processedFiles < PHP_INT_MAX) {
					$processedFiles++;
				} else {
					// Log warning if maximum integer value is exceeded
					if (\defined('WP_DEBUG') && WP_DEBUG) {
						\error_log('Aether: File count exceeded maximum integer value');
					}
				}

				// Update progress more granularly for better UX, especially for small file counts
				// Update every N files OR every 1% (whichever is more frequent)
				// Use float division to prevent overflow
				// $updateInterval is always >= 1 due to max(1, ...)
				$updateInterval = \max(1, (int) \floor((float) $totalFiles / 100.0));

				// Prevent modulo by zero and handle overflow in modulo operation
				if ($processedFiles % $updateInterval === 0) {
					// Use float math to prevent integer overflow on large file counts
					// Cast to float before division to ensure accurate calculation
					$progressFloat = \min(100.0, ((float) $processedFiles / (float) $totalFiles) * 100.0);
					$progress = (int) \round($progressFloat);

					// Overflow protection: clamp to valid range
					if ($progress < 0 || $progress > 100) {
						$progress = \min(100, \max(0, $progress));
					}

					// Use JobStateManager if provided (job tracking).
					if ($stateManager) {
						$status = $stateManager->getStatus($jobId);
						if ($status) {
							$status['createBlueprintBundle_progress'] = $progress;
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
		// Skips files already offloaded to external storage (external storage).
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

				// Security: Type check first
				if (!\is_string($slug)) {
					continue;
				}

				// Security: Sanitize BEFORE validation to prevent bypasses
				$slug = \sanitize_file_name($slug);

				// Security: Validate slug doesn't contain path traversal, null bytes, or dangerous values
				if (
					empty($slug) ||
					\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $slug) ||
					\strpos($slug, "\0") !== false ||
					$slug === '.' ||
					$slug === '..'
				) {
					continue;
				}

				$pluginDir = WP_PLUGIN_DIR . '/' . $slug;
				if (\is_dir($pluginDir)) {
					$this->addDirectoryToZip($zip, $pluginDir, 'wp-content/plugins/' . $slug, '', null, null, $progressCallback);
				}
			}
		} else {
			// Fallback: Use PHP-based detection (includes ALL active plugins).
			$customAssets = $this->plugin->getAllCustomAssets();
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
				// Security: Type check first
				if (!\is_string($slug)) {
					continue;
				}

				// Security: Sanitize BEFORE validation to prevent bypasses
				$slug = \sanitize_file_name($slug);

				// Security: Validate slug doesn't contain path traversal, null bytes, or dangerous values
				if (
					empty($slug) ||
					\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $slug) ||
					\strpos($slug, "\0") !== false ||
					$slug === '.' ||
					$slug === '..'
				) {
					continue;
				}

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
				$status['createBlueprintBundle_progress'] = 100;
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
		// This determines whether to skip offloaded files (external storage).
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
			$excludePatterns = self::getExclusionPatterns($sourceDir, true);
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
				// Offloaded files are already on external storage, no need to include in zip.
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
		$customAssets = $this->plugin->getAllCustomAssets();
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
		// Use JOIN instead of subquery for better performance.
		$attachmentIds = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id
				FROM `{$wpdb->postmeta}` pm
				INNER JOIN `{$wpdb->posts}` p ON pm.post_id = p.ID
				WHERE pm.meta_key = %s
				AND p.post_type = 'attachment'",
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

		/**
	 * Get exclusion patterns for development files and large dependencies.
	 *
	 * This method generates patterns for files/folders that should typically
	 * be excluded from production zips: .git, node_modules, vendor, etc.
	 *
	 * @param string $sourceDir Source directory path to check for large folders.
	 * @param bool   $autoExclude Enable automatic exclusion of .git and large vendor folders.
	 * @return string[] Array of exclusion patterns.
	 */
	public static function getExclusionPatterns($sourceDir, $autoExclude = true)
	{
		$excludePatterns = [];

		if (! $autoExclude) {
			return $excludePatterns;
		}

		// Exclude .git directories.
		$excludePatterns[] = '/.git/';
		$excludePatterns[] = '/.git';

		// Always exclude development-only folders.
		$excludePatterns[] = '/.github/';
		$excludePatterns[] = '/.github';
		$excludePatterns[] = '/tests/';
		$excludePatterns[] = '/tests';
		$excludePatterns[] = '/Test/';
		$excludePatterns[] = '/Test';
		$excludePatterns[] = '/.vscode/';
		$excludePatterns[] = '/.vscode';
		$excludePatterns[] = '/.idea/';
		$excludePatterns[] = '/.idea';

		// Exclude development config files.
		$excludePatterns[] = '/phpcs.xml';
		$excludePatterns[] = '/phpunit.xml';
		$excludePatterns[] = '/.phpcs.xml';
		$excludePatterns[] = '/.phpunit.xml';
		$excludePatterns[] = '/composer.json';
		$excludePatterns[] = '/composer.lock';
		$excludePatterns[] = '/package.json';
		$excludePatterns[] = '/package-lock.json';
		$excludePatterns[] = '/yarn.lock';
		$excludePatterns[] = '/.eslintrc';
		$excludePatterns[] = '/.eslintrc.js';
		$excludePatterns[] = '/.eslintrc.json';
		$excludePatterns[] = '/.editorconfig';
		$excludePatterns[] = '/.gitignore';
		$excludePatterns[] = '/.gitattributes';

		// Always exclude vendor and node_modules directories.
		// These are development dependencies and should never be in production zips.
		// Pattern will match at any directory level (e.g., /path/to/vendor/, /path/to/node_modules/).
		$excludePatterns[] = '/vendor/';
		$excludePatterns[] = '/vendor';
		$excludePatterns[] = '/node_modules/';
		$excludePatterns[] = '/node_modules';

		return $excludePatterns;
	}

	/**
	 * Initialize archive creation.
	 *
	 * Creates empty zip file, counts total files, and returns phase configuration.
	 *
	 * @param array<string>|null $customAssetSlugs Optional array of custom plugin/theme slugs.
	 * @return array<string, mixed>|\WP_Error Result with zipPath, progressId, totalFiles, and phase list.
	 */
	public function initArchive(?array $customAssetSlugs = null)
	{
		// Create temp zip file path.
		$tempZipPath = TempDirectoryManager::getTempFilePath('wp-content-complete-', '.zip');

		if (false === $tempZipPath) {
			return new \WP_Error(
				'temp_directory_unavailable',
				\__('Could not create temporary directory for export. Please check file permissions.', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		// Initialize zip archive.
		$zip = new \ZipArchive();
		if (true !== $zip->open($tempZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE)) {
			return new \WP_Error(
				'zip_create_failed',
				\__('Failed to create site export zip', 'aether-site-exporter'),
				['status' => 500]
			);
		}
		$zip->close();

		// Count total files for progress tracking.
		$totalFiles = $this->countTotalFilesForPhases($customAssetSlugs);

		// Generate progress ID.
		$progressId = 'aether_site_exporter_archive_' . \time() . '_' . \wp_generate_password(8, false);

		// Get phase lists.
		$plugins = $this->getPluginsList($customAssetSlugs);
		$themes = $this->getThemesList($customAssetSlugs);
		$uploadsBatches = $this->getUploadsBatches();
		$muPluginsBatches = $this->getMuPluginsBatches();

		return [
			'success' => true,
			'data' => [
				'zipPath' => $tempZipPath,
				'progressId' => $progressId,
				'totalFiles' => $totalFiles,
			],
			'progress' => [
				'overall' => 0,
				'phase' => 'init',
				'filesProcessed' => 0,
				'totalFiles' => $totalFiles,
				'phases' => [
					'database' => ['status' => 'pending', 'filesProcessed' => 0],
					'uploads' => ['status' => 'pending', 'batches' => \count($uploadsBatches), 'completedBatches' => 0, 'filesProcessed' => 0],
					'plugins' => ['status' => 'pending', 'items' => $plugins, 'completedItems' => [], 'filesProcessed' => 0],
					'themes' => ['status' => 'pending', 'items' => $themes, 'completedItems' => [], 'filesProcessed' => 0],
					'mu-plugins' => ['status' => 'pending', 'batches' => \count($muPluginsBatches), 'completedBatches' => 0, 'filesProcessed' => 0],
				],
			],
		];
	}

	/**
	 * Add database file to zip.
	 *
	 * @param string $zipPath Path to zip file.
	 * @param array<string, mixed> $currentProgress Current progress state.
	 * @return array<string, mixed>|\WP_Error Result with progress info.
	 */
	public function addDatabaseToZip(string $zipPath, array $currentProgress = [])
	{
		$zip = new \ZipArchive();
		if (true !== $zip->open($zipPath, \ZipArchive::CREATE)) {
			return new \WP_Error(
				'zip_open_failed',
				\__('Failed to open zip file', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		$filesProcessed = $currentProgress['filesProcessed'] ?? 0;
		$totalFiles = $currentProgress['totalFiles'] ?? 1;

		// Add database file.
		$filesAdded = 0;
		$dbPath = $this->getDatabasePath();
		if (false !== $dbPath && \file_exists($dbPath)) {
			$dbRelativePath = 'wp-content/database/' . \basename($dbPath);
			$zip->addFile($dbPath, $dbRelativePath);
			$filesAdded = 1;
			$filesProcessed++;
		}

		$zip->close();

		$phases = $currentProgress['phases'] ?? [];
		$phases['database'] = ['status' => 'completed', 'filesProcessed' => $filesAdded];
		$overallProgress = $this->calculateOverallProgress($filesProcessed, $totalFiles, $phases);

		return [
			'success' => true,
			'data' => [
				'zipPath' => $zipPath,
				'filesAdded' => $filesAdded,
			],
			'progress' => [
				'overall' => $overallProgress,
				'phase' => 'database',
				'subPhase' => 'database',
				'phaseProgress' => 100,
				'filesProcessed' => $filesProcessed,
				'totalFiles' => $totalFiles,
				'phases' => $phases,
			],
		];
	}

	/**
	 * Get list of upload file batches.
	 *
	 * @return array<int, array<string, mixed>> List of batches with file paths.
	 */
	public function getUploadsBatches(): array
	{
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		if (!\is_dir($uploadsDir)) {
			return [];
		}

		$files = $this->getFilesInDirectory($uploadsDir);
		$offloadedFiles = $this->getOffloadedFilePaths();
		$offloadedFilesSet = \array_flip($offloadedFiles);

		// Filter out offloaded files.
		$files = \array_filter($files, function ($filePath) use ($offloadedFilesSet) {
			$realPath = \realpath($filePath);
			return false !== $realPath && !isset($offloadedFilesSet[$realPath]);
		});

		return $this->createBatches($files, 100, 50 * 1024 * 1024); // 100 files or 50MB
	}

	/**
	 * Add batch of upload files to zip.
	 *
	 * @param string $zipPath Path to zip file.
	 * @param int $batchIndex Batch index.
	 * @param array<string, mixed> $currentProgress Current progress state.
	 * @return array<string, mixed>|\WP_Error Result with progress info.
	 */
	public function addUploadsBatchToZip(string $zipPath, int $batchIndex, array $currentProgress = [])
	{
		$batches = $this->getUploadsBatches();
		if (!isset($batches[$batchIndex])) {
			return new \WP_Error(
				'invalid_batch_index',
				\__('Invalid batch index', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		$zip = new \ZipArchive();
		if (true !== $zip->open($zipPath, \ZipArchive::CREATE)) {
			return new \WP_Error(
				'zip_open_failed',
				\__('Failed to open zip file', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		$batch = $batches[$batchIndex];
		$filesProcessed = $currentProgress['filesProcessed'] ?? 0;
		$totalFiles = $currentProgress['totalFiles'] ?? 1;
		$phases = $currentProgress['phases'] ?? [];
		$uploadsPhase = $phases['uploads'] ?? ['status' => 'pending', 'batches' => \count($batches), 'completedBatches' => 0, 'filesProcessed' => 0];

		$filesAdded = 0;
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		$realUploadsDir = \realpath($uploadsDir);

		foreach ($batch['files'] as $filePath) {
			$realFilePath = \realpath($filePath);
			if (false === $realFilePath || false === $realUploadsDir || 0 !== \strpos($realFilePath, $realUploadsDir . DIRECTORY_SEPARATOR)) {
				continue;
			}

			$relativePath = \substr($realFilePath, \strlen($realUploadsDir) + 1);
			$zipFilePath = 'wp-content/uploads/' . $relativePath;

			// Check exclusion patterns.
			$excludePatterns = self::getExclusionPatterns($uploadsDir, false);
			$excluded = false;
			foreach ($excludePatterns as $pattern) {
				if (false !== \strpos($filePath, $pattern)) {
					$excluded = true;
					break;
				}
			}

			if (!$excluded) {
				$zip->addFile($filePath, $zipFilePath);
				$filesAdded++;
				$filesProcessed++;
			}
		}

		$zip->close();

		$currentBatchCount = \count($batches);
		$completedBatches = ($uploadsPhase['completedBatches'] ?? 0) + 1;
		$uploadsPhase['completedBatches'] = $completedBatches;
		$uploadsPhase['filesProcessed'] = ($uploadsPhase['filesProcessed'] ?? 0) + $filesAdded;
		// Update batch count if it has changed (shouldn't happen, but be safe)
		$uploadsPhase['batches'] = $currentBatchCount;
		$uploadsPhase['status'] = $completedBatches >= $currentBatchCount ? 'completed' : 'in-progress';
		$phases['uploads'] = $uploadsPhase;

		$phaseProgress = $currentBatchCount > 0 ? (int) \round(($completedBatches / $currentBatchCount) * 100) : 100;
		$overallProgress = $this->calculateOverallProgress($filesProcessed, $totalFiles, $phases);

		return [
			'success' => true,
			'data' => [
				'zipPath' => $zipPath,
				'filesAdded' => $filesAdded,
				'batchIndex' => $batchIndex,
			],
			'progress' => [
				'overall' => $overallProgress,
				'phase' => 'uploads',
				'subPhase' => "uploads:batch-{$batchIndex}",
				'phaseProgress' => $phaseProgress,
				'filesProcessed' => $filesProcessed,
				'totalFiles' => $totalFiles,
				'phases' => $phases,
			],
		];
	}

	/**
	 * Get list of plugins to add.
	 *
	 * @param array<string>|null $customAssetSlugs Optional array of custom plugin/theme slugs.
	 * @return array<string> List of plugin slugs.
	 */
	public function getPluginsList(?array $customAssetSlugs = null): array
	{
		$plugins = [];

		if (null !== $customAssetSlugs) {
			foreach ($customAssetSlugs as $slug) {
				if ('aether' === $slug || !\is_string($slug)) {
					continue;
				}

				$slug = \sanitize_file_name($slug);
				if (
					empty($slug) ||
					\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $slug) ||
					\strpos($slug, "\0") !== false ||
					$slug === '.' ||
					$slug === '..'
				) {
					continue;
				}

				$pluginDir = WP_PLUGIN_DIR . '/' . $slug;
				if (\is_dir($pluginDir)) {
					$plugins[] = $slug;
				}
			}
		} else {
			$customAssets = $this->plugin->getAllCustomAssets();
			foreach ($customAssets as $asset) {
				if ('plugin' === $asset['type'] && 'aether' !== $asset['slug']) {
					$plugins[] = $asset['slug'];
				}
			}
		}

		return $plugins;
	}

	/**
	 * Add single plugin to zip.
	 *
	 * @param string $zipPath Path to zip file.
	 * @param string $pluginSlug Plugin slug.
	 * @param array<string, mixed> $currentProgress Current progress state.
	 * @return array<string, mixed>|\WP_Error Result with progress info.
	 */
	public function addPluginToZip(string $zipPath, string $pluginSlug, array $currentProgress = [])
	{
		// Security: Sanitize and validate slug.
		$pluginSlug = \sanitize_file_name($pluginSlug);
		if (
			empty($pluginSlug) ||
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $pluginSlug) ||
			\strpos($pluginSlug, "\0") !== false ||
			$pluginSlug === '.' ||
			$pluginSlug === '..'
		) {
			return new \WP_Error(
				'invalid_plugin_slug',
				\__('Invalid plugin slug', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		$pluginDir = WP_PLUGIN_DIR . '/' . $pluginSlug;
		if (!\is_dir($pluginDir)) {
			return new \WP_Error(
				'plugin_not_found',
				\__('Plugin directory not found', 'aether-site-exporter'),
				['status' => 404]
			);
		}

		$zip = new \ZipArchive();
		if (true !== $zip->open($zipPath, \ZipArchive::CREATE)) {
			return new \WP_Error(
				'zip_open_failed',
				\__('Failed to open zip file', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		$filesProcessed = $currentProgress['filesProcessed'] ?? 0;
		$totalFiles = $currentProgress['totalFiles'] ?? 1;
		$phases = $currentProgress['phases'] ?? [];
		$pluginsPhase = $phases['plugins'] ?? ['status' => 'pending', 'items' => [], 'completedItems' => [], 'filesProcessed' => 0];

		$filesAdded = 0;
		$excludePatterns = self::getExclusionPatterns($pluginDir, true);
		$this->addDirectoryToZip($zip, $pluginDir, 'wp-content/plugins/' . $pluginSlug, '', $excludePatterns, null, function () use (&$filesAdded, &$filesProcessed) {
			$filesAdded++;
			$filesProcessed++;
		});

		$zip->close();

		$completedItems = $pluginsPhase['completedItems'] ?? [];
		$completedItems[] = $pluginSlug;
		$pluginsPhase['completedItems'] = $completedItems;
		$pluginsPhase['filesProcessed'] = ($pluginsPhase['filesProcessed'] ?? 0) + $filesAdded;
		$pluginsPhase['status'] = \count($completedItems) >= \count($pluginsPhase['items'] ?? []) ? 'completed' : 'in-progress';
		$phases['plugins'] = $pluginsPhase;

		$phaseProgress = \count($pluginsPhase['items'] ?? []) > 0 ? (int) \round((\count($completedItems) / \count($pluginsPhase['items'])) * 100) : 100;
		$overallProgress = $this->calculateOverallProgress($filesProcessed, $totalFiles, $phases);

		return [
			'success' => true,
			'data' => [
				'zipPath' => $zipPath,
				'filesAdded' => $filesAdded,
				'pluginSlug' => $pluginSlug,
			],
			'progress' => [
				'overall' => $overallProgress,
				'phase' => 'plugins',
				'subPhase' => "plugin:{$pluginSlug}",
				'phaseProgress' => $phaseProgress,
				'filesProcessed' => $filesProcessed,
				'totalFiles' => $totalFiles,
				'phases' => $phases,
			],
		];
	}

	/**
	 * Get list of themes to add.
	 *
	 * @param array<string>|null $customAssetSlugs Optional array of custom plugin/theme slugs.
	 * @return array<string> List of theme slugs.
	 */
	public function getThemesList(?array $customAssetSlugs = null): array
	{
		$themes = [];

		if (null !== $customAssetSlugs) {
			foreach ($customAssetSlugs as $slug) {
				if (!\is_string($slug)) {
					continue;
				}

				$slug = \sanitize_file_name($slug);
				if (
					empty($slug) ||
					\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $slug) ||
					\strpos($slug, "\0") !== false ||
					$slug === '.' ||
					$slug === '..'
				) {
					continue;
				}

				$themeDir = \get_theme_root() . '/' . $slug;
				if (\is_dir($themeDir)) {
					$themes[] = $slug;
				}
			}
		} else {
			$customAssets = $this->plugin->getAllCustomAssets();
			foreach ($customAssets as $asset) {
				if ('theme' === $asset['type']) {
					$themes[] = $asset['slug'];
				}
			}
		}

		return $themes;
	}

	/**
	 * Add single theme to zip.
	 *
	 * @param string $zipPath Path to zip file.
	 * @param string $themeSlug Theme slug.
	 * @param array<string, mixed> $currentProgress Current progress state.
	 * @return array<string, mixed>|\WP_Error Result with progress info.
	 */
	public function addThemeToZip(string $zipPath, string $themeSlug, array $currentProgress = [])
	{
		// Security: Sanitize and validate slug.
		$themeSlug = \sanitize_file_name($themeSlug);
		if (
			empty($themeSlug) ||
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $themeSlug) ||
			\strpos($themeSlug, "\0") !== false ||
			$themeSlug === '.' ||
			$themeSlug === '..'
		) {
			return new \WP_Error(
				'invalid_theme_slug',
				\__('Invalid theme slug', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		$themeDir = \get_theme_root() . '/' . $themeSlug;
		if (!\is_dir($themeDir)) {
			return new \WP_Error(
				'theme_not_found',
				\__('Theme directory not found', 'aether-site-exporter'),
				['status' => 404]
			);
		}

		$zip = new \ZipArchive();
		if (true !== $zip->open($zipPath, \ZipArchive::CREATE)) {
			return new \WP_Error(
				'zip_open_failed',
				\__('Failed to open zip file', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		$filesProcessed = $currentProgress['filesProcessed'] ?? 0;
		$totalFiles = $currentProgress['totalFiles'] ?? 1;
		$phases = $currentProgress['phases'] ?? [];
		$themesPhase = $phases['themes'] ?? ['status' => 'pending', 'items' => [], 'completedItems' => [], 'filesProcessed' => 0];

		$filesAdded = 0;
		$excludePatterns = self::getExclusionPatterns($themeDir, true);
		$this->addDirectoryToZip($zip, $themeDir, 'wp-content/themes/' . $themeSlug, '', $excludePatterns, null, function () use (&$filesAdded, &$filesProcessed) {
			$filesAdded++;
			$filesProcessed++;
		});

		$zip->close();

		$completedItems = $themesPhase['completedItems'] ?? [];
		$completedItems[] = $themeSlug;
		$themesPhase['completedItems'] = $completedItems;
		$themesPhase['filesProcessed'] = ($themesPhase['filesProcessed'] ?? 0) + $filesAdded;
		$themesPhase['status'] = \count($completedItems) >= \count($themesPhase['items'] ?? []) ? 'completed' : 'in-progress';
		$phases['themes'] = $themesPhase;

		$phaseProgress = \count($themesPhase['items'] ?? []) > 0 ? (int) \round((\count($completedItems) / \count($themesPhase['items'])) * 100) : 100;
		$overallProgress = $this->calculateOverallProgress($filesProcessed, $totalFiles, $phases);

		return [
			'success' => true,
			'data' => [
				'zipPath' => $zipPath,
				'filesAdded' => $filesAdded,
				'themeSlug' => $themeSlug,
			],
			'progress' => [
				'overall' => $overallProgress,
				'phase' => 'themes',
				'subPhase' => "theme:{$themeSlug}",
				'phaseProgress' => $phaseProgress,
				'filesProcessed' => $filesProcessed,
				'totalFiles' => $totalFiles,
				'phases' => $phases,
			],
		];
	}

	/**
	 * Get list of mu-plugin file batches.
	 *
	 * @return array<int, array<string, mixed>> List of batches with file paths.
	 */
	public function getMuPluginsBatches(): array
	{
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		if (!\is_dir($mupluginsDir)) {
			return [];
		}

		$files = $this->getFilesInDirectory($mupluginsDir);
		return $this->createBatches($files, 50, 25 * 1024 * 1024); // 50 files or 25MB
	}

	/**
	 * Add batch of mu-plugin files to zip.
	 *
	 * @param string $zipPath Path to zip file.
	 * @param int $batchIndex Batch index.
	 * @param array<string, mixed> $currentProgress Current progress state.
	 * @return array<string, mixed>|\WP_Error Result with progress info.
	 */
	public function addMuPluginsBatchToZip(string $zipPath, int $batchIndex, array $currentProgress = [])
	{
		$batches = $this->getMuPluginsBatches();
		if (!isset($batches[$batchIndex])) {
			return new \WP_Error(
				'invalid_batch_index',
				\__('Invalid batch index', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		$zip = new \ZipArchive();
		if (true !== $zip->open($zipPath, \ZipArchive::CREATE)) {
			return new \WP_Error(
				'zip_open_failed',
				\__('Failed to open zip file', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		$batch = $batches[$batchIndex];
		$filesProcessed = $currentProgress['filesProcessed'] ?? 0;
		$totalFiles = $currentProgress['totalFiles'] ?? 1;
		$phases = $currentProgress['phases'] ?? [];
		$muPluginsPhase = $phases['mu-plugins'] ?? ['status' => 'pending', 'batches' => \count($batches), 'completedBatches' => 0, 'filesProcessed' => 0];

		$filesAdded = 0;
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		$realMupluginsDir = \realpath($mupluginsDir);

		foreach ($batch['files'] as $filePath) {
			$realFilePath = \realpath($filePath);
			if (false === $realFilePath || false === $realMupluginsDir || 0 !== \strpos($realFilePath, $realMupluginsDir . DIRECTORY_SEPARATOR)) {
				continue;
			}

			$relativePath = \substr($realFilePath, \strlen($realMupluginsDir) + 1);
			$zipFilePath = 'wp-content/mu-plugins/' . $relativePath;

			// Check exclusion patterns.
			$excludePatterns = self::getExclusionPatterns($mupluginsDir, true);
			$excluded = false;
			foreach ($excludePatterns as $pattern) {
				if (false !== \strpos($filePath, $pattern)) {
					$excluded = true;
					break;
				}
			}

			if (!$excluded) {
				$zip->addFile($filePath, $zipFilePath);
				$filesAdded++;
				$filesProcessed++;
			}
		}

		$zip->close();

		$currentBatchCount = \count($batches);
		$completedBatches = ($muPluginsPhase['completedBatches'] ?? 0) + 1;
		$muPluginsPhase['completedBatches'] = $completedBatches;
		$muPluginsPhase['filesProcessed'] = ($muPluginsPhase['filesProcessed'] ?? 0) + $filesAdded;
		// Update batch count if it has changed (shouldn't happen, but be safe)
		$muPluginsPhase['batches'] = $currentBatchCount;
		$muPluginsPhase['status'] = $completedBatches >= $currentBatchCount ? 'completed' : 'in-progress';
		$phases['mu-plugins'] = $muPluginsPhase;

		$phaseProgress = $currentBatchCount > 0 ? (int) \round(($completedBatches / $currentBatchCount) * 100) : 100;
		$overallProgress = $this->calculateOverallProgress($filesProcessed, $totalFiles, $phases);

		return [
			'success' => true,
			'data' => [
				'zipPath' => $zipPath,
				'filesAdded' => $filesAdded,
				'batchIndex' => $batchIndex,
			],
			'progress' => [
				'overall' => $overallProgress,
				'phase' => 'mu-plugins',
				'subPhase' => "mu-plugins:batch-{$batchIndex}",
				'phaseProgress' => $phaseProgress,
				'filesProcessed' => $filesProcessed,
				'totalFiles' => $totalFiles,
				'phases' => $phases,
			],
		];
	}

	/**
	 * Finalize archive (close zip and move to final location).
	 *
	 * @param string $zipPath Path to temp zip file.
	 * @return array<string, mixed>|\WP_Error Final result with zipPath and zipSize.
	 */
	public function finalizeArchive(string $zipPath)
	{
		// Get export path from enabled instance config.
		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType('blueprint_bundle');
		$exportPath = 'blueprint-bundle/bundle.zip';

		if ($instance && isset($instance['config']['export_path'])) {
			$exportPath = $instance['config']['export_path'];
		}

		// Security: Validate export_path.
		if (!\is_string($exportPath) || \strpos($exportPath, "\0") !== false) {
			$exportPath = 'blueprint-bundle/bundle.zip';
		}

		$exportDir = \dirname($exportPath);
		if (
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $exportDir) ||
			\preg_match('#^[/\\\\]#', $exportDir) ||
			\strpos($exportDir, "\0") !== false
		) {
			return new \WP_Error(
				'invalid_export_path',
				\__('Invalid export path: path traversal not allowed', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		$fullExportDir = \rtrim(ABSPATH, '/') . '/' . \ltrim($exportDir, '/');
		if (!\is_dir($fullExportDir)) {
			$created = \wp_mkdir_p($fullExportDir);
			if (!$created) {
				return new \WP_Error(
					'directory_creation_failed',
					\__('Failed to create export directory', 'aether-site-exporter'),
					['status' => 500]
				);
			}
		}

		$realExportDir = \realpath($fullExportDir);
		$realAbspath = \realpath(ABSPATH);
		if (false === $realExportDir || false === $realAbspath || 0 !== \strpos($realExportDir, $realAbspath)) {
			return new \WP_Error(
				'invalid_export_directory',
				\__('Invalid export directory: must be within WordPress installation', 'aether-site-exporter'),
				['status' => 400]
			);
		}

		$finalZipPath = $realExportDir . '/wp-content.zip';

		// Close zip if still open.
		$zip = new \ZipArchive();
		if ($zip->open($zipPath) === true) {
			$zip->close();
		}

		// Move zip to final location.
		if (!\rename($zipPath, $finalZipPath)) {
			@\unlink($zipPath);
			return new \WP_Error(
				'zip_move_failed',
				\__('Failed to move zip file to final location', 'aether-site-exporter'),
				['status' => 500]
			);
		}

		$zipSize = \filesize($finalZipPath);

		return [
			'success' => true,
			'zipPath' => $finalZipPath,
			'zipUrl' => 'wp-content/wp-content.zip',
			'zipSize' => $zipSize,
		];
	}

	/**
	 * Count total files for all phases.
	 *
	 * Counts files that will actually be added (excludes offloaded files and exclusion patterns).
	 *
	 * @param array<string>|null $customAssetSlugs Optional array of custom plugin/theme slugs.
	 * @return int Total number of files.
	 */
	private function countTotalFilesForPhases(?array $customAssetSlugs = null): int
	{
		$count = 0;

		// Count database file.
		$dbPath = $this->getDatabasePath();
		if (false !== $dbPath && \file_exists($dbPath)) {
			$count++;
		}

		// Count uploads files (excluding offloaded files).
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		if (\is_dir($uploadsDir)) {
			$files = $this->getFilesInDirectory($uploadsDir);
			$offloadedFiles = $this->getOffloadedFilePaths();
			$offloadedFilesSet = \array_flip($offloadedFiles);
			$files = \array_filter($files, function ($filePath) use ($offloadedFilesSet) {
				$realPath = \realpath($filePath);
				return false !== $realPath && !isset($offloadedFilesSet[$realPath]);
			});
			$count += \count($files);
		}

		// Count plugin files (excluding dev files).
		$plugins = $this->getPluginsList($customAssetSlugs);
		foreach ($plugins as $slug) {
			$pluginDir = WP_PLUGIN_DIR . '/' . $slug;
			if (\is_dir($pluginDir)) {
				$count += $this->countFilesInDirectoryWithExclusions($pluginDir, true);
			}
		}

		// Count theme files (excluding dev files).
		$themes = $this->getThemesList($customAssetSlugs);
		foreach ($themes as $slug) {
			$themeDir = \get_theme_root() . '/' . $slug;
			if (\is_dir($themeDir)) {
				$count += $this->countFilesInDirectoryWithExclusions($themeDir, true);
			}
		}

		// Count mu-plugins files (excluding dev files).
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		if (\is_dir($mupluginsDir)) {
			$count += $this->countFilesInDirectoryWithExclusions($mupluginsDir, true);
		}

		return $count;
	}

	/**
	 * Count files in directory with exclusion patterns applied.
	 *
	 * @param string $dir Directory path.
	 * @param bool $excludeDevFiles Whether to exclude development files.
	 * @return int Number of files (excluding matched patterns).
	 */
	private function countFilesInDirectoryWithExclusions(string $dir, bool $excludeDevFiles = false): int
	{
		$count = 0;
		$realDir = \realpath($dir);

		if (false === $realDir || !\is_dir($realDir)) {
			return 0;
		}

		$excludePatterns = $excludeDevFiles ? self::getExclusionPatterns($dir, true) : [];

		$files = \scandir($realDir);
		if (false === $files) {
			return 0;
		}

		// Sort for consistency
		\sort($files);

		foreach ($files as $file) {
			if ('.' === $file || '..' === $file) {
				continue;
			}

			$filePath = $realDir . '/' . $file;
			$realFilePath = \realpath($filePath);

			if (false === $realFilePath || 0 !== \strpos($realFilePath, $realDir . DIRECTORY_SEPARATOR)) {
				continue;
			}

			// Check exclusion patterns
			$excluded = false;
			if (!empty($excludePatterns)) {
				foreach ($excludePatterns as $pattern) {
					if (false !== \strpos($realFilePath, $pattern)) {
						$excluded = true;
						break;
					}
				}
			}

			if ($excluded) {
				continue;
			}

			if (\is_dir($realFilePath)) {
				// Recurse into subdirectory.
				$count += $this->countFilesInDirectoryWithExclusions($realFilePath, $excludeDevFiles);
			} else {
				// Count regular file.
				$count++;
			}
		}

		return $count;
	}

	/**
	 * Get all files in a directory recursively.
	 *
	 * @param string $dir Directory path.
	 * @return array<string> List of file paths (sorted for consistency).
	 */
	private function getFilesInDirectory(string $dir): array
	{
		$files = [];
		$realDir = \realpath($dir);

		if (false === $realDir || !\is_dir($realDir)) {
			return [];
		}

		$items = \scandir($realDir);
		if (false === $items) {
			return [];
		}

		// Sort items for consistent ordering
		\sort($items);

		foreach ($items as $item) {
			if ('.' === $item || '..' === $item) {
				continue;
			}

			$itemPath = $realDir . '/' . $item;
			$realItemPath = \realpath($itemPath);

			if (false === $realItemPath || 0 !== \strpos($realItemPath, $realDir . DIRECTORY_SEPARATOR)) {
				continue;
			}

			if (\is_dir($realItemPath)) {
				$files = \array_merge($files, $this->getFilesInDirectory($realItemPath));
			} else {
				$files[] = $realItemPath;
			}
		}

		// Sort final file list for consistent batch creation
		\sort($files);

		return $files;
	}

	/**
	 * Create batches from file list.
	 *
	 * @param array<string> $files List of file paths.
	 * @param int $maxFiles Maximum files per batch.
	 * @param int $maxSize Maximum size per batch in bytes.
	 * @return array<int, array<string, mixed>> List of batches.
	 */
	private function createBatches(array $files, int $maxFiles, int $maxSize): array
	{
		$batches = [];
		$currentBatch = ['files' => [], 'size' => 0];
		$batchIndex = 0;

		foreach ($files as $filePath) {
			$fileSize = \file_exists($filePath) ? \filesize($filePath) : 0;

			// Start new batch if current batch is full.
			if (
				\count($currentBatch['files']) >= $maxFiles ||
				($currentBatch['size'] + $fileSize) > $maxSize
			) {
				if (!empty($currentBatch['files'])) {
					$batches[$batchIndex] = $currentBatch;
					$batchIndex++;
				}
				$currentBatch = ['files' => [], 'size' => 0];
			}

			$currentBatch['files'][] = $filePath;
			$currentBatch['size'] += $fileSize;
		}

		// Add final batch if it has files.
		if (!empty($currentBatch['files'])) {
			$batches[$batchIndex] = $currentBatch;
		}

		return $batches;
	}

	/**
	 * Calculate overall progress percentage.
	 *
	 * @param int $filesProcessed Files processed so far.
	 * @param int $totalFiles Total files expected.
	 * @param array<string, mixed> $phases Phase status information.
	 * @return int Overall progress (0-100).
	 */
	private function calculateOverallProgress(int $filesProcessed, int $totalFiles, array $phases): int
	{
		if ($totalFiles <= 0) {
			return 100;
		}

		$progress = (int) \round(($filesProcessed / $totalFiles) * 100);
		return \min(100, \max(0, $progress));
	}
}
