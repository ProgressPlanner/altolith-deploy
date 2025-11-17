<?php

/**
 * Job State Manager
 *
 * Handles transient get/set operations and state transitions for publish jobs.
 *
 * @package Aether\Sync
 */

namespace Aether\SiteExporter\Sync;

\defined('ABSPATH') || exit;

/**
 * Manages publish job state via WordPress transients.
 */
class JobStateManager
{
	/**
	 * Transient expiration time (30 minutes).
	 *
	 * Increased to accommodate large file uploads via browser.
	 *
	 * @var int
	 */
	const TRANSIENT_EXPIRATION = 1800;

	/**
	 * Get job status from transient.
	 *
	 * @param string $jobId Job ID.
	 * @return array<string, mixed>|false Job status array or false if not found.
	 */
	public function getStatus(string $jobId)
	{
		return \get_transient($jobId);
	}

	/**
	 * Update job status in transient.
	 *
	 * @param string               $jobId Job ID.
	 * @param array<string, mixed> $status Status array.
	 * @return bool True on success, false on failure.
	 */
	public function updateStatus(string $jobId, array $status): bool
	{
		$result = \set_transient($jobId, $status, self::TRANSIENT_EXPIRATION);

		// set_transient() returns false both for failure AND when value hasn't changed
		// Check current value to distinguish between real failure vs. unchanged value
		if (false === $result) {
			$currentValue = \get_transient($jobId);
			// If current value matches new value, treat as success (value unchanged)
			// Use JSON-based hash comparison to avoid PHP object injection vulnerabilities
			// json_encode() is safer than serialize() as it cannot deserialize objects
			// This prevents ['status' => '0'] from matching ['status' => false]
			if (\is_array($currentValue)) {
				$currentJson = \wp_json_encode($currentValue, \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE);
				$statusJson = \wp_json_encode($status, \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE);
				if (false !== $currentJson && false !== $statusJson && \hash_equals(\md5($currentJson), \md5($statusJson))) {
					return true;
				}
			}
			// Otherwise it's a real failure
			return false;
		}

		return true;
	}

	/**
	 * Delete job status transient.
	 *
	 * @param string $jobId Job ID.
	 * @return bool True on success, false on failure.
	 */
	public function deleteStatus(string $jobId): bool
	{
		return \delete_transient($jobId);
	}

	/**
	 * Transition to next step.
	 *
	 * @param string               $jobId      Job ID.
	 * @param string               $nextStep   Next step identifier.
	 * @param string               $message     Status message.
	 * @param array<string, mixed> $extraData  Optional extra data to merge.
	 * @return bool True on success, false on failure.
	 */
	public function transitionTo(string $jobId, string $nextStep, string $message, array $extraData = []): bool
	{
		$currentStatus = $this->getStatus($jobId);

		if (false === $currentStatus) {
			return false;
		}

		$newStatus = \array_merge(
			$currentStatus,
			[
				'status'       => 'running',
				'currentStep' => $nextStep,
				'message'      => $message,
			],
			$extraData
		);

		return $this->updateStatus($jobId, $newStatus);
	}

	/**
	 * Mark job as complete.
	 *
	 * @param string $jobId Job ID.
	 * @param string $message Success message.
	 * @return bool True on success, false on failure.
	 */
	public function markComplete(string $jobId, string $message = ''): bool
	{
		if (empty($message)) {
			$message = \__('Site published successfully!', 'aether-site-exporter');
		}

		return $this->updateStatus(
			$jobId,
			[
				'status'  => 'complete',
				'message' => $message,
			]
		);
	}

	/**
	 * Mark job as failed.
	 *
	 * @param string $jobId       Job ID.
	 * @param string $errorMessage Error message.
	 * @param string $currentStep  Step that failed (optional).
	 * @return bool True on success, false on failure.
	 */
	public function markFailed(string $jobId, string $errorMessage, string $currentStep = ''): bool
	{
		$status = [
			'status'  => 'failed',
			'message' => $errorMessage,
		];

		if (! empty($currentStep)) {
			$status['currentStep'] = $currentStep;
		}

		return $this->updateStatus($jobId, $status);
	}

