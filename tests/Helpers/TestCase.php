<?php
/**
 * Base Test Case
 *
 * Provides common functionality for all tests in the suite.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Helpers;

use WP_UnitTestCase;

/**
 * Base test case class.
 */
class TestCase extends WP_UnitTestCase {
	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		// Clean up any test data.
		$this->clean_up_test_options();
		$this->clean_up_test_transients();

		parent::tear_down();
	}

	/**
	 * Clean up test options.
	 */
	protected function clean_up_test_options() {
		delete_option( 'aether_site_exporter_settings' );
		delete_option( 'aether_site_exporter_encryption_key' );
	}

	/**
	 * Clean up test transients.
	 */
	protected function clean_up_test_transients() {
		global $wpdb;

		// Delete all aether transients.
		$wpdb->query(
			"DELETE FROM {$wpdb->options}
			WHERE option_name LIKE '_transient_aether_%'
			OR option_name LIKE '_transient_timeout_aether_%'"
		);
	}

	/**
	 * Create a test file in the temp directory.
	 *
	 * @param string $filename Filename.
	 * @param string $content File content.
	 * @return string Full path to created file.
	 */
	protected function create_test_file( $filename, $content = 'test' ) {
		$temp_dir = sys_get_temp_dir() . '/aether-tests';

		if ( ! file_exists( $temp_dir ) ) {
			mkdir( $temp_dir, 0777, true );
		}

		$filepath = $temp_dir . '/' . $filename;
		file_put_contents( $filepath, $content );

		return $filepath;
	}

	/**
	 * Clean up test files.
	 */
	protected function clean_up_test_files() {
		$temp_dir = sys_get_temp_dir() . '/aether-tests';

		if ( ! file_exists( $temp_dir ) ) {
			return;
		}

		$files = glob( $temp_dir . '/*' );
		foreach ( $files as $file ) {
			if ( is_file( $file ) ) {
				unlink( $file );
			}
		}

		rmdir( $temp_dir );
	}

	/**
	 * Assert that a value is a WP_Error.
	 *
	 * @param mixed $actual Value to check.
	 * @param string $message Optional message.
	 */
	public function assertWPError( $actual, $message = '' ) {
		$this->assertInstanceOf( \WP_Error::class, $actual, $message );
	}

	/**
	 * Assert that a value is not a WP_Error.
	 *
	 * @param mixed $actual Value to check.
	 * @param string $message Optional message.
	 */
	public function assertNotWPError( $actual, $message = '' ) {
		if ( is_wp_error( $actual ) ) {
			$message = $message ?: 'Failed asserting that value is not WP_Error. Error: ' . $actual->get_error_message();
		}

		$this->assertNotInstanceOf( \WP_Error::class, $actual, $message );
	}

	/**
	 * Load fixture file.
	 *
	 * @param string $filename Fixture filename.
	 * @return string Fixture content.
	 */
	protected function load_fixture( $filename ) {
		$filepath = dirname( __DIR__ ) . '/Fixtures/' . $filename;

		if ( ! file_exists( $filepath ) ) {
			$this->fail( "Fixture file not found: {$filename}" );
		}

		return file_get_contents( $filepath );
	}

	/**
	 * Create a test admin user and set as current user.
	 *
	 * @return int User ID.
	 */
	protected function act_as_admin() {
		$user_id = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Clear current user (act as logged out).
	 */
	protected function act_as_guest() {
		wp_set_current_user( 0 );
	}
}
