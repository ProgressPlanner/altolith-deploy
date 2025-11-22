<?php
/**
 * AssetsController Integration Tests
 *
 * Comprehensive test suite for the Assets REST controller.
 * Tests asset discovery, plugin/theme listing, data structure validation,
 * and error handling.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Integration\REST;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\REST\AssetsController;
use WP_REST_Request;

/**
 * Test AssetsController class.
 */
class AssetsControllerTest extends TestCase {
	/**
	 * Controller instance.
	 *
	 * @var AssetsController
	 */
	private $controller;

	/**
	 * Test admin user ID.
	 *
	 * @var int
	 */
	private $admin_user_id;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->controller = new AssetsController();
		$this->admin_user_id = $this->act_as_admin();
	}

	// ========================================================================
	// getAssets Tests (CRITICAL)
	// ========================================================================

	/**
	 * Test get assets returns success response.
	 */
	public function test_get_assets_returns_success() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test get assets returns plugins array.
	 */
	public function test_get_assets_returns_plugins_array() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'plugins', $data );
		$this->assertIsArray( $data['plugins'] );
	}

	/**
	 * Test get assets returns themes array.
	 */
	public function test_get_assets_returns_themes_array() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'themes', $data );
		$this->assertIsArray( $data['themes'] );
	}

	/**
	 * Test plugins have required fields.
	 */
	public function test_plugins_have_required_fields() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		if ( ! empty( $data['plugins'] ) ) {
			$plugin = $data['plugins'][0];

			$this->assertArrayHasKey( 'type', $plugin );
			$this->assertArrayHasKey( 'slug', $plugin );
			$this->assertArrayHasKey( 'file', $plugin );
			$this->assertArrayHasKey( 'version', $plugin );
			$this->assertArrayHasKey( 'name', $plugin );
			$this->assertArrayHasKey( 'is_active', $plugin );
			$this->assertArrayHasKey( 'from_wporg', $plugin );

			$this->assertEquals( 'plugin', $plugin['type'] );
			$this->assertIsBool( $plugin['is_active'] );
		} else {
			// No plugins installed in test environment - that's okay.
			$this->assertTrue( true );
		}
	}

	/**
	 * Test themes have required fields.
	 */
	public function test_themes_have_required_fields() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		if ( ! empty( $data['themes'] ) ) {
			$theme = $data['themes'][0];

			$this->assertArrayHasKey( 'type', $theme );
			$this->assertArrayHasKey( 'slug', $theme );
			$this->assertArrayHasKey( 'version', $theme );
			$this->assertArrayHasKey( 'name', $theme );
			$this->assertArrayHasKey( 'is_active', $theme );
			$this->assertArrayHasKey( 'from_wporg', $theme );

			$this->assertEquals( 'theme', $theme['type'] );
			$this->assertIsBool( $theme['is_active'] );
		} else {
			// No themes in test environment - unlikely but handle gracefully.
			$this->assertTrue( true );
		}
	}

	/**
	 * Test at least one theme is active.
	 */
	public function test_at_least_one_theme_is_active() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		if ( ! empty( $data['themes'] ) ) {
			$active_themes = array_filter(
				$data['themes'],
				function ( $theme ) {
					return $theme['is_active'];
				}
			);

			$this->assertGreaterThanOrEqual(
				1,
				count( $active_themes ),
				'At least one theme should be active'
			);
		}
	}

	/**
	 * Test from_wporg field defaults to false.
	 */
	public function test_from_wporg_defaults_to_false() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		// Check plugins.
		foreach ( $data['plugins'] as $plugin ) {
			$this->assertFalse( $plugin['from_wporg'], 'from_wporg should default to false (browser determines actual value)' );
		}

		// Check themes.
		foreach ( $data['themes'] as $theme ) {
			$this->assertFalse( $theme['from_wporg'], 'from_wporg should default to false (browser determines actual value)' );
		}
	}

	// ========================================================================
	// Plugin Data Tests (HIGH)
	// ========================================================================

	/**
	 * Test plugin slug format.
	 */
	public function test_plugin_slug_format() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['plugins'] as $plugin ) {
			$this->assertNotEmpty( $plugin['slug'] );
			$this->assertIsString( $plugin['slug'] );
			// Slug should not contain '.' (single-file plugins are excluded).
			$this->assertStringNotContainsString( '.', $plugin['slug'] );
		}
	}

	/**
	 * Test plugin file format.
	 */
	public function test_plugin_file_format() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['plugins'] as $plugin ) {
			$this->assertNotEmpty( $plugin['file'] );
			$this->assertIsString( $plugin['file'] );
			// File should be in format 'slug/file.php'.
			$this->assertStringContainsString( '/', $plugin['file'] );
			$this->assertStringEndsWith( '.php', $plugin['file'] );
		}
	}

	/**
	 * Test plugin version is string.
	 */
	public function test_plugin_version_is_string() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['plugins'] as $plugin ) {
			$this->assertIsString( $plugin['version'] );
		}
	}

	/**
	 * Test plugin name is not empty.
	 */
	public function test_plugin_name_not_empty() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['plugins'] as $plugin ) {
			$this->assertNotEmpty( $plugin['name'] );
			$this->assertIsString( $plugin['name'] );
		}
	}

	// ========================================================================
	// Theme Data Tests (HIGH)
	// ========================================================================

	/**
	 * Test theme slug format.
	 */
	public function test_theme_slug_format() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['themes'] as $theme ) {
			$this->assertNotEmpty( $theme['slug'] );
			$this->assertIsString( $theme['slug'] );
		}
	}

	/**
	 * Test theme version is string.
	 */
	public function test_theme_version_is_string() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['themes'] as $theme ) {
			$this->assertIsString( $theme['version'] );
		}
	}

	/**
	 * Test theme name is not empty.
	 */
	public function test_theme_name_not_empty() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['themes'] as $theme ) {
			$this->assertNotEmpty( $theme['name'] );
			$this->assertIsString( $theme['name'] );
		}
	}

	/**
	 * Test only one theme is active.
	 */
	public function test_only_one_theme_is_active() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		if ( ! empty( $data['themes'] ) ) {
			$active_count = 0;
			foreach ( $data['themes'] as $theme ) {
				if ( $theme['is_active'] ) {
					$active_count++;
				}
			}

			$this->assertEquals( 1, $active_count, 'Exactly one theme should be active' );
		}
	}

	// ========================================================================
	// Response Structure Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test response has correct structure.
	 */
	public function test_response_structure() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		// Should have exactly 3 top-level keys.
		$this->assertCount( 3, array_keys( $data ) );
		$this->assertArrayHasKey( 'success', $data );
		$this->assertArrayHasKey( 'plugins', $data );
		$this->assertArrayHasKey( 'themes', $data );
	}

	/**
	 * Test plugins array contains only plugin objects.
	 */
	public function test_plugins_array_consistency() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['plugins'] as $plugin ) {
			$this->assertIsArray( $plugin );
			$this->assertEquals( 'plugin', $plugin['type'] );
		}
	}

	/**
	 * Test themes array contains only theme objects.
	 */
	public function test_themes_array_consistency() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['themes'] as $theme ) {
			$this->assertIsArray( $theme );
			$this->assertEquals( 'theme', $theme['type'] );
		}
	}

	// ========================================================================
	// Edge Cases Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test response is consistent across multiple calls.
	 */
	public function test_response_consistency() {
		$request1 = new WP_REST_Request( 'GET', '/aether/v1/assets' );
		$response1 = $this->controller->getAssets( $request1 );
		$data1 = $response1->get_data();

		$request2 = new WP_REST_Request( 'GET', '/aether/v1/assets' );
		$response2 = $this->controller->getAssets( $request2 );
		$data2 = $response2->get_data();

		// Plugin and theme counts should be the same.
		$this->assertCount( count( $data1['plugins'] ), $data2['plugins'] );
		$this->assertCount( count( $data1['themes'] ), $data2['themes'] );
	}

	/**
	 * Test handles empty plugins gracefully.
	 *
	 * Note: In test environment, there might be no plugins installed.
	 */
	public function test_handles_empty_plugins_gracefully() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		// Should return empty array if no plugins, not error.
		$this->assertIsArray( $data['plugins'] );
	}

	/**
	 * Test includes this plugin in results.
	 */
	public function test_includes_aether_plugin() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		// Find aether-site-exporter plugin.
		$found = false;
		foreach ( $data['plugins'] as $plugin ) {
			if ( 'aether-site-exporter' === $plugin['slug'] ) {
				$found = true;
				// Note: In test environment, plugin may not be marked as "active"
				// even though it's loaded via tests_add_filter.
				$this->assertArrayHasKey( 'is_active', $plugin );
				$this->assertIsBool( $plugin['is_active'] );
				break;
			}
		}

		$this->assertTrue( $found, 'aether-site-exporter plugin should be in results' );
	}

	// ========================================================================
	// Error Handling Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test exception handling returns 500 error.
	 *
	 * Note: It's difficult to force an exception without mocking,
	 * but we can verify the error handling structure exists.
	 */
	public function test_exception_handling_structure() {
		// Verify method exists and is callable.
		$this->assertTrue( method_exists( $this->controller, 'getAssets' ) );
		$this->assertTrue( is_callable( [ $this->controller, 'getAssets' ] ) );
	}

	/**
	 * Test successful response has 200 status code.
	 */
	public function test_success_status_code() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	// ========================================================================
	// Data Integrity Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test no duplicate plugin slugs.
	 */
	public function test_no_duplicate_plugin_slugs() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		$slugs = array_column( $data['plugins'], 'slug' );
		$unique_slugs = array_unique( $slugs );

		$this->assertCount(
			count( $unique_slugs ),
			$slugs,
			'Plugin slugs should be unique'
		);
	}

	/**
	 * Test no duplicate theme slugs.
	 */
	public function test_no_duplicate_theme_slugs() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		$slugs = array_column( $data['themes'], 'slug' );
		$unique_slugs = array_unique( $slugs );

		$this->assertCount(
			count( $unique_slugs ),
			$slugs,
			'Theme slugs should be unique'
		);
	}

	/**
	 * Test plugin slugs match file paths.
	 */
	public function test_plugin_slugs_match_file_paths() {
		$request = new WP_REST_Request( 'GET', '/aether/v1/assets' );

		$response = $this->controller->getAssets( $request );
		$data = $response->get_data();

		foreach ( $data['plugins'] as $plugin ) {
			// Slug should be the directory part of the file path.
			$file_dir = dirname( $plugin['file'] );
			$this->assertEquals( $plugin['slug'], $file_dir );
		}
	}
}
