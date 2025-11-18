<?php

/**
 * Admin Settings Manager for Aether
 *
 * Handles settings storage, validation, and menu initialization.
 *
 * @package Aether\Admin
 */

namespace Aether\SiteExporter\Admin;

\defined('ABSPATH') || exit;

/**
 * Settings page class for Aether plugin.
 */
class Settings
{
	/**
	 * Constructor.
	 */
	public function __construct()
	{

		// Initialize new admin menu structure on init to avoid translation loading issues.
		\add_action('init', [ $this, 'initMenuManager' ]);

		// Register settings.
		\add_action('admin_init', [ $this, 'registerSettings' ]);
	}

	/**
	 * Initialize the menu manager and register all admin pages.
	 *
	 * Called on 'init' hook to ensure translations are available.
	 */
	public function initMenuManager(): void
	{
		$menuManager = new MenuManager();

		// Register settings page as the main admin page.
		$menuManager->registerPage(new Pages\SettingsPage($this));

		// Initialize the menu manager (registers WordPress hooks).
		$menuManager->init();
	}

	/**
	 * Register settings.
	 *
	 * @return void
	 */
	public function registerSettings(): void
	{
		\register_setting(
			'aether_site_exporter_settings',
			'aether_site_exporter_settings',
			[
				'sanitize_callback' => [ $this, 'sanitizeSettings' ],
			]
		);
	}

	/**
	 * Sanitize settings input.
	 *
	 * @param array<string, mixed> $input Raw input settings.
	 * @return array<string, mixed> Sanitized settings.
	 */
	public function sanitizeSettings(array $input): array
	{
		// Basic sanitization - validation is handled in React.
		return \array_map('sanitize_text_field', $input);
	}

	/**
	 * Get all plugin settings.
	 *
	 * @return array<string, mixed> All settings in hierarchical format.
	 */
	public function get(): array
	{
		return \Aether\SiteExporter\getStorageConfig();
	}

	/**
	 * Update plugin settings.
	 *
	 * @param array<string, mixed> $settings Settings to save.
	 * @return bool True on success, false on failure.
	 */
	public function update(array $settings): bool
	{
		// Important: We must clear the static cache in getStorageConfig()
		// First update the option directly.
		$result = \update_option('aether_site_exporter_settings', $settings);

		// Force cache refresh by calling get_storage_config with bypass_cache.
		if ($result) {
			// Get fresh settings to ensure cache is updated.
			\Aether\SiteExporter\getStorageConfig(true);
		}

		return $result;
	}
}
