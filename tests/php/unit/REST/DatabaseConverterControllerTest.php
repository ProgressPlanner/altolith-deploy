<?php
/**
 * Tests for DatabaseConverterController
 *
 * Following TDD principles - these tests define the INTENDED functionality
 * for REST API endpoints that handle MySQL to SQLite conversion via AJAX.
 *
 * @package AetherSiteExporter\Tests\Unit\REST
 */

declare(strict_types=1);

namespace AetherSiteExporter\Tests\Unit\REST;

use AetherSiteExporter\REST\DatabaseConverterController;
use AetherSiteExporter\Sync\JobStateManager;
use WP_REST_Request;
use WP_UnitTestCase;

/**
 * DatabaseConverterController test case.
 *
 * @since 1.0.0
 * @coversDefaultClass \AetherSiteExporter\REST\DatabaseConverterController
 */
class DatabaseConverterControllerTest extends WP_UnitTestCase {
	/**
	 * DatabaseConverterController instance.
	 *
	 * @var DatabaseConverterController
	 */
	private DatabaseConverterController $controller;

	/**
	 * JobStateManager instance.
	 *
	 * @var JobStateManager
	 */
	private JobStateManager $state_manager;

	/**
	 * Test job ID.
	 *
	 * @var string
	 */
	private string $test_job_id;

	/**
	 * Set up test environment.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		// Ensure database table exists.
		global $wpdb;
		$table_name      = $wpdb->prefix . 'aether_export_jobs';
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE IF NOT EXISTS $table_name (
			id varchar(255) NOT NULL,
			status varchar(20) NOT NULL DEFAULT 'pending',
			current_step varchar(50) DEFAULT NULL,
			workflow_state longtext DEFAULT NULL,
			config longtext DEFAULT NULL,
			error_message text DEFAULT NULL,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			PRIMARY KEY (id),
			KEY status (status),
			KEY created_at (created_at)
		) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );

		$this->controller    = new DatabaseConverterController();
		$this->state_manager = new JobStateManager();

		// Create a test job.
		$this->test_job_id = $this->state_manager->create_job(
			[
				'exportBlueprint' => true,
			]
		);

		// Set current user as administrator for permission checks.
		wp_set_current_user( 1 );
	}

	/**
	 * Tear down test environment.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function tear_down(): void {
		// Clean up database.
		global $wpdb;
		$table_name = $wpdb->prefix . 'aether_export_jobs';
		$wpdb->query( "TRUNCATE TABLE $table_name" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		parent::tear_down();
	}

	/**
	 * Test: Routes should be registered correctly.
	 *
	 * @since 1.0.0
	 * @covers ::register_routes
	 * @return void
	 */
	public function test_routes_are_registered(): void {
		// Arrange.
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init' );

		// Act.
		$this->controller->register_routes();

		// Assert: Check that routes exist.
		$routes = $wp_rest_server->get_routes();
		$namespace = 'aether-site-exporter/v1';

		$this->assertArrayHasKey( "/$namespace/export/(?P<jobId>[a-zA-Z0-9_]+)/analyze-database", $routes, 'analyze-database route should be registered' );
		$this->assertArrayHasKey( "/$namespace/export/(?P<jobId>[a-zA-Z0-9_]+)/convert-chunk", $routes, 'convert-chunk route should be registered' );
		$this->assertArrayHasKey( "/$namespace/export/(?P<jobId>[a-zA-Z0-9_]+)/finalize-database", $routes, 'finalize-database route should be registered' );
	}

	/**
	 * Test: Analyze database should return analysis data and store in job state.
	 *
	 * @since 1.0.0
	 * @covers ::analyze_database
	 * @return void
	 */
	public function test_analyze_database_returns_analysis(): void {
		// Arrange.
		$request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/analyze-database" );
		$request->set_param( 'jobId', $this->test_job_id );

		// Act.
		$response = $this->controller->analyze_database( $request );
		$data     = $response->get_data();

		// Assert: Response structure.
		$this->assertTrue( $data['success'], 'Response should be successful' );
		$this->assertArrayHasKey( 'data', $data, 'Response should include data' );

		// Assert: Analysis data structure.
		$analysis = $data['data'];
		$this->assertArrayHasKey( 'tables', $analysis, 'Analysis should include tables array' );
		$this->assertArrayHasKey( 'totalSize', $analysis, 'Analysis should include totalSize' );
		$this->assertArrayHasKey( 'totalChunks', $analysis, 'Analysis should include totalChunks' );
		$this->assertArrayHasKey( 'estimatedTime', $analysis, 'Analysis should include estimatedTime' );

		// Assert: Tables array structure.
		$this->assertNotEmpty( $analysis['tables'], 'Should have at least one table' );
		$first_table = $analysis['tables'][0];
		$this->assertArrayHasKey( 'name', $first_table, 'Table should have name' );
		$this->assertArrayHasKey( 'rows', $first_table, 'Table should have rows' );
		$this->assertArrayHasKey( 'size', $first_table, 'Table should have size' );
		$this->assertArrayHasKey( 'chunks', $first_table, 'Table should have chunks' );

		// Assert: Analysis stored in job state.
		$job_status = $this->state_manager->get_status( $this->test_job_id );
		$this->assertArrayHasKey( 'database_analysis', $job_status['workflow_state'], 'Job state should include database_analysis' );
		$this->assertEquals( $analysis, $job_status['workflow_state']['database_analysis'], 'Stored analysis should match response' );
	}

