<?php

/**
 * HTML Fetch Controller
 *
 * Fetches page HTML as anonymous user for static site generation.
 * Provides PHP-based fetching that guarantees anonymous user context
 * via wp_set_current_user(0), working reliably in WordPress Playground.
 *
 * @package Altolith\REST\Export
 */

namespace Altolith\Deploy\REST\Export;

use Altolith\Deploy\REST\RESTHelpersTrait;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Controller for fetching HTML content as anonymous user.
 */
class HtmlFetchController
{
	use RESTHelpersTrait;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Single URL endpoint.
		\register_rest_route(
			$this->getNamespace(),
			'/export/fetch-html',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'fetchHtml' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Batch endpoint (up to 10 URLs).
		\register_rest_route(
			$this->getNamespace(),
			'/export/fetch-html-batch',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'fetchHtmlBatch' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Fetch HTML for a single URL as anonymous user.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object.
	 */
	public function fetchHtml(WP_REST_Request $request)
	{
		$params = $request->get_json_params();
		$url = $params['url'] ?? '';

		$validationError = $this->validateRequiredParam($url, 'url');
		if ($validationError) {
			return $validationError;
		}

		$result = $this->fetchUrlAsAnonymous($url);

		if (\is_wp_error($result)) {
			return $result;
		}

		return \rest_ensure_response([
			'success' => true,
			'html'    => $result['html'],
			'status'  => $result['status'],
		]);
	}

	/**
	 * Fetch HTML for multiple URLs as anonymous user.
	 *
	 * Processes up to 10 URLs in a single request to reduce HTTP overhead.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object.
	 */
	public function fetchHtmlBatch(WP_REST_Request $request)
	{
		$params = $request->get_json_params();
		$urls = $params['urls'] ?? [];

		$validationError = $this->validateRequiredArray($urls, 'urls');
		if ($validationError) {
			return $validationError;
		}

		// Limit batch size to prevent server overload.
		$maxBatchSize = \Altolith\Deploy\Constants\ExportLimits::MAX_BATCH_SIZE;
		if (\count($urls) > $maxBatchSize) {
			return new WP_Error(
				'batch_too_large',
				\sprintf(
					/* translators: %d: maximum batch size */
					\__('Batch size exceeds maximum of %d URLs', 'altolith-deploy'),
					$maxBatchSize
				),
				['status' => 400]
			);
		}

		$results = [];

		foreach ($urls as $url) {
			if (!\is_string($url)) {
				$results[$url] = [
					'success' => false,
					'error'   => \__('Invalid URL format', 'altolith-deploy'),
				];
				continue;
			}

			$result = $this->fetchUrlAsAnonymous($url);

			if (\is_wp_error($result)) {
				$results[$url] = [
					'success' => false,
					'error'   => $result->get_error_message(),
				];
			} else {
				$results[$url] = [
					'success' => true,
					'html'    => $result['html'],
					'status'  => $result['status'],
				];
			}
		}

		return \rest_ensure_response([
			'success' => true,
			'results' => $results,
		]);
	}

	/**
	 * Fetch URL content as anonymous user.
	 *
	 * Sets user to anonymous before making request, ensuring the fetched
	 * HTML matches what anonymous visitors would see.
	 *
	 * @param string $url URL to fetch.
	 * @return array{html: string, status: int}|WP_Error Result or error.
	 */
	private function fetchUrlAsAnonymous(string $url)
	{
		// Security: Only allow same-site URLs to prevent SSRF.
		if (!$this->isSameSiteUrl($url)) {
			return new WP_Error(
				'external_url',
				\__('Only same-site URLs can be fetched', 'altolith-deploy'),
				['status' => 403]
			);
		}

		// Store current user to restore later.
		$currentUserId = \get_current_user_id();

		try {
			// Set anonymous user context - this is the key.
			\wp_set_current_user(0);

			// Make the request with no cookies.
			$response = \wp_remote_get($url, [
				'timeout'   => 30,
				'sslverify' => false, // Internal request, SSL verification not needed.
				'cookies'   => [],    // No cookies = anonymous.
				'headers'   => [
					'User-Agent'        => 'Altolith Static Site Generator',
					'X-Altolith-Anonymous' => 'true',
				],
			]);

			if (\is_wp_error($response)) {
				return $response;
			}

			$statusCode = (int) \wp_remote_retrieve_response_code($response);
			$body = \wp_remote_retrieve_body($response);
			$contentType = \wp_remote_retrieve_header($response, 'content-type');

			// Verify response is HTML.
			// Content-Type can be array or string, handle both.
			$contentTypeStr = \is_array($contentType) ? \implode(', ', $contentType) : (string) $contentType;
			if (\strpos($contentTypeStr, 'text/html') === false) {
				return new WP_Error(
					'not_html',
					\__('Response is not HTML', 'altolith-deploy'),
					['status' => 415]
				);
			}

			return [
				'html'   => $body,
				'status' => $statusCode,
			];
		} finally {
			// Always restore original user.
			\wp_set_current_user($currentUserId);
		}
	}

	/**
	 * Check if URL is from the same site.
	 *
	 * Prevents Server-Side Request Forgery (SSRF) by only allowing
	 * URLs from the same WordPress site.
	 *
	 * @param string $url URL to check.
	 * @return bool True if same-site, false otherwise.
	 */
	private function isSameSiteUrl(string $url): bool
	{
		// Get site hosts (both site_url and home_url for flexibility).
		$siteHost = \wp_parse_url(\site_url(), PHP_URL_HOST);
		$homeHost = \wp_parse_url(\home_url(), PHP_URL_HOST);
		$urlHost = \wp_parse_url($url, PHP_URL_HOST);

		if (empty($urlHost)) {
			return false;
		}

		return $urlHost === $siteHost || $urlHost === $homeHost;
	}
}
