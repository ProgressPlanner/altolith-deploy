<?php

/**
 * Admin Settings Manager for Aether
 *
 * Handles settings storage, validation, and menu initialization.
 *
 * @package Aether\Admin
 */

namespace Aether\SiteExporter\Admin;

use Aether\SiteExporter\Core\SettingsRepository;

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
		$repository = new SettingsRepository();
		return $repository->getAll();
	}

	/**
	 * Update plugin settings.
	 *
	 * @param array<string, mixed> $settings Settings to save.
	 * @return bool True on success, false on failure.
	 */
	public function update(array $settings): bool
	{
		$result = \update_option('aether_site_exporter_settings', $settings);

		// Force cache refresh by re-reading from database.
		if ($result) {
			$repository = new SettingsRepository();
			$repository->getAll();
		}

		return $result;
	}
}
