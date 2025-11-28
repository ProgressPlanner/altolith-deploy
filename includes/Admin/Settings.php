<?php

/**
 * Admin Settings Manager for Altolith
 *
 * Handles settings storage, validation, and menu initialization.
 *
 * @package Altolith\Admin
 */

namespace Altolith\Deploy\Admin;

\defined('ABSPATH') || exit;

/**
 * Settings page class for Altolith plugin.
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
			'altolith_deploy_settings',
			'altolith_deploy_settings',
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
		$settings = \get_option('altolith_deploy_settings', []);
		return \is_array($settings) ? $settings : [];
	}

	/**
	 * Update plugin settings.
	 *
	 * @param array<string, mixed> $settings Settings to save.
	 * @return bool True on success, false on failure.
	 */
	public function update(array $settings): bool
	{
		return \update_option('altolith_deploy_settings', $settings);
	}
}