	/**
	 * Test: Analyze database should return error for non-existent job.
	 *
	 * @since 1.0.0
	 * @covers ::analyze_database
	 * @return void
	 */
	public function test_analyze_database_returns_error_for_invalid_job(): void {
		// Arrange.
		$request = new WP_REST_Request( 'POST', '/aether-site-exporter/v1/export/invalid_job_123/analyze-database' );
		$request->set_param( 'jobId', 'export_1234567890_abcdefgh' );

		// Act.
		$response = $this->controller->analyze_database( $request );

		// Assert.
		$this->assertInstanceOf( \WP_Error::class, $response, 'Should return WP_Error for invalid job' );
		$this->assertEquals( 'job_not_found', $response->get_error_code(), 'Error code should be job_not_found' );
	}

	/**
	 * Test: Convert chunk should process data and return progress.
	 *
	 * @since 1.0.0
	 * @covers ::convert_chunk
	 * @return void
	 */
	public function test_convert_chunk_returns_progress(): void {
		// Arrange: First, analyze database to populate state.
		$analyze_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/analyze-database" );
		$analyze_request->set_param( 'jobId', $this->test_job_id );
		$this->controller->analyze_database( $analyze_request );

		// Now convert a chunk.
		$convert_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/convert-chunk" );
		$convert_request->set_param( 'jobId', $this->test_job_id );
		$convert_request->set_body_params( [ 'chunkIndex' => 0 ] );

		// Act.
		$response = $this->controller->convert_chunk( $convert_request );
		$data     = $response->get_data();

		// Assert: Response structure.
		$this->assertTrue( $data['success'], 'Response should be successful' );
		$this->assertArrayHasKey( 'data', $data, 'Response should include data' );

		// Assert: Progress data structure.
		$result = $data['data'];
		$this->assertArrayHasKey( 'complete', $result, 'Result should include complete flag' );
		$this->assertArrayHasKey( 'progress', $result, 'Result should include progress' );
		$this->assertArrayHasKey( 'bytesConverted', $result, 'Result should include bytesConverted' );
		$this->assertArrayHasKey( 'totalBytes', $result, 'Result should include totalBytes' );
		$this->assertArrayHasKey( 'currentTable', $result, 'Result should include currentTable' );
		$this->assertArrayHasKey( 'message', $result, 'Result should include message' );

		// Assert: Progress is valid.
		$this->assertIsFloat( $result['progress'], 'Progress should be a float' );
		$this->assertGreaterThanOrEqual( 0, $result['progress'], 'Progress should be >= 0' );
		$this->assertLessThanOrEqual( 100, $result['progress'], 'Progress should be <= 100' );
	}

	/**
	 * Test: Convert chunk should update job state with conversion progress.
	 *
	 * @since 1.0.0
	 * @covers ::convert_chunk
	 * @return void
	 */
	public function test_convert_chunk_updates_job_state(): void {
		// Arrange: Analyze database first.
		$analyze_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/analyze-database" );
		$analyze_request->set_param( 'jobId', $this->test_job_id );
		$this->controller->analyze_database( $analyze_request );

		// Act: Convert a chunk.
		$convert_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/convert-chunk" );
		$convert_request->set_param( 'jobId', $this->test_job_id );
		$convert_request->set_body_params( [ 'chunkIndex' => 0 ] );
		$this->controller->convert_chunk( $convert_request );

		// Assert: Job state should be updated.
		$job_status = $this->state_manager->get_status( $this->test_job_id );
		$this->assertArrayHasKey( 'current_table', $job_status['workflow_state'], 'Job state should include current_table' );
		$this->assertArrayHasKey( 'current_offset', $job_status['workflow_state'], 'Job state should include current_offset' );
		$this->assertArrayHasKey( 'bytes_converted', $job_status['workflow_state'], 'Job state should include bytes_converted' );
	}

	/**
	 * Test: Convert chunk should return error if database not analyzed.
	 *
	 * @since 1.0.0
	 * @covers ::convert_chunk
	 * @return void
	 */
	public function test_convert_chunk_requires_analysis_first(): void {
		// Arrange: Create a new job without analysis.
		$new_job_id = $this->state_manager->create_job( [ 'exportBlueprint' => true ] );

		$request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/$new_job_id/convert-chunk" );
		$request->set_param( 'jobId', $new_job_id );
		$request->set_body_params( [ 'chunkIndex' => 0 ] );

		// Act.
		$response = $this->controller->convert_chunk( $request );

		// Assert.
		$this->assertInstanceOf( \WP_Error::class, $response, 'Should return WP_Error when analysis not done' );
		$this->assertEquals( 'missing_analysis', $response->get_error_code(), 'Error code should be missing_analysis' );
	}

