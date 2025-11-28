<?php

/**
 * ZIP Service Tests
 *
 * Tests for ZipService - handles ZIP archive operations with security.
 *
 * Quality Standards:
 * - Tests must catch path traversal vulnerabilities
 * - Must test symlink handling and security
 * - Must test exclusion patterns work correctly
 * - Must fail if implementation allows directory escaping
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Unit\Services;

use Altolith\Deploy\Services\ZipService;
use Altolith\Deploy\Services\FileBatchService;
use Altolith\Deploy\Tests\Helpers\TestCase;

class ZipServiceTest extends TestCase
{
	/**
	 * Service instance.
	 *
	 * @var ZipService
	 */
	private ZipService $service;

	/**
	 * Mock file batch service.
	 *
	 * @var FileBatchService
	 */
	private $mockFileBatchService;

	/**
	 * Test directory path.
	 *
	 * @var string
	 */
	private string $testDir;

	/**
	 * ZIP file path.
	 *
	 * @var string
	 */
	private string $zipPath;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		// Create mock FileBatchService
		$this->mockFileBatchService = $this->createMock( FileBatchService::class );
		$this->service = new ZipService( $this->mockFileBatchService );

		// Create test directory structure
		$this->testDir = sys_get_temp_dir() . '/altolith-zip-test-' . wp_generate_password( 8, false );
		wp_mkdir_p( $this->testDir );

		// Create test files
		file_put_contents( $this->testDir . '/test1.txt', 'Test content 1' );
		file_put_contents( $this->testDir . '/test2.txt', 'Test content 2' );

		// Create subdirectory
		wp_mkdir_p( $this->testDir . '/subdir' );
		file_put_contents( $this->testDir . '/subdir/test3.txt', 'Test content 3' );

		// ZIP file path
		$this->zipPath = sys_get_temp_dir() . '/test-' . wp_generate_password( 8, false ) . '.zip';
	}

	/**
	 * Tear down test environment.
	 */
	public function tearDown(): void
	{
		// Clean up test directory
		if ( file_exists( $this->testDir ) ) {
			$this->recursiveDelete( $this->testDir );
		}

		// Clean up ZIP file
		if ( file_exists( $this->zipPath ) ) {
			unlink( $this->zipPath );
		}

		parent::tearDown();
	}

	/**
	 * Recursively delete directory.
	 *
	 * @param string $dir Directory path.
	 */
	private function recursiveDelete( string $dir ): void
	{
		if ( ! is_dir( $dir ) ) {
			return;
		}

		$files = array_diff( scandir( $dir ), [ '.', '..' ] );

		foreach ( $files as $file ) {
			$path = $dir . '/' . $file;
			if ( is_dir( $path ) ) {
				$this->recursiveDelete( $path );
			} else {
				unlink( $path );
			}
		}

		rmdir( $dir );
	}

	/**
	 * Test adding directory to ZIP.
	 */
	public function test_addDirectoryToZip_adds_files_to_archive(): void
	{
		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'test'
		);

		$zip->close();

		// Verify ZIP was created and contains files
		$this->assertFileExists( $this->zipPath );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		$this->assertGreaterThan( 0, $zip->numFiles );
		$this->assertSame( 'Test content 1', $zip->getFromName( 'test/test1.txt' ) );
		$this->assertSame( 'Test content 2', $zip->getFromName( 'test/test2.txt' ) );

		$zip->close();
	}

	/**
	 * Test adding subdirectories recursively.
	 */
	public function test_addDirectoryToZip_handles_subdirectories_recursively(): void
	{
		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'test'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// Verify subdirectory file
		$this->assertSame( 'Test content 3', $zip->getFromName( 'test/subdir/test3.txt' ) );

		$zip->close();
	}

	/**
	 * Test path traversal prevention.
	 */
	public function test_addDirectoryToZip_prevents_path_traversal(): void
	{
		// This test verifies that symlinks or path traversal attempts are blocked
		// Create a file outside the test directory
		$outsideFile = sys_get_temp_dir() . '/outside-' . wp_generate_password( 8, false ) . '.txt';
		file_put_contents( $outsideFile, 'Outside content' );

		// Try to create a symlink (this might fail on some systems, so we skip if it does)
		$symlinkPath = $this->testDir . '/evil-link';
		if ( ! @symlink( $outsideFile, $symlinkPath ) ) {
			$this->markTestSkipped( 'Symlinks not supported on this system' );
			unlink( $outsideFile );
			return;
		}

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'test'
		);

		$zip->close();

		// Verify symlink was not added (path traversal blocked)
		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		$foundSymlink = false;
		for ( $i = 0; $i < $zip->numFiles; $i++ ) {
			$stat = $zip->statIndex( $i );
			if ( str_contains( $stat['name'], 'evil-link' ) ) {
				$foundSymlink = true;
				break;
			}
		}

		$zip->close();

		$this->assertFalse( $foundSymlink, 'Symlink should not be added to ZIP (path traversal blocked)' );

		// Clean up
		unlink( $symlinkPath );
		unlink( $outsideFile );
	}

	/**
	 * Test exclusion patterns.
	 */
	public function test_addDirectoryToZip_respects_exclusion_patterns(): void
	{
		// Create files that should be excluded
		file_put_contents( $this->testDir . '/node_modules.txt', 'Should be excluded' );
		file_put_contents( $this->testDir . '/.git', 'Should be excluded' );

		$this->mockFileBatchService
			->method( 'getExclusionPatterns' )
			->willReturn( [
				$this->testDir . '/node_modules.txt',
				$this->testDir . '/.git',
			] );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		// Set up for plugin directory (triggers exclusion logic)
		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'wp-content/plugins/test'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// Verify excluded files are not in ZIP
		$this->assertFalse( $zip->getFromName( 'wp-content/plugins/test/node_modules.txt' ) );
		$this->assertFalse( $zip->getFromName( 'wp-content/plugins/test/.git' ) );

		// Verify non-excluded files are in ZIP
		$this->assertNotFalse( $zip->getFromName( 'wp-content/plugins/test/test1.txt' ) );

		$zip->close();
	}

	/**
	 * Test offloaded files are skipped.
	 */
	public function test_addDirectoryToZip_skips_offloaded_files(): void
	{
		// Create uploads directory structure
		$uploadsDir = $this->testDir . '/uploads';
		wp_mkdir_p( $uploadsDir );
		file_put_contents( $uploadsDir . '/offloaded.jpg', 'Offloaded image' );
		file_put_contents( $uploadsDir . '/local.jpg', 'Local image' );

		$offloadedPath = realpath( $uploadsDir . '/offloaded.jpg' );

		$this->mockFileBatchService
			->method( 'getOffloadedFilePaths' )
			->willReturn( [ $offloadedPath ] );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$uploadsDir,
			'wp-content/uploads'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// Verify offloaded file is not in ZIP
		$this->assertFalse( $zip->getFromName( 'wp-content/uploads/offloaded.jpg' ) );

		// Verify local file is in ZIP
		$this->assertNotFalse( $zip->getFromName( 'wp-content/uploads/local.jpg' ) );

		$zip->close();
	}

	/**
	 * Test progress callback is called.
	 */
	public function test_addDirectoryToZip_calls_progress_callback(): void
	{
		$callCount = 0;
		$callback = function() use ( &$callCount ) {
			$callCount++;
		};

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'test',
			'',
			null,
			null,
			$callback
		);

		$zip->close();

		// Should be called once per file (not for directories)
		$this->assertGreaterThan( 0, $callCount );
	}

	/**
	 * Test empty directory handling.
	 */
	public function test_addDirectoryToZip_handles_empty_directories(): void
	{
		$emptyDir = $this->testDir . '/empty';
		wp_mkdir_p( $emptyDir );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'test'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// Verify empty directory is in ZIP
		$foundEmptyDir = false;
		for ( $i = 0; $i < $zip->numFiles; $i++ ) {
			$stat = $zip->statIndex( $i );
			if ( str_contains( $stat['name'], 'empty/' ) && $stat['size'] === 0 ) {
				$foundEmptyDir = true;
				break;
			}
		}

		$zip->close();

		$this->assertTrue( $foundEmptyDir, 'Empty directory should be added to ZIP' );
	}

	/**
	 * Test nonexistent directory handling.
	 */
	public function test_addDirectoryToZip_handles_nonexistent_directory(): void
	{
		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		// Should not throw exception for nonexistent directory
		$this->service->addDirectoryToZip(
			$zip,
			'/nonexistent/path/to/directory',
			'test'
		);

		$zip->close();

		// ZIP should be empty or minimal
		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		$this->assertSame( 0, $zip->numFiles );

		$zip->close();
	}

	/**
	 * Test trailing slashes are normalized.
	 */
	public function test_addDirectoryToZip_normalizes_trailing_slashes(): void
	{
		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		// Add with trailing slash
		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir . '/',
			'test/'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// Verify files have correct paths without double slashes
		$this->assertSame( 'Test content 1', $zip->getFromName( 'test/test1.txt' ) );
		$this->assertFalse( $zip->getFromName( 'test//test1.txt' ) );

		$zip->close();
	}

	/**
	 * Test exclusion only applies to plugin/theme directories.
	 */
	public function test_addDirectoryToZip_exclusion_only_for_plugin_theme_dirs(): void
	{
		// Create a node_modules file
		file_put_contents( $this->testDir . '/node_modules.txt', 'Content' );

		$this->mockFileBatchService
			->method( 'getExclusionPatterns' )
			->willReturn( [ $this->testDir . '/node_modules.txt' ] );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		// Add as non-plugin directory (e.g., uploads)
		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'wp-content/uploads'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// File should be included (exclusion not applied to uploads)
		$this->assertNotFalse( $zip->getFromName( 'wp-content/uploads/node_modules.txt' ) );

		$zip->close();
	}

	/**
	 * Test offloaded files only apply to uploads directory.
	 */
	public function test_addDirectoryToZip_offloaded_only_for_uploads_dir(): void
	{
		// Create a file
		$filePath = $this->testDir . '/test.jpg';
		file_put_contents( $filePath, 'Image content' );

		$this->mockFileBatchService
			->method( 'getOffloadedFilePaths' )
			->willReturn( [ realpath( $filePath ) ] );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		// Add as non-uploads directory
		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'wp-content/plugins'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// File should be included (offload check not applied to plugins)
		$this->assertNotFalse( $zip->getFromName( 'wp-content/plugins/test.jpg' ) );

		$zip->close();
	}

	/**
	 * Test deep directory nesting.
	 */
	public function test_addDirectoryToZip_handles_deep_nesting(): void
	{
		// Create deeply nested structure
		$deepPath = $this->testDir . '/level1/level2/level3/level4';
		wp_mkdir_p( $deepPath );
		file_put_contents( $deepPath . '/deep.txt', 'Deep content' );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'test'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// Verify deeply nested file
		$this->assertSame( 'Deep content', $zip->getFromName( 'test/level1/level2/level3/level4/deep.txt' ) );

		$zip->close();
	}

	/**
	 * Test special characters in filenames.
	 */
	public function test_addDirectoryToZip_handles_special_characters(): void
	{
		// Create file with special characters
		file_put_contents( $this->testDir . '/test-file_123.txt', 'Special chars' );

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath, \ZipArchive::CREATE );

		$this->service->addDirectoryToZip(
			$zip,
			$this->testDir,
			'test'
		);

		$zip->close();

		$zip = new \ZipArchive();
		$zip->open( $this->zipPath );

		// Verify file with special characters
		$this->assertSame( 'Special chars', $zip->getFromName( 'test/test-file_123.txt' ) );

		$zip->close();
	}
}
