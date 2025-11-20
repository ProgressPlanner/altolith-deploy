<?php
/**
 * FileManager Tests
 *
 * Tests for file operations with persistence checks.
 * Critical for WordPress Playground compatibility.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Utilities;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Utilities\FileManager;
use Aether\SiteExporter\Utilities\TempDirectoryManager;

/**
 * FileManager test case.
 */
class FileManagerTest extends TestCase {

	/**
	 * Temp directory for test files.
	 *
	 * @var string
	 */
	private $temp_dir;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->temp_dir = TempDirectoryManager::getTempFilePath( 'filemanager-tests' );
		wp_mkdir_p( $this->temp_dir );
	}

	/**
	 * Clean up test files.
	 */
	public function tear_down() {
		// Clean up temp directory.
		if ( file_exists( $this->temp_dir ) ) {
			$this->delete_directory( $this->temp_dir );
		}

		// Clean up all tracking transients.
		FileManager::cleanupTracking();

		parent::tear_down();
	}

	// ========================================================================
	// File Existence and Accessibility Tests
	// ========================================================================

	/**
	 * Test file existence check for non-existent file.
	 */
	public function test_file_exists_and_accessible_nonexistent() {
		$path = $this->temp_dir . '/nonexistent.txt';

		$this->assertFalse( FileManager::fileExistsAndAccessible( $path ) );
	}

	/**
	 * Test file existence check for directory.
	 */
	public function test_file_exists_and_accessible_directory() {
		$this->assertFalse( FileManager::fileExistsAndAccessible( $this->temp_dir ) );
	}

	/**
	 * Test file existence check for valid file.
	 */
	public function test_file_exists_and_accessible_valid() {
		$path = $this->create_temp_test_file( 'test.txt', 'content' );

		$this->assertTrue( FileManager::fileExistsAndAccessible( $path ) );
	}

	// ========================================================================
	// File Read/Write with Retry Tests
	// ========================================================================

	/**
	 * Test writing file.
	 */
	public function test_write_file_with_retry() {
		$path    = $this->temp_dir . '/write-test.txt';
		$content = 'Test content';

		$result = FileManager::writeFileWithRetry( $path, $content );

		$this->assertTrue( $result, 'Write should succeed' );
		$this->assertFileExists( $path );
		$this->assertEquals( $content, file_get_contents( $path ) );
	}

	/**
	 * Test writing to non-existent directory creates it.
	 */
	public function test_write_creates_directory() {
		$path    = $this->temp_dir . '/subdir/file.txt';
		$content = 'content';

		$result = FileManager::writeFileWithRetry( $path, $content );

		$this->assertTrue( $result );
		$this->assertFileExists( $path );
	}

	/**
	 * Test reading file.
	 */
	public function test_read_file_with_retry() {
		$path    = $this->create_temp_test_file( 'read-test.txt', 'Test content' );

		$result = FileManager::readFileWithRetry( $path );

		$this->assertEquals( 'Test content', $result );
	}

	/**
	 * Test reading non-existent file returns false.
	 */
	public function test_read_nonexistent_file() {
		$path = $this->temp_dir . '/nonexistent.txt';

		$result = FileManager::readFileWithRetry( $path );

		$this->assertFalse( $result );
	}

	/**
	 * Test retry count is respected.
	 */
	public function test_read_respects_retry_count() {
		$path = $this->temp_dir . '/nonexistent.txt';

		// Should not hang - should fail quickly.
		$start  = microtime( true );
		$result = FileManager::readFileWithRetry( $path, 1 );
		$end    = microtime( true );

		$this->assertFalse( $result );
		// Should complete quickly (less than 1 second).
		$this->assertLessThan( 1, $end - $start );
	}

	// ========================================================================
	// File Deletion Tests
	// ========================================================================

	/**
	 * Test deleting file.
	 */
	public function test_delete_file() {
		$path = $this->create_temp_test_file( 'delete-test.txt', 'content' );

		$result = FileManager::deleteFile( $path );

		$this->assertTrue( $result );
		$this->assertFileDoesNotExist( $path );
	}

	/**
	 * Test deleting non-existent file returns true.
	 */
	public function test_delete_nonexistent_file() {
		$path = $this->temp_dir . '/nonexistent.txt';

		$result = FileManager::deleteFile( $path );

		$this->assertTrue( $result, 'Deleting non-existent file should return true' );
	}

	/**
	 * Test deleting directory fails.
	 */
	public function test_delete_directory_fails() {
		$dir = $this->temp_dir . '/test-dir';
		wp_mkdir_p( $dir );

		$result = FileManager::deleteFile( $dir );

		$this->assertFalse( $result, 'Should not delete directories' );
	}

	// ========================================================================
	// File Copy Tests
	// ========================================================================

	/**
	 * Test copying file.
	 */
	public function test_copy_file() {
		$source = $this->create_temp_test_file( 'source.txt', 'source content' );
		$dest   = $this->temp_dir . '/destination.txt';

		$result = FileManager::copyFile( $source, $dest );

		$this->assertTrue( $result );
		$this->assertFileExists( $dest );
		$this->assertEquals( 'source content', file_get_contents( $dest ) );
	}

	/**
	 * Test copying creates destination directory.
	 */
	public function test_copy_creates_directory() {
		$source = $this->create_temp_test_file( 'source.txt', 'content' );
		$dest   = $this->temp_dir . '/subdir/destination.txt';

		$result = FileManager::copyFile( $source, $dest );

		$this->assertTrue( $result );
		$this->assertFileExists( $dest );
	}

	/**
	 * Test copying non-existent file fails.
	 */
	public function test_copy_nonexistent_source() {
		$source = $this->temp_dir . '/nonexistent.txt';
		$dest   = $this->temp_dir . '/destination.txt';

		$result = FileManager::copyFile( $source, $dest );

		$this->assertFalse( $result );
		$this->assertFileDoesNotExist( $dest );
	}

	// ========================================================================
	// File Metadata Tests
	// ========================================================================

	/**
	 * Test getting file metadata.
	 */
	public function test_get_file_metadata() {
		$path = $this->create_temp_test_file( 'metadata-test.txt', 'test content' );

		$metadata = FileManager::getFileMetadata( $path );

		$this->assertIsArray( $metadata );
		$this->assertArrayHasKey( 'size', $metadata );
		$this->assertArrayHasKey( 'mtime', $metadata );
		$this->assertArrayHasKey( 'age', $metadata );
		$this->assertArrayHasKey( 'path', $metadata );

		$this->assertEquals( 12, $metadata['size'], 'Size should match content length' );
		$this->assertEquals( $path, $metadata['path'] );
	}

	/**
	 * Test getting metadata for non-existent file.
	 */
	public function test_get_metadata_nonexistent() {
		$path = $this->temp_dir . '/nonexistent.txt';

		$metadata = FileManager::getFileMetadata( $path );

		$this->assertFalse( $metadata );
	}

	// ========================================================================
	// File Staleness Tests
	// ========================================================================

	/**
	 * Test checking if file is stale.
	 */
	public function test_is_file_stale() {
		$path = $this->create_temp_test_file( 'stale-test.txt', 'content' );

		// Fresh file should not be stale.
		$this->assertFalse( FileManager::isFileStale( $path, 86400 ) );

		// Check with very short max age.
		sleep( 1 );
		$this->assertTrue( FileManager::isFileStale( $path, 0 ) );
	}

	/**
	 * Test stale check on non-existent file returns false.
	 */
	public function test_is_file_stale_nonexistent() {
		$path = $this->temp_dir . '/nonexistent.txt';

		$this->assertFalse( FileManager::isFileStale( $path ) );
	}

	// ========================================================================
	// File Tracking Tests
	// ========================================================================

	/**
	 * Test tracking a file.
	 */
	public function test_track_file() {
		$path = $this->create_temp_test_file( 'tracked.txt', 'content' );

		$result = FileManager::trackFile( $path, 'export', [ 'test' => true ] );

		$this->assertTrue( $result, 'Tracking should succeed' );

		$tracked = FileManager::getTrackedFile( $path );
		$this->assertIsArray( $tracked );
		$this->assertEquals( $path, $tracked['path'] );
		$this->assertEquals( 'export', $tracked['type'] );
		$this->assertTrue( $tracked['exists'] );
		$this->assertTrue( $tracked['metadata']['test'] );
	}

	/**
	 * Test getting untracked file returns false.
	 */
	public function test_get_untracked_file() {
		$path = $this->create_temp_test_file( 'untracked.txt', 'content' );

		$tracked = FileManager::getTrackedFile( $path );

		$this->assertFalse( $tracked );
	}

	/**
	 * Test untracking a file.
	 */
	public function test_untrack_file() {
		$path = $this->create_temp_test_file( 'to-untrack.txt', 'content' );

		FileManager::trackFile( $path, 'export' );
		$result = FileManager::untrackFile( $path );

		$this->assertTrue( $result );
		$this->assertFalse( FileManager::getTrackedFile( $path ) );
	}

	// ========================================================================
	// File Persistence Verification Tests
	// ========================================================================

	/**
	 * Test verifying persistence of tracked file that exists.
	 */
	public function test_verify_file_persistence_exists() {
		$path = $this->create_temp_test_file( 'persisted.txt', 'content' );

		FileManager::trackFile( $path, 'export' );

		$status = FileManager::verifyFilePersistence( $path );

		$this->assertTrue( $status['tracked'] );
		$this->assertTrue( $status['exists'] );
		$this->assertTrue( $status['existed_before'] );
		$this->assertTrue( $status['persisted'] );
		$this->assertEquals( 'export', $status['type'] );
	}

	/**
	 * Test verifying persistence of untracked file.
	 */
	public function test_verify_file_persistence_untracked() {
		$path = $this->create_temp_test_file( 'untracked-persist.txt', 'content' );

		$status = FileManager::verifyFilePersistence( $path );

		$this->assertFalse( $status['tracked'] );
		$this->assertTrue( $status['exists'] );
		$this->assertNull( $status['persisted'] );
	}

	/**
	 * Test verifying persistence detects disappeared file.
	 */
	public function test_verify_file_persistence_disappeared() {
		$path = $this->create_temp_test_file( 'will-disappear.txt', 'content' );

		// Track while it exists.
		FileManager::trackFile( $path, 'export' );

		// Delete file.
		unlink( $path );

		// Verify should detect disappearance.
		$status = FileManager::verifyFilePersistence( $path );

		$this->assertTrue( $status['tracked'] );
		$this->assertFalse( $status['exists'] );
		$this->assertTrue( $status['existed_before'] );
		$this->assertFalse( $status['persisted'], 'Should detect file disappeared' );
	}

	// ========================================================================
	// Cleanup Tests
	// ========================================================================

	/**
	 * Test cleanup removes tracking for deleted files.
	 */
	public function test_cleanup_tracking() {
		$path1 = $this->create_temp_test_file( 'cleanup1.txt', 'content' );
		$path2 = $this->create_temp_test_file( 'cleanup2.txt', 'content' );

		FileManager::trackFile( $path1, 'export' );
		FileManager::trackFile( $path2, 'export' );

		// Delete one file.
		unlink( $path1 );

		// Run cleanup.
		$cleaned = FileManager::cleanupTracking();

		// Should clean up at least the deleted file's tracking.
		$this->assertGreaterThanOrEqual( 1, $cleaned );

		// path1 should no longer be tracked.
		$this->assertFalse( FileManager::getTrackedFile( $path1 ) );

		// path2 should still be tracked.
		$this->assertIsArray( FileManager::getTrackedFile( $path2 ) );
	}

	// ========================================================================
	// Warning Message Tests
	// ========================================================================

	/**
	 * Test ephemeral storage warning messages.
	 */
	public function test_ephemeral_storage_warning() {
		$export_msg = FileManager::getEphemeralStorageWarning( 'export' );
		$upload_msg = FileManager::getEphemeralStorageWarning( 'upload' );
		$temp_msg   = FileManager::getEphemeralStorageWarning( 'temp' );
		$default_msg = FileManager::getEphemeralStorageWarning( 'unknown_context' );

		$this->assertIsString( $export_msg );
		$this->assertStringContainsString( 'Export', $export_msg );

		$this->assertIsString( $upload_msg );
		$this->assertStringContainsString( 'Uploaded', $upload_msg );

		$this->assertIsString( $temp_msg );
		$this->assertStringContainsString( 'Temporary', $temp_msg );

		$this->assertIsString( $default_msg );
	}

	// ========================================================================
	// Helper Methods
	// ========================================================================

	/**
	 * Create a file in temp directory for testing.
	 *
	 * @param string $filename Filename.
	 * @param string $content  File content.
	 * @return string Full path to created file.
	 */
	private function create_temp_test_file( $filename, $content ) {
		$path = $this->temp_dir . '/' . $filename;
		file_put_contents( $path, $content );
		return $path;
	}

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
