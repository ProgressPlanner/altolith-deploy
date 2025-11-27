<?php

/**
 * WordPress.org Cache REST Controller
 *
 * Handles REST API endpoints for checking if plugins/themes exist on WordPress.org
 * with server-side caching via WordPress transients.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Handles REST API endpoints for WordPress.org existence checks.
 */
class WpOrgCacheController
{
	use RESTHelpersTrait;

	/**
	 * Cache TTL in seconds (7 days).
	 */
	private const CACHE_TTL = 604800;

	/**
	 * Maximum items per batch request.
	 */
	private const MAX_BATCH_SIZE = 100;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Batch check for plugin/theme existence on WordPress.org.
		\register_rest_route(
			$this->getNamespace(),
			'/wporg/check-batch',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'checkBatch' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'items' => [
						'required'          => true,
						'type'              => 'array',
						'description'       => \__('Array of items to check, each with slug and type (plugin or theme)', 'aether-site-exporter'),
						'validate_callback' => [ $this, 'validateItems' ],
					],
				],
			]
		);
	}

	/**
	 * Validate items array.
	 *
	 * @param mixed $items Items to validate.
	 * @return bool|WP_Error True if valid, WP_Error if invalid.
	 */
	public function validateItems($items)
	{
		if (! \is_array($items)) {
			return new WP_Error(
				'invalid_items',
				\__('Items must be an array.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		if (\count($items) > self::MAX_BATCH_SIZE) {
			return new WP_Error(
				'too_many_items',
				\sprintf(
					/* translators: %d: maximum batch size */
					\__('Too many items. Maximum allowed: %d', 'aether-site-exporter'),
					self::MAX_BATCH_SIZE
				),
				[ 'status' => 400 ]
			);
		}

		foreach ($items as $index => $item) {
			if (! \is_array($item)) {
				return new WP_Error(
					'invalid_item',
					\sprintf(
						/* translators: %d: item index */
						\__('Item at index %d must be an object.', 'aether-site-exporter'),
						$index
					),
					[ 'status' => 400 ]
				);
			}

			if (empty($item['slug']) || ! \is_string($item['slug'])) {
				return new WP_Error(
					'missing_slug',
					\sprintf(
						/* translators: %d: item index */
						\__('Item at index %d is missing a valid slug.', 'aether-site-exporter'),
						$index
					),
					[ 'status' => 400 ]
				);
			}

			if (empty($item['type']) || ! \in_array($item['type'], [ 'plugin', 'theme' ], true)) {
				return new WP_Error(
					'invalid_type',
					\sprintf(
						/* translators: %d: item index */
						\__('Item at index %d must have type "plugin" or "theme".', 'aether-site-exporter'),
						$index
					),
					[ 'status' => 400 ]
				);
			}
		}

		return true;
	}

	/**
	 * Check batch of items for existence on WordPress.org.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with results.
	 */
	public function checkBatch(WP_REST_Request $request): WP_REST_Response
	{
		$items = $request->get_param('items');
		$results = [];

		foreach ($items as $item) {
			$slug = \sanitize_key($item['slug']);
			$type = $item['type'];
			$key = "{$type}:{$slug}";

			// Check cache first.
			$cached = $this->getCached($slug, $type);

			if (null !== $cached) {
				$results[$key] = $cached;
				continue;
			}

			// Not in cache, check WordPress.org API.
			$exists = $this->checkWordPressOrg($slug, $type);
			$results[$key] = $exists;

			// Cache the result.
			$this->setCache($slug, $type, $exists);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'results' => $results,
			],
			200
		);
	}

	/**
	 * Get cached result for a slug.
	 *
	 * @param string $slug Item slug.
	 * @param string $type Item type (plugin or theme).
	 * @return bool|null Cached result or null if not cached.
	 */
	private function getCached(string $slug, string $type): ?bool
	{
		$transientKey = $this->getTransientKey($slug, $type);
		$cached = \get_transient($transientKey);

		if (false === $cached) {
			return null;
		}

		// Stored as '1' or '0' strings since transient returns false for missing keys.
		return '1' === $cached;
	}

	/**
	 * Set cache for a slug.
	 *
	 * @param string $slug   Item slug.
	 * @param string $type   Item type (plugin or theme).
	 * @param bool   $exists Whether the item exists on WordPress.org.
	 * @return void
	 */
	private function setCache(string $slug, string $type, bool $exists): void
	{
		$transientKey = $this->getTransientKey($slug, $type);
		\set_transient($transientKey, $exists ? '1' : '0', self::CACHE_TTL);
	}

	/**
	 * Get transient key for a slug.
	 *
	 * @param string $slug Item slug.
	 * @param string $type Item type (plugin or theme).
	 * @return string Transient key.
	 */
	private function getTransientKey(string $slug, string $type): string
	{
		// Use md5 to keep key length reasonable and avoid special characters.
		return 'aether_wporg_' . $type . '_' . \md5($slug);
	}

	/**
	 * Check if an item exists on WordPress.org.
	 *
	 * @param string $slug Item slug.
	 * @param string $type Item type (plugin or theme).
	 * @return bool Whether the item exists.
	 */
	private function checkWordPressOrg(string $slug, string $type): bool
	{
		if ('plugin' === $type) {
			return $this->checkPlugin($slug);
		}

		return $this->checkTheme($slug);
	}

	/**
	 * Check if a plugin exists on WordPress.org.
	 *
	 * @param string $slug Plugin slug.
	 * @return bool Whether the plugin exists.
	 */
	private function checkPlugin(string $slug): bool
	{
		$url = "https://api.wordpress.org/plugins/info/1.0/{$slug}.json";

		$response = \wp_remote_get($url, [
			'timeout' => 10,
		]);

		if (\is_wp_error($response)) {
			// On error, assume it doesn't exist (will be rechecked later).
			return false;
		}

		$code = \wp_remote_retrieve_response_code($response);

		// 200 means the plugin exists.
		return 200 === $code;
	}

	/**
	 * Check if a theme exists on WordPress.org.
	 *
	 * @param string $slug Theme slug.
	 * @return bool Whether the theme exists.
	 */
	private function checkTheme(string $slug): bool
	{
		$url = 'https://api.wordpress.org/themes/info/1.2/';

		$response = \wp_remote_post($url, [
			'timeout' => 10,
			'body'    => [
				'action'  => 'theme_information',
				'request' => \serialize((object) [ // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
					'slug' => $slug,
				]),
			],
		]);

		if (\is_wp_error($response)) {
			// On error, assume it doesn't exist (will be rechecked later).
			return false;
		}

		$body = \wp_remote_retrieve_body($response);
		$data = \maybe_unserialize($body);

		// If we get theme data with a name, it exists.
		return \is_object($data) && ! empty($data->name);
	}
}
