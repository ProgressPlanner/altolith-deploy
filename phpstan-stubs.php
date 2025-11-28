<?php
/**
 * PHPStan stubs for WP-CLI classes and plugin constants.
 *
 * These stubs allow PHPStan to analyze code that uses WP-CLI
 * without requiring WP-CLI to be installed.
 */

// Define plugin constants for PHPStan analysis.
if (!\defined('ALTOLITH_PLUGIN_URL')) {
	\define('ALTOLITH_PLUGIN_URL', '');
}

// WordPress cookie constants for PHPStan analysis.
if (!\defined('AUTH_COOKIE')) {
	\define('AUTH_COOKIE', 'wordpress_');
}
if (!\defined('SECURE_AUTH_COOKIE')) {
	\define('SECURE_AUTH_COOKIE', 'wordpress_sec_');
}
if (!\defined('PLUGINS_COOKIE_PATH')) {
	\define('PLUGINS_COOKIE_PATH', '/wp-content/plugins');
}
if (!\defined('COOKIE_DOMAIN')) {
	\define('COOKIE_DOMAIN', '');
}
if (!\defined('ADMIN_COOKIE_PATH')) {
	\define('ADMIN_COOKIE_PATH', '/wp-admin');
}
if (!\defined('LOGGED_IN_COOKIE')) {
	\define('LOGGED_IN_COOKIE', 'wordpress_logged_in_');
}
if (!\defined('COOKIEPATH')) {
	\define('COOKIEPATH', '');
}
if (!\defined('SITECOOKIEPATH')) {
	\define('SITECOOKIEPATH', '');
}
