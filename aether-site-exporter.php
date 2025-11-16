<?php

/**
 * Plugin Name: Aether Site Exporter
 * Plugin URI: https://github.com/aristath/aether-site-exporter
 * Description: Export WordPress sites as static HTML or WordPress Playground blueprint bundles
 * Version: 1.0.0
 * Author: Ari Stathopoulos
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: aether-site-exporter
 */

namespace Aether\SiteExporter;

// Exit if accessed directly.
if (! \defined('ABSPATH')) {
	exit;
}

// Define plugin constants.
// Use time() for cache-busting during development.
\define('AETHER_SITE_EXPORTER_VERSION', \defined('WP_DEBUG') && WP_DEBUG ? \time() : '1.0.0');
\define('AETHER_SITE_EXPORTER_PLUGIN_DIR', \plugin_dir_path(__FILE__));
\define('AETHER_SITE_EXPORTER_PLUGIN_URL', \plugin_dir_url(__FILE__));
\define('AETHER_SITE_EXPORTER_PLUGIN_FILE', __FILE__);

// Load autoloader.
require_once AETHER_SITE_EXPORTER_PLUGIN_DIR . 'includes/autoloader.php';

// Load helper functions.
require_once AETHER_SITE_EXPORTER_PLUGIN_DIR . 'includes/helpers.php';

function init(): void
{
	Plugin::getInstance();
}

\add_action('plugins_loaded', __NAMESPACE__ . '\\init');
