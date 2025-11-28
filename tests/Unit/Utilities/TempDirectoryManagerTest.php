<?php
/**
 * TempDirectoryManager Tests
 *
 * Tests for WordPress Playground-compatible temporary directory management.
 * Critical for universal compatibility across hosting environments.
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Unit\Utilities;

use Altolith\Deploy\Tests\Helpers\TestCase;
use Altolith\Deploy\Utilities\TempDirectoryManager;

/**
 * TempDirectoryManager test case.
 */
class TempDirectoryManagerTest extends TestCase {

	/**
	 * Custom temp directory for testing filters.
	 *
	 * @var string
	 */
	private $custom_temp_dir;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->custom_temp_dir = WP_CONTENT_DIR . '/uploads/test-altolith-temp';
	}

	/**
	 * Clean up test files.
	 */
	public function tear_down() {
		// Clean up custom temp directory if it exists.
		if ( file_exists( $this->custom_temp_dir ) ) {
			$this->delete_directory( $this->custom_temp_dir );
		}

		// Clean up main temp directory files created during tests.
		$temp_dir = TempDirectoryManager::getTempDirectory();
		if ( file_exists( $temp_dir ) ) {
			TempDirectoryManager::cleanupExpiredFiles( 0 ); // Delete all files.
		}

		parent::tear_down();
	}

	// ========================================================================
	// Temp Directory Path Tests
	// ========================================================================

	/**
	 * Test getting temp directory returns expected path.
	 */
	public function test_get_temp_directory() {
		$temp_dir = TempDirectoryManager::getTempDirectory();

		$this->assertIsString( $temp_dir );
		$this->assertStringContainsString( 'altolith-temp', $temp_dir );
		$this->assertStringContainsString( WP_CONTENT_DIR, $temp_dir );
	}

	/**
	 * Test temp directory filter allows customization.
	 */
	public function test_temp_directory_filter() {
		add_filter(
			'altolith_deploy_temp_directory',
			function ( $dir ) {
				return $this->custom_temp_dir;
			}
		);

		$temp_dir = TempDirectoryManager::getTempDirectory();

		$this->assertEquals( $this->custom_temp_dir, $temp_dir );
	}

	// ========================================================================
	// Directory Creation Tests
	// ========================================================================

	/**
	 * Test ensuring temp directory exists creates it.
	 */
	public function test_ensure_temp_directory_exists() {
		$temp_dir = TempDirectoryManager::getTempDirectory();

		// Remove directory if it exists.
		if ( file_exists( $temp_dir ) ) {
			$this->delete_directory( $temp_dir );
		}

		$result = TempDirectoryManager::ensureTempDirectoryExists();

		$this->assertTrue( $result, 'Should create temp directory' );
		$this->assertDirectoryExists( $temp_dir );
		$this->assertTrue( is_writable( $temp_dir ) );
	}

	/**
	 * Test directory protection (.htaccess) is added.
	 */
	public function test_directory_protection_added() {
		$temp_dir = TempDirectoryManager::getTempDirectory();
		TempDirectoryManager::ensureTempDirectoryExists();

		$htaccess = $temp_dir . '/.htaccess';

		$this->assertFileExists( $htaccess );

		$content = file_get_contents( $htaccess );
		$this->assertStringContainsString( 'Deny from all', $content );
	}

	/**
	 * Test ensuring already-existing directory returns true.
	 */
	public function test_ensure_existing_directory() {
		// Ensure it exists first.
		TempDirectoryManager::ensureTempDirectoryExists();

		// Call again - should return true immediately.
		$result = TempDirectoryManager::ensureTempDirectoryExists();

		$this->assertTrue( $result );
	}

	// ========================================================================
	// Temp File Path Generation Tests
	// ========================================================================

	/**
	 * Test generating temp file path.
	 */
	public function test_get_temp_file_path() {
		$path = TempDirectoryManager::getTempFilePath( 'test-' );

		$this->assertIsString( $path );
		$this->assertStringContainsString( 'test-', $path );

		$temp_dir = TempDirectoryManager::getTempDirectory();
		$this->assertStringStartsWith( $temp_dir, $path );
	}

	/**
	 * Test temp file path with extension.
	 */
	public function test_get_temp_file_path_with_extension() {
		$path = TempDirectoryManager::getTempFilePath( 'file-', 'txt' );

		$this->assertStringEndsWith( '.txt', $path );
	}

	/**
	 * Test temp file path with extension starting with dot.
	 */
	public function test_get_temp_file_path_with_dot_extension() {
		$path = TempDirectoryManager::getTempFilePath( 'file-', '.zip' );

		$this->assertStringEndsWith( '.zip', $path );
	}

	/**
	 * Test generated paths are unique.
	 */
	public function test_temp_file_paths_are_unique() {
		$path1 = TempDirectoryManager::getTempFilePath( 'unique-' );
		$path2 = TempDirectoryManager::getTempFilePath( 'unique-' );

		$this->assertNotEquals( $path1, $path2, 'Generated paths should be unique' );
	}

	/**
	 * Test temp file path doesn't overwrite existing file.
	 */
	public function test_temp_file_path_avoids_collision() {
		// This is hard to test reliably, but we can verify the function
		// checks for existing files by creating a file and verifying
		// the next generated path is different.

		$path1 = TempDirectoryManager::getTempFilePath( 'collision-' );

		// Create the file.
		touch( $path1 );

		$path2 = TempDirectoryManager::getTempFilePath( 'collision-' );

		$this->assertNotEquals( $path1, $path2 );

		// Clean up.
		unlink( $path1 );
	}

	// ========================================================================
	// File Cleanup Tests
	// ========================================================================

	/**
	 * Test cleaning up expired files.
	 */
	public function test_cleanup_expired_files() {
		$temp_dir = TempDirectoryManager::getTempDirectory();
		TempDirectoryManager::ensureTempDirectoryExists();

		// Create old file (set mtime to past).
		$old_file = $temp_dir . '/old-file.txt';
		file_put_contents( $old_file, 'old content' );
		touch( $old_file, time() - 90000 ); // 25 hours ago.

		// Create recent file.
		$recent_file = $temp_dir . '/recent-file.txt';
		file_put_contents( $recent_file, 'recent content' );

		// Clean up files older than 24 hours.
		$deleted = TempDirectoryManager::cleanupExpiredFiles( 86400 );

		$this->assertGreaterThanOrEqual( 1, $deleted, 'Should delete at least 1 old file' );
		$this->assertFileDoesNotExist( $old_file );
		$this->assertFileExists( $recent_file );

		// Clean up.
		unlink( $recent_file );
	}

	/**
	 * Test .htaccess is not deleted during cleanup.
	 */
	public function test_cleanup_preserves_htaccess() {
		$temp_dir = TempDirectoryManager::getTempDirectory();
		TempDirectoryManager::ensureTempDirectoryExists();

		$htaccess = $temp_dir . '/.htaccess';

		// Set htaccess to old date.
		touch( $htaccess, time() - 90000 );

		// Clean up expired files.
		TempDirectoryManager::cleanupExpiredFiles( 0 );

		// .htaccess should still exist.
		$this->assertFileExists( $htaccess );
	}

	/**
	 * Test cleanup handles empty directory.
	 */
	public function test_cleanup_empty_directory() {
		$temp_dir = TempDirectoryManager::getTempDirectory();
		TempDirectoryManager::ensureTempDirectoryExists();

		// Clean up all files.
		TempDirectoryManager::cleanupExpiredFiles( 0 );

		$deleted = TempDirectoryManager::cleanupExpiredFiles( 0 );

		$this->assertEquals( 0, $deleted, 'Should return 0 when no files to delete' );
	}

	/**
	 * Test cleanup handles nested directories.
	 */
	public function test_cleanup_nested_directories() {
		$temp_dir = TempDirectoryManager::getTempDirectory();
		TempDirectoryManager::ensureTempDirectoryExists();

		// Create nested directory with old file.
		$nested_dir = $temp_dir . '/nested';
		wp_mkdir_p( $nested_dir );
		$nested_file = $nested_dir . '/old-nested-file.txt';
		file_put_contents( $nested_file, 'content' );
		touch( $nested_file, time() - 90000 );

		// Set directory mtime to old as well.
		touch( $nested_dir, time() - 90000 );

		$deleted = TempDirectoryManager::cleanupExpiredFiles( 86400 );

		$this->assertGreaterThanOrEqual( 1, $deleted );
		$this->assertDirectoryDoesNotExist( $nested_dir );
	}

	// ========================================================================
	// File Deletion Tests
	// ========================================================================

	/**
	 * Test deleting file in temp directory.
	 */
	public function test_delete_file() {
		$path = TempDirectoryManager::getTempFilePath( 'delete-test-' );
		file_put_contents( $path, 'content' );

		$result = TempDirectoryManager::deleteFile( $path );

		$this->assertTrue( $result );
		$this->assertFileDoesNotExist( $path );
	}

	/**
	 * Test deleting file outside temp directory is rejected.
	 */
	public function test_delete_file_outside_temp_dir() {
		// Try to delete a file outside temp directory.
		$outside_file = WP_CONTENT_DIR . '/outside-temp.txt';
		file_put_contents( $outside_file, 'content' );

		$result = TempDirectoryManager::deleteFile( $outside_file );

		$this->assertFalse( $result, 'Should reject deleting files outside temp directory' );

		// Clean up.
		unlink( $outside_file );
	}

	/**
	 * Test deleting non-existent file returns false.
	 */
	public function test_delete_nonexistent_file() {
		$temp_dir = TempDirectoryManager::getTempDirectory();
		$path     = $temp_dir . '/nonexistent.txt';

		$result = TempDirectoryManager::deleteFile( $path );

		$this->assertFalse( $result );
	}

	// ========================================================================
	// Directory Size Tests
	// ========================================================================

	/**
	 * Test getting temp directory size.
	 */
	public function test_get_temp_directory_size() {
		$temp_dir = TempDirectoryManager::getTempDirectory();
		TempDirectoryManager::ensureTempDirectoryExists();

		// Clear temp directory.
		TempDirectoryManager::cleanupExpiredFiles( 0 );

		// Create files with known sizes.
		$file1 = $temp_dir . '/file1.txt';
		$file2 = $temp_dir . '/file2.txt';
		file_put_contents( $file1, 'test' );        // 4 bytes.
		file_put_contents( $file2, 'testing123' );  // 10 bytes.

		$size = TempDirectoryManager::getTempDirectorySize();

		// Should include both files plus .htaccess (size varies).
		$this->assertGreaterThanOrEqual( 14, $size );

		// Clean up.
		unlink( $file1 );
		unlink( $file2 );
	}

	/**
	 * Test size calculation for non-existent directory.
	 */
	public function test_get_size_nonexistent_directory() {
		// Use filter to point to non-existent directory.
		add_filter(
			'altolith_deploy_temp_directory',
			function () {
				return WP_CONTENT_DIR . '/nonexistent-dir';
			}
		);

		$size = TempDirectoryManager::getTempDirectorySize();

		$this->assertEquals( 0, $size );
	}

	// ========================================================================
	// Accessibility Tests
	// ========================================================================

	/**
	 * Test checking if temp directory is accessible.
	 */
	public function test_is_temp_directory_accessible() {
		$accessible = TempDirectoryManager::isTempDirectoryAccessible();

		$this->assertTrue( $accessible, 'Temp directory should be accessible' );
	}

	// ========================================================================
	// Helper Methods
	// ========================================================================

	/**
	 * Recursively delete a directory.
	 *
	 * @param string $dir Directory path.
	 */
	private function delete_directory( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		$files = array_diff( scandir( $dir ), [ '.', '..' ] );
		foreach ( $files as $file ) {
			$path = $dir . '/' . $file;
			is_dir( $path ) ? $this->delete_directory( $path ) : unlink( $path );
		}
		rmdir( $dir );
	}
}
