<?php
/**
 * Tests for DatabaseConverter
 *
 * Following TDD principles - these tests define the INTENDED functionality
 * for MySQL to SQLite database conversion with 5MB batching.
 *
 * @package AetherSiteExporter\Tests\Unit\Services
 */

declare(strict_types=1);

namespace AetherSiteExporter\Tests\Unit\Services;

use AetherSiteExporter\Services\DatabaseConverter;
use WP_UnitTestCase;

/**
 * DatabaseConverter test case.
 *
 * @since 1.0.0
 * @coversDefaultClass \AetherSiteExporter\Services\DatabaseConverter
 */
class DatabaseConverterTest extends WP_UnitTestCase {
	/**
	 * DatabaseConverter instance.
	 *
	 * @var DatabaseConverter
	 */
	private DatabaseConverter $converter;

	/**
	 * Temporary SQLite database path.
	 *
	 * @var string
	 */
	private string $temp_sqlite_path;

	/**
	 * Set up test environment.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		// Create temporary directory for SQLite database.
		$temp_dir = sys_get_temp_dir() . '/aether-test-' . time();
		wp_mkdir_p( $temp_dir );
		$this->temp_sqlite_path = $temp_dir . '/test-database.sqlite';

		$this->converter = new DatabaseConverter();
	}

	/**
	 * Tear down test environment.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function tear_down(): void {
		// Clean up temporary SQLite database.
		if ( file_exists( $this->temp_sqlite_path ) ) {
			unlink( $this->temp_sqlite_path );
		}

		$temp_dir = dirname( $this->temp_sqlite_path );
		if ( is_dir( $temp_dir ) ) {
			rmdir( $temp_dir );
		}

		parent::tear_down();
	}

	/**
	 * Test: Get WordPress tables should return all wp_ prefixed tables.
	 *
	 * @since 1.0.0
	 * @covers ::get_wordpress_tables
	 * @return void
	 */
	public function test_get_wordpress_tables_returns_wp_tables(): void {
		// Act.
		$tables = $this->converter->get_wordpress_tables();

		// Assert.
		$this->assertIsArray( $tables, 'Should return an array' );
		$this->assertNotEmpty( $tables, 'Should return at least one table' );

		// Verify all tables start with wp_ prefix.
		global $wpdb;
		foreach ( $tables as $table ) {
			$this->assertStringStartsWith( $wpdb->prefix, $table, "Table $table should start with wp_ prefix" );
		}

		// Verify core WordPress tables exist.
		$core_tables = [ 'posts', 'users', 'options', 'postmeta', 'usermeta', 'terms', 'term_taxonomy', 'term_relationships' ];
		foreach ( $core_tables as $core_table ) {
			$this->assertContains( $wpdb->prefix . $core_table, $tables, "Should include $core_table table" );
		}
	}

	/**
	 * Test: Analyze database should return table statistics.
	 *
	 * @since 1.0.0
	 * @covers ::analyze_database
	 * @return void
	 */
	public function test_analyze_database_returns_statistics(): void {
		// Act.
		$analysis = $this->converter->analyze_database();

		// Assert.
		$this->assertIsArray( $analysis, 'Analysis should be an array' );
		$this->assertArrayHasKey( 'tables', $analysis, 'Should include tables array' );
		$this->assertArrayHasKey( 'totalSize', $analysis, 'Should include totalSize' );
		$this->assertArrayHasKey( 'totalChunks', $analysis, 'Should include totalChunks' );
		$this->assertArrayHasKey( 'estimatedTime', $analysis, 'Should include estimatedTime' );

		// Verify tables array structure.
		$this->assertNotEmpty( $analysis['tables'], 'Should have at least one table' );

		$first_table = $analysis['tables'][0];
		$this->assertArrayHasKey( 'name', $first_table, 'Table should have name' );
		$this->assertArrayHasKey( 'rows', $first_table, 'Table should have row count' );
		$this->assertArrayHasKey( 'size', $first_table, 'Table should have size in bytes' );
		$this->assertArrayHasKey( 'chunks', $first_table, 'Table should have chunk count' );

		// Verify total size is sum of all table sizes.
		$calculated_total = array_sum( array_column( $analysis['tables'], 'size' ) );
		$this->assertEquals( $calculated_total, $analysis['totalSize'], 'Total size should match sum of table sizes' );

		// Verify total chunks is sum of all table chunks.
		$calculated_chunks = array_sum( array_column( $analysis['tables'], 'chunks' ) );
		$this->assertEquals( $calculated_chunks, $analysis['totalChunks'], 'Total chunks should match sum of table chunks' );
	}

