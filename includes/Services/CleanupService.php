<?php

/**
 * Cleanup Service
 *
 * Automatically cleans up old export jobs and files.
 * Can be run manually or scheduled via cron.
 *
 * @package AetherSiteExporter\Services
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\Services;

use AetherSiteExporter\Sync\JobStateManager;

/**
 * Cleanup service for old exports.
 *
 * @since 1.0.0
 */
class CleanupService
{
	/**
	 * Job state manager instance.
	 *
	 * @var JobStateManager
	 */
	private JobStateManager $state_manager;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct()
	{
		$this->state_manager = new JobStateManager();
	}

	/**
	 * Clean up old export jobs.
	 *
	 * Deletes jobs older than the specified number of days.
	 *
	 * @since 1.0.0
	 * @param int $days_to_keep Number of days to keep jobs (default: 30).
	 * @return array{success: bool, deleted_jobs: int, deleted_files: int, freed_space: int} Cleanup results.
	 */
	public function cleanup_old_jobs(int $days_to_keep = 30): array
	{
		$deleted_jobs = 0;
		$deleted_files = 0;
		$freed_space = 0;

		// Get all jobs.
		$all_jobs = $this->state_manager->get_all_jobs();

		// Calculate cutoff date.
		$cutoff_date = \gmdate('Y-m-d H:i:s', \strtotime("-{$days_to_keep} days"));

		foreach ($all_jobs as $job) {
			// Skip if job is newer than cutoff.
			if ($job['created_at'] > $cutoff_date) {
				continue;
			}

			// Delete export files and calculate freed space.
			$file_result = $this->delete_job_files($job['id']);
			$deleted_files += $file_result['deleted_files'];
			$freed_space += $file_result['freed_space'];

			// Delete job from database.
			$this->state_manager->delete_job($job['id']);
			$deleted_jobs++;
		}

		return [
			'success'       => true,
			'deleted_jobs'  => $deleted_jobs,
			'deleted_files' => $deleted_files,
			'freed_space'   => $freed_space,
		];
	}

	/**
	 * Clean up failed jobs.
	 *
	 * Deletes all jobs with 'failed' status older than specified hours.
	 *
	 * @since 1.0.0
	 * @param int $hours_to_keep Number of hours to keep failed jobs (default: 24).
	 * @return array{success: bool, deleted_jobs: int, deleted_files: int, freed_space: int} Cleanup results.
	 */
	public function cleanup_failed_jobs(int $hours_to_keep = 24): array
	{
		$deleted_jobs = 0;
		$deleted_files = 0;
		$freed_space = 0;

		// Get all jobs.
		$all_jobs = $this->state_manager->get_all_jobs();

		// Calculate cutoff date.
		$cutoff_date = \gmdate('Y-m-d H:i:s', \strtotime("-{$hours_to_keep} hours"));

		foreach ($all_jobs as $job) {
			// Skip if not failed or newer than cutoff.
			if ($job['status'] !== 'failed' || $job['created_at'] > $cutoff_date) {
				continue;
			}

			// Delete export files and calculate freed space.
			$file_result = $this->delete_job_files($job['id']);
			$deleted_files += $file_result['deleted_files'];
			$freed_space += $file_result['freed_space'];

			// Delete job from database.
			$this->state_manager->delete_job($job['id']);
			$deleted_jobs++;
		}

		return [
			'success'       => true,
			'deleted_jobs'  => $deleted_jobs,
			'deleted_files' => $deleted_files,
			'freed_space'   => $freed_space,
		];
	}

	/**
	 * Delete files for a specific job.
	 *
	 * @since 1.0.0
	 * @param string $job_id Job ID.
	 * @return array{deleted_files: int, freed_space: int} Deletion results.
	 */
	private function delete_job_files(string $job_id): array
	{
		$deleted_files = 0;
		$freed_space = 0;

		// Delete static site ZIP.
		$static_zip = AETHER_EXPORTS_DIR . '/' . $job_id . '-static-site.zip';
		if (\file_exists($static_zip)) {
			$freed_space += \filesize($static_zip);
			\unlink($static_zip);
			$deleted_files++;
		}

		// Delete blueprint ZIP.
		$blueprint_zip = AETHER_EXPORTS_DIR . '/' . $job_id . '-blueprint.zip';
		if (\file_exists($blueprint_zip)) {
			$freed_space += \filesize($blueprint_zip);
			\unlink($blueprint_zip);
			$deleted_files++;
		}

		// Delete job directory.
		$job_dir = AETHER_EXPORTS_DIR . '/' . $job_id;
		if (\is_dir($job_dir)) {
			$freed_space += $this->get_directory_size($job_dir);
			$this->delete_directory($job_dir);
			$deleted_files++;
		}

		return [
			'deleted_files' => $deleted_files,
			'freed_space'   => $freed_space,
		];
	}

	/**
	 * Get total size of directory in bytes.
	 *
	 * @since 1.0.0
	 * @param string $dir Directory path.
	 * @return int Directory size in bytes.
	 */
	private function get_directory_size(string $dir): int
	{
		if (! \is_dir($dir)) {
			return 0;
		}

		$size = 0;

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS)
		);

		foreach ($files as $file) {
			if ($file->isFile()) {
				$size += $file->getSize();
			}
		}

		return $size;
	}

	/**
	 * Delete directory recursively.
	 *
	 * @since 1.0.0
	 * @param string $dir Directory path.
	 * @return void
	 */
	private function delete_directory(string $dir): void
	{
		if (! \is_dir($dir)) {
			return;
		}

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
			\RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ($files as $file) {
			if ($file->isDir()) {
				\rmdir($file->getRealPath());
			} else {
				\unlink($file->getRealPath());
			}
		}

		\rmdir($dir);
	}

	/**
	 * Get cleanup statistics.
	 *
	 * Returns information about export files and disk usage.
	 *
	 * @since 1.0.0
	 * @return array{total_jobs: int, total_files: int, total_size: int, oldest_job: string|null} Statistics.
	 */
	public function get_statistics(): array
	{
		$all_jobs = $this->state_manager->get_all_jobs();
		$total_files = 0;
		$total_size = 0;
		$oldest_job = null;

		foreach ($all_jobs as $job) {
			// Count files.
			$static_zip = AETHER_EXPORTS_DIR . '/' . $job['id'] . '-static-site.zip';
			if (\file_exists($static_zip)) {
				$total_files++;
				$total_size += \filesize($static_zip);
			}

			$blueprint_zip = AETHER_EXPORTS_DIR . '/' . $job['id'] . '-blueprint.zip';
			if (\file_exists($blueprint_zip)) {
				$total_files++;
				$total_size += \filesize($blueprint_zip);
			}

			// Track oldest job.
			if (null === $oldest_job || $job['created_at'] < $oldest_job) {
				$oldest_job = $job['created_at'];
			}
		}

		return [
			'total_jobs' => \count($all_jobs),
			'total_files' => $total_files,
			'total_size' => $total_size,
			'oldest_job' => $oldest_job,
		];
	}
}
