<?php
/**
 * Tests for StaticSiteGenerator
 *
 * Following TDD principles - these tests define the INTENDED functionality.
 *
 * @package AetherSiteExporter\Tests\Unit\Services
 */

declare(strict_types=1);

namespace AetherSiteExporter\Tests\Unit\Services;

use AetherSiteExporter\Services\StaticSiteGenerator;
use WP_UnitTestCase;

/**
 * StaticSiteGenerator test case.
 *
 * @since 1.0.0
 * @coversDefaultClass \AetherSiteExporter\Services\StaticSiteGenerator
 */
class StaticSiteGeneratorTest extends WP_UnitTestCase
{
	/**
	 * Generator instance.
	 *
	 * @var StaticSiteGenerator
	 */
	private StaticSiteGenerator $generator;

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

		$this->generator = new StaticSiteGenerator();
		$this->temp_dir = \sys_get_temp_dir() . '/static_test_' . \uniqid();
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
	 * Test: Should discover URLs from site.
	 *
	 * @since 1.0.0
	 * @covers ::discover_urls
	 * @return void
	 */
	public function test_discovers_urls_from_site(): void
	{
		// Arrange: Create test posts.
		$post_id_1 = $this->factory()->post->create(['post_title' => 'Test Post 1']);
		$post_id_2 = $this->factory()->post->create(['post_title' => 'Test Post 2']);

		// Act.
		$urls = $this->generator->discover_urls();

		// Assert.
		$this->assertIsArray($urls, 'Should return array of URLs');
		$this->assertNotEmpty($urls, 'Should discover at least home URL');
		$this->assertContains(\home_url('/'), $urls, 'Should include home URL');
	}

	/**
	 * Test: Should include posts and pages in URL discovery.
	 *
	 * @since 1.0.0
	 * @covers ::discover_urls
	 * @return void
	 */
	public function test_includes_posts_and_pages_in_discovery(): void
	{
		// Arrange.
		$post_id = $this->factory()->post->create(['post_status' => 'publish']);
		$page_id = $this->factory()->post->create(['post_type' => 'page', 'post_status' => 'publish']);

		// Act.
		$urls = $this->generator->discover_urls();

		// Assert.
		$this->assertContains(\get_permalink($post_id), $urls, 'Should include post URL');
		$this->assertContains(\get_permalink($page_id), $urls, 'Should include page URL');
	}

	/**
	 * Test: Should generate static HTML file from URL.
	 *
	 * @since 1.0.0
	 * @covers ::generate_static_file
	 * @return void
	 */
	public function test_generates_static_html_file(): void
	{
		// Arrange.
		$url = \home_url('/');
		$target_url = 'https://example.com';

		// Act.
		$result = $this->generator->generate_static_file($url, $this->temp_dir, $target_url);

		// Assert.
		$this->assertTrue($result['success'], 'Should successfully generate file');
		$this->assertFileExists($this->temp_dir . '/index.html', 'Should create index.html');
	}

	/**
	 * Test: Should rewrite URLs in HTML content.
	 *
	 * @since 1.0.0
	 * @covers ::rewrite_urls
	 * @return void
	 */
	public function test_rewrites_urls_in_html(): void
	{
		// Arrange.
		$html = '<a href="' . \home_url('/about') . '">About</a>';
		$target_url = 'https://example.com';

		// Act.
		$rewritten = $this->generator->rewrite_urls($html, $target_url);

		// Assert.
		$this->assertStringContainsString('https://example.com/about', $rewritten, 'Should rewrite site URLs');
		$this->assertStringNotContainsString(\home_url(), $rewritten, 'Should not contain original site URL');
	}

	/**
	 * Test: Should create directory structure for URLs.
	 *
	 * @since 1.0.0
	 * @covers ::generate_static_file
	 * @return void
	 */
	public function test_creates_directory_structure(): void
	{
		// Arrange.
		$url = \home_url('/category/news/');

		// Act.
		$this->generator->generate_static_file($url, $this->temp_dir, 'https://example.com');

		// Assert.
		$this->assertDirectoryExists($this->temp_dir . '/category/news', 'Should create nested directory');
		$this->assertFileExists($this->temp_dir . '/category/news/index.html', 'Should create index.html in directory');
	}

