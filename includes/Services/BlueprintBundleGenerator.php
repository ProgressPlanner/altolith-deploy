<?php

/**
 * Blueprint Bundle Generator Service
 *
 * Generates a WordPress Playground blueprint-bundle.zip file containing:
 * - blueprint.json (at root)
 * - wp-content.zip (at root)
 *
 * @package Aether\SiteExporter\Services
 */

namespace Aether\SiteExporter\Services;

use ZipArchive;

/**
 * Blueprint Bundle Generator class
 */
class BlueprintBundleGenerator
{
	/**
	 * Generate a blueprint-bundle.zip file.
	 *
	 * @param array<string, mixed>  $blueprintData Blueprint JSON data as associative array.
	 * @param string $wpContentZipPath Absolute path to wp-content.zip file.
	 * @param string $outputDir Directory where blueprint-bundle.zip will be created.
	 * @param string $bundleFilename Optional custom filename for the bundle (default: 'blueprint-bundle.zip').
	 * @return string|false Path to generated blueprint-bundle.zip, or false on failure.
	 */
	public function generate(array $blueprintData, string $wpContentZipPath, string $outputDir, string $bundleFilename = 'blueprint-bundle.zip')
	{
		// Validate blueprint data
		if (empty($blueprintData)) {
			return false;
		}

		// Validate wp-content.zip path
		if (empty($wpContentZipPath)) {
			return false;
		}

		// Security: Validate wp-content.zip path to prevent path traversal
		$realWpContentPath = \realpath($wpContentZipPath);
		if (false === $realWpContentPath) {
			return false;
		}

		// Ensure wp-content.zip file exists
		if (!\file_exists($realWpContentPath)) {
			return false;
		}

		// Validate output directory
		if (empty($outputDir)) {
			return false;
		}

		// Create output directory if it doesn't exist
		if (!\is_dir($outputDir)) {
			\wp_mkdir_p($outputDir);
		}

		// Security: Validate output directory is within ABSPATH
		$realOutputDir = \realpath($outputDir);
		$realAbspath = \realpath(ABSPATH);

		// If realpath fails (e.g., symlinks in Local by Flywheel), fall back to normalized path comparison
		if (false === $realOutputDir || false === $realAbspath) {
			$normalizedOutputDir = \wp_normalize_path($outputDir);
			$normalizedAbspath = \wp_normalize_path(ABSPATH);
			if (0 !== \strpos($normalizedOutputDir, $normalizedAbspath)) {
				return false;
			}
			// Use normalized path for subsequent operations
			$realOutputDir = $normalizedOutputDir;
		} elseif (0 !== \strpos($realOutputDir, $realAbspath)) {
			return false;
		}

		// Validate bundle filename
		if (empty($bundleFilename) || !\preg_match('/\.zip$/i', $bundleFilename)) {
			return false;
		}

		// Security: Validate bundle filename doesn't contain path traversal
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $bundleFilename) || \preg_match('#^[/\\\\]#', $bundleFilename)) {
			return false;
		}

		// Create blueprint-bundle.zip path with custom filename using validated paths
		$bundlePath = \trailingslashit($realOutputDir) . $bundleFilename;

		// Remove existing bundle if it exists (handle both files and directories)
		if (\file_exists($bundlePath)) {
			if (\is_dir($bundlePath)) {
				// If bundle path is a directory (from previous bug), recursively remove it
				$this->deleteDirectory($bundlePath);
			} else {
				\wp_delete_file($bundlePath);
			}
		}

		// Create ZIP archive
		$zip = new ZipArchive();
		if ($zip->open($bundlePath, ZipArchive::CREATE) !== true) {
			return false;
		}

		// Add blueprint.json to bundle
		$blueprintJson = \wp_json_encode($blueprintData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
		if ($blueprintJson === false) {
			$zip->close();
			\wp_delete_file($bundlePath);
			return false;
		}

		$zip->addFromString('blueprint.json', $blueprintJson);

		// Validate file size before adding to prevent memory exhaustion
		// Set limit to 512MB to prevent timeout/memory issues
		$wpContentSize = \filesize($realWpContentPath);
		$maxSize = 512 * 1024 * 1024; // 512MB limit

		if (false === $wpContentSize || $wpContentSize > $maxSize) {
			$zip->close();
			\wp_delete_file($bundlePath);
			\wp_delete_file($realWpContentPath);
			return false;
		}

		// Add wp-content.zip to bundle using validated path
		if (!$zip->addFile($realWpContentPath, 'wp-content.zip')) {
			$zip->close();
			\wp_delete_file($bundlePath);
			return false;
		}

		// Re-validate file size after addFile() to prevent TOCTOU race condition
		// File could have been modified between initial filesize() check and addFile() call
		\clearstatcache(true, $realWpContentPath);
		$wpContentSizeAfter = \filesize($realWpContentPath);
		if (false === $wpContentSizeAfter || $wpContentSizeAfter > $maxSize) {
			$zip->close();
			\wp_delete_file($bundlePath);
			\wp_delete_file($realWpContentPath);
			return false;
		}

		// Close and finalize the ZIP
		$closeSuccess = $zip->close();

		// Always delete wp-content.zip after adding it to bundle, even if close() failed.
		// This prevents orphaned files from accumulating. Use validated path.
		\wp_delete_file($realWpContentPath);

		if (!$closeSuccess) {
			\wp_delete_file($bundlePath);
			return false;
		}

		return $bundlePath;
	}

	/**
	 * Get the size of a blueprint-bundle.zip file in human-readable format.
	 *
	 * @param string $bundlePath Path to blueprint-bundle.zip.
	 * @return string Human-readable file size.
	 */
	public function getBundleSize(string $bundlePath): string
	{
		if (!\file_exists($bundlePath)) {
			return '0 B';
		}

		$fileSize = \filesize($bundlePath);
		if (false === $fileSize) {
			return '0 B';
		}

		return \size_format($fileSize, 2);
	}

	/**
	 * Validate that a blueprint-bundle.zip file has the correct structure.
	 *
	 * @param string $bundlePath Path to blueprint-bundle.zip.
	 * @return bool True if valid, false otherwise.
	 */
	public function validateBundle(string $bundlePath): bool
	{
		if (!\file_exists($bundlePath)) {
			return false;
		}

		$zip = new ZipArchive();
		if ($zip->open($bundlePath, ZipArchive::RDONLY) !== true) {
			return false;
		}

		// Check for required files
		$hasBlueprint = $zip->locateName('blueprint.json') !== false;
		$hasWpContent = $zip->locateName('wp-content.zip') !== false;

		$zip->close();

		return $hasBlueprint && $hasWpContent;
	}

	/**
	 * Recursively delete a directory and its contents.
	 *
	 * @param string $directory Directory path to delete.
	 * @return bool True on success, false on failure.
	 */
	private function deleteDirectory(string $directory): bool
	{
		if (!\file_exists($directory) || !\is_dir($directory)) {
			return false;
		}

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
			\RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ($files as $file) {
			if ($file->isDir()) {
				@\rmdir($file->getRealPath());
			} else {
				@\unlink($file->getRealPath());
			}
		}

		return @\rmdir($directory);
	}
}
