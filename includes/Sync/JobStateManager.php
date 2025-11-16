<?php
/**
 * Job State Manager
 *
 * Handles database operations for export job state management.
 * Unlike Aether which uses transients, this uses a dedicated database table
 * for persistent storage of export jobs.
 *
 * @package AetherSiteExporter\Sync
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\Sync;

/**
 * Manages export job state via database table.
 *
 * @since 1.0.0
 */
class JobStateManager {
	/**
	 * Database table name (without prefix).
	 *
	 * @var string
	 */
	private string $table_name;

	/**
	 * WordPress database instance.
	 *
	 * @var \wpdb
	 */
	private \wpdb $wpdb;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb       = $wpdb;
		$this->table_name = $wpdb->prefix . 'aether_export_jobs';
	}

	/**
	 * Create a new export job.
	 *
	 * @since 1.0.0
	 * @param array<string, mixed> $config Job configuration.
	 * @return string|false Job ID on success, false on failure.
	 */
	public function create_job( array $config ) {
		// Generate unique job ID.
		$job_id = 'export_' . time() . '_' . wp_generate_password( 8, false );

		$result = $this->wpdb->insert(
			$this->table_name,
			[
				'id'             => $job_id,
				'status'         => 'pending',
				'current_step'   => null,
				'workflow_state' => wp_json_encode( [] ),
				'config'         => wp_json_encode( $config ),
				'error_message'  => null,
				'created_at'     => current_time( 'mysql' ),
				'updated_at'     => current_time( 'mysql' ),
			],
			[
				'%s', // id.
				'%s', // status.
				'%s', // current_step.
				'%s', // workflow_state.
				'%s', // config.
				'%s', // error_message.
				'%s', // created_at.
				'%s', // updated_at.
			]
		);

		return $result ? $job_id : false;
	}

	/**
	 * Get job status from database.
	 *
	 * @since 1.0.0
	 * @param string $job_id Job ID.
	 * @return array<string, mixed>|false Job data or false if not found.
	 */
	public function get_status( string $job_id ) {
		$job = $this->wpdb->get_row(
			$this->wpdb->prepare(
				"SELECT * FROM {$this->table_name} WHERE id = %s",
				$job_id
			),
			ARRAY_A
		);

		if ( ! $job ) {
			return false;
		}

		// Decode JSON fields.
		$job['workflow_state'] = json_decode( $job['workflow_state'], true ) ?? [];
		$job['config']         = json_decode( $job['config'], true ) ?? [];

		return $job;
	}

	/**
	 * Update job status.
	 *
	 * @since 1.0.0
	 * @param string               $job_id Job ID.
	 * @param array<string, mixed> $data Data to update.
	 * @return bool True on success, false on failure.
	 */
	public function update_status( string $job_id, array $data ): bool {
		// Get current job data to merge workflow_state.
		$current = $this->get_status( $job_id );
		if ( false === $current ) {
			return false;
		}

		// Prepare update data.
		$update_data = [
			'updated_at' => current_time( 'mysql' ),
		];

		// Update status if provided.
		if ( isset( $data['status'] ) ) {
			$update_data['status'] = $data['status'];
		}

		// Update current step if provided.
		if ( isset( $data['current_step'] ) ) {
			$update_data['current_step'] = $data['current_step'];
		}

		// Update error message if provided.
		if ( isset( $data['error_message'] ) ) {
			$update_data['error_message'] = $data['error_message'];
		}

		// Merge workflow state.
		if ( isset( $data['workflow_state'] ) ) {
			$merged_state                   = array_merge( $current['workflow_state'], $data['workflow_state'] );
			$update_data['workflow_state'] = wp_json_encode( $merged_state );
		}

		// Update config if provided.
		if ( isset( $data['config'] ) ) {
			$update_data['config'] = wp_json_encode( $data['config'] );
		}

		$result = $this->wpdb->update(
			$this->table_name,
			$update_data,
			[ 'id' => $job_id ],
			null,
			[ '%s' ] // WHERE format.
		);

		return false !== $result;
	}

	/**
	 * Transition to next step.
	 *
	 * @since 1.0.0
	 * @param string               $job_id Job ID.
	 * @param string               $next_step Next step identifier.
	 * @param string               $message Status message.
	 * @param array<string, mixed> $extra_data Optional extra data to merge into workflow_state.
	 * @return bool True on success, false on failure.
	 */
	public function transition_to( string $job_id, string $next_step, string $message, array $extra_data = [] ): bool {
		$workflow_state = array_merge(
			[
				'message' => $message,
			],
			$extra_data
		);

		return $this->update_status(
			$job_id,
			[
				'status'         => 'running',
				'current_step'   => $next_step,
				'workflow_state' => $workflow_state,
			]
		);
	}

	/**
	 * Mark job as complete.
	 *
	 * @since 1.0.0
	 * @param string $job_id Job ID.
	 * @param string $message Success message.
	 * @return bool True on success, false on failure.
	 */
	public function mark_complete( string $job_id, string $message = '' ): bool {
		if ( empty( $message ) ) {
			$message = __( 'Export completed successfully!', 'aether-site-exporter' );
		}

		return $this->update_status(
			$job_id,
			[
				'status'         => 'complete',
				'current_step'   => 'completed',
				'workflow_state' => [ 'message' => $message ],
			]
		);
	}

	/**
	 * Mark job as failed.
	 *
	 * @since 1.0.0
	 * @param string $job_id Job ID.
	 * @param string $error_message Error message.
	 * @param string $current_step Step that failed (optional).
	 * @return bool True on success, false on failure.
	 */
	public function mark_failed( string $job_id, string $error_message, string $current_step = '' ): bool {
		$data = [
			'status'        => 'failed',
			'error_message' => $error_message,
		];

		if ( ! empty( $current_step ) ) {
			$data['current_step'] = $current_step;
		}

		return $this->update_status( $job_id, $data );
	}

	/**
	 * Get all jobs, sorted by most recent first.
	 *
	 * @since 1.0.0
	 * @param int|null $limit Optional limit for number of jobs to return.
	 * @return array<int, array<string, mixed>> Array of jobs.
	 */
	public function get_all_jobs( ?int $limit = null ): array {
		$sql = "SELECT * FROM {$this->table_name} ORDER BY created_at DESC";

		if ( null !== $limit && $limit > 0 ) {
			$sql .= $this->wpdb->prepare( ' LIMIT %d', $limit );
		}

		$results = $this->wpdb->get_results( $sql, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		if ( ! $results ) {
			return [];
		}

		// Decode JSON fields for each job.
		foreach ( $results as &$job ) {
			$job['workflow_state'] = json_decode( $job['workflow_state'], true ) ?? [];
			$job['config']         = json_decode( $job['config'], true ) ?? [];
		}

		return $results;
	}

	/**
	 * Delete a job.
	 *
	 * @since 1.0.0
	 * @param string $job_id Job ID.
	 * @return bool True on success, false on failure.
	 */
	public function delete_job( string $job_id ): bool {
		$result = $this->wpdb->delete(
			$this->table_name,
			[ 'id' => $job_id ],
			[ '%s' ]
		);

		return false !== $result;
	}

	/**
	 * Clean up old jobs.
	 *
	 * Keeps only the N most recent jobs, deletes the rest.
	 *
	 * @since 1.0.0
	 * @param int $keep_count Number of jobs to keep.
	 * @return int Number of jobs deleted.
	 */
	public function cleanup_old_jobs( int $keep_count = 10 ): int {
		// Get all job IDs sorted by created_at desc.
		$all_jobs = $this->wpdb->get_col(
			"SELECT id FROM {$this->table_name} ORDER BY created_at DESC"
		);

		if ( count( $all_jobs ) <= $keep_count ) {
			return 0;
		}

		// Get IDs to delete (everything after $keep_count).
		$jobs_to_delete = array_slice( $all_jobs, $keep_count );

		if ( empty( $jobs_to_delete ) ) {
			return 0;
		}

		// Build IN clause.
		$placeholders = implode( ', ', array_fill( 0, count( $jobs_to_delete ), '%s' ) );

		// Delete old jobs.
		$deleted = $this->wpdb->query(
			$this->wpdb->prepare(
				"DELETE FROM {$this->table_name} WHERE id IN ($placeholders)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$jobs_to_delete
			)
		);

		return (int) $deleted;
	}
}
