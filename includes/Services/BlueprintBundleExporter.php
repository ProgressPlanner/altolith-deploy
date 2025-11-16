<?php

/**
 * Blueprint Bundle Exporter Service
 *
 * Creates WordPress Playground blueprint bundles following the official spec:
 * https://wordpress.github.io/wordpress-playground/blueprints/bundles/
 *
 * @package AetherSiteExporter\Services
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\Services;

use ZipArchive;

// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- No database queries in this class.

/**
 * Blueprint bundle exporter service.
 *
 * @since 1.0.0
 */
class BlueprintBundleExporter
{
	/**
	 * Create a blueprint bundle.
	 *
	 * @since 1.0.0
	 * @param string $sqlite_db_path Path to SQLite database file.
	 * @param string $bundle_dir     Path to bundle directory.
	 * @param array  $config         Blueprint configuration.
	 * @return array{success: bool, error?: string} Result.
	 */
	public function create_blueprint(string $sqlite_db_path, string $bundle_dir, array $config): array
	{
		// Verify SQLite database exists.
		if (! \file_exists($sqlite_db_path)) {
			return [
				'success' => false,
				'error'   => 'SQLite database file not found: ' . $sqlite_db_path,
			];
		}

		// Create bundle directory if it doesn't exist.
		if (! \is_dir($bundle_dir)) {
			\wp_mkdir_p($bundle_dir);
		}

		// Copy SQLite database to bundle.
		$db_dest = $bundle_dir . '/database.sqlite';
		\copy($sqlite_db_path, $db_dest);

		// Copy wp-content if requested.
		if (! empty($config['includeWpContent']) && ! empty($config['wpContentPath'])) {
			$this->copy_directory($config['wpContentPath'], $bundle_dir . '/wp-content');
		}

		// Create blueprint.json.
		$blueprint = $this->generate_blueprint_json($config);
		\file_put_contents(
			$bundle_dir . '/blueprint.json',
			\wp_json_encode($blueprint, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
		);

		return ['success' => true];
	}

	/**
	 * Generate blueprint.json content.
	 *
	 * @since 1.0.0
	 * @param array $config Configuration.
	 * @return array Blueprint data.
	 */
	private function generate_blueprint_json(array $config): array
	{
		$blueprint = [
			'landingPage' => $config['landingPage'] ?? '/',
			'steps'       => [],
		];

		// Step 1: Import SQLite database and wp-content.
		$blueprint['steps'][] = [
			'step'              => 'importWordPressFiles',
			'wordPressFilesZip' => [
				'resource' => 'bundled',
				'path'     => 'wordpress-files.zip',
			],
		];

		// Step 2: Install plugins if specified.
		if (! empty($config['plugins'])) {
			foreach ($config['plugins'] as $plugin_slug) {
				$blueprint['steps'][] = [
					'step'       => 'installPlugin',
					'pluginZipFile' => [
						'resource' => 'wordpress.org/plugins',
						'slug'     => $plugin_slug,
					],
				];
			}
		}

		return $blueprint;
	}

	/**
	 * Create bundle ZIP file.
	 *
	 * @since 1.0.0
	 * @param string $bundle_dir Path to bundle directory.
	 * @param string $zip_path   Path for output ZIP file.
	 * @return array{success: bool, size?: int, error?: string} Result.
	 */
	public function create_bundle_zip(string $bundle_dir, string $zip_path): array
	{
		$zip = new ZipArchive();

		if (true !== $zip->open($zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
			return [
				'success' => false,
				'error'   => 'Failed to create ZIP file',
			];
		}

		// First, create wp-content ZIP for the importWordPressFiles step.
		$wp_content_zip_path = $bundle_dir . '/wordpress-files.zip';
		$this->create_wp_content_zip($bundle_dir, $wp_content_zip_path);

		// Add blueprint.json FIRST (required by spec).
		$zip->addFile($bundle_dir . '/blueprint.json', 'blueprint.json');

		// Add wordpress-files.zip.
		if (\file_exists($wp_content_zip_path)) {
			$zip->addFile($wp_content_zip_path, 'wordpress-files.zip');
		}

		// Add all other files recursively (excluding blueprint.json, wordpress-files.zip, and database.sqlite since it's in wordpress-files.zip).
		$this->add_directory_to_zip($zip, $bundle_dir, '', ['blueprint.json', 'wordpress-files.zip', 'database.sqlite', 'wp-content']);

		$zip->close();

		// Get ZIP file size.
		$size = \filesize($zip_path);

		// Clean up temporary wordpress-files.zip.
		if (\file_exists($wp_content_zip_path)) {
			\unlink($wp_content_zip_path);
		}

		return [
			'success' => true,
			'size'    => $size,
		];
	}

	/**
	 * Create wp-content ZIP for importWordPressFiles step.
	 *
	 * @since 1.0.0
	 * @param string $bundle_dir Bundle directory.
	 * @param string $zip_path   Output ZIP path.
	 * @return void
	 */
	private function create_wp_content_zip(string $bundle_dir, string $zip_path): void
	{
		$zip = new ZipArchive();
		$zip->open($zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE);

		// Add database.sqlite as wp-content/database/.ht.sqlite.
		if (\file_exists($bundle_dir . '/database.sqlite')) {
			$zip->addFile($bundle_dir . '/database.sqlite', 'wp-content/database/.ht.sqlite');
		}

		// Add wp-content directory if it exists.
		if (\is_dir($bundle_dir . '/wp-content')) {
			$this->add_directory_to_zip($zip, $bundle_dir . '/wp-content', 'wp-content');
		}

		$zip->close();
	}

	/**
	 * Add directory contents to ZIP recursively.
	 *
	 * @since 1.0.0
	 * @param ZipArchive $zip          ZIP archive.
	 * @param string     $source_dir   Source directory.
	 * @param string     $zip_path     Path inside ZIP.
	 * @param array      $exclude      Files to exclude.
	 * @return void
	 */
	private function add_directory_to_zip(ZipArchive $zip, string $source_dir, string $zip_path = '', array $exclude = []): void
	{
		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($source_dir),
			\RecursiveIteratorIterator::LEAVES_ONLY
		);

		foreach ($files as $file) {
			if (! $file->isFile()) {
				continue;
			}

			$file_path = $file->getRealPath();
			$relative_path = \substr($file_path, \strlen($source_dir) + 1);

			// Skip excluded files.
			if (\in_array($relative_path, $exclude, true)) {
				continue;
			}

			$zip_file_path = $zip_path ? $zip_path . '/' . $relative_path : $relative_path;
			$zip->addFile($file_path, $zip_file_path);
		}
	}

	/**
	 * Copy directory recursively.
	 *
	 * @since 1.0.0
	 * @param string $source Source directory.
	 * @param string $dest   Destination directory.
	 * @return void
	 */
	private function copy_directory(string $source, string $dest): void
	{
		if (! \is_dir($dest)) {
			\wp_mkdir_p($dest);
		}

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($source),
			\RecursiveIteratorIterator::SELF_FIRST
		);

		foreach ($files as $file) {
			$file_path = $file->getRealPath();
			$relative_path = \substr($file_path, \strlen($source) + 1);
			$dest_path = $dest . '/' . $relative_path;

			if ($file->isDir()) {
				\wp_mkdir_p($dest_path);
			} else {
				\copy($file_path, $dest_path);
			}
		}
	}
}
