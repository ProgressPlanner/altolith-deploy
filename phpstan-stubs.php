<?php
/**
 * PHPStan stubs for WP-CLI classes and plugin constants.
 *
 * These stubs allow PHPStan to analyze code that uses WP-CLI
 * without requiring WP-CLI to be installed.
 */

// Define plugin constants for PHPStan analysis.
if (!\defined('AETHER_EXPORTS_DIR')) {
	\define('AETHER_EXPORTS_DIR', '');
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

// WP-CLI Command base class.
if (!\class_exists('WP_CLI_Command')) {
	class WP_CLI_Command
	{
		/**
		 * Invoke command.
		 *
		 * @param array $args Positional arguments.
		 * @param array $assoc_args Associative arguments.
		 * @return void
		 */
		public function __invoke($args, $assoc_args)
		{
		}
	}
}

// WP-CLI class.
if (!\class_exists('WP_CLI')) {
	class WP_CLI
	{
		/**
		 * Add a command.
		 *
		 * @param string $name Command name.
		 * @param string|callable $callable Command callable.
		 * @param array $args Optional arguments.
		 * @return void
		 */
		public static function add_command($name, $callable, $args = [])
		{
		}

		/**
		 * Log a message.
		 *
		 * @param string $message Message to log.
		 * @return void
		 */
		public static function log($message)
		{
		}

		/**
		 * Display success message.
		 *
		 * @param string $message Success message.
		 * @return void
		 */
		public static function success($message)
		{
		}

		/**
		 * Display error message.
		 *
		 * @param string $message Error message.
		 * @return void
		 */
		public static function error($message)
		{
		}
	}
}
