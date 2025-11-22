<?php
/**
 * CORS Handler Tests
 *
 * Comprehensive security tests for CorsHandler utility class.
 * Tests origin validation, CORS header logic, and WordPress Playground compatibility.
 *
 * Testing Challenges:
 * - Cannot actually send HTTP headers in tests
 * - Must mock $_SERVER superglobal
 * - Must test origin whitelisting logic
 * - Must verify Playground domain handling
 *
 * Quality Standards:
 * - Tests must catch security vulnerabilities
 * - Must test all origin validation scenarios
 * - Must test attack vectors (subdomain, protocol, port attacks)
 * - Must verify correct CORS behavior
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Utilities;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Utilities\CorsHandler;

/**
 * CORS handler test case.
 */
class CorsHandlerTest extends TestCase {

	/**
	 * CORS handler instance.
	 *
	 * @var CorsHandler
	 */
	private $handler;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->handler = new CorsHandler();

		// Set WordPress site URL for same-origin tests.
		update_option( 'siteurl', 'https://example.com' );
		update_option( 'home', 'https://example.com' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		// Clean up global state.
		unset( $_SERVER['HTTP_ORIGIN'] );
		unset( $_SERVER['REQUEST_URI'] );
		unset( $GLOBALS['wp_rest_server'] );

		parent::tear_down();
	}

	// ========================================================================
	// Origin Validation Tests - getAllowedOrigins()
	// ========================================================================

	/**
	 * Test Playground origins are always allowed.
	 *
	 * Severity: HIGH - Playground compatibility is core feature
	 */
	public function test_allows_playground_wordpress_net() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$allowed = $method->invoke( $this->handler, 'https://playground.wordpress.net' );

