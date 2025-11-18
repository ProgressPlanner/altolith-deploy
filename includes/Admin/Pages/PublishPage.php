<?php

/**
 * Publish Page Admin Page
 *
 * Provides interface for publishing/syncing the site.
 *
 * @package Aether\Admin\Pages
 */

namespace Aether\SiteExporter\Admin\Pages;

use Aether\SiteExporter\Admin\BaseAdminPage;
use Aether\SiteExporter\Admin\Settings;

/**
 * Publish page class.
 */
class PublishPage extends BaseAdminPage
{
	/**
	 * Constructor.
	 *
	 * @param Settings $settings Plugin settings instance.
	 */
	public function __construct(Settings $settings)
	{
		parent::__construct($settings);

		$this->pageSlug   = 'aether-publish';
		$this->pageTitle  = \__('Publish Site', 'aether-site-exporter');
		$this->menuTitle  = \__('Publish', 'aether-site-exporter');
		$this->parentSlug = 'aether';
	}

	/**
	 * Enqueue page-specific assets.
	 */
	public function enqueueAssets(): void
	{
		// Enqueue WordPress components styles (required for Modal and other components).
		\wp_enqueue_style('wp-components');

		// Enqueue React build.
		$assetFile = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'assets/build/export.asset.php';
		$asset     = \file_exists($assetFile) ? require $assetFile : [
			'dependencies' => [ 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n' ],
			'version'      => AETHER_SITE_EXPORTER_VERSION,
		];

		// Webpack is configured to never create chunks - all code is bundled into single files
		\wp_enqueue_script(
			'aether-export',
			AETHER_SITE_EXPORTER_PLUGIN_URL . 'assets/build/export.js',
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
	 * Render the page content.
	 */
	protected function render(): void
	{
		echo '<div class="wrap aether-publish-page-wrap">';
		echo '<div id="aether-publish-page"></div>';
		echo '</div>';
	}
}
