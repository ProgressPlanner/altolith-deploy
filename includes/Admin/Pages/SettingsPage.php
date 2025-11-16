<?php

/**
 * Settings Page
 *
 * Main admin settings page for Aether configuration.
 *
 * @package Aether\Admin\Pages
 */

namespace Aether\Admin\Pages;

use Aether\Admin\BaseAdminPage;
use Aether\Admin\Settings;

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
		$this->pageTitle    = \__('Aether Settings', 'aether');
		$this->menuTitle    = \__('Aether', 'aether');
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
		$assetFile = AETHER_PLUGIN_DIR . 'assets/build/admin-settings.asset.php';
		$asset     = \file_exists($assetFile) ? require $assetFile : [
			'dependencies' => [ 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n' ],
			'version'      => AETHER_VERSION,
		];

		// Webpack chunks are loaded automatically by webpack runtime when needed
		// No need to manually enqueue them

		// Enqueue the main script without chunk dependencies
		// Webpack runtime handles chunk loading automatically
		\wp_enqueue_script(
			'aether-admin-settings',
			AETHER_PLUGIN_URL . 'assets/build/admin-settings.js',
			$asset['dependencies'], // Only use actual WordPress dependencies, not webpack chunks
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
		$plugin = \Aether\Plugin::getInstance();
		$plugin->outputMetaTags();
	}

	/**
	 * Render page content.
	 */
	protected function render(): void
	{
		?>
		<div class="wrap aether-admin-settings-wrap">
			<div id="aether-admin-settings">
				<!-- React will mount here -->
				<noscript>
					<div class="notice notice-error">
						<p><?php \esc_html_e('JavaScript is required for the Aether settings page to function.', 'aether'); ?></p>
					</div>
				</noscript>
			</div>
		</div>
		<?php
	}
}

