<?php

/**
 * Provider WP-CLI Commands
 *
 * WP-CLI commands for provider management.
 *
 * @package Aether\CLI
 */

namespace Aether\SiteExporter\CLI;

use WP_CLI;
use Aether\SiteExporter\Providers\ProviderRegistry;

/**
 * Provider management commands.
 */
class ProviderCommands
{
	/**
	 * Convert provider configurations to instance-based format.
	 *
	 * Converts existing provider configurations from the old format (provider_id => config)
	 * to the new instance-based format (provider_type:uuid => config with instance_name).
	 *
	 * ## EXAMPLES
	 *
	 *     wp aether convert-provider-configs
	 *     wp aether convert-provider-configs --dry-run
	 *
	 * @when after_wp_load
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Named arguments.
	 */
	public function convertProviderConfigs($args, $assoc_args)
	{
		$dryRun = isset($assoc_args['dry-run']);

		WP_CLI::log('Converting provider configurations to instance-based format...');
		WP_CLI::log('');

		// Get current settings.
		$settings = \get_option('aether_site_exporter_settings', []);
		$providers = $settings['providers'] ?? [];

		if (empty($providers)) {
			WP_CLI::warning('No provider configurations found.');
			return;
		}

		$registry = ProviderRegistry::getInstance();
		$converted = [];
		$skipped = [];

		foreach ($providers as $providerId => $config) {
			// Check if already in new format (contains colon).
			if (\strpos($providerId, ':') !== false) {
				WP_CLI::log(WP_CLI::colorize("%y➜%n Already in new format: {$providerId}"));
				$converted[$providerId] = $config;
				continue;
			}

			// Verify provider exists.
			$provider = $registry->get($providerId);
			if (! $provider) {
				WP_CLI::warning("Provider not found: {$providerId}. Skipping.");
				$skipped[$providerId] = $config;
				continue;
			}

			// Generate new instance ID.
			$instanceId = $registry->createInstanceId($providerId);

			// Add instance metadata to config.
			$newConfig = $config;
			$newConfig['provider_type'] = $providerId;
			$newConfig['instance_name'] = $provider->getName(); // Use provider name as default instance name

			$converted[$instanceId] = $newConfig;

			WP_CLI::log(WP_CLI::colorize(
				"%g✓%n Converted: {$providerId} → {$instanceId} (name: \"{$newConfig['instance_name']}\")"
			));
		}

		// Add back skipped providers (in case user wants to manually fix them).
		foreach ($skipped as $providerId => $config) {
			$converted[$providerId] = $config;
		}

		WP_CLI::log('');
		WP_CLI::log(WP_CLI::colorize('%_Summary:%n'));
		WP_CLI::log('  Converted: ' . (\count($converted) - \count($skipped)));
		WP_CLI::log('  Skipped:   ' . \count($skipped));
		WP_CLI::log('');

		if ($dryRun) {
			WP_CLI::log(WP_CLI::colorize('%yDry run - no changes made.%n'));
			WP_CLI::log('');
			WP_CLI::log('New configuration would be:');
			WP_CLI::log(\wp_json_encode($converted, JSON_PRETTY_PRINT));
		} else {
			// Save converted configs.
			$settings['providers'] = $converted;
			\update_option('aether_site_exporter_settings', $settings);

			WP_CLI::success('Provider configurations converted successfully!');
		}
	}
}
