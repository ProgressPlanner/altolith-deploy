<?php
/**
 * Tests for BlueprintBundleExporter
 *
 * Following TDD principles - these tests define the INTENDED functionality.
 *
 * @package AetherSiteExporter\Tests\Unit\Services
 */

declare(strict_types=1);

namespace AetherSiteExporter\Tests\Unit\Services;

use AetherSiteExporter\Services\BlueprintBundleExporter;
use WP_UnitTestCase;

/**
 * BlueprintBundleExporter test case.
 *
 * @since 1.0.0
 * @coversDefaultClass \AetherSiteExporter\Services\BlueprintBundleExporter
 */
class BlueprintBundleExporterTest extends WP_UnitTestCase
{
	/**
	 * Exporter instance.
	 *
	 * @var BlueprintBundleExporter
	 */
	private BlueprintBundleExporter $exporter;

	/**
	 * Temporary directory for test files.
	 *
	 * @var string
	 */
	private string $temp_dir;

	/**
	 * Set up test environment.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function set_up(): void
	{
		parent::set_up();

		$this->exporter = new BlueprintBundleExporter();
		$this->temp_dir = \sys_get_temp_dir() . '/blueprint_test_' . \uniqid();
		\wp_mkdir_p($this->temp_dir);
	}

	/**
	 * Tear down test environment.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function tear_down(): void
	{
		// Clean up temp directory.
		if (\is_dir($this->temp_dir)) {
			$this->delete_directory($this->temp_dir);
		}

		parent::tear_down();
	}

	/**
	 * Recursively delete a directory.
	 *
	 * @param string $dir Directory path.
	 * @return void
	 */
	private function delete_directory(string $dir): void
	{
		if (! \is_dir($dir)) {
			return;
		}

		$files = \array_diff(\scandir($dir), ['.', '..']);
		foreach ($files as $file) {
			$path = $dir . '/' . $file;
			\is_dir($path) ? $this->delete_directory($path) : \unlink($path);
		}
		\rmdir($dir);
	}

	/**
	 * Test: Should create blueprint.json with basic structure.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_create_blueprint_json(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/database.sqlite';
		\file_put_contents($sqlite_db_path, 'mock sqlite data');

		$config = [
			'landingPage' => '/',
		];

		// Act.
		$result = $this->exporter->create_blueprint($sqlite_db_path, $this->temp_dir, $config);

		// Assert.
		$this->assertTrue($result['success'], 'Blueprint creation should succeed');
		$this->assertFileExists($this->temp_dir . '/blueprint.json', 'blueprint.json should be created');

		$blueprint = \json_decode(\file_get_contents($this->temp_dir . '/blueprint.json'), true);
		$this->assertIsArray($blueprint, 'blueprint.json should contain valid JSON');
		$this->assertEquals('/', $blueprint['landingPage'], 'Landing page should be set');
		$this->assertArrayHasKey('steps', $blueprint, 'Blueprint should have steps array');
	}

	/**
	 * Test: Blueprint should include SQLite database import step.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_blueprint_includes_sqlite_import(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/database.sqlite';
		\file_put_contents($sqlite_db_path, 'mock sqlite data');

		// Act.
		$this->exporter->create_blueprint($sqlite_db_path, $this->temp_dir, []);

		// Assert.
		$blueprint = \json_decode(\file_get_contents($this->temp_dir . '/blueprint.json'), true);
		$steps = $blueprint['steps'];

		// Find SQLite import step.
		$sqlite_step = null;
		foreach ($steps as $step) {
			if (isset($step['step']) && 'importWordPressFiles' === $step['step']) {
				$sqlite_step = $step;
				break;
			}
		}

		$this->assertNotNull($sqlite_step, 'Blueprint should include SQLite import step');
		$this->assertEquals('bundled', $sqlite_step['wordPressFilesZip']['resource'], 'Should use bundled resource');
	}

	/**
	 * Test: Should copy SQLite database to bundle directory.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_copies_sqlite_database_to_bundle(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/source/database.sqlite';
		\wp_mkdir_p(\dirname($sqlite_db_path));
		\file_put_contents($sqlite_db_path, 'mock sqlite data');

		$bundle_dir = $this->temp_dir . '/bundle';

		// Act.
		$this->exporter->create_blueprint($sqlite_db_path, $bundle_dir, []);

		// Assert.
		$this->assertFileExists($bundle_dir . '/database.sqlite', 'SQLite database should be copied to bundle');
		$this->assertEquals(
			\file_get_contents($sqlite_db_path),
			\file_get_contents($bundle_dir . '/database.sqlite'),
			'Copied database should match source'
		);
	}

	/**
	 * Test: Should create bundle ZIP file.
	 *
	 * @since 1.0.0
	 * @covers ::create_bundle_zip
	 * @return void
	 */
	public function test_creates_bundle_zip(): void
	{
		// Arrange.
		$bundle_dir = $this->temp_dir . '/bundle';
		\wp_mkdir_p($bundle_dir);
		\file_put_contents($bundle_dir . '/blueprint.json', '{"landingPage":"/"}');
		\file_put_contents($bundle_dir . '/database.sqlite', 'mock data');

		$zip_path = $this->temp_dir . '/bundle.zip';

		// Act.
		$result = $this->exporter->create_bundle_zip($bundle_dir, $zip_path);

		// Assert.
		$this->assertTrue($result['success'], 'ZIP creation should succeed');
		$this->assertFileExists($zip_path, 'ZIP file should be created');

		// Verify ZIP contents.
		$zip = new \ZipArchive();
		$zip->open($zip_path);

		$this->assertEquals('blueprint.json', $zip->getNameIndex(0), 'blueprint.json should be first entry');
		$this->assertNotFalse($zip->locateName('wordpress-files.zip'), 'wordpress-files.zip should be in ZIP');

		$zip->close();
	}

