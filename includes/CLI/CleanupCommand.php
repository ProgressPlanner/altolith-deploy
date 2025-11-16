<?php

/**
 * WP-CLI Cleanup Command
 *
 * Provides WP-CLI commands for cleaning up old exports.
 *
 * @package AetherSiteExporter\CLI
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\CLI;

use AetherSiteExporter\Services\CleanupService;
use WP_CLI;

/**
 * Cleanup command for WP-CLI.
 *
 * @since 1.0.0
 */
class CleanupCommand
{
	/**
	 * Clean up old export jobs.
	 *
	 * Deletes export jobs and files older than the specified number of days.
	 *
	 * ## OPTIONS
	 *
	 * [--days=<days>]
	 * : Number of days to keep jobs. Default: 30.
	 *
	 * [--dry-run]
	 * : Show what would be deleted without actually deleting.
	 *
	 * ## EXAMPLES
	 *
	 *     # Clean up jobs older than 30 days
	 *     wp aether-exporter cleanup
	 *
	 *     # Clean up jobs older than 7 days
	 *     wp aether-exporter cleanup --days=7
	 *
	 *     # Preview what would be deleted
	 *     wp aether-exporter cleanup --dry-run
	 *
	 * @when after_wp_load
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @return void
	 */
	public function __invoke($args, $assoc_args): void
	{
		$days = isset($assoc_args['days']) ? (int) $assoc_args['days'] : 30;
		$dry_run = isset($assoc_args['dry-run']);

		WP_CLI::log(\sprintf('Cleaning up export jobs older than %d days...', $days));

		if ($dry_run) {
			WP_CLI::warning('DRY RUN MODE - No files will be deleted');
		}

		$cleanup = new CleanupService();

		// Get statistics before cleanup.
		$stats_before = $cleanup->get_statistics();

		if ($dry_run) {
			WP_CLI::log(\sprintf('Current state:'));
			WP_CLI::log(\sprintf('  Total jobs: %d', $stats_before['total_jobs']));
			WP_CLI::log(\sprintf('  Total files: %d', $stats_before['total_files']));
			WP_CLI::log(\sprintf('  Total size: %s', \size_format($stats_before['total_size'])));

			WP_CLI::success('Dry run complete. Use without --dry-run to actually delete files.');
			return;
		}

		// Perform cleanup.
		$result = $cleanup->cleanup_old_jobs($days);

		if ($result['success']) {
			WP_CLI::success(
				\sprintf(
					'Cleanup complete! Deleted %d jobs, %d files, freed %s',
					$result['deleted_jobs'],
					$result['deleted_files'],
					\size_format($result['freed_space'])
				)
			);
		} else {
			WP_CLI::error('Cleanup failed');
		}
	}

	/**
	 * Clean up failed export jobs.
	 *
	 * Deletes failed jobs older than the specified number of hours.
	 *
	 * ## OPTIONS
	 *
	 * [--hours=<hours>]
	 * : Number of hours to keep failed jobs. Default: 24.
	 *
	 * ## EXAMPLES
	 *
	 *     # Clean up failed jobs older than 24 hours
	 *     wp aether-exporter cleanup-failed
	 *
	 *     # Clean up failed jobs older than 1 hour
	 *     wp aether-exporter cleanup-failed --hours=1
	 *
	 * @when after_wp_load
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @return void
	 */
	public function cleanup_failed($args, $assoc_args): void
	{
		$hours = isset($assoc_args['hours']) ? (int) $assoc_args['hours'] : 24;

		WP_CLI::log(\sprintf('Cleaning up failed jobs older than %d hours...', $hours));

		$cleanup = new CleanupService();
		$result = $cleanup->cleanup_failed_jobs($hours);

		if ($result['success']) {
			WP_CLI::success(
				\sprintf(
					'Cleanup complete! Deleted %d failed jobs, %d files, freed %s',
					$result['deleted_jobs'],
					$result['deleted_files'],
					\size_format($result['freed_space'])
				)
			);
		} else {
			WP_CLI::error('Cleanup failed');
		}
	}

	/**
	 * Show cleanup statistics.
	 *
	 * Displays information about export files and disk usage.
	 *
	 * ## EXAMPLES
	 *
	 *     wp aether-exporter stats
	 *
	 * @when after_wp_load
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @return void
	 */
	public function stats($args, $assoc_args): void
	{
		$cleanup = new CleanupService();
		$stats = $cleanup->get_statistics();

		WP_CLI::log('Export Statistics:');
		WP_CLI::log(\sprintf('  Total jobs: %d', $stats['total_jobs']));
		WP_CLI::log(\sprintf('  Total files: %d', $stats['total_files']));
		WP_CLI::log(\sprintf('  Total size: %s', \size_format($stats['total_size'])));

		if ($stats['oldest_job']) {
			WP_CLI::log(\sprintf('  Oldest job: %s', $stats['oldest_job']));
		}
	}
}
