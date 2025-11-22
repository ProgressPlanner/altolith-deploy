<?php

/**
 * Admin Bar Manager
 *
 * Adds export functionality to the WordPress admin bar.
 *
 * @package Aether\Admin
 */

namespace Aether\SiteExporter\Admin;

use Aether\SiteExporter\Plugin;

/**
 * Class AdminBar
 *
 * Handles admin bar menu item registration and asset enqueuing.
 */
class AdminBar
{
	/**
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	private Plugin $plugin;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct(Plugin $plugin)
	{
		$this->plugin = $plugin;
	}

	/**
	 * Initialize the admin bar.
	 *
	 * Registers WordPress hooks.
	 *
	 * @return void
	 */
	public function init(): void
	{
		// Admin bar menu hook - only fires if admin bar is showing
		\add_action('admin_bar_menu', [ $this, 'addExportMenuItem' ], 100);

		// Enqueue scripts on both admin and frontend (where admin bar is visible)
		\add_action('wp_enqueue_scripts', [ $this, 'enqueueAdminBarAssets' ], 20);
		\add_action('admin_enqueue_scripts', [ $this, 'enqueueAdminBarAssets' ], 20);
	}

	/**
	 * Add export menu item to admin bar.
	 *
	 * Adds a menu item with cloudUpload SVG icon on the right side of the admin bar.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar WordPress admin bar instance.
	 * @return void
	 */
	public function addExportMenuItem($wp_admin_bar): void // phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps -- WordPress core parameter.
	{
		// Only show to users with manage_options capability.
		if (! \current_user_can('manage_options')) {
			return;
		}

		// CloudUpload SVG icon (inline) - WordPress Gutenberg cloudUpload icon.
		// White fill color for visibility on dark admin bar background.
		$iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="vertical-align:middle;margin-right:4px;"><path d="M17.3 10.1C17.3 7.60001 15.2 5.70001 12.5 5.70001C10.3 5.70001 8.4 7.10001 7.9 9.00001H7.7C5.7 9.00001 4 10.7 4 12.8C4 14.9 5.7 16.6 7.7 16.6H9.5V15.2H7.7C6.5 15.2 5.5 14.1 5.5 12.9C5.5 11.7 6.5 10.5 7.7 10.5H9L9.3 9.40001C9.7 8.10001 11 7.20001 12.5 7.20001C14.3 7.20001 15.8 8.50001 15.8 10.1V11.4L17.1 11.6C17.9 11.7 18.5 12.5 18.5 13.4C18.5 14.4 17.7 15.2 16.8 15.2H14.5V16.6H16.7C18.5 16.6 19.9 15.1 19.9 13.3C20 11.7 18.8 10.4 17.3 10.1Z M14.1245 14.2426L15.1852 13.182L12.0032 10L8.82007 13.1831L9.88072 14.2438L11.25 12.8745V18H12.75V12.8681L14.1245 14.2426Z" fill="#fff" /></svg>';

		$wp_admin_bar->add_node([ // phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps -- WordPress core parameter.
			'id' => 'aether-export',
			'parent' => 'top-secondary', // Right side of admin bar.
			'title' => $iconSvg, // SVG icon as title.
			'href' => '#',
			'meta' => [
				'title' => \__('Export Site', 'aether-site-exporter'), // Hover text.
				'aria-label' => \__('Export Site', 'aether-site-exporter'), // Accessibility.
				'class' => 'aether-export-trigger',
			],
		]);
	}

	/**
	 * Enqueue admin bar assets.
	 *
	 * Enqueues the lightweight admin bar JavaScript file.
	 *
	 * @return void
	 */
	public function enqueueAdminBarAssets(): void
	{
		// Only enqueue if user can manage options (same check as menu item).
		if (! \current_user_can('manage_options')) {
			return;
		}

		$scriptUrl = AETHER_SITE_EXPORTER_PLUGIN_URL . 'assets/build/admin-bar-export.js';

		// Get plugin version from file header.
		$pluginData = \get_file_data(
			AETHER_SITE_EXPORTER_PLUGIN_FILE,
			[ 'Version' => 'Version' ]
		);
		$fileTime = \filemtime($scriptUrl);
		$version = $pluginData['Version'] ?? ( $fileTime !== false ? (string) $fileTime : false );

		\wp_enqueue_script(
			'aether-admin-bar-export',
			$scriptUrl,
			[], // No dependencies.
			$version,
			true
		);

		// Add REST API config inline (needed for modal when it loads).
		$this->plugin->addAPIConfigScript('aether-admin-bar-export');

		// Add inline script to set data attribute on the admin bar item.
		// WordPress admin bar API doesn't support custom data attributes directly,
		// so we add it via JavaScript after the admin bar is rendered.
		\wp_add_inline_script(
			'aether-admin-bar-export',
			'(function() {
				document.addEventListener("DOMContentLoaded", function() {
					const exportItem = document.getElementById("wp-admin-bar-aether-export");
					if (exportItem) {
						const link = exportItem.querySelector("a");
						if (link) {
							link.setAttribute("data-aether-export", "true");
						}
					}
				});
			})();',
			'after'
		);
	}
}
