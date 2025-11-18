<?php
/**
 * Temporary Directory Manager for WordPress Playground Compatibility
 *
 * WordPress Playground runs in a WASM environment where sys_get_temp_dir()
 * may not return an accessible directory. This class provides a reliable
 * temporary directory using WordPress uploads folder.
 *
 * @package AetherSiteExporter
 */

namespace AetherSiteExporter\Utilities;

/**
 * Class TempDirectoryManager
 *
 * Manages temporary file storage compatible with WordPress Playground.
 */
class TempDirectoryManager {

	/**
	 * Get the temporary directory path
	 *
	 * Returns a WordPress-managed directory instead of system temp directory
	 * for WordPress Playground compatibility.
	 *
	 * @return string Absolute path to temp directory
	 */
	public static function getTempDirectory() {
		/**
		 * Filter the temporary directory path
		 *
		 * Allows plugins/themes to override the temp directory location.
		 * Useful for custom storage locations or testing.
		 *
		 * @since 1.0.0
		 *
		 * @param string $temp_dir Default temp directory path
		 */
		$tempDir = apply_filters(
			'aether_site_exporter_temp_directory',
			WP_CONTENT_DIR . '/uploads/aether-temp'
		);

		return $tempDir;
	}

	/**
	 * Ensure temp directory exists and is writable
	 *
	 * Creates the directory if it doesn't exist, with proper permissions.
	 *
	 * @return bool True on success, false on failure
	 */
	public static function ensureTempDirectoryExists() {
		$tempDir = self::getTempDirectory();

		// Directory already exists and is writable
		if ( file_exists( $tempDir ) && is_writable( $tempDir ) ) {
			return true;
		}

		// Attempt to create directory
		if ( ! file_exists( $tempDir ) ) {
			if ( ! wp_mkdir_p( $tempDir ) ) {
				error_log( 'Aether Site Exporter: Failed to create temp directory: ' . $tempDir );
				return false;
			}
		}

		// Verify writability
		if ( ! is_writable( $tempDir ) ) {
			error_log( 'Aether Site Exporter: Temp directory is not writable: ' . $tempDir );
			return false;
		}

		// Add .htaccess to prevent direct access
		self::addDirectoryProtection( $tempDir );

		return true;
	}

	/**
	 * Add .htaccess protection to prevent direct file access
	 *
	 * @param string $directory Directory to protect
	 * @return bool True on success, false on failure
	 */
	private static function addDirectoryProtection( $directory ) {
		$htaccessFile = $directory . '/.htaccess';

		// Already exists
		if ( file_exists( $htaccessFile ) ) {
			return true;
		}

		$htaccessContent = "# Aether Site Exporter - Deny direct access\n";
		$htaccessContent .= "Order deny,allow\n";
		$htaccessContent .= "Deny from all\n";

		$result = file_put_contents( $htaccessFile, $htaccessContent );

		if ( false === $result ) {
			error_log( 'Aether Site Exporter: Failed to create .htaccess in temp directory' );
			return false;
		}

		return true;
	}

	/**
	 * Generate a unique temporary file path
	 *
	 * Compatible replacement for wp_tempnam() using our managed temp directory.
	 *
	 * @param string $prefix File name prefix
	 * @param string $extension File extension (default: empty)
	 * @return string|false Full path to temp file, or false on failure
	 */
	public static function getTempFilePath( $prefix = 'aether-', $extension = '' ) {
		if ( ! self::ensureTempDirectoryExists() ) {
			return false;
		}

		$tempDir = self::getTempDirectory();

		// Generate unique filename
		$filename = $prefix . wp_generate_password( 12, false ) . '-' . time();

		if ( ! empty( $extension ) ) {
			// Ensure extension starts with dot
			$extension = '.' . ltrim( $extension, '.' );
			$filename .= $extension;
		}

		$fullPath = $tempDir . '/' . $filename;

		// Ensure file doesn't already exist (extremely unlikely)
		$counter = 0;
		while ( file_exists( $fullPath ) && $counter < 100 ) {
			$filename = $prefix . wp_generate_password( 12, false ) . '-' . time() . '-' . ++$counter;
			if ( ! empty( $extension ) ) {
				$filename .= $extension;
			}
			$fullPath = $tempDir . '/' . $filename;
		}

		if ( file_exists( $fullPath ) ) {
			error_log( 'Aether Site Exporter: Could not generate unique temp file path' );
			return false;
		}

		return $fullPath;
	}

