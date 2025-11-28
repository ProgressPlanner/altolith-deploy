<?php

/**
 * HTTP Client Utility
 *
 * Provides a wrapper around WordPress HTTP API (wp_remote_*) functions
 * with consistent error handling, logging, and response validation.
 *
 * IMPORTANT: This class is for INTERNAL WordPress requests only (same-site).
 * For external API calls (external APIs, WordPress.org), use browser-based fetch()
 * because WordPress Playground blocks external wp_remote_* requests.
 *
 * WordPress Playground Compatibility:
 * - ✅ WORKS: Internal requests to same WordPress site (static site generation)
 * - ❌ BLOCKED: External API calls to wordpress.org, api.example.com, etc.
 *
 * Usage:
 * - Static site HTML fetching (PublishStepsController.php)
 * - URL discovery (URLDiscoveryService.php)
 *
 * @package Altolith\Utilities
 */

namespace Altolith\Deploy\Utilities;

\defined('ABSPATH') || exit;

/**
 * HTTP client with standardized error handling.
 */
class HTTPClient
{
	/**
	 * Default timeout for HTTP requests (seconds).
	 */
	private const DEFAULT_TIMEOUT = 30;

	/**
	 * Prepare request arguments with defaults.
	 *
	 * @param array<string, mixed> $args Request arguments.
	 * @return array<string, mixed> Prepared arguments with defaults.
	 */
	private static function prepareArgs(array $args): array
	{
		// Set default timeout if not provided.
		if (! isset($args['timeout'])) {
			$args['timeout'] = self::DEFAULT_TIMEOUT;
		}

		return $args;
	}

	/**
	 * Perform GET request with error handling.
	 *
	 * @param string               $url     URL to fetch.
	 * @param array<string, mixed> $args    Optional request arguments.
	 * @param array<int>           $allowedStatusCodes Optional allowed status codes (default: [200]).
	 * @return array{success: bool, body?: string, status_code?: int, error?: string} Response data.
	 */
	public static function get(string $url, array $args = [], array $allowedStatusCodes = [ 200 ]): array
	{
		$args = self::prepareArgs($args);
		$response = \wp_remote_get($url, $args);

		return self::processResponse($response, $url, $allowedStatusCodes);
	}

	/**
	 * Process HTTP response with standardized error handling.
	 *
	 * @param \WP_Error|array<string, mixed> $response            Response from wp_remote_*.
	 * @param string                         $url                URL requested.
	 * @param array<int>                     $allowedStatusCodes Allowed status codes.
	 * @param bool                           $includeHeaders    Include headers in response (for HEAD requests).
	 * @return array{success: bool, body?: string, headers?: array<string, string>, status_code?: int, error?: string} Processed response.
	 */
	private static function processResponse($response, string $url, array $allowedStatusCodes = [ 200 ], bool $includeHeaders = false): array
	{
		// Check for WP_Error.
		if (\is_wp_error($response)) {
			return [
				'success'    => false,
				'error'      => $response->get_error_message(),
				'error_code' => (string) $response->get_error_code(),
			];
		}

		// Get status code.
		$statusCode = \wp_remote_retrieve_response_code($response);

		// Check if status code is allowed.
		if (! \in_array($statusCode, $allowedStatusCodes, true)) {
			$errorResponse = [
				'success'     => false,
				'error'       => \sprintf('Unexpected status code: %d', $statusCode),
				'status_code' => (int) $statusCode,
			];

			$body = \wp_remote_retrieve_body($response);
			if (! empty($body)) {
				$errorResponse['body'] = $body;
			}

			return $errorResponse;
		}

		// Build success response.
		if ($includeHeaders) {
			$headersObj = \wp_remote_retrieve_headers($response);
			$headers = \is_object($headersObj) ? $headersObj->getAll() : [];
			return [
				'success'     => true,
				'headers'     => $headers,
				'status_code' => (int) $statusCode,
			];
		}

		return [
			'success'     => true,
			'body'        => \wp_remote_retrieve_body($response),
			'status_code' => (int) $statusCode,
		];
	}
}
