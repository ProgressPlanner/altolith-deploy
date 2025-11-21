<?php

/**
 * File Batch Service
 *
 * Handles file counting, batching, and file listing operations for exports.
 *
 * @package Aether\Services
 */

namespace Aether\SiteExporter\Services;

\defined('ABSPATH') || exit;

/**
 * File batch service.
 */
class FileBatchService
{
	/**
	 * Count files in a directory recursively.
	 *
	 * @param string $dir Directory path.
	 * @return int Number of files.
	 */
	public function countFilesInDirectory(string $dir): int
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
	 * Count files in directory with exclusion patterns applied.
	 *
	 * @param string $dir            Directory path.
	 * @param bool   $excludeDevFiles Whether to exclude development files.
	 * @return int Number of files (excluding matched patterns).
	 */
	public function countFilesInDirectoryWithExclusions(string $dir, bool $excludeDevFiles = false): int
	{
		$count = 0;
		$realDir = \realpath($dir);

		if (false === $realDir || !\is_dir($realDir)) {
			return 0;
		}

		$excludePatterns = $excludeDevFiles ? $this->getExclusionPatterns($dir, true) : [];

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
	public function getFilesInDirectory(string $dir): array
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
	 * @param array<string> $files    List of file paths.
	 * @param int           $maxFiles Maximum files per batch.
	 * @param int           $maxSize  Maximum size per batch in bytes.
	 * @return array<int, array<string, mixed>> List of batches.
	 */
	public function createBatches(array $files, int $maxFiles, int $maxSize): array
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
	 * Get file paths of all attachments offloaded to external storage.
	 *
	 * @return array<string> Array of absolute file paths.
	 */
	public function getOffloadedFilePaths(): array
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
	 * Get exclusion patterns for development files and large dependencies.
	 *
	 * This method generates patterns for files/folders that should typically
	 * be excluded from production zips: .git, node_modules, vendor, etc.
	 *
	 * @param string $sourceDir    Source directory path to check for large folders.
	 * @param bool   $autoExclude Enable automatic exclusion of .git and large vendor folders.
	 * @return array<string> Array of exclusion patterns.
	 */
	public function getExclusionPatterns(string $sourceDir, bool $autoExclude = true): array
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
}
