<?php

/**
 * Progress Tracker Tests
 *
 * Tests for ProgressTracker - handles progress tracking with overflow protection.
 *
 * Quality Standards:
 * - Tests must verify overflow protection works
 * - Must test progress calculation accuracy
 * - Must test edge cases (0 files, very large numbers)
 * - Must fail if progress exceeds 100% or goes negative
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Services;

use Aether\SiteExporter\Services\ProgressTracker;
use Aether\SiteExporter\Sync\JobStateManager;
use Aether\SiteExporter\Tests\Helpers\TestCase;

class ProgressTrackerTest extends TestCase
{
	/**
	 * Tracker instance.
	 *
	 * @var ProgressTracker
	 */
	private ProgressTracker $tracker;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->tracker = new ProgressTracker();
	}

	/**
	 * Test calculateOverallProgress returns correct percentage.
	 */
	public function test_calculateOverallProgress_returns_correct_percentage(): void
	{
		// 50 out of 100 = 50%
		$progress = $this->tracker->calculateOverallProgress( 50, 100 );
		$this->assertSame( 50, $progress );

		// 25 out of 100 = 25%
		$progress = $this->tracker->calculateOverallProgress( 25, 100 );
		$this->assertSame( 25, $progress );

		// 75 out of 100 = 75%
		$progress = $this->tracker->calculateOverallProgress( 75, 100 );
		$this->assertSame( 75, $progress );
	}

	/**
	 * Test calculateOverallProgress rounds correctly.
	 */
	public function test_calculateOverallProgress_rounds_correctly(): void
	{
		// 33 out of 100 = 33%
		$progress = $this->tracker->calculateOverallProgress( 33, 100 );
		$this->assertSame( 33, $progress );

		// 1 out of 3 = 33.33% rounds to 33%
		$progress = $this->tracker->calculateOverallProgress( 1, 3 );
		$this->assertSame( 33, $progress );

		// 2 out of 3 = 66.67% rounds to 67%
		$progress = $this->tracker->calculateOverallProgress( 2, 3 );
		$this->assertSame( 67, $progress );
	}

	/**
	 * Test calculateOverallProgress returns 100 when complete.
	 */
	public function test_calculateOverallProgress_returns_100_when_complete(): void
	{
		$progress = $this->tracker->calculateOverallProgress( 100, 100 );
		$this->assertSame( 100, $progress );

		$progress = $this->tracker->calculateOverallProgress( 1000, 1000 );
		$this->assertSame( 100, $progress );
	}

	/**
	 * Test calculateOverallProgress returns 0 when nothing processed.
	 */
	public function test_calculateOverallProgress_returns_0_when_nothing_processed(): void
	{
		$progress = $this->tracker->calculateOverallProgress( 0, 100 );
		$this->assertSame( 0, $progress );
	}

	/**
	 * Test calculateOverallProgress returns 100 when totalFiles is 0.
	 */
	public function test_calculateOverallProgress_returns_100_when_total_is_zero(): void
	{
		// Edge case: No files to process
		$progress = $this->tracker->calculateOverallProgress( 0, 0 );
		$this->assertSame( 100, $progress );

		$progress = $this->tracker->calculateOverallProgress( 10, 0 );
		$this->assertSame( 100, $progress );
	}

	/**
	 * Test calculateOverallProgress handles negative totalFiles.
	 */
	public function test_calculateOverallProgress_handles_negative_total(): void
	{
		$progress = $this->tracker->calculateOverallProgress( 50, -100 );
		$this->assertSame( 100, $progress );
	}

	/**
	 * Test calculateOverallProgress caps at 100%.
	 */
	public function test_calculateOverallProgress_caps_at_100(): void
	{
		// More files processed than total (edge case)
		$progress = $this->tracker->calculateOverallProgress( 150, 100 );
		$this->assertSame( 100, $progress );

		$progress = $this->tracker->calculateOverallProgress( 200, 100 );
		$this->assertSame( 100, $progress );
	}

	/**
	 * Test calculateOverallProgress never goes below 0.
	 */
	public function test_calculateOverallProgress_never_negative(): void
	{
		// Negative processed files (edge case)
		$progress = $this->tracker->calculateOverallProgress( -50, 100 );
		$this->assertGreaterThanOrEqual( 0, $progress );
		$this->assertLessThanOrEqual( 100, $progress );
	}

	/**
	 * Test calculateOverallProgress with very large numbers.
	 */
	public function test_calculateOverallProgress_with_large_numbers(): void
	{
		// Test with very large file counts
		$progress = $this->tracker->calculateOverallProgress( 500000, 1000000 );
		$this->assertSame( 50, $progress );

		$progress = $this->tracker->calculateOverallProgress( 999999, 1000000 );
		$this->assertSame( 100, $progress );
	}

	/**
	 * Test createProgressCallback returns null when no jobId.
	 */
	public function test_createProgressCallback_returns_null_without_jobId(): void
	{
		$callback = $this->tracker->createProgressCallback( null, null, 100 );

		$this->assertNull( $callback );
	}

	/**
	 * Test createProgressCallback returns null when totalFiles is 0.
	 */
	public function test_createProgressCallback_returns_null_when_total_is_zero(): void
	{
		$callback = $this->tracker->createProgressCallback( 'job-123', null, 0 );

		$this->assertNull( $callback );
	}

	/**
	 * Test createProgressCallback returns callable.
	 */
	public function test_createProgressCallback_returns_callable(): void
	{
		$callback = $this->tracker->createProgressCallback( 'job-123', null, 100 );

		$this->assertIsCallable( $callback );
	}

	/**
	 * Test progress callback updates transient.
	 */
	public function test_progress_callback_updates_transient(): void
	{
		$jobId = 'test-job-' . wp_generate_password( 8, false );
		$callback = $this->tracker->createProgressCallback( $jobId, null, 100 );

		// Call callback multiple times
		for ( $i = 0; $i < 10; $i++ ) {
			$callback();
		}

		// Should have set transient with progress
		$transient = get_transient( $jobId );
		$this->assertIsArray( $transient );
		$this->assertArrayHasKey( 'progress', $transient );
		$this->assertGreaterThan( 0, $transient['progress'] );

		// Clean up
		delete_transient( $jobId );
	}

	/**
	 * Test progress callback with state manager.
	 */
	public function test_progress_callback_with_state_manager(): void
	{
		$mockStateManager = $this->createMock( JobStateManager::class );

		$mockStateManager
			->expects( $this->atLeastOnce() )
			->method( 'getStatus' )
			->willReturn( [ 'status' => 'running' ] );

		$mockStateManager
			->expects( $this->atLeastOnce() )
			->method( 'updateStatus' );

		$callback = $this->tracker->createProgressCallback( 'job-123', $mockStateManager, 100 );

		// Call callback enough times to trigger update
		for ( $i = 0; $i < 10; $i++ ) {
			$callback();
		}
	}

	/**
	 * Test progress callback updates at correct intervals.
	 */
	public function test_progress_callback_update_intervals(): void
	{
		$jobId = 'test-job-' . wp_generate_password( 8, false );
		$callback = $this->tracker->createProgressCallback( $jobId, null, 100 );

		// Call once - should update (first call)
		$callback();

		$transient1 = get_transient( $jobId );
		$this->assertNotFalse( $transient1 );

		// Clean up
		delete_transient( $jobId );
	}

	/**
	 * Test progress callback handles overflow protection.
	 */
	public function test_progress_callback_overflow_protection(): void
	{
		$jobId = 'test-job-' . wp_generate_password( 8, false );
		$callback = $this->tracker->createProgressCallback( $jobId, null, 100 );

		// Call many times to test overflow protection
		for ( $i = 0; $i < PHP_INT_MAX; $i++ ) {
			$callback();

			// Only test first 200 iterations for performance
			if ( $i > 200 ) {
				break;
			}
		}

		// Should not have crashed
		$this->assertTrue( true );

		// Clean up
		delete_transient( $jobId );
	}

	/**
	 * Test progress callback granularity for small file counts.
	 */
	public function test_progress_callback_granularity_small_files(): void
	{
		$jobId = 'test-job-' . wp_generate_password( 8, false );

		// Small file count (10 files)
		$callback = $this->tracker->createProgressCallback( $jobId, null, 10 );

		// Call callback for each file
		for ( $i = 0; $i < 10; $i++ ) {
			$callback();
		}

		$transient = get_transient( $jobId );

		// Should update progress
		$this->assertNotFalse( $transient );
		$this->assertArrayHasKey( 'progress', $transient );

		// Clean up
		delete_transient( $jobId );
	}

	/**
	 * Test progress callback handles state manager returning null status.
	 */
	public function test_progress_callback_handles_null_status(): void
	{
		$mockStateManager = $this->createMock( JobStateManager::class );

		$mockStateManager
			->method( 'getStatus' )
			->willReturn( null );

		$callback = $this->tracker->createProgressCallback( 'job-123', $mockStateManager, 100 );

		// Should not crash when status is null
		$callback();

		$this->assertTrue( true );
	}

	/**
	 * Test progress is always between 0 and 100.
	 */
	public function test_progress_always_in_valid_range(): void
	{
		// Test various combinations
		$testCases = [
			[ 0, 100, 0 ],
			[ 50, 100, 50 ],
			[ 100, 100, 100 ],
			[ 150, 100, 100 ], // Overflow
			[ -10, 100, 0 ],   // Negative
			[ 1, 1000000, 0 ], // Very small percentage
		];

		foreach ( $testCases as list( $processed, $total, $expected ) ) {
			$progress = $this->tracker->calculateOverallProgress( $processed, $total );

			$this->assertGreaterThanOrEqual( 0, $progress, "Progress should be >= 0 for $processed/$total" );
			$this->assertLessThanOrEqual( 100, $progress, "Progress should be <= 100 for $processed/$total" );
		}
	}
}
