<?php
/**
 * PathValidator Tests
 *
 * Tests for path validation and security functions.
 * These tests are critical for preventing path traversal attacks.
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Unit\Utilities;

use Altolith\Deploy\Tests\Helpers\TestCase;
use Altolith\Deploy\Utilities\PathValidator;

/**
 * PathValidator test case.
 */
class PathValidatorTest extends TestCase {
	/**
	 * Test directory for path validation tests.
	 *
	 * @var string
	 */
	private $test_base_dir;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Create a test base directory.
		$this->test_base_dir = sys_get_temp_dir() . '/altolith-path-tests';
		if ( ! file_exists( $this->test_base_dir ) ) {
			mkdir( $this->test_base_dir, 0777, true );
		}
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		// Clean up test directory.
		if ( file_exists( $this->test_base_dir ) ) {
			$this->recursive_rmdir( $this->test_base_dir );
		}

		parent::tear_down();
	}

	/**
	 * Recursively remove a directory.
	 *
	 * @param string $dir Directory to remove.
	 */
	private function recursive_rmdir( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		$files = array_diff( scandir( $dir ), [ '.', '..' ] );
		foreach ( $files as $file ) {
			$path = $dir . '/' . $file;
			is_dir( $path ) ? $this->recursive_rmdir( $path ) : unlink( $path );
		}
		rmdir( $dir );
	}

	// ========================================================================
	// Path Traversal Attack Tests (Security Critical)
	// ========================================================================

	/**
	 * Test that basic path traversal is rejected.
	 *
	 * Attack: ../../etc/passwd
	 */
	public function test_rejects_basic_path_traversal() {
		$malicious_path = '../../etc/passwd';

		$this->assertTrue(
			PathValidator::containsPathTraversal( $malicious_path ),
			'Should detect basic path traversal attack'
		);
	}

	/**
	 * Test that URL encoded path traversal is rejected.
	 *
	 * Attack: ..%2F..%2Fetc%2Fpasswd
	 */
	public function test_rejects_encoded_path_traversal() {
		$malicious_path = rawurldecode( '..%2F..%2Fetc%2Fpasswd' );

		$this->assertTrue(
			PathValidator::containsPathTraversal( $malicious_path ),
			'Should detect URL-encoded path traversal attack'
		);
	}

	/**
	 * Test that null byte injection is rejected.
	 *
	 * Attack: file.txt\0.php (bypass extension checks)
	 */
	public function test_rejects_null_byte_injection() {
		$malicious_path = "file.txt\0.php";

		$this->assertTrue(
			PathValidator::containsPathTraversal( $malicious_path ),
			'Should detect null byte injection'
		);
	}

	/**
	 * Test that absolute Unix paths are rejected in isSafePath.
	 */
	public function test_rejects_absolute_unix_paths() {
		$malicious_paths = [
			'/etc/passwd',
			'/var/www/html',
			'/tmp/malicious',
		];

		foreach ( $malicious_paths as $path ) {
			$this->assertFalse(
				PathValidator::isSafePath( $path ),
				"Should reject absolute Unix path: {$path}"
			);
		}
	}

	/**
	 * Test that absolute Windows paths are rejected in isSafePath.
	 */
	public function test_rejects_absolute_windows_paths() {
		$malicious_paths = [
			'C:\\Windows\\System32',
			'D:\\sensitive\\data',
			'E:/another/path',
		];

		foreach ( $malicious_paths as $path ) {
			$this->assertFalse(
				PathValidator::isSafePath( $path ),
				"Should reject absolute Windows path: {$path}"
			);
		}
	}

	/**
	 * Test that backslash traversal (Windows) is rejected.
	 *
	 * Attack: ..\..\Windows\System32
	 */
	public function test_rejects_backslash_traversal() {
		$malicious_path = '..\..\\Windows\\System32';

		$this->assertTrue(
			PathValidator::containsPathTraversal( $malicious_path ),
			'Should detect backslash path traversal'
		);
	}

	// ========================================================================
	// Valid Path Tests (Should Allow)
	// ========================================================================

	/**
	 * Test that normal relative paths are allowed.
	 */
	public function test_allows_normal_relative_paths() {
		$safe_paths = [
			'user/documents/file.txt',
			'images/photo.jpg',
			'config/settings.json',
		];

		foreach ( $safe_paths as $path ) {
			$this->assertFalse(
				PathValidator::containsPathTraversal( $path ),
				"Should allow safe relative path: {$path}"
			);

			$this->assertTrue(
				PathValidator::isSafePath( $path ),
				"Should validate safe relative path: {$path}"
			);
		}
	}

	/**
	 * Test that safe filenames are allowed.
	 */
	public function test_allows_safe_filenames() {
		$safe_filenames = [
			'my-file_v2.txt',
			'document-2024.pdf',
			'image_001.jpg',
		];

		foreach ( $safe_filenames as $filename ) {
			$this->assertTrue(
				PathValidator::isSafePath( $filename ),
				"Should allow safe filename: {$filename}"
			);
		}
	}

	/**
	 * Test that deep directory structures are allowed.
	 */
	public function test_allows_deep_directories() {
		$deep_path = 'a/b/c/d/e/f/g/file.txt';

		$this->assertFalse(
			PathValidator::containsPathTraversal( $deep_path ),
			'Should allow deep directory structures'
		);

		$this->assertTrue(
			PathValidator::isSafePath( $deep_path ),
			'Should validate deep directory structures'
		);
	}

	// ========================================================================
	// Path Operations Tests
	// ========================================================================

	/**
	 * Test that joining paths doesn't create traversal.
	 */
	public function test_join_paths_safely() {
		$result = PathValidator::joinPaths( 'base', 'sub', 'file.txt' );

		$this->assertNotFalse( $result, 'Should successfully join safe paths' );
		$this->assertEquals( 'base/sub/file.txt', $result );
		$this->assertFalse(
			PathValidator::containsPathTraversal( $result ),
			'Joined path should not contain traversal'
		);
	}

	/**
	 * Test that joinPaths rejects malicious components.
	 */
	public function test_join_paths_rejects_malicious_components() {
		$result = PathValidator::joinPaths( 'base', '../../../etc', 'passwd' );

		$this->assertFalse(
			$result,
			'Should reject join with traversal component'
		);
	}

	/**
	 * Test that joinPaths handles empty parts.
	 */
	public function test_join_paths_handles_empty_parts() {
		$result = PathValidator::joinPaths( 'base', '', 'file.txt', '' );

		$this->assertEquals( 'base/file.txt', $result );
	}

	/**
	 * Test that relative path calculation works correctly.
	 */
	public function test_calculates_relative_path_correctly() {
		// Create test directories.
		$from_dir = $this->test_base_dir . '/from/path';
		$to_dir   = $this->test_base_dir . '/to/path';

		mkdir( $from_dir, 0777, true );
		mkdir( $to_dir, 0777, true );

		$result = PathValidator::getRelativePath( $from_dir, $to_dir );

		$this->assertNotFalse( $result, 'Should calculate relative path' );
		$this->assertIsString( $result );
	}

	/**
	 * Test filename sanitization.
	 */
	public function test_sanitizes_filenames_securely() {
		$tests = [
			// Input => Expected (may vary based on WordPress sanitization).
			'file name.txt'       => 'file-name.txt',
			'../../../etc/passwd' => 'passwd',
			"null\0byte.txt"      => 'nullbyte.txt',
		];

		foreach ( $tests as $input => $expected ) {
			$result = PathValidator::sanitizeFilename( $input );

			$this->assertNotEmpty( $result, 'Sanitized filename should not be empty' );
			$this->assertStringNotContainsString( '..', $result, 'Should remove path traversal' );
			$this->assertStringNotContainsString( "\0", $result, 'Should remove null bytes' );
			$this->assertStringNotContainsString( '/', $result, 'Should remove path separators' );
			$this->assertStringNotContainsString( '\\', $result, 'Should remove backslashes' );
		}
	}

	// ========================================================================
	// isPathWithinBase Tests
	// ========================================================================

	/**
	 * Test that isPathWithinBase allows valid subpaths.
	 */
	public function test_is_path_within_base_allows_valid_paths() {
		$base_path = $this->test_base_dir;
		$sub_path  = $this->test_base_dir . '/subdir/file.txt';

		// Create the subdir.
		mkdir( dirname( $sub_path ), 0777, true );
		touch( $sub_path );

		$result = PathValidator::isPathWithinBase( $sub_path, $base_path );

		$this->assertTrue(
			$result,
			'Should allow path within base directory'
		);
	}

	/**
	 * Test that isPathWithinBase rejects paths outside base.
	 */
	public function test_is_path_within_base_rejects_external_paths() {
		$base_path = $this->test_base_dir . '/allowed';
		$bad_path  = $this->test_base_dir . '/forbidden/file.txt';

		// Create directories.
		mkdir( $base_path, 0777, true );
		mkdir( dirname( $bad_path ), 0777, true );
		touch( $bad_path );

		$result = PathValidator::isPathWithinBase( $bad_path, $base_path );

		$this->assertFalse(
			$result,
			'Should reject path outside base directory'
		);
	}

	/**
	 * Test that isPathWithinBase works without realpath (WASM fallback).
	 */
	public function test_is_path_within_base_fallback_without_realpath() {
		// Test with non-existent paths (realpath will fail).
		$base_path = '/nonexistent/base';
		$sub_path  = '/nonexistent/base/subdir/file.txt';

		$result = PathValidator::isPathWithinBase( $sub_path, $base_path );

		$this->assertTrue(
			$result,
			'Should work with fallback when realpath fails'
		);
	}

	// ========================================================================
	// validatePath Tests (Comprehensive Validation)
	// ========================================================================

	/**
	 * Test validatePath with a valid path.
	 */
	public function test_validate_path_accepts_valid_path() {
		$base_path = $this->test_base_dir;
		$sub_path  = $this->test_base_dir . '/valid/file.txt';

		mkdir( dirname( $sub_path ), 0777, true );
		touch( $sub_path );

		// Allow symlinks since temp directories might be symlinked on some systems.
		$result = PathValidator::validatePath( $sub_path, $base_path, true );

		if ( ! $result['valid'] ) {
			$this->fail( 'Path validation failed with error: ' . $result['error'] );
		}

		$this->assertTrue( $result['valid'], 'Should validate safe path' );
		$this->assertNull( $result['error'] );
	}

	/**
	 * Test validatePath rejects null bytes in path.
	 */
	public function test_validate_path_rejects_null_bytes() {
		$base_path      = $this->test_base_dir;
		$malicious_path = $this->test_base_dir . "/file\0.txt";

		$result = PathValidator::validatePath( $malicious_path, $base_path );

		$this->assertFalse( $result['valid'] );
		$this->assertEquals( 'Path contains null bytes', $result['error'] );
	}

	/**
	 * Test validatePath rejects null bytes in base path.
	 */
	public function test_validate_path_rejects_null_bytes_in_base() {
		$malicious_base = "/base\0/path";
		$path           = '/base/path/file.txt';

		$result = PathValidator::validatePath( $path, $malicious_base );

		$this->assertFalse( $result['valid'] );
		$this->assertEquals( 'Path contains null bytes', $result['error'] );
	}

	/**
	 * Test validatePath rejects traversal sequences.
	 */
	public function test_validate_path_rejects_traversal_sequences() {
		$base_path      = $this->test_base_dir;
		$malicious_path = $this->test_base_dir . '/../../../etc/passwd';

		$result = PathValidator::validatePath( $malicious_path, $base_path );

		$this->assertFalse( $result['valid'] );
		$this->assertEquals( 'Path contains traversal sequences', $result['error'] );
	}

	/**
	 * Test validatePath rejects paths outside base.
	 */
	public function test_validate_path_rejects_outside_base() {
		$base_path = $this->test_base_dir . '/allowed';
		$bad_path  = $this->test_base_dir . '/forbidden/file.txt';

		$result = PathValidator::validatePath( $bad_path, $base_path );

		$this->assertFalse( $result['valid'] );
		$this->assertEquals( 'Path is outside allowed directory', $result['error'] );
	}

	/**
	 * Test validatePath rejects symlinks when not allowed.
	 */
	public function test_validate_path_rejects_symlinks() {
		if ( ! function_exists( 'symlink' ) ) {
			$this->markTestSkipped( 'symlink() function not available' );
		}

		$base_path   = $this->test_base_dir;
		$target_file = $this->test_base_dir . '/target.txt';
		$symlink     = $this->test_base_dir . '/link.txt';

		// Create target and symlink.
		touch( $target_file );

		if ( ! @symlink( $target_file, $symlink ) ) {
			$this->markTestSkipped( 'Unable to create symlink for testing' );
		}

		$result = PathValidator::validatePath( $symlink, $base_path, false );

		$this->assertFalse( $result['valid'] );
		$this->assertEquals( 'Symlinks are not allowed', $result['error'] );

		// Clean up.
		unlink( $symlink );
		unlink( $target_file );
	}

	/**
	 * Test validatePath allows symlinks when explicitly allowed.
	 */
	public function test_validate_path_allows_symlinks_when_permitted() {
		if ( ! function_exists( 'symlink' ) ) {
			$this->markTestSkipped( 'symlink() function not available' );
		}

		$base_path   = $this->test_base_dir;
		$target_file = $this->test_base_dir . '/target.txt';
		$symlink     = $this->test_base_dir . '/link.txt';

		// Create target and symlink.
		touch( $target_file );

		if ( ! @symlink( $target_file, $symlink ) ) {
			$this->markTestSkipped( 'Unable to create symlink for testing' );
		}

		$result = PathValidator::validatePath( $symlink, $base_path, true );

		$this->assertTrue( $result['valid'], 'Should allow symlinks when permitted' );

		// Clean up.
		unlink( $symlink );
		unlink( $target_file );
	}

	// ========================================================================
	// Edge Case Tests
	// ========================================================================

	/**
	 * Test handling of empty paths.
	 */
	public function test_handles_empty_paths() {
		$this->assertFalse(
			PathValidator::containsPathTraversal( '' ),
			'Empty path should not contain traversal'
		);

		$this->assertTrue(
			PathValidator::isSafePath( '' ),
			'Empty path should be considered safe (though not useful)'
		);
	}

	/**
	 * Test handling of paths with special characters.
	 */
	public function test_handles_special_characters_safely() {
		$paths = [
			'file with spaces.txt',
			'file-with-dashes.txt',
			'file_with_underscores.txt',
		];

		foreach ( $paths as $path ) {
			$this->assertTrue(
				PathValidator::isSafePath( $path ),
				"Should handle special characters safely: {$path}"
			);
		}
	}

	/**
	 * Test handling of very long paths.
	 */
	public function test_handles_very_long_paths() {
		// Create a very deep path (not long enough to hit limits, but deep).
		$long_path = str_repeat( 'a/', 100 ) . 'file.txt';

		$this->assertFalse(
			PathValidator::containsPathTraversal( $long_path ),
			'Long path should not contain traversal'
		);
	}

	/**
	 * Test isLikelySymlink detection.
	 */
	public function test_symlink_detection() {
		if ( ! function_exists( 'symlink' ) ) {
			$this->markTestSkipped( 'symlink() function not available' );
		}

		$target_file = $this->test_base_dir . '/target.txt';
		$symlink     = $this->test_base_dir . '/link.txt';

		touch( $target_file );

		if ( ! @symlink( $target_file, $symlink ) ) {
			$this->markTestSkipped( 'Unable to create symlink for testing' );
		}

		$this->assertTrue(
			PathValidator::isLikelySymlink( $symlink ),
			'Should detect symlink'
		);

		// Use realpath to get the canonical path without symlinks for testing.
		$real_target = realpath( $target_file );
		if ( $real_target ) {
			$this->assertFalse(
				PathValidator::isLikelySymlink( $real_target ),
				'Should not detect normal file as symlink when using realpath'
			);
		}

		// Clean up.
		unlink( $symlink );
		unlink( $target_file );
	}
}
