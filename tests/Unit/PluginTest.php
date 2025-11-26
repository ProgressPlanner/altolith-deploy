<?php
/**
 * Plugin Class Tests
 *
 * Tests for the main Plugin orchestrator class.
 * Verifies singleton pattern, initialization, hooks registration,
 * and key functionality.
 *
 * Quality Standards:
 * - Tests must verify singleton pattern works correctly
 * - Must test hooks are registered
 * - Must test key public methods
 * - Must test anonymous user forcing for static site generation
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Plugin;

/**
 * Plugin test case.
 */
class PluginTest extends TestCase {

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Set up WordPress options for testing.
		update_option( 'siteurl', 'https://example.com' );
		update_option( 'home', 'https://example.com' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		// Clean up $_SERVER superglobal modifications.
		unset( $_SERVER['HTTP_USER_AGENT'] );
		unset( $_SERVER['HTTP_X_AETHER_SITE_EXPORTER_ANONYMOUS'] );
		unset( $_GET['aether_site_exporter_anonymous'] );

		parent::tear_down();
	}

	// ========================================================================
	// Singleton Pattern Tests
	// ========================================================================

	/**
	 * Test getInstance returns same instance.
	 *
	 * Purpose: Verify singleton pattern implementation
	 */
	public function test_getInstance_returns_same_instance() {
		$instance1 = Plugin::getInstance();
		$instance2 = Plugin::getInstance();

		$this->assertSame(
			$instance1,
			$instance2,
			'getInstance should return the same instance (singleton)'
		);
	}

	/**
	 * Test getInstance returns Plugin instance.
	 */
	public function test_getInstance_returns_plugin_instance() {
		$instance = Plugin::getInstance();

		$this->assertInstanceOf(
			Plugin::class,
			$instance,
			'getInstance should return Plugin instance'
		);
	}

	// ========================================================================
	// Initialization Tests
	// ========================================================================

	/**
	 * Test REST API routes action is registered.
	 */
	public function test_registers_rest_api_init_action() {
		$plugin = Plugin::getInstance();

		$this->assertTrue(
			has_action( 'rest_api_init', [ $plugin, 'registerRestRoutes' ] ) !== false,
			'Should register rest_api_init action'
		);
	}

	/**
	 * Test cleanup action is registered.
	 */
	public function test_registers_cleanup_action() {
		$plugin = Plugin::getInstance();

		$this->assertTrue(
			has_action( 'wp_scheduled_delete', [ $plugin, 'cleanupExpiredExports' ] ) !== false,
			'Should register wp_scheduled_delete action for cleanup'
		);
	}

	/**
	 * Test admin title filter is registered.
	 */
	public function test_registers_admin_title_filter() {
		$plugin = Plugin::getInstance();

		$this->assertTrue(
			has_filter( 'admin_title', [ $plugin, 'ensureAdminTitleIsString' ] ) !== false,
			'Should register admin_title filter'
		);
	}

	/**
	 * Test script loader tag filter is registered.
	 */
	public function test_registers_script_loader_tag_filter() {
		$plugin = Plugin::getInstance();

		$this->assertTrue(
			has_filter( 'script_loader_tag', [ $plugin, 'addProviderScriptAttribute' ] ) !== false,
			'Should register script_loader_tag filter'
		);
	}

	/**
	 * Test anonymous user forcing action is registered.
	 */
	public function test_registers_anonymous_user_action() {
		$plugin = Plugin::getInstance();

		$this->assertTrue(
			has_action( 'init', [ $plugin, 'forceAnonymousUser' ] ) !== false,
			'Should register init action for anonymous user forcing'
		);
	}

	// ========================================================================
	// forceAnonymousUser() Tests
	// ========================================================================

	/**
	 * Test forceAnonymousUser with Aether User-Agent.
	 *
	 * Purpose: Verify requests from static site generator are forced anonymous
	 */
	public function test_forceAnonymousUser_forces_anonymous_with_aether_user_agent() {
		$plugin = Plugin::getInstance();

		// Create logged in user.
		$user_id = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user_id );

		$this->assertEquals( $user_id, get_current_user_id(), 'Should start as logged in user' );

		// Set Aether User-Agent.
		$_SERVER['HTTP_USER_AGENT'] = 'Aether Static Site Generator';

		$plugin->forceAnonymousUser();

