<?php

/**
 * Base Admin Page
 *
 * Abstract base class for all admin pages in the plugin.
 * Provides common functionality and enforces consistent structure.
 *
 * @package Aether\Admin
 */

namespace Aether\SiteExporter\Admin;

use Aether\Admin\Settings;

/**
 * Abstract base class for admin pages.
 */
abstract class BaseAdminPage
{
	/**
	 * Page slug (unique identifier).
	 *
	 * @var string
	 */
	protected string $pageSlug;

	/**
	 * Page title (displayed in browser title bar).
	 *
	 * @var string
	 */
	protected string $pageTitle;

	/**
	 * Menu title (displayed in admin menu).
	 *
	 * @var string
	 */
	protected string $menuTitle;

	/**
	 * Required capability to access this page.
	 *
	 * @var string
	 */
	protected string $capability = 'manage_options';

	/**
	 * Parent page slug (for submenus).
	 *
	 * @var string|null
	 */
	protected ?string $parentSlug = null;

	/**
	 * Menu position (for top-level menus).
	 *
	 * @var integer|null
	 */
	protected ?int $menuPosition = null;

	/**
	 * Icon URL or Dashicons class (for top-level menus).
	 *
	 * @var string|null
	 */
	protected ?string $iconUrl = null;

	/**
	 * Plugin settings instance.
	 *
	 * @var Settings
	 */
	protected Settings $settings;

	/**
	 * Constructor.
	 *
	 * @param Settings $settings Plugin settings instance.
	 */
	public function __construct(Settings $settings)
	{
		$this->settings = $settings;
		$this->init();
	}

	/**
	 * Initialize the page.
	 *
	 * Override this method to perform page-specific initialization.
	 */
	protected function init(): void
	{
		// Override in child classes if needed.
	}

	/**
	 * Register the admin page.
	 *
	 * Called by MenuManager during admin_menu hook.
	 */
	public function register(): void
	{
		if ($this->parentSlug) {
			// Register as submenu page.
			\add_submenu_page(
				$this->parentSlug,
				$this->pageTitle,
				$this->menuTitle,
				$this->capability,
				$this->pageSlug,
				[ $this, 'renderWrapper' ]
			);
		} else {
			// Register as top-level menu page.
			\add_menu_page(
				$this->pageTitle,
				$this->menuTitle,
				$this->capability,
				$this->pageSlug,
				[ $this, 'renderWrapper' ],
				$this->iconUrl ?? '',
				$this->menuPosition
			);
		}
	}

	/**
	 * Enqueue page-specific assets.
	 *
	 * Override this method to enqueue scripts and styles for the page.
	 */
	public function enqueueAssets(): void
	{
		// Override in child classes if needed.
	}

	/**
	 * Render page wrapper (handles permissions and rendering).
	 *
	 * This method is called by WordPress and should not be overridden.
	 * Override render() instead.
	 */
	final public function renderWrapper(): void
	{
		// Check user permissions.
		if (! \current_user_can($this->capability)) {
			\wp_die(
				\esc_html__('You do not have sufficient permissions to access this page.', 'aether-site-exporter'),
				\esc_html__('Permission Denied', 'aether-site-exporter'),
				[ 'response' => 403 ]
			);
		}

		// Render the page (React handles all rendering).
		$this->render();
	}

	/**
	 * Render the page content.
	 *
	 * Override this method to render the page content.
	 * This is the main method that child classes must implement.
	 */
	abstract protected function render(): void;

	/**
	 * Get the page slug.
	 *
	 * @return string
	 */
	public function getSlug(): string
	{
		return $this->pageSlug;
	}

	/**
	 * Check if this is the current page.
	 *
	 * @return bool
	 */
	public function isCurrentPage(): bool
	{
		if (! isset($_GET['page'])) {
			return false;
		}

		$page = \sanitize_text_field(\wp_unslash($_GET['page']));
		return $page === $this->pageSlug;
	}
}
