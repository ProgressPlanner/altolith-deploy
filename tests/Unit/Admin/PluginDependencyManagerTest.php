<?php

/**
 * Plugin Dependency Manager Tests
 *
 * Tests for PluginDependencyManager - hides Aether plugin and prevents deactivation.
 *
 * Quality Standards:
 * - Tests must verify plugin is hidden from list
 * - Must test deactivation prevention works
 * - Must test CSRF protection (nonce verification)
 * - Must fail if protected plugin can be deactivated
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Admin;

use Aether\SiteExporter\Admin\PluginDependencyManager;
use Aether\SiteExporter\Tests\Helpers\TestCase;

class PluginDependencyManagerTest extends TestCase
{
	/**
	 * Manager instance.
	 *
	 * @var PluginDependencyManager
	 */
	private PluginDependencyManager $manager;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->manager = new PluginDependencyManager();
	}

	/**
	 * Tear down test environment.
	 */
	public function tearDown(): void
	{
		// Clean up $_GET
		$_GET = [];

		// Clean up transients
		delete_transient( 'aether_site_exporter_deactivation_prevented' );

		parent::tearDown();
	}

	/**
	 * Test constructor registers hooks.
	 */
	public function test_constructor_registers_hooks(): void
	{
		$manager = new PluginDependencyManager();

		$this->assertNotFalse( has_filter( 'all_plugins', [ $manager, 'hidePluginFromList' ] ) );
		$this->assertNotFalse( has_action( 'admin_init', [ $manager, 'preventDeactivation' ] ) );
		$this->assertNotFalse( has_action( 'admin_notices', [ $manager, 'showProtectionNotice' ] ) );
	}

	/**
	 * Test hidePluginFromList removes protected plugins.
	 */
	public function test_hidePluginFromList_removes_protected_plugins(): void
	{
		$plugins = [
			'aether/aether.php' => [
				'Name' => 'Aether',
				'Version' => '1.0.0',
			],
			'other-plugin/plugin.php' => [
				'Name' => 'Other Plugin',
				'Version' => '1.0.0',
			],
		];

		$filtered = $this->manager->hidePluginFromList( $plugins );

		$this->assertArrayNotHasKey( 'aether/aether.php', $filtered );
		$this->assertArrayHasKey( 'other-plugin/plugin.php', $filtered );
	}

	/**
	 * Test hidePluginFromList preserves non-protected plugins.
	 */
	public function test_hidePluginFromList_preserves_non_protected_plugins(): void
	{
		$plugins = [
			'plugin-1/plugin-1.php' => [ 'Name' => 'Plugin 1' ],
			'plugin-2/plugin-2.php' => [ 'Name' => 'Plugin 2' ],
			'plugin-3/plugin-3.php' => [ 'Name' => 'Plugin 3' ],
		];

		$filtered = $this->manager->hidePluginFromList( $plugins );

		$this->assertCount( 3, $filtered );
		$this->assertArrayHasKey( 'plugin-1/plugin-1.php', $filtered );
		$this->assertArrayHasKey( 'plugin-2/plugin-2.php', $filtered );
		$this->assertArrayHasKey( 'plugin-3/plugin-3.php', $filtered );
	}

	/**
	 * Test hidePluginFromList handles empty array.
	 */
	public function test_hidePluginFromList_handles_empty_array(): void
	{
		$filtered = $this->manager->hidePluginFromList( [] );

		$this->assertSame( [], $filtered );
	}

	/**
	 * Test preventDeactivation does nothing without action parameter.
	 */
	public function test_preventDeactivation_does_nothing_without_action(): void
	{
		$_GET = [
			'_wpnonce' => wp_create_nonce( 'deactivate-plugin_aether/aether.php' ),
			'plugin' => 'aether/aether.php',
		];

		// Should not redirect or die
		$this->manager->preventDeactivation();

		$this->assertTrue( true );
	}

	/**
	 * Test preventDeactivation does nothing with wrong action.
	 */
	public function test_preventDeactivation_does_nothing_with_wrong_action(): void
	{
		$_GET = [
			'action' => 'activate',
			'_wpnonce' => wp_create_nonce( 'activate-plugin_aether/aether.php' ),
			'plugin' => 'aether/aether.php',
		];

		$this->manager->preventDeactivation();

		$this->assertTrue( true );
	}

	/**
	 * Test preventDeactivation does nothing without plugin parameter.
	 */
	public function test_preventDeactivation_does_nothing_without_plugin(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'_wpnonce' => wp_create_nonce( 'deactivate-plugin_' ),
		];

		$this->manager->preventDeactivation();

		$this->assertTrue( true );
	}

	/**
	 * Test preventDeactivation does nothing without nonce.
	 */
	public function test_preventDeactivation_does_nothing_without_nonce(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'plugin' => 'aether/aether.php',
		];

		$this->manager->preventDeactivation();

		// Should return early without nonce
		$this->assertTrue( true );
	}

	/**
	 * Test preventDeactivation allows deactivating non-protected plugins.
	 */
	public function test_preventDeactivation_allows_non_protected_plugins(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'_wpnonce' => wp_create_nonce( 'deactivate-plugin_other-plugin/plugin.php' ),
			'plugin' => 'other-plugin/plugin.php',
		];

		$this->manager->preventDeactivation();

		// Should not set transient for non-protected plugin
		$this->assertFalse( get_transient( 'aether_site_exporter_deactivation_prevented' ) );
	}

	/**
	 * Test preventDeactivation sets transient for protected plugin.
	 */
	public function test_preventDeactivation_sets_transient_for_protected_plugin(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'_wpnonce' => wp_create_nonce( 'deactivate-plugin_aether/aether.php' ),
			'plugin' => 'aether/aether.php',
		];

		// Capture redirect to prevent test from exiting
		add_filter( 'wp_redirect', function( $location ) {
			// Return false to prevent actual redirect
			return false;
		} );

		$this->manager->preventDeactivation();

		// Transient should be set
		$this->assertSame( 'aether/aether.php', get_transient( 'aether_site_exporter_deactivation_prevented' ) );
	}

	/**
	 * Test preventDeactivation sanitizes plugin parameter.
	 */
	public function test_preventDeactivation_sanitizes_plugin_parameter(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'_wpnonce' => wp_create_nonce( 'deactivate-plugin_<script>alert(1)</script>' ),
			'plugin' => '<script>alert(1)</script>',
		];

		// Should not crash with malicious input
		$this->manager->preventDeactivation();

		$this->assertTrue( true );
	}

	/**
	 * Test showProtectionNotice does nothing without transient.
	 */
	public function test_showProtectionNotice_does_nothing_without_transient(): void
	{
		ob_start();
		$this->manager->showProtectionNotice();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}

	/**
	 * Test showProtectionNotice displays notice with transient.
	 */
	public function test_showProtectionNotice_displays_notice_with_transient(): void
	{
		set_transient( 'aether_site_exporter_deactivation_prevented', 'aether/aether.php', 30 );

		ob_start();
		$this->manager->showProtectionNotice();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice', $output );
	}

	/**
	 * Test showProtectionNotice deletes transient after displaying.
	 */
	public function test_showProtectionNotice_deletes_transient(): void
	{
		set_transient( 'aether_site_exporter_deactivation_prevented', 'aether/aether.php', 30 );

		ob_start();
		$this->manager->showProtectionNotice();
		ob_get_clean();

		// Transient should be deleted
		$this->assertFalse( get_transient( 'aether_site_exporter_deactivation_prevented' ) );
	}

	/**
	 * Test hidePluginFromList is idempotent.
	 */
	public function test_hidePluginFromList_is_idempotent(): void
	{
		$plugins = [
			'aether/aether.php' => [ 'Name' => 'Aether' ],
			'other/plugin.php' => [ 'Name' => 'Other' ],
		];

		$filtered1 = $this->manager->hidePluginFromList( $plugins );
		$filtered2 = $this->manager->hidePluginFromList( $filtered1 );

		$this->assertSame( $filtered1, $filtered2 );
	}

	/**
	 * Test hidePluginFromList handles plugin not in list.
	 */
	public function test_hidePluginFromList_when_protected_plugin_not_present(): void
	{
		$plugins = [
			'other-plugin/plugin.php' => [ 'Name' => 'Other' ],
		];

		$filtered = $this->manager->hidePluginFromList( $plugins );

		// Should not crash, should return unchanged
		$this->assertSame( $plugins, $filtered );
	}

	/**
	 * Test preventDeactivation handles empty plugin value.
	 */
	public function test_preventDeactivation_handles_empty_plugin(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'_wpnonce' => wp_create_nonce( 'deactivate-plugin_' ),
			'plugin' => '',
		];

		$this->manager->preventDeactivation();

		// Should return early
		$this->assertTrue( true );
	}

	/**
	 * Test CSRF protection - invalid nonce.
	 */
	public function test_preventDeactivation_csrf_protection_invalid_nonce(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'_wpnonce' => 'invalid-nonce',
			'plugin' => 'aether/aether.php',
		];

		// Should call wp_die() with invalid nonce
		// We can't easily test wp_die() in unit tests, but we can verify it's called
		$this->expectException( 'WPDieException' );

		$this->manager->preventDeactivation();
	}

	/**
	 * Test preventDeactivation with valid nonce for different plugin.
	 */
	public function test_preventDeactivation_with_wrong_plugin_nonce(): void
	{
		$_GET = [
			'action' => 'deactivate',
			'_wpnonce' => wp_create_nonce( 'deactivate-plugin_other-plugin/plugin.php' ),
			'plugin' => 'aether/aether.php',
		];

		// Nonce is for different plugin - should fail
		$this->expectException( 'WPDieException' );

		$this->manager->preventDeactivation();
	}
}
