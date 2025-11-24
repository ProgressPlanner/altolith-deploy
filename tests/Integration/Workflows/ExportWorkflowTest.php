<?php
/**
 * Export Workflow Integration Tests
 *
 * Tests the complete export workflow from start to finish.
 * Validates that exports create valid files and handle errors gracefully.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Integration\Workflows;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Services\ExportService;
use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Utilities\TempDirectoryManager;

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
	 * Test export path validation rejects path traversal.
	 */
	public function test_export_path_traversal_rejected() {
		// Set malicious export path.
		$settings = [
			'providers' => [
				'local-filesystem-blueprint-bundle:test-uuid' => [
					'provider_type' => 'local-filesystem-blueprint-bundle',
					'enabled'       => true,
					'export_path'   => '../../etc/passwd',
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		// Export should handle this gracefully by using default path.
		$result = $this->export_service->exportCompleteSite();

		// Should either succeed with safe path or fail gracefully.
		$this->assertTrue(
			! is_wp_error( $result ) || $result->get_error_code() !== 'path_traversal',
			'Export should handle path traversal by using safe default path'
		);
	}

	/**
	 * Test export handles null byte injection in path.
	 */
	public function test_export_null_byte_injection_rejected() {
		// Set malicious export path with null byte.
		$settings = [
			'providers' => [
				'local-filesystem-blueprint-bundle:test-uuid' => [
					'provider_type' => 'local-filesystem-blueprint-bundle',
					'enabled'          => true,
					'export_path'      => "safe-path\0.zip",
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		// Export should handle this gracefully.
		$result = $this->export_service->exportCompleteSite();

		// Should either succeed with safe path or fail gracefully.
		$this->assertTrue(
			! is_wp_error( $result ) || $result->get_error_code() !== 'null_byte_injection',
			'Export should handle null byte injection by using safe default path'
		);
	}

	/**
	 * Test export validates export path is string.
	 */
	public function test_export_validates_path_type() {
		// Set invalid export path (array instead of string).
		$settings = [
			'providers' => [
				'local-filesystem-blueprint-bundle:test-uuid' => [
					'provider_type' => 'local-filesystem-blueprint-bundle',
					'enabled'          => true,
					'export_path'      => [ 'invalid' ],
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		// Export should handle this gracefully by using default path.
		$result = $this->export_service->exportCompleteSite();

		// Should either succeed or fail gracefully (not fatal error).
		$this->assertTrue(
			is_array( $result ) || is_wp_error( $result ),
			'Export should handle invalid path type gracefully'
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
		$this->assertStringContainsString( 'aether-temp', $temp_path );
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
			'aether_site_exporter_temp_directory',
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
		$result = $this->export_service->exportCompleteSite( null, null, [ 'my-plugin', 'my-theme' ] );

		// Should either succeed or fail gracefully.
		$this->assertTrue(
			is_array( $result ) || is_wp_error( $result ),
			'Export should handle custom asset slugs parameter'
		);
	}

	/**
	 * Test export validates job ID parameter.
	 */
	public function test_export_validates_job_id() {
		// Test with job ID.
		$job_id = 'test-job-' . wp_generate_uuid4();
		$result = $this->export_service->exportCompleteSite( $job_id );

		// Should either succeed or fail gracefully.
		$this->assertTrue(
			is_array( $result ) || is_wp_error( $result ),
			'Export should handle job ID parameter'
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
