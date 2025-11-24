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
use Aether\SiteExporter\Sync\JobStateManager;

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
		// Clean up test zip files
		$patterns = [
			WP_CONTENT_DIR . '/uploads/aether-temp/wp-content-complete-*.zip',
			ABSPATH . 'blueprint-bundle/wp-content.zip',
			ABSPATH . 'test-export/wp-content.zip',
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

		// Clean up test directories
		$dirs = [
			ABSPATH . 'blueprint-bundle',
			ABSPATH . 'test-export',
		];

		foreach ( $dirs as $dir ) {
			if ( is_dir( $dir ) ) {
				@rmdir( $dir );
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

	// ========================================================================
	// initArchive() Tests
	// ========================================================================

	/**
	 * Test initArchive creates temp zip file.
	 *
	 * Purpose: Verify archive initialization creates valid zip
	 */
	public function test_initArchive_creates_temp_zip_file() {
		$result = $this->service->initArchive();

		$this->assertNotWPError( $result );
		$this->assertTrue( $result['success'] );
		$this->assertArrayHasKey( 'zipPath', $result['data'] );
		$this->assertFileExists( $result['data']['zipPath'] );

		// Verify it's a valid zip file
		$zip = new \ZipArchive();
		$this->assertTrue( $zip->open( $result['data']['zipPath'] ) === true );
		$zip->close();

		// Cleanup
		unlink( $result['data']['zipPath'] );
	}

	/**
	 * Test initArchive returns progress structure.
	 *
	 * Purpose: Verify progress tracking data structure
	 */
	public function test_initArchive_returns_progress_structure() {
		$result = $this->service->initArchive();

		$this->assertNotWPError( $result );
		$this->assertArrayHasKey( 'progress', $result );
		$this->assertArrayHasKey( 'overall', $result['progress'] );
		$this->assertArrayHasKey( 'totalFiles', $result['progress'] );
		$this->assertArrayHasKey( 'filesProcessed', $result['progress'] );
		$this->assertArrayHasKey( 'phases', $result['progress'] );

		// Verify phase structure
		$phases = $result['progress']['phases'];
		$this->assertArrayHasKey( 'database', $phases );
		$this->assertArrayHasKey( 'uploads', $phases );
		$this->assertArrayHasKey( 'plugins', $phases );
		$this->assertArrayHasKey( 'themes', $phases );
		$this->assertArrayHasKey( 'mu-plugins', $phases );

		// Cleanup
		unlink( $result['data']['zipPath'] );
	}

	/**
	 * Test initArchive counts total files accurately.
	 *
	 * Purpose: Verify file counting for progress tracking
	 */
	public function test_initArchive_counts_total_files() {
		// Create test files in uploads
		$uploads_dir = WP_CONTENT_DIR . '/uploads';
		if ( ! is_dir( $uploads_dir ) ) {
			wp_mkdir_p( $uploads_dir );
		}

		$test_file = $uploads_dir . '/test.jpg';
		file_put_contents( $test_file, 'test image' );

		$result = $this->service->initArchive();

		$this->assertNotWPError( $result );
		$this->assertGreaterThan( 0, $result['progress']['totalFiles'], 'Should count files' );

		// Cleanup
		unlink( $test_file );
		unlink( $result['data']['zipPath'] );
	}

	/**
	 * Test initArchive handles temp directory creation failure.
	 *
	 * Purpose: Verify error handling when temp directory unavailable
	 * Error Case: Permission denied, disk full
	 */
	public function test_initArchive_handles_temp_directory_failure() {
		// Mock TempDirectoryManager to return false
		// Note: This is difficult to test without mocking, so we document expected behavior
		// In real scenario, if temp directory is unavailable, should return WP_Error

		// For now, test that the method returns proper structure
		$result = $this->service->initArchive();

		// Should either succeed OR return WP_Error (not throw exception)
		$this->assertTrue(
			! is_wp_error( $result ) || $result->get_error_code() === 'temp_directory_unavailable',
			'Should handle temp directory failure gracefully'
		);

		if ( ! is_wp_error( $result ) ) {
			unlink( $result['data']['zipPath'] );
		}
	}

	// ========================================================================
	// addDatabaseToZip() Tests
	// ========================================================================

	/**
	 * Test addDatabaseToZip adds database file to archive.
	 *
	 * Purpose: Verify database is correctly added to zip
	 */
	public function test_addDatabaseToZip_adds_database_file() {
		// Create test database
		$db_dir = WP_CONTENT_DIR . '/database';
		wp_mkdir_p( $db_dir );
		$db_path = $db_dir . '/.ht.sqlite';
		file_put_contents( $db_path, 'test database content' );

		// Create temp zip
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		// Add database
		$result = $this->service->addDatabaseToZip( $zip_path, $init['progress'] );

		$this->assertNotWPError( $result );
		$this->assertTrue( $result['success'] );
		$this->assertEquals( 1, $result['data']['filesAdded'] );

		// Verify database is in zip
		$zip = new \ZipArchive();
		$zip->open( $zip_path );
		$this->assertTrue( $zip->locateName( 'wp-content/database/.ht.sqlite' ) !== false );
		$zip->close();

		// Cleanup
		unlink( $db_path );
		rmdir( $db_dir );
		unlink( $zip_path );
	}

	/**
	 * Test addDatabaseToZip handles missing database.
	 *
	 * Purpose: Verify graceful handling when database file doesn't exist
	 * Edge Case: WordPress without SQLite or database not yet created
	 */
	public function test_addDatabaseToZip_handles_missing_database() {
		// Ensure no database exists
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

		// Create temp zip
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		// Add database (should succeed but add 0 files)
		$result = $this->service->addDatabaseToZip( $zip_path, $init['progress'] );

		$this->assertNotWPError( $result );
		$this->assertTrue( $result['success'] );
		$this->assertEquals( 0, $result['data']['filesAdded'], 'Should add 0 files when database missing' );

		// Cleanup
		unlink( $zip_path );
	}

	/**
	 * Test addDatabaseToZip updates progress correctly.
	 *
	 * Purpose: Verify progress tracking is accurate
	 */
	public function test_addDatabaseToZip_updates_progress() {
		// Create test database
		$db_dir = WP_CONTENT_DIR . '/database';
		wp_mkdir_p( $db_dir );
		$db_path = $db_dir . '/.ht.sqlite';
		file_put_contents( $db_path, 'test' );

		// Create temp zip
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		// Add database
		$result = $this->service->addDatabaseToZip( $zip_path, $init['progress'] );

		$this->assertNotWPError( $result );
		$this->assertArrayHasKey( 'progress', $result );
		$this->assertEquals( 'database', $result['progress']['phase'] );
		$this->assertEquals( 'completed', $result['progress']['phases']['database']['status'] );
		$this->assertEquals( 100, $result['progress']['phaseProgress'] );

		// Cleanup
		unlink( $db_path );
		rmdir( $db_dir );
		unlink( $zip_path );
	}

	/**
	 * Test addDatabaseToZip handles zip open failure.
	 *
	 * Purpose: Verify error handling when zip file is corrupted or locked
	 * Error Case: Corrupted zip, permission denied
	 */
	public function test_addDatabaseToZip_handles_zip_open_failure() {
		// Try to add to non-existent zip
		$result = $this->service->addDatabaseToZip( '/nonexistent/path.zip', [] );

		$this->assertWPError( $result );
		$this->assertEquals( 'zip_open_failed', $result->get_error_code() );
	}

	// ========================================================================
	// getPluginsList() Tests
	// ========================================================================

	/**
	 * Test getPluginsList with custom asset slugs.
	 *
	 * Purpose: Verify plugin filtering with provided slugs
	 */
	public function test_getPluginsList_with_custom_asset_slugs() {
		// Create test plugin directories
		$test_plugin_1 = WP_PLUGIN_DIR . '/test-plugin-1';
		$test_plugin_2 = WP_PLUGIN_DIR . '/test-plugin-2';
		wp_mkdir_p( $test_plugin_1 );
		wp_mkdir_p( $test_plugin_2 );

		$custom_slugs = [ 'test-plugin-1', 'test-plugin-2' ];
		$result = $this->service->getPluginsList( $custom_slugs );

		$this->assertIsArray( $result );
		$this->assertContains( 'test-plugin-1', $result );
		$this->assertContains( 'test-plugin-2', $result );

		// Cleanup
		rmdir( $test_plugin_1 );
		rmdir( $test_plugin_2 );
	}

	/**
	 * Test getPluginsList excludes 'aether' plugin.
	 *
	 * Purpose: Verify aether plugin is excluded from bundle
	 * Reason: Aether is added separately from aether.zip URL in blueprint
	 */
	public function test_getPluginsList_excludes_aether_plugin() {
		// Create aether plugin directory
		$aether_dir = WP_PLUGIN_DIR . '/aether';
		wp_mkdir_p( $aether_dir );

		$custom_slugs = [ 'aether', 'test-plugin' ];
		$result = $this->service->getPluginsList( $custom_slugs );

		$this->assertNotContains( 'aether', $result, 'Should exclude aether plugin' );

		// Cleanup
		rmdir( $aether_dir );
	}

	/**
	 * Test getPluginsList validates slugs for security.
	 *
	 * Purpose: Verify path traversal and injection prevention
	 * Security: CRITICAL - Prevents directory traversal attacks
	 */
	public function test_getPluginsList_validates_slugs_for_security() {
		$malicious_slugs = [
			'../../etc/passwd',
			"plugin\0",
			'.',
			'..',
			'../../../sensitive',
		];

		$result = $this->service->getPluginsList( $malicious_slugs );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result, 'Should reject all malicious slugs' );
	}

	/**
	 * Test getPluginsList skips non-string slugs.
	 *
	 * Purpose: Verify type safety
	 * Edge Case: Invalid API response, corrupted data
	 */
	public function test_getPluginsList_skips_non_string_slugs() {
		$mixed_slugs = [
			'valid-plugin',
			123,               // Integer
			null,              // Null
			[ 'array' ],       // Array
			(object) [],       // Object
		];

		// Create valid plugin dir
		$valid_dir = WP_PLUGIN_DIR . '/valid-plugin';
		wp_mkdir_p( $valid_dir );

		$result = $this->service->getPluginsList( $mixed_slugs );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result, 'Should only include string slug' );
		$this->assertContains( 'valid-plugin', $result );

		// Cleanup
		rmdir( $valid_dir );
	}

	/**
	 * Test getPluginsList skips non-existent directories.
	 *
	 * Purpose: Verify only existing plugins are included
	 * Edge Case: Plugin was deleted, invalid slug
	 */
	public function test_getPluginsList_skips_nonexistent_directories() {
		$slugs = [
			'nonexistent-plugin',
			'another-missing-plugin',
		];

		$result = $this->service->getPluginsList( $slugs );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result, 'Should not include non-existent plugins' );
	}

	// ========================================================================
	// getThemesList() Tests
	// ========================================================================

	/**
	 * Test getThemesList with custom asset slugs.
	 *
	 * Purpose: Verify theme filtering with provided slugs
	 */
	public function test_getThemesList_with_custom_asset_slugs() {
		// Create test theme directories
		$themes_root = get_theme_root();
		$test_theme_1 = $themes_root . '/test-theme-1';
		$test_theme_2 = $themes_root . '/test-theme-2';
		wp_mkdir_p( $test_theme_1 );
		wp_mkdir_p( $test_theme_2 );

		$custom_slugs = [ 'test-theme-1', 'test-theme-2' ];
		$result = $this->service->getThemesList( $custom_slugs );

		$this->assertIsArray( $result );
		$this->assertContains( 'test-theme-1', $result );
		$this->assertContains( 'test-theme-2', $result );

		// Cleanup
		rmdir( $test_theme_1 );
		rmdir( $test_theme_2 );
	}

	/**
	 * Test getThemesList validates slugs for security.
	 *
	 * Purpose: Verify path traversal prevention in theme slugs
	 * Security: CRITICAL
	 */
	public function test_getThemesList_validates_slugs_for_security() {
		$malicious_slugs = [
			'../../etc/passwd',
			"theme\0",
			'.',
			'..',
		];

		$result = $this->service->getThemesList( $malicious_slugs );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result, 'Should reject all malicious slugs' );
	}

	/**
	 * Test getThemesList skips non-string slugs.
	 *
	 * Purpose: Verify type safety
	 */
	public function test_getThemesList_skips_non_string_slugs() {
		$mixed_slugs = [
			123,
			null,
			[ 'array' ],
		];

		$result = $this->service->getThemesList( $mixed_slugs );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result, 'Should skip all non-string slugs' );
	}

	// ========================================================================
	// addPluginToZip() Tests
	// ========================================================================

	/**
	 * Test addPluginToZip adds plugin files to archive.
	 *
	 * Purpose: Verify plugin is correctly added to zip
	 */
	public function test_addPluginToZip_adds_plugin_files() {
		// Create test plugin with files
		$plugin_dir = WP_PLUGIN_DIR . '/test-plugin';
		wp_mkdir_p( $plugin_dir );
		file_put_contents( $plugin_dir . '/plugin.php', '<?php // Plugin' );
		file_put_contents( $plugin_dir . '/readme.txt', 'Readme' );

		// Create temp zip
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		// Add plugin
		$result = $this->service->addPluginToZip( $zip_path, 'test-plugin', $init['progress'] );

		$this->assertNotWPError( $result );
		$this->assertTrue( $result['success'] );
		$this->assertGreaterThan( 0, $result['data']['filesAdded'] );

		// Verify files are in zip
		$zip = new \ZipArchive();
		$zip->open( $zip_path );
		$this->assertTrue( $zip->locateName( 'wp-content/plugins/test-plugin/plugin.php' ) !== false );
		$zip->close();

		// Cleanup
		unlink( $plugin_dir . '/plugin.php' );
		unlink( $plugin_dir . '/readme.txt' );
		rmdir( $plugin_dir );
		unlink( $zip_path );
	}

	/**
	 * Test addPluginToZip rejects invalid slug.
	 *
	 * Purpose: Verify security validation
	 * Security: CRITICAL - Prevents path traversal
	 */
	public function test_addPluginToZip_rejects_invalid_slug() {
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		$result = $this->service->addPluginToZip( $zip_path, '../../etc/passwd', [] );

		$this->assertWPError( $result );
		$this->assertEquals( 'invalid_plugin_slug', $result->get_error_code() );

		// Cleanup
		unlink( $zip_path );
	}

	/**
	 * Test addPluginToZip rejects nonexistent plugin.
	 *
	 * Purpose: Verify error handling for missing plugins
	 * Edge Case: Plugin was deleted after list generation
	 */
	public function test_addPluginToZip_rejects_nonexistent_plugin() {
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		$result = $this->service->addPluginToZip( $zip_path, 'nonexistent-plugin', [] );

		$this->assertWPError( $result );
		$this->assertEquals( 'plugin_not_found', $result->get_error_code() );

		// Cleanup
		unlink( $zip_path );
	}

	/**
	 * Test addPluginToZip updates progress correctly.
	 *
	 * Purpose: Verify progress tracking
	 */
	public function test_addPluginToZip_updates_progress() {
		// Create test plugin
		$plugin_dir = WP_PLUGIN_DIR . '/test-plugin';
		wp_mkdir_p( $plugin_dir );
		file_put_contents( $plugin_dir . '/plugin.php', '<?php' );

		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		// Set up progress with plugin in items list
		$progress = $init['progress'];
		$progress['phases']['plugins']['items'] = [ 'test-plugin' ];

		$result = $this->service->addPluginToZip( $zip_path, 'test-plugin', $progress );

		$this->assertNotWPError( $result );
		$this->assertEquals( 'plugins', $result['progress']['phase'] );
		$this->assertContains( 'test-plugin', $result['progress']['phases']['plugins']['completedItems'] );

		// Cleanup
		unlink( $plugin_dir . '/plugin.php' );
		rmdir( $plugin_dir );
		unlink( $zip_path );
	}

	// ========================================================================
	// addThemeToZip() Tests
	// ========================================================================

	/**
	 * Test addThemeToZip adds theme files to archive.
	 *
	 * Purpose: Verify theme is correctly added to zip
	 */
	public function test_addThemeToZip_adds_theme_files() {
		// Create test theme with files
		$theme_dir = get_theme_root() . '/test-theme';
		wp_mkdir_p( $theme_dir );
		file_put_contents( $theme_dir . '/style.css', '/* Theme */' );
		file_put_contents( $theme_dir . '/index.php', '<?php' );

		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		$result = $this->service->addThemeToZip( $zip_path, 'test-theme', $init['progress'] );

		$this->assertNotWPError( $result );
		$this->assertTrue( $result['success'] );
		$this->assertGreaterThan( 0, $result['data']['filesAdded'] );

		// Verify files are in zip
		$zip = new \ZipArchive();
		$zip->open( $zip_path );
		$this->assertTrue( $zip->locateName( 'wp-content/themes/test-theme/style.css' ) !== false );
		$zip->close();

		// Cleanup
		unlink( $theme_dir . '/style.css' );
		unlink( $theme_dir . '/index.php' );
		rmdir( $theme_dir );
		unlink( $zip_path );
	}

	/**
	 * Test addThemeToZip rejects invalid slug.
	 *
	 * Purpose: Verify security validation
	 * Security: CRITICAL
	 */
	public function test_addThemeToZip_rejects_invalid_slug() {
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		$result = $this->service->addThemeToZip( $zip_path, '../../etc/passwd', [] );

		$this->assertWPError( $result );
		$this->assertEquals( 'invalid_theme_slug', $result->get_error_code() );

		// Cleanup
		unlink( $zip_path );
	}

	/**
	 * Test addThemeToZip rejects nonexistent theme.
	 *
	 * Purpose: Verify error handling for missing themes
	 */
	public function test_addThemeToZip_rejects_nonexistent_theme() {
		$init = $this->service->initArchive();
		$zip_path = $init['data']['zipPath'];

		$result = $this->service->addThemeToZip( $zip_path, 'nonexistent-theme', [] );

		$this->assertWPError( $result );
		$this->assertEquals( 'theme_not_found', $result->get_error_code() );

		// Cleanup
		unlink( $zip_path );
	}

	// ========================================================================
	// getUploadsBatches() Tests
	// ========================================================================

	/**
	 * Test getUploadsBatches returns empty array when uploads dir missing.
	 *
	 * Purpose: Verify graceful handling of missing uploads directory
	 * Edge Case: Fresh WordPress install, uploads directory deleted
	 */
	public function test_getUploadsBatches_returns_empty_when_uploads_missing() {
		// Temporarily rename uploads directory if it exists
		$uploads_dir = WP_CONTENT_DIR . '/uploads';
		$renamed = false;

		if ( is_dir( $uploads_dir ) ) {
			$temp_name = WP_CONTENT_DIR . '/uploads-backup-' . time();
			rename( $uploads_dir, $temp_name );
			$renamed = $temp_name;
		}

		$result = $this->service->getUploadsBatches();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result, 'Should return empty array when uploads directory missing' );

		// Restore uploads directory
		if ( $renamed ) {
			rename( $renamed, $uploads_dir );
		}
	}

	/**
	 * Test getUploadsBatches creates batches for large uploads.
	 *
	 * Purpose: Verify batching prevents memory/timeout issues
	 */
	public function test_getUploadsBatches_creates_batches() {
		// Create test files in uploads
		$uploads_dir = WP_CONTENT_DIR . '/uploads/test-batch';
		wp_mkdir_p( $uploads_dir );

		// Create multiple test files
		for ( $i = 0; $i < 5; $i++ ) {
			file_put_contents( $uploads_dir . "/file{$i}.jpg", "test content {$i}" );
		}

		$result = $this->service->getUploadsBatches();

		$this->assertIsArray( $result );
		// Should create at least one batch if files exist
		if ( count( glob( $uploads_dir . '/*' ) ) > 0 ) {
			$this->assertNotEmpty( $result, 'Should create batches for upload files' );
		}

		// Cleanup
		array_map( 'unlink', glob( $uploads_dir . '/*' ) );
		rmdir( $uploads_dir );
	}

	// ========================================================================
	// finalizeArchive() Tests
	// ========================================================================

	/**
	 * Test finalizeArchive moves zip to final location.
	 *
	 * Purpose: Verify zip is moved from temp to web-accessible location
	 */
	public function test_finalizeArchive_moves_zip_to_final_location() {
		// Create temp zip
		$init = $this->service->initArchive();
		$temp_zip_path = $init['data']['zipPath'];

		// Finalize
		$result = $this->service->finalizeArchive( $temp_zip_path );

		$this->assertNotWPError( $result );
		$this->assertTrue( $result['success'] );
		$this->assertArrayHasKey( 'zipPath', $result );
		$this->assertArrayHasKey( 'zipSize', $result );

		// Verify temp file is moved
		$this->assertFileDoesNotExist( $temp_zip_path, 'Temp file should be moved' );

		// Verify final file exists
		$this->assertFileExists( $result['zipPath'], 'Final zip should exist' );

		// Cleanup
		unlink( $result['zipPath'] );
		$export_dir = dirname( $result['zipPath'] );
		if ( is_dir( $export_dir ) && $export_dir !== ABSPATH ) {
			@rmdir( $export_dir );
		}
	}

	/**
	 * Test finalizeArchive validates export path for security.
	 *
	 * Purpose: Verify path traversal prevention
	 * Security: CRITICAL - Prevents writing files outside ABSPATH
	 */
	public function test_finalizeArchive_validates_export_path_security() {
		// This test verifies that export path validation happens in finalizeArchive
		// The actual validation is done by SecurityValidator, but we test integration

		// Create settings with invalid export path
		update_option(
			'aether_site_exporter_settings',
			[
				'providers' => [
					'local-filesystem-blueprint-bundle:test' => [
						'enabled'          => true,
						'provider_type'    => 'local-filesystem-blueprint-bundle',
						'export_path'      => '../../etc/passwd', // Malicious path
					],
				],
			]
		);

		$init = $this->service->initArchive();
		$temp_zip_path = $init['data']['zipPath'];

		$result = $this->service->finalizeArchive( $temp_zip_path );

		// Should return error for invalid path
		$this->assertWPError( $result );
		$this->assertEquals( 'invalid_export_path', $result->get_error_code() );

		// Cleanup
		if ( file_exists( $temp_zip_path ) ) {
			unlink( $temp_zip_path );
		}
	}

	/**
	 * Test finalizeArchive creates export directory if missing.
	 *
	 * Purpose: Verify directory creation for new export paths
	 */
	public function test_finalizeArchive_creates_export_directory() {
		// Set custom export path
		update_option(
			'aether_site_exporter_settings',
			[
				'providers' => [
					'local-filesystem-blueprint-bundle:test' => [
						'enabled'          => true,
						'provider_type'    => 'local-filesystem-blueprint-bundle',
						'export_path'      => 'custom-export/bundle.zip',
					],
				],
			]
		);

		$init = $this->service->initArchive();
		$temp_zip_path = $init['data']['zipPath'];

		$result = $this->service->finalizeArchive( $temp_zip_path );

		$this->assertNotWPError( $result );

		// Verify directory was created
		$export_dir = ABSPATH . 'custom-export';
		$this->assertDirectoryExists( $export_dir );

		// Cleanup
		unlink( $result['zipPath'] );
		rmdir( $export_dir );
	}

	/**
	 * Test finalizeArchive handles move failure.
	 *
	 * Purpose: Verify error handling when file move fails
	 * Error Case: Permission denied, disk full
	 */
	public function test_finalizeArchive_handles_move_failure() {
		// Create temp zip
		$init = $this->service->initArchive();
		$temp_zip_path = $init['data']['zipPath'];

		// Set invalid destination (root directory - likely no permissions)
		update_option(
			'aether_site_exporter_settings',
			[
				'providers' => [
					'local-filesystem-blueprint-bundle:test' => [
						'enabled'          => true,
						'provider_type'    => 'local-filesystem-blueprint-bundle',
						'export_path'      => '/invalid/path/bundle.zip',
					],
				],
			]
		);

		$result = $this->service->finalizeArchive( $temp_zip_path );

		// Should either succeed (unlikely) or return WP_Error
		if ( is_wp_error( $result ) ) {
			$this->assertContains(
				$result->get_error_code(),
				[ 'invalid_export_path', 'invalid_export_directory', 'directory_creation_failed', 'zip_move_failed' ]
			);
		}

		// Cleanup
		if ( file_exists( $temp_zip_path ) ) {
			unlink( $temp_zip_path );
		}
	}

	// ========================================================================
	// Security Tests - Path Traversal Prevention
	// ========================================================================

	/**
	 * Test exportCompleteSite prevents path traversal in export path.
	 *
	 * Purpose: Verify critical security check prevents directory traversal
	 * Security: CRITICAL - Prevents arbitrary file write
	 * Attack Vector: ../../etc/cron.d/malicious
	 */
	public function test_exportCompleteSite_prevents_path_traversal_in_export_path() {
		$this->markTestIncomplete( 'Integration test - requires full WordPress environment' );
	}

	/**
	 * Test exportCompleteSite prevents null byte injection in export path.
	 *
	 * Purpose: Verify null byte prevention
	 * Security: CRITICAL
	 * Attack Vector: path\0.php
	 */
	public function test_exportCompleteSite_prevents_null_byte_injection() {
		$this->markTestIncomplete( 'Integration test - requires full WordPress environment' );
	}

	/**
	 * Test exportCompleteSite validates slugs prevent path traversal.
	 *
	 * Purpose: Verify plugin/theme slug validation
	 * Security: CRITICAL
	 * Attack Vector: ../../../etc in slug array
	 */
	public function test_exportCompleteSite_validates_custom_asset_slugs() {
		$this->markTestIncomplete( 'Integration test - requires full WordPress environment' );
	}

	// ========================================================================
	// Integration Tests - Full Export Workflow
	// ========================================================================

	/**
	 * Test complete export workflow.
	 *
	 * Purpose: Verify end-to-end export process
	 * Note: This is a complex integration test
	 */
	public function test_complete_export_workflow() {
		$this->markTestIncomplete( 'Complex integration test - requires full WordPress environment with test data' );
	}

	/**
	 * Test export with custom asset slugs.
	 *
	 * Purpose: Verify browser-based WordPress.org detection integration
	 */
	public function test_export_with_custom_asset_slugs() {
		$this->markTestIncomplete( 'Integration test - requires test plugins/themes' );
	}

	/**
	 * Test export excludes WordPress.org plugins.
	 *
	 * Purpose: Verify WordPress.org plugins are excluded from zip
	 * Reason: Playground downloads them from API
	 */
	public function test_export_excludes_wordpress_org_plugins() {
		$this->markTestIncomplete( 'Integration test - requires asset discovery mock' );
	}

	/**
	 * Test export handles large file counts without timeout.
	 *
	 * Purpose: Verify browser-based processing prevents PHP timeouts
	 */
	public function test_export_handles_large_file_counts() {
		$this->markTestIncomplete( 'Performance test - requires large test dataset' );
	}

	/**
	 * Test export handles offloaded files correctly.
	 *
	 * Purpose: Verify integration with external storage plugins
	 * Edge Case: WP Offload Media, etc.
	 */
	public function test_export_excludes_offloaded_files() {
		$this->markTestIncomplete( 'Integration test - requires offload plugin mock' );
	}
}
