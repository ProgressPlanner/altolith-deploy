<?php

/**
 * URL Discovery REST Controller
 *
 * Provides a consolidated endpoint for discovering URLs for static site generation.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;

/**
 * URL Discovery REST endpoints.
 */
class URLDiscoveryController
{
	use RESTHelpersTrait;

	/**
	 * Number of items per page.
	 */
	private const PER_PAGE = 500;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		\register_rest_route(
			$this->getNamespace(),
			'/urls/discover',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'discoverUrls' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => $this->getDiscoverArgs(),
			]
		);
	}

	/**
	 * Get arguments for the discover endpoint.
	 *
	 * @return array<string, array<string, mixed>> Endpoint arguments.
	 */
	private function getDiscoverArgs(): array
	{
		return [
			'page' => [
				'description'       => 'Page number for paginated results',
				'type'              => 'integer',
				'default'           => 1,
				'minimum'           => 1,
				'sanitize_callback' => 'absint',
			],
			'types' => [
				'description'       => 'URL types to discover',
				'type'              => 'array',
				'default'           => [ 'posts', 'terms', 'authors', 'archives', 'pagination' ],
				'items'             => [ 'type' => 'string' ],
				'sanitize_callback' => function ($types) {
					if (!\is_array($types)) {
						return ['posts', 'terms', 'authors', 'archives', 'pagination'];
					}
					$valid = ['posts', 'terms', 'authors', 'archives', 'pagination'];
					return \array_values(\array_intersect($types, $valid));
				},
			],
		];
	}

	/**
	 * Discover URLs for static site generation.
	 *
	 * Consolidated endpoint that replaces the previous separate endpoints.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with URLs.
	 */
	public function discoverUrls(WP_REST_Request $request): WP_REST_Response
	{
		$page = $request->get_param('page') ?? 1;
		$types = $request->get_param('types') ?? [ 'posts', 'terms', 'authors', 'archives', 'pagination' ];
		$offset = ($page - 1) * self::PER_PAGE;

		$allUrls = [];
		$totals = [];

		// Collect URLs from each requested type
		if (\in_array('posts', $types, true)) {
			$postUrls = $this->getPostUrls($offset);
			$allUrls = \array_merge($allUrls, $postUrls['urls']);
			$totals['posts'] = $postUrls['total'];
		}

		if (\in_array('terms', $types, true)) {
			$termUrls = $this->getTermUrls($offset);
			$allUrls = \array_merge($allUrls, $termUrls['urls']);
			$totals['terms'] = $termUrls['total'];
		}

		if (\in_array('authors', $types, true)) {
			$authorUrls = $this->getAuthorUrls($offset);
			$allUrls = \array_merge($allUrls, $authorUrls['urls']);
			$totals['authors'] = $authorUrls['total'];
		}

		if (\in_array('archives', $types, true)) {
			$archiveUrls = $this->getArchiveUrls();
			$allUrls = \array_merge($allUrls, $archiveUrls);
			$totals['archives'] = \count($archiveUrls);
		}

		if (\in_array('pagination', $types, true)) {
			$paginationUrls = $this->getPaginationUrls();
			$allUrls = \array_merge($allUrls, $paginationUrls);
			$totals['pagination'] = \count($paginationUrls);
		}

		// Calculate if there are more results
		$totalItems = \array_sum($totals);
		$hasMore = ($offset + self::PER_PAGE) < $totalItems;

		// Deduplicate URLs
		$uniqueUrls = \array_values(\array_unique($allUrls));

		return new WP_REST_Response([
			'success'  => true,
			'urls'     => $uniqueUrls,
			'hasMore'  => $hasMore,
			'nextPage' => $hasMore ? $page + 1 : null,
			'total'    => $totalItems,
		], 200);
	}

	/**
	 * Get post URLs (all public post types).
	 *
	 * @param int $offset Query offset.
	 * @return array{urls: array<string>, total: int} URLs and total count.
	 */
	private function getPostUrls(int $offset): array
	{
		$postTypes = \get_post_types(['public' => true], 'names');
		$postTypesArray = \array_values($postTypes);

		$posts = \get_posts([
			'post_type'      => $postTypesArray,
			'post_status'    => 'publish',
			'posts_per_page' => self::PER_PAGE,
			'offset'         => $offset,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
		]);

		$urls = [];
		foreach ($posts as $postId) {
			$permalink = \get_permalink($postId);
			if ($permalink) {
				$urls[] = $permalink;
			}
		}

		return [
			'urls'  => $urls,
			'total' => $this->getTotalPostsCount($postTypesArray),
		];
	}

	/**
	 * Get total count of posts with publish status for given post types.
	 *
	 * @param array<string> $postTypes Post types to count.
	 * @return int Total count.
	 */
	private function getTotalPostsCount(array $postTypes): int
	{
		global $wpdb;

		$placeholders = \implode(',', \array_fill(0, \count($postTypes), '%s'));

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQL.NotPrepared
		$query = $wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type IN ({$placeholders}) AND post_status = %s",
			...\array_merge($postTypes, ['publish'])
		);

		return (int) $wpdb->get_var($query);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQL.NotPrepared
	}

	/**
	 * Get term URLs (categories, tags, custom taxonomies).
	 *
	 * @param int $offset Query offset.
	 * @return array{urls: array<string>, total: int} URLs and total count.
	 */
	private function getTermUrls(int $offset): array
	{
		$taxonomies = \get_taxonomies(['public' => true], 'names');
		$taxonomiesArray = \array_values($taxonomies);

		$terms = \get_terms([
			'taxonomy'   => $taxonomiesArray,
			'hide_empty' => true,
			'number'     => self::PER_PAGE,
			'offset'     => $offset,
			'orderby'    => 'term_id',
			'order'      => 'ASC',
		]);

		$urls = [];
		if (! \is_wp_error($terms)) {
			foreach ($terms as $term) {
				$termLink = \get_term_link($term);
				if (! \is_wp_error($termLink)) {
					$urls[] = $termLink;
				}
			}
		}

		return [
			'urls'  => $urls,
			'total' => $this->getTotalTermsCount($taxonomiesArray),
		];
	}

	/**
	 * Get total count of non-empty terms for given taxonomies.
	 *
	 * @param array<string> $taxonomies Taxonomies to count.
	 * @return int Total count.
	 */
	private function getTotalTermsCount(array $taxonomies): int
	{
		$count = \wp_count_terms([
			'taxonomy'   => $taxonomies,
			'hide_empty' => true,
		]);

		return \is_wp_error($count) ? 0 : (int) $count;
	}

	/**
	 * Get author URLs.
	 *
	 * @param int $offset Query offset.
	 * @return array{urls: array<string>, total: int} URLs and total count.
	 */
	private function getAuthorUrls(int $offset): array
	{
		$authors = \get_users([
			'capability' => 'edit_posts',
			'number'     => self::PER_PAGE,
			'offset'     => $offset,
			'orderby'    => 'ID',
			'order'      => 'ASC',
		]);

		$urls = [];
		foreach ($authors as $author) {
			$urls[] = \get_author_posts_url($author->ID);
		}

		return [
			'urls'  => $urls,
			'total' => $this->getTotalAuthorsCount(),
		];
	}

	/**
	 * Get total count of authors with edit_posts capability.
	 *
	 * @return int Total count.
	 */
	private function getTotalAuthorsCount(): int
	{
		$query = new \WP_User_Query([
			'capability'   => 'edit_posts',
			'count_total'  => true,
			'number'       => 0,
		]);

		return $query->get_total();
	}

	/**
	 * Get archive URLs (homepage, CPT archives, date archives).
	 *
	 * @return array<string> Archive URLs.
	 */
	private function getArchiveUrls(): array
	{
		$urls = [];

		// Homepage
		$urls[] = \home_url('/');

		// Custom post type archives
		$postTypes = \get_post_types([
			'public'   => true,
			'_builtin' => false,
		], 'objects');

		foreach ($postTypes as $postType) {
			if ($postType->has_archive) {
				$archiveLink = \get_post_type_archive_link($postType->name);
				if ($archiveLink) {
					$urls[] = $archiveLink;
				}
			}
		}

		// Date archives (all months with posts, not just last 12)
		global $wpdb;

		$monthsWithPosts = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT DISTINCT YEAR(post_date) as year, MONTH(post_date) as month
				FROM {$wpdb->posts}
				WHERE post_status = %s
				AND post_type = %s
				ORDER BY post_date DESC",
				'publish',
				'post'
			)
		);

		if (\is_array($monthsWithPosts)) {
			foreach ($monthsWithPosts as $monthData) {
				$archiveUrl = \get_month_link((int) $monthData->year, (int) $monthData->month);
				if ($archiveUrl) {
					$urls[] = $archiveUrl;
				}
			}
		}

		return $urls;
	}

	/**
	 * Get pagination URLs for archives.
	 *
	 * Calculates pagination URLs for blog, categories, tags, authors, and CPT archives.
	 *
	 * @return array<string> Pagination URLs.
	 */
	private function getPaginationUrls(): array
	{
		$urls = [];
		$postsPerPage = (int) \get_option('posts_per_page', 10);

		// Category pagination
		$urls = \array_merge($urls, $this->getCategoryPaginationUrls($postsPerPage));

		// Tag pagination
		$urls = \array_merge($urls, $this->getTagPaginationUrls($postsPerPage));

		// Author pagination
		$urls = \array_merge($urls, $this->getAuthorPaginationUrls($postsPerPage));

		// CPT archive pagination
		$urls = \array_merge($urls, $this->getCptArchivePaginationUrls($postsPerPage));

		// Date archive pagination
		$urls = \array_merge($urls, $this->getDateArchivePaginationUrls($postsPerPage));

		return $urls;
	}

	/**
	 * Get category archive pagination URLs.
	 *
	 * @param int $postsPerPage Posts per page setting.
	 * @return array<string> Pagination URLs.
	 */
	private function getCategoryPaginationUrls(int $postsPerPage): array
	{
		$urls = [];
		$categories = \get_categories(['hide_empty' => true]);

		foreach ($categories as $category) {
			$totalPages = (int) \ceil($category->count / $postsPerPage);
			$categoryLink = \get_term_link($category);

			if (\is_wp_error($categoryLink)) {
				continue;
			}

			for ($i = 2; $i <= $totalPages; $i++) {
				$urls[] = \trailingslashit($categoryLink) . 'page/' . $i . '/';
			}
		}

		return $urls;
	}

	/**
	 * Get tag archive pagination URLs.
	 *
	 * @param int $postsPerPage Posts per page setting.
	 * @return array<string> Pagination URLs.
	 */
	private function getTagPaginationUrls(int $postsPerPage): array
	{
		$urls = [];
		$tags = \get_tags(['hide_empty' => true]);

		if (!\is_array($tags)) {
			return $urls;
		}

		foreach ($tags as $tag) {
			$totalPages = (int) \ceil($tag->count / $postsPerPage);
			$tagLink = \get_term_link($tag);

			if (\is_wp_error($tagLink)) {
				continue;
			}

			for ($i = 2; $i <= $totalPages; $i++) {
				$urls[] = \trailingslashit($tagLink) . 'page/' . $i . '/';
			}
		}

		return $urls;
	}

	/**
	 * Get author archive pagination URLs.
	 *
	 * @param int $postsPerPage Posts per page setting.
	 * @return array<string> Pagination URLs.
	 */
	private function getAuthorPaginationUrls(int $postsPerPage): array
	{
		$urls = [];
		$authors = \get_users(['capability' => 'edit_posts']);

		foreach ($authors as $author) {
			$postCount = (int) \count_user_posts($author->ID, 'post', true);
			$totalPages = (int) \ceil($postCount / \min(1, (int) $postsPerPage));
			$authorLink = \get_author_posts_url($author->ID);

			for ($i = 2; $i <= $totalPages; $i++) {
				$urls[] = \trailingslashit($authorLink) . 'page/' . $i . '/';
			}
		}

		return $urls;
	}

	/**
	 * Get CPT archive pagination URLs.
	 *
	 * @param int $postsPerPage Posts per page setting.
	 * @return array<string> Pagination URLs.
	 */
	private function getCptArchivePaginationUrls(int $postsPerPage): array
	{
		$urls = [];
		$postTypes = \get_post_types([
			'public'   => true,
			'_builtin' => false,
		], 'objects');

		foreach ($postTypes as $postType) {
			if (!$postType->has_archive) {
				continue;
			}

			$postCount = (int) \wp_count_posts($postType->name)->publish;
			$totalPages = (int) \ceil($postCount / $postsPerPage);
			$archiveLink = \get_post_type_archive_link($postType->name);

			if (!$archiveLink) {
				continue;
			}

			for ($i = 2; $i <= $totalPages; $i++) {
				$urls[] = \trailingslashit($archiveLink) . 'page/' . $i . '/';
			}
		}

		return $urls;
	}

	/**
	 * Get date archive pagination URLs.
	 *
	 * @param int $postsPerPage Posts per page setting.
	 * @return array<string> Pagination URLs.
	 */
	private function getDateArchivePaginationUrls(int $postsPerPage): array
	{
		$urls = [];
		global $wpdb;

		// Get all months with posts and their post counts
		$monthsWithPosts = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT YEAR(post_date) as year, MONTH(post_date) as month, COUNT(*) as count
				FROM {$wpdb->posts}
				WHERE post_status = %s
				AND post_type = %s
				GROUP BY YEAR(post_date), MONTH(post_date)
				ORDER BY post_date DESC",
				'publish',
				'post'
			)
		);

		if (!\is_array($monthsWithPosts)) {
			return $urls;
		}

		foreach ($monthsWithPosts as $monthData) {
			$totalPages = (int) \ceil((int) $monthData->count / $postsPerPage);
			$baseUrl = \get_month_link((int) $monthData->year, (int) $monthData->month);

			if (!$baseUrl) {
				continue;
			}

			for ($i = 2; $i <= $totalPages; $i++) {
				$urls[] = \trailingslashit($baseUrl) . 'page/' . $i . '/';
			}
		}

		return $urls;
	}
}
