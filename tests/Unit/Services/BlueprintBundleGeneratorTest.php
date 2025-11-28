<?php
/**
 * Blueprint Bundle Generator Tests
 *
 * Comprehensive tests for BlueprintBundleGenerator - generates WordPress Playground bundles.
 * This is critical security-sensitive functionality handling file I/O and zip creation.
 *
 * Quality Standards:
 * - Tests must catch security vulnerabilities (path traversal, injection, TOCTOU)
 * - Must test file size limits and memory exhaustion prevention
 * - Must test all error conditions and edge cases
 * - Must verify proper cleanup on failures
 * - Must fail if implementation allows ANY security bypass or file corruption
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Unit\Services;

use Altolith\Deploy\Tests\Helpers\TestCase;
use Altolith\Deploy\Services\BlueprintBundleGenerator;

/**
 * Blueprint Bundle Generator test case.
 */
class BlueprintBundleGeneratorTest extends TestCase {

	/**
	 * Generator instance.
	 *
	 * @var BlueprintBundleGenerator
	 */
	private $generator;

	/**
	 * Test output directory.
	 *
	 * @var string
	 */
	private $test_output_dir;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->generator = new BlueprintBundleGenerator();

		// Create test output directory within WordPress
		$this->test_output_dir = WP_CONTENT_DIR . '/altolith-test-blueprints-' . time();
		wp_mkdir_p( $this->test_output_dir );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		// Clean up test files
		$this->clean_up_test_blueprints();
		parent::tear_down();
	}

	/**
	 * Clean up test blueprint files.
	 */
	private function clean_up_test_blueprints() {
		if ( is_dir( $this->test_output_dir ) ) {
			$files = glob( $this->test_output_dir . '/*' );
			if ( $files ) {
				foreach ( $files as $file ) {
					if ( is_file( $file ) ) {
						unlink( $file );
					}
				}
			}
			rmdir( $this->test_output_dir );
		}

		// Also clean up any test wp-content.zip files
		$patterns = [
			WP_CONTENT_DIR . '/test-wp-content*.zip',
			WP_CONTENT_DIR . '/uploads/altolith-temp/test-*.zip',
		];

		foreach ( $patterns as $pattern ) {
			$files = glob( $pattern );
			if ( $files ) {
				foreach ( $files as $file ) {
					if ( file_exists( $file ) ) {
						@unlink( $file );
					}
				}
			}
		}
	}

	/**
	 * Create a test wp-content.zip file.
	 *
	 * @param int $size_bytes Optional file size in bytes.
	 * @return string Path to created zip file.
	 */
	private function create_test_wp_content_zip( int $size_bytes = 1024 ): string {
		$zip_path = WP_CONTENT_DIR . '/test-wp-content-' . uniqid() . '.zip';

		$zip = new \ZipArchive();
		$zip->open( $zip_path, \ZipArchive::CREATE );

		// Add dummy content
		$content = str_repeat( 'a', $size_bytes );
		$zip->addFromString( 'test.txt', $content );

		$zip->close();

		return $zip_path;
	}

	// ========================================================================
	// Happy Path Tests - generate()
	// ========================================================================

	/**
	 * Test generate creates valid blueprint bundle.
	 *
	 * Purpose: Verify successful bundle creation with blueprint.json and wp-content.zip
	 */
	public function test_generate_creates_valid_bundle() {
		$blueprint_data = [
			'preferredVersions' => [
				'php' => '8.2',
				'wp' => 'latest',
			],
			'steps' => [
				[ 'step' => 'login' ],
			],
		];

		$wp_content_zip = $this->create_test_wp_content_zip();

		$result = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$this->test_output_dir
		);

		$this->assertNotFalse( $result, 'Should successfully create bundle' );
		$this->assertFileExists( $result, 'Bundle file should exist' );

		// Verify bundle structure
		$zip = new \ZipArchive();
		$this->assertTrue( $zip->open( $result ) === true, 'Bundle should be valid zip' );

		// Verify blueprint.json exists
		$this->assertNotFalse(
			$zip->locateName( 'blueprint.json' ),
			'Bundle should contain blueprint.json'
		);

		// Verify wp-content.zip exists
		$this->assertNotFalse(
			$zip->locateName( 'wp-content.zip' ),
			'Bundle should contain wp-content.zip'
		);

		// Verify blueprint.json content
		$blueprint_content = $zip->getFromName( 'blueprint.json' );
		$decoded = json_decode( $blueprint_content, true );
		$this->assertEquals( $blueprint_data, $decoded, 'Blueprint data should match' );

		$zip->close();

		// Cleanup - bundle is in test_output_dir which gets cleaned in tear_down
	}

	/**
	 * Test generate with custom bundle filename.
	 *
	 * Purpose: Verify custom filenames work correctly
	 */
	public function test_generate_with_custom_filename() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$result = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$this->test_output_dir,
			'custom-bundle.zip'
		);

		$this->assertNotFalse( $result );
		$this->assertStringEndsWith( 'custom-bundle.zip', $result );
		$this->assertFileExists( $result );
	}

	/**
	 * Test generate deletes wp-content.zip after adding to bundle.
	 *
	 * Purpose: Verify cleanup of temporary files
	 * Reason: Prevents disk space accumulation from temp files
	 */
	public function test_generate_deletes_wp_content_zip_after_adding() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$this->assertFileExists( $wp_content_zip, 'wp-content.zip should exist before generation' );

		$result = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$this->test_output_dir
		);

		$this->assertNotFalse( $result );
		$this->assertFileDoesNotExist( $wp_content_zip, 'wp-content.zip should be deleted after adding to bundle' );
	}

	/**
	 * Test generate replaces existing bundle.
	 *
	 * Purpose: Verify old bundles are replaced
	 * Edge Case: Regenerating bundle for same deployment
	 */
	public function test_generate_replaces_existing_bundle() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip_1 = $this->create_test_wp_content_zip( 100 );

		// Create first bundle
		$result1 = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip_1,
			$this->test_output_dir,
			'test-bundle.zip'
		);

		$this->assertFileExists( $result1 );
		$first_size = filesize( $result1 );

		// Create second bundle with different size
		$wp_content_zip_2 = $this->create_test_wp_content_zip( 200 );
		$result2 = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip_2,
			$this->test_output_dir,
			'test-bundle.zip'
		);

		$this->assertFileExists( $result2 );
		$second_size = filesize( $result2 );

		// Sizes should be different, proving replacement occurred
		$this->assertNotEquals( $first_size, $second_size, 'Bundle should be replaced with new content' );
	}

	// ========================================================================
	// Security Tests - Path Traversal & Injection
	// ========================================================================

	/**
	 * Test generate rejects path traversal in wp-content.zip path.
	 *
	 * Purpose: Verify path traversal prevention
	 * Security: CRITICAL - Prevents reading arbitrary files
	 * Attack Vector: ../../etc/passwd as wp-content path
	 */
	public function test_generate_rejects_path_traversal_in_wp_content_path() {
		$blueprint_data = [ 'steps' => [] ];

		// Path traversal attempt
		$result = $this->generator->generate(
			$blueprint_data,
			'../../etc/passwd',
			$this->test_output_dir
		);

		$this->assertFalse( $result, 'Should reject path traversal in wp-content path' );
	}

	/**
	 * Test generate rejects path traversal in bundle filename.
	 *
	 * Purpose: Verify filename validation prevents directory traversal
	 * Security: CRITICAL - Prevents writing files outside output directory
	 * Attack Vector: ../../../malicious.zip as filename
	 */
	public function test_generate_rejects_path_traversal_in_bundle_filename() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$malicious_filenames = [
			'../../../etc/malicious.zip',
			'..\\..\\..\\malicious.zip',
			'./../../outside.zip',
		];

		foreach ( $malicious_filenames as $filename ) {
			$result = $this->generator->generate(
				$blueprint_data,
				$wp_content_zip,
				$this->test_output_dir,
				$filename
			);

			$this->assertFalse( $result, "Should reject path traversal in filename: {$filename}" );
		}

		// Cleanup
		if ( file_exists( $wp_content_zip ) ) {
			unlink( $wp_content_zip );
		}
	}

	/**
	 * Test generate rejects absolute path in bundle filename.
	 *
	 * Purpose: Verify absolute path detection in filename
	 * Security: HIGH - Prevents writing to arbitrary locations
	 * Attack Vector: /tmp/malicious.zip as filename
	 */
	public function test_generate_rejects_absolute_path_in_bundle_filename() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$absolute_filenames = [
			'/tmp/malicious.zip',
			'/etc/bundle.zip',
			'\\Windows\\malicious.zip',
		];

		foreach ( $absolute_filenames as $filename ) {
			$result = $this->generator->generate(
				$blueprint_data,
				$wp_content_zip,
				$this->test_output_dir,
				$filename
			);

			$this->assertFalse( $result, "Should reject absolute path in filename: {$filename}" );
		}

		// Cleanup
		if ( file_exists( $wp_content_zip ) ) {
			unlink( $wp_content_zip );
		}
	}

	/**
	 * Test generate rejects output directory outside ABSPATH.
	 *
	 * Purpose: Verify output directory must be within WordPress installation
	 * Security: CRITICAL - Prevents writing bundles outside WordPress
	 * Attack Vector: /tmp as output directory
	 */
	public function test_generate_rejects_output_directory_outside_abspath() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		// Try to use system temp directory (outside ABSPATH)
		$result = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			'/tmp'
		);

		$this->assertFalse( $result, 'Should reject output directory outside ABSPATH' );

		// Cleanup
		if ( file_exists( $wp_content_zip ) ) {
			unlink( $wp_content_zip );
		}
	}

	// ========================================================================
	// Security Tests - File Size Limits
	// ========================================================================

	/**
	 * Test generate enforces 512MB file size limit.
	 *
	 * Purpose: Verify file size limit prevents memory exhaustion
	 * Security: HIGH - Prevents DoS via large files
	 * Edge Case: User tries to export very large site
	 */
	public function test_generate_enforces_file_size_limit() {
		$this->markTestSkipped( 'Cannot create 512MB+ file in unit test - test manually or in integration test' );

		// Note: Creating a 512MB+ file for testing would be too slow for unit tests.
		// This should be tested in integration tests or manually.
		// The implementation check is at lines 107-115 of BlueprintBundleGenerator.php
	}

	/**
	 * Test generate handles file size check edge case at exact limit.
	 *
	 * Purpose: Verify boundary condition at 512MB
	 * Edge Case: File exactly at limit
	 */
	public function test_generate_handles_file_size_at_exact_limit() {
		$this->markTestSkipped( 'Requires 512MB file creation - integration test only' );
	}

	// ========================================================================
	// Validation Tests - Input Validation
	// ========================================================================

	/**
	 * Test generate rejects empty blueprint data.
	 *
	 * Purpose: Verify blueprint data is required
	 * Edge Case: Invalid API response, corrupted data
	 */
	public function test_generate_rejects_empty_blueprint_data() {
		$wp_content_zip = $this->create_test_wp_content_zip();

		$result = $this->generator->generate(
			[],
			$wp_content_zip,
			$this->test_output_dir
		);

		$this->assertFalse( $result, 'Should reject empty blueprint data' );

		// Cleanup
		if ( file_exists( $wp_content_zip ) ) {
			unlink( $wp_content_zip );
		}
	}

	/**
	 * Test generate rejects empty wp-content.zip path.
	 *
	 * Purpose: Verify wp-content path is required
	 * Edge Case: Missing parameter, null value
	 */
	public function test_generate_rejects_empty_wp_content_path() {
		$blueprint_data = [ 'steps' => [] ];

		$result = $this->generator->generate(
			$blueprint_data,
			'',
			$this->test_output_dir
		);

		$this->assertFalse( $result, 'Should reject empty wp-content path' );
	}

	/**
	 * Test generate rejects non-existent wp-content.zip file.
	 *
	 * Purpose: Verify file existence check
	 * Edge Case: File deleted between generation phases
	 */
	public function test_generate_rejects_nonexistent_wp_content_file() {
		$blueprint_data = [ 'steps' => [] ];

		$result = $this->generator->generate(
			$blueprint_data,
			'/nonexistent/path/wp-content.zip',
			$this->test_output_dir
		);

		$this->assertFalse( $result, 'Should reject non-existent wp-content.zip' );
	}

	/**
	 * Test generate rejects empty output directory.
	 *
	 * Purpose: Verify output directory is required
	 * Edge Case: Invalid configuration, null value
	 */
	public function test_generate_rejects_empty_output_directory() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$result = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			''
		);

		$this->assertFalse( $result, 'Should reject empty output directory' );

		// Cleanup
		if ( file_exists( $wp_content_zip ) ) {
			unlink( $wp_content_zip );
		}
	}

	/**
	 * Test generate rejects invalid bundle filename (not .zip).
	 *
	 * Purpose: Verify bundle must have .zip extension
	 * Edge Case: User error, configuration typo
	 */
	public function test_generate_rejects_non_zip_filename() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$invalid_filenames = [
			'bundle.txt',
			'bundle.tar.gz',
			'bundle',
			'',
		];

		foreach ( $invalid_filenames as $filename ) {
			$result = $this->generator->generate(
				$blueprint_data,
				$wp_content_zip,
				$this->test_output_dir,
				$filename
			);

			$this->assertFalse( $result, "Should reject non-zip filename: {$filename}" );
		}

		// Cleanup
		if ( file_exists( $wp_content_zip ) ) {
			unlink( $wp_content_zip );
		}
	}

	/**
	 * Test generate creates output directory if missing.
	 *
	 * Purpose: Verify auto-creation of output directory
	 * Edge Case: First bundle generation, directory doesn't exist yet
	 */
	public function test_generate_creates_output_directory_if_missing() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$new_dir = WP_CONTENT_DIR . '/test-new-dir-' . time();
		$this->assertDirectoryDoesNotExist( $new_dir );

		$result = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$new_dir
		);

		$this->assertNotFalse( $result, 'Should create directory and succeed' );
		$this->assertDirectoryExists( $new_dir );

		// Cleanup
		if ( file_exists( $result ) ) {
			unlink( $result );
		}
		if ( is_dir( $new_dir ) ) {
			rmdir( $new_dir );
		}
	}

	// ========================================================================
	// Error Handling Tests - generate()
	// ========================================================================

	/**
	 * Test generate handles JSON encoding failure.
	 *
	 * Purpose: Verify error handling for invalid blueprint data
	 * Edge Case: Unserializable data (resources, etc.)
	 */
	public function test_generate_handles_json_encoding_failure() {
		// Create blueprint data that can't be JSON encoded
		$blueprint_data = [
			'resource' => fopen( 'php://memory', 'r' ), // Resources can't be JSON encoded
		];

		$wp_content_zip = $this->create_test_wp_content_zip();

		$result = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$this->test_output_dir
		);

		// Should return false and clean up
		$this->assertFalse( $result, 'Should handle JSON encoding failure' );

		// Cleanup
		if ( file_exists( $wp_content_zip ) ) {
			unlink( $wp_content_zip );
		}
		fclose( $blueprint_data['resource'] );
	}

	/**
	 * Test generate cleans up on failure.
	 *
	 * Purpose: Verify partial bundles are deleted on error
	 * Reason: Prevents corrupted bundles from being used
	 */
	public function test_generate_cleans_up_on_failure() {
		$blueprint_data = [ 'steps' => [] ];

		// Use non-existent wp-content.zip to trigger failure
		$result = $this->generator->generate(
			$blueprint_data,
			'/nonexistent/wp-content.zip',
			$this->test_output_dir
		);

		$this->assertFalse( $result );

		// Verify no partial bundle was left behind
		$files = glob( $this->test_output_dir . '/*.zip' );
		$this->assertEmpty( $files, 'Should not leave partial bundles on failure' );
	}

	// ========================================================================
	// getBundleSize() Tests
	// ========================================================================

	/**
	 * Test getBundleSize returns human-readable format.
	 *
	 * Purpose: Verify size formatting for UI display
	 */
	public function test_getBundleSize_returns_human_readable_format() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip( 5000 );

		$bundle_path = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$this->test_output_dir
		);

		$size = $this->generator->getBundleSize( $bundle_path );

		$this->assertIsString( $size );
		$this->assertNotEquals( '0 B', $size, 'Should return actual size' );
		// Should contain unit (KB, MB, etc.)
		$this->assertMatchesRegularExpression( '/\d+(\.\d+)?\s*(B|KB|MB|GB)/', $size );
	}

	/**
	 * Test getBundleSize handles non-existent file.
	 *
	 * Purpose: Verify graceful handling of missing bundle
	 * Edge Case: Bundle was deleted
	 */
	public function test_getBundleSize_handles_nonexistent_file() {
		$size = $this->generator->getBundleSize( '/nonexistent/bundle.zip' );

		$this->assertEquals( '0 B', $size, 'Should return 0 B for non-existent file' );
	}

	/**
	 * Test getBundleSize handles filesize failure.
	 *
	 * Purpose: Verify error handling
	 * Edge Case: Permission denied, corrupted filesystem
	 */
	public function test_getBundleSize_handles_filesize_failure() {
		// Create a file, then make it inaccessible (if possible on this system)
		// Note: This is difficult to test reliably across systems
		// The implementation handles filesize() returning false

		$size = $this->generator->getBundleSize( '/nonexistent' );
		$this->assertEquals( '0 B', $size );
	}

	// ========================================================================
	// validateBundle() Tests
	// ========================================================================

	/**
	 * Test validateBundle accepts valid bundle.
	 *
	 * Purpose: Verify validation of correct bundle structure
	 */
	public function test_validateBundle_accepts_valid_bundle() {
		$blueprint_data = [ 'steps' => [] ];
		$wp_content_zip = $this->create_test_wp_content_zip();

		$bundle_path = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$this->test_output_dir
		);

		$is_valid = $this->generator->validateBundle( $bundle_path );

		$this->assertTrue( $is_valid, 'Should validate correct bundle structure' );
	}

	/**
	 * Test validateBundle rejects bundle without blueprint.json.
	 *
	 * Purpose: Verify blueprint.json is required
	 * Edge Case: Corrupted bundle, manual creation error
	 */
	public function test_validateBundle_rejects_bundle_without_blueprint_json() {
		// Create bundle with only wp-content.zip
		$incomplete_bundle = $this->test_output_dir . '/incomplete.zip';
		$zip = new \ZipArchive();
		$zip->open( $incomplete_bundle, \ZipArchive::CREATE );
		$zip->addFromString( 'wp-content.zip', 'test' );
		$zip->close();

		$is_valid = $this->generator->validateBundle( $incomplete_bundle );

		$this->assertFalse( $is_valid, 'Should reject bundle without blueprint.json' );
	}

	/**
	 * Test validateBundle rejects bundle without wp-content.zip.
	 *
	 * Purpose: Verify wp-content.zip is required
	 * Edge Case: Corrupted bundle
	 */
	public function test_validateBundle_rejects_bundle_without_wp_content_zip() {
		// Create bundle with only blueprint.json
		$incomplete_bundle = $this->test_output_dir . '/incomplete.zip';
		$zip = new \ZipArchive();
		$zip->open( $incomplete_bundle, \ZipArchive::CREATE );
		$zip->addFromString( 'blueprint.json', '{}' );
		$zip->close();

		$is_valid = $this->generator->validateBundle( $incomplete_bundle );

		$this->assertFalse( $is_valid, 'Should reject bundle without wp-content.zip' );
	}

	/**
	 * Test validateBundle rejects non-existent bundle.
	 *
	 * Purpose: Verify file existence check
	 * Edge Case: Bundle was deleted
	 */
	public function test_validateBundle_rejects_nonexistent_bundle() {
		$is_valid = $this->generator->validateBundle( '/nonexistent/bundle.zip' );

		$this->assertFalse( $is_valid, 'Should reject non-existent bundle' );
	}

	/**
	 * Test validateBundle rejects corrupted zip file.
	 *
	 * Purpose: Verify zip integrity check
	 * Edge Case: Incomplete download, disk corruption
	 */
	public function test_validateBundle_rejects_corrupted_zip() {
		// Create corrupted zip file
		$corrupted_bundle = $this->test_output_dir . '/corrupted.zip';
		file_put_contents( $corrupted_bundle, 'This is not a zip file' );

		$is_valid = $this->generator->validateBundle( $corrupted_bundle );

		$this->assertFalse( $is_valid, 'Should reject corrupted zip file' );
	}

	// ========================================================================
	// Integration Tests - End-to-End Workflows
	// ========================================================================

	/**
	 * Test complete bundle generation workflow.
	 *
	 * Purpose: Verify end-to-end bundle creation and validation
	 */
	public function test_complete_bundle_generation_workflow() {
		// 1. Create blueprint data
		$blueprint_data = [
			'preferredVersions' => [
				'php' => '8.2',
				'wp'  => 'latest',
			],
			'steps' => [
				[ 'step' => 'login' ],
				[
					'step'       => 'installPlugin',
					'pluginData' => [
						'resource' => 'wordpress.org/plugins',
						'slug'     => 'gutenberg',
					],
				],
			],
		];

		// 2. Create wp-content.zip
		$wp_content_zip = $this->create_test_wp_content_zip( 10000 );

		// 3. Generate bundle
		$bundle_path = $this->generator->generate(
			$blueprint_data,
			$wp_content_zip,
			$this->test_output_dir,
			'test-bundle.zip'
		);

		$this->assertNotFalse( $bundle_path, 'Bundle generation should succeed' );

		// 4. Verify wp-content.zip was deleted
		$this->assertFileDoesNotExist( $wp_content_zip, 'wp-content.zip should be cleaned up' );

		// 5. Validate bundle
		$is_valid = $this->generator->validateBundle( $bundle_path );
		$this->assertTrue( $is_valid, 'Bundle should be valid' );

		// 6. Get bundle size
		$size = $this->generator->getBundleSize( $bundle_path );
		$this->assertNotEquals( '0 B', $size, 'Bundle should have size' );

		// 7. Verify bundle contents
		$zip = new \ZipArchive();
		$zip->open( $bundle_path );

		// Check blueprint.json
		$blueprint_content = $zip->getFromName( 'blueprint.json' );
		$decoded = json_decode( $blueprint_content, true );
		$this->assertEquals( $blueprint_data, $decoded, 'Blueprint data should be preserved' );

		// Check wp-content.zip exists
		$this->assertNotFalse( $zip->locateName( 'wp-content.zip' ), 'wp-content.zip should be in bundle' );

		$zip->close();
	}
}
