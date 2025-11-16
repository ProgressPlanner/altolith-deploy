<?php

/**
 * Main Plugin Class
 *
 * Orchestrates all plugin functionality including:
 * - Admin pages and menus
 * - REST API endpoints
 * - Asset loading
 * - Service registration
 *
 * @package AetherSiteExporter
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter;

/**
 * Plugin orchestrator class.
 *
 * @since 1.0.0
 */
class Plugin
{
	/**
	 * Plugin instance.
	 *
	 * @var Plugin|null
	 */
	private static ?Plugin $instance = null;

	/**
	 * Get plugin instance (singleton).
	 *
	 * @since 1.0.0
	 * @return Plugin
	 */
	public static function get_instance(): Plugin
	{
		if (null === self::$instance) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	private function __construct()
	{
		$this->init_hooks();
	}

	/**
	 * Initialize WordPress hooks.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function init_hooks(): void
	{
		// Admin menu and pages.
		\add_action('admin_menu', [ $this, 'register_admin_menu' ]);

		// Enqueue admin assets.
		\add_action('admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ]);

		// Register REST API endpoints.
		\add_action('rest_api_init', [ $this, 'register_rest_routes' ]);

		// Add admin bar menu.
		\add_action('admin_bar_menu', [ $this, 'add_admin_bar_menu' ], 100);
	}

	/**
	 * Register admin menu.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_admin_menu(): void
	{
		// Main menu page.
		\add_menu_page(
			\__('Aether Site Exporter', 'aether-site-exporter'),
			\__('Site Exporter', 'aether-site-exporter'),
			'manage_options',
			'aether-site-exporter',
			[ $this, 'render_export_page' ],
			'dashicons-download',
			30
		);

		// Settings submenu.
		\add_submenu_page(
			'aether-site-exporter',
			\__('Export Settings', 'aether-site-exporter'),
			\__('Settings', 'aether-site-exporter'),
			'manage_options',
			'aether-site-exporter-settings',
			[ $this, 'render_settings_page' ]
		);
	}

	/**
	 * Render export page.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function render_export_page(): void
	{
		?>
		<div class="wrap">
			<h1><?php echo \esc_html(\get_admin_page_title()); ?></h1>
			<div id="aether-site-exporter-root"></div>
		</div>
		<?php
	}

	/**
	 * Render settings page.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function render_settings_page(): void
	{
		?>
		<div class="wrap">
			<h1><?php echo \esc_html(\get_admin_page_title()); ?></h1>
			<form method="post" action="options.php">
				<?php
				\settings_fields('aether_site_exporter_settings');
				\do_settings_sections('aether-site-exporter-settings');
				\submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_assets(string $hook): void
	{
		// Only load on our plugin pages.
		if (! \str_contains($hook, 'aether-site-exporter')) {
			return;
		}

		// Enqueue React app (will be built with webpack).
		$asset_file = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'assets/build/export.asset.php';

		if (\file_exists($asset_file)) {
			$asset = include $asset_file;

			\wp_enqueue_script(
				'aether-site-exporter-export',
				AETHER_SITE_EXPORTER_PLUGIN_URL . 'assets/build/export.js',
				$asset['dependencies'] ?? [],
				$asset['version'] ?? AETHER_SITE_EXPORTER_VERSION,
				true
			);

			// Localize script with plugin data.
			\wp_localize_script(
				'aether-site-exporter-export',
				'aetherSiteExporterData',
				[
					'restUrl'       => \rest_url(),
					'restNonce'     => \wp_create_nonce('wp_rest'),
					'pluginUrl'     => AETHER_SITE_EXPORTER_PLUGIN_URL,
					'siteUrl'       => \get_site_url(),
					'homeUrl'       => \get_home_url(),
					'adminUrl'      => \admin_url(),
					'currentUser'   => \wp_get_current_user()->user_login,
					'exportsUrl'    => \content_url('aether-exports'),
				]
			);

			// Enqueue styles if exists.
			$style_file = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'assets/build/export.css';
			if (\file_exists($style_file)) {
				\wp_enqueue_style(
					'aether-site-exporter-export',
					AETHER_SITE_EXPORTER_PLUGIN_URL . 'assets/build/export.css',
					[],
					$asset['version'] ?? AETHER_SITE_EXPORTER_VERSION
				);
			}
		}
	}

	/**
	 * Register REST API routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_rest_routes(): void
	{
		// Export steps controller.
		$export_steps = new REST\ExportStepsController();
		$export_steps->register_routes();

		// Export job controller.
		$export_job = new REST\ExportJobController();
		$export_job->register_routes();

		// Download controller.
		$download = new REST\DownloadController();
		$download->register_routes();
	}

	/**
	 * Add admin bar menu.
	 *
	 * @since 1.0.0
	 * @param \WP_Admin_Bar $wp_admin_bar Admin bar instance.
	 * @return void
	 */
	public function add_admin_bar_menu(\WP_Admin_Bar $wp_admin_bar): void
	{
		if (! \current_user_can('manage_options')) {
			return;
		}

		$wp_admin_bar->add_node(
			[
				'id'     => 'aether-site-exporter',
				'title'  => '<span class="ab-icon dashicons dashicons-download"></span>' .
							'<span class="ab-label">' . \__('Export Site', 'aether-site-exporter') . '</span>',
				'href'   => \admin_url('admin.php?page=aether-site-exporter'),
				'parent' => false,
			]
		);
	}
}
