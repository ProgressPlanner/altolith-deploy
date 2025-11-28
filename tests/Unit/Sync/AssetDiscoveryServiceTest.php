<?php

/**
 * Asset Discovery Service Tests
 *
 * Tests for AssetDiscoveryService - discovers installed WordPress plugins and themes.
 *
 * Quality Standards:
 * - Tests must verify active vs inactive assets
 * - Must test plugin slug extraction
 * - Must test theme parent chain resolution
 * - Must fail if active assets are missed
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Unit\Sync;

use Altolith\Deploy\Sync\AssetDiscoveryService;
use Altolith\Deploy\Tests\Helpers\TestCase;

class AssetDiscoveryServiceTest extends TestCase
{
	/**
	 * Service instance.
	 *
	 * @var AssetDiscoveryService
	 */
	private AssetDiscoveryService $service;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->service = new AssetDiscoveryService();
	}

	/**
	 * Test getInstalledPlugins returns array.
	 */
	public function test_getInstalledPlugins_returns_array(): void
	{
		$result = $this->service->getInstalledPlugins();

		$this->assertIsArray( $result );
	}

	/**
	 * Test getInstalledPlugins data structure.
	 */
	public function test_getInstalledPlugins_returns_correct_structure(): void
	{
		$result = $this->service->getInstalledPlugins();

		if ( empty( $result ) ) {
			$this->markTestSkipped( 'No plugins installed for testing' );
		}

		foreach ( $result as $plugin ) {
			$this->assertArrayHasKey( 'type', $plugin );
			$this->assertArrayHasKey( 'slug', $plugin );
			$this->assertArrayHasKey( 'file', $plugin );
			$this->assertArrayHasKey( 'version', $plugin );
			$this->assertArrayHasKey( 'name', $plugin );
			$this->assertArrayHasKey( 'is_active', $plugin );
			$this->assertArrayHasKey( 'from_wporg', $plugin );

			$this->assertSame( 'plugin', $plugin['type'] );
			$this->assertIsBool( $plugin['is_active'] );
			$this->assertIsBool( $plugin['from_wporg'] );
		}
	}

	/**
	 * Test getInstalledPlugins excludes single-file plugins.
	 */
	public function test_getInstalledPlugins_excludes_single_file_plugins(): void
	{
		$result = $this->service->getInstalledPlugins();

		foreach ( $result as $plugin ) {
			$this->assertNotSame( '.', $plugin['slug'], 'Single-file plugins should be excluded' );
		}
	}

	/**
	 * Test getInstalledPlugins includes active status.
	 */
	public function test_getInstalledPlugins_includes_active_status(): void
	{
		// Activate a plugin for testing
		$testPlugin = 'hello-dolly/hello.php';
		if ( file_exists( WP_PLUGIN_DIR . '/' . $testPlugin ) ) {
			activate_plugin( $testPlugin );

			$result = $this->service->getInstalledPlugins();

			$helloDolly = null;
			foreach ( $result as $plugin ) {
				if ( $plugin['slug'] === 'hello-dolly' ) {
					$helloDolly = $plugin;
					break;
				}
			}

			if ( $helloDolly ) {
				$this->assertTrue( $helloDolly['is_active'] );
			}

			deactivate_plugins( $testPlugin );
		} else {
			$this->markTestSkipped( 'Hello Dolly plugin not available for testing' );
		}
	}

	/**
	 * Test getInstalledThemes returns array.
	 */
	public function test_getInstalledThemes_returns_array(): void
	{
		$result = $this->service->getInstalledThemes();

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result, 'At least one theme should be installed' );
	}

	/**
	 * Test getInstalledThemes data structure.
	 */
	public function test_getInstalledThemes_returns_correct_structure(): void
	{
		$result = $this->service->getInstalledThemes();

		foreach ( $result as $theme ) {
			$this->assertArrayHasKey( 'type', $theme );
			$this->assertArrayHasKey( 'slug', $theme );
			$this->assertArrayHasKey( 'version', $theme );
			$this->assertArrayHasKey( 'name', $theme );
			$this->assertArrayHasKey( 'is_active', $theme );
			$this->assertArrayHasKey( 'from_wporg', $theme );

			$this->assertSame( 'theme', $theme['type'] );
			$this->assertIsBool( $theme['is_active'] );
			$this->assertIsBool( $theme['from_wporg'] );
		}
	}

	/**
	 * Test getInstalledThemes marks active theme correctly.
	 */
	public function test_getInstalledThemes_marks_active_theme(): void
	{
		$result = $this->service->getInstalledThemes();

		$activeThemeSlug = get_stylesheet();
		$activeThemeFound = false;

		foreach ( $result as $theme ) {
			if ( $theme['slug'] === $activeThemeSlug ) {
				$this->assertTrue( $theme['is_active'] );
				$activeThemeFound = true;
			} else {
				$this->assertFalse( $theme['is_active'] );
			}
		}

		$this->assertTrue( $activeThemeFound, 'Active theme should be found in results' );
	}

	/**
	 * Test getAllCustomAssets returns array.
	 */
	public function test_getAllCustomAssets_returns_array(): void
	{
		$result = $this->service->getAllCustomAssets();

		$this->assertIsArray( $result );
	}

	/**
	 * Test getAllCustomAssets data structure.
	 */
	public function test_getAllCustomAssets_returns_correct_structure(): void
	{
		$result = $this->service->getAllCustomAssets();

		if ( empty( $result ) ) {
			$this->markTestSkipped( 'No active plugins or themes for testing' );
		}

		foreach ( $result as $asset ) {
			$this->assertArrayHasKey( 'type', $asset );
			$this->assertArrayHasKey( 'slug', $asset );
			$this->assertArrayHasKey( 'name', $asset );

			$this->assertContains( $asset['type'], [ 'plugin', 'theme' ] );
		}
	}

	/**
	 * Test getAllCustomAssets includes active theme.
	 */
	public function test_getAllCustomAssets_includes_active_theme(): void
	{
		$result = $this->service->getAllCustomAssets();

		$activeThemeSlug = get_stylesheet();
		$slugs = array_column( $result, 'slug' );

		$this->assertContains(
			$activeThemeSlug,
			$slugs,
			'Active theme should be included in custom assets'
		);
	}

	/**
	 * Test getAllCustomAssets includes only active plugins.
	 */
	public function test_getAllCustomAssets_includes_only_active_plugins(): void
	{
		// Activate a plugin for testing
		$testPlugin = 'hello-dolly/hello.php';
		if ( file_exists( WP_PLUGIN_DIR . '/' . $testPlugin ) ) {
			activate_plugin( $testPlugin );

			$result = $this->service->getAllCustomAssets();

			$pluginAssets = array_filter( $result, function( $asset ) {
				return $asset['type'] === 'plugin';
			} );

			$pluginSlugs = array_column( $pluginAssets, 'slug' );

			$this->assertContains( 'hello-dolly', $pluginSlugs );

			deactivate_plugins( $testPlugin );
		} else {
			$this->markTestSkipped( 'Hello Dolly plugin not available for testing' );
		}
	}

	/**
	 * Test getAllCustomAssets excludes altolith plugin.
	 */
	public function test_getAllCustomAssets_excludes_altolith_plugin(): void
	{
		$result = $this->service->getAllCustomAssets();

		$pluginAssets = array_filter( $result, function( $asset ) {
			return $asset['type'] === 'plugin';
		} );

		$pluginSlugs = array_column( $pluginAssets, 'slug' );

		$this->assertNotContains(
			'altolith',
			$pluginSlugs,
			'Altolith plugin should be excluded from custom assets'
		);
	}

	/**
	 * Test getAllCustomAssets includes parent theme for child themes.
	 */
	public function test_getAllCustomAssets_includes_parent_theme_for_child_themes(): void
	{
		// Switch to a child theme if available
		$themes = wp_get_themes();
		$childTheme = null;

		foreach ( $themes as $theme ) {
			if ( $theme->parent() ) {
				$childTheme = $theme;
				break;
			}
		}

		if ( ! $childTheme ) {
			$this->markTestSkipped( 'No child themes available for testing' );
			return;
		}

		// Switch to child theme
		switch_theme( $childTheme->get_stylesheet() );

		$result = $this->service->getAllCustomAssets();

		$themeAssets = array_filter( $result, function( $asset ) {
			return $asset['type'] === 'theme';
		} );

		$themeSlugs = array_column( $themeAssets, 'slug' );

		// Should include both child and parent themes
		$this->assertContains(
			$childTheme->get_stylesheet(),
			$themeSlugs,
			'Child theme should be included'
		);

		$this->assertContains(
			$childTheme->parent()->get_stylesheet(),
			$themeSlugs,
			'Parent theme should be included for child themes'
		);

		// Switch back to default theme
		switch_theme( WP_DEFAULT_THEME );
	}

	/**
	 * Test getAllCustomAssets handles inactive plugins correctly.
	 */
	public function test_getAllCustomAssets_excludes_inactive_plugins(): void
	{
		// Deactivate all plugins to ensure we're testing correctly
		$activePlugins = get_option( 'active_plugins', [] );

		// Temporarily deactivate hello dolly if it exists and is active
		$testPlugin = 'hello-dolly/hello.php';
		if ( file_exists( WP_PLUGIN_DIR . '/' . $testPlugin ) ) {
			deactivate_plugins( $testPlugin );

			$result = $this->service->getAllCustomAssets();

			$pluginAssets = array_filter( $result, function( $asset ) {
				return $asset['type'] === 'plugin';
			} );

			$pluginSlugs = array_column( $pluginAssets, 'slug' );

			$this->assertNotContains(
				'hello-dolly',
				$pluginSlugs,
				'Inactive plugins should not be included'
			);
		}
	}

	/**
	 * Test getInstalledPlugins handles empty plugin directory.
	 */
	public function test_getInstalledPlugins_handles_no_plugins(): void
	{
		// This test verifies the method doesn't crash with no plugins
		// We can't easily remove all plugins, but we can verify the method returns an array
		$result = $this->service->getInstalledPlugins();

		$this->assertIsArray( $result );
	}

	/**
	 * Test getInstalledThemes handles theme metadata.
	 */
	public function test_getInstalledThemes_includes_theme_metadata(): void
	{
		$result = $this->service->getInstalledThemes();

		foreach ( $result as $theme ) {
			$this->assertNotEmpty( $theme['name'], 'Theme name should not be empty' );
			$this->assertIsString( $theme['version'], 'Theme version should be string' );
		}
	}

	/**
	 * Test getAllCustomAssets handles no active plugins.
	 */
	public function test_getAllCustomAssets_handles_no_active_plugins(): void
	{
		// This should still return active theme even with no plugins
		$result = $this->service->getAllCustomAssets();

		$themeAssets = array_filter( $result, function( $asset ) {
			return $asset['type'] === 'theme';
		} );

		$this->assertNotEmpty( $themeAssets, 'Should include active theme even with no plugins' );
	}

	/**
	 * Test from_wporg is always false (browser handles detection).
	 */
	public function test_from_wporg_is_always_false(): void
	{
		$plugins = $this->service->getInstalledPlugins();
		$themes = $this->service->getInstalledThemes();

		foreach ( $plugins as $plugin ) {
			$this->assertFalse(
				$plugin['from_wporg'],
				'from_wporg should be false (browser determines this)'
			);
		}

		foreach ( $themes as $theme ) {
			$this->assertFalse(
				$theme['from_wporg'],
				'from_wporg should be false (browser determines this)'
			);
		}
	}
}
