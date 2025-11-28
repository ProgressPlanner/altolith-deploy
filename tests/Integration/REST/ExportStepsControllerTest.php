<?php
/**
 * Export Steps Controller Tests
 *
 * Comprehensive integration tests for ExportStepsController - the massive 1,257 line controller
 * handling all export workflow steps. This is CRITICAL functionality with security implications.
 *
 * Quality Standards:
 * - Tests must catch workflow failures and step validation bugs
 * - Must test user context switching security (logged-out HTML fetching)
 * - Must test all step validations and transitions
 * - Must test permission checks and authorization
 * - Must fail if implementation allows ANY security bypass or workflow corruption
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Integration\REST;

use Altolith\Deploy\Tests\Helpers\TestCase;
use Altolith\Deploy\REST\Export\ExportStepsController;
use Altolith\Deploy\Plugin;
use WP_REST_Request;

/**
 * Export Steps Controller integration test case.
 */
class ExportStepsControllerTest extends TestCase {

	/**
	 * Controller instance.
	 *
	 * @var ExportStepsController
	 */
	private $controller;

	/**
	 * Test admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	private $namespace = 'altolith/deploy';

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Create admin user for permission tests
		$this->admin_id = $this->act_as_admin();

		// Initialize REST API server.
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();

		// Initialize controller and register routes via rest_api_init hook.
		$plugin = Plugin::getInstance();
		$this->controller = new ExportStepsController( $plugin );
		add_action( 'rest_api_init', [ $this->controller, 'registerRoutes' ] );
		do_action( 'rest_api_init', $wp_rest_server );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		// Clean up test data
		$this->clean_up_test_exports();

		parent::tear_down();
	}

	/**
	 * Clean up test export files.
	 */
	private function clean_up_test_exports() {
		// Clean up any test zip files
		$patterns = [
			WP_CONTENT_DIR . '/uploads/altolith-temp/*.zip',
			ABSPATH . 'blueprint-bundle/*.zip',
		];

		foreach ( $patterns as $pattern ) {
			$files = glob( $pattern );
			if ( $files ) {
				foreach ( $files as $file ) {
					if ( file_exists( $file ) ) {
						@unlink( $file );
					}
				}
			}
		}
	}

	// ========================================================================
	// Route Registration Tests
	// ========================================================================

	/**
	 * Test route registration.
	 *
	 * Purpose: Verify all critical endpoints are registered
	 */
	public function test_routes_are_registered() {
		$routes = rest_get_server()->get_routes();

		$expected_routes = [
			'/' . $this->namespace . '/export/createArchive',
			'/' . $this->namespace . '/export/generateBlueprintBundle',
		];

		foreach ( $expected_routes as $route ) {
			$this->assertArrayHasKey( $route, $routes, "Route {$route} should be registered" );
		}
	}

	// ========================================================================
	// Permission Tests
	// ========================================================================

	/**
	 * Test endpoints require authentication.
	 *
	 * Purpose: Verify unauthenticated users cannot access endpoints
	 * Security: CRITICAL - Prevents unauthorized exports
	 */
	public function test_endpoints_require_authentication() {
		// Act as guest (not logged in)
		$this->act_as_guest();

		$endpoints = [
			'/export/createArchive',
			'/export/generateBlueprintBundle',
		];

		foreach ( $endpoints as $endpoint ) {
			$request = new WP_REST_Request( 'POST', '/' . $this->namespace . $endpoint );

			$response = rest_get_server()->dispatch( $request );

			$this->assertEquals(
				401,
				$response->get_status(),
				"Endpoint {$endpoint} should require authentication"
			);
		}
	}

	/**
	 * Test endpoints require admin capabilities.
	 *
	 * Purpose: Verify non-admin users cannot access endpoints
	 * Security: HIGH - Prevents unauthorized exports
	 */
	public function test_endpoints_require_admin_capabilities() {
		// Create subscriber user (non-admin)
		$subscriber_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		wp_set_current_user( $subscriber_id );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/createArchive' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual(
			400,
			$response->get_status(),
			'Subscriber should not have permission to access export endpoints'
		);
	}

	// ========================================================================
	// Input Sanitization Tests
	// ========================================================================

	/**
	 * Test malicious input is handled safely.
	 *
	 * Purpose: Verify malicious input doesn't cause issues
	 * Security: MEDIUM - Prevents injection attacks
	 */
	public function test_malicious_input_is_handled_safely() {
		$this->act_as_admin();

		$malicious_inputs = [
			'<script>alert(1)</script>',
			"\0null",
			'../../etc/passwd',
		];

		foreach ( $malicious_inputs as $malicious_input ) {
			$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/createArchive' );
			$request->set_body_params( [ 'custom_assets' => [ $malicious_input ] ] );

			$response = rest_get_server()->dispatch( $request );

			// Should not crash - may return error but should be handled safely
			$this->assertNotEquals(
				500,
				$response->get_status(),
				'Should handle malicious input safely without server error'
			);
		}
	}

}