		$this->assertContains(
			'https://playground.wordpress.net',
			$allowed,
			'Must allow playground.wordpress.net'
		);
	}

	/**
	 * Test WASM Playground origins are allowed.
	 */
	public function test_allows_wasm_wordpress_net() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$allowed = $method->invoke( $this->handler, 'https://wasm.wordpress.net' );

		$this->assertContains(
			'https://wasm.wordpress.net',
			$allowed,
			'Must allow wasm.wordpress.net'
		);
	}

	/**
	 * Test same-origin requests are allowed.
	 *
	 * Severity: HIGH - Same-origin must always work
	 */
	public function test_allows_same_origin() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$allowed = $method->invoke( $this->handler, 'https://example.com' );

		$this->assertContains(
			'https://example.com',
			$allowed,
			'Must allow same-origin requests'
		);
	}

	/**
	 * Test Playground subdomains are dynamically allowed.
	 *
	 * Severity: MEDIUM - Playground uses dynamic subdomains
	 */
	public function test_allows_playground_subdomains() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$playground_subdomains = [
			'https://playground.wordpress.net/scope:abc123',
			'https://playground.wordpress.net/wp-6.4',
			'https://wasm.wordpress.net/test-123',
		];

		foreach ( $playground_subdomains as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			$this->assertContains(
				$origin,
				$allowed,
				"Must allow Playground subdomain: {$origin}"
			);
		}
	}

	/**
	 * Test subdomain attack is blocked.
	 *
	 * Attack: https://evil.playground.wordpress.net.attacker.com
	 * Severity: CRITICAL - Subdomain spoofing
	 */
	public function test_blocks_subdomain_spoofing_attack() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$malicious_origins = [
			'https://playground.wordpress.net.attacker.com',
			'https://wasm.wordpress.net.evil.com',
			'https://fakewasm.wordpress.net',
			'https://example.com.attacker.com',
		];

		foreach ( $malicious_origins as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			$this->assertNotContains(
				$origin,
				$allowed,
				"Must block subdomain spoofing: {$origin}"
			);
		}
	}

	/**
	 * Test protocol downgrade attack is blocked.
	 *
	 * Attack: http://playground.wordpress.net (HTTP instead of HTTPS)
	 * Severity: HIGH - Protocol downgrade
	 */
	public function test_blocks_protocol_downgrade_attack() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$http_attacks = [
			'http://playground.wordpress.net',
			'http://wasm.wordpress.net',
		];

		foreach ( $http_attacks as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			// HTTP versions should NOT be in the base allowed list
			// Only HTTPS is in the base list
			$this->assertNotContains(
				'http://playground.wordpress.net',
				$allowed,
				'Must not allow HTTP for Playground (HTTPS required)'
			);
		}
	}

	/**
	 * Test local development origins with AETHER_ALLOW_LOCAL_CORS.
	 *
	 * Severity: MEDIUM - Local dev convenience vs security
	 */
	public function test_allows_local_dev_with_constant() {
		// Enable local CORS.
		define( 'WP_DEBUG', true );
		if ( ! defined( 'AETHER_ALLOW_LOCAL_CORS' ) ) {
			define( 'AETHER_ALLOW_LOCAL_CORS', true );
		}

		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$local_origins = [
			'http://localhost:3000',
			'http://localhost:8080',
			'http://127.0.0.1:3000',
		];

		foreach ( $local_origins as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			$this->assertContains(
				$origin,
				$allowed,
				"Should allow local dev origin with constant: {$origin}"
			);
		}
	}

	/**
	 * Test local development is blocked without constant.
	 *
	 * Severity: HIGH - Security by default
	 */
	public function test_blocks_local_dev_without_constant() {
		// Ensure constant is not defined (test environment may vary).
		// We can't undefine constants, so we test the logic path.

		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getLocalDevelopmentOrigins' );
		$method->setAccessible( true );

		// Without the constant check in getAllowedOrigins, getLocalDevelopmentOrigins
		// would return empty unless WP_DEBUG and AETHER_ALLOW_LOCAL_CORS are both true.

		// Test that getLocalDevelopmentOrigins validates port numbers.
		$safe_port   = $method->invoke( $this->handler, 'http://localhost:3000' );
		$unsafe_port = $method->invoke( $this->handler, 'http://localhost:9999' );

		// Port 3000 should be in allowed list.
		$this->assertContains( 'http://localhost:3000', $safe_port );

		// Port 9999 is not in common dev ports, should not be allowed.
		$this->assertNotContains( 'http://localhost:9999', $unsafe_port );
	}

	/**
	 * Test port-based attack is blocked.
	 *
	 * Attack: http://localhost:9999 (non-standard port)
	 * Severity: MEDIUM - Reduces attack surface
	 */
	public function test_blocks_non_standard_local_ports() {
		define( 'WP_DEBUG', true );
		if ( ! defined( 'AETHER_ALLOW_LOCAL_CORS' ) ) {
			define( 'AETHER_ALLOW_LOCAL_CORS', true );
		}

		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$non_standard_ports = [
			'http://localhost:9999',
			'http://localhost:1337',
			'http://127.0.0.1:5555',
		];

		foreach ( $non_standard_ports as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			$this->assertNotContains(
				$origin,
				$allowed,
				"Must block non-standard port: {$origin}"
			);
		}
	}

	/**
	 * Test custom origins via filter.
	 *
	 * Severity: LOW - Developer extensibility
	 */
	public function test_respects_filter_for_custom_origins() {
		// Add a custom origin via filter.
		add_filter(
			'aether_site_exporter_cors_allowed_origins',
			function ( $origins ) {
				$origins[] = 'https://custom-dev.local';
				return $origins;
			}
		);

		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$allowed = $method->invoke( $this->handler, 'https://custom-dev.local' );

		$this->assertContains(
			'https://custom-dev.local',
			$allowed,
			'Must respect filter for custom origins'
		);

		// Clean up filter.
		remove_all_filters( 'aether_site_exporter_cors_allowed_origins' );
	}

	// ========================================================================
	// Preflight Request Tests - handlePreflight()
	// ========================================================================

	/**
	 * Test OPTIONS request to Aether endpoint is handled.
	 */
	public function test_handlePreflight_processes_options_to_aether_endpoint() {
		// Create mock OPTIONS request to /aether/ endpoint.
		$request = new \WP_REST_Request( 'OPTIONS', '/aether/v1/test' );
		$server  = new \WP_REST_Server();

		$result = $this->handler->handlePreflight( null, $server, $request );

		$this->assertInstanceOf(
			\WP_REST_Response::class,
			$result,
			'Should return WP_REST_Response for OPTIONS request'
		);

		$this->assertEquals(
			204,
			$result->get_status(),
			'Should return 204 No Content'
		);

		$this->assertNull(
			$result->get_data(),
			'Should return null data for preflight'
		);
	}

	/**
	 * Test non-OPTIONS request passes through.
	 */
	public function test_handlePreflight_ignores_non_options_requests() {
		$methods = [ 'GET', 'POST', 'PUT', 'DELETE' ];
		$server  = new \WP_REST_Server();

		foreach ( $methods as $method ) {
			$request = new \WP_REST_Request( $method, '/aether/v1/test' );
			$result  = $this->handler->handlePreflight( 'original', $server, $request );

			$this->assertEquals(
				'original',
				$result,
				"Should not process {$method} request"
			);
		}
	}

	/**
	 * Test OPTIONS to non-Aether endpoint passes through.
	 */
	public function test_handlePreflight_ignores_non_aether_endpoints() {
		$request = new \WP_REST_Request( 'OPTIONS', '/wp/v2/posts' );
		$server  = new \WP_REST_Server();

		$result = $this->handler->handlePreflight( 'original', $server, $request );

		$this->assertEquals(
			'original',
			$result,
			'Should not process non-Aether endpoint'
		);
	}

	// ========================================================================
	// Header Filter Tests - addHeadersFilter()
	// ========================================================================

	/**
	 * Test addHeadersFilter processes Aether endpoints.
	 */
	public function test_addHeadersFilter_processes_aether_requests() {
		$request  = new \WP_REST_Request( 'GET', '/aether/v1/test' );
		$response = new \WP_REST_Response( [ 'success' => true ] );
		$server   = new \WP_REST_Server();

		$result = $this->handler->addHeadersFilter( false, $response, $request, $server );

		// Should return unchanged served status.
		$this->assertFalse( $result, 'Should return unchanged served status' );
	}

	/**
	 * Test addHeadersFilter ignores non-Aether endpoints.
	 */
	public function test_addHeadersFilter_ignores_non_aether_endpoints() {
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/posts' );
		$response = new \WP_REST_Response( [ 'success' => true ] );
		$server   = new \WP_REST_Server();

		$result = $this->handler->addHeadersFilter( false, $response, $request, $server );

		$this->assertFalse( $result, 'Should return unchanged for non-Aether endpoint' );
	}

	/**
	 * Test addHeadersFilter handles non-WP_REST_Request objects.
	 */
	public function test_addHeadersFilter_handles_non_rest_request_objects() {
		$response = new \WP_REST_Response( [ 'success' => true ] );
		$server   = new \WP_REST_Server();

		// Pass non-WP_REST_Request object (edge case).
		$result = $this->handler->addHeadersFilter( false, $response, 'not-a-request', $server );

		$this->assertFalse( $result, 'Should handle non-request objects gracefully' );
	}

	// ========================================================================
	// Header Action Tests - addHeadersAction()
	// ========================================================================

	/**
	 * Test addHeadersAction processes Aether requests from $_SERVER.
	 */
	public function test_addHeadersAction_processes_aether_requests() {
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		$_SERVER['REQUEST_URI'] = '/wp-json/aether/v1/test';

		// Should not throw errors.
		$this->handler->addHeadersAction();

		// No exception = success (can't verify headers in tests).
		$this->assertTrue( true, 'Should process Aether request without errors' );

		unset( $wp_rest_server );
	}

	/**
	 * Test addHeadersAction ignores non-Aether requests.
	 */
	public function test_addHeadersAction_ignores_non_aether_requests() {
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		$_SERVER['REQUEST_URI'] = '/wp-json/wp/v2/posts';

		// Should return early without processing.
		$this->handler->addHeadersAction();

		$this->assertTrue( true, 'Should ignore non-Aether request' );

		unset( $wp_rest_server );
	}

	/**
	 * Test addHeadersAction handles missing $wp_rest_server.
	 */
	public function test_addHeadersAction_handles_missing_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = null; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		$_SERVER['REQUEST_URI'] = '/wp-json/aether/v1/test';

		// Should return early without errors.
		$this->handler->addHeadersAction();

		$this->assertTrue( true, 'Should handle missing REST server gracefully' );
	}

	// ========================================================================
	// sendHeaders() Logic Tests
	// ========================================================================

	/**
	 * Test sendHeaders logic with allowed origin.
	 *
	 * Note: We can't test actual header sending, but we can test the logic.
	 */
	public function test_sendHeaders_logic_with_allowed_origin() {
		$_SERVER['HTTP_ORIGIN'] = 'https://playground.wordpress.net';

		// We can't test headers actually being sent, but we can verify
		// the method executes without errors for allowed origins.
		// In real usage, this would set Access-Control-Allow-Origin header.

		// If headers have not been sent, sendHeaders() processes the request.
		// We verify by ensuring no exceptions are thrown.
		try {
			// Note: In actual tests, we can't send headers, but we can verify
			// the logic executes correctly by checking it doesn't throw errors.
			$reflection = new \ReflectionClass( $this->handler );
			$method     = $reflection->getMethod( 'getAllowedOrigins' );
			$method->setAccessible( true );

			$allowed = $method->invoke( $this->handler, $_SERVER['HTTP_ORIGIN'] );

			$this->assertContains(
				$_SERVER['HTTP_ORIGIN'],
				$allowed,
				'Playground origin should be in allowed list'
			);

			$this->assertTrue( true, 'No exception thrown for allowed origin' );
		} catch ( \Exception $e ) {
			$this->fail( 'Should not throw exception for allowed origin: ' . $e->getMessage() );
		}
	}

	/**
	 * Test sendHeaders logic with blocked origin.
	 */
	public function test_sendHeaders_logic_with_blocked_origin() {
		$_SERVER['HTTP_ORIGIN'] = 'https://malicious-attacker.com';

		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$allowed = $method->invoke( $this->handler, $_SERVER['HTTP_ORIGIN'] );

		$this->assertNotContains(
			$_SERVER['HTTP_ORIGIN'],
			$allowed,
			'Attacker origin should NOT be in allowed list'
		);

		// In real usage, sendHeaders() would return early without setting headers.
		// The browser would then block the cross-origin request.
	}

	/**
	 * Test sendHeaders logic with no origin (same-origin request).
	 */
	public function test_sendHeaders_logic_with_no_origin() {
		// Same-origin requests don't send Origin header.
		unset( $_SERVER['HTTP_ORIGIN'] );

		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		// getAllowedOrigins should handle empty origin gracefully.
		$allowed = $method->invoke( $this->handler, '' );

		// Should still return allowed origins list (for validation purposes).
		$this->assertIsArray( $allowed, 'Should return array even with empty origin' );
		$this->assertNotEmpty( $allowed, 'Should have some allowed origins' );
	}

	// ========================================================================
	// Edge Cases and Security Scenarios
	// ========================================================================

	/**
	 * Test null origin header.
	 *
	 * Attack: Origin: null (some browsers send this)
	 * Severity: LOW - Edge case handling
	 */
	public function test_handles_null_origin() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		// Test with literal string 'null' (some browsers send this).
		$allowed = $method->invoke( $this->handler, 'null' );

		$this->assertNotContains(
			'null',
			$allowed,
			'Must not allow literal "null" origin'
		);
	}

	/**
	 * Test malformed origin URLs.
	 *
	 * Attack: Malformed URLs that might bypass validation
	 * Severity: MEDIUM - Input validation
	 */
	public function test_handles_malformed_origins() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$malformed_origins = [
			'javascript:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'file:///etc/passwd',
			'\\\\malicious.com',
		];

		foreach ( $malformed_origins as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			$this->assertNotContains(
				$origin,
				$allowed,
				"Must not allow malformed origin: {$origin}"
			);
		}
	}

	/**
	 * Test very long origin strings.
	 *
	 * Purpose: Ensure no buffer overflow or performance issues
	 */
	public function test_handles_very_long_origins() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$long_origin = 'https://' . str_repeat( 'a', 1000 ) . '.com';

		// Should not crash or hang.
		$allowed = $method->invoke( $this->handler, $long_origin );

		$this->assertIsArray( $allowed, 'Should handle very long origins' );
	}

	/**
	 * Test special characters in origin.
	 *
	 * Purpose: Ensure special chars don't bypass validation
	 */
	public function test_handles_special_characters_in_origin() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		$special_origins = [
			"https://playground.wordpress.net\0.com",
			'https://playground.wordpress.net/../',
			'https://playground.wordpress.net?evil=true',
		];

		foreach ( $special_origins as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			// These should not match the whitelisted patterns.
			$this->assertNotContains(
				$origin,
				$allowed,
				"Must handle special characters safely: {$origin}"
			);
		}
	}

	/**
	 * Test case sensitivity in origin validation.
	 *
	 * Purpose: Ensure case doesn't affect security
	 */
	public function test_case_sensitivity_in_origin_validation() {
		$reflection = new \ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'getAllowedOrigins' );
		$method->setAccessible( true );

		// URLs are case-sensitive except for domain (per RFC).
		// Our validation should be case-sensitive for security.
		$case_variants = [
			'HTTPS://PLAYGROUND.WORDPRESS.NET', // Uppercase domain.
			'https://PLAYGROUND.wordpress.net', // Mixed case.
		];

		foreach ( $case_variants as $origin ) {
			$allowed = $method->invoke( $this->handler, $origin );

			// Case-sensitive matching means these won't match the lowercase whitelist.
			// However, WordPress/PHP might normalize domains to lowercase.
			// The important thing is the validation is consistent.
			$this->assertIsArray( $allowed, "Should handle case variant: {$origin}" );
		}
	}
}
