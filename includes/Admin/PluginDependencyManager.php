<?php

/**
 * Plugin Dependency Manager
 *
 * Hides Aether plugin from WordPress plugins list and prevents deactivation.
 *
 * @package Aether\Admin
 */

namespace Aether\SiteExporter\Admin;

\defined('ABSPATH') || exit;

/**
 * Plugin Dependency Manager class.
 */
class PluginDependencyManager
{
	/**
	 * List of plugins that should be hidden.
	 *
	 * @var array<string>
	 */
	private const PROTECTED_PLUGINS = [
		'aether/aether.php',
	];

	/**
	 * Constructor - registers hooks automatically.
	 */
	public function __construct()
	{
		\add_filter('all_plugins', [ $this, 'hidePluginFromList' ]);
		\add_action('admin_init', [ $this, 'preventDeactivation' ]);
		\add_action('admin_notices', [ $this, 'showProtectionNotice' ]);
	}

	/**
	 * Hide protected plugins from the plugins list.
	 *
	 * @param array<string, array<string, mixed>> $plugins List of installed plugins.
	 * @return array<string, array<string, mixed>> Filtered list of plugins.
	 */
	public function hidePluginFromList(array $plugins): array
	{
		foreach (self::PROTECTED_PLUGINS as $pluginFile) {
			if (isset($plugins[ $pluginFile ])) {
				unset($plugins[ $pluginFile ]);
			}
		}

		return $plugins;
	}

	/**
	 * Prevent deactivation attempts via direct URL access.
	 */
	public function preventDeactivation(): void
	{
		// CSRF Protection: Verify nonce FIRST before any processing
		// This prevents any code execution before security validation
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce is checked immediately below
		if (! isset($_GET['_wpnonce'])) {
			return;
		}

		if (! isset($_GET['action']) || 'deactivate' !== $_GET['action']) {
			return;
		}

		$plugin = isset($_GET['plugin']) ? \sanitize_text_field(\wp_unslash($_GET['plugin'])) : '';

		if (empty($plugin)) {
			return;
		}

		// Verify nonce with plugin parameter
		if (! \wp_verify_nonce(\sanitize_text_field(\wp_unslash($_GET['_wpnonce'])), 'deactivate-plugin_' . $plugin)) {
			\wp_die(
				\esc_html__('Security check failed. Please try again.', 'aether-site-exporter'),
				\esc_html__('Security Check Failed', 'aether-site-exporter'),
				['response' => 403]
			);
		}

		if (\in_array($plugin, self::PROTECTED_PLUGINS, true)) {
			// Set transient for notice.
			\set_transient('aether_site_exporter_deactivation_prevented', $plugin, 30);

			// Redirect back to plugins page.
			\wp_safe_redirect(\admin_url('plugins.php'));
			exit;
		}
	}

	/**
	 * Show admin notice when deactivation is prevented.
	 */
	public function showProtectionNotice(): void
	{
		$preventedPlugin = \get_transient('aether_site_exporter_deactivation_prevented');

		if (! $preventedPlugin) {
			return;
		}

		\delete_transient('aether_site_exporter_deactivation_prevented');

		require AETHER_SITE_EXPORTER_PLUGIN_DIR . 'views/admin/notices/deactivation-prevented.php';
	}

	/**
	 * Get list of protected plugins.
	 *
	 * @return array<string> List of protected plugin file paths.
	 */
	public static function getProtectedPlugins(): array
	{
		return self::PROTECTED_PLUGINS;
	}
}
