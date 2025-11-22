<?php
/**
 * Security Validator Tests
 *
 * Comprehensive security tests for SecurityValidator utility class.
 * Tests path traversal prevention, null byte injection prevention,
 * absolute path detection, and slug validation.
 *
 * Quality Standards:
 * - Tests must catch real security vulnerabilities
 * - Must test all attack vectors
 * - Must test edge cases
 * - Must fail if implementation allows ANY attack
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Utilities;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Utilities\SecurityValidator;

/**
 * Security validator test case.
 */
class SecurityValidatorTest extends TestCase {

	// ========================================================================
	// Path Traversal Tests - isValidPath()
	// ========================================================================

	/**
	 * Test basic path traversal detection.
	 *
	 * Attack: ../../etc/passwd
	 * Severity: CRITICAL - Allows reading arbitrary files
	 */
	public function test_isValidPath_detects_basic_path_traversal() {
		$malicious_paths = [
			'../../etc/passwd',
			'../../../etc/passwd',
			'path/../../sensitive/file.txt',
			'./../../config.php',
		];

		foreach ( $malicious_paths as $path ) {
			$this->assertFalse(
				SecurityValidator::isValidPath( $path ),
				"Failed to detect path traversal in: {$path}"
			);
		}
	}

	/**
	 * Test URL-encoded path traversal detection.
	 *
	 * Attack: ..%2F..%2Fetc%2Fpasswd
	 * Severity: HIGH - Bypasses basic string matching
	 * Note: While SecurityValidator checks raw input, this tests implementation robustness
	 */
	public function test_isValidPath_detects_encoded_path_traversal() {
		// Test if implementation is vulnerable to pre-decoded input
		// (In real usage, input should be decoded before validation)
		$decoded_attacks = [
			'..%2F..%2Fetc',     // Will be '../etc' after decode
			urldecode( '..%2F..%2Fetc' ), // Simulate decoded input
			'..%5C..%5Cetc',     // Windows backslash encoded
			urldecode( '..%5C..%5Cetc' ),
		];

		foreach ( $decoded_attacks as $path ) {
			if ( \strpos( $path, '..' ) !== false ) {
				// After decode, should contain .. and be detected
				$this->assertFalse(
					SecurityValidator::isValidPath( $path ),
					"Failed to detect encoded traversal in: {$path}"
				);
			}
		}
	}

	/**
	 * Test double-encoded path traversal detection.
	 *
	 * Attack: ..%252F..%252F (double-encoded)
	 * Severity: MEDIUM - Some validators decode twice
	 */
	public function test_isValidPath_detects_double_encoded_traversal() {
		$double_encoded = '..%252F..%252F'; // %25 = %, so %252F = %2F after first decode
		$single_decoded = urldecode( $double_encoded ); // Now ..%2F..%2F
		$fully_decoded  = urldecode( $single_decoded );  // Now ../../

		// After full decode, must be detected
		$this->assertFalse(
			SecurityValidator::isValidPath( $fully_decoded ),
			'Failed to detect double-encoded path traversal after decode'
		);
	}

	/**
	 * Test backslash path traversal detection (Windows-style).
	 *
	 * Attack: ..\\..\\ (Windows path traversal)
	 * Severity: CRITICAL - Windows systems are vulnerable
	 */
	public function test_isValidPath_detects_backslash_traversal() {
		$backslash_attacks = [
			'..\\..\\etc',
			'path\\..\\..\\sensitive',
			'..\\..',
			'..\\',
			'\\..\\file.txt',
		];

		foreach ( $backslash_attacks as $path ) {
			$this->assertFalse(
				SecurityValidator::isValidPath( $path ),
				"Failed to detect backslash traversal in: {$path}"
			);
		}
	}

	/**
	 * Test mixed forward/backslash traversal detection.
	 *
	 * Attack: ../.\\./../ (mixed slash styles)
	 * Severity: HIGH - Bypasses naive regex
	 */
	public function test_isValidPath_detects_mixed_slash_traversal() {
		$mixed_attacks = [
			'../.\\./../',
			'..\\./path',
			'./.\\../',
			'path/.\\../file',
		];

		foreach ( $mixed_attacks as $path ) {
			$this->assertFalse(
				SecurityValidator::isValidPath( $path ),
				"Failed to detect mixed slash traversal in: {$path}"
			);
		}
	}

