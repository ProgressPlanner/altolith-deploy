<?php
/**
 * Publish Workflow Integration Tests
 *
 * Tests the complete publish workflow including job state management.
 * Validates job lifecycle, state transitions, and error handling.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Integration\Workflows;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Sync\JobStateManager;
use Aether\SiteExporter\Providers\ProviderRegistry;

/**
 * Publish workflow test case.
 */
class PublishWorkflowTest extends TestCase {

	/**
	 * Job state manager instance.
	 *
	 * @var JobStateManager
	 */
	private $state_manager;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->state_manager = new JobStateManager();
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		// Clean up all job transients.
		global $wpdb;
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_aether_job_%'" );
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_aether_job_%'" );

		parent::tear_down();
	}

	// ========================================================================
	// Job Lifecycle Tests
	// ========================================================================

	/**
	 * Test creating job starts in pending state.
	 */
	public function test_create_job_starts_pending() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->state_manager->updateStatus(
			$job_id,
			[
				'status'      => 'pending',
				'currentStep' => 'init',
				'message'     => 'Job created',
			]
		);

		$status = $this->state_manager->getStatus( $job_id );

		$this->assertEquals( 'pending', $status['status'] );
		$this->assertEquals( 'init', $status['currentStep'] );
	}

	/**
	 * Test job transitions through states correctly.
	 */
	public function test_job_state_transitions() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		// Create job in pending state.
		$this->state_manager->updateStatus( $job_id, [ 'status' => 'pending' ] );
		$this->assertEquals( 'pending', $this->state_manager->getStatus( $job_id )['status'] );

		// Transition to running.
		$this->state_manager->transitionTo( $job_id, 'processing', 'Processing data' );
		$status = $this->state_manager->getStatus( $job_id );
		$this->assertEquals( 'running', $status['status'] );
		$this->assertEquals( 'processing', $status['currentStep'] );

		// Complete job.
		$this->state_manager->markComplete( $job_id, 'Job completed successfully' );
		$status = $this->state_manager->getStatus( $job_id );
		$this->assertEquals( 'complete', $status['status'] );
	}

	/**
	 * Test job can be marked as failed.
	 */
	public function test_job_can_be_marked_failed() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->state_manager->updateStatus( $job_id, [ 'status' => 'running' ] );

		// Mark job as failed.
		$this->state_manager->markFailed( $job_id, 'Upload failed: Connection timeout', 'upload' );

		$status = $this->state_manager->getStatus( $job_id );

		$this->assertEquals( 'failed', $status['status'] );
		$this->assertEquals( 'Upload failed: Connection timeout', $status['message'] );
		$this->assertEquals( 'upload', $status['currentStep'] );
	}

	/**
	 * Test completed job has final state.
	 */
	public function test_completed_job_final_state() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->state_manager->updateStatus( $job_id, [ 'status' => 'running' ] );
		$this->state_manager->markComplete( $job_id );

		$status = $this->state_manager->getStatus( $job_id );

		$this->assertEquals( 'complete', $status['status'] );
		$this->assertArrayHasKey( 'message', $status );
	}

	// ========================================================================
	// Step Execution Tests
	// ========================================================================

	/**
	 * Test steps can be executed in order.
	 */
	public function test_steps_execute_in_order() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->state_manager->updateStatus( $job_id, [ 'status' => 'pending' ] );

		// Step 1.
		$this->state_manager->transitionTo( $job_id, 'step1', 'Step 1' );
		$this->assertEquals( 'step1', $this->state_manager->getStatus( $job_id )['currentStep'] );

		// Step 2.
		$this->state_manager->transitionTo( $job_id, 'step2', 'Step 2' );
		$this->assertEquals( 'step2', $this->state_manager->getStatus( $job_id )['currentStep'] );

		// Step 3.
		$this->state_manager->transitionTo( $job_id, 'step3', 'Step 3' );
		$this->assertEquals( 'step3', $this->state_manager->getStatus( $job_id )['currentStep'] );
	}

	/**
	 * Test step failure records error.
	 */
	public function test_step_failure_records_error() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->state_manager->updateStatus( $job_id, [ 'status' => 'running' ] );

		// Simulate step failure.
		$this->state_manager->markFailed( $job_id, 'Database export failed', 'export_database' );

		$status = $this->state_manager->getStatus( $job_id );

		$this->assertEquals( 'failed', $status['status'] );
		$this->assertEquals( 'export_database', $status['currentStep'] );
		$this->assertStringContainsString( 'Database export failed', $status['message'] );
	}

	/**
	 * Test retry logic works for transient failures.
	 */
	public function test_retry_logic_for_transient_failures() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->state_manager->updateStatus(
			$job_id,
			[
				'status'      => 'running',
				'stepRetries' => [],
			]
		);

		// First retry attempt.
		$retry1 = $this->state_manager->incrementRetry( $job_id, 'upload', 3 );
		$this->assertTrue( $retry1['shouldRetry'] );
		$this->assertEquals( 1, $retry1['retryCount'] );

		// Second retry attempt.
		$retry2 = $this->state_manager->incrementRetry( $job_id, 'upload', 3 );
		$this->assertTrue( $retry2['shouldRetry'] );
		$this->assertEquals( 2, $retry2['retryCount'] );

		// Third retry attempt.
		$retry3 = $this->state_manager->incrementRetry( $job_id, 'upload', 3 );
		$this->assertTrue( $retry3['shouldRetry'] );
		$this->assertEquals( 3, $retry3['retryCount'] );

		// Fourth attempt should not retry (exceeded max).
		$retry4 = $this->state_manager->incrementRetry( $job_id, 'upload', 3 );
		$this->assertFalse( $retry4['shouldRetry'] );
	}

	// ========================================================================
	// Provider Integration Tests
	// ========================================================================

	/**
	 * Test publish can find enabled provider instance.
	 */
	public function test_publish_finds_enabled_provider() {
		// Set up enabled provider.
		$settings = [
			'providers' => [
				'local-filesystem:test-uuid' => [
					'enabled'          => true,
					'deployment_types' => [ 'static_site' ],
					'path'             => '/test/path',
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType( 'static_site' );

		$this->assertNotNull( $instance );
		$this->assertEquals( 'local-filesystem:test-uuid', $instance['instanceId'] );
	}

	/**
	 * Test publish handles missing provider gracefully.
	 */
	public function test_publish_handles_missing_provider() {
		// Clear all provider configs.
		update_option( 'aether_site_exporter_settings', [] );

		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType( 'static_site' );

		$this->assertNull( $instance, 'Should return null when no enabled provider found' );
	}

	/**
	 * Test publish validates deployment type.
	 */
	public function test_publish_validates_deployment_type() {
		$settings = [
			'providers' => [
				'local-filesystem:test-uuid' => [
					'enabled'          => true,
					'deployment_types' => [ 'blueprint_bundle' ], // Only blueprint, not static.
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType( 'static_site' );

		$this->assertNull( $instance, 'Should return null when provider does not support deployment type' );
	}

	// ========================================================================
	// Job Persistence Tests
	// ========================================================================

	/**
	 * Test job status persists across requests.
	 */
	public function test_job_status_persists() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->state_manager->updateStatus(
			$job_id,
			[
				'status'      => 'running',
				'currentStep' => 'upload',
				'progress'    => 50,
			]
		);

		// Create new manager to simulate new request.
		$new_manager = new JobStateManager();
		$status      = $new_manager->getStatus( $job_id );

		$this->assertEquals( 'running', $status['status'] );
		$this->assertEquals( 'upload', $status['currentStep'] );
		$this->assertEquals( 50, $status['progress'] );
	}

	/**
	 * Test getAllJobs returns all jobs.
	 */
	public function test_get_all_jobs() {
		// Create multiple jobs.
		for ( $i = 1; $i <= 3; $i++ ) {
			$this->state_manager->updateStatus(
				"aether_test_job_{$i}",
				[
					'status'  => 'pending',
					'message' => "Job {$i}",
				]
			);
		}

		$jobs = $this->state_manager->getAllJobs();

		$this->assertGreaterThanOrEqual( 3, count( $jobs ) );
	}
}
