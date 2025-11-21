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

		// Use admin_enqueue_scripts hook at priority 20 to add provider script dependencies
		// This runs after providers plugin enqueues scripts at priority 5
		\add_action('admin_enqueue_scripts', function () use ($asset) {
			$providerScripts = [
				'aether-sep-provider-cloudflare-r2',
				'aether-sep-provider-cloudflare',
				'aether-sep-provider-gitlab',
				'aether-sep-provider-gitlab-pages',
			];

			$providerScriptDependencies = [];
			foreach ($providerScripts as $scriptHandle) {
				if (\wp_script_is($scriptHandle, 'registered')) {
					$providerScriptDependencies[] = $scriptHandle;
				}
			}

			// Add provider scripts as dependencies to admin-settings if they exist
			if (!empty($providerScriptDependencies) && \wp_script_is('aether-admin-settings', 'registered')) {
				global $wp_scripts;
				if (isset($wp_scripts->registered['aether-admin-settings'])) {
					$wp_scripts->registered['aether-admin-settings']->deps = \array_merge(
						$wp_scripts->registered['aether-admin-settings']->deps,
						$providerScriptDependencies
					);
				}
			}
		}, 20);

		// Enqueue the main script
		\wp_enqueue_script(
			'aether-admin-settings',
			AETHER_SITE_EXPORTER_PLUGIN_URL . 'assets/build/admin-settings.js',
			$asset['dependencies'],
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
