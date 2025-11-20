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

// Look for wp-tests-config.php in the plugin root.
if ( file_exists( $_test_root . '/wp-tests-config.php' ) ) {
	define( 'WP_TESTS_CONFIG_FILE_PATH', $_test_root . '/wp-tests-config.php' );
}

// Path to the WordPress tests directory - use wp-phpunit package.
if ( ! defined( 'WP_TESTS_DIR' ) ) {
	define( 'WP_TESTS_DIR', dirname( __DIR__ ) . '/vendor/wp-phpunit/wp-phpunit' );
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
