<?php

/**
 * Settings Page
 *
 * Main admin settings page for Altolith configuration.
 *
 * @package Altolith\Admin\Pages
 */

namespace Altolith\Deploy\Admin\Pages;

use Altolith\Deploy\Admin\BaseAdminPage;
use Altolith\Deploy\Admin\Settings;

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

		$this->pageSlug     = 'altolith';
		$this->pageTitle    = \__('Altolith Settings', 'altolith-deploy');
		$this->menuTitle    = \__('Altolith', 'altolith-deploy');
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
		$assetFile = ALTOLITH_DEPLOY_PLUGIN_DIR . 'assets/build/admin-settings.asset.php';
		$asset     = \file_exists($assetFile) ? require $assetFile : [
			'dependencies' => [ 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n' ],
			'version'      => \time(),
		];

		// Enqueue local-filesystem provider scripts separately (must load before admin-settings)
		$plugin = \Altolith\Deploy\Plugin::getInstance();
		$plugin->enqueueProviderScript('local-filesystem-static-site');
		$plugin->enqueueProviderScript('local-filesystem-blueprint-bundle');

		// Enqueue the main script
		// Provider scripts from altolith-deploy-providers are enqueued at priority 5,
		// so they should load before this script (which runs at default priority 10).
		// The JavaScript code will wait for providers to register before querying the registry.
		\wp_enqueue_script(
			'altolith-admin-settings',
			ALTOLITH_DEPLOY_PLUGIN_URL . 'assets/build/admin-settings.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		// Add REST API configuration data via inline script.
		$plugin->addAPIConfigScript('altolith-admin-settings');
	}


	/**
	 * Render page content.
	 */
	protected function render(): void
	{
		$viewPath = ALTOLITH_DEPLOY_PLUGIN_DIR . 'views/admin/pages/settings.php';
		if (\file_exists($viewPath)) {
			include $viewPath;
		}
	}
}
