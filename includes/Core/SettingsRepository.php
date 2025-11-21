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
	private const SETTINGS_KEY = 'aether_site_exporter_settings';

	/**
	 * Get all settings.
	 *
	 * Returns raw settings from WordPress options.
	 * React handles transformation and validation.
	 *
	 * @return array<string, mixed> Settings array.
	 */
	public function getAll(): array
	{

		$settings = \get_option(self::SETTINGS_KEY, []);

		return \is_array($settings) ? $settings : [];
	}
}
