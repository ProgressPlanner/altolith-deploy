<?php

/**
 * Progress Tracker Service
 *
 * Handles progress tracking for export operations.
 *
 * @package Aether\Services
 */

namespace Aether\SiteExporter\Services;

use Aether\SiteExporter\Sync\JobStateManager;

\defined('ABSPATH') || exit;

/**
 * Progress tracker service.
 */
class ProgressTracker
{
	/**
	 * Calculate overall progress percentage.
	 *
	 * @param int $filesProcessed Files processed so far.
	 * @param int $totalFiles      Total files expected.
	 * @return int Overall progress (0-100).
	 */
	public function calculateOverallProgress(int $filesProcessed, int $totalFiles): int
	{
		if ($totalFiles <= 0) {
			return 100;
		}

		$progress = (int) \round(($filesProcessed / $totalFiles) * 100);
		return \min(100, \max(0, $progress));
	}

	/**
	 * Create a progress callback for file operations.
	 *
	 * @param string|null          $jobId        Optional job ID for progress tracking.
	 * @param JobStateManager|null $stateManager Optional state manager for progress updates.
	 * @param int                  $totalFiles   Total number of files to process.
	 * @return callable|null Progress callback function or null if no tracking needed.
	 */
	public function createProgressCallback(?string $jobId, ?JobStateManager $stateManager, int $totalFiles): ?callable
	{
		if (! $jobId || $totalFiles <= 0) {
			return null;
		}

		$processedFiles = 0;

		return function () use ($jobId, $stateManager, $totalFiles, &$processedFiles) {
			// Prevent integer overflow: use PHP_INT_MAX for portability across systems
			if ($processedFiles < PHP_INT_MAX) {
				$processedFiles++;
			} else {
				// Log warning if maximum integer value is exceeded
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log('Aether: File count exceeded maximum integer value');
				}
			}

			// Update progress more granularly for better UX, especially for small file counts
			// Update every N files OR every 1% (whichever is more frequent)
			// Use float division to prevent overflow
			// $updateInterval is always >= 1 due to max(1, ...)
			$updateInterval = \max(1, (int) \floor((float) $totalFiles / 100.0));

			// Prevent modulo by zero and handle overflow in modulo operation
			if ($processedFiles % $updateInterval === 0) {
				// Use float math to prevent integer overflow on large file counts
				// Cast to float before division to ensure accurate calculation
				$progressFloat = \min(100.0, ((float) $processedFiles / (float) $totalFiles) * 100.0);
				$progress = (int) \round($progressFloat);

				// Overflow protection: clamp to valid range
				if ($progress < 0 || $progress > 100) {
					$progress = \min(100, \max(0, $progress));
				}

				// Use JobStateManager if provided (job tracking).
				if ($stateManager) {
					$status = $stateManager->getStatus($jobId);
					if ($status) {
						$status['createBlueprintBundle_progress'] = $progress;
						$stateManager->updateStatus($jobId, $status);
					}
				} else {
					// Use simple transient for stateless progress tracking.
					\set_transient($jobId, ['progress' => $progress], 1800);
				}
			}
		};
	}

	/**
	 * Update progress to 100% (completion).
	 *
	 * @param string|null          $jobId        Optional job ID for progress tracking.
	 * @param JobStateManager|null $stateManager Optional state manager for progress updates.
	 * @return void
	 */
	public function markComplete(?string $jobId, ?JobStateManager $stateManager): void
	{
		if (! $jobId) {
			return;
		}

		if ($stateManager) {
			$status = $stateManager->getStatus($jobId);
			if ($status) {
				$status['createBlueprintBundle_progress'] = 100;
				$stateManager->updateStatus($jobId, $status);
			}
		} else {
			\set_transient($jobId, ['progress' => 100], 1800);
		}
	}
}
