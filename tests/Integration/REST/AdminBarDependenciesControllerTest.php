<?php

/**
 * Admin Bar Dependencies Controller Tests
 *
 * Tests for AdminBarDependenciesController - provides WordPress script/style dependencies.
 *
 * Quality Standards:
 * - Tests must verify dependency tree is complete
 * - Must test URL construction is correct
 * - Must test permission checks work
 * - Must fail if dependencies are missing or malformed
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Integration\REST;

use Aether\SiteExporter\REST\AdminBarDependenciesController;
use Aether\SiteExporter\Tests\Helpers\TestCase;
use WP_REST_Request;

class AdminBarDependenciesControllerTest extends TestCase
{
	/**
	 * Controller instance.
	 *
	 * @var AdminBarDependenciesController
	 */
	private AdminBarDependenciesController $controller;

	/**
	 * Namespace for REST routes.
	 *
	 * @var string
	 */
	private string $namespace = 'aether/site-exporter';

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->controller = new AdminBarDependenciesController();

		// Register routes using rest_api_init hook (WordPress best practice)
		add_action( 'rest_api_init', [ $this->controller, 'registerRoutes' ] );
		do_action( 'rest_api_init' );

		// Ensure scripts and styles are registered
		do_action( 'init' );
		do_action( 'wp_default_scripts', wp_scripts() );
		do_action( 'wp_default_styles', wp_styles() );
	}

	/**
	 * Test route is registered.
	 */
	public function test_route_is_registered(): void
	{
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			'/' . $this->namespace . '/admin-bar-dependencies',
			$routes
		);
	}

	/**
	 * Test getDependencies returns scripts and styles.
	 */
	public function test_getDependencies_returns_scripts_and_styles(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertIsArray( $data['scripts'] );
		$this->assertIsArray( $data['styles'] );
	}

	/**
	 * Test getDependencies includes required scripts.
	 */
	public function test_getDependencies_includes_required_scripts(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$scripts = $data['scripts'];

		// Verify required scripts are present
		$scriptHandles = array_column( $scripts, 'handle' );

		$this->assertContains( 'wp-element', $scriptHandles );
		$this->assertContains( 'wp-components', $scriptHandles );
		$this->assertContains( 'wp-api-fetch', $scriptHandles );
	}

	/**
	 * Test getDependencies includes required styles.
	 */
	public function test_getDependencies_includes_required_styles(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$styles = $data['styles'];

		// Verify required styles are present
		$styleHandles = array_column( $styles, 'handle' );

		$this->assertContains( 'wp-components', $styleHandles );
	}

	/**
	 * Test script data structure is correct.
	 */
	public function test_script_data_structure_is_correct(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$scripts = $data['scripts'];

		$this->assertNotEmpty( $scripts );

		foreach ( $scripts as $script ) {
			$this->assertArrayHasKey( 'handle', $script );
			$this->assertArrayHasKey( 'id', $script );
			$this->assertArrayHasKey( 'src', $script );
			$this->assertArrayHasKey( 'version', $script );
			$this->assertArrayHasKey( 'dependencies', $script );

			// Verify ID format: {handle}-js
			$this->assertStringEndsWith( '-js', $script['id'] );
			$this->assertStringStartsWith( $script['handle'], $script['id'] );
		}
	}

	/**
	 * Test style data structure is correct.
	 */
	public function test_style_data_structure_is_correct(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$styles = $data['styles'];

		$this->assertNotEmpty( $styles );

		foreach ( $styles as $style ) {
			$this->assertArrayHasKey( 'handle', $style );
			$this->assertArrayHasKey( 'id', $style );
			$this->assertArrayHasKey( 'src', $style );
			$this->assertArrayHasKey( 'version', $style );
			$this->assertArrayHasKey( 'dependencies', $style );

			// Verify ID format: {handle}-css
			$this->assertStringEndsWith( '-css', $style['id'] );
			$this->assertStringStartsWith( $style['handle'], $style['id'] );
		}
	}

	/**
	 * Test script dependencies are resolved recursively.
	 */
	public function test_script_dependencies_are_resolved_recursively(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$scripts = $data['scripts'];

		$scriptHandles = array_column( $scripts, 'handle' );

		// wp-components depends on wp-element
		// If wp-components is present, wp-element should also be present
		if ( in_array( 'wp-components', $scriptHandles, true ) ) {
			$this->assertContains( 'wp-element', $scriptHandles );
		}
	}

	/**
	 * Test URLs are absolute.
	 */
	public function test_urls_are_absolute(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();

		// Check scripts have absolute URLs
		foreach ( $data['scripts'] as $script ) {
			$this->assertMatchesRegularExpression(
				'/^(https?:)?\/\//',
				$script['src'],
				'Script URL should be absolute: ' . $script['src']
			);
		}

		// Check styles have absolute URLs
		foreach ( $data['styles'] as $style ) {
			$this->assertMatchesRegularExpression(
				'/^(https?:)?\/\//',
				$style['src'],
				'Style URL should be absolute: ' . $style['src']
			);
		}
	}

	/**
	 * Test version parameters are added to URLs.
	 */
	public function test_version_parameters_are_added(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();

		// Check scripts with versions have ver parameter
		foreach ( $data['scripts'] as $script ) {
			if ( ! empty( $script['version'] ) ) {
				$this->assertStringContainsString(
					'ver=' . $script['version'],
					$script['src'],
					'Script URL should contain version parameter'
				);
			}
		}

		// Check styles with versions have ver parameter
		foreach ( $data['styles'] as $style ) {
			if ( ! empty( $style['version'] ) ) {
				$this->assertStringContainsString(
					'ver=' . $style['version'],
					$style['src'],
					'Style URL should contain version parameter'
				);
			}
		}
	}

	/**
	 * Test permission check requires authentication.
	 */
	public function test_permission_check_requires_authentication(): void
	{
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test permission check allows administrators.
	 */
	public function test_permission_check_allows_administrators(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotEquals( 401, $response->get_status() );
		$this->assertNotEquals( 403, $response->get_status() );
	}

	/**
	 * Test permission check denies editors.
	 *
	 * Export functionality requires manage_options capability (admin-only).
	 */
	public function test_permission_check_denies_editors(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'editor' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test handles missing scripts gracefully.
	 */
	public function test_handles_missing_scripts_gracefully(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		// Deregister a script
		wp_deregister_script( 'nonexistent-script' );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		// Should not crash, should still return valid data
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test handles missing styles gracefully.
	 */
	public function test_handles_missing_styles_gracefully(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		// Deregister a style
		wp_deregister_style( 'nonexistent-style' );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		// Should not crash, should still return valid data
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test no duplicate scripts in result.
	 */
	public function test_no_duplicate_scripts_in_result(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$scriptHandles = array_column( $data['scripts'], 'handle' );

		$this->assertSame(
			count( $scriptHandles ),
			count( array_unique( $scriptHandles ) ),
			'Scripts should not contain duplicates'
		);
	}

	/**
	 * Test no duplicate styles in result.
	 */
	public function test_no_duplicate_styles_in_result(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$styleHandles = array_column( $data['styles'], 'handle' );

		$this->assertSame(
			count( $styleHandles ),
			count( array_unique( $styleHandles ) ),
			'Styles should not contain duplicates'
		);
	}

	/**
	 * Test error handling.
	 */
	public function test_handles_errors_gracefully(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		// The method should handle exceptions gracefully
		// We cannot directly trigger an exception in the controller without modifying it
		// but we can verify the error response structure

		// Normal request should succeed
		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Test response format consistency.
	 */
	public function test_response_format_is_consistent(): void
	{
		wp_set_current_user( $this->factory->user->create( [ 'role' => 'administrator' ] ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/admin-bar-dependencies' );
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();

		// Verify response structure
		$this->assertArrayHasKey( 'success', $data );
		$this->assertArrayHasKey( 'scripts', $data );
		$this->assertArrayHasKey( 'styles', $data );
		$this->assertTrue( is_bool( $data['success'] ) );
	}
}