		$this->assertEquals( 0, get_current_user_id(), 'Should force anonymous user' );
	}

	/**
	 * Test forceAnonymousUser with custom header.
	 */
	public function test_forceAnonymousUser_forces_anonymous_with_custom_header() {
		$plugin = Plugin::getInstance();

		// Create logged in user.
		$user_id = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user_id );

		// Set custom header.
		$_SERVER['HTTP_X_AETHER_SITE_EXPORTER_ANONYMOUS'] = 'true';

		$plugin->forceAnonymousUser();

		$this->assertEquals( 0, get_current_user_id(), 'Should force anonymous user with custom header' );
	}

	/**
	 * Test forceAnonymousUser with query parameter.
	 */
	public function test_forceAnonymousUser_forces_anonymous_with_query_param() {
		$plugin = Plugin::getInstance();

		// Create logged in user.
		$user_id = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user_id );

		// Set query parameter.
		$_GET['aether_site_exporter_anonymous'] = '1';

		$plugin->forceAnonymousUser();

		$this->assertEquals( 0, get_current_user_id(), 'Should force anonymous user with query param' );
	}

	/**
	 * Test forceAnonymousUser does nothing for normal requests.
	 */
	public function test_forceAnonymousUser_does_not_affect_normal_requests() {
		$plugin = Plugin::getInstance();

		// Create logged in user.
		$user_id = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user_id );

		// Normal user agent.
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 Normal Browser';

		$plugin->forceAnonymousUser();

		$this->assertEquals( $user_id, get_current_user_id(), 'Should not affect normal requests' );
	}

	// ========================================================================
	// ensureAdminTitleIsString() Tests
	// ========================================================================

	/**
	 * Test ensureAdminTitleIsString returns string for null input.
	 */
	public function test_ensureAdminTitleIsString_handles_null_admin_title() {
		$plugin = Plugin::getInstance();

		$result = $plugin->ensureAdminTitleIsString( null, 'Page Title' );

		$this->assertIsString( $result, 'Should return string' );
		$this->assertEquals( 'Page Title', $result, 'Should return page title when admin title is null' );
	}

	/**
	 * Test ensureAdminTitleIsString returns admin title when valid.
	 */
	public function test_ensureAdminTitleIsString_returns_admin_title_when_valid() {
		$plugin = Plugin::getInstance();

		$result = $plugin->ensureAdminTitleIsString( 'Admin Title', 'Page Title' );

		$this->assertEquals( 'Admin Title', $result, 'Should return admin title when valid' );
	}

	/**
	 * Test ensureAdminTitleIsString handles both null values.
	 */
	public function test_ensureAdminTitleIsString_handles_both_null() {
		$plugin = Plugin::getInstance();

		$result = $plugin->ensureAdminTitleIsString( null, null );

		$this->assertIsString( $result, 'Should return string even when both are null' );
		$this->assertEquals( '', $result, 'Should return empty string when both are null' );
	}

	// ========================================================================
	// addProviderScriptAttribute() Tests
	// ========================================================================

	/**
	 * Test addProviderScriptAttribute adds attribute for provider scripts.
	 */
	public function test_addProviderScriptAttribute_adds_data_attribute() {
		$plugin = Plugin::getInstance();

		$tag    = '<script src="provider.js"></script>';
		$handle = 'aether-provider-local-filesystem';

		$result = $plugin->addProviderScriptAttribute( $tag, $handle );

		$this->assertStringContainsString(
			'data-provider-id="local-filesystem"',
			$result,
			'Should add data-provider-id attribute'
		);
	}

	/**
	 * Test addProviderScriptAttribute ignores non-provider scripts.
	 */
	public function test_addProviderScriptAttribute_ignores_non_provider_scripts() {
		$plugin = Plugin::getInstance();

		$tag    = '<script src="other.js"></script>';
		$handle = 'wp-element';

		$result = $plugin->addProviderScriptAttribute( $tag, $handle );

		$this->assertStringNotContainsString(
			'data-provider-id',
			$result,
			'Should not add data-provider-id to non-provider scripts'
		);

		$this->assertEquals( $tag, $result, 'Should return tag unchanged' );
	}

	// ========================================================================
	// getAssetDiscovery() Tests
	// ========================================================================

	/**
	 * Test getAssetDiscovery returns AssetDiscoveryService instance.
	 */
	public function test_getAssetDiscovery_returns_asset_discovery_service() {
		$plugin = Plugin::getInstance();

		$assetDiscovery = $plugin->getAssetDiscovery();

		$this->assertInstanceOf(
			\Aether\SiteExporter\Sync\AssetDiscoveryService::class,
			$assetDiscovery,
			'Should return AssetDiscoveryService instance'
		);
	}

	/**
	 * Test getAssetDiscovery returns same instance on multiple calls.
	 */
	public function test_getAssetDiscovery_returns_same_instance() {
		$plugin = Plugin::getInstance();

		$instance1 = $plugin->getAssetDiscovery();
		$instance2 = $plugin->getAssetDiscovery();

		$this->assertSame(
			$instance1,
			$instance2,
			'Should return the same AssetDiscoveryService instance'
		);
	}

	// ========================================================================
	// cleanupExpiredExports() Tests
	// ========================================================================

	/**
	 * Test cleanupExpiredExports executes without error.
	 *
	 * Purpose: Verify cleanup method is callable and doesn't throw
	 */
	public function test_cleanupExpiredExports_executes_without_error() {
		$plugin = Plugin::getInstance();

		// Should not throw any exceptions.
		$plugin->cleanupExpiredExports();

		$this->assertTrue( true, 'cleanupExpiredExports should execute without error' );
	}
}
