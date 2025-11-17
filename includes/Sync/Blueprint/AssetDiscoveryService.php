<?php

/**
 * Asset Discovery Service (PHP Version)
 *
 * Provides asset discovery functionality for PHP operations.
 *
 * IMPORTANT: WordPress.org detection is handled in the browser by useAssetDiscovery.js
 * because WordPress Playground blocks external HTTP requests (wp_remote_*) to wordpress.org.
 * This PHP class handles basic plugin/theme listing for server-side operations like
 * ZIP export and CLI commands.
 *
 * WordPress Playground Compatibility:
 * - Internal WordPress requests work (HTTPClient for same-site requests)
 * - External API calls fail (wordpress.org, api.example.com) - use browser fetch()
 *
 * @package Aether\Sync\Blueprint
 */

namespace Aether\SiteExporter\Sync\Blueprint;

/**
 * Service class for discovering installed WordPress assets.
 */
class AssetDiscoveryService
{
	/**
	 * Get all installed plugins with metadata.
	 *
	 * Returns array of plugin data including slug, version, name, and active status.
	 * Note: from_wporg detection is handled client-side now.
	 *
	 * @return array<int, array<string, mixed>> Array of plugin data.
	 */
	public function getInstalledPlugins(): array
	{
		// WordPress core file - PHPStan cannot verify ABSPATH at analysis time.
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$allPlugins    = \get_plugins();
		$activePlugins = \get_option('active_plugins', []);
		$pluginsData   = [];

		foreach ($allPlugins as $pluginFile => $pluginInfo) {
			$pluginSlug = \dirname($pluginFile);

			// Skip single-file plugins and mu-plugins.
			if ('.' === $pluginSlug) {
				continue;
			}

			$pluginsData[] = [
				'type'       => 'plugin',
				'slug'       => $pluginSlug,
				'file'       => $pluginFile,
				'version'    => $pluginInfo['Version'] ?? '',
				'name'       => $pluginInfo['Name'] ?? '',
				'is_active'  => \in_array($pluginFile, $activePlugins, true),
				'from_wporg' => false, // Browser determines this now
			];
		}

		return $pluginsData;
	}

	/**
	 * Get all installed themes with metadata.
	 *
	 * Returns array of theme data including slug, version, name, and active status.
	 * Note: from_wporg detection is handled client-side now.
	 *
	 * @return array<int, array<string, mixed>> Array of theme data.
	 */
	public function getInstalledThemes(): array
	{
		$allThemes   = \wp_get_themes();
		$activeTheme = \get_stylesheet();
		$themesData  = [];

		foreach ($allThemes as $themeSlug => $themeObj) {
			$themesData[] = [
				'type'       => 'theme',
				'slug'       => $themeSlug,
				'version'    => $themeObj->get('Version'),
				'name'       => $themeObj->get('Name'),
				'is_active'  => $themeSlug === $activeTheme,
				'from_wporg' => false, // Browser determines this now
			];
		}

		return $themesData;
	}

	/**
	 * Get all custom (non-wordpress.org) plugins and themes that are actively used.
	 *
	 * For plugins: Only includes ACTIVE plugins.
	 * For themes: Only includes the ACTIVE theme and its parent chain (if child theme).
	 *
	 * NOTE: This method now returns ALL active plugins/themes since from_wporg
	 * detection happens client-side. The browser-based useAssetDiscovery hook
	 * handles filtering to WordPress.org assets.
	 *
	 * @return array<int, array{type: string, slug: string, name: string}> List of assets.
	 */
	public function getAllCustomAssets(): array
	{
		$assets = [];

		// Get ACTIVE plugins only.
		if (! \function_exists('get_plugins')) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		if (! \function_exists('is_plugin_active')) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$allPlugins = \get_plugins();
		foreach ($allPlugins as $pluginFile => $pluginData) {
			$pluginSlug = \dirname($pluginFile);
			if ('.' === $pluginSlug) {
				$pluginSlug = \basename($pluginFile, '.php');
			}

			$isActive = \is_plugin_active($pluginFile);

			// Skip inactive plugins.
			if (! $isActive) {
				continue;
			}

			// Skip aether plugin - it's managed separately.
			if ('aether' === $pluginSlug) {
				continue;
			}

			// Return all active plugins - browser filters WordPress.org ones
			$assets[] = [
				'type' => 'plugin',
				'slug' => $pluginSlug,
				'name' => $pluginData['Name'] ?? $pluginSlug,
			];
		}

		// Get ACTIVE theme and its parent chain (if child theme).
		$activeTheme      = \wp_get_theme();
		$themesToInclude = [];

		// Add active theme.
		$themesToInclude[] = $activeTheme->get_stylesheet();

		// Add parent themes (recursively for grandparents, etc.).
		$currentTheme = $activeTheme;
		while ($currentTheme->parent()) {
			$currentTheme       = $currentTheme->parent();
			$themesToInclude[] = $currentTheme->get_stylesheet();
		}

		// Process each theme in the chain.
		foreach ($themesToInclude as $themeSlug) {
			$theme      = \wp_get_theme($themeSlug);
			$themeName = $theme->get('Name');
			$assets[]   = [
				'type' => 'theme',
				'slug' => $themeSlug,
				'name' => $themeName ? $themeName : $themeSlug,
			];
		}

		return $assets;
	}
}
