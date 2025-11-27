<?php
/**
 * Export Service Tests
 *
 * Comprehensive tests for ExportService - the core business logic for exporting WordPress sites.
 * This is critical functionality that handles database + wp-content exports.
 *
 * Quality Standards:
 * - Tests must catch real export failures and data loss scenarios
 * - Must test all security validations (path traversal, injection)
 * - Must test all export phases and edge cases
 * - Must test progress tracking accuracy
 * - Must fail if implementation allows ANY security bypass or data corruption
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Services;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Services\ExportService;
use Aether\SiteExporter\Plugin;

/**
 * Export service test case.
 */
class ExportServiceTest extends TestCase {

	/**
	 * Export service instance.
	 *
	 * @var ExportService
	 */
	private $service;

	/**
	 * Plugin instance (mock).
	 *
	 * @var \PHPUnit\Framework\MockObject\MockObject|Plugin
	 */
	private $plugin_mock;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Create plugin mock
		$this->plugin_mock = $this->createMock( Plugin::class );

		// Create service instance
		$this->service = new ExportService( $this->plugin_mock );

		// Ensure temp directory exists
		$temp_dir = WP_CONTENT_DIR . '/uploads/aether-temp';
		if ( ! is_dir( $temp_dir ) ) {
			wp_mkdir_p( $temp_dir );
		}

		// Clean up any existing test exports
		$this->clean_up_test_exports();
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		$this->clean_up_test_exports();
		$this->clean_up_test_files();
		parent::tear_down();
	}

	/**
	 * Clean up test exports.
	 */
	private function clean_up_test_exports() {
		// Clean up test zip files from temp directory
		// ExportService now always uses temp location for wp-content.zip
		$patterns = [
			WP_CONTENT_DIR . '/uploads/aether-temp/wp-content-complete-*.zip',
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

	// ========================================================================
	// getDatabasePath() Tests
	// ========================================================================

	/**
	 * Test getDatabasePath returns standard SQLite path.
	 *
	 * Purpose: Verify database file is found in standard location
	 */
	public function test_getDatabasePath_returns_standard_path() {
		// Create test database file in standard location
		$db_dir = WP_CONTENT_DIR . '/database';
		if ( ! is_dir( $db_dir ) ) {
			wp_mkdir_p( $db_dir );
		}

		$db_path = $db_dir . '/.ht.sqlite';
		file_put_contents( $db_path, 'test database' );

		$result = $this->service->getDatabasePath();

		$this->assertEquals( $db_path, $result );

		// Cleanup
		unlink( $db_path );
		rmdir( $db_dir );
	}

	/**
	 * Test getDatabasePath checks alternative locations.
	 *
	 * Purpose: Verify fallback to alternative database locations
	 */
	public function test_getDatabasePath_checks_alternative_locations() {
		// Create test database in alternative location
		$alt_path = WP_CONTENT_DIR . '/database.sqlite';
		file_put_contents( $alt_path, 'test database' );

		$result = $this->service->getDatabasePath();

		$this->assertEquals( $alt_path, $result );

		// Cleanup
		unlink( $alt_path );
	}

	/**
	 * Test getDatabasePath returns false when database not found.
	 *
	 * Purpose: Verify proper handling of missing database
	 * Edge Case: WordPress without SQLite plugin
	 */
	public function test_getDatabasePath_returns_false_when_not_found() {
		// Ensure no database files exist
		$paths = [
			WP_CONTENT_DIR . '/database/.ht.sqlite',
			WP_CONTENT_DIR . '/database/wordpress.db',
			WP_CONTENT_DIR . '/database.sqlite',
			WP_CONTENT_DIR . '/.ht.sqlite',
		];

		foreach ( $paths as $path ) {
			if ( file_exists( $path ) ) {
				unlink( $path );
			}
		}

		$result = $this->service->getDatabasePath();

		$this->assertFalse( $result, 'Should return false when database not found' );
	}

}