	/**
	 * Test edge cases with dots that should be valid.
	 *
	 * These are legitimate paths that should NOT be blocked.
	 */
	public function test_isValidPath_allows_legitimate_dots() {
		$legitimate_paths = [
			'file.txt',
			'path/to/file.tar.gz',
			'.gitignore',
			'.htaccess',
			'path/.hidden',
			'my.file.with.dots.txt',
		];

		foreach ( $legitimate_paths as $path ) {
			$this->assertTrue(
				SecurityValidator::isValidPath( $path ),
				"Incorrectly blocked legitimate path: {$path}"
			);
		}
	}

	/**
	 * Test current directory reference (single dot) is allowed.
	 *
	 * Note: '.' and './' are current directory, NOT traversal
	 */
	public function test_isValidPath_allows_current_directory() {
		$current_dir_paths = [
			'./file.txt',
			'./path/to/file',
			'path/./file',
		];

		foreach ( $current_dir_paths as $path ) {
			$this->assertTrue(
				SecurityValidator::isValidPath( $path ),
				"Incorrectly blocked current directory reference: {$path}"
			);
		}
	}

	// ========================================================================
	// Null Byte Injection Tests - isValidPath()
	// ========================================================================

	/**
	 * Test null byte injection detection.
	 *
	 * Attack: path/file\0.php (null byte to bypass extension checks)
	 * Severity: CRITICAL - Can bypass security checks, execute arbitrary code
	 */
	public function test_isValidPath_detects_null_byte_injection() {
		$null_byte_attacks = [
			"path/file\0.php",
			"file\0",
			"\0file",
			"path\0/to/file",
			"file.txt\0.bak",
		];

		foreach ( $null_byte_attacks as $path ) {
			$this->assertFalse(
				SecurityValidator::isValidPath( $path ),
				'Failed to detect null byte injection'
			);
		}
	}

	/**
	 * Test multiple null bytes.
	 *
	 * Attack: Multiple null bytes in path
	 * Severity: HIGH - Some systems vulnerable to multiple nulls
	 */
	public function test_isValidPath_detects_multiple_null_bytes() {
		$multiple_nulls = "path\0to\0file\0.php";

		$this->assertFalse(
			SecurityValidator::isValidPath( $multiple_nulls ),
			'Failed to detect multiple null bytes'
		);
	}

	// ========================================================================
	// Absolute Path Detection Tests - isRelativePath()
	// ========================================================================

	/**
	 * Test Unix-style absolute path detection.
	 *
	 * Attack: /etc/passwd (absolute path)
	 * Severity: HIGH - Allows accessing files outside intended directory
	 */
	public function test_isRelativePath_detects_unix_absolute_paths() {
		$unix_absolute = [
			'/etc/passwd',
			'/var/www/html',
			'/tmp/file',
			'/home/user/.ssh/id_rsa',
			'//double/slash',
		];

		foreach ( $unix_absolute as $path ) {
			$this->assertFalse(
				SecurityValidator::isRelativePath( $path ),
				"Failed to detect Unix absolute path: {$path}"
			);
		}
	}

	/**
	 * Test Windows-style absolute path detection.
	 *
	 * Attack: C:\Windows\System32 (Windows absolute)
	 * Severity: HIGH - Windows path traversal
	 */
	public function test_isRelativePath_detects_windows_absolute_paths() {
		$windows_absolute = [
			'C:\\Windows',
			'D:\\data',
			'C:/Windows',  // Forward slash variant
			'Z:\\drive',
			'c:\\windows', // Lowercase drive letter
		];

		foreach ( $windows_absolute as $path ) {
			$this->assertFalse(
				SecurityValidator::isRelativePath( $path ),
				"Failed to detect Windows absolute path: {$path}"
			);
		}
	}

