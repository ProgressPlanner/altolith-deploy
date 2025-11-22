<?php

/**
 * URL Discovery REST Controller
 *
 * Provides paginated endpoints for discovering URLs for static site generation.
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
			'/urls/posts',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getPosts' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => $this->getPaginationArgs(),
			]
		);

		\register_rest_route(
			$this->getNamespace(),
			'/urls/terms',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getTerms' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => $this->getPaginationArgs(),
			]
		);

		\register_rest_route(
			$this->getNamespace(),
			'/urls/authors',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getAuthors' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => $this->getPaginationArgs(),
			]
		);

		\register_rest_route(
			$this->getNamespace(),
			'/urls/archives',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getArchives' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Get pagination arguments for endpoints.
	 *
	 * @return array<string, array<string, mixed>> Pagination arguments.
	 */
	private function getPaginationArgs(): array
	{
		return [
			'page' => [
				'description'       => 'Page number',
				'type'              => 'integer',
				'default'           => 1,
				'minimum'           => 1,
				'sanitize_callback' => 'absint',
			],
		];
	}

	/**
	 * Get post URLs (all public post types).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with URLs.
	 */
	public function getPosts(WP_REST_Request $request): WP_REST_Response
	{
		$page = $request->get_param('page') ?? 1;
		$offset = ($page - 1) * self::PER_PAGE;

		// Get all public post types (post, page, custom post types)
		$postTypes = \get_post_types(['public' => true], 'names');
		$postTypesArray = \array_values($postTypes);

		// Query posts
		$posts = \get_posts([
			'post_type'      => $postTypesArray,
			'post_status'    => 'publish',
			'posts_per_page' => self::PER_PAGE,
			'offset'         => $offset,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
		]);

		// Generate permalinks
		$urls = [];
		foreach ($posts as $postId) {
			$permalink = \get_permalink($postId);
			if ($permalink) {
				$urls[] = $permalink;
			}
		}

		// Check if there are more posts
		$totalPosts = $this->getTotalPostsCount($postTypesArray);
		$hasMore = ($offset + \count($posts)) < $totalPosts;

		return new WP_REST_Response([
			'success'  => true,
			'urls'     => $urls,
			'hasMore'  => $hasMore,
			'nextPage' => $hasMore ? $page + 1 : null,
			'total'    => $totalPosts,
		], 200);
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
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with URLs.
	 */
	public function getTerms(WP_REST_Request $request): WP_REST_Response
	{
		$page = $request->get_param('page') ?? 1;
		$offset = ($page - 1) * self::PER_PAGE;

		// Get all public taxonomies
		$taxonomies = \get_taxonomies(['public' => true], 'names');
		$taxonomiesArray = \array_values($taxonomies);

		// Query terms
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

		// Check if there are more terms
		$totalTerms = $this->getTotalTermsCount($taxonomiesArray);
		$hasMore = ($offset + \count($urls)) < $totalTerms;

		return new WP_REST_Response([
			'success'  => true,
			'urls'     => $urls,
			'hasMore'  => $hasMore,
			'nextPage' => $hasMore ? $page + 1 : null,
			'total'    => $totalTerms,
		], 200);
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
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with URLs.
	 */
	public function getAuthors(WP_REST_Request $request): WP_REST_Response
	{
		$page = $request->get_param('page') ?? 1;
		$offset = ($page - 1) * self::PER_PAGE;

		// Query authors who can create content
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

		// Check if there are more authors
		$totalAuthors = $this->getTotalAuthorsCount();
		$hasMore = ($offset + \count($authors)) < $totalAuthors;

		return new WP_REST_Response([
			'success'  => true,
			'urls'     => $urls,
			'hasMore'  => $hasMore,
			'nextPage' => $hasMore ? $page + 1 : null,
			'total'    => $totalAuthors,
		], 200);
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
	 * Get archive URLs (CPT archives, date archives).
	 *
	 * Not paginated as these are typically few.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with URLs.
	 */
	public function getArchives(WP_REST_Request $request): WP_REST_Response // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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

		// Date archives (last 12 months)
		global $wpdb;

		$monthsWithPosts = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT DISTINCT YEAR(post_date) as year, MONTH(post_date) as month
				FROM {$wpdb->posts}
				WHERE post_status = %s
				AND post_type = %s
				AND post_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
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

		return new WP_REST_Response([
			'success'  => true,
			'urls'     => $urls,
			'hasMore'  => false,
			'nextPage' => null,
			'total'    => \count($urls),
		], 200);
	}
}