	/**
	 * Test: Finalize database should create indexes and optimize.
	 *
	 * @since 1.0.0
	 * @covers ::finalize_database
	 * @return void
	 */
	public function test_finalize_database_succeeds(): void {
		// Arrange: Analyze database first.
		$analyze_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/analyze-database" );
		$analyze_request->set_param( 'jobId', $this->test_job_id );
		$this->controller->analyze_database( $analyze_request );

		// Convert at least one chunk.
		$convert_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/convert-chunk" );
		$convert_request->set_param( 'jobId', $this->test_job_id );
		$convert_request->set_body_params( [ 'chunkIndex' => 0 ] );
		$this->controller->convert_chunk( $convert_request );

		// Act: Finalize database.
		$finalize_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/finalize-database" );
		$finalize_request->set_param( 'jobId', $this->test_job_id );
		$response = $this->controller->finalize_database( $finalize_request );
		$data     = $response->get_data();

		// Assert.
		$this->assertTrue( $data['success'], 'Finalization should be successful' );
		$this->assertArrayHasKey( 'message', $data, 'Response should include message' );
	}

	/**
	 * Test: Finalize database should return error if database not analyzed.
	 *
	 * @since 1.0.0
	 * @covers ::finalize_database
	 * @return void
	 */
	public function test_finalize_database_requires_analysis(): void {
		// Arrange: Create a new job without analysis.
		$new_job_id = $this->state_manager->create_job( [ 'exportBlueprint' => true ] );

		$request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/$new_job_id/finalize-database" );
		$request->set_param( 'jobId', $new_job_id );

		// Act.
		$response = $this->controller->finalize_database( $request );

		// Assert.
		$this->assertInstanceOf( \WP_Error::class, $response, 'Should return WP_Error when analysis not done' );
		$this->assertEquals( 'missing_analysis', $response->get_error_code(), 'Error code should be missing_analysis' );
	}

	/**
	 * Test: Permission check should deny non-admin users.
	 *
	 * @since 1.0.0
	 * @covers ::permission_check
	 * @return void
	 */
	public function test_permission_check_denies_non_admin(): void {
		// Arrange: Set current user to non-admin (subscriber).
		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		wp_set_current_user( $user_id );

		// Act.
		$has_permission = $this->controller->permission_check();

		// Assert.
		$this->assertFalse( $has_permission, 'Non-admin users should be denied' );
	}

	/**
	 * Test: Permission check should allow admin users.
	 *
	 * @since 1.0.0
	 * @covers ::permission_check
	 * @return void
	 */
	public function test_permission_check_allows_admin(): void {
		// Arrange: Set current user to admin.
		wp_set_current_user( 1 );

		// Act.
		$has_permission = $this->controller->permission_check();

		// Assert.
		$this->assertTrue( $has_permission, 'Admin users should be allowed' );
	}

	/**
	 * Test: Complete conversion workflow via REST API.
	 *
	 * Integration test that verifies the entire AJAX-based conversion process.
	 *
	 * @since 1.0.0
	 * @covers ::analyze_database
	 * @covers ::convert_chunk
	 * @covers ::finalize_database
	 * @return void
	 */
	public function test_complete_conversion_workflow_via_rest(): void {
		// Step 1: Analyze database.
		$analyze_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/analyze-database" );
		$analyze_request->set_param( 'jobId', $this->test_job_id );
		$analyze_response = $this->controller->analyze_database( $analyze_request );
		$this->assertTrue( $analyze_response->get_data()['success'], 'Analysis should succeed' );

		$analysis = $analyze_response->get_data()['data'];
		$total_chunks = $analysis['totalChunks'];

		// Step 2: Convert all chunks.
		$chunk_index = 0;
		$complete = false;
		$max_iterations = max( 10, $total_chunks + 5 ); // Safety limit.

		while ( ! $complete && $chunk_index < $max_iterations ) {
			$convert_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/convert-chunk" );
			$convert_request->set_param( 'jobId', $this->test_job_id );
			$convert_request->set_body_params( [ 'chunkIndex' => $chunk_index ] );

			$convert_response = $this->controller->convert_chunk( $convert_request );
			$convert_data = $convert_response->get_data();

			$this->assertTrue( $convert_data['success'], "Chunk $chunk_index conversion should succeed" );

			$complete = $convert_data['data']['complete'];
			$chunk_index++;
		}

		$this->assertTrue( $complete, 'All chunks should be converted' );
		$this->assertLessThan( $max_iterations, $chunk_index, 'Should not hit iteration limit' );

		// Step 3: Finalize database.
		$finalize_request = new WP_REST_Request( 'POST', "/aether-site-exporter/v1/export/{$this->test_job_id}/finalize-database" );
		$finalize_request->set_param( 'jobId', $this->test_job_id );
		$finalize_response = $this->controller->finalize_database( $finalize_request );

		$this->assertTrue( $finalize_response->get_data()['success'], 'Finalization should succeed' );

		// Verify: SQLite database file exists.
		$job_status = $this->state_manager->get_status( $this->test_job_id );
		$sqlite_path = $job_status['workflow_state']['sqlite_path'] ?? '';
		$this->assertFileExists( $sqlite_path, 'SQLite database file should exist' );
	}
}
