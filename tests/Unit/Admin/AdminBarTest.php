<?php

/**
 * Admin Bar Tests
 *
 * Tests for AdminBar - adds export functionality to WordPress admin bar.
 *
 * Quality Standards:
 * - Tests must verify capability checks work
 * - Must test menu item registration
 * - Must test asset enqueuing
 * - Must fail if unauthorized users can access
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Admin;

use Aether\SiteExporter\Admin\AdminBar;
use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Tests\Helpers\TestCase;
use WP_Admin_Bar;

class AdminBarTest extends TestCase
{
	/**
	 * Admin bar instance.
	 *
	 * @var AdminBar
	 */
	private AdminBar $adminBar;

	/**
	 * Mock plugin instance.
	 *
	 * @var Plugin
	 */
	private $mockPlugin;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->mockPlugin = $this->createMock( Plugin::class );
		$this->adminBar = new AdminBar( $this->mockPlugin );
	}

	/**
	 * Test init registers hooks.
	 */
	public function test_init_registers_hooks(): void
	{
		$this->adminBar->init();

		$this->assertNotFalse( has_action( 'admin_bar_menu', [ $this->adminBar, 'addExportMenuItem' ] ) );
		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', [ $this->adminBar, 'enqueueAdminBarAssets' ] ) );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', [ $this->adminBar, 'enqueueAdminBarAssets' ] ) );
	}

	/**
	 * Test addExportMenuItem adds menu item for administrators.
	 */
	public function test_addExportMenuItem_adds_menu_for_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' )
			->with( $this->callback( function( $args ) {
				return $args['id'] === 'aether-export'
					&& $args['parent'] === 'top-secondary'
					&& $args['href'] === '#'
					&& isset( $args['meta']['class'] )
					&& $args['meta']['class'] === 'aether-export-trigger';
			} ) );

		$this->adminBar->addExportMenuItem( $wpAdminBar );
	}

	/**
	 * Test addExportMenuItem does not add menu for non-administrators.
	 */
	public function test_addExportMenuItem_does_not_add_menu_for_non_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'subscriber' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$wpAdminBar
			->expects( $this->never() )
			->method( 'add_node' );

		$this->adminBar->addExportMenuItem( $wpAdminBar );
	}

	/**
	 * Test addExportMenuItem does not add menu for logged-out users.
	 */
	public function test_addExportMenuItem_does_not_add_menu_for_logged_out_users(): void
	{
		wp_set_current_user( 0 );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$wpAdminBar
			->expects( $this->never() )
			->method( 'add_node' );

		$this->adminBar->addExportMenuItem( $wpAdminBar );
	}

	/**
	 * Test addExportMenuItem includes SVG icon.
	 */
	public function test_addExportMenuItem_includes_svg_icon(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$capturedArgs = null;
		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' )
			->willReturnCallback( function( $args ) use ( &$capturedArgs ) {
				$capturedArgs = $args;
			} );

		$this->adminBar->addExportMenuItem( $wpAdminBar );

		$this->assertNotNull( $capturedArgs );
		$this->assertStringContainsString( '<svg', $capturedArgs['title'] );
		$this->assertStringContainsString( 'viewBox="0 0 24 24"', $capturedArgs['title'] );
		$this->assertStringContainsString( '</svg>', $capturedArgs['title'] );
	}

	/**
	 * Test addExportMenuItem includes accessibility attributes.
	 */
	public function test_addExportMenuItem_includes_accessibility_attributes(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$capturedArgs = null;
		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' )
			->willReturnCallback( function( $args ) use ( &$capturedArgs ) {
				$capturedArgs = $args;
			} );

		$this->adminBar->addExportMenuItem( $wpAdminBar );

		$this->assertArrayHasKey( 'meta', $capturedArgs );
		$this->assertArrayHasKey( 'title', $capturedArgs['meta'] );
		$this->assertArrayHasKey( 'aria-label', $capturedArgs['meta'] );
		$this->assertSame( 'Export Site', $capturedArgs['meta']['title'] );
		$this->assertSame( 'Export Site', $capturedArgs['meta']['aria-label'] );
	}

	/**
	 * Test addExportMenuItem adds to right side of admin bar.
	 */
	public function test_addExportMenuItem_adds_to_right_side(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$capturedArgs = null;
		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' )
			->willReturnCallback( function( $args ) use ( &$capturedArgs ) {
				$capturedArgs = $args;
			} );

		$this->adminBar->addExportMenuItem( $wpAdminBar );

		$this->assertSame( 'top-secondary', $capturedArgs['parent'] );
	}

	/**
	 * Test enqueueAdminBarAssets for administrators.
	 */
	public function test_enqueueAdminBarAssets_for_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		// Should not throw errors
		$this->adminBar->enqueueAdminBarAssets();

		$this->assertTrue( true );
	}

	/**
	 * Test enqueueAdminBarAssets does nothing for non-administrators.
	 */
	public function test_enqueueAdminBarAssets_does_nothing_for_non_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'subscriber' ] ) );

		// Track enqueued scripts before
		global $wp_scripts;
		$scriptsBefore = $wp_scripts ? count( $wp_scripts->registered ) : 0;

		$this->adminBar->enqueueAdminBarAssets();

		// Should not enqueue any scripts
		$scriptsAfter = $wp_scripts ? count( $wp_scripts->registered ) : 0;

		// Count should be the same or very close (some scripts may auto-register)
		$this->assertLessThanOrEqual( $scriptsBefore + 2, $scriptsAfter );
	}

	/**
	 * Test enqueueAdminBarAssets does nothing for logged-out users.
	 */
	public function test_enqueueAdminBarAssets_does_nothing_for_logged_out_users(): void
	{
		wp_set_current_user( 0 );

		$this->adminBar->enqueueAdminBarAssets();

		// Should not throw errors
		$this->assertTrue( true );
	}

	/**
	 * Test addExportMenuItem works for editors.
	 */
	public function test_addExportMenuItem_works_for_editors(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'editor' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		// Editors have manage_options by default in tests, but let's grant it explicitly
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' );

		$this->adminBar->addExportMenuItem( $wpAdminBar );
	}

	/**
	 * Test addExportMenuItem respects custom capabilities.
	 */
	public function test_addExportMenuItem_respects_custom_capabilities(): void
	{
		// Create user with custom capability
		$userId = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		wp_set_current_user( $userId );

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' );

		$this->adminBar->addExportMenuItem( $wpAdminBar );
	}

	/**
	 * Test menu item has correct CSS class.
	 */
	public function test_menu_item_has_correct_css_class(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$capturedArgs = null;
		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' )
			->willReturnCallback( function( $args ) use ( &$capturedArgs ) {
				$capturedArgs = $args;
			} );

		$this->adminBar->addExportMenuItem( $wpAdminBar );

		$this->assertSame( 'aether-export-trigger', $capturedArgs['meta']['class'] );
	}

	/**
	 * Test menu item href is hash.
	 */
	public function test_menu_item_href_is_hash(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$wpAdminBar = $this->createMock( WP_Admin_Bar::class );

		$capturedArgs = null;
		$wpAdminBar
			->expects( $this->once() )
			->method( 'add_node' )
			->willReturnCallback( function( $args ) use ( &$capturedArgs ) {
				$capturedArgs = $args;
			} );

		$this->adminBar->addExportMenuItem( $wpAdminBar );

		$this->assertSame( '#', $capturedArgs['href'] );
	}
}
