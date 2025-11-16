<?php

/**
 * Static Site Generator Service
 *
 * Generates static HTML files from WordPress content.
 * Discovers URLs, fetches HTML, rewrites URLs, and creates static file structure.
 *
 * @package AetherSiteExporter\Services
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\Services;

use WP_Query;
use ZipArchive;

// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- No database queries in this class.

/**
 * Static site generator service.
 *
 * @since 1.0.0
 */
class StaticSiteGenerator
{
	/**
	 * Discover all URLs to export.
	 *
	 * @since 1.0.0
	 * @return array List of URLs.
	 */
	public function discover_urls(): array
	{
		$urls = [];

		// Home page.
		$urls[] = \home_url('/');

		// Get all published posts and pages.
		$query = new WP_Query([
			'post_type'      => ['post', 'page'],
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
		]);

		foreach ($query->posts as $post) {
			$permalink = \get_permalink($post);
			if ($permalink) {
				$urls[] = $permalink;
			}
		}

		return \array_unique($urls);
	}

	/**
	 * Generate static file from URL.
	 *
	 * @since 1.0.0
	 * @param string $url        Source URL.
	 * @param string $output_dir Output directory.
	 * @param string $target_url Target URL for rewriting.
	 * @return array{success: bool, error?: string} Result.
	 */
	public function generate_static_file(string $url, string $output_dir, string $target_url): array
	{
		// Fetch HTML content.
		$response = \wp_remote_get($url);

		if (\is_wp_error($response)) {
			return [
				'success' => false,
				'error'   => $response->get_error_message(),
			];
		}

		$html = \wp_remote_retrieve_body($response);

		// Rewrite URLs.
		$html = $this->rewrite_urls($html, $target_url);

		// Remove admin bar.
		$html = $this->remove_admin_bar($html);

		// Determine file path.
		$path = $this->url_to_file_path($url, $output_dir);

		// Create directory if needed.
		$dir = \dirname($path);
		if (! \is_dir($dir)) {
			\wp_mkdir_p($dir);
		}

		// Write file.
		\file_put_contents($path, $html);

		return ['success' => true];
	}

	/**
	 * Convert URL to file path.
	 *
	 * @since 1.0.0
	 * @param string $url        URL.
	 * @param string $output_dir Output directory.
	 * @return string File path.
	 */
	private function url_to_file_path(string $url, string $output_dir): string
	{
		$parsed = \wp_parse_url($url);
		$path = $parsed['path'] ?? '/';

		// Normalize path.
		$path = \trim($path, '/');

		// If path is empty (home) or ends with /, create index.html in directory.
		if (empty($path) || \str_ends_with($url, '/')) {
			return $output_dir . '/' . $path . '/index.html';
		}

		// Otherwise, create .html file.
		return $output_dir . '/' . $path . '.html';
	}

	/**
	 * Rewrite URLs in HTML content.
	 *
	 * @since 1.0.0
	 * @param string $html       HTML content.
	 * @param string $target_url Target URL.
	 * @return string Rewritten HTML.
	 */
	public function rewrite_urls(string $html, string $target_url): string
	{
		$home_url = \untrailingslashit(\home_url());
		$target_url = \untrailingslashit($target_url);

		// Replace site URL with target URL.
		$html = \str_replace($home_url, $target_url, $html);

		return $html;
	}

	/**
	 * Remove admin bar from HTML.
	 *
	 * @since 1.0.0
	 * @param string $html HTML content.
	 * @return string Cleaned HTML.
	 */
	public function remove_admin_bar(string $html): string
	{
		// Remove admin bar div.
		$html = \preg_replace('/<div[^>]*id=["\']wpadminbar["\'][^>]*>.*?<\/div>/is', '', $html);

		return $html;
	}

	/**
	 * Copy uploads directory to static site.
	 *
	 * @since 1.0.0
	 * @param string $output_dir Output directory.
	 * @return array{success: bool} Result.
	 */
	public function copy_uploads(string $output_dir): array
	{
		$upload_dir = \wp_upload_dir();
		$source = $upload_dir['basedir'];
		$dest = $output_dir . '/wp-content/uploads';

		if (! \is_dir($source)) {
			return ['success' => true]; // No uploads to copy.
		}

		$this->copy_directory($source, $dest);

		return ['success' => true];
	}