	/**
	 * Test: Create SQLite database should create file and return PDO connection.
	 *
	 * @since 1.0.0
	 * @covers ::create_sqlite_database
	 * @return void
	 */
	public function test_create_sqlite_database_creates_file(): void {
		// Act.
		$pdo = $this->converter->create_sqlite_database( $this->temp_sqlite_path );

		// Assert.
		$this->assertInstanceOf( \PDO::class, $pdo, 'Should return PDO instance' );
		$this->assertFileExists( $this->temp_sqlite_path, 'SQLite database file should be created' );

		// Verify it's a valid SQLite database.
		$version = $pdo->query( 'SELECT sqlite_version()' )->fetchColumn();
		$this->assertNotEmpty( $version, 'Should be able to query SQLite version' );
	}

	/**
	 * Test: Convert table schema should create table structure in SQLite.
	 *
	 * @since 1.0.0
	 * @covers ::convert_table_schema
	 * @return void
	 */
	public function test_convert_table_schema_creates_table(): void {
		// Arrange.
		$pdo     = $this->converter->create_sqlite_database( $this->temp_sqlite_path );
		$wpdb    = $GLOBALS['wpdb'];
		$table   = $wpdb->prefix . 'posts';

		// Act.
		$this->converter->convert_table_schema( $table, $pdo );

		// Assert: Verify table exists in SQLite.
		$tables = $pdo->query( "SELECT name FROM sqlite_master WHERE type='table' AND name='$table'" )->fetchAll();
		$this->assertCount( 1, $tables, 'Table should be created in SQLite' );

		// Verify table has columns.
		$columns = $pdo->query( "PRAGMA table_info($table)" )->fetchAll();
		$this->assertNotEmpty( $columns, 'Table should have columns' );

		// Verify primary key exists.
		$primary_keys = array_filter( $columns, fn( $col ) => $col['pk'] > 0 );
		$this->assertNotEmpty( $primary_keys, 'Table should have a primary key' );
	}

	/**
	 * Test: Map MySQL data types to SQLite data types correctly.
	 *
	 * @since 1.0.0
	 * @covers ::map_mysql_type_to_sqlite
	 * @dataProvider mysql_type_mapping_provider
	 * @param string $mysql_type MySQL data type.
	 * @param string $expected_sqlite_type Expected SQLite data type.
	 * @return void
	 */
	public function test_map_mysql_type_to_sqlite( string $mysql_type, string $expected_sqlite_type ): void {
		// Act.
		$sqlite_type = $this->converter->map_mysql_type_to_sqlite( $mysql_type );

		// Assert.
		$this->assertEquals( $expected_sqlite_type, $sqlite_type, "MySQL type $mysql_type should map to SQLite type $expected_sqlite_type" );
	}

	/**
	 * Data provider for MySQL to SQLite type mapping tests.
	 *
	 * @since 1.0.0
	 * @return array<string, array<int, string>>
	 */
	public function mysql_type_mapping_provider(): array {
		return [
			'tinyint'       => [ 'tinyint(1)', 'INTEGER' ],
			'smallint'      => [ 'smallint(6)', 'INTEGER' ],
			'mediumint'     => [ 'mediumint(9)', 'INTEGER' ],
			'int'           => [ 'int(11)', 'INTEGER' ],
			'bigint'        => [ 'bigint(20)', 'INTEGER' ],
			'float'         => [ 'float', 'REAL' ],
			'double'        => [ 'double', 'REAL' ],
			'decimal'       => [ 'decimal(10,2)', 'REAL' ],
			'char'          => [ 'char(10)', 'TEXT' ],
			'varchar'       => [ 'varchar(255)', 'TEXT' ],
			'text'          => [ 'text', 'TEXT' ],
			'mediumtext'    => [ 'mediumtext', 'TEXT' ],
			'longtext'      => [ 'longtext', 'TEXT' ],
			'blob'          => [ 'blob', 'BLOB' ],
			'mediumblob'    => [ 'mediumblob', 'BLOB' ],
			'longblob'      => [ 'longblob', 'BLOB' ],
			'datetime'      => [ 'datetime', 'TEXT' ],
			'timestamp'     => [ 'timestamp', 'TEXT' ],
			'date'          => [ 'date', 'TEXT' ],
			'time'          => [ 'time', 'TEXT' ],
			'enum'          => [ "enum('a','b','c')", 'TEXT' ],
			'set'           => [ "set('x','y','z')", 'TEXT' ],
		];
	}

