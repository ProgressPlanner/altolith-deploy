<?php
/**
 * PHPUnit Bootstrap File
 *
 * Loads the WordPress testing environment and initializes the plugin for testing.
 *
 * @package Aether\SiteExporter
 */

// Require Composer autoloader.
require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// Load Yoast PHPUnit Polyfills for cross-version compatibility.
require_once dirname( __DIR__ ) . '/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';

// Define test environment root.
$_test_root = dirname( __DIR__ );

// Path to the WordPress tests directory.
// Use environment variable if set (CI), otherwise use wp-phpunit package (local).
if ( ! defined( 'WP_TESTS_DIR' ) ) {
	$_tests_dir = getenv( 'WP_TESTS_DIR' );
	if ( ! $_tests_dir ) {
		$_tests_dir = dirname( __DIR__ ) . '/vendor/wp-phpunit/wp-phpunit';
	}
	define( 'WP_TESTS_DIR', $_tests_dir );
}

// Look for wp-tests-config.php in the WordPress tests directory or plugin root.
if ( file_exists( WP_TESTS_DIR . '/wp-tests-config.php' ) ) {
	define( 'WP_TESTS_CONFIG_FILE_PATH', WP_TESTS_DIR . '/wp-tests-config.php' );
} elseif ( file_exists( $_test_root . '/wp-tests-config.php' ) ) {
	define( 'WP_TESTS_CONFIG_FILE_PATH', $_test_root . '/wp-tests-config.php' );
}

// Load WordPress test functions.
require_once WP_TESTS_DIR . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	require dirname( __DIR__ ) . '/aether-site-exporter.php';
}

tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WordPress testing environment.
require WP_TESTS_DIR . '/includes/bootstrap.php';
