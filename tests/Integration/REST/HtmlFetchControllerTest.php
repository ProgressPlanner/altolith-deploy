<?php
/**
 * HTML Fetch Controller Tests
 *
 * Tests for the HtmlFetchController that fetches HTML as anonymous user.
 * This is critical for static site generation in WordPress Playground.
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Integration\REST;

use Altolith\Deploy\Tests\Helpers\TestCase;
use Altolith\Deploy\REST\Export\HtmlFetchController;
use WP_REST_Request;
use WP_REST_Response;

/**
 * HTML Fetch Controller integration test case.
 */
class HtmlFetchControllerTest extends TestCase {

	/**
	 * Controller instance.
	 *
	 * @var HtmlFetchController
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

		// Create admin user for permission tests.
		$this->admin_id = $this->act_as_admin();

		// Initialize REST API server.
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();

		// Initialize controller and register routes.
		$this->controller = new HtmlFetchController();
		add_action( 'rest_api_init', [ $this->controller, 'registerRoutes' ] );
		do_action( 'rest_api_init', $wp_rest_server );
	}

	/**
	 * Test that routes are registered.
	 */
	public function test_routes_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			'/' . $this->namespace . '/export/fetch-html',
			$routes,
			'Single fetch-html route should be registered'
		);

		$this->assertArrayHasKey(
			'/' . $this->namespace . '/export/fetch-html-batch',
			$routes,
			'Batch fetch-html-batch route should be registered'
		);
	}

	/**
	 * Test permission check requires admin.
	 */
	public function test_permission_check_requires_admin() {
		// Acting as guest should fail permission check.
		$this->act_as_guest();

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html' );
		$request->set_body_params( [ 'url' => home_url( '/' ) ] );

		$response = rest_get_server()->dispatch( $request );

		// WordPress REST API returns 401 for unauthenticated users, 403 for authenticated but unauthorized.
		$this->assertContains(
			$response->get_status(),
			[ 401, 403 ],
			'Guest users should not have permission to fetch HTML'
		);
	}

	/**
	 * Test permission check passes for admin.
	 */
	public function test_permission_check_passes_for_admin() {
		// Acting as admin should pass permission check.
		$this->act_as_admin();

		// Create a test page so we have something to fetch.
		$post_id = $this->factory->post->create( [
			'post_title'   => 'Test Page',
			'post_content' => 'Test content',
			'post_status'  => 'publish',
			'post_type'    => 'page',
		] );
		$url = get_permalink( $post_id );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [ 'url' => $url ] ) );

		$response = rest_get_server()->dispatch( $request );

		// Should not be 403 (permission denied).
		$this->assertNotEquals(
			403,
			$response->get_status(),
			'Admin users should have permission to fetch HTML'
		);
	}

	/**
	 * Test fetch_html requires URL parameter.
	 */
	public function test_fetch_html_requires_url() {
		$this->act_as_admin();

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [] ) );

		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( 400, $response->get_status(), 'Missing URL should return 400' );
		$this->assertEquals( 'missing_url', $data['code'], 'Error code should be missing_url' );
	}

	/**
	 * Test fetch_html rejects external URLs.
	 */
	public function test_fetch_html_rejects_external_urls() {
		$this->act_as_admin();

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [ 'url' => 'https://external-site.com/page' ] ) );

		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( 403, $response->get_status(), 'External URLs should return 403' );
		$this->assertEquals( 'external_url', $data['code'], 'Error code should be external_url' );
	}

	/**
	 * Test fetch_html_batch requires URLs array.
	 */
	public function test_fetch_html_batch_requires_urls() {
		$this->act_as_admin();

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html-batch' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [] ) );

		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( 400, $response->get_status(), 'Missing URLs should return 400' );
		$this->assertEquals( 'missing_urls', $data['code'], 'Error code should be missing_urls' );
	}

	/**
	 * Test fetch_html_batch rejects batch larger than 10.
	 */
	public function test_fetch_html_batch_rejects_large_batch() {
		$this->act_as_admin();

		// Create 11 URLs to exceed batch limit.
		$urls = [];
		for ( $i = 0; $i < 11; $i++ ) {
			$urls[] = home_url( '/page-' . $i . '/' );
		}

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html-batch' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [ 'urls' => $urls ] ) );

		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( 400, $response->get_status(), 'Large batch should return 400' );
		$this->assertEquals( 'batch_too_large', $data['code'], 'Error code should be batch_too_large' );
	}

	/**
	 * Test fetch_html_batch accepts batch of 10 or less.
	 */
	public function test_fetch_html_batch_accepts_valid_batch() {
		$this->act_as_admin();

		// Create 3 test pages.
		$urls = [];
		for ( $i = 0; $i < 3; $i++ ) {
			$post_id = $this->factory->post->create( [
				'post_title'   => 'Test Page ' . $i,
				'post_content' => 'Test content ' . $i,
				'post_status'  => 'publish',
				'post_type'    => 'page',
			] );
			$urls[] = get_permalink( $post_id );
		}

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html-batch' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [ 'urls' => $urls ] ) );

		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		// Should not be 400 (bad request).
		$this->assertNotEquals(
			400,
			$response->get_status(),
			'Valid batch should not return 400'
		);

		// Should have results.
		if ( $response->get_status() === 200 ) {
			$this->assertTrue( $data['success'], 'Response should indicate success' );
			$this->assertArrayHasKey( 'results', $data, 'Response should contain results' );
		}
	}

	/**
	 * Test fetch_html_batch rejects external URLs in batch.
	 */
	public function test_fetch_html_batch_rejects_external_urls() {
		$this->act_as_admin();

		// Create a batch with one external URL.
		$post_id = $this->factory->post->create( [
			'post_title'   => 'Test Page',
			'post_content' => 'Test content',
			'post_status'  => 'publish',
			'post_type'    => 'page',
		] );

		$urls = [
			get_permalink( $post_id ),
			'https://external-site.com/page', // External URL.
		];

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html-batch' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [ 'urls' => $urls ] ) );

		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		// Batch should succeed overall, but external URL should fail.
		if ( $response->get_status() === 200 && isset( $data['results'] ) ) {
			$external_result = $data['results']['https://external-site.com/page'] ?? null;

			if ( $external_result ) {
				$this->assertFalse(
					$external_result['success'],
					'External URL in batch should have success=false'
				);
			}
		}
	}

	/**
	 * Test that SSRF protection works.
	 */
	public function test_ssrf_protection() {
		$this->act_as_admin();

		// Test various internal network URLs that should be blocked.
		$internal_urls = [
			'http://localhost/admin',
			'http://127.0.0.1/admin',
			'http://192.168.1.1/admin',
			'http://10.0.0.1/admin',
		];

		foreach ( $internal_urls as $url ) {
			$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html' );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( [ 'url' => $url ] ) );

			$response = rest_get_server()->dispatch( $request );
			$data = $response->get_data();

			// These should be rejected as external (not same-site).
			$this->assertEquals(
				403,
				$response->get_status(),
				"Internal URL {$url} should be rejected as external"
			);
		}
	}

	/**
	 * Test that same-site URLs are accepted.
	 */
	public function test_same_site_urls_accepted() {
		$this->act_as_admin();

		// Create a test page.
		$post_id = $this->factory->post->create( [
			'post_title'   => 'Test Page',
			'post_content' => 'Test content',
			'post_status'  => 'publish',
			'post_type'    => 'page',
		] );

		// Get the permalink (same-site URL).
		$url = get_permalink( $post_id );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/fetch-html' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( [ 'url' => $url ] ) );

		$response = rest_get_server()->dispatch( $request );

		// Same-site URLs should not be rejected as external.
		$this->assertNotEquals(
			403,
			$response->get_status(),
			'Same-site URLs should not be rejected'
		);
	}
}