	/**
	 * Test backslash-prefixed absolute path detection.
	 *
	 * Attack: \path\to\file (Windows root-relative)
	 * Severity: MEDIUM - Windows considers this absolute
	 */
	public function test_isRelativePath_detects_backslash_absolute() {
		$backslash_absolute = [
			'\\path\\to\\file',
			'\\\\UNC\\share',
		];

		foreach ( $backslash_absolute as $path ) {
			$this->assertFalse(
				SecurityValidator::isRelativePath( $path ),
				"Failed to detect backslash absolute path: {$path}"
			);
		}
	}

	/**
	 * Test legitimate relative paths are allowed.
	 */
	public function test_isRelativePath_allows_legitimate_relative_paths() {
		$relative_paths = [
			'path/to/file',
			'./relative/path',
			'file.txt',
			'deep/nested/path/file.txt',
		];

		foreach ( $relative_paths as $path ) {
			$this->assertTrue(
				SecurityValidator::isRelativePath( $path ),
				"Incorrectly blocked relative path: {$path}"
			);
		}
	}

	// ========================================================================
	// Slug Validation Tests - isValidSlug()
	// ========================================================================

	/**
	 * Test empty slug rejection.
	 *
	 * Severity: MEDIUM - Empty slugs can cause filesystem errors
	 */
	public function test_isValidSlug_rejects_empty_slug() {
		$this->assertFalse(
			SecurityValidator::isValidSlug( '' ),
			'Failed to reject empty slug'
		);
	}

	/**
	 * Test path traversal in slugs.
	 *
	 * Attack: ../../../etc (traversal in slug)
	 * Severity: CRITICAL - Slugs used in file paths
	 */
	public function test_isValidSlug_rejects_path_traversal() {
		$traversal_slugs = [
			'../etc',
			'../../passwd',
			'path/../file',
		];

		foreach ( $traversal_slugs as $slug ) {
			$this->assertFalse(
				SecurityValidator::isValidSlug( $slug ),
				"Failed to reject traversal in slug: {$slug}"
			);
		}
	}

	/**
	 * Test null bytes in slugs.
	 *
	 * Attack: slug\0 (null byte)
	 * Severity: HIGH - Can bypass validation
	 */
	public function test_isValidSlug_rejects_null_bytes() {
		$null_slugs = [
			"slug\0",
			"\0slug",
			"sl\0ug",
		];

		foreach ( $null_slugs as $slug ) {
			$this->assertFalse(
				SecurityValidator::isValidSlug( $slug ),
				'Failed to reject null byte in slug'
			);
		}
	}

	/**
	 * Test dangerous dot sequences.
	 *
	 * Attack: '.' or '..' (directory references)
	 * Severity: HIGH - Can manipulate directory structure
	 */
	public function test_isValidSlug_rejects_dangerous_dot_sequences() {
		$this->assertFalse(
			SecurityValidator::isValidSlug( '.' ),
			'Failed to reject single dot'
		);

		$this->assertFalse(
			SecurityValidator::isValidSlug( '..' ),
			'Failed to reject double dot'
		);
	}

	/**
	 * Test legitimate slugs are allowed.
	 */
	public function test_isValidSlug_allows_legitimate_slugs() {
		$valid_slugs = [
			'my-slug',
			'provider-123',
			'local-filesystem',
			'my_slug_123',
			'CamelCase',
		];

		foreach ( $valid_slugs as $slug ) {
			$this->assertTrue(
				SecurityValidator::isValidSlug( $slug ),
				"Incorrectly rejected valid slug: {$slug}"
			);
		}
	}

	// ========================================================================
	// Combined Validation Tests - validateExportPath()
	// ========================================================================

	/**
	 * Test validateExportPath rejects traversal.
	 */
	public function test_validateExportPath_rejects_traversal() {
		$result = SecurityValidator::validateExportPath( '../../etc/passwd' );

		$this->assertFalse( $result['valid'] );
		$this->assertArrayHasKey( 'error', $result );
		$this->assertStringContainsString( 'traversal', $result['error'] );
	}

	/**
	 * Test validateExportPath rejects null bytes.
	 */
	public function test_validateExportPath_rejects_null_bytes() {
		$result = SecurityValidator::validateExportPath( "path\0/file" );

		$this->assertFalse( $result['valid'] );
		$this->assertArrayHasKey( 'error', $result );
	}

