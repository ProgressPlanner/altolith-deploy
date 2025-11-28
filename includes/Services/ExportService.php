<?php

/**
 * Export Service
 *
 * Handles site export operations (database + wp-content).
 *
 * @package Altolith\Services
 */

namespace Altolith\Deploy\Services;

use Altolith\Deploy\Utilities\TempDirectoryManager;
use Altolith\Deploy\Utilities\SecurityValidator;
use Altolith\Deploy\Services\ZipService;
use Altolith\Deploy\Services\FileBatchService;

\defined('ABSPATH') || exit;

/**
 * Service for exporting site content.
 */
class ExportService
{
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
	 */
	public function __construct()
	{
		$this->fileBatchService = new FileBatchService();
		$this->zipService = new ZipService($this->fileBatchService);
	}

	/**
	 * Export core site content as single zip file.
	 *
	 * Creates wp-content.zip containing:
	 * - Database (SQLite)
	 * - Uploads directory
	 * - MU-plugins directory
	 *
	 * Note: Custom plugins and themes are exported separately via exportPlugin() and exportTheme().
	 *
	 * @return array<string, mixed>|\WP_Error Result array with zipPath and zipSize, or WP_Error on failure.
	 */
	public function exportCoreContent()
	{
		// WordPress Playground Compatibility:
		// Use TempDirectoryManager instead of sys_get_temp_dir() because
		// WordPress Playground's WASM environment may not have /tmp access.
		$tempZipPath = TempDirectoryManager::getTempFilePath('wp-content-core-', '.zip');

		if (false === $tempZipPath) {
			return new \WP_Error(
				'temp_directory_unavailable',
				\__('Could not create temporary directory for export. Please check file permissions.', 'altolith-deploy'),
				['status' => 500]
			);
		}

		$zip = new \ZipArchive();
		if (true !== $zip->open($tempZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE)) {
			return new \WP_Error(
				'zip_create_failed',
				\__('Failed to create site export zip', 'altolith-deploy'),
				[ 'status' => 500 ]
			);
		}

		// 1. Add database file (most critical for site restoration).
		$dbPath = $this->getDatabasePath();
		if (false !== $dbPath && \file_exists($dbPath)) {
			$dbRelativePath = 'wp-content/database/' . \basename($dbPath);
			$zip->addFile($dbPath, $dbRelativePath);
		}

		// 2. Add uploads directory (user media files).
		$uploadsDir = WP_CONTENT_DIR . '/uploads';
		if (\is_dir($uploadsDir)) {
			$this->zipService->addDirectoryToZip($zip, $uploadsDir, 'wp-content/uploads');
		}

		// 3. Add mu-plugins directory (must-use plugins).
		$mupluginsDir = WP_CONTENT_DIR . '/mu-plugins';
		if (\is_dir($mupluginsDir)) {
			$this->zipService->addDirectoryToZip($zip, $mupluginsDir, 'wp-content/mu-plugins', '', null, null);
		}

		$zip->close();

		$zipSize = \filesize($tempZipPath);
		$relativePath = \str_replace(WP_CONTENT_DIR, '', $tempZipPath);
		$zipUrl = \content_url($relativePath);

		$result = [
			'success'  => true,
			'zipPath' => $tempZipPath,
			'zipUrl'  => $zipUrl,
			'zipSize' => $zipSize,
		];

		/** @var array<string, mixed>|\WP_Error */
		return \apply_filters('altolith_deploy_export_core_content', $result);
	}

	/**
	 * Export a single plugin as a zip file.
	 *
	 * Creates a zip with plugin files directly at root (not in a subdirectory).
	 * This matches WordPress Playground's expected format for installPlugin steps.
	 *
	 * @param string $slug Plugin slug (directory name).
	 * @return array<string, mixed>|\WP_Error Result array with zipPath and zipSize, or WP_Error on failure.
	 */
	public function exportPlugin(string $slug)
	{
		return $this->exportDirectory(WP_PLUGIN_DIR, $slug, 'plugin');
	}

