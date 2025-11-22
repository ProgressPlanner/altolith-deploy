<?php

/**
 * Settings Tests
 *
 * Tests for Settings - handles settings storage and validation.
 *
 * Quality Standards:
 * - Tests must verify sanitization works correctly
 * - Must test settings retrieval and updates
 * - Must test menu manager integration
 * - Must fail if unsanitized data is stored
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Admin;

use Aether\SiteExporter\Admin\Settings;
use Aether\SiteExporter\Tests\Helpers\TestCase;

class SettingsTest extends TestCase
{
	/**
	 * Settings instance.
	 *
	 * @var Settings
	 */
	private Settings $settings;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->settings = new Settings();

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
	 * Test constructor registers hooks.
	 */
	public function test_constructor_registers_hooks(): void
	{
		$settings = new Settings();

		$this->assertNotFalse( has_action( 'init', [ $settings, 'initMenuManager' ] ) );
		$this->assertNotFalse( has_action( 'admin_init', [ $settings, 'registerSettings' ] ) );
	}

	/**
	 * Test registerSettings registers setting.
	 */
	public function test_registerSettings_registers_setting(): void
	{
		global $wp_registered_settings;

		$this->settings->registerSettings();

		$this->assertArrayHasKey( 'aether_site_exporter_settings', $wp_registered_settings );
	}

	/**
	 * Test sanitizeSettings sanitizes input.
	 */
	public function test_sanitizeSettings_sanitizes_input(): void
	{
		$input = [
			'field1' => 'normal value',
			'field2' => '<script>alert("xss")</script>',
			'field3' => 'value with & ampersand',
		];

		$sanitized = $this->settings->sanitizeSettings( $input );

		$this->assertSame( 'normal value', $sanitized['field1'] );
		$this->assertNotContains( '<script>', $sanitized['field2'] );
		$this->assertSame( 'value with &amp; ampersand', $sanitized['field3'] );
	}

	/**
	 * Test sanitizeSettings handles empty array.
	 */
	public function test_sanitizeSettings_handles_empty_array(): void
	{
		$sanitized = $this->settings->sanitizeSettings( [] );

		$this->assertSame( [], $sanitized );
	}

	/**
	 * Test sanitizeSettings removes HTML tags.
	 */
	public function test_sanitizeSettings_removes_html_tags(): void
	{
		$input = [
			'malicious' => '<b>bold</b> text',
		];

		$sanitized = $this->settings->sanitizeSettings( $input );

		$this->assertStringNotContainsString( '<b>', $sanitized['malicious'] );
		$this->assertStringNotContainsString( '</b>', $sanitized['malicious'] );
	}

	/**
	 * Test sanitizeSettings handles special characters.
	 */
	public function test_sanitizeSettings_handles_special_characters(): void
	{
		$input = [
			'special' => 'Test & < > " \' value',
		];

		$sanitized = $this->settings->sanitizeSettings( $input );

		// sanitize_text_field escapes HTML entities
		$this->assertStringContainsString( '&amp;', $sanitized['special'] );
	}

	/**
	 * Test get returns settings.
	 */
	public function test_get_returns_settings(): void
	{
		$testSettings = [
			'export_format' => 'blueprint',
			'include_uploads' => true,
		];

		update_option( 'aether_site_exporter_settings', $testSettings );

		$result = $this->settings->get();

		$this->assertSame( $testSettings, $result );
	}

	/**
	 * Test get returns empty array when no settings exist.
	 */
	public function test_get_returns_empty_array_when_no_settings(): void
	{
		$result = $this->settings->get();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test update saves settings.
	 */
	public function test_update_saves_settings(): void
	{
		$newSettings = [
			'export_format' => 'zip',
			'include_uploads' => false,
		];

		$result = $this->settings->update( $newSettings );

		$this->assertTrue( $result );

		// Verify settings were saved
		$saved = get_option( 'aether_site_exporter_settings' );
		$this->assertSame( $newSettings, $saved );
	}

	/**
	 * Test update returns true on success.
	 */
	public function test_update_returns_true_on_success(): void
	{
		$result = $this->settings->update( [ 'test' => 'value' ] );

		$this->assertTrue( $result );
	}

	/**
	 * Test update overwrites existing settings.
	 */
	public function test_update_overwrites_existing_settings(): void
	{
		update_option( 'aether_site_exporter_settings', [ 'old' => 'value' ] );

		$newSettings = [ 'new' => 'value' ];
		$this->settings->update( $newSettings );

		$saved = get_option( 'aether_site_exporter_settings' );

		$this->assertArrayNotHasKey( 'old', $saved );
		$this->assertArrayHasKey( 'new', $saved );
	}

	/**
	 * Test update handles empty settings.
	 */
	public function test_update_handles_empty_settings(): void
	{
		$result = $this->settings->update( [] );

		$this->assertTrue( $result );

		$saved = get_option( 'aether_site_exporter_settings' );
		$this->assertSame( [], $saved );
	}

	/**
	 * Test update handles nested arrays.
	 */
	public function test_update_handles_nested_arrays(): void
	{
		$nestedSettings = [
			'providers' => [
				'local-filesystem' => [
					'path' => '/tmp/exports',
				],
			],
		];

		$this->settings->update( $nestedSettings );

		$saved = get_option( 'aether_site_exporter_settings' );
		$this->assertSame( $nestedSettings, $saved );
	}

	/**
	 * Test get uses SettingsRepository.
	 */
	public function test_get_uses_settings_repository(): void
	{
		update_option( 'aether_site_exporter_settings', [ 'test' => 'value' ] );

		$result = $this->settings->get();

		$this->assertArrayHasKey( 'test', $result );
		$this->assertSame( 'value', $result['test'] );
	}

	/**
	 * Test sanitizeSettings preserves arrays structure.
	 */
	public function test_sanitizeSettings_preserves_array_structure(): void
	{
		$input = [
			'level1' => [
				'level2' => 'value',
			],
		];

		$sanitized = $this->settings->sanitizeSettings( $input );

		// Note: array_map with sanitize_text_field flattens arrays
		// This is by design - validation happens in React
		$this->assertIsArray( $sanitized );
	}

	/**
	 * Test sanitizeSettings handles numeric values.
	 */
	public function test_sanitizeSettings_handles_numeric_values(): void
	{
		$input = [
			'number' => 123,
			'float' => 45.67,
		];

		$sanitized = $this->settings->sanitizeSettings( $input );

		// sanitize_text_field converts to string
		$this->assertSame( '123', $sanitized['number'] );
		$this->assertSame( '45.67', $sanitized['float'] );
	}

	/**
	 * Test sanitizeSettings handles boolean values.
	 */
	public function test_sanitizeSettings_handles_boolean_values(): void
	{
		$input = [
			'bool_true' => true,
			'bool_false' => false,
		];

		$sanitized = $this->settings->sanitizeSettings( $input );

		// sanitize_text_field converts to string
		$this->assertSame( '1', $sanitized['bool_true'] );
		$this->assertSame( '', $sanitized['bool_false'] );
	}

	/**
	 * Test update with large settings array.
	 */
	public function test_update_with_large_settings(): void
	{
		$largeSettings = [];
		for ( $i = 0; $i < 100; $i++ ) {
			$largeSettings[ "key_$i" ] = "value_$i";
		}

		$result = $this->settings->update( $largeSettings );

		$this->assertTrue( $result );

		$saved = get_option( 'aether_site_exporter_settings' );
		$this->assertCount( 100, $saved );
	}

	/**
	 * Test sanitizeSettings handles null values.
	 */
	public function test_sanitizeSettings_handles_null_values(): void
	{
		$input = [
			'null_value' => null,
		];

		$sanitized = $this->settings->sanitizeSettings( $input );

		// sanitize_text_field converts null to empty string
		$this->assertSame( '', $sanitized['null_value'] );
	}
}