	/**
	 * Create ZIP of static site.
	 *
	 * @since 1.0.0
	 * @param string $source_dir Source directory.
	 * @param string $zip_path   Output ZIP path.
	 * @return array{success: bool, size?: int, error?: string} Result.
	 */
	public function create_static_zip(string $source_dir, string $zip_path): array
	{
		$zip = new ZipArchive();

		if (true !== $zip->open($zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
			return [
				'success' => false,
				'error'   => 'Failed to create ZIP file',
			];
		}

		$this->add_directory_to_zip($zip, $source_dir, '');

		$zip->close();

		return [
			'success' => true,
			'size'    => \filesize($zip_path),
		];
	}

	/**
	 * Generate complete static site.
	 *
	 * @since 1.0.0
	 * @param string $output_dir Output directory.
	 * @param array  $config     Configuration.
	 * @return array Progress information.
	 */
	public function generate_static_site(string $output_dir, array $config): array
	{
		$target_url = $config['targetUrl'] ?? \home_url();
		$max_urls = $config['maxUrls'] ?? 0;

		// Discover URLs.
		$urls = $this->discover_urls();
		$total_urls = \count($urls);

		// Limit URLs if maxUrls is set.
		if ($max_urls > 0) {
			$urls = \array_slice($urls, 0, $max_urls);
		}

		$processed = 0;

		// Generate static files.
		foreach ($urls as $url) {
			$this->generate_static_file($url, $output_dir, $target_url);
			$processed++;
		}

		// Copy uploads.
		$this->copy_uploads($output_dir);

		return [
			'success'       => true,
			'totalUrls'     => $total_urls,
			'processedUrls' => $processed,
			'progress'      => $processed > 0 ? (int) (($processed / \count($urls)) * 100) : 100,
		];
	}

	/**
	 * Copy directory recursively.
	 *
	 * @since 1.0.0
	 * @param string $source Source directory.
	 * @param string $dest   Destination directory.
	 * @return void
	 */
	private function copy_directory(string $source, string $dest): void
	{
		if (! \is_dir($source)) {
			return;
		}

		if (! \is_dir($dest)) {
			\wp_mkdir_p($dest);
		}

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS),
			\RecursiveIteratorIterator::SELF_FIRST
		);

		foreach ($files as $file) {
			$file_path = $file->getRealPath();
			if (false === $file_path) {
				continue;
			}

			$relative_path = \substr($file_path, \strlen($source) + 1);
			$dest_path = $dest . '/' . $relative_path;

			if ($file->isDir()) {
				if (! \is_dir($dest_path)) {
					\wp_mkdir_p($dest_path);
				}
			} else {
				$dest_dir = \dirname($dest_path);
				if (! \is_dir($dest_dir)) {
					\wp_mkdir_p($dest_dir);
				}
				\copy($file_path, $dest_path);
			}
		}
	}

	/**
	 * Add directory contents to ZIP recursively.
	 *
	 * @since 1.0.0
	 * @param ZipArchive $zip        ZIP archive.
	 * @param string     $source_dir Source directory.
	 * @param string     $zip_path   Path inside ZIP.
	 * @return void
	 */
	private function add_directory_to_zip(ZipArchive $zip, string $source_dir, string $zip_path): void
	{
		if (! \is_dir($source_dir)) {
			return;
		}

		$source_dir = \rtrim($source_dir, '/');

		$files = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($source_dir, \RecursiveDirectoryIterator::SKIP_DOTS),
			\RecursiveIteratorIterator::LEAVES_ONLY
		);

		foreach ($files as $file) {
			if (! $file->isFile()) {
				continue;
			}

			$file_path = $file->getRealPath();
			if (false === $file_path) {
				continue;
			}

			$relative_path = \substr($file_path, \strlen($source_dir) + 1);

			$zip_file_path = $zip_path ? $zip_path . '/' . $relative_path : $relative_path;
			$zip->addFile($file_path, $zip_file_path);
		}
	}
}
