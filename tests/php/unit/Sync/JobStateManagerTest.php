<?php
/**
 * Tests for JobStateManager
 *
 * Following TDD principles - these tests define the INTENDED functionality.
 *
 * @package AetherSiteExporter\Tests\Unit\Sync
 */

declare(strict_types=1);

namespace AetherSiteExporter\Tests\Unit\Sync;

use AetherSiteExporter\Sync\JobStateManager;
use WP_UnitTestCase;

/**
 * JobStateManager test case.
 *
 * @since 1.0.0
 * @coversDefaultClass \AetherSiteExporter\Sync\JobStateManager
 */
class JobStateManagerTest extends WP_UnitTestCase {
	/**
	 * JobStateManager instance.
	 *
	 * @var JobStateManager
	 */
	private JobStateManager $manager;

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

		// Create table if not exists.
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

		$this->manager = new JobStateManager();
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
	 * Test: Creating a job should generate unique ID and store config.
	 *
	 * @since 1.0.0
	 * @covers ::create_job
	 * @return void
	 */
	public function test_create_job_generates_unique_id_and_stores_config(): void {
		// Arrange.
		$config = [
			'exportStaticSite' => true,
			'exportBlueprint'  => false,
			'targetUrl'        => 'https://example.com',
		];

		// Act.
		$job_id = $this->manager->create_job( $config );

		// Assert.
		$this->assertIsString( $job_id, 'Job ID should be a string' );
		$this->assertStringStartsWith( 'export_', $job_id, 'Job ID should start with export_' );
		$this->assertMatchesRegularExpression(
			'/^export_\d+_[a-zA-Z0-9]{8}$/',
			$job_id,
			'Job ID should match format: export_timestamp_randomchars'
		);

		// Verify job was stored in database.
		$status = $this->manager->get_status( $job_id );
		$this->assertIsArray( $status, 'Status should be an array' );
		$this->assertEquals( 'pending', $status['status'], 'Initial status should be pending' );
		$this->assertEquals( $config, $status['config'], 'Config should be stored correctly' );
	}

	/**
	 * Test: Getting status for non-existent job should return false.
	 *
	 * @since 1.0.0
	 * @covers ::get_status
	 * @return void
	 */
	public function test_get_status_returns_false_for_nonexistent_job(): void {
		// Act.
		$status = $this->manager->get_status( 'export_1234567890_abcdefgh' );

		// Assert.
		$this->assertFalse( $status, 'Status should be false for non-existent job' );
	}

	/**
	 * Test: Getting status for existing job should return all fields.
	 *
	 * @since 1.0.0
	 * @covers ::get_status
	 * @return void
	 */
	public function test_get_status_returns_all_fields(): void {
		// Arrange.
		$config = [ 'exportStaticSite' => true ];
		$job_id = $this->manager->create_job( $config );

		// Act.
		$status = $this->manager->get_status( $job_id );

		// Assert.
		$this->assertArrayHasKey( 'id', $status, 'Status should include id' );
		$this->assertArrayHasKey( 'status', $status, 'Status should include status' );
		$this->assertArrayHasKey( 'current_step', $status, 'Status should include current_step' );
		$this->assertArrayHasKey( 'workflow_state', $status, 'Status should include workflow_state' );
		$this->assertArrayHasKey( 'config', $status, 'Status should include config' );
		$this->assertArrayHasKey( 'error_message', $status, 'Status should include error_message' );
		$this->assertArrayHasKey( 'created_at', $status, 'Status should include created_at' );
		$this->assertArrayHasKey( 'updated_at', $status, 'Status should include updated_at' );
	}

