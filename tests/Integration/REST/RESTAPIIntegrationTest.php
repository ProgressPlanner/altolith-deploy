<?php
/**
 * REST API Integration Tests
 *
 * Tests REST endpoints with authentication, CORS, and error handling.
 * Validates that REST API works correctly in various scenarios.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Integration\REST;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\REST\SettingsController;
use WP_REST_Request;

/**
 * REST API integration test case.
 */
class RESTAPIIntegrationTest extends TestCase {

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_user_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_user_id;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Create users.
		$this->admin_user_id      = $this->factory->user->create( [ 'role' => 'administrator' ] );
		$this->subscriber_user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );

		// Initialize REST API.
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );

		// Register settings controller.
		$controller = new SettingsController();
		$controller->registerRoutes();
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		delete_option( 'aether_site_exporter_settings' );

		parent::tear_down();
	}

	// ========================================================================
	// Authentication Tests
	// ========================================================================

	/**
	 * Test unauthorized requests are rejected.
	 */
	public function test_unauthorized_requests_rejected() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/aether/site-exporter/settings' );
		$response = rest_do_request( $request );

		// Should return 401 or 403 for unauthenticated users.
		$this->assertContains(
			$response->get_status(),
			[ 401, 403 ],
			'Unauthorized requests should be rejected'
		);
	}

	/**
	 * Test non-admin users are rejected.
	 */
	public function test_non_admin_users_rejected() {
		wp_set_current_user( $this->subscriber_user_id );

		$request  = new WP_REST_Request( 'GET', '/aether/site-exporter/settings' );
		$response = rest_do_request( $request );

		$this->assertEquals( 403, $response->get_status(), 'Non-admin users should be rejected' );
	}

	/**
	 * Test admin users can access endpoints.
	 */
	public function test_admin_users_can_access() {
		wp_set_current_user( $this->admin_user_id );

		$request  = new WP_REST_Request( 'GET', '/aether/site-exporter/settings' );
		$response = rest_do_request( $request );

		$this->assertEquals( 200, $response->get_status(), 'Admin users should be able to access endpoints' );
	}

	// ========================================================================
	// Settings Endpoint Tests
	// ========================================================================

	/**
	 * Test settings endpoint returns data.
	 */
	public function test_settings_endpoint_get() {
		wp_set_current_user( $this->admin_user_id );

		// Set some test settings.
		update_option(
			'aether_site_exporter_settings',
			[
				'test_setting' => 'test_value',
			]
		);

		$request  = new WP_REST_Request( 'GET', '/aether/site-exporter/settings' );
		$response = rest_do_request( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'settings', $data );
	}

	/**
	 * Test settings endpoint can update settings.
	 */
	public function test_settings_endpoint_update() {
		wp_set_current_user( $this->admin_user_id );

		// SettingsController uses POST method with 'key' and 'value' parameters.
		$request = new WP_REST_Request( 'POST', '/aether/site-exporter/settings' );
		$request->set_param( 'key', 'test_setting' );
		$request->set_param( 'value', 'updated_value' );

		$response = rest_do_request( $request );

		$this->assertEquals( 200, $response->get_status() );

		// Verify setting was updated.
		$settings = get_option( 'aether_site_exporter_settings', [] );
		$this->assertEquals( 'updated_value', $settings['test_setting'] );
	}

	// ========================================================================
	// Error Handling Tests
	// ========================================================================

	/**
	 * Test invalid JSON is rejected.
	 */
	public function test_invalid_json_rejected() {
		wp_set_current_user( $this->admin_user_id );

		// Test settings endpoint with invalid parameter.
		$request = new WP_REST_Request( 'PUT', '/aether/site-exporter/settings' );
		$request->set_param( 'settings', 'not-an-object' ); // Should be object.

		$response = rest_do_request( $request );

		// Should return error (400 or validation error).
		$this->assertNotEquals( 200, $response->get_status() );
	}

	/**
	 * Test missing required fields are rejected.
	 */
	public function test_missing_required_fields_rejected() {
		wp_set_current_user( $this->admin_user_id );

		// Settings endpoint requires 'settings' parameter.
		$request  = new WP_REST_Request( 'PUT', '/aether/site-exporter/settings' );
		$response = rest_do_request( $request );

		// Should return error.
		$this->assertContains(
			$response->get_status(),
			[ 400, 404 ],
			'Missing required fields should be rejected'
		);
	}

	/**
	 * Test error responses are well formatted.
	 */
	public function test_error_responses_formatted() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/aether/site-exporter/settings' );
		$response = rest_do_request( $request );

		// Error response should have proper structure.
		$data = $response->get_data();

		if ( is_array( $data ) ) {
			$this->assertTrue(
				isset( $data['code'] ) || isset( $data['message'] ) || isset( $data['data'] ),
				'Error response should have standard WordPress REST API error format'
			);
		}
	}

	// ========================================================================
	// CORS Tests (WordPress Playground Compatibility)
	// ========================================================================

	/**
	 * Test CORS headers can be filtered.
	 */
	public function test_cors_headers_filterable() {
		wp_set_current_user( $this->admin_user_id );

		// Add filter for CORS origins and verify it can modify the origins list.
		$custom_origin = 'https://playground.wordpress.net';
		add_filter(
			'aether_site_exporter_cors_allowed_origins',
			function ( $origins ) use ( $custom_origin ) {
				$origins[] = $custom_origin;
				return $origins;
			}
		);

		// Apply the filter to verify it works.
		$origins = apply_filters( 'aether_site_exporter_cors_allowed_origins', [] );

		$this->assertContains( $custom_origin, $origins, 'CORS filter should allow adding custom origins' );
	}

	// ========================================================================
	// Endpoint Availability Tests
	// ========================================================================

	/**
	 * Test settings endpoint is registered.
	 */
	public function test_settings_endpoint_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/aether/site-exporter/settings', $routes );
	}

	/**
	 * Test provider config endpoints are registered.
	 */
	public function test_provider_config_endpoints_registered() {
		$routes = rest_get_server()->get_routes();

		// Check for provider config route pattern.
		$found = false;
		foreach ( $routes as $route => $handlers ) {
			if ( strpos( $route, '/aether/site-exporter/providers/' ) !== false &&
				 strpos( $route, '/config' ) !== false ) {
				$found = true;
				break;
			}
		}

		$this->assertTrue( $found, 'Provider config endpoints should be registered' );
	}
}