	/**
	 * Test: Convert chunk should process up to 5MB of data.
	 *
	 * @since 1.0.0
	 * @covers ::convert_chunk
	 * @return void
	 */
	public function test_convert_chunk_processes_5mb_max(): void {
		// Arrange: Create a test job with analysis data.
		global $wpdb;
		$job_id  = 'test_job_' . time();
		$table   = $wpdb->prefix . 'posts';
		$pdo     = $this->converter->create_sqlite_database( $this->temp_sqlite_path );

		// Create table schema first.
		$this->converter->convert_table_schema( $table, $pdo );

		// Initialize state.
		$state = [
			'database_analysis' => [
				'tables' => [
					[
						'name'   => $table,
						'rows'   => 100,
						'size'   => 1024 * 1024, // 1MB.
						'chunks' => 1,
					],
				],
				'totalSize'   => 1024 * 1024,
				'totalChunks' => 1,
			],
			'current_table'  => 0,
			'current_offset' => 0,
			'bytes_converted' => 0,
		];

		// Act.
		$result = $this->converter->convert_chunk( $job_id, $pdo, $state );

		// Assert.
		$this->assertIsArray( $result, 'Result should be an array' );
		$this->assertArrayHasKey( 'complete', $result, 'Result should include complete flag' );
		$this->assertArrayHasKey( 'progress', $result, 'Result should include progress percentage' );
		$this->assertArrayHasKey( 'bytesConverted', $result, 'Result should include bytes converted' );
		$this->assertArrayHasKey( 'currentTable', $result, 'Result should include current table name' );
		$this->assertArrayHasKey( 'message', $result, 'Result should include status message' );

		// Verify progress is between 0 and 100.
		$this->assertGreaterThanOrEqual( 0, $result['progress'], 'Progress should be >= 0' );
		$this->assertLessThanOrEqual( 100, $result['progress'], 'Progress should be <= 100' );

		// Verify bytes converted is within 5MB limit.
		$this->assertLessThanOrEqual( 5 * 1024 * 1024, $result['bytesConverted'], 'Should not exceed 5MB per chunk' );
	}

	/**
	 * Test: Convert chunk should handle empty tables gracefully.
	 *
	 * @since 1.0.0
	 * @covers ::convert_chunk
	 * @return void
	 */
	public function test_convert_chunk_handles_empty_table(): void {
		// Arrange: Create an empty custom table.
		global $wpdb;
		$table_name = $wpdb->prefix . 'aether_test_empty';

		$wpdb->query(
			"CREATE TABLE IF NOT EXISTS $table_name (
				id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				test_field varchar(255),
				PRIMARY KEY (id)
			)"
		);

		$job_id = 'test_job_' . time();
		$pdo    = $this->converter->create_sqlite_database( $this->temp_sqlite_path );

		// Create table schema.
		$this->converter->convert_table_schema( $table_name, $pdo );

		$state = [
			'database_analysis' => [
				'tables' => [
					[
						'name'   => $table_name,
						'rows'   => 0,
						'size'   => 0,
						'chunks' => 1,
					],
				],
				'totalSize'   => 0,
				'totalChunks' => 1,
			],
			'current_table'   => 0,
			'current_offset'  => 0,
			'bytes_converted' => 0,
		];

		// Act.
		$result = $this->converter->convert_chunk( $job_id, $pdo, $state );

		// Assert: Should move to next table immediately.
		$this->assertTrue( $result['complete'], 'Should mark as complete for empty table' );