	/**
	 * Test: Updating job status should merge workflow_state.
	 *
	 * @since 1.0.0
	 * @covers ::update_status
	 * @return void
	 */
	public function test_update_status_merges_workflow_state(): void {
		// Arrange.
		$config = [ 'exportStaticSite' => true ];
		$job_id = $this->manager->create_job( $config );

		// Act: First update.
		$success1 = $this->manager->update_status(
			$job_id,
			[
				'status'         => 'running',
				'workflow_state' => [ 'step1' => 'complete' ],
			]
		);

		// Act: Second update (should merge).
		$success2 = $this->manager->update_status(
			$job_id,
			[
				'workflow_state' => [ 'step2' => 'complete' ],
			]
		);

		// Assert.
		$this->assertTrue( $success1, 'First update should succeed' );
		$this->assertTrue( $success2, 'Second update should succeed' );

		$status = $this->manager->get_status( $job_id );
		$this->assertEquals( 'running', $status['status'], 'Status should be running' );
		$this->assertArrayHasKey( 'step1', $status['workflow_state'], 'workflow_state should include step1' );
		$this->assertArrayHasKey( 'step2', $status['workflow_state'], 'workflow_state should include step2' );
		$this->assertEquals( 'complete', $status['workflow_state']['step1'], 'step1 should be complete' );
		$this->assertEquals( 'complete', $status['workflow_state']['step2'], 'step2 should be complete' );
	}

	/**
	 * Test: Transitioning to next step should update status and current_step.
	 *
	 * @since 1.0.0
	 * @covers ::transition_to
	 * @return void
	 */
	public function test_transition_to_updates_status_and_step(): void {
		// Arrange.
		$config = [ 'exportStaticSite' => true ];
		$job_id = $this->manager->create_job( $config );

		// Act.
		$success = $this->manager->transition_to(
			$job_id,
			'discoverUrls',
			'Discovering URLs...'
		);

		// Assert.
		$this->assertTrue( $success, 'Transition should succeed' );

		$status = $this->manager->get_status( $job_id );
		$this->assertEquals( 'running', $status['status'], 'Status should be running' );
		$this->assertEquals( 'discoverUrls', $status['current_step'], 'Current step should be discoverUrls' );
		$this->assertEquals( 'Discovering URLs...', $status['workflow_state']['message'], 'Message should be stored in workflow_state' );
	}

	/**
	 * Test: Transitioning with extra data should merge into workflow_state.
	 *
	 * @since 1.0.0
	 * @covers ::transition_to
	 * @return void
	 */
	public function test_transition_to_merges_extra_data(): void {
		// Arrange.
		$config = [ 'exportStaticSite' => true ];
		$job_id = $this->manager->create_job( $config );

		// Act.
		$success = $this->manager->transition_to(
			$job_id,
			'discoverUrls',
			'Discovered URLs',
			[ 'urlCount' => 42 ]
		);

		// Assert.
		$this->assertTrue( $success, 'Transition should succeed' );

		$status = $this->manager->get_status( $job_id );
		$this->assertEquals( 42, $status['workflow_state']['urlCount'], 'urlCount should be stored in workflow_state' );
	}

	/**
	 * Test: Marking job as complete should update status.
	 *
	 * @since 1.0.0
	 * @covers ::mark_complete
	 * @return void
	 */
	public function test_mark_complete_updates_status(): void {
		// Arrange.
		$config = [ 'exportStaticSite' => true ];
		$job_id = $this->manager->create_job( $config );

		// Act.
		$success = $this->manager->mark_complete( $job_id, 'Export completed!' );

		// Assert.
		$this->assertTrue( $success, 'Mark complete should succeed' );

		$status = $this->manager->get_status( $job_id );
		$this->assertEquals( 'complete', $status['status'], 'Status should be complete' );
		$this->assertEquals( 'completed', $status['current_step'], 'Current step should be completed' );
		$this->assertEquals( 'Export completed!', $status['workflow_state']['message'], 'Message should be stored' );
	}

	/**
	 * Test: Marking job as failed should store error message.
	 *
	 * @since 1.0.0
	 * @covers ::mark_failed
	 * @return void
	 */
	public function test_mark_failed_stores_error_message(): void {
		// Arrange.
		$config = [ 'exportStaticSite' => true ];
		$job_id = $this->manager->create_job( $config );

		// Act.
		$success = $this->manager->mark_failed( $job_id, 'Database connection failed', 'convertDatabase' );

		// Assert.
		$this->assertTrue( $success, 'Mark failed should succeed' );

		$status = $this->manager->get_status( $job_id );
		$this->assertEquals( 'failed', $status['status'], 'Status should be failed' );
		$this->assertEquals( 'Database connection failed', $status['error_message'], 'Error message should be stored' );
		$this->assertEquals( 'convertDatabase', $status['current_step'], 'Current step should be stored' );
	}

