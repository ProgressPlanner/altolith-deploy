<?php
/**
 * WordPress Test Configuration
 *
 * Configuration file for WordPress PHPUnit tests.
 *
 * @package Aether\SiteExporter
 */

// Test database settings - use the actual WordPress database for Local environment.
define( 'DB_NAME', getenv( 'WP_DB_NAME' ) ?: 'local' );
define( 'DB_USER', getenv( 'WP_DB_USER' ) ?: 'root' );
define( 'DB_PASSWORD', getenv( 'WP_DB_PASSWORD' ) ?: 'root' );
define( 'DB_HOST', getenv( 'WP_DB_HOST' ) ?: 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

// Test site settings.
define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'Test Site' );

// PHP binary path.
define( 'WP_PHP_BINARY', 'php' );

// Test table prefix.
$table_prefix = 'wptests_';

// WordPress directory.
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( __FILE__, 4 ) . '/' );
}
