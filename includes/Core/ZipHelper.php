<?php

/**
 * Zip Helper
 *
 * Shared utility methods for creating zip files from directories.
 *
 * @package Aether\Core
 */

namespace Aether\SiteExporter\Core;

/**
 * Class description.
 */
class ZipHelper
{
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
	 * Create a zip file from a directory.
	 *
	 * @param string   $sourceDir Source directory path.
	 * @param string   $baseName Base folder name for zip entries.
	 * @param string[] $excludePatterns Optional array of patterns to exclude.
	 * @param bool     $autoExclude Enable automatic exclusion of .git and large vendor folders.
	 * @return string|\WP_Error Path to created zip file or WP_Error on failure.
	 */
	public static function createZipFromDirectory($sourceDir, $baseName, $excludePatterns = [], $autoExclude = true)
	{
		if (! \is_dir($sourceDir)) {
			return new \WP_Error('directory_not_found', 'Source directory not found');
		}

		// Get auto-exclusion patterns and merge with provided patterns.
		$autoPatterns = self::getExclusionPatterns($sourceDir, $autoExclude);
		$excludePatterns = \array_merge($excludePatterns, $autoPatterns);

		// Create temp zip file.
		// wp_tempnam is in wp-admin/includes/file.php, which isn't loaded in REST API context.
		if (! \function_exists('wp_tempnam')) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		$tempZip = \wp_tempnam($baseName . '-zip');
		$zipFile = $tempZip . '.zip';
		\rename($tempZip, $zipFile);

		// Create zip using ZipArchive.
		if (! \class_exists('ZipArchive')) {
			return new \WP_Error('zip_not_available', 'ZipArchive class not available');
		}

		$zip = new \ZipArchive();
		if (true !== $zip->open($zipFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE)) {
			return new \WP_Error('zip_open_failed', 'Failed to create zip file');
		}

		// Add all files from source directory.
		self::addDirectoryToZip($zip, $sourceDir, $baseName, '', $excludePatterns);

		// Get file count before closing.
		$fileCount = $zip->numFiles;

		// Close the ZIP archive and check for errors
		$closeSuccess = $zip->close();
		if (false === $closeSuccess) {
			// If close() fails, explicitly unset $zip to release file handles
			// This prevents resource leaks even when close() fails
			unset($zip);
			throw new \RuntimeException('Failed to close ZIP archive');
		}

		// ZipArchive doesn't create file if empty, so check and handle.
		if (0 === $fileCount && ! \file_exists($zipFile)) {
			// Create empty zip manually.
			$emptyZip = new \ZipArchive();
			$emptyZip->open($zipFile, \ZipArchive::CREATE);
			$emptyZip->addFromString('.empty', '');
			$emptyZip->close();
		}

		return $zipFile;
	}

	/**
	 * Recursively add directory contents to zip.
	 *
	 * @param \ZipArchive $zip ZipArchive instance.
	 * @param string      $sourceDir Source directory path.
	 * @param string      $baseName Base folder name for zip entries.
	 * @param string      $relativePath Relative path within source (for recursion).
	 * @param string[]    $excludePatterns Optional array of patterns to exclude.
	 */
	public static function addDirectoryToZip($zip, $sourceDir, $baseName, $relativePath = '', $excludePatterns = []): void
	{
		$fullPath = $sourceDir . ( $relativePath ? '/' . $relativePath : '' );

		if (! \is_dir($fullPath)) {
			return;
		}

		// Security: Validate that full_path is within source_dir to prevent path traversal.
		$realPath   = \realpath($fullPath);
		$realSource = \realpath($sourceDir);

		// If realpath fails or path is outside source, abort.
		if (false === $realPath || false === $realSource || 0 !== \strpos($realPath, $realSource)) {
			return;
		}

		$files = \scandir($fullPath);

		// Check if scandir() failed (permission denied, directory deleted, etc.).
		if (false === $files) {
			return;
		}

		foreach ($files as $file) {
			if ('.' === $file || '..' === $file) {
				continue;
			}

			$filePath = $fullPath . '/' . $file;

			// Security: Validate that file_path is within source_dir.
			$realFile = \realpath($filePath);
			if (false === $realFile || 0 !== \strpos($realFile, $realSource)) {
				continue;
			}

			$zipPath  = $baseName . ( $relativePath ? '/' . $relativePath : '' ) . '/' . $file;

			// Check exclude patterns.
			$excluded = false;
			foreach ($excludePatterns as $pattern) {
				if (false !== \strpos($filePath, $pattern)) {
					$excluded = true;
					break;
				}
			}

			if ($excluded) {
				continue;
			}

			if (\is_dir($filePath)) {
				// Recursively add directory.
				self::addDirectoryToZip(
					$zip,
					$sourceDir,
					$baseName,
					$relativePath ? $relativePath . '/' . $file : $file,
					$excludePatterns
				);
			} else {
				// Add file to zip.
				$zip->addFile($filePath, $zipPath);
			}
		}
	}
}