	/**
	 * Increment retry counter for a step using compare-and-swap pattern.
	 *
	 * Uses optimistic locking with retry logic to prevent race conditions.
	 * This is more reliable than transient-based locks which aren't atomic.
	 *
	 * Note: While this implementation uses compare-and-swap with retry logic and exponential
	 * backoff, it's not completely race-condition free. Under high concurrency, there's a small
	 * chance that two processes could read the same value and both succeed in updating. However,
	 * the retry mechanism with exponential backoff significantly mitigates this risk, and for
	 * most use cases, this implementation is sufficient.
	 *
	 * @param string $jobId      Job ID.
	 * @param string $stepName   Step identifier.
	 * @param int    $maxRetries Maximum retries allowed.
	 * @return array{shouldRetry: bool, retryCount: int} Retry decision and count.
	 */
	public function incrementRetry(string $jobId, string $stepName, int $maxRetries = 2): array
	{
		global $wpdb;

		$maxCASAttempts = 10;
		$casAttempt = 0;

		// Use compare-and-swap pattern with retry logic
		while ($casAttempt < $maxCASAttempts) {
			// Read current value
			$optionName = "_transient_{$jobId}";
			$currentValue = $wpdb->get_var($wpdb->prepare(
				"SELECT option_value FROM `{$wpdb->options}` WHERE option_name = %s",
				$optionName
			));

			if (null === $currentValue) {
				return [
					'shouldRetry' => false,
					'retryCount'  => 0,
				];
			}

			$status = \maybe_unserialize($currentValue);
			if (!is_array($status)) {
				return [
					'shouldRetry' => false,
					'retryCount'  => 0,
				];
			}

			// Calculate new retry count
			$stepRetries = $status['stepRetries'] ?? [];
			$oldRetryCount = $stepRetries[$stepName] ?? 0;
			$newRetryCount = $oldRetryCount + 1;

			// Update status array
			$stepRetries[$stepName] = $newRetryCount;
			$status['stepRetries'] = $stepRetries;
			$newValue = \maybe_serialize($status);

			// Attempt atomic update using WHERE clause to check old value
			// This is the compare-and-swap operation
			$updated = $wpdb->update(
				$wpdb->options,
				['option_value' => $newValue],
				[
					'option_name' => $optionName,
					'option_value' => $currentValue  // Only update if value hasn't changed
				],
				['%s'],
				['%s', '%s']
			);

			// If update succeeded (affected 1 row), we won the race
			if (1 === $updated) {
				return [
					'shouldRetry' => $newRetryCount <= $maxRetries,
					'retryCount'  => $newRetryCount,
				];
			}

			// Update failed, value changed between read and write
			// Retry with exponential backoff
			$casAttempt++;
			if ($casAttempt < $maxCASAttempts) {
				\usleep(50000 * (2 ** min($casAttempt, 4))); // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
			}
		}

		// Failed to increment after max attempts
		// Return current state without incrementing
		$status = $this->getStatus($jobId);
		if (false === $status) {
			return [
				'shouldRetry' => false,
				'retryCount'  => 0,
			];
		}

		$stepRetries = $status['stepRetries'] ?? [];
		$retryCount = $stepRetries[$stepName] ?? 0;
		return [
			'shouldRetry' => $retryCount <= $maxRetries,
			'retryCount'  => $retryCount,
		];
	}

	/**
	 * Check if job should be retried after error.
	 *
	 * @param string $jobId      Job ID.
	 * @param string $stepName   Step identifier.
	 * @param int    $maxRetries Maximum retries allowed.
	 * @return bool True if should retry, false otherwise.
	 */
	public function shouldRetry(string $jobId, string $stepName, int $maxRetries = 2): bool
	{
		$status = $this->getStatus($jobId);

		if (false === $status) {
			return false;
		}

		$stepRetries = $status['stepRetries'] ?? [];
		$retryCount  = $stepRetries[ $stepName ] ?? 0;

		return $retryCount < $maxRetries;
	}

	/**
	 * Get all jobs, sorted by most recent first.
	 *
	 * @param int|null $limit Optional limit for number of jobs to return.
	 * @return array<int, array<string, mixed>> Array of jobs with jobId and status data.
	 */
	public function getAllJobs(?int $limit = null): array
	{
		global $wpdb;

		// Validate and sanitize limit - use large number if not specified
		// to maintain backward compatibility while ensuring parameter is always present
		$limitValue = null !== $limit && $limit > 0 ? \absint($limit) : 9999999;

		// Query for aether transients with limit.
		// CRITICAL: Include LIMIT in prepare() to prevent SQL injection
		// Previous version concatenated LIMIT after prepare(), breaking prepared statement
		$query = $wpdb->prepare(
			"SELECT option_name, option_value FROM `{$wpdb->options}`
			WHERE option_name LIKE %s
			AND option_name NOT LIKE %s
			ORDER BY option_name DESC
			LIMIT %d",
			$wpdb->esc_like('_transient_aether_') . '%',
			$wpdb->esc_like('_transient_timeout_') . '%',
			$limitValue
		);

		$results = $wpdb->get_results($query, ARRAY_A);

		$jobs = [];

		foreach ($results as $row) {
			$jobId = \str_replace('_transient_', '', $row['option_name']);
			$status = \maybe_unserialize($row['option_value']);

			if (\is_array($status)) {
				$jobs[] = \array_merge(
					[ 'jobId' => $jobId ],
					$status
				);
			}
		}

		return $jobs;
	}
}
