<?php

/**
 * Settings Repository
 *
 * Simple wrapper around WordPress options for server-side PHP code.
 * React handles all client-side settings via SettingsController REST API.
 *
 * @package Aether\Core
 * @since   1.0.0
 */

namespace Aether\SiteExporter\Core;

/**
 * Repository for centralized settings access.
 *
 * Provides simple get/set wrappers for WordPress options.
 * No caching (React handles client-side caching).
 * No structuring (React handles data transformation).
 */
class SettingsRepository
{
	/**
	 * Main settings option key.
	 */
	const SETTINGS_KEY = 'aether_site_exporter_settings';

	/**
	 * Get all settings.
	 *
	 * Returns raw settings from WordPress options.
	 * React handles transformation and validation.
	 *
	 * @param bool $_bypassCache Kept for compatibility, unused (no cache).
	 * @return array<string, mixed> Settings array.
	 */
	public function getAll(bool $_bypassCache = false): array
	{

		$settings = \get_option(self::SETTINGS_KEY, []);

		return \is_array($settings) ? $settings : [];
	}

	/**
	 * Save all settings.
	 *
	 * @param array<string, mixed> $settings Settings array to save.
	 * @return bool True on success, false on failure.
	 */
	public function saveAll(array $settings): bool
	{
		return \update_option(self::SETTINGS_KEY, $settings);
	}

	/**
	 * Get public plugin URL.
	 *
	 * Returns the URL where the Aether plugin JavaScript is publicly accessible.
	 * Used by BlueprintManager for blueprint configuration.
	 *
	 * @return string Public plugin URL.
	 */
	public static function getPublicPluginUrl(): string
	{
		// Check if custom URL is defined (for environments where plugin_dir_url doesn't work).
		if (\defined('AETHER_SITE_EXPORTER_PUBLIC_PLUGIN_URL')) {
			return AETHER_SITE_EXPORTER_PUBLIC_PLUGIN_URL;
		}

		// Default to WordPress plugin_dir_url.
		return \plugin_dir_url(AETHER_SITE_EXPORTER_PLUGIN_FILE);
	}

	/**
	 * Clear all settings.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function clearAll(): bool
	{
		return \delete_option(self::SETTINGS_KEY);
	}
}
