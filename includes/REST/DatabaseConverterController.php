<?php

/**
 * Database Converter Controller
 *
 * Handles MySQL to SQLite database conversion via AJAX endpoints (5MB batching).
 *
 * @package AetherSiteExporter\REST
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\REST;

use AetherSiteExporter\Sync\JobStateManager;
use WP_REST_Request;
use WP_Error;

/**
 * Database converter controller.
 *
 * @since 1.0.0
 */
class DatabaseConverterController
{
	use RESTHelpersTrait;

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
	 * Register REST routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void
	{
		// Analyze database.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/analyze-database',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'analyze_database' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Convert chunk (5MB batch).
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/convert-chunk',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'convert_chunk' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Finalize database.
		\register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/finalize-database',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'finalize_database' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);
	}

	/**
	 * Analyze database step.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function analyze_database(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		// Verify job exists.
		$status = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($status)) {
			return $status;
		}

		// Analyze database using DatabaseConverter service.
		$converter = new \AetherSiteExporter\Services\DatabaseConverter();
		$analysis  = $converter->analyze_database();

		// Create SQLite database path.
		$sqlite_path = AETHER_EXPORTS_DIR . '/' . $job_id . '/database.sqlite';

		// Update job state with analysis.
		$this->state_manager->update_status(
			$job_id,
			[
				'workflow_state' => [
					'database_analysis' => $analysis,
					'sqlite_path'       => $sqlite_path,
					'current_table'     => 0,
					'current_offset'    => 0,
					'bytes_converted'   => 0,
				],
			]
		);

		return $this->success_response(
			$analysis,
			\__('Database analyzed', 'aether-site-exporter')
		);
	}

	/**
	 * Convert chunk step (5MB batch).
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function convert_chunk(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		// Verify job exists.
		$status = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($status)) {
			return $status;
		}

		// Verify database has been analyzed.
		if (! isset($status['workflow_state']['database_analysis'])) {
			return $this->error_response(
				'missing_analysis',
				\__('Database must be analyzed before conversion', 'aether-site-exporter'),
				400
			);
		}

		$body         = $request->get_json_params();
		$chunk_index = \absint($body['chunkIndex'] ?? 0);

		// Get current state.
		$state       = $status['workflow_state'];
		$sqlite_path = $state['sqlite_path'];

		// Create SQLite database if first chunk.
		$converter = new \AetherSiteExporter\Services\DatabaseConverter();

		if (! \file_exists($sqlite_path)) {
			$pdo = $converter->create_sqlite_database($sqlite_path);

			// Create all table schemas.
			foreach ($state['database_analysis']['tables'] as $table_info) {
				$converter->convert_table_schema($table_info['name'], $pdo);
			}

			// Store PDO connection in a static variable for reuse.
			self::$pdo_connection = $pdo;
		} else {
			// Reuse existing connection or create new one.
			if (null === self::$pdo_connection) {
				// phpcs:ignore WordPress.DB.RestrictedClasses.mysql__PDO -- PDO required for SQLite operations.
				self::$pdo_connection = new \PDO('sqlite:' . $sqlite_path);
				// phpcs:ignore WordPress.DB.RestrictedClasses.mysql__PDO -- PDO required for SQLite operations.
				self::$pdo_connection->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
			}
		}

		// Convert chunk.
		$result = $converter->convert_chunk($job_id, self::$pdo_connection, $state);

		// Update job state.
		$this->state_manager->update_status(
			$job_id,
			[
				'workflow_state' => [
					'current_table'   => $result['currentTableIndex'] ?? $state['current_table'],
					'current_offset'  => $result['currentOffset'] ?? $state['current_offset'],
					'bytes_converted' => $result['bytesConverted'] ?? $state['bytes_converted'],
				],
			]
		);

		return $this->success_response($result);
	}

	/**
	 * Static PDO connection to reuse across chunk conversions.
	 *
	 * @var \PDO|null
	 */
	private static ?\PDO $pdo_connection = null;

	/**
	 * Finalize database step.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function finalize_database(WP_REST_Request $request)
	{
		$job_id = $this->validate_job_id($request);
		if (\is_wp_error($job_id)) {
			return $job_id;
		}

		// Verify job exists.
		$status = $this->get_job_status_or_error($job_id);
		if (\is_wp_error($status)) {
			return $status;
		}

		// Verify database has been analyzed.
		if (! isset($status['workflow_state']['database_analysis'])) {
			return $this->error_response(
				'missing_analysis',
				\__('Database must be analyzed before finalization', 'aether-site-exporter'),
				400
			);
		}

		$state       = $status['workflow_state'];
		$sqlite_path = $state['sqlite_path'];

		// Verify SQLite database exists.
		if (! \file_exists($sqlite_path)) {
			return $this->error_response(
				'missing_database',
				\__('SQLite database file not found', 'aether-site-exporter'),
				404
			);
		}

		// Get PDO connection.
		if (null === self::$pdo_connection) {
			// phpcs:ignore WordPress.DB.RestrictedClasses.mysql__PDO -- PDO required for SQLite operations.
			self::$pdo_connection = new \PDO('sqlite:' . $sqlite_path);
			// phpcs:ignore WordPress.DB.RestrictedClasses.mysql__PDO -- PDO required for SQLite operations.
			self::$pdo_connection->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
		}

		// Finalize database.
		$converter   = new \AetherSiteExporter\Services\DatabaseConverter();
		$table_names = \array_column($state['database_analysis']['tables'], 'name');
		$result      = $converter->finalize_database(self::$pdo_connection, $table_names);

		// Close PDO connection.
		self::$pdo_connection = null;

		return $this->success_response(
			$result,
			\__('Database conversion finalized', 'aether-site-exporter')
		);
	}
}
