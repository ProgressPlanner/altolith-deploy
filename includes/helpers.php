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
