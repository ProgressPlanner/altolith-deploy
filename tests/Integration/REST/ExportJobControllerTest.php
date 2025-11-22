<?php

/**
 * Export Job Controller Tests
 *
 * Tests for ExportJobController - handles export job management endpoints.
 *
 * Quality Standards:
 * - Tests must verify all REST routes are registered
 * - Must test permission checks work correctly
 * - Must test job creation and status retrieval
 * - Must fail if unauthorized users can access
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Integration\REST;

use Aether\SiteExporter\REST\Export\ExportJobController;
use Aether\SiteExporter\Plugin;
use Aether\SiteExporter\Tests\Helpers\TestCase;
use WP_REST_Request;

class ExportJobControllerTest extends TestCase
{
	/**
	 * Controller instance.
	 *
	 * @var ExportJobController
	 */
	private ExportJobController $controller;

	/**
	 * Plugin instance.
	 *
	 * @var Plugin
	 */
	private Plugin $plugin;

	/**
	 * Namespace for REST routes.
	 *
	 * @var string
	 */
	private string $namespace = 'aether/v1';

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->plugin = Plugin::getInstance();
		$this->controller = new ExportJobController( $this->plugin );
		$this->controller->registerRoutes();
	}

	/**
	 * Test export route is registered.
	 */
	public function test_export_route_is_registered(): void
	{
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/' . $this->namespace . '/export', $routes );
	}

	/**
	 * Test job status route is registered.
	 */
	public function test_job_status_route_is_registered(): void
	{
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/' . $this->namespace . '/export/(?P<jobId>[a-zA-Z0-9_]+)/status', $routes );
	}

	/**
	 * Test recent jobs route is registered.
	 */
	public function test_recent_jobs_route_is_registered(): void
	{
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/' . $this->namespace . '/export/jobs', $routes );
	}

	/**
	 * Test mark uploads complete route is registered.
	 */
	public function test_mark_uploads_complete_route_is_registered(): void
	{
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			'/' . $this->namespace . '/export/(?P<jobId>[a-zA-Z0-9_]+)/mark-uploads-complete',
			$routes
		);
	}

	/**
	 * Test startExport requires authentication.
	 */
	public function test_startExport_requires_authentication(): void
	{
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test startExport allows administrators.
	 */
	public function test_startExport_allows_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export' );
		$response = rest_get_server()->dispatch( $request );

		// May return error for missing params, but should not be 401/403
		$this->assertNotEquals( 401, $response->get_status() );
		$this->assertNotEquals( 403, $response->get_status() );
	}

	/**
	 * Test getStatus requires authentication.
	 */
	public function test_getStatus_requires_authentication(): void
	{
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/test_job_123/status' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test getStatus allows administrators.
	 */
	public function test_getStatus_allows_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/test_job_123/status' );
		$response = rest_get_server()->dispatch( $request );

		// May return error for non-existent job, but should not be 401/403
		$this->assertNotEquals( 401, $response->get_status() );
		$this->assertNotEquals( 403, $response->get_status() );
	}

	/**
	 * Test updateStatus requires authentication.
	 */
	public function test_updateStatus_requires_authentication(): void
	{
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/test_job_123/status' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test getRecentJobs requires authentication.
	 */
	public function test_getRecentJobs_requires_authentication(): void
	{
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/jobs' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test getRecentJobs allows administrators.
	 */
	public function test_getRecentJobs_allows_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/jobs' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotEquals( 401, $response->get_status() );
		$this->assertNotEquals( 403, $response->get_status() );
	}

	/**
	 * Test markUploadsComplete requires authentication.
	 */
	public function test_markUploadsComplete_requires_authentication(): void
	{
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/test_job_123/mark-uploads-complete' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test jobId parameter validation.
	 */
	public function test_jobId_parameter_validation(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		// Valid jobId (alphanumeric + underscore)
		$request1 = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/test_job_123/status' );
		$response1 = rest_get_server()->dispatch( $request1 );
		$this->assertNotEquals( 404, $response1->get_status(), 'Valid jobId should match route' );

		// Valid jobId with underscores
		$request2 = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/test_job_abc_123/status' );
		$response2 = rest_get_server()->dispatch( $request2 );
		$this->assertNotEquals( 404, $response2->get_status(), 'Valid jobId with underscores should match route' );
	}

	/**
	 * Test export route accepts POST method only.
	 */
	public function test_export_route_post_method_only(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test status route accepts GET and POST methods.
	 */
	public function test_status_route_accepts_get_and_post(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$getRequest = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/test_job/status' );
		$getResponse = rest_get_server()->dispatch( $getRequest );
		$this->assertNotEquals( 404, $getResponse->get_status(), 'GET should be allowed' );

		$postRequest = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/test_job/status' );
		$postResponse = rest_get_server()->dispatch( $postRequest );
		$this->assertNotEquals( 404, $postResponse->get_status(), 'POST should be allowed' );
	}

	/**
	 * Test recent jobs route accepts GET method only.
	 */
	public function test_recent_jobs_route_get_method_only(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export/jobs' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test permissions for editors.
	 */
	public function test_permissions_for_editors(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'editor' ] ) );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export' );
		$response = rest_get_server()->dispatch( $request );

		// Editors should have access
		$this->assertNotEquals( 401, $response->get_status() );
		$this->assertNotEquals( 403, $response->get_status() );
	}

	/**
	 * Test permissions for subscribers.
	 */
	public function test_permissions_deny_subscribers(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'subscriber' ] ) );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/export' );
		$response = rest_get_server()->dispatch( $request );

		// Subscribers should not have access
		$this->assertContains( $response->get_status(), [ 401, 403 ] );
	}

	/**
	 * Test all routes use same namespace.
	 */
	public function test_all_routes_use_same_namespace(): void
	{
		$routes = rest_get_server()->get_routes();

		$aetherRoutes = array_filter( array_keys( $routes ), function( $route ) {
			return str_starts_with( $route, '/' . $this->namespace );
		} );

		// Should have at least 4 routes
		$this->assertGreaterThanOrEqual( 4, count( $aetherRoutes ) );
	}

	/**
	 * Test route parameters are properly sanitized.
	 */
	public function test_route_parameters_sanitized(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		// Try with special characters in jobId - should not match route pattern
		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/export/job-with-dash/status' );
		$response = rest_get_server()->dispatch( $request );

		// Dash is not allowed in jobId pattern - should be 404
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test controller uses encryption helper.
	 */
	public function test_controller_uses_encryption_helper(): void
	{
		// Controller should use EncryptionHelper trait
		$traits = class_uses( ExportJobController::class );

		$this->assertContains( 'Aether\SiteExporter\Utilities\EncryptionHelper', $traits );
	}

	/**
	 * Test controller uses export helpers trait.
	 */
	public function test_controller_uses_export_helpers_trait(): void
	{
		$traits = class_uses( ExportJobController::class );

		$this->assertContains( 'Aether\SiteExporter\REST\Export\ExportHelpersTrait', $traits );
	}
}
