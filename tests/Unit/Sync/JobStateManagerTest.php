<?php
/**
 * JobStateManager Tests
 *
 * Tests for job state management including race condition handling.
 * Critical for ensuring job state consistency under concurrent access.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Sync;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Sync\JobStateManager;

/**
 * JobStateManager test case.
 */
class JobStateManagerTest extends TestCase {
	/**
	 * JobStateManager instance.
	 *
	 * @var JobStateManager
	 */
	private $manager;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->manager = new JobStateManager();
	}

	// ========================================================================
	// Basic State Management Tests
	// ========================================================================

	/**
	 * Test that a job starts with the status we set.
	 */
	public function test_job_starts_with_initial_status() {
		$job_id = 'test-job-' . wp_generate_uuid4();
		$status = [
			'status'      => 'pending',
			'currentStep' => 'init',
			'message'     => 'Job created',
		];

		$result = $this->manager->updateStatus( $job_id, $status );
		$this->assertTrue( $result, 'Initial status should be set successfully' );

		$retrieved = $this->manager->getStatus( $job_id );
		$this->assertEquals( $status, $retrieved, 'Retrieved status should match set status' );
	}

	/**
	 * Test that job status persists across requests (via transients).
	 */
	public function test_job_status_persists() {
		$job_id = 'test-job-' . wp_generate_uuid4();
		$status = [
			'status'  => 'running',
			'message' => 'Processing',
		];

		$this->manager->updateStatus( $job_id, $status );

		// Create new manager instance to simulate new request.
		$new_manager = new JobStateManager();
		$retrieved   = $new_manager->getStatus( $job_id );

		$this->assertEquals( $status, $retrieved, 'Status should persist across manager instances' );
	}

	/**
	 * Test getting status for non-existent job.
	 */
	public function test_get_status_nonexistent_job() {
		$result = $this->manager->getStatus( 'nonexistent-job-id' );

		$this->assertFalse( $result, 'Non-existent job should return false' );
	}

	/**
	 * Test deleting job status.
	 */
	public function test_delete_status() {
		$job_id = 'test-job-' . wp_generate_uuid4();
		$status = [ 'status' => 'pending' ];

		$this->manager->updateStatus( $job_id, $status );
		$this->assertNotFalse( $this->manager->getStatus( $job_id ) );

		$deleted = $this->manager->deleteStatus( $job_id );
		$this->assertTrue( $deleted, 'Delete should succeed' );

		$this->assertFalse( $this->manager->getStatus( $job_id ), 'Status should be deleted' );
	}

	// ========================================================================
	// State Transition Tests
	// ========================================================================

	/**
	 * Test valid state transition.
	 */
	public function test_valid_state_transition() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		// Create initial status.
		$this->manager->updateStatus(
			$job_id,
			[
				'status'      => 'pending',
				'currentStep' => 'init',
			]
		);

		// Transition to next step.
		$result = $this->manager->transitionTo( $job_id, 'step2', 'Processing step 2' );
		$this->assertTrue( $result, 'Transition should succeed' );

		$status = $this->manager->getStatus( $job_id );
		$this->assertEquals( 'running', $status['status'] );
		$this->assertEquals( 'step2', $status['currentStep'] );
		$this->assertEquals( 'Processing step 2', $status['message'] );
	}

	/**
	 * Test transition preserves extra data.
	 */
	public function test_transition_preserves_extra_data() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus(
			$job_id,
			[
				'status'     => 'pending',
				'customData' => 'preserved',
			]
		);

		$this->manager->transitionTo( $job_id, 'step2', 'Message' );

		$status = $this->manager->getStatus( $job_id );
		$this->assertEquals( 'preserved', $status['customData'], 'Custom data should be preserved during transition' );
	}

	/**
	 * Test transition with extra data merge.
	 */
	public function test_transition_with_extra_data() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus( $job_id, [ 'status' => 'pending' ] );

		$this->manager->transitionTo(
			$job_id,
			'upload',
			'Uploading files',
			[ 'uploadProgress' => 50 ]
		);

		$status = $this->manager->getStatus( $job_id );
		$this->assertEquals( 50, $status['uploadProgress'] );
	}

	/**
	 * Test transition fails for non-existent job.
	 */
	public function test_transition_fails_nonexistent_job() {
		$result = $this->manager->transitionTo( 'nonexistent', 'step', 'message' );

		$this->assertFalse( $result, 'Transition should fail for non-existent job' );
	}

	// ========================================================================
	// Job Completion Tests
	// ========================================================================

	/**
	 * Test marking job as complete.
	 */
	public function test_mark_complete() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus( $job_id, [ 'status' => 'running' ] );

		$result = $this->manager->markComplete( $job_id, 'Success!' );
		$this->assertTrue( $result );

		$status = $this->manager->getStatus( $job_id );
		$this->assertEquals( 'complete', $status['status'] );
		$this->assertEquals( 'Success!', $status['message'] );
	}

	/**
	 * Test marking job as complete with default message.
	 */
	public function test_mark_complete_default_message() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus( $job_id, [ 'status' => 'running' ] );
		$this->manager->markComplete( $job_id );

		$status = $this->manager->getStatus( $job_id );
		$this->assertNotEmpty( $status['message'], 'Should have default message' );
	}

	/**
	 * Test marking job as failed.
	 */
	public function test_mark_failed() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus( $job_id, [ 'status' => 'running' ] );

		$result = $this->manager->markFailed( $job_id, 'Upload failed', 'upload_step' );
		$this->assertTrue( $result );

		$status = $this->manager->getStatus( $job_id );
		$this->assertEquals( 'failed', $status['status'] );
		$this->assertEquals( 'Upload failed', $status['message'] );
		$this->assertEquals( 'upload_step', $status['currentStep'] );
	}

	/**
	 * Test marking failed without current step.
	 */
	public function test_mark_failed_without_step() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus( $job_id, [ 'status' => 'running' ] );
		$this->manager->markFailed( $job_id, 'Error occurred' );

		$status = $this->manager->getStatus( $job_id );
		$this->assertEquals( 'failed', $status['status'] );
		$this->assertArrayNotHasKey( 'currentStep', $status );
	}

	// ========================================================================
	// Retry Logic Tests
	// ========================================================================

	/**
	 * Test shouldRetry logic.
	 */
	public function test_should_retry_logic() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		// Initial state - should retry.
		$this->manager->updateStatus(
			$job_id,
			[
				'status'      => 'running',
				'stepRetries' => [],
			]
		);

		$should_retry = $this->manager->shouldRetry( $job_id, 'upload', 2 );
		$this->assertTrue( $should_retry, 'Should retry when no previous retries' );

		// After 1 retry - should still retry.
		$this->manager->updateStatus(
			$job_id,
			[
				'status'      => 'running',
				'stepRetries' => [ 'upload' => 1 ],
			]
		);

		$should_retry = $this->manager->shouldRetry( $job_id, 'upload', 2 );
		$this->assertTrue( $should_retry, 'Should retry when retries < max' );

		// After 2 retries - should not retry.
		$this->manager->updateStatus(
			$job_id,
			[
				'status'      => 'running',
				'stepRetries' => [ 'upload' => 2 ],
			]
		);

		$should_retry = $this->manager->shouldRetry( $job_id, 'upload', 2 );
		$this->assertFalse( $should_retry, 'Should not retry when retries >= max' );
	}

	/**
	 * Test retry logic for non-existent job.
	 */
	public function test_should_retry_nonexistent_job() {
		$result = $this->manager->shouldRetry( 'nonexistent', 'step', 2 );

		$this->assertFalse( $result, 'Should not retry non-existent job' );
	}

	/**
	 * Test incrementRetry returns correct values.
	 *
	 * Note: incrementRetry uses compare-and-swap in the database directly.
	 * We test the return values which indicate the operation result.
	 */
	public function test_increment_retry_returns_correct_values() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus(
			$job_id,
			[
				'status'      => 'running',
				'stepRetries' => [],
			]
		);

		// First increment.
		$result = $this->manager->incrementRetry( $job_id, 'upload', 2 );

		$this->assertIsArray( $result, 'Should return array' );
		$this->assertArrayHasKey( 'shouldRetry', $result );
		$this->assertArrayHasKey( 'retryCount', $result );
		$this->assertTrue( $result['shouldRetry'], 'Should retry after first increment' );
		$this->assertEquals( 1, $result['retryCount'], 'Retry count should be 1' );
	}

	/**
	 * Test incrementRetry stops after max retries.
	 */
	public function test_increment_retry_exhausts_retries() {
		$job_id = 'test-job-' . wp_generate_uuid4();

		$this->manager->updateStatus(
			$job_id,
			[
				'status'      => 'running',
				'stepRetries' => [],
			]
		);

		// First increment.
		$result = $this->manager->incrementRetry( $job_id, 'upload', 2 );
		$this->assertTrue( $result['shouldRetry'] );

		// Second increment.
		$result = $this->manager->incrementRetry( $job_id, 'upload', 2 );
		$this->assertTrue( $result['shouldRetry'] );

		// Third increment - should exceed max.
		$result = $this->manager->incrementRetry( $job_id, 'upload', 2 );
		$this->assertFalse( $result['shouldRetry'], 'Should not retry after exceeding max' );
		$this->assertEquals( 3, $result['retryCount'] );
	}

	/**
	 * Test incrementRetry for non-existent job.
	 */
	public function test_increment_retry_nonexistent_job() {
		$result = $this->manager->incrementRetry( 'nonexistent', 'step', 2 );

		$this->assertFalse( $result['shouldRetry'] );
		$this->assertEquals( 0, $result['retryCount'] );
	}

	// ========================================================================
	// getAllJobs Tests
	// ========================================================================

	/**
	 * Test getAllJobs returns jobs.
	 */
	public function test_get_all_jobs() {
		// Create multiple jobs.
		$job_ids = [
			'aether_job_1',
			'aether_job_2',
			'aether_job_3',
		];

		foreach ( $job_ids as $job_id ) {
			$this->manager->updateStatus(
				$job_id,
				[
					'status'  => 'pending',
					'message' => "Job {$job_id}",
				]
			);
		}

		$jobs = $this->manager->getAllJobs();

		$this->assertGreaterThanOrEqual( 3, count( $jobs ), 'Should return at least 3 jobs' );

		// Verify job structure.
		foreach ( $jobs as $job ) {
			$this->assertArrayHasKey( 'jobId', $job );
			$this->assertArrayHasKey( 'status', $job );
		}
	}

	/**
	 * Test getAllJobs with limit.
	 */
	public function test_get_all_jobs_with_limit() {
		// Create jobs.
		for ( $i = 1; $i <= 5; $i++ ) {
			$this->manager->updateStatus(
				"aether_test_{$i}",
				[ 'status' => 'pending' ]
			);
		}

		$jobs = $this->manager->getAllJobs( 3 );

		$this->assertLessThanOrEqual( 3, count( $jobs ), 'Should respect limit parameter' );
	}

	/**
	 * Test getAllJobs with invalid limit.
	 */
	public function test_get_all_jobs_invalid_limit() {
		$this->manager->updateStatus( 'aether_test_1', [ 'status' => 'pending' ] );

		// Negative limit should be ignored.
		$jobs = $this->manager->getAllJobs( -1 );
		$this->assertIsArray( $jobs );

		// Zero limit should be ignored.
		$jobs = $this->manager->getAllJobs( 0 );
		$this->assertIsArray( $jobs );
	}

	// ========================================================================
	// JSON Security Tests
	// ========================================================================

	/**
	 * Test that JSON encoding/decoding is used (not serialization).
	 *
	 * This prevents object injection attacks.
	 */
	public function test_uses_json_not_serialization() {
		$job_id = 'test-job-' . wp_generate_uuid4();
		$status = [
			'status'  => 'running',
			'message' => 'Test',
		];

		$this->manager->updateStatus( $job_id, $status );

		// Get the raw transient value.
		$raw_value = get_transient( $job_id );

		// Should be JSON string, not serialized PHP.
		$this->assertIsString( $raw_value );
		$this->assertStringStartsNotWith( 'a:', $raw_value, 'Should not be serialized (starts with a:)' );
		$this->assertStringStartsNotWith( 'O:', $raw_value, 'Should not be serialized object (starts with O:)' );

		// Should be valid JSON.
		$decoded = json_decode( $raw_value, true );
		$this->assertIsArray( $decoded );
		$this->assertEquals( $status, $decoded );
	}
}
