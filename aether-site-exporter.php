<?php

/**
 * Plugin Name: Aether Site Exporter
 * Plugin URI: https://github.com/aristath/aether-site-exporter
 * Description: Export WordPress sites as static HTML or WordPress Playground blueprint bundles. Converts MySQL to SQLite for Playground compatibility.
 * Version: 1.0.0
 * Author: Ari Stathopoulos
 * Author URI: https://aristath.github.io
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: aether-site-exporter
 * Domain Path: /languages
 * Requires at least: 6.4
 * Requires PHP: 7.4
 *
 * @package AetherSiteExporter
 */

declare(strict_types=1);

namespace AetherSiteExporter;

// Exit if accessed directly.
if (! \defined('ABSPATH')) {
	exit;
}

// Define plugin constants.
\define('AETHER_SITE_EXPORTER_VERSION', '1.0.0');
\define('AETHER_SITE_EXPORTER_PLUGIN_FILE', __FILE__);
\define('AETHER_SITE_EXPORTER_PLUGIN_DIR', \plugin_dir_path(__FILE__));
\define('AETHER_SITE_EXPORTER_PLUGIN_URL', \plugin_dir_url(__FILE__));
\define('AETHER_SITE_EXPORTER_PLUGIN_BASENAME', \plugin_basename(__FILE__));

// Exports directory (wp-content/aether-exports).
if (! \defined('AETHER_EXPORTS_DIR')) {
	\define('AETHER_EXPORTS_DIR', WP_CONTENT_DIR . '/aether-exports');
}

// PSR-4 autoloader.
\spl_autoload_register(
	function ($class) {
		// Only autoload classes in our namespace.
		$prefix = 'AetherSiteExporter\\';
		$len    = \strlen($prefix);

		if (\strncmp($prefix, $class, $len) !== 0) {
			return;
		}

		// Get the relative class name.
		$relative_class = \substr($class, $len);

		// Convert namespace separators to directory separators.
		$file = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'includes/' . \str_replace('\\', '/', $relative_class) . '.php';

		// Require the file if it exists.
		if (\file_exists($file)) {
			require $file;
		}
	}
);

/**
 * Initialize the plugin.
 *
 * @since 1.0.0
 * @return void
 */
function init(): void
{
	// Load plugin instance.
	Plugin::get_instance();
}

\add_action('plugins_loaded', __NAMESPACE__ . '\\init');

/**
 * Activation hook.
 *
 * @since 1.0.0
 * @return void
 */
function activate(): void
{
	// Create exports directory.
	if (! \file_exists(AETHER_EXPORTS_DIR)) {
		\wp_mkdir_p(AETHER_EXPORTS_DIR);
	}

	// Create .htaccess to protect exports directory.
	$htaccess_file = AETHER_EXPORTS_DIR . '/.htaccess';
	if (! \file_exists($htaccess_file)) {
		$htaccess_content = "# Protect Aether exports directory\n";
		$htaccess_content .= "Order deny,allow\n";
		$htaccess_content .= "Deny from all\n";
		\file_put_contents($htaccess_file, $htaccess_content); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_put_contents_file_put_contents
	}

	// Create database table for export jobs.
	global $wpdb;

	$table_name      = $wpdb->prefix . 'aether_export_jobs';
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE IF NOT EXISTS $table_name (
		id varchar(255) NOT NULL,
		status varchar(20) NOT NULL DEFAULT 'pending',
		current_step varchar(50) DEFAULT NULL,
		workflow_state longtext DEFAULT NULL,
		config longtext DEFAULT NULL,
		error_message text DEFAULT NULL,
		created_at datetime NOT NULL,
		updated_at datetime NOT NULL,
		PRIMARY KEY (id),
		KEY status (status),
		KEY created_at (created_at)
	) $charset_collate;";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	\dbDelta($sql);

	// Flush rewrite rules.
	\flush_rewrite_rules();
}

\register_activation_hook(__FILE__, __NAMESPACE__ . '\\activate');

/**
 * Deactivation hook.
 *
 * @since 1.0.0
 * @return void
 */
function deactivate(): void
{
	// Flush rewrite rules.
	\flush_rewrite_rules();
}

\register_deactivation_hook(__FILE__, __NAMESPACE__ . '\\deactivate');

/**
 * Uninstall hook (optional - clean up data).
 *
 * Note: This is defined in a separate uninstall.php file if needed.
 *
 * @since 1.0.0
 * @return void
 */
function uninstall(): void
{
	// Remove database table.
	global $wpdb;
	$table_name = $wpdb->prefix . 'aether_export_jobs';
	$wpdb->query("DROP TABLE IF EXISTS $table_name"); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared

	// Optionally remove exports directory.
	// Note: Commented out to preserve user data by default.
	// require_once ABSPATH . 'wp-admin/includes/file.php';
	// WP_Filesystem();
	// global $wp_filesystem;
	// $wp_filesystem->rmdir( AETHER_EXPORTS_DIR, true );
}

// Uncomment to enable uninstall hook.
// register_uninstall_hook( __FILE__, __NAMESPACE__ . '\\uninstall' );
