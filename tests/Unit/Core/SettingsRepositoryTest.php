<?php

/**
 * Settings Repository Tests
 *
 * Tests for SettingsRepository - simple wrapper around WordPress options.
 *
 * Quality Standards:
 * - Tests must verify settings retrieval works correctly
 * - Must test handling of corrupted/invalid data
 * - Must test default values
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Core;

use Aether\SiteExporter\Core\SettingsRepository;
use Aether\SiteExporter\Tests\Helpers\TestCase;

class SettingsRepositoryTest extends TestCase
{
	/**
	 * Repository instance.
	 *
	 * @var SettingsRepository
	 */
	private SettingsRepository $repository;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->repository = new SettingsRepository();

		// Clear any existing settings
		delete_option( 'aether_site_exporter_settings' );
	}

	/**
	 * Tear down test environment.
	 */
	public function tearDown(): void
	{
		delete_option( 'aether_site_exporter_settings' );

		parent::tearDown();
	}

	/**
	 * Test getAll returns empty array when no settings exist.
	 */
	public function test_getAll_returns_empty_array_when_no_settings(): void
	{
		$result = $this->repository->getAll();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test getAll returns settings array.
	 */
	public function test_getAll_returns_settings_array(): void
	{
		$settings = [
			'export_format' => 'blueprint',
			'include_uploads' => true,
			'providers' => [
				'local-filesystem' => [
					'path' => '/tmp/exports',
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		$result = $this->repository->getAll();

		$this->assertSame( $settings, $result );
	}

	/**
	 * Test getAll handles corrupted settings gracefully.
	 */
	public function test_getAll_handles_corrupted_settings(): void
	{
		// Store non-array value (corrupted data)
		update_option( 'aether_site_exporter_settings', 'not-an-array' );

		$result = $this->repository->getAll();

		// Should return empty array instead of crashing
		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test getAll handles null value.
	 */
	public function test_getAll_handles_null_value(): void
	{
		update_option( 'aether_site_exporter_settings', null );

		$result = $this->repository->getAll();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test getAll handles boolean value.
	 */
	public function test_getAll_handles_boolean_value(): void
	{
		update_option( 'aether_site_exporter_settings', false );

		$result = $this->repository->getAll();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test getAll preserves nested arrays.
	 */
	public function test_getAll_preserves_nested_arrays(): void
	{
		$settings = [
			'level1' => [
				'level2' => [
					'level3' => 'deep-value',
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		$result = $this->repository->getAll();

		$this->assertSame( $settings, $result );
		$this->assertSame( 'deep-value', $result['level1']['level2']['level3'] );
	}

	/**
	 * Test getAll preserves all data types.
	 */
	public function test_getAll_preserves_data_types(): void
	{
		$settings = [
			'string_value' => 'test',
			'int_value' => 123,
			'float_value' => 45.67,
			'bool_true' => true,
			'bool_false' => false,
			'null_value' => null,
			'array_value' => [ 1, 2, 3 ],
		];

		update_option( 'aether_site_exporter_settings', $settings );

		$result = $this->repository->getAll();

		$this->assertSame( 'test', $result['string_value'] );
		$this->assertSame( 123, $result['int_value'] );
		$this->assertSame( 45.67, $result['float_value'] );
		$this->assertTrue( $result['bool_true'] );
		$this->assertFalse( $result['bool_false'] );
		$this->assertNull( $result['null_value'] );
		$this->assertSame( [ 1, 2, 3 ], $result['array_value'] );
	}

	/**
	 * Test getAll returns fresh data (no caching).
	 */
	public function test_getAll_returns_fresh_data(): void
	{
		$settings1 = [ 'version' => 1 ];
		update_option( 'aether_site_exporter_settings', $settings1 );

		$result1 = $this->repository->getAll();
		$this->assertSame( 1, $result1['version'] );

		// Update settings
		$settings2 = [ 'version' => 2 ];
		update_option( 'aether_site_exporter_settings', $settings2 );

		// Should return updated data (no caching)
		$result2 = $this->repository->getAll();
		$this->assertSame( 2, $result2['version'] );
	}

	/**
	 * Test getAll handles large settings arrays.
	 */
	public function test_getAll_handles_large_settings(): void
	{
		// Create large settings array
		$settings = [];
		for ( $i = 0; $i < 1000; $i++ ) {
			$settings[ "key_$i" ] = "value_$i";
		}

		update_option( 'aether_site_exporter_settings', $settings );

		$result = $this->repository->getAll();

		$this->assertCount( 1000, $result );
		$this->assertSame( 'value_500', $result['key_500'] );
	}

	/**
	 * Test getAll handles special characters in keys and values.
	 */
	public function test_getAll_handles_special_characters(): void
	{
		$settings = [
			'key-with-dash' => 'value',
			'key_with_underscore' => 'value',
			'key.with.dot' => 'value',
			'unicode_key' => 'Unicode value: 日本語',
			'special_chars' => '<>&"\'',
		];

		update_option( 'aether_site_exporter_settings', $settings );

		$result = $this->repository->getAll();

		$this->assertSame( 'value', $result['key-with-dash'] );
		$this->assertSame( 'value', $result['key_with_underscore'] );
		$this->assertSame( 'value', $result['key.with.dot'] );
		$this->assertSame( 'Unicode value: 日本語', $result['unicode_key'] );
		$this->assertSame( '<>&"\'', $result['special_chars'] );
	}
}