	/**
	 * Clean up expired temporary files
	 *
	 * Removes files older than the specified age.
	 *
	 * @param int $max_age_seconds Maximum age in seconds (default: 24 hours)
	 * @return int Number of files deleted
	 */
	public static function cleanupExpiredFiles( $max_age_seconds = 86400 ) {
		$tempDir = self::getTempDirectory();

		if ( ! file_exists( $tempDir ) || ! is_dir( $tempDir ) ) {
			return 0;
		}

		$deletedCount = 0;
		$currentTime = time();

		try {
			$files = new \DirectoryIterator( $tempDir );

			foreach ( $files as $file ) {
				// Skip . and .. and .htaccess
				if ( $file->isDot() || $file->getFilename() === '.htaccess' ) {
					continue;
				}

				// Check file age
				$fileAge = $currentTime - $file->getMTime();

				if ( $fileAge > $max_age_seconds ) {
					$filePath = $file->getPathname();

					if ( $file->isFile() ) {
						if ( @unlink( $filePath ) ) {
							$deletedCount++;
						} else {
							error_log( 'Aether Site Exporter: Failed to delete expired temp file: ' . $filePath );
						}
					} elseif ( $file->isDir() ) {
						// Recursively delete directory
						if ( self::deleteDirectory( $filePath ) ) {
							$deletedCount++;
						}
					}
				}
			}
		} catch ( \Exception $e ) {
			error_log( 'Aether Site Exporter: Error during temp file cleanup: ' . $e->getMessage() );
		}

		return $deletedCount;
	}

	/**
	 * Recursively delete a directory and its contents
	 *
	 * @param string $directory Directory path to delete
	 * @return bool True on success, false on failure
	 */
	private static function deleteDirectory( $directory ) {
		if ( ! file_exists( $directory ) || ! is_dir( $directory ) ) {
			return false;
		}

		try {
			$files = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $directory, \RecursiveDirectoryIterator::SKIP_DOTS ),
				\RecursiveIteratorIterator::CHILD_FIRST
			);

			foreach ( $files as $file ) {
				if ( $file->isDir() ) {
					@rmdir( $file->getRealPath() );
				} else {
					@unlink( $file->getRealPath() );
				}
			}

			return @rmdir( $directory );
		} catch ( \Exception $e ) {
			error_log( 'Aether Site Exporter: Error deleting directory: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Clean up a specific temporary file
	 *
	 * @param string $filePath Full path to the file
	 * @return bool True on success, false on failure
	 */
	public static function deleteFile( $filePath ) {
		// Verify file is in our temp directory
		$tempDir = self::getTempDirectory();
		$realTempDir = realpath( $tempDir );
		$realFilePath = realpath( $filePath );

		// If realpath fails, fall back to string comparison
		if ( false === $realTempDir || false === $realFilePath ) {
			// Normalize paths for comparison
			$tempDir = wp_normalize_path( $tempDir );
			$filePath = wp_normalize_path( $filePath );

			if ( strpos( $filePath, $tempDir ) !== 0 ) {
				error_log( 'Aether Site Exporter: Attempted to delete file outside temp directory: ' . $filePath );
				return false;
			}
		} else {
			// Use realpath comparison
			if ( strpos( $realFilePath, $realTempDir ) !== 0 ) {
				error_log( 'Aether Site Exporter: Attempted to delete file outside temp directory: ' . $filePath );
				return false;
			}
		}

		// Delete file
		if ( file_exists( $filePath ) && is_file( $filePath ) ) {
			return @unlink( $filePath );
		}

		return false;
	}

	/**
	 * Get temp directory size in bytes
	 *
	 * Useful for monitoring storage usage.
	 *
	 * @return int Total size in bytes
	 */
	public static function getTempDirectorySize() {
		$tempDir = self::getTempDirectory();

		if ( ! file_exists( $tempDir ) || ! is_dir( $tempDir ) ) {
			return 0;
		}

		$totalSize = 0;

		try {
			$files = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $tempDir, \RecursiveDirectoryIterator::SKIP_DOTS )
			);

			foreach ( $files as $file ) {
				if ( $file->isFile() ) {
					$totalSize += $file->getSize();
				}
			}
		} catch ( \Exception $e ) {
			error_log( 'Aether Site Exporter: Error calculating temp directory size: ' . $e->getMessage() );
		}

		return $totalSize;
	}

	/**
	 * Check if temp directory is accessible
	 *
	 * @return bool True if accessible, false otherwise
	 */
	public static function isTempDirectoryAccessible() {
		$tempDir = self::getTempDirectory();

		// Check if we can create the directory
		if ( ! self::ensureTempDirectoryExists() ) {
			return false;
		}

		// Try to write a test file
		$testFile = $tempDir . '/test-' . wp_generate_password( 8, false ) . '.tmp';
		$testContent = 'test';

		$result = @file_put_contents( $testFile, $testContent );

		if ( false === $result ) {
			return false;
		}

		// Try to read it back
		$readContent = @file_get_contents( $testFile );

		// Clean up
		@unlink( $testFile );

		return ( $readContent === $testContent );
	}
}
