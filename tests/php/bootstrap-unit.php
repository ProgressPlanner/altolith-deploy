<?php
/**
 * PHPUnit bootstrap file for unit tests
 *
 * Unit tests use WP_UnitTestCase with the WordPress test suite.
 *
 * @package AetherSiteExporter
 */

// Load composer autoloader.
require_once dirname( dirname( __DIR__ ) ) . '/vendor/autoload.php';

// Load WordPress test environment.
$tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $tests_dir ) {
	$tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( $tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find $tests_dir/includes/functions.php\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo "Run: bash bin/install-wp-tests.sh wordpress_test root '' localhost latest\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once $tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 *
 * @since 1.0.0
 * @return void
 */
function manually_load_plugin(): void {
	require dirname( dirname( __DIR__ ) ) . '/aether-site-exporter.php';
}

tests_add_filter( 'muplugins_loaded', 'manually_load_plugin' );

// Start up the WP testing environment.
require $tests_dir . '/includes/bootstrap.php';
