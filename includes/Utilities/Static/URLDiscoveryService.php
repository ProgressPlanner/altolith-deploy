<?php

/**
 * URL Discovery Service
 *
 * Discovers all URLs on the WordPress site that need to be converted to static HTML.
 * Uses a crawling approach to find internal links and WordPress-specific URL patterns.
 *
 * @package Aether\Utilities\Static
 */

namespace Aether\SiteExporter\Utilities\Static;

use Aether\Utilities\HTTPClient;

/**
 * Discovers all URLs for static site generation.
 */
class URLDiscoveryService
{
	/**
	 * Queue of URLs to crawl.
	 *
	 * @var array<string>
	 */
	private $queue = [];

	/**
	 * URLs that have been crawled.
	 *
	 * @var array<string, bool>
	 */
	private $crawled = [];

	/**
	 * Discovered URLs ready for static generation.
	 *
	 * @var array<string>
	 */
	private $discovered = [];

	/**
	 * Site URL for filtering internal links.
	 *
	 * @var string
	 */
	private $siteUrl;

	/**
	 * Maximum number of URLs to crawl (prevents infinite loops and timeouts).
	 *
	 * @var integer
	 */
	private $maxCrawlLimit = 100;

	/**
	 * Whether to enable crawling (disabled by default for performance).
	 * Crawling can cause memory issues and timeouts in WordPress Playground.
	 *
	 * @var boolean
	 */
	private $enableCrawling = false;