	/**
	 * Test: Getting all jobs should return most recent first.
	 *
	 * @since 1.0.0
	 * @covers ::get_all_jobs
	 * @return void
	 */
	public function test_get_all_jobs_returns_most_recent_first(): void {
		// Arrange: Create multiple jobs with delay to ensure different timestamps.
		$job_id1 = $this->manager->create_job( [ 'export' => 1 ] );
		sleep( 1 );
		$job_id2 = $this->manager->create_job( [ 'export' => 2 ] );
		sleep( 1 );
		$job_id3 = $this->manager->create_job( [ 'export' => 3 ] );

		// Act.
		$jobs = $this->manager->get_all_jobs();

		// Assert.
		$this->assertCount( 3, $jobs, 'Should return 3 jobs' );
		$this->assertEquals( $job_id3, $jobs[0]['id'], 'First job should be most recent' );
		$this->assertEquals( $job_id2, $jobs[1]['id'], 'Second job should be middle' );
		$this->assertEquals( $job_id1, $jobs[2]['id'], 'Third job should be oldest' );
	}

	/**
	 * Test: Getting all jobs with limit should respect limit.
	 *
	 * @since 1.0.0
	 * @covers ::get_all_jobs
	 * @return void
	 */
	public function test_get_all_jobs_respects_limit(): void {
		// Arrange: Create 5 jobs.
		for ( $i = 0; $i < 5; $i++ ) {
			$this->manager->create_job( [ 'export' => $i ] );
		}

		// Act.
		$jobs = $this->manager->get_all_jobs( 2 );

		// Assert.
		$this->assertCount( 2, $jobs, 'Should return only 2 jobs when limit is 2' );
	}

	/**
	 * Test: Deleting job should remove it from database.
	 *
	 * @since 1.0.0
	 * @covers ::delete_job
	 * @return void
	 */
	public function test_delete_job_removes_from_database(): void {
		// Arrange.
		$config = [ 'exportStaticSite' => true ];
		$job_id = $this->manager->create_job( $config );

		// Verify job exists.
		$this->assertIsArray( $this->manager->get_status( $job_id ), 'Job should exist before deletion' );

		// Act.
		$success = $this->manager->delete_job( $job_id );

		// Assert.
		$this->assertTrue( $success, 'Delete should succeed' );
		$this->assertFalse( $this->manager->get_status( $job_id ), 'Job should not exist after deletion' );
	}

	/**
	 * Test: Cleanup should keep N most recent jobs and delete older ones.
	 *
	 * @since 1.0.0
	 * @covers ::cleanup_old_jobs
	 * @return void
	 */
	public function test_cleanup_keeps_n_recent_jobs(): void {
		// Arrange: Create 10 jobs with small delays.
		for ( $i = 0; $i < 10; $i++ ) {
			$this->manager->create_job( [ 'export' => $i ] );
			usleep( 100000 ); // 0.1 second delay.
		}

		// Act: Keep only 5 most recent.
		$deleted = $this->manager->cleanup_old_jobs( 5 );

		// Assert.
		$this->assertEquals( 5, $deleted, 'Should delete 5 old jobs' );

		$remaining_jobs = $this->manager->get_all_jobs();
		$this->assertCount( 5, $remaining_jobs, 'Should have 5 jobs remaining' );
	}

	/**
	 * Test: Cleanup should not delete anything if count is less than keep_count.
	 *
	 * @since 1.0.0
	 * @covers ::cleanup_old_jobs
	 * @return void
	 */
	public function test_cleanup_does_not_delete_when_under_limit(): void {
		// Arrange: Create 3 jobs.
		for ( $i = 0; $i < 3; $i++ ) {
			$this->manager->create_job( [ 'export' => $i ] );
		}

		// Act: Keep 5 most recent.
		$deleted = $this->manager->cleanup_old_jobs( 5 );

		// Assert.
		$this->assertEquals( 0, $deleted, 'Should not delete any jobs' );

		$remaining_jobs = $this->manager->get_all_jobs();
		$this->assertCount( 3, $remaining_jobs, 'Should still have 3 jobs' );
	}
}