	/**
	 * Export a single theme as a zip file.
	 *
	 * Creates a zip with theme files directly at root (not in a subdirectory).
	 * This matches WordPress Playground's expected format for installTheme steps.
	 *
	 * @param string $slug Theme slug (directory name).
	 * @return array<string, mixed>|\WP_Error Result array with zipPath and zipSize, or WP_Error on failure.
	 */
	public function exportTheme(string $slug)
	{
		return $this->exportDirectory(\get_theme_root(), $slug, 'theme');
	}

	/**
	 * Export a directory as a zip file with files at root.
	 *
	 * @param string $baseDir Base directory containing the target directory.
	 * @param string $slug    Directory name to export.
	 * @param string $type    Type identifier for error messages ('plugin' or 'theme').
	 * @return array<string, mixed>|\WP_Error Result array with zipPath and zipSize, or WP_Error on failure.
	 */
	private function exportDirectory(string $baseDir, string $slug, string $type)
	{
		$validatedSlug = $this->validateAndSanitizeSlug($slug);
		if (null === $validatedSlug) {
			return new \WP_Error(
				'invalid_slug',
				/* translators: %s: Asset type (plugin or theme) */
				\sprintf(\__('Invalid %s slug provided.', 'altolith-deploy'), $type),
				['status' => 400]
			);
		}

		$targetDir = $baseDir . '/' . $validatedSlug;

		if (! \is_dir($targetDir)) {
			return new \WP_Error(
				$type . '_not_found',
				/* translators: %1$s: Asset type, %2$s: Asset slug */
				\sprintf(\__('%1$s not found: %2$s', 'altolith-deploy'), \ucfirst($type), $validatedSlug),
				['status' => 404]
			);
		}

		$tempZipPath = TempDirectoryManager::getTempFilePath($validatedSlug . '-', '.zip');

		if (false === $tempZipPath) {
			return new \WP_Error(
				'temp_directory_unavailable',
				\__('Could not create temporary directory for export.', 'altolith-deploy'),
				['status' => 500]
			);
		}

		$zip = new \ZipArchive();
		if (true !== $zip->open($tempZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE)) {
			return new \WP_Error(
				'zip_create_failed',
				/* translators: %s: Asset type (plugin or theme) */
				\sprintf(\__('Failed to create %s export zip', 'altolith-deploy'), $type),
				['status' => 500]
			);
		}

		// Get exclusion patterns for dev files (node_modules, .git, vendor, tests, etc.)
		// This is critical to avoid 100MB+ plugin zips
		$excludePatterns = $this->fileBatchService->getExclusionPatterns($targetDir, true);

		// Add files directly at zip root (not in a subdirectory).
		// WordPress Playground expects plugin/theme files at root of the zip.
		$this->zipService->addDirectoryToZip($zip, $targetDir, '', '', $excludePatterns, null);

		$zip->close();

		$zipSize = \filesize($tempZipPath);
		$relativePath = \str_replace(WP_CONTENT_DIR, '', $tempZipPath);
		$zipUrl = \content_url($relativePath);

		return [
			'success' => true,
			'zipPath' => $tempZipPath,
			'zipUrl'  => $zipUrl,
			'zipSize' => $zipSize,
			'slug'    => $validatedSlug,
		];
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
	 * Validate and sanitize a slug for safe use in file paths.
	 *
	 * Performs type checking, sanitization, and security validation.
	 *
	 * @param mixed $slug Slug to validate and sanitize.
	 * @return string|null Validated and sanitized slug, or null if invalid.
	 */
	private function validateAndSanitizeSlug($slug): ?string
	{
		// Security: Type check first
		if (!\is_string($slug)) {
			return null;
		}

		// Security: Sanitize BEFORE validation to prevent bypasses
		$slug = \sanitize_file_name($slug);

		// Security: Validate slug doesn't contain path traversal, null bytes, or dangerous values
		$slugValidation = SecurityValidator::validateSlug($slug);
		if (! $slugValidation['valid']) {
			return null;
		}

		return $slug;
	}
}
