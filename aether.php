<?php

/**
 * Plugin Name: Aether
 * Plugin URI: https://example.com
 * Description: Run WordPress serverless in the cloud and deploy as static sites - powered by Cloudflare
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: aether
 */

namespace Aether;

// Exit if accessed directly.
if (! \defined('ABSPATH')) {
	exit;
}

// Define plugin constants.
// Use time() for cache-busting during development.
\define('AETHER_VERSION', \defined('WP_DEBUG') && WP_DEBUG ? \time() : '1.0.0');
\define('AETHER_PLUGIN_DIR', \plugin_dir_path(__FILE__));
\define('AETHER_PLUGIN_URL', \plugin_dir_url(__FILE__));
\define('AETHER_PLUGIN_FILE', __FILE__);

/**
 * Production zip URL for Aether plugin deployment.
 * Used in blueprints to install the plugin in WordPress Playground.
 */
if (! \defined('AETHER_PRODUCTION_ZIP_URL')) {
	\define('AETHER_PRODUCTION_ZIP_URL', 'https://r2.s12y.org/aether.zip');
}

/**
 * WordPress Playground root URL.
 * Used for redirecting wp-admin requests to Playground.
 */
if (! \defined('AETHER_PLAYGROUND_ROOT_URL')) {
	\define('AETHER_PLAYGROUND_ROOT_URL', 'https://static-wp.s12y.org/index.html');
}

/**
 * Media target service for image uploads.
 * Can be 'cloudflare-images' or 'cloudflare-r2'.
 * Default: 'cloudflare-r2'.
 */
if (! \defined('AETHER_MEDIA_TARGET_SERVICE')) {
	\define('AETHER_MEDIA_TARGET_SERVICE', 'cloudflare-r2');
}

// Load autoloader.
require_once AETHER_PLUGIN_DIR . 'includes/autoloader.php';

// Load helper functions.
require_once AETHER_PLUGIN_DIR . 'includes/helpers.php';

function init(): void
{
	// Run migration check on every load (idempotent - safe to call multiple times)
	migrateEdgeProviderSettings();

	Plugin::getInstance();
}

\add_action('plugins_loaded', __NAMESPACE__ . '\\init');

/**
 * Handle first-time activation redirect to setup wizard.
 *
 * Redirects users to the setup wizard on first activation if:
 * - Not doing bulk activation
 * - Not an AJAX request
 * - User has admin capabilities
 * - Wizard hasn't been completed or skipped
 */
function maybeRedirectToWizard(): void
{
	// Only run in admin.
	if (! \is_admin()) {
		return;
	}

	// Check if this is a first-time activation.
	$redirectTransient = \get_transient('aether_activation_redirect');
	if (! $redirectTransient) {
		return;
	}

	// Delete the transient immediately to prevent redirect loops.
	\delete_transient('aether_activation_redirect');

	// Don't redirect if doing bulk activation.
	if (isset($_GET['activate-multi'])) {
		return;
	}

	// Don't redirect on AJAX requests.
	if (\wp_doing_ajax()) {
		return;
	}

	// Only redirect if user can manage options.
	if (! \current_user_can('manage_options')) {
		return;
	}

	// Check if wizard has been completed or skipped.
	$wizardState = \get_option('aether_wizard_state', []);
	if (! empty($wizardState['completed']) || ! empty($wizardState['skipped'])) {
		return;
	}

	// All checks passed - redirect to wizard.
	\wp_safe_redirect(\admin_url('admin.php?page=aether-wizard'));
	exit;
}

\add_action('admin_init', __NAMESPACE__ . '\\maybeRedirectToWizard', 10);

/**
 * Set activation redirect transient on plugin activation.
 */
function setActivationRedirect(): void
{
	// Set a transient to trigger redirect on next admin page load.
	\set_transient('aether_activation_redirect', true, 60);
}

\register_activation_hook(__FILE__, __NAMESPACE__ . '\\setActivationRedirect');

/**
 * Migrate edge provider settings to standard provider structure.
 *
 * Moves edgeProvider configuration to providers.cloudflare for consistency.
 * This migration runs on plugin activation and checks for existing edgeProvider data.
 */
function migrateEdgeProviderSettings(): void
{
	$settings = \get_option('aether_settings', []);

	// Check if edgeProvider exists and needs migration
	if (! isset($settings['edgeProvider']) || empty($settings['edgeProvider'])) {
		return;
	}

	$edgeProvider = $settings['edgeProvider'];

	// Skip if already migrated (check if providers.cloudflare exists with same data)
	if (isset($settings['providers']['cloudflare'])) {
		// Already migrated, remove edgeProvider
		unset($settings['edgeProvider']);
		\update_option('aether_settings', $settings);
		return;
	}

	// Extract providerType to determine which provider ID to use
	$providerType = $edgeProvider['providerType'] ?? 'cloudflare';

	// Normalize provider ID (cloudflare-workers -> cloudflare)
	$providerId = ($providerType === 'cloudflare-workers') ? 'cloudflare' : $providerType;

	// Prepare provider config (exclude providerType as it's redundant)
	$providerConfig = $edgeProvider;
	unset($providerConfig['providerType']);

	// Ensure providers array exists
	if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
		$settings['providers'] = [];
	}

	// Migrate edgeProvider data to providers[providerId]
	$settings['providers'][$providerId] = $providerConfig;

	// Remove edgeProvider key
	unset($settings['edgeProvider']);

	// Save migrated settings
	\update_option('aether_settings', $settings);
}

\register_activation_hook(__FILE__, __NAMESPACE__ . '\\migrateEdgeProviderSettings');

// Prevent creating users with the username "admin" to avoid WordPress Playground auto-login issues.
\add_filter(
	'illegal_user_logins',
	function ($usernames) {
		$usernames[] = 'admin';
		return $usernames;
	}
);
