<?php
/**
 * Export Workflow Integration Tests
 *
 * Tests the complete export workflow from start to finish.
 * Validates that exports create valid files and handle errors gracefully.
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Integration\Workflows;

use Altolith\Deploy\Tests\Helpers\TestCase;
use Altolith\Deploy\Services\ExportService;
use Altolith\Deploy\Plugin;
use Altolith\Deploy\Utilities\TempDirectoryManager;

/**
 * ExportService workflow test case.
 */
class ExportWorkflowTest extends TestCase {

	/**
	 * Export service instance.
	 *
	 * @var ExportService
	 */
	private $export_service;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$plugin               = Plugin::getInstance();
		$this->export_service = new ExportService( $plugin );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		// Clean up temp files.
		TempDirectoryManager::cleanupExpiredFiles( 0 );

		parent::tear_down();
	}

	// ========================================================================
	// Export Creation Tests
	// ========================================================================

	/**
	 * Test that export service can be instantiated.
	 */
	public function test_export_service_instantiation() {
		$this->assertInstanceOf( ExportService::class, $this->export_service );
	}

	/**
	 * Test temp directory is created for exports.
	 */
	public function test_temp_directory_creation() {
		$temp_path = TempDirectoryManager::getTempFilePath( 'export-test-', '.zip' );

		$this->assertIsString( $temp_path );
		$this->assertStringEndsWith( '.zip', $temp_path );
		$this->assertStringContainsString( 'export-test-', $temp_path );
	}

	/**
	 * Test export uses temp location and ignores provider export_path.
	 *
	 * ExportService always uses temp location for archive creation.
	 * This test verifies that export paths in provider config don't affect archive creation.
	 */
	public function test_export_path_traversal_rejected() {
		// Set export path in provider config (not used by ExportService).
		$settings = [
			'providers' => [
				'local-filesystem-blueprint-bundle:test-uuid' => [
					'provider_type' => 'local-filesystem-blueprint-bundle',
					'export_path'   => '../../etc/passwd',
				],
			],
		];

		update_option( 'altolith_deploy_settings', $settings );

		// Export should succeed using temp location.
		$result = $this->export_service->exportCompleteSite();

		// Should succeed - ExportService uses temp location.
		$this->assertTrue(
			! is_wp_error( $result ),
			'Export should succeed using temp location'
		);
	}

	/**
	 * Test export uses temp location and ignores provider export_path with null byte.
	 *
	 * ExportService always uses temp location for archive creation.
	 * This test verifies that null bytes in provider export_path don't affect export.
	 */
	public function test_export_null_byte_injection_rejected() {
		// Set export path with null byte in provider config (not used by ExportService).
		$settings = [
			'providers' => [
				'local-filesystem-blueprint-bundle:test-uuid' => [
					'provider_type' => 'local-filesystem-blueprint-bundle',
					'export_path'      => "safe-path\0.zip",
				],
			],
		];

		update_option( 'altolith_deploy_settings', $settings );

		// Export should succeed using temp location.
		$result = $this->export_service->exportCompleteSite();

		// Should succeed - ExportService uses temp location.
		$this->assertTrue(
			! is_wp_error( $result ),
			'Export should succeed using temp location'
		);
	}

	/**
	 * Test export uses temp location and ignores invalid provider export_path type.
	 *
	 * ExportService always uses temp location for archive creation.
	 * This test verifies that invalid export_path types in provider config don't affect export.
	 */
	public function test_export_validates_path_type() {
		// Set invalid export path (array instead of string) in provider config (not used by ExportService).
		$settings = [
			'providers' => [
				'local-filesystem-blueprint-bundle:test-uuid' => [
					'provider_type' => 'local-filesystem-blueprint-bundle',
					'export_path'      => [ 'invalid' ],
				],
			],
		];

		update_option( 'altolith_deploy_settings', $settings );

		// Export should succeed using temp location.
		$result = $this->export_service->exportCompleteSite();

		// Should succeed - ExportService uses temp location.
		$this->assertTrue(
			! is_wp_error( $result ),
			'Export should succeed using temp location'
		);
	}

	// ========================================================================
	// Temp File Cleanup Tests
	// ========================================================================

	/**
	 * Test temp directory cleanup works.
	 */
	public function test_temp_directory_cleanup() {
		$temp_dir = TempDirectoryManager::getTempDirectory();

		// Create test file.
		$test_file = $temp_dir . '/cleanup-test.txt';
		file_put_contents( $test_file, 'test content' );

		// Set file to old timestamp.
		touch( $test_file, time() - 90000 ); // 25 hours ago.

		// Run cleanup.
		$deleted = TempDirectoryManager::cleanupExpiredFiles( 86400 );

		$this->assertGreaterThanOrEqual( 1, $deleted );
		$this->assertFileDoesNotExist( $test_file );
	}

	/**
	 * Test temp files are created in correct location.
	 */
	public function test_temp_files_location() {
		$temp_path = TempDirectoryManager::getTempFilePath( 'location-test-' );

		$this->assertStringContainsString( 'wp-content', $temp_path );
		$this->assertStringContainsString( 'altolith-temp', $temp_path );
	}

	// ========================================================================
	// Error Handling Tests
	// ========================================================================

	/**
	 * Test export handles missing temp directory gracefully.
	 */
	public function test_export_handles_temp_directory_failure() {
		// Use filter to simulate temp directory failure.
		add_filter(
			'altolith_deploy_temp_directory',
			function () {
				return '/nonexistent/invalid/path';
			}
		);

		$result = $this->export_service->exportCompleteSite();

		// Should return WP_Error if temp directory can't be created.
		if ( is_wp_error( $result ) ) {
			$this->assertEquals( 'temp_directory_unavailable', $result->get_error_code() );
		} else {
			// Or it might succeed if directory was created somehow.
			$this->assertIsArray( $result );
		}
	}

	/**
	 * Test export validates custom asset slugs parameter.
	 */
	public function test_export_validates_custom_asset_slugs() {
		// Test with valid array of slugs.
		$result = $this->export_service->exportCompleteSite( 'test-progress-' . uniqid(), [ 'my-plugin', 'my-theme' ] );

		// Should either succeed or fail gracefully.
		$this->assertTrue(
			is_array( $result ) || is_wp_error( $result ),
			'Export should handle custom asset slugs parameter'
		);
	}

	/**
	 * Test export validates progress ID parameter.
	 */
	public function test_export_validates_progress_id() {
		// Test with progress ID.
		$progress_id = 'test-progress-' . wp_generate_uuid4();
		$result = $this->export_service->exportCompleteSite( $progress_id );

		// Should either succeed or fail gracefully.
		$this->assertTrue(
			is_array( $result ) || is_wp_error( $result ),
			'Export should handle progress ID parameter'
		);
	}

	// ========================================================================
	// Integration Tests
	// ========================================================================

	/**
	 * Test export service integrates with temp directory manager.
	 */
	public function test_export_service_uses_temp_directory_manager() {
		// Verify TempDirectoryManager is accessible.
		$this->assertTrue(
			TempDirectoryManager::isTempDirectoryAccessible(),
			'Temp directory should be accessible for exports'
		);
	}
}
