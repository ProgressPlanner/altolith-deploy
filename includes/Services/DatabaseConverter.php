<?php

/**
 * Database Converter Service
 *
 * Converts MySQL database to SQLite with 5MB batching to avoid PHP timeouts.
 * Designed to work in WordPress Playground browser environment.
 *
 * @package AetherSiteExporter\Services
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\Services;

use PDO;
use PDOException;

// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- All queries use $wpdb->prepare() with %i and %s placeholders.

/**
 * Database converter service.
 *
 * @since 1.0.0
 */
class DatabaseConverter
{
	/**
	 * Chunk size in bytes (5MB).
	 *
	 * @var int
	 */
	private const CHUNK_SIZE = 5 * 1024 * 1024;

	/**
	 * Rows to fetch per iteration.
	 *
	 * @var int
	 */
	private const ROWS_PER_ITERATION = 100;

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
	public function __construct()
	{
		global $wpdb;
		$this->wpdb = $wpdb;
	}

	/**
	 * Get all WordPress tables.
	 *
	 * @since 1.0.0
	 * @return array<int, string> Array of table names.
	 */
	public function get_wordpress_tables(): array
	{
		$tables = $this->wpdb->get_col(
			$this->wpdb->prepare(
				'SHOW TABLES LIKE %s',
				$this->wpdb->prefix . '%'
			)
		);

		return $tables ?: [];
	}

	/**
	 * Analyze database and return statistics.
	 *
	 * @since 1.0.0
	 * @return array{tables: array<int, array{name: string, rows: int, size: int, chunks: int}>, totalSize: int, totalChunks: int, estimatedTime: int}
	 */
	public function analyze_database(): array
	{
		$tables       = $this->get_wordpress_tables();
		$analysis     = [];
		$total_size   = 0;
		$total_chunks = 0;

		foreach ($tables as $table) {
			$status = $this->wpdb->get_row(
				$this->wpdb->prepare(
					'SHOW TABLE STATUS LIKE %s',
					$table
				),
				ARRAY_A
			);

			if (! $status) {
				continue;
			}

			$size   = ( (int) $status['Data_length'] ) + ( (int) $status['Index_length'] );
			$chunks = \max(1, (int) \ceil($size / self::CHUNK_SIZE));

			$analysis[] = [
				'name'   => $table,
				'rows'   => (int) $status['Rows'],
				'size'   => $size,
				'chunks' => $chunks,
			];

			$total_size   += $size;
			$total_chunks += $chunks;
		}

		return [
			'tables'        => $analysis,
			'totalSize'     => $total_size,
			'totalChunks'   => $total_chunks,
			'estimatedTime' => $total_chunks * 3, // 3 seconds per chunk estimate.
		];
	}

	/**
	 * Create SQLite database file.
	 *
	 * @since 1.0.0
	 * @param string $path Path to SQLite database file.
	 * @return PDO SQLite PDO connection.
	 * @throws PDOException If connection fails.
	 */
	public function create_sqlite_database(string $path): PDO
	{
		// Ensure directory exists.
		$dir = \dirname($path);
		if (! \file_exists($dir)) {
			\wp_mkdir_p($dir);
		}

		// Create SQLite database.
		$pdo = new PDO('sqlite:' . $path);
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		// Enable foreign keys support.
		$pdo->exec('PRAGMA foreign_keys = ON');

		return $pdo;
	}

	/**
	 * Convert table schema from MySQL to SQLite.
	 *
	 * @since 1.0.0
	 * @param string $table Table name.
	 * @param PDO    $pdo SQLite PDO connection.
	 * @return void
	 * @throws PDOException If schema conversion fails.
	 */
	public function convert_table_schema(string $table, PDO $pdo): void
	{
		// Get MySQL CREATE TABLE statement.
		$create_table = $this->wpdb->get_row(
			$this->wpdb->prepare('SHOW CREATE TABLE %i', $table),
			ARRAY_N
		);

		if (! $create_table || ! isset($create_table[1])) {
			return;
		}

		$mysql_ddl = $create_table[1];

		// Convert MySQL DDL to SQLite DDL.
		$sqlite_ddl = $this->convert_ddl_to_sqlite($mysql_ddl);

		// Execute in SQLite.
		$pdo->exec($sqlite_ddl);
	}