	/**
	 * URLs to exclude from crawling.
	 *
	 * @var array<string>
	 */
	private $excludePatterns = [
		'wp-admin',
		'wp-login',
		'wp-json',
		'xmlrpc.php',
		'wp-cron.php',
		'/feed/',
		'/trackback/',
		'?replytocom=',
		'#comment-',
	];

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$this->siteUrl = \home_url();
	}

	/**
	 * Discover all URLs on the site.
	 *
	 * @return array<string> All discovered URLs.
	 */
	public function discoverAllUrls(): array
	{

		// Start with homepage.
		$this->addToQueue($this->siteUrl);

		// Add common WordPress URLs.
		$this->addCommonWordpressUrls();

		// Only crawl if enabled (disabled by default for performance).
		// Crawling can cause memory issues and timeouts in WordPress Playground.
		if ($this->enableCrawling) {
			// Crawl until queue is empty or we hit the limit.
			// Limit prevents infinite loops and timeouts in WordPress Playground.
			$crawlCount = 0;
			while (! empty($this->queue) && $crawlCount < $this->maxCrawlLimit) {
				$url = \array_shift($this->queue);
				$this->crawlUrl($url);
				$crawlCount++;
			}
		} else {
			// If crawling is disabled, just add all queued URLs to discovered list.
			// This is faster and uses less memory - perfect for WordPress Playground.
			foreach ($this->queue as $url) {
				if (! \in_array($url, $this->discovered, true)) {
					$this->discovered[] = $url;
				}
			}
		}


		return $this->discovered;
	}

	/**
	 * Add common WordPress URLs to the queue.
	 *
	 * @return void
	 */
	private function addCommonWordpressUrls(): void
	{
		// Query all published blog posts for static site generation.
		// Using 'fields' => 'ids' for performance - we only need IDs to generate permalinks,
		// not full post objects. This significantly reduces memory usage for large sites.
		// posts_per_page => -1 retrieves all posts (no pagination limit).
		$posts = \get_posts(
			[
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			]
		);

		// Generate permalink for each post and add to crawl queue.
		// get_permalink() respects permalink structure settings (e.g., /%year%/%monthnum%/%postname%/).
		foreach ($posts as $postId) {
			$permalink = \get_permalink($postId);
			if ($permalink) {
				$this->addToQueue($permalink);
			}
		}

		// Query all published pages (hierarchical content).
		// Pages are separate from posts and typically used for static content (About, Contact, etc).
		// Same performance optimization as posts - only fetch IDs.
		$pages = \get_posts(
			[
				'post_type'      => 'page',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			]
		);

		// Generate permalink for each page and add to crawl queue.
		foreach ($pages as $pageId) {
			$permalink = \get_permalink($pageId);
			if ($permalink) {
				$this->addToQueue($permalink);
			}
		}

		// Add category archive pages (/category/technology/, etc).
		// hide_empty => true excludes categories with no posts, reducing crawl size.
		// Category archives are essential for WordPress blog navigation.
		$categories = \get_categories([ 'hide_empty' => true ]);
		foreach ($categories as $category) {
			$this->addToQueue(\get_category_link($category->term_id));
		}

		// Add tag archive pages (/tag/php/, etc).
		// hide_empty => true excludes tags with no posts.
		// Check for WP_Error since get_tags() can fail if term table has issues.
		$tags = \get_tags([ 'hide_empty' => true ]);
		if (! \is_wp_error($tags)) {
			foreach ($tags as $tag) {
				$this->addToQueue(\get_tag_link($tag->term_id));
			}
		}

		// Add custom post type archives (e.g., /products/, /portfolio/).
		// Only include public custom post types that have archive pages enabled.
		// _builtin => false excludes WordPress core post types (post, page, attachment, etc).
		// This ensures we capture plugin-defined post types like WooCommerce products.
		$postTypes = \get_post_types(
			[
				'public' => true,
				'_builtin' => false,
			],
			'objects'
		);
		foreach ($postTypes as $postType) {
			// Only add archive if the post type supports archive pages (has_archive => true).
			if ($postType->has_archive) {
				$archiveLink = \get_post_type_archive_link($postType->name);
				if ($archiveLink) {
					$this->addToQueue($archiveLink);
				}
			}
		}

		// Add author archive pages (/author/john-doe/).
		// Only include users who can create content (edit_posts capability).
		// This excludes subscribers who have no author pages.
		$authors = \get_users([ 'capability' => 'edit_posts' ]);
		foreach ($authors as $author) {
			$this->addToQueue(\get_author_posts_url($author->ID));
		}

		// Add date-based archive pages (/2024/01/, /2024/02/, etc).
		// Iterate through last 12 months from current date.
		// Only creates archives for months that actually have published posts.
		$currentYear  = (int) \gmdate('Y');
		$currentMonth = (int) \gmdate('m');

		// Loop backwards from current month through last 12 months.
		for ($i = 0; $i < 12; $i++) {
			$month = $currentMonth - $i;
			$year  = $currentYear;

			// Handle month underflow (e.g., if current month is January, go to December of previous year).
			if ($month <= 0) {
				$month += 12;
				--$year;
			}

			// Check if any posts exist for this specific month.
			// posts_per_page => 1 is sufficient - we just need to know if ANY posts exist.
			// This prevents creating empty archive pages that would show "No posts found".
			$postsExist = \get_posts(
				[
				 'post_type'      => 'post',
				 'post_status'    => 'publish',
				 'posts_per_page' => 1,
				 'fields'         => 'ids',
				 'year'           => $year,
				 'monthnum'       => $month,
				]
			);

			// Only create archive page if posts exist for this month.
			if (! empty($postsExist)) {
				$archiveUrl = \get_month_link($year, $month);
				if ($archiveUrl) {
					$this->addToQueue($archiveUrl);
				}
			}
		}
	}

	/**
	 * Crawl a URL and extract links.
	 *
	 * @param string $url URL to crawl.
	 * @return void
	 */
	private function crawlUrl(string $url): void
	{
		// Skip if already crawled.
		if (isset($this->crawled[ $url ])) {
			return;
		}

		// Mark as crawled.
		$this->crawled[ $url ] = true;

		// Add to discovered URLs.
		if (! \in_array($url, $this->discovered, true)) {
			$this->discovered[] = $url;
		}


		// Fetch the page.
		// Reduced timeout for WordPress Playground compatibility (can be slow).
		$result = HTTPClient::get(
			$url,
			[
				'timeout'    => 10, // Reduced from 30 to 10 seconds for Playground
				'user-agent' => 'Aether Static Site Generator',
			]
		);

		if (! $result['success'] || empty($result['body'])) {
			return;
		}

		$html = $result['body'];

		// Extract links from HTML.
		$links = $this->extractLinks($html);

		// Add internal links to queue.
		foreach ($links as $link) {
			if ($this->isInternalUrl($link) && $this->shouldCrawl($link)) {
				$this->addToQueue($link);
			}
		}

		// Check for pagination.
		$this->checkPagination($html, $url);
	}

	/**
	 * Extract all links from HTML.
	 *
	 * @param string $html HTML content.
	 * @return array<string> Extracted URLs.
	 */
	private function extractLinks(string $html): array
	{
		$links = [];

		// Extract <a href> links.
		if (\preg_match_all('/<a\s+[^>]*href=["\'](.*?)["\']/i', $html, $matches)) {
			$links = \array_merge($links, $matches[1]);
		}

		// Extract navigation menu links.
		if (\preg_match_all('/<nav[^>]*>.*?<\/nav>/is', $html, $navMatches)) {
			foreach ($navMatches[0] as $navHtml) {
				if (\preg_match_all('/<a\s+[^>]*href=["\'](.*?)["\']/i', $navHtml, $navLinks)) {
					$links = \array_merge($links, $navLinks[1]);
				}
			}
		}

		// Normalize and clean links.
		$links = \array_map([ $this, 'normalizeUrl' ], $links);
		$links = \array_filter($links); // Remove empty.
		$links = \array_unique($links);

		return $links;
	}

	/**
	 * Check for pagination links in HTML.
	 *
	 * @param string $html HTML content.
	 * @param string $baseUrl Base URL being crawled.
	 * @return void
	 */
	private function checkPagination(string $html, string $baseUrl): void
	{
		// Look for pagination patterns.
		$paginationPatterns = [
			'/page\/(\d+)/',
			'/\?paged=(\d+)/',
			'/<a[^>]+class=["\'][^"\']*page-numbers[^"\']*["\'][^>]+href=["\'](.*?)["\']/i',
		];

		foreach ($paginationPatterns as $pattern) {
			if (\preg_match_all($pattern, $html, $matches)) {
				foreach ($matches[1] as $match) {
					if (\filter_var($match, FILTER_VALIDATE_URL)) {
						$this->addToQueue($match);
					}
				}
			}
		}
	}

	/**
	 * Add URL to the crawl queue.
	 *
	 * @param string $url URL to add.
	 * @return void
	 */
	private function addToQueue(string $url): void
	{
		$normalized = $this->normalizeUrl($url);

		if (empty($normalized)) {
			return;
		}

		// Skip if already queued or crawled.
		if (\in_array($normalized, $this->queue, true) || isset($this->crawled[ $normalized ])) {
			return;
		}

		$this->queue[] = $normalized;
	}

	/**
	 * Normalize a URL.
	 *
	 * @param string $url URL to normalize.
	 * @return string Normalized URL.
	 */
	private function normalizeUrl(string $url): string
	{
		// Handle relative URLs.
		if (\str_starts_with($url, '/') && ! \str_starts_with($url, '//')) {
			$url = $this->siteUrl . $url;
		}

		// Remove URL fragments.
		$urlWithoutFragment = \strtok($url, '#');
		$url                  = false !== $urlWithoutFragment ? $urlWithoutFragment : $url;

		// Remove trailing slashes for consistency.
		$url = \rtrim($url, '/');

		// Ensure valid URL.
		if (! \filter_var($url, FILTER_VALIDATE_URL)) {
			return '';
		}

		return $url;
	}

	/**
	 * Check if URL is internal to this site.
	 *
	 * @param string $url URL to check.
	 * @return bool True if internal.
	 */
	private function isInternalUrl(string $url): bool
	{
		$urlHost  = \wp_parse_url($url, PHP_URL_HOST);
		$siteHost = \wp_parse_url($this->siteUrl, PHP_URL_HOST);

		return $urlHost === $siteHost;
	}

	/**
	 * Check if URL should be crawled.
	 *
	 * @param string $url URL to check.
	 * @return bool True if should crawl.
	 */
	private function shouldCrawl(string $url): bool
	{
		foreach ($this->excludePatterns as $pattern) {
			if (\str_contains($url, $pattern)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get crawl statistics.
	 *
	 * @return array<string, int> Statistics.
	 */
	public function getStats(): array
	{
		return [
			'discovered' => \count($this->discovered),
			'crawled'    => \count($this->crawled),
			'queued'     => \count($this->queue),
		];
	}
}