		// Cleanup.
		$wpdb->query( "DROP TABLE IF EXISTS $table_name" );
	}

	/**
	 * Test: Insert rows should handle WordPress serialized data correctly.
	 *
	 * @since 1.0.0
	 * @covers ::insert_rows
	 * @return void
	 */
	public function test_insert_rows_preserves_serialized_data(): void {
		// Arrange.
		global $wpdb;
		$table = $wpdb->prefix . 'options';
		$pdo   = $this->converter->create_sqlite_database( $this->temp_sqlite_path );

		// Create table schema.
		$this->converter->convert_table_schema( $table, $pdo );

		// Prepare test data with serialized content.
		$serialized_data = serialize( [ 'key' => 'value', 'nested' => [ 'a' => 'b' ] ] );
		$rows            = [
			[
				'option_id'    => 1,
				'option_name'  => 'test_option',
				'option_value' => $serialized_data,
				'autoload'     => 'yes',
			],
		];

		// Act.
		$this->converter->insert_rows( $table, $rows, $pdo );

		// Assert: Verify data was inserted correctly.
		$stmt   = $pdo->prepare( "SELECT option_value FROM $table WHERE option_name = ?" );
		$stmt->execute( [ 'test_option' ] );
		$result = $stmt->fetchColumn();

		$this->assertEquals( $serialized_data, $result, 'Serialized data should be preserved exactly' );
		$this->assertIsArray( unserialize( $result ), 'Data should be unserializable' );
	}

	/**
	 * Test: Insert rows should handle binary data (BLOBs) correctly.
	 *
	 * @since 1.0.0
	 * @covers ::insert_rows
	 * @return void
	 */
	public function test_insert_rows_handles_binary_data(): void {
		// Arrange: Create a test table with BLOB column.
		global $wpdb;
		$table_name = $wpdb->prefix . 'aether_test_blob';

		$wpdb->query(
			"CREATE TABLE IF NOT EXISTS $table_name (
				id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				binary_data mediumblob,
				PRIMARY KEY (id)
			)"
		);

		$pdo = $this->converter->create_sqlite_database( $this->temp_sqlite_path );
		$this->converter->convert_table_schema( $table_name, $pdo );

		// Generate random binary data.
		$binary_data = random_bytes( 1024 );
		$rows        = [
			[
				'id'          => 1,
				'binary_data' => $binary_data,
			],
		];

		// Act.
		$this->converter->insert_rows( $table_name, $rows, $pdo );

		// Assert: Verify binary data is preserved.
		$stmt   = $pdo->prepare( "SELECT binary_data FROM $table_name WHERE id = ?" );
		$stmt->execute( [ 1 ] );
		$result = $stmt->fetchColumn();

		$this->assertEquals( $binary_data, $result, 'Binary data should be preserved exactly' );

		// Cleanup.
		$wpdb->query( "DROP TABLE IF EXISTS $table_name" );
	}

	/**
	 * Test: Finalize database should create indexes and vacuum.
	 *
	 * @since 1.0.0
	 * @covers ::finalize_database
	 * @return void
	 */
	public function test_finalize_database_creates_indexes(): void {
		// Arrange.
		global $wpdb;
		$table = $wpdb->prefix . 'posts';
		$pdo   = $this->converter->create_sqlite_database( $this->temp_sqlite_path );

		// Create table schema.
		$this->converter->convert_table_schema( $table, $pdo );

		// Get file size before vacuum.
		$size_before = filesize( $this->temp_sqlite_path );

		// Act.
		$result = $this->converter->finalize_database( $pdo, [ $table ] );

		// Assert.
		$this->assertIsArray( $result, 'Result should be an array' );
		$this->assertArrayHasKey( 'success', $result, 'Should include success flag' );
		$this->assertTrue( $result['success'], 'Finalization should succeed' );

		// Verify indexes exist.
		$indexes = $pdo->query( "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='$table'" )->fetchAll();
		$this->assertNotEmpty( $indexes, 'Table should have indexes' );

		// Note: Vacuum may or may not reduce file size depending on data, so we just verify it runs.
		$this->assertFileExists( $this->temp_sqlite_path, 'Database file should still exist after vacuum' );
	}

	/**
	 * Test: Format bytes should return human-readable sizes.
	 *
	 * @since 1.0.0
	 * @covers ::format_bytes
	 * @dataProvider bytes_formatting_provider
	 * @param int    $bytes Input bytes.
	 * @param string $expected Expected formatted string.
	 * @return void
	 */
	public function test_format_bytes( int $bytes, string $expected ): void {
		// Act.
		$formatted = $this->converter->format_bytes( $bytes );

		// Assert.
		$this->assertEquals( $expected, $formatted, "Should format $bytes bytes correctly" );
	}

	/**
	 * Data provider for bytes formatting tests.
	 *
	 * @since 1.0.0
	 * @return array<string, array<int, int|string>>
	 */
	public function bytes_formatting_provider(): array {
		return [
			'bytes'     => [ 512, '512 B' ],
			'kilobytes' => [ 2048, '2 KB' ],
			'megabytes' => [ 5242880, '5 MB' ],
			'gigabytes' => [ 2147483648, '2 GB' ],
		];
	}

	/**
	 * Test: Complete conversion workflow for small database.
	 *
	 * Integration test that verifies the entire conversion process.
	 *
	 * @since 1.0.0
	 * @covers ::analyze_database
	 * @covers ::create_sqlite_database
	 * @covers ::convert_table_schema
	 * @covers ::convert_chunk
	 * @covers ::finalize_database
	 * @return void
	 */
	public function test_complete_conversion_workflow(): void {
		// Arrange: Create test data.
		global $wpdb;
		$option_name  = 'aether_test_option_' . time();
		$option_value = serialize( [ 'test' => 'data', 'number' => 42 ] );
		add_option( $option_name, $option_value );

		// Step 1: Analyze database.
		$analysis = $this->converter->analyze_database();
		$this->assertNotEmpty( $analysis['tables'], 'Should have tables to convert' );

		// Step 2: Create SQLite database.
		$pdo = $this->converter->create_sqlite_database( $this->temp_sqlite_path );
		$this->assertFileExists( $this->temp_sqlite_path, 'SQLite database should be created' );

		// Step 3: Convert all table schemas.
		foreach ( $analysis['tables'] as $table_info ) {
			$this->converter->convert_table_schema( $table_info['name'], $pdo );
		}

		// Step 4: Convert data in chunks.
		$job_id = 'test_job_' . time();
		$state  = [
			'database_analysis' => $analysis,
			'current_table'     => 0,
			'current_offset'    => 0,
			'bytes_converted'   => 0,
		];

		$max_iterations = 100; // Safety limit.
		$iterations     = 0;
		$complete       = false;

		while ( ! $complete && $iterations < $max_iterations ) {
			$result   = $this->converter->convert_chunk( $job_id, $pdo, $state );
			$complete = $result['complete'];

			// Update state for next iteration.
			$state['current_table']   = $result['currentTableIndex'] ?? $state['current_table'];
			$state['current_offset']  = $result['currentOffset'] ?? 0;
			$state['bytes_converted'] = $result['bytesConverted'] ?? $state['bytes_converted'];

			$iterations++;
		}

		$this->assertTrue( $complete, 'Conversion should complete' );
		$this->assertLessThan( $max_iterations, $iterations, 'Should not hit iteration limit' );

		// Step 5: Finalize database.
		$table_names      = array_column( $analysis['tables'], 'name' );
		$finalize_result = $this->converter->finalize_database( $pdo, $table_names );
		$this->assertTrue( $finalize_result['success'], 'Finalization should succeed' );

		// Verify: Check that test data exists in SQLite.
		$options_table = $wpdb->prefix . 'options';
		$stmt          = $pdo->prepare( "SELECT option_value FROM $options_table WHERE option_name = ?" );
		$stmt->execute( [ $option_name ] );
		$sqlite_value = $stmt->fetchColumn();

		$this->assertNotFalse( $sqlite_value, 'Test option should exist in SQLite database' );
		$this->assertEquals( $option_value, $sqlite_value, 'Option value should match exactly' );

		// Cleanup.
		delete_option( $option_name );
	}
}