	/**
	 * Convert MySQL DDL to SQLite DDL.
	 *
	 * @since 1.0.0
	 * @param string $mysql_ddl MySQL CREATE TABLE statement.
	 * @return string SQLite CREATE TABLE statement.
	 */
	private function convert_ddl_to_sqlite(string $mysql_ddl): string
	{
		// Remove MySQL-specific options.
		$sqlite_ddl = \preg_replace('/ENGINE=\w+/', '', $mysql_ddl);
		$sqlite_ddl = \preg_replace('/DEFAULT CHARSET=\w+/', '', $sqlite_ddl);
		$sqlite_ddl = \preg_replace('/COLLATE=\w+/', '', $sqlite_ddl);
		$sqlite_ddl = \preg_replace('/AUTO_INCREMENT=\d+/', '', $sqlite_ddl);

		// Convert data types.
		$type_mappings = [
			'/tinyint\(\d+\)/i'     => 'INTEGER',
			'/smallint\(\d+\)/i'    => 'INTEGER',
			'/mediumint\(\d+\)/i'   => 'INTEGER',
			'/int\(\d+\)/i'         => 'INTEGER',
			'/bigint\(\d+\)/i'      => 'INTEGER',
			'/float/i'              => 'REAL',
			'/double/i'             => 'REAL',
			'/decimal\(\d+,\d+\)/i' => 'REAL',
			'/varchar\(\d+\)/i'     => 'TEXT',
			'/char\(\d+\)/i'        => 'TEXT',
			'/text/i'               => 'TEXT',
			'/mediumtext/i'         => 'TEXT',
			'/longtext/i'           => 'TEXT',
			'/blob/i'               => 'BLOB',
			'/mediumblob/i'         => 'BLOB',
			'/longblob/i'           => 'BLOB',
			'/datetime/i'           => 'TEXT',
			'/timestamp/i'          => 'TEXT',
			'/date/i'               => 'TEXT',
			'/time/i'               => 'TEXT',
			"/enum\([^)]+\)/i"      => 'TEXT',
			"/set\([^)]+\)/i"       => 'TEXT',
		];

		foreach ($type_mappings as $pattern => $replacement) {
			$sqlite_ddl = \preg_replace($pattern, $replacement, $sqlite_ddl);
		}

		// Convert AUTO_INCREMENT to AUTOINCREMENT.
		$sqlite_ddl = \preg_replace('/AUTO_INCREMENT/i', 'AUTOINCREMENT', $sqlite_ddl);

		// Remove unsigned, zerofill attributes.
		$sqlite_ddl = \preg_replace('/\s+unsigned/i', '', $sqlite_ddl);
		$sqlite_ddl = \preg_replace('/\s+zerofill/i', '', $sqlite_ddl);

		// Remove character set and collation from column definitions.
		$sqlite_ddl = \preg_replace('/CHARACTER SET \w+/', '', $sqlite_ddl);
		$sqlite_ddl = \preg_replace('/COLLATE \w+/', '', $sqlite_ddl);

		// Remove COMMENT.
		$sqlite_ddl = \preg_replace("/COMMENT '[^']*'/", '', $sqlite_ddl);

		// Remove KEY definitions (will be recreated as indexes).
		$sqlite_ddl = \preg_replace('/,\s*KEY `[^`]+` \([^)]+\)/i', '', $sqlite_ddl);
		$sqlite_ddl = \preg_replace('/,\s*UNIQUE KEY `[^`]+` \([^)]+\)/i', '', $sqlite_ddl);
		$sqlite_ddl = \preg_replace('/,\s*FULLTEXT KEY `[^`]+` \([^)]+\)/i', '', $sqlite_ddl);

		// Clean up extra commas and whitespace.
		$sqlite_ddl = \preg_replace('/,\s*\)/', ')', $sqlite_ddl);
		$sqlite_ddl = \preg_replace('/\s+/', ' ', $sqlite_ddl);

		return $sqlite_ddl;
	}

