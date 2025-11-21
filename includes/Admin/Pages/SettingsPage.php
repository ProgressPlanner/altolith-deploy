<?php

/**
 * Settings Page
 *
 * Main admin settings page for Aether configuration.
 *
 * @package Aether\Admin\Pages
 */

namespace Aether\SiteExporter\Admin\Pages;

use Aether\SiteExporter\Admin\BaseAdminPage;
use Aether\SiteExporter\Admin\Settings;

/**
 * Settings page class.
 */
class SettingsPage extends BaseAdminPage
{
	/**
	 * Constructor.
	 *
	 * @param Settings $settings Plugin settings instance.
	 */
	public function __construct(Settings $settings)
	{
		parent::__construct($settings);

		$this->pageSlug     = 'aether';
		$this->pageTitle    = \__('Aether Settings', 'aether-site-exporter');
		$this->menuTitle    = \__('Aether', 'aether-site-exporter');
		$this->iconUrl      = 'dashicons-cloud';
		$this->menuPosition = 30;
	}

	/**
	 * Enqueue page-specific assets.
	 */
	public function enqueueAssets(): void
	{
		// Enqueue WordPress components styles (required for Modal and other components).
		\wp_enqueue_style('wp-components');

		// Enqueue React build.
		$assetFile = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'assets/build/admin-settings.asset.php';
		$asset     = \file_exists($assetFile) ? require $assetFile : [
			'dependencies' => [ 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n' ],
			'version'      => \time(),
		];

		// Enqueue local-filesystem provider script separately (must load before admin-settings)
		$plugin = \Aether\SiteExporter\Plugin::getInstance();
		$plugin->enqueueProviderScript('local-filesystem');

		// Add provider scripts from aether-site-exporter-providers plugin as dependencies
		// This ensures providers are registered before admin-settings queries the registry
		// Note: These scripts are enqueued by the providers plugin at priority 5,
		// so they should be registered by the time this code runs (priority 10)
		$providerScriptDependencies = [];
		$providerScripts = [
			'aether-sep-provider-cloudflare-r2',
			'aether-sep-provider-cloudflare',
			'aether-sep-provider-gitlab',
			'aether-sep-provider-gitlab-pages',
		];

		foreach ($providerScripts as $scriptHandle) {
			// Check if script is registered or enqueued
			if (\wp_script_is($scriptHandle, 'registered') || \wp_script_is($scriptHandle, 'enqueued')) {
				$providerScriptDependencies[] = $scriptHandle;
			}
		}

		// Merge provider script dependencies with WordPress dependencies
		$dependencies = \array_merge($asset['dependencies'], $providerScriptDependencies);

		// Enqueue the main script with provider script dependencies
		// This ensures providers are registered before admin-settings queries the registry
		\wp_enqueue_script(
			'aether-admin-settings',
			AETHER_SITE_EXPORTER_PLUGIN_URL . 'assets/build/admin-settings.js',
			$dependencies,
			$asset['version'],
			true
		);

		// Output meta tags for REST API configuration (React fetches from meta tags).
		\add_action('admin_head', [ $this, 'outputMetaTags' ]);
	}

	/**
	 * Output meta tags for REST API configuration.
	 */
	public function outputMetaTags(): void
	{
		$plugin = \Aether\SiteExporter\Plugin::getInstance();
		$plugin->outputMetaTags();
	}

	/**
	 * Render page content.
	 */
	protected function render(): void
	{
		$viewPath = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'views/admin/pages/settings.php';
		if (\file_exists($viewPath)) {
			include $viewPath;
		}
	}
}
