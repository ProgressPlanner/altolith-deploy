<?php

/**
 * File Manager - Universal file operation helper with persistence checks
 *
 * Handles file operations with awareness of ephemeral filesystems
 * like WordPress Playground. Provides validation, error handling,
 * and fallback mechanisms.
 *
 * @package Altolith\Deploy
 */

namespace Altolith\Deploy\Utilities;

/**
 * Class FileManager
 *
 * Manages file operations with persistence awareness.
 */
class FileManager
{
	/**
	 * Maximum file age for automatic cleanup (24 hours)
	 *
	 * @var int
	 */
	private const MAX_FILE_AGE = 86400;

	/**
	 * Maximum retries for file operations
	 *
	 * @var int
	 */
	private const MAX_RETRIES = 3;

	/**
	 * Retry delay in milliseconds
	 *
	 * @var int
	 */
	private const RETRY_DELAY_MS = 100;

	/**
	 * Check if a file exists and is accessible
	 *
	 * More robust than file_exists() alone - also checks readability.
	 *
	 * @param string $filePath Path to file
	 * @return bool True if file exists and is accessible
	 */
	public static function fileExistsAndAccessible($filePath)
	{
		if (! \file_exists($filePath)) {
			return false;
		}

		if (! \is_file($filePath)) {
			return false;
		}

		if (! \is_readable($filePath)) {
			return false;
		}

		return true;
	}

	/**
	 * Verify a file still exists before an operation
	 *
	 * Logs warning if file is missing (may indicate persistence issue).
	 *
	 * @param string $filePath Path to file
	 * @param string $operation Operation name for logging
	 * @return bool True if file exists, false otherwise
	 */
	public static function verifyFileExists($filePath, $operation = 'operation')
	{
		if (self::fileExistsAndAccessible($filePath)) {
			return true;
		}

		// Log persistence issue
		if (\defined('WP_DEBUG') && WP_DEBUG) {
			\error_log(
				\sprintf(
					'Altolith File Manager: File missing before %s: %s (may indicate ephemeral filesystem)',
					$operation,
					$filePath
				)
			);
		}

		return false;
	}

	/**
	 * Read file with retry logic
	 *
	 * Retries file read operations to handle transient filesystem issues.
	 *
	 * @param string $filePath Path to file
	 * @param int    $maxRetries Maximum retry attempts
	 * @return string|false File contents or false on failure
	 */
	public static function readFileWithRetry($filePath, $maxRetries = self::MAX_RETRIES)
	{
		for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
			if (! self::fileExistsAndAccessible($filePath)) {
				// File doesn't exist, no point retrying
				return false;
			}

			$content = @\file_get_contents($filePath);

			if (false !== $content) {
				return $content;
			}

			// Wait before retry (except on last attempt)
			if ($attempt < $maxRetries - 1) {
				\usleep(self::RETRY_DELAY_MS * 1000);
			}
		}

		// Log persistent failure
		\error_log(
			\sprintf(
				'Altolith File Manager: Failed to read file after %d attempts: %s',
				$maxRetries,
				$filePath
			)
		);