	/**
	 * Test validateExportPath rejects absolute paths.
	 */
	public function test_validateExportPath_rejects_absolute_paths() {
		$absolute_paths = [
			'/etc/passwd',
			'C:\\Windows',
			'\\\\UNC\\share',
		];

		foreach ( $absolute_paths as $path ) {
			$result = SecurityValidator::validateExportPath( $path );

			$this->assertFalse( $result['valid'], "Failed to reject: {$path}" );
			$this->assertArrayHasKey( 'error', $result );
			$this->assertStringContainsString( 'absolute', $result['error'] );
		}
	}

	/**
	 * Test validateExportPath allows valid relative paths.
	 */
	public function test_validateExportPath_allows_valid_paths() {
		$valid_paths = [
			'path/to/file.txt',
			'export/data.zip',
			'./relative/path',
		];

		foreach ( $valid_paths as $path ) {
			$result = SecurityValidator::validateExportPath( $path );

			$this->assertTrue( $result['valid'], "Incorrectly rejected: {$path}" );
			$this->assertArrayNotHasKey( 'error', $result );
		}
	}

	// ========================================================================
	// Slug Validation Wrapper Tests - validateSlug()
	// ========================================================================

	/**
	 * Test validateSlug wrapper rejects invalid slugs.
	 */
	public function test_validateSlug_rejects_invalid_slugs() {
		$invalid_slugs = [
			'',
			'.',
			'..',
			'../etc',
			"slug\0",
		];

		foreach ( $invalid_slugs as $slug ) {
			$result = SecurityValidator::validateSlug( $slug );

			$this->assertFalse( $result['valid'], "Failed to reject slug: {$slug}" );
			$this->assertArrayHasKey( 'error', $result );
		}
	}

	/**
	 * Test validateSlug wrapper allows valid slugs.
	 */
	public function test_validateSlug_allows_valid_slugs() {
		$valid_slugs = [
			'my-slug',
			'provider-123',
			'local-filesystem',
		];

		foreach ( $valid_slugs as $slug ) {
			$result = SecurityValidator::validateSlug( $slug );

			$this->assertTrue( $result['valid'], "Incorrectly rejected: {$slug}" );
			$this->assertArrayNotHasKey( 'error', $result );
		}
	}

	// ========================================================================
	// Comprehensive Validation Tests - validatePathComprehensive()
	// ========================================================================

	/**
	 * Test comprehensive validation rejects traversal.
	 */
	public function test_validatePathComprehensive_rejects_traversal() {
		$result = SecurityValidator::validatePathComprehensive( '../../etc/passwd' );

		$this->assertFalse( $result['valid'] );
		$this->assertArrayHasKey( 'error', $result );
	}

	/**
	 * Test comprehensive validation with requireRelative flag.
	 */
	public function test_validatePathComprehensive_enforces_relative_requirement() {
		$result = SecurityValidator::validatePathComprehensive(
			'/etc/passwd',
			null,
			true // Require relative
		);

		$this->assertFalse( $result['valid'] );
		$this->assertStringContainsString( 'relative', $result['error'] );
	}

	/**
	 * Test comprehensive validation allows absolute when not required to be relative.
	 */
	public function test_validatePathComprehensive_allows_absolute_when_not_required_relative() {
		// When requireRelative is false, absolute paths are allowed
		// (as long as they don't have traversal or null bytes)
		$result = SecurityValidator::validatePathComprehensive(
			'/valid/absolute/path',
			null,
			false // Don't require relative
		);

		$this->assertTrue( $result['valid'], 'Should allow absolute path when requireRelative is false' );
	}

	/**
	 * Test comprehensive validation with base path integration.
	 *
	 * This tests integration with PathValidator.
	 */
	public function test_validatePathComprehensive_integrates_with_base_path_validation() {
		$base_path = '/var/www/html/wp-content';
		$safe_path = 'uploads/file.txt';

		// Create a real base directory for testing
		$temp_base = $this->create_test_file( 'base-dir/subdir/test.txt', 'test' );
		$temp_base_dir = dirname( dirname( $temp_base ) );

		$result = SecurityValidator::validatePathComprehensive(
			'subdir/test.txt',
			$temp_base_dir,
			false
		);

		// Should validate against base path using PathValidator
		$this->assertTrue(
			$result['valid'],
			'Should allow path within base directory'
		);
	}