	/**
	 * Test: Should handle URLs with trailing slashes.
	 *
	 * @since 1.0.0
	 * @covers ::generate_static_file
	 * @return void
	 */
	public function test_handles_trailing_slashes(): void
	{
		// Arrange.
		$url_with_slash = \home_url('/about/');
		$url_without_slash = \home_url('/contact');

		// Act.
		$result1 = $this->generator->generate_static_file($url_with_slash, $this->temp_dir . '/1', 'https://example.com');
		$result2 = $this->generator->generate_static_file($url_without_slash, $this->temp_dir . '/2', 'https://example.com');

		// Assert.
		$this->assertFileExists($this->temp_dir . '/1/about/index.html', 'URL with slash should create directory');
		$this->assertTrue($result2['success'], 'URL without slash should succeed');
	}

	/**
	 * Test: Should return success when copying uploads.
	 *
	 * @since 1.0.0
	 * @covers ::copy_uploads
	 * @return void
	 */
	public function test_copies_uploads_directory(): void
	{
		// Act.
		$result = $this->generator->copy_uploads($this->temp_dir);

		// Assert - just verify it returns success (actual copying tested in integration tests).
		$this->assertTrue($result['success'], 'Should return success');
		$this->assertArrayHasKey('success', $result, 'Result should have success key');
	}

	/**
	 * Test: Should create ZIP of static site.
	 *
	 * @since 1.0.0
	 * @covers ::create_static_zip
	 * @return void
	 */
	public function test_creates_static_site_zip(): void
	{
		// Arrange.
		\wp_mkdir_p($this->temp_dir . '/static');
		\file_put_contents($this->temp_dir . '/static/index.html', '<html></html>');

		$zip_path = $this->temp_dir . '/static-site.zip';

		// Act.
		$result = $this->generator->create_static_zip($this->temp_dir . '/static', $zip_path);

		// Assert.
		$this->assertTrue($result['success'], 'Should successfully create ZIP');
		$this->assertFileExists($zip_path, 'ZIP file should exist');
		$this->assertArrayHasKey('size', $result, 'Result should include size');
		$this->assertGreaterThan(0, $result['size'], 'ZIP size should be greater than 0');
	}

	/**
	 * Test: Should remove admin bar from HTML.
	 *
	 * @since 1.0.0
	 * @covers ::remove_admin_bar
	 * @return void
	 */
	public function test_removes_admin_bar_from_html(): void
	{
		// Arrange.
		$html = '<div id="wpadminbar">Admin</div><div>Content</div>';

		// Act.
		$cleaned = $this->generator->remove_admin_bar($html);

		// Assert.
		$this->assertStringNotContainsString('wpadminbar', $cleaned, 'Should remove admin bar');
		$this->assertStringContainsString('Content', $cleaned, 'Should preserve other content');
	}

	/**
	 * Test: Should return progress information.
	 *
	 * @since 1.0.0
	 * @covers ::generate_static_site
	 * @return void
	 */
	public function test_returns_progress_information(): void
	{
		// Arrange.
		$config = [
			'targetUrl' => 'https://example.com',
			'maxUrls'   => 2,
		];

		// Create test posts.
		$this->factory()->post->create(['post_status' => 'publish']);

		// Act.
		$result = $this->generator->generate_static_site($this->temp_dir, $config);

		// Assert.
		$this->assertArrayHasKey('progress', $result, 'Should include progress');
		$this->assertArrayHasKey('totalUrls', $result, 'Should include total URLs');
		$this->assertArrayHasKey('processedUrls', $result, 'Should include processed URLs');
	}

	/**
	 * Test: Should respect maxUrls configuration.
	 *
	 * @since 1.0.0
	 * @covers ::generate_static_site
	 * @return void
	 */
	public function test_respects_max_urls_limit(): void
	{
		// Arrange.
		$config = [
			'targetUrl' => 'https://example.com',
			'maxUrls'   => 2,
		];

		// Create multiple posts.
		for ($i = 0; $i < 10; $i++) {
			$this->factory()->post->create(['post_status' => 'publish']);
		}

		// Act.
		$result = $this->generator->generate_static_site($this->temp_dir, $config);

		// Assert.
		$this->assertLessThanOrEqual(2, $result['processedUrls'], 'Should not exceed maxUrls limit');
	}
}
