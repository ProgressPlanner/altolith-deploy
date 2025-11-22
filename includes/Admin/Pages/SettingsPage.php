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

		// Enqueue the main script
		// Provider scripts from aether-site-exporter-providers are enqueued at priority 5,
		// so they should load before this script (which runs at default priority 10).
		// The JavaScript code will wait for providers to register before querying the registry.
		\wp_enqueue_script(
			'aether-admin-settings',
			AETHER_SITE_EXPORTER_PLUGIN_URL . 'assets/build/admin-settings.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		// Add REST API configuration data via inline script.
		$plugin->addAPIConfigScript('aether-admin-settings');
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
