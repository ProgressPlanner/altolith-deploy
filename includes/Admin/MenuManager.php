<?php

/**
 * Menu Manager
 *
 * Manages the admin menu structure and page registration.
 *
 * @package Aether\Admin
 */

namespace Aether\SiteExporter\Admin;

/**
 * Class MenuManager
 *
 * Handles registration and management of all admin pages.
 */
class MenuManager
{
	/**
	 * Registered admin pages.
	 *
	 * @var array<string, BaseAdminPage>
	 */
	private array $pages = [];

	/**
	 * Main menu slug.
	 *
	 * @var string
	 */
	private string $mainMenuSlug = 'aether';

	/**
	 * Initialize the menu manager.
	 *
	 * Registers WordPress hooks.
	 */
	public function init(): void
	{
		\add_action('admin_menu', [ $this, 'registerMenus' ]);
		\add_action('admin_enqueue_scripts', [ $this, 'enqueueAssets' ]);
	}

	/**
	 * Register a page.
	 *
	 * @param BaseAdminPage $page Page instance.
	 */
	public function registerPage(BaseAdminPage $page): void
	{
		$this->pages[ $page->getSlug() ] = $page;
	}

	/**
	 * Register all admin menus.
	 *
	 * Called by WordPress during admin_menu hook.
	 */
	public function registerMenus(): void
	{
		// Register pages in order.
		foreach ($this->pages as $page) {
			$page->register();
		}
	}

	/**
	 * Enqueue assets for admin pages.
	 *
	 * Called by WordPress during admin_enqueue_scripts hook.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueueAssets(string $hook): void
	{
		// Enqueue common admin assets.
		$this->enqueueCommonAssets();

		// Enqueue page-specific assets.
		foreach ($this->pages as $page) {
			if ($page->isCurrentPage()) {
				$page->enqueueAssets();
				break;
			}
		}
	}

	/**
	 * Enqueue common admin assets.
	 *
	 * Assets that should be loaded on all Aether admin pages.
	 */
	private function enqueueCommonAssets(): void
	{
		// Check if we're on any Aether admin page.
		if (! $this->isAetherPage()) {
			return;
		}

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
	 * Check if current page is an Aether admin page.
	 *
	 * @return bool
	 */
	private function isAetherPage(): bool
	{
		if (! isset($_GET['page'])) {
			return false;
		}

		$currentPage = \sanitize_text_field(\wp_unslash($_GET['page']));

		// Check if current page is registered.
		return isset($this->pages[ $currentPage ]);
	}

	/**
	 * Get a registered page by slug.
	 *
	 * @param string $slug Page slug.
	 * @return BaseAdminPage|null
	 */
	public function getPage(string $slug): ?BaseAdminPage
	{
		return $this->pages[ $slug ] ?? null;
	}

	/**
	 * Get all registered pages.
	 *
	 * @return array<string, BaseAdminPage>
	 */
	public function getPages(): array
	{
		return $this->pages;
	}

	/**
	 * Get the main menu slug.
	 *
	 * @return string
	 */
	public function getMainMenuSlug(): string
	{
		return $this->mainMenuSlug;
	}
}