	/**
	 * Map MySQL data type to SQLite data type.
	 *
	 * @since 1.0.0
	 * @param string $mysql_type MySQL data type.
	 * @return string SQLite data type.
	 */
	public function map_mysql_type_to_sqlite(string $mysql_type): string
	{
		// Normalize type to lowercase.
		$type = \strtolower(\trim($mysql_type));

		// Integer types.
		if (\preg_match('/^(tinyint|smallint|mediumint|int|bigint)/', $type)) {
			return 'INTEGER';
		}

		// Float types.
		if (\preg_match('/^(float|double|decimal|numeric)/', $type)) {
			return 'REAL';
		}

		// Text types.
		if (\preg_match('/^(char|varchar|text|mediumtext|longtext|enum|set)/', $type)) {
			return 'TEXT';
		}

		// Binary types.
		if (\preg_match('/^(blob|mediumblob|longblob|binary|varbinary)/', $type)) {
			return 'BLOB';
		}

		// Date/time types.
		if (\preg_match('/^(datetime|timestamp|date|time|year)/', $type)) {
			return 'TEXT';
		}

		// Default to TEXT.
		return 'TEXT';
	}

	/**
	 * Convert a chunk of data (up to 5MB).
	 *
	 * @since 1.0.0
	 * @param string                $job_id Job ID.
	 * @param PDO                   $pdo SQLite PDO connection.
	 * @param array<string, mixed> $state Current conversion state.
	 * @return array{complete: bool, progress: float, bytesConverted: int, totalBytes: int, currentTable: string, currentTableIndex: int, currentOffset: int, message: string}
	 */
	public function convert_chunk(string $job_id, PDO $pdo, array $state): array
	{
		$analysis          = $state['database_analysis'];
		$current_table_idx = $state['current_table'] ?? 0;
		$current_offset    = $state['current_offset'] ?? 0;
		$bytes_converted   = $state['bytes_converted'] ?? 0;

		// Check if complete.
		if ($current_table_idx >= \count($analysis['tables'])) {
			return [
				'complete'          => true,
				'progress'          => 100.0,
				'bytesConverted'    => $bytes_converted,
				'totalBytes'        => $analysis['totalSize'],
				'currentTable'      => '',
				'currentTableIndex' => $current_table_idx,
				'currentOffset'     => 0,
				'message'           => 'Conversion complete',
			];
		}

		$table_info = $analysis['tables'][ $current_table_idx ];
		$table_name = $table_info['name'];

		// Read rows until 5MB limit.
		$bytes_read = 0;
		$rows       = [];

		while ($bytes_read < self::CHUNK_SIZE) {
			// Fetch batch of rows.
			$batch = $this->wpdb->get_results(
				$this->wpdb->prepare(
					'SELECT * FROM %i LIMIT %d OFFSET %d',
					$table_name,
					self::ROWS_PER_ITERATION,
					$current_offset
				),
				ARRAY_A
			);

			if (empty($batch)) {
				// Table complete, move to next table.
				$current_table_idx++;
				$current_offset = 0;
				break;
			}

			foreach ($batch as $row) {
				$row_size = \strlen(\serialize($row));
				$bytes_read += $row_size;
				$rows[] = $row;

				if ($bytes_read >= self::CHUNK_SIZE) {
					break 2; // Exit both loops.
				}
			}

			$current_offset += \count($batch);
		}

		// Insert rows into SQLite.
		if (! empty($rows)) {
			$this->insert_rows($table_name, $rows, $pdo);
		}

		// Update bytes converted.
		$bytes_converted += $bytes_read;

		// Calculate progress.
		$progress = ( $bytes_converted / \max(1, $analysis['totalSize']) ) * 100;

		return [
			'complete'          => false,
			'progress'          => \round($progress, 2),
			'bytesConverted'    => $bytes_converted,
			'totalBytes'        => $analysis['totalSize'],
			'currentTable'      => $table_name,
			'currentTableIndex' => $current_table_idx,
			'currentOffset'     => $current_offset,
			'message'           => \sprintf(
				'Converting %s: %s / %s (%.1f%%)',
				$table_name,
				$this->format_bytes($bytes_converted),
				$this->format_bytes($analysis['totalSize']),
				$progress
			),
		];
	}

