<?php

/**
 * ZIP Service
 *
 * Handles ZIP archive operations for exports.
 *
 * @package Aether\Services
 */

namespace Aether\SiteExporter\Services;

\defined('ABSPATH') || exit;

/**
 * ZIP service.
 */
class ZipService
{
	/**
	 * File batch service instance.
	 *
	 * @var FileBatchService
	 */
	private FileBatchService $fileBatchService;

	/**
	 * Constructor.
	 *
	 * @param FileBatchService $fileBatchService File batch service instance.
	 */
	public function __construct(FileBatchService $fileBatchService)
	{
		$this->fileBatchService = $fileBatchService;
	}

	/**
	 * Add directory to zip archive recursively.
	 *
	 * @param \ZipArchive             $zip             ZipArchive instance.
	 * @param string                  $sourceDir      Source directory path.
	 * @param string                  $zipPath        Path inside zip.
	 * @param string                  $relativePath   Relative path for recursion.
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
			$offloadedFiles = $this->fileBatchService->getOffloadedFilePaths();
		}
		if (null === $offloadedFiles) {
			$offloadedFiles = [];
		}

		// Lazy-load exclusion patterns (only on first call, not on recursive calls).
		// Patterns are generated once from composer.json, package.json, etc.
		// Pass through recursion to avoid regenerating on every subdirectory.
		if (null === $excludePatterns && $shouldExcludeDevFiles && '' === $relativePath) {
			$excludePatterns = $this->fileBatchService->getExclusionPatterns($sourceDir, true);
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
}
