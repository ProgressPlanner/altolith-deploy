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
		return \set_transient($jobId, $status, self::TRANSIENT_EXPIRATION);
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
	 * Increment retry counter for a step.
	 *
	 * @param string $jobId      Job ID.
	 * @param string $stepName   Step identifier.
	 * @param int    $maxRetries Maximum retries allowed.
	 * @return array{shouldRetry: bool, retryCount: int} Retry decision and count.
	 */
	public function incrementRetry(string $jobId, string $stepName, int $maxRetries = 2): array
	{
		$status = $this->getStatus($jobId);

		if (false === $status) {
			return [
				'shouldRetry' => false,
				'retryCount'  => 0,
			];
		}

		$stepRetries = $status['stepRetries'] ?? [];
		$retryCount  = $stepRetries[ $stepName ] ?? 0;
		$retryCount++;

		$stepRetries[ $stepName ] = $retryCount;
		$status['stepRetries']     = $stepRetries;

		$this->updateStatus($jobId, $status);

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

		// Query for all aether transients.
		$results = $wpdb->get_results(
			"SELECT option_name, option_value FROM {$wpdb->options}
			WHERE option_name LIKE '_transient_aether_%'
			AND option_name NOT LIKE '_transient_timeout_%'
			ORDER BY option_name DESC",
			ARRAY_A
		);

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

		// Apply limit if specified.
		if (null !== $limit && $limit > 0) {
			$jobs = \array_slice($jobs, 0, $limit);
		}

		return $jobs;
	}
}