	/**
	 * Insert rows into SQLite table.
	 *
	 * @since 1.0.0
	 * @param string               $table Table name.
	 * @param array<int, array<string, mixed>> $rows Rows to insert.
	 * @param PDO                  $pdo SQLite PDO connection.
	 * @return void
	 * @throws PDOException If insert fails.
	 */
	public function insert_rows(string $table, array $rows, PDO $pdo): void
	{
		if (empty($rows)) {
			return;
		}

		// Get column names from first row.
		$columns = \array_keys($rows[0]);
		$placeholders = \implode(',', \array_fill(0, \count($columns), '?'));

		$sql = \sprintf(
			'INSERT INTO %s (%s) VALUES (%s)',
			$table,
			\implode(',', $columns),
			$placeholders
		);

		$stmt = $pdo->prepare($sql);

		$pdo->beginTransaction();

		try {
			foreach ($rows as $row) {
				$stmt->execute(\array_values($row));
			}

			$pdo->commit();
		} catch (PDOException $e) {
			$pdo->rollBack();
			throw $e;
		}
	}

	/**
	 * Finalize database (create indexes, vacuum).
	 *
	 * @since 1.0.0
	 * @param PDO                  $pdo SQLite PDO connection.
	 * @param array<int, string> $tables Array of table names.
	 * @return array{success: bool, finalSize: int}
	 */
	public function finalize_database(PDO $pdo, array $tables): array
	{
		// Create indexes for each table.
		foreach ($tables as $table) {
			$this->create_indexes_for_table($table, $pdo);
		}

		// Vacuum to optimize size.
		$pdo->exec('VACUUM');

		// Get final database file size.
		$db_file = $this->get_database_path_from_pdo($pdo);
		$final_size = \file_exists($db_file) ? \filesize($db_file) : 0;

		return [
			'success'   => true,
			'finalSize' => $final_size,
		];
	}

	/**
	 * Create indexes for a table.
	 *
	 * @since 1.0.0
	 * @param string $table Table name.
	 * @param PDO    $pdo SQLite PDO connection.
	 * @return void
	 */
	private function create_indexes_for_table(string $table, PDO $pdo): void
	{
		// Get indexes from MySQL.
		$indexes = $this->wpdb->get_results(
			$this->wpdb->prepare(
				'SHOW INDEX FROM %i WHERE Key_name != "PRIMARY"',
				$table
			),
			ARRAY_A
		);

		if (empty($indexes)) {
			return;
		}

		// Group indexes by name.
		$grouped_indexes = [];
		foreach ($indexes as $index) {
			$key_name = $index['Key_name'];
			if (! isset($grouped_indexes[ $key_name ])) {
				$grouped_indexes[ $key_name ] = [
					'unique'  => $index['Non_unique'] == 0,
					'columns' => [],
				];
			}
			$grouped_indexes[ $key_name ]['columns'][] = $index['Column_name'];
		}

		// Create indexes in SQLite.
		foreach ($grouped_indexes as $index_name => $index_data) {
			$unique = $index_data['unique'] ? 'UNIQUE' : '';
			$columns = \implode(',', $index_data['columns']);

			$sql = \sprintf(
				'CREATE %s INDEX IF NOT EXISTS %s ON %s (%s)',
				$unique,
				$index_name,
				$table,
				$columns
			);

			try {
				$pdo->exec($sql);
			} catch (PDOException $e) {
				// Ignore errors (index may already exist).
				continue;
			}
		}
	}

	/**
	 * Get database file path from PDO connection.
	 *
	 * @since 1.0.0
	 * @param PDO $pdo PDO connection.
	 * @return string Database file path.
	 */
	private function get_database_path_from_pdo(PDO $pdo): string
	{
		$dsn = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
		if ('sqlite' !== $dsn) {
			return '';
		}

		// SQLite DSN format: sqlite:/path/to/db.sqlite.
		$connection_string = $pdo->getAttribute(PDO::ATTR_CONNECTION_STATUS);
		if (\preg_match('/sqlite:(.+)/', $connection_string, $matches)) {
			return $matches[1];
		}

		return '';
	}

	/**
	 * Format bytes to human-readable string.
	 *
	 * @since 1.0.0
	 * @param int $bytes Bytes.
	 * @return string Formatted string.
	 */
	public function format_bytes(int $bytes): string
	{
		$units = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
		$i     = 0;

		while ($bytes >= 1024 && $i < \count($units) - 1) {
			$bytes /= 1024;
			$i++;
		}

		return \round($bytes, 2) . ' ' . $units[ $i ];
	}
}
