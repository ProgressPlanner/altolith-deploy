<?php

/**
 * Global Helper Functions
 *
 * Provides global utility functions for the Aether Site Exporter plugin.
 *
 * @package Aether\SiteExporter
 */

namespace Aether\SiteExporter;

\defined('ABSPATH') || exit;

/**
 * Get all storage provider settings in hierarchical format.
 *
 * Automatically migrates flat settings to hierarchical structure if needed.
 * The hierarchical structure is: ['activeProvider' => 'r2', 'providers' => [...]].
 *
 * Uses SettingsRepository which handles migration and structure validation automatically.
 *
 * @param bool $forceRefresh Whether to bypass the cache and refresh the data.
 *
 * @return array<string, mixed> Hierarchical settings array.
 */
function getStorageConfig(bool $forceRefresh = false): array
{
	static $repository = null;
	if (null === $repository) {
		$repository = new \Aether\SiteExporter\Core\SettingsRepository();
	}
	// Pass bypass_cache parameter to get fresh data when needed.
	return $repository->getAll($forceRefresh);
}

/**
 * Get active provider configuration.
 *
 * Returns the configuration array for the currently active provider of the specified type.
 *
 * @param string $type Provider type: 'edge', 'storage', 'media', or 'static'. Default 'storage'.
 * @return array<string, mixed> Active provider config.
 */
function getActiveProviderConfig(string $type = 'storage'): array
{
	$config = getStorageConfig();

	switch ($type) {
		case 'edge':
			$providerTypes = $config['provider_types'] ?? [];
			$edgeProviderId = $providerTypes['edge'] ?? '';
			if (empty($edgeProviderId)) {
				return [];
			}
			return $config['providers'][ $edgeProviderId ] ?? [];

		case 'storage':
			$provider = $config['activeProvider'] ?? '';
			if (empty($provider)) {
				return [];
			}
			return $config['providers'][ $provider ] ?? [];

		case 'media':
			return $config['media'] ?? [];

		case 'static':
			$staticProvider = $config['usage']['static_site_provider'] ?? '';
			if (empty($staticProvider)) {
				return [];
			}
			return $config['providers'][ $staticProvider ] ?? [];

		default:
			return [];
	}
}

/**
 * Get active provider ID.
 *
 * Returns the identifier of the currently active provider of the specified type.
 *
 * @param string $type Provider type: 'edge', 'storage', 'media', or 'static'. Default 'storage'.
 * @return string Provider ID.
 */
function getActiveProviderId(string $type = 'storage'): string
{
	$config = getStorageConfig();

	switch ($type) {
		case 'edge':
			$providerTypes = $config['provider_types'] ?? [];
			return $providerTypes['edge'] ?? '';

		case 'storage':
			return $config['activeProvider'] ?? '';

		case 'media':
			// Media has three sub-types, return empty string as there's no single "active" media provider.
			return '';

		case 'static':
			return $config['usage']['static_site_provider'] ?? '';

		default:
			return '';
	}
}