	/**
	 * Test: Should include wp-content directory if provided.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_includes_wp_content_directory(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/database.sqlite';
		\file_put_contents($sqlite_db_path, 'mock data');

		$wp_content_dir = $this->temp_dir . '/wp-content';
		\wp_mkdir_p($wp_content_dir . '/uploads');
		\file_put_contents($wp_content_dir . '/uploads/test.jpg', 'mock image');

		$config = [
			'includeWpContent' => true,
			'wpContentPath'    => $wp_content_dir,
		];

		// Act.
		$result = $this->exporter->create_blueprint($sqlite_db_path, $this->temp_dir, $config);

		// Assert.
		$this->assertTrue($result['success']);
		$this->assertDirectoryExists($this->temp_dir . '/wp-content', 'wp-content should be copied to bundle');
		$this->assertFileExists($this->temp_dir . '/wp-content/uploads/test.jpg', 'wp-content files should be copied');
	}

	/**
	 * Test: Should handle missing SQLite database error.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_handles_missing_sqlite_database(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/nonexistent.sqlite';

		// Act.
		$result = $this->exporter->create_blueprint($sqlite_db_path, $this->temp_dir, []);

		// Assert.
		$this->assertFalse($result['success'], 'Should fail when SQLite database does not exist');
		$this->assertStringContainsString('not found', $result['error'], 'Error message should mention missing file');
	}

	/**
	 * Test: Should create bundle directory if it does not exist.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_creates_bundle_directory_if_not_exists(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/database.sqlite';
		\file_put_contents($sqlite_db_path, 'mock data');

		$bundle_dir = $this->temp_dir . '/new/bundle/dir';

		// Act.
		$this->exporter->create_blueprint($sqlite_db_path, $bundle_dir, []);

		// Assert.
		$this->assertDirectoryExists($bundle_dir, 'Bundle directory should be created');
		$this->assertFileExists($bundle_dir . '/blueprint.json', 'blueprint.json should be in new directory');
	}

	/**
	 * Test: Should include plugins configuration in blueprint.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_includes_plugins_in_blueprint(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/database.sqlite';
		\file_put_contents($sqlite_db_path, 'mock data');

		$config = [
			'plugins' => ['akismet', 'jetpack'],
		];

		// Act.
		$this->exporter->create_blueprint($sqlite_db_path, $this->temp_dir, $config);

		// Assert.
		$blueprint = \json_decode(\file_get_contents($this->temp_dir . '/blueprint.json'), true);

		// Find installPlugin steps.
		$plugin_steps = \array_filter(
			$blueprint['steps'],
			function ($step) {
				return isset($step['step']) && 'installPlugin' === $step['step'];
			}
		);

		$this->assertCount(2, $plugin_steps, 'Should have 2 plugin installation steps');
	}

	/**
	 * Test: Should set custom landing page.
	 *
	 * @since 1.0.0
	 * @covers ::create_blueprint
	 * @return void
	 */
	public function test_sets_custom_landing_page(): void
	{
		// Arrange.
		$sqlite_db_path = $this->temp_dir . '/database.sqlite';
		\file_put_contents($sqlite_db_path, 'mock data');

		$config = [
			'landingPage' => '/wp-admin/',
		];

		// Act.
		$this->exporter->create_blueprint($sqlite_db_path, $this->temp_dir, $config);

		// Assert.
		$blueprint = \json_decode(\file_get_contents($this->temp_dir . '/blueprint.json'), true);
		$this->assertEquals('/wp-admin/', $blueprint['landingPage'], 'Custom landing page should be set');
	}

	/**
	 * Test: ZIP should have blueprint.json as first entry.
	 *
	 * @since 1.0.0
	 * @covers ::create_bundle_zip
	 * @return void
	 */
	public function test_zip_has_blueprint_json_first(): void
	{
		// Arrange.
		$bundle_dir = $this->temp_dir . '/bundle';
		\wp_mkdir_p($bundle_dir);
		\file_put_contents($bundle_dir . '/blueprint.json', '{"landingPage":"/"}');
		\file_put_contents($bundle_dir . '/other-file.txt', 'test');
		\file_put_contents($bundle_dir . '/database.sqlite', 'data');

		$zip_path = $this->temp_dir . '/bundle.zip';

		// Act.
		$this->exporter->create_bundle_zip($bundle_dir, $zip_path);

		// Assert.
		$zip = new \ZipArchive();
		$zip->open($zip_path);

		$this->assertEquals('blueprint.json', $zip->getNameIndex(0), 'blueprint.json must be the first entry in ZIP');

		$zip->close();
	}

	/**
	 * Test: Should return bundle size in result.
	 *
	 * @since 1.0.0
	 * @covers ::create_bundle_zip
	 * @return void
	 */
	public function test_returns_bundle_size(): void
	{
		// Arrange.
		$bundle_dir = $this->temp_dir . '/bundle';
		\wp_mkdir_p($bundle_dir);
		\file_put_contents($bundle_dir . '/blueprint.json', '{"landingPage":"/"}');

		$zip_path = $this->temp_dir . '/bundle.zip';

		// Act.
		$result = $this->exporter->create_bundle_zip($bundle_dir, $zip_path);

		// Assert.
		$this->assertArrayHasKey('size', $result, 'Result should include size');
		$this->assertIsInt($result['size'], 'Size should be an integer');
		$this->assertGreaterThan(0, $result['size'], 'Size should be greater than 0');
	}
}
