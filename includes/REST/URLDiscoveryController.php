<?php

/**
 * URL Discovery REST Controller
 *
 * Provides a consolidated endpoint for discovering URLs for static site generation.
 *
 * @package Altolith\REST
 */

namespace Altolith\Deploy\REST;

use WP_REST_Request;
use WP_REST_Response;

/**
 * URL Discovery REST endpoints.
 */
class URLDiscoveryController
{
	use RESTHelpersTrait;

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
			'types' => [
				'description'       => 'URL types to discover',
				'type'              => 'array',
				'default'           => [ 'posts', 'terms', 'authors', 'archives' ],
				'items'             => [ 'type' => 'string' ],
				'sanitize_callback' => function ($types) {
					if (!\is_array($types)) {
						return ['posts', 'terms', 'authors', 'archives'];
					}
					$valid = ['posts', 'terms', 'authors', 'archives'];
					return \array_values(\array_intersect($types, $valid));
				},
			],
		];
	}

	/**
	 * Discover URLs for static site generation.
	 *
	 * Returns all URLs in a single request.
	 * Note: Pagination URLs are discovered via the crawl-based link extraction.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with URLs.
	 */
	public function discoverUrls(WP_REST_Request $request): WP_REST_Response
	{
		$types = $request->get_param('types') ?? [ 'posts', 'terms', 'authors', 'archives' ];

		$allUrls = [];

		// Collect URLs from each requested type
		if (\in_array('posts', $types, true)) {
			$allUrls = \array_merge($allUrls, $this->getAllPostUrls());
		}

		if (\in_array('terms', $types, true)) {
			$allUrls = \array_merge($allUrls, $this->getAllTermUrls());
		}

		if (\in_array('authors', $types, true)) {
			$allUrls = \array_merge($allUrls, $this->getAllAuthorUrls());
		}

		if (\in_array('archives', $types, true)) {
			$allUrls = \array_merge($allUrls, $this->getArchiveUrls());
		}

		// Deduplicate URLs
		$uniqueUrls = \array_values(\array_unique($allUrls));

		return new WP_REST_Response([
			'success' => true,
			'urls'    => $uniqueUrls,
			'total'   => \count($uniqueUrls),
		], 200);
	}

	/**
	 * Get all post URLs (all public post types).
	 *
	 * @return array<string> Post URLs.
	 */
	private function getAllPostUrls(): array
	{
		$postTypes = \get_post_types(['public' => true], 'names');
		$postTypesArray = \array_values($postTypes);

		$posts = \get_posts([
			'post_type'      => $postTypesArray,
			'post_status'    => 'publish',
			'posts_per_page' => -1,
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

		return $urls;
	}

	/**
	 * Get all term URLs (categories, tags, custom taxonomies).
	 *
	 * @return array<string> Term URLs.
	 */
	private function getAllTermUrls(): array
	{
		$taxonomies = \get_taxonomies(['public' => true], 'names');
		$taxonomiesArray = \array_values($taxonomies);

		$terms = \get_terms([
			'taxonomy'   => $taxonomiesArray,
			'hide_empty' => true,
			'number'     => 0, // All terms
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

		return $urls;
	}

	/**
	 * Get all author URLs.
	 *
	 * @return array<string> Author URLs.
	 */
	private function getAllAuthorUrls(): array
	{
		$authors = \get_users([
			'capability' => 'edit_posts',
			'number'     => 0, // All authors
			'orderby'    => 'ID',
			'order'      => 'ASC',
		]);

		$urls = [];
		foreach ($authors as $author) {
			$urls[] = \get_author_posts_url($author->ID);
		}

		return $urls;
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
}