	/**
	 * Test comprehensive validation rejects path outside base.
	 */
	public function test_validatePathComprehensive_rejects_path_outside_base() {
		$temp_base = $this->create_test_file( 'base-dir/test.txt', 'test' );
		$base_dir = dirname( $temp_base );

		// Try to access parent of base directory
		$result = SecurityValidator::validatePathComprehensive(
			'../outside.txt',
			$base_dir,
			false
		);

		$this->assertFalse(
			$result['valid'],
			'Should reject path outside base directory'
		);
	}

	/**
	 * Test comprehensive validation with all checks enabled.
	 */
	public function test_validatePathComprehensive_enforces_all_checks() {
		$temp_base = $this->create_test_file( 'base-dir/test.txt', 'test' );
		$base_dir = dirname( $temp_base );

		// Valid path with all checks
		$result = SecurityValidator::validatePathComprehensive(
			'file.txt',
			$base_dir,
			true // Require relative
		);

		$this->assertTrue(
			$result['valid'],
			'Should allow valid relative path within base'
		);

		// Invalid: absolute path with requireRelative
		$result = SecurityValidator::validatePathComprehensive(
			'/etc/passwd',
			$base_dir,
			true
		);

		$this->assertFalse( $result['valid'], 'Should reject absolute path when relative required' );

		// Invalid: traversal with base path
		$result = SecurityValidator::validatePathComprehensive(
			'../../outside',
			$base_dir,
			true
		);

		$this->assertFalse( $result['valid'], 'Should reject traversal outside base' );
	}

	// ========================================================================
	// Edge Cases and Boundary Conditions
	// ========================================================================

	/**
	 * Test very long path handling.
	 *
	 * Purpose: Ensure no buffer overflow or performance issues
	 */
	public function test_handles_very_long_paths() {
		$long_path = str_repeat( 'a/', 1000 ) . 'file.txt';

		// Should not crash or hang
		$result = SecurityValidator::isValidPath( $long_path );

		// Long path without traversal should be valid
		$this->assertTrue( $result, 'Should handle very long paths' );
	}

	/**
	 * Test special characters in paths.
	 *
	 * Purpose: Ensure special chars don't cause issues
	 */
	public function test_handles_special_characters() {
		$special_paths = [
			'path with spaces/file.txt',
			'path-with-dashes/file.txt',
			'path_with_underscores/file.txt',
			'path.with.dots/file.txt',
			'path(with)parens/file.txt',
		];

		foreach ( $special_paths as $path ) {
			$result = SecurityValidator::isValidPath( $path );

			$this->assertTrue(
				$result,
				"Should handle special characters in path: {$path}"
			);
		}
	}

	/**
	 * Test Unicode characters in paths.
	 *
	 * Purpose: Ensure Unicode doesn't bypass validation
	 */
	public function test_handles_unicode_paths() {
		$unicode_paths = [
			'path/файл.txt',        // Cyrillic
			'path/文件.txt',        // Chinese
			'path/ファイル.txt',    // Japanese
			'path/مجلد/ملف.txt', // Arabic
		];

		foreach ( $unicode_paths as $path ) {
			$result = SecurityValidator::isValidPath( $path );

			// Unicode paths without traversal should be valid
			$this->assertTrue(
				$result,
				"Should handle Unicode path: {$path}"
			);
		}
	}

	/**
	 * Test case sensitivity doesn't affect security.
	 *
	 * Purpose: Ensure case variations don't bypass checks
	 */
	public function test_case_sensitivity_in_validation() {
		// Windows drive letters - both cases should be detected
		$this->assertFalse(
			SecurityValidator::isRelativePath( 'C:\\Windows' ),
			'Should detect uppercase drive letter'
		);

		$this->assertFalse(
			SecurityValidator::isRelativePath( 'c:\\windows' ),
			'Should detect lowercase drive letter'
		);
	}
}
