<?php

/**
 * Plugin Name: Altolith Deploy
 * Plugin URI: https://github.com/aristath/altolith-deploy
 * Description: Export WordPress sites as static HTML or WordPress Playground blueprint bundles
 * Version: 1.0.0
 * Requires at least: 6.8
 * Requires PHP: 8.1
 * Tested up to: 7.2
 * Author: Ari Stathopoulos
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: altolith-deploy
 */

namespace Altolith\Deploy;

// Exit if accessed directly.
if (! \defined('ABSPATH')) {
	exit;
}

// Define plugin constants.
// Use time() for cache-busting during development.
\define('ALTOLITH_DEPLOY_PLUGIN_DIR', \plugin_dir_path(__FILE__));
\define('ALTOLITH_DEPLOY_PLUGIN_URL', \plugin_dir_url(__FILE__));
\define('ALTOLITH_DEPLOY_PLUGIN_FILE', __FILE__);

// Load autoloader.
require_once ALTOLITH_DEPLOY_PLUGIN_DIR . 'includes/autoloader.php';

function init(): void
{
	Plugin::getInstance();
}

\add_action('plugins_loaded', __NAMESPACE__ . '\\init');
