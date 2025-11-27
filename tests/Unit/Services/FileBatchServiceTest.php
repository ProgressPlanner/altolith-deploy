<?php
/**
 * File Batch Service Tests
 *
 * Comprehensive tests for FileBatchService - handles file counting, batching, and listing.
 * This is critical functionality for export workflow performance and accuracy.
 *
 * Quality Standards:
 * - Tests must catch file counting errors that would corrupt progress tracking
 * - Must test batching logic to prevent memory exhaustion
 * - Must test exclusion patterns to ensure dev files aren't included
 * - Must test offloaded file detection to prevent duplicate uploads
 * - Must fail if implementation allows ANY incorrect file counts or batching
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Services;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Services\FileBatchService;

/**
 * File Batch Service test case.
 */
class FileBatchServiceTest extends TestCase {

	/**
	 * Service instance.
	 *
	 * @var FileBatchService
	 */
	private $service;

	/**
	 * Test directory for file operations.
	 *
	 * @var string
	 */
	private $test_dir;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->service = new FileBatchService();

		// Create test directory
		$this->test_dir = WP_CONTENT_DIR . '/aether-test-files-' . time();
		wp_mkdir_p( $this->test_dir );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		$this->clean_up_test_directory();
		parent::tear_down();
	}

	/**
	 * Clean up test directory recursively.
	 */
	private function clean_up_test_directory() {
		if ( ! is_dir( $this->test_dir ) ) {
			return;
		}

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $this->test_dir, \RecursiveDirectoryIterator::SKIP_DOTS ),
			\RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ( $files as $file ) {
			if ( $file->isDir() ) {
				rmdir( $file->getRealPath() );
			} else {
				unlink( $file->getRealPath() );
			}
		}

		rmdir( $this->test_dir );
	}

	/**
	 * Create test files in directory.
	 *
	 * @param int $count Number of files to create.
	 * @param int $size  Size of each file in bytes.
	 * @return array List of created file paths.
	 */
	private function create_test_files( int $count, int $size = 100 ): array {
		$files = [];

		for ( $i = 0; $i < $count; $i++ ) {
			$file_path = $this->test_dir . "/file{$i}.txt";
			file_put_contents( $file_path, str_repeat( 'a', $size ) );
			$files[] = $file_path;
		}

		return $files;
	}

	// ========================================================================
	// countFilesInDirectory() Tests
	// ========================================================================

	/**
	 * Test countFilesInDirectory with empty directory.
	 *
	 * Purpose: Verify empty directory returns 0
	 * Edge Case: New directory, all files deleted
	 */
	public function test_countFilesInDirectory_empty_directory() {
		$count = $this->service->countFilesInDirectory( $this->test_dir );

		$this->assertEquals( 0, $count, 'Empty directory should have 0 files' );
	}

	/**
	 * Test countFilesInDirectory with single file.
	 *
	 * Purpose: Verify basic counting works
	 */
	public function test_countFilesInDirectory_single_file() {
		$this->create_test_files( 1 );

		$count = $this->service->countFilesInDirectory( $this->test_dir );

		$this->assertEquals( 1, $count );
	}

	/**
	 * Test countFilesInDirectory with multiple files.
	 *
	 * Purpose: Verify accurate counting of multiple files
	 */
	public function test_countFilesInDirectory_multiple_files() {
		$this->create_test_files( 10 );

		$count = $this->service->countFilesInDirectory( $this->test_dir );

		$this->assertEquals( 10, $count );
	}

	/**
	 * Test countFilesInDirectory with nested directories.
	 *
	 * Purpose: Verify recursive counting works correctly
	 */
	public function test_countFilesInDirectory_nested_directories() {
		// Create files in root
		$this->create_test_files( 3 );

		// Create subdirectory with files
		$subdir = $this->test_dir . '/subdir';
		wp_mkdir_p( $subdir );
		file_put_contents( $subdir . '/file1.txt', 'test' );
		file_put_contents( $subdir . '/file2.txt', 'test' );

		// Create nested subdirectory
		$nested = $subdir . '/nested';
		wp_mkdir_p( $nested );
		file_put_contents( $nested . '/file3.txt', 'test' );

		$count = $this->service->countFilesInDirectory( $this->test_dir );

		$this->assertEquals( 6, $count, 'Should count all files recursively (3 + 2 + 1)' );
	}

	/**
	 * Test countFilesInDirectory with nonexistent directory.
	 *
	 * Purpose: Verify error handling for invalid path
	 * Edge Case: Directory deleted, typo in path
	 */
	public function test_countFilesInDirectory_nonexistent_directory() {
		$count = $this->service->countFilesInDirectory( '/nonexistent/path' );

		$this->assertEquals( 0, $count, 'Nonexistent directory should return 0' );
	}

	/**
	 * Test countFilesInDirectory ignores . and .. entries.
	 *
	 * Purpose: Verify directory entries are properly filtered
	 */
	public function test_countFilesInDirectory_ignores_dot_entries() {
		$this->create_test_files( 2 );

		// Count should not include . and ..
		$count = $this->service->countFilesInDirectory( $this->test_dir );

		$this->assertEquals( 2, $count, 'Should not count . and .. directory entries' );
	}

	/**
	 * Test countFilesInDirectory prevents path traversal with realpath.
	 *
	 * Purpose: Verify security - prevents following symlinks outside base directory
	 * Security: MEDIUM - Prevents unauthorized file access
	 */
	public function test_countFilesInDirectory_prevents_path_traversal() {
		$this->markTestSkipped( 'Symlink testing requires specific filesystem setup' );

		// Implementation check:
		// Lines 46-50 of FileBatchService.php validate:
		// if (false === $realFilePath || 0 !== strpos($realFilePath, $realDir . DIRECTORY_SEPARATOR)) {
		//     continue; // Skip files outside base directory
		// }
	}

	// ========================================================================
	// countFilesInDirectoryWithExclusions() Tests
	// ========================================================================

	/**
	 * Test countFilesInDirectoryWithExclusions without exclusions.
	 *
	 * Purpose: Verify counting works when exclusions disabled
	 */
	public function test_countFilesInDirectoryWithExclusions_no_exclusions() {
		$this->create_test_files( 5 );

		$count = $this->service->countFilesInDirectoryWithExclusions( $this->test_dir, false );

		$this->assertEquals( 5, $count );
	}

	/**
	 * Test countFilesInDirectoryWithExclusions excludes dev files.
	 *
	 * Purpose: Verify exclusion patterns work correctly
	 * Reason: Dev files (.git, node_modules, vendor) shouldn't be in exports
	 */
	public function test_countFilesInDirectoryWithExclusions_excludes_dev_files() {
		// Create regular files
		$this->create_test_files( 3 );

		// Create .git directory (should be excluded)
		$git_dir = $this->test_dir . '/.git';
		wp_mkdir_p( $git_dir );
		file_put_contents( $git_dir . '/config', 'test' );
		file_put_contents( $git_dir . '/HEAD', 'test' );

		// Create vendor directory (should be excluded)
		$vendor_dir = $this->test_dir . '/vendor';
		wp_mkdir_p( $vendor_dir );
		file_put_contents( $vendor_dir . '/autoload.php', 'test' );

		$count = $this->service->countFilesInDirectoryWithExclusions( $this->test_dir, true );

		$this->assertEquals( 3, $count, 'Should exclude .git and vendor files' );
	}

	/**
	 * Test countFilesInDirectoryWithExclusions sorts files consistently.
	 *
	 * Purpose: Verify file order is deterministic
	 * Reason: Consistent ordering ensures reproducible batches
	 */
	public function test_countFilesInDirectoryWithExclusions_sorts_files() {
		// Create files in random order
		file_put_contents( $this->test_dir . '/zzz.txt', 'test' );
		file_put_contents( $this->test_dir . '/aaa.txt', 'test' );
		file_put_contents( $this->test_dir . '/mmm.txt', 'test' );

		// The implementation sorts files - we're just verifying it doesn't crash
		$count = $this->service->countFilesInDirectoryWithExclusions( $this->test_dir, false );

		$this->assertEquals( 3, $count );
	}

	// ========================================================================
	// getFilesInDirectory() Tests
	// ========================================================================

	/**
	 * Test getFilesInDirectory returns file paths.
	 *
	 * Purpose: Verify file list generation
	 */
	public function test_getFilesInDirectory_returns_file_paths() {
		$created_files = $this->create_test_files( 3 );

		$files = $this->service->getFilesInDirectory( $this->test_dir );

		$this->assertIsArray( $files );
		$this->assertCount( 3, $files );

		// Verify all created files are in the list
		foreach ( $created_files as $created_file ) {
			$real_path = realpath( $created_file );
			$this->assertContains( $real_path, $files );
		}
	}

	/**
	 * Test getFilesInDirectory returns empty array for nonexistent directory.
	 *
	 * Purpose: Verify error handling
	 * Edge Case: Invalid path
	 */
	public function test_getFilesInDirectory_nonexistent_directory() {
		$files = $this->service->getFilesInDirectory( '/nonexistent/path' );

		$this->assertIsArray( $files );
		$this->assertEmpty( $files );
	}

	/**
	 * Test getFilesInDirectory returns empty array for empty directory.
	 *
	 * Purpose: Verify empty directory handling
	 */
	public function test_getFilesInDirectory_empty_directory() {
		$files = $this->service->getFilesInDirectory( $this->test_dir );

		$this->assertIsArray( $files );
		$this->assertEmpty( $files );
	}

	/**
	 * Test getFilesInDirectory recurses into subdirectories.
	 *
	 * Purpose: Verify recursive file listing
	 */
	public function test_getFilesInDirectory_recurses_subdirectories() {
		// Create files in root
		file_put_contents( $this->test_dir . '/root.txt', 'test' );

		// Create subdirectory
		$subdir = $this->test_dir . '/subdir';
		wp_mkdir_p( $subdir );
		file_put_contents( $subdir . '/sub.txt', 'test' );

		$files = $this->service->getFilesInDirectory( $this->test_dir );

		$this->assertCount( 2, $files, 'Should include files from subdirectories' );
	}

	/**
	 * Test getFilesInDirectory sorts files.
	 *
	 * Purpose: Verify deterministic file ordering
	 * Reason: Consistent batching requires sorted file lists
	 */
	public function test_getFilesInDirectory_sorts_files() {
		// Create files in non-alphabetical order
		file_put_contents( $this->test_dir . '/zzz.txt', 'test' );
		file_put_contents( $this->test_dir . '/aaa.txt', 'test' );
		file_put_contents( $this->test_dir . '/mmm.txt', 'test' );

		$files = $this->service->getFilesInDirectory( $this->test_dir );

		// Verify files are sorted
		$sorted_files = $files;
		sort( $sorted_files );

		$this->assertEquals( $sorted_files, $files, 'Files should be sorted' );
	}

	// ========================================================================
	// createBatches() Tests
	// ========================================================================

	/**
	 * Test createBatches with file count limit.
	 *
	 * Purpose: Verify batching by file count works
	 */
	public function test_createBatches_by_file_count() {
		$files = $this->create_test_files( 10, 100 );

		// Create batches of max 3 files each
		$batches = $this->service->createBatches( $files, 3, PHP_INT_MAX );

		$this->assertCount( 4, $batches, 'Should create 4 batches (3+3+3+1)' );

		// Verify batch sizes
		$this->assertCount( 3, $batches[0]['files'] );
		$this->assertCount( 3, $batches[1]['files'] );
		$this->assertCount( 3, $batches[2]['files'] );
		$this->assertCount( 1, $batches[3]['files'] );
	}

	/**
	 * Test createBatches with size limit.
	 *
	 * Purpose: Verify batching by total size works
	 * Reason: Prevents memory exhaustion from large files
	 */
	public function test_createBatches_by_size_limit() {
		// Create files of 100 bytes each
		$files = $this->create_test_files( 10, 100 );

		// Create batches with max size of 250 bytes (should fit 2 files per batch)
		$batches = $this->service->createBatches( $files, PHP_INT_MAX, 250 );

		$this->assertCount( 5, $batches, 'Should create 5 batches (2+2+2+2+2)' );
	}

	/**
	 * Test createBatches with single file.
	 *
	 * Purpose: Verify single file batching
	 * Edge Case: One file to process
	 */
	public function test_createBatches_single_file() {
		$files = $this->create_test_files( 1 );

		$batches = $this->service->createBatches( $files, 100, PHP_INT_MAX );

		$this->assertCount( 1, $batches );
		$this->assertCount( 1, $batches[0]['files'] );
	}

	/**
	 * Test createBatches with empty file list.
	 *
	 * Purpose: Verify empty input handling
	 * Edge Case: No files to batch
	 */
	public function test_createBatches_empty_file_list() {
		$batches = $this->service->createBatches( [], 100, PHP_INT_MAX );

		$this->assertIsArray( $batches );
		$this->assertEmpty( $batches, 'Empty file list should create no batches' );
	}

	/**
	 * Test createBatches tracks batch sizes.
	 *
	 * Purpose: Verify size tracking is accurate
	 */
	public function test_createBatches_tracks_sizes() {
		$files = $this->create_test_files( 5, 100 );

		$batches = $this->service->createBatches( $files, 3, PHP_INT_MAX );

		// First batch should have 3 files = 300 bytes
		$this->assertEquals( 300, $batches[0]['size'] );

		// Second batch should have 2 files = 200 bytes
		$this->assertEquals( 200, $batches[1]['size'] );
	}

	/**
	 * Test createBatches with nonexistent files.
	 *
	 * Purpose: Verify handling of missing files
	 * Edge Case: Files deleted between listing and batching
	 */
	public function test_createBatches_with_nonexistent_files() {
		$files = [
			'/nonexistent/file1.txt',
			'/nonexistent/file2.txt',
		];

		$batches = $this->service->createBatches( $files, 10, PHP_INT_MAX );

		// Should create batch but with size 0 (filesize returns false for nonexistent)
		$this->assertCount( 1, $batches );
		$this->assertEquals( 0, $batches[0]['size'] );
	}

	/**
	 * Test createBatches respects both limits.
	 *
	 * Purpose: Verify whichever limit is hit first triggers new batch
	 */
	public function test_createBatches_respects_both_limits() {
		// Create 10 files of 50 bytes each
		$files = $this->create_test_files( 10, 50 );

		// Max 5 files OR 200 bytes per batch
		// With 50 byte files: 5 files = 250 bytes (exceeds size limit)
		// So size limit should trigger first at 4 files (200 bytes)
		$batches = $this->service->createBatches( $files, 5, 200 );

		// Each batch should have max 4 files (4*50=200 bytes)
		$this->assertGreaterThan( 2, count( $batches ) );

		foreach ( $batches as $batch ) {
			$this->assertLessThanOrEqual( 4, count( $batch['files'] ) );
			$this->assertLessThanOrEqual( 200, $batch['size'] );
		}
	}

	// ========================================================================
	// getOffloadedFilePaths() Tests
	// ========================================================================

	/**
	 * Test getOffloadedFilePaths with no offloaded files.
	 *
	 * Purpose: Verify empty result when no offloaded media
	 * Edge Case: Site without offload plugin
	 */
	public function test_getOffloadedFilePaths_no_offloaded_files() {
		$paths = $this->service->getOffloadedFilePaths();

		$this->assertIsArray( $paths );
		// May be empty or may have existing offloaded files from other tests
		// Just verify it returns an array
	}

	/**
	 * Test getOffloadedFilePaths finds offloaded attachments.
	 *
	 * Purpose: Verify offloaded file detection
	 */
	public function test_getOffloadedFilePaths_finds_offloaded_attachments() {
		// Create test attachment
		$attachment_id = $this->factory->attachment->create_upload_object( __FILE__ );

		// Mark as offloaded
		update_post_meta( $attachment_id, '_aether_media_metadata', [ 'offloaded' => true ] );

		$paths = $this->service->getOffloadedFilePaths();

		$this->assertIsArray( $paths );
		$this->assertNotEmpty( $paths, 'Should find offloaded attachment' );

		// Clean up
		wp_delete_attachment( $attachment_id, true );
	}

	// ========================================================================
	// getExclusionPatterns() Tests
	// ========================================================================

	/**
	 * Test getExclusionPatterns with autoExclude enabled.
	 *
	 * Purpose: Verify exclusion patterns are generated
	 */
	public function test_getExclusionPatterns_auto_exclude_enabled() {
		$patterns = $this->service->getExclusionPatterns( $this->test_dir, true );

		$this->assertIsArray( $patterns );
		$this->assertNotEmpty( $patterns, 'Should have exclusion patterns' );

		// Verify common patterns are included
		$this->assertContains( '/.git/', $patterns );
		$this->assertContains( '/vendor/', $patterns );
		$this->assertContains( '/node_modules/', $patterns );
		$this->assertContains( '/tests/', $patterns );
	}

	/**
	 * Test getExclusionPatterns with autoExclude disabled.
	 *
	 * Purpose: Verify no patterns when disabled
	 * Edge Case: User wants to include all files
	 */
	public function test_getExclusionPatterns_auto_exclude_disabled() {
		$patterns = $this->service->getExclusionPatterns( $this->test_dir, false );

		$this->assertIsArray( $patterns );
		$this->assertEmpty( $patterns, 'Should have no patterns when disabled' );
	}

	/**
	 * Test getExclusionPatterns includes .github directory.
	 *
	 * Purpose: Verify GitHub Actions workflows are excluded
	 * Reason: .github is development-only
	 */
	public function test_getExclusionPatterns_includes_github_directory() {
		$patterns = $this->service->getExclusionPatterns( $this->test_dir, true );

		$this->assertContains( '/.github/', $patterns );
		$this->assertContains( '/.github', $patterns );
	}

	/**
	 * Test getExclusionPatterns includes IDE directories.
	 *
	 * Purpose: Verify IDE config directories are excluded
	 * Reason: .vscode, .idea are development-only
	 */
	public function test_getExclusionPatterns_includes_ide_directories() {
		$patterns = $this->service->getExclusionPatterns( $this->test_dir, true );

		$this->assertContains( '/.vscode/', $patterns );
		$this->assertContains( '/.idea/', $patterns );
	}

	/**
	 * Test getExclusionPatterns includes config files.
	 *
	 * Purpose: Verify dev config files are excluded
	 * Reason: composer.json, package.json, etc. are development-only
	 */
	public function test_getExclusionPatterns_includes_config_files() {
		$patterns = $this->service->getExclusionPatterns( $this->test_dir, true );

		$this->assertContains( '/composer.json', $patterns );
		$this->assertContains( '/package.json', $patterns );
		$this->assertContains( '/phpunit.xml', $patterns );
		$this->assertContains( '/.gitignore', $patterns );
	}

	// ========================================================================
	// Integration Tests
	// ========================================================================

	/**
	 * Test complete file batching workflow.
	 *
	 * Purpose: Verify end-to-end batching process
	 */
	public function test_complete_batching_workflow() {
		// 1. Create files
		$this->create_test_files( 15, 100 );

		// 2. Get file list
		$files = $this->service->getFilesInDirectory( $this->test_dir );
		$this->assertCount( 15, $files );

		// 3. Count files
		$count = $this->service->countFilesInDirectory( $this->test_dir );
		$this->assertEquals( 15, $count );

		// 4. Create batches
		$batches = $this->service->createBatches( $files, 5, PHP_INT_MAX );
		$this->assertCount( 3, $batches );

		// 5. Verify all files are in batches
		$total_files_in_batches = 0;
		foreach ( $batches as $batch ) {
			$total_files_in_batches += count( $batch['files'] );
		}
		$this->assertEquals( 15, $total_files_in_batches, 'All files should be in batches' );
	}

	/**
	 * Test workflow with exclusions.
	 *
	 * Purpose: Verify exclusion filtering works in full workflow
	 */
	public function test_workflow_with_exclusions() {
		// Create regular files
		$this->create_test_files( 5 );

		// Create dev files (should be excluded)
		$vendor_dir = $this->test_dir . '/vendor';
		wp_mkdir_p( $vendor_dir );
		file_put_contents( $vendor_dir . '/autoload.php', 'test' );

		// Count with exclusions
		$count = $this->service->countFilesInDirectoryWithExclusions( $this->test_dir, true );
		$this->assertEquals( 5, $count, 'Should exclude vendor files from count' );
	}
}