		return false;
	}

	/**
	 * Write file with retry logic
	 *
	 * Retries file write operations to handle transient filesystem issues.
	 *
	 * @param string $filePath Path to file
	 * @param string $content  Content to write
	 * @param int    $maxRetries Maximum retry attempts
	 * @return bool True on success, false on failure
	 */
	public static function writeFileWithRetry($filePath, $content, $maxRetries = self::MAX_RETRIES)
	{
		// Ensure directory exists
		$directory = \dirname($filePath);
		if (! \file_exists($directory)) {
			if (! \wp_mkdir_p($directory)) {
				\error_log(
					\sprintf(
						'Altolith File Manager: Failed to create directory: %s',
						$directory
					)
				);
				return false;
			}
		}

		for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
			$result = @\file_put_contents($filePath, $content);

			if (false !== $result) {
				// Verify the write succeeded
				if (self::fileExistsAndAccessible($filePath)) {
					return true;
				}
			}

			// Wait before retry (except on last attempt)
			if ($attempt < $maxRetries - 1) {
				\usleep(self::RETRY_DELAY_MS * 1000);
			}
		}

		// Log persistent failure
		\error_log(
			\sprintf(
				'Altolith File Manager: Failed to write file after %d attempts: %s',
				$maxRetries,
				$filePath
			)
		);

		return false;
	}

	/**
	 * Delete file with verification
	 *
	 * Deletes file and verifies deletion succeeded.
	 *
	 * @param string $filePath Path to file
	 * @return bool True on success, false on failure
	 */
	public static function deleteFile($filePath)
	{
		if (! \file_exists($filePath)) {
			// Already deleted or never existed
			return true;
		}

		if (! \is_file($filePath)) {
			\error_log(
				\sprintf(
					'Altolith File Manager: Cannot delete non-file: %s',
					$filePath
				)
			);
			return false;
		}

		$result = @\unlink($filePath);

		if (! $result) {
			\error_log(
				\sprintf(
					'Altolith File Manager: Failed to delete file: %s',
					$filePath
				)
			);
			return false;
		}

		// Verify deletion
		if (\file_exists($filePath)) {
			\error_log(
				\sprintf(
					'Altolith File Manager: File still exists after deletion: %s (may indicate filesystem issue)',
					$filePath
				)
			);
			return false;
		}

		return true;
	}

	/**
	 * Get file metadata with caching awareness
	 *
	 * Returns file size, modification time, and age.
	 *
	 * @param string $filePath Path to file
	 * @return array<string, mixed>|false Array with metadata or false on failure
	 */
	public static function getFileMetadata($filePath)
	{
		if (! self::fileExistsAndAccessible($filePath)) {
			return false;
		}

		$size = @\filesize($filePath);
		$mtime = @\filemtime($filePath);

		if (false === $size || false === $mtime) {
			return false;
		}

		return [
			'size'  => $size,
			'mtime' => $mtime,
			'age'   => \time() - $mtime,
			'path'  => $filePath,
		];
	}

	/**
	 * Check if file is stale and should be cleaned up
	 *
	 * @param string $filePath   Path to file
	 * @param int    $maxAge Maximum age in seconds
	 * @return bool True if file is stale
	 */
	public static function isFileStale($filePath, $maxAge = self::MAX_FILE_AGE)
	{
		$metadata = self::getFileMetadata($filePath);

		if (false === $metadata) {
			return false;
		}

		return $metadata['age'] > $maxAge;
	}


	/**
	 * Clean up old tracked files that no longer exist
	 *
	 * @return int Number of tracking records cleaned up
	 */
	public static function cleanupTracking()
	{
		global $wpdb;

		// Find all altolith_file_ transients
		$transients = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT option_name FROM {$wpdb->options}
				WHERE option_name LIKE %s
				AND option_name NOT LIKE %s",
				$wpdb->esc_like('_transient_altolith_file_') . '%',
				$wpdb->esc_like('_transient_timeout_') . '%'
			)
		);

		$cleaned = 0;

		foreach ($transients as $transientName) {
			// Remove _transient_ prefix
			$key = \str_replace('_transient_', '', $transientName);
			$data = \get_transient($key);

			if (false === $data || ! isset($data['path'])) {
				\delete_transient($key);
				$cleaned++;
				continue;
			}

			// Check if file still exists
			if (! self::fileExistsAndAccessible($data['path'])) {
				// File is gone, remove tracking
				\delete_transient($key);
				$cleaned++;
			}
		}

		return $cleaned;
	}

	/**
	 * Get warning message about ephemeral storage
	 *
	 * Returns user-facing message about file persistence.
	 *
	 * @param string $context Context for the warning (export, upload, etc)
	 * @return string Warning message
	 */
	public static function getEphemeralStorageWarning($context = 'files')
	{
		$warnings = [
			'export'  => \__('Export files are stored temporarily and should be downloaded immediately. Files may not persist across browser sessions in some environments.', 'altolith-deploy'),
			'upload'  => \__('Uploaded files may not persist across sessions in some environments. Download your files after generation.', 'altolith-deploy'),
			'temp'    => \__('Temporary files are automatically cleaned up after 1 hour.', 'altolith-deploy'),
			'files'   => \__('Files may not persist across browser sessions in some environments. Download important files immediately.', 'altolith-deploy'),
		];

		return $warnings[ $context ] ?? $warnings['files'];
	}

	/**
	 * Copy file with verification
	 *
	 * Copies file and verifies the copy succeeded.
	 *
	 * @param string $source      Source file path
	 * @param string $destination Destination file path
	 * @return bool True on success, false on failure
	 */
	public static function copyFile($source, $destination)
	{
		if (! self::fileExistsAndAccessible($source)) {
			\error_log(
				\sprintf(
					'Altolith File Manager: Source file does not exist: %s',
					$source
				)
			);
			return false;
		}

		// Ensure destination directory exists
		$destDir = \dirname($destination);
		if (! \file_exists($destDir)) {
			if (! \wp_mkdir_p($destDir)) {
				\error_log(
					\sprintf(
						'Altolith File Manager: Failed to create destination directory: %s',
						$destDir
					)
				);
				return false;
			}
		}

		// Check if destination path exists as a directory (copy() fails if destination is a directory).
		if (\file_exists($destination) && \is_dir($destination)) {
			// Try to remove empty directory, otherwise fail.
			if (self::isDirectoryEmpty($destination)) {
				if (!\rmdir($destination)) {
					\error_log(
						\sprintf(
							'Altolith File Manager: Failed to remove empty directory at destination path: %s',
							$destination
						)
					);
					return false;
				}
				\error_log(
					\sprintf(
						'Altolith File Manager: Removed empty directory at destination path: %s',
						$destination
					)
				);
			} else {
				// Directory is not empty, cannot proceed.
				\error_log(
					\sprintf(
						'Altolith File Manager: Destination path exists as non-empty directory: %s',
						$destination
					)
				);
				return false;
			}
		}

		$result = @\copy($source, $destination);

		if (! $result) {
			\error_log(
				\sprintf(
					'Altolith File Manager: Failed to copy file from %s to %s',
					$source,
					$destination
				)
			);
			return false;
		}

		// Verify copy succeeded
		if (! self::fileExistsAndAccessible($destination)) {
			\error_log(
				\sprintf(
					'Altolith File Manager: File copy verification failed: %s',
					$destination
				)
			);
			return false;
		}

		return true;
	}

	/**
	 * Check if a directory is empty.
	 *
	 * @param string $dir Directory path to check.
	 * @return bool True if directory is empty or doesn't exist, false otherwise.
	 */
	public static function isDirectoryEmpty(string $dir): bool
	{
		if (!\is_dir($dir)) {
			return true;
		}

		$handle = @\opendir($dir);
		if ($handle === false) {
			return false;
		}

		// Read directory entries, skipping . and ..
		while (($entry = \readdir($handle)) !== false) {
			if ($entry !== '.' && $entry !== '..') {
				\closedir($handle);
				return false;
			}
		}

		\closedir($handle);
		return true;
	}
}
