<?php

/**
 * HTTP Client Utility
 *
 * Provides a wrapper around WordPress HTTP API (wp_remote_*) functions
 * with consistent error handling, logging, and response validation.
 *
 * IMPORTANT: This class is for INTERNAL WordPress requests only (same-site).
 * For external API calls (Cloudflare, WordPress.org), use browser-based fetch()
 * because WordPress Playground blocks external wp_remote_* requests.
 *
 * WordPress Playground Compatibility:
 * - ✅ WORKS: Internal requests to same WordPress site (static site generation)
 * - ❌ BLOCKED: External API calls to wordpress.org, cloudflare.com, etc.
 *
 * Usage:
 * - Static site HTML fetching (PublishStepsController.php)
 * - URL discovery (URLDiscoveryService.php)
 *
 * @package Aether\Utilities
 */

namespace Aether\Utilities;

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
	 * Perform POST request with error handling.
	 *
	 * @param string               $url     URL to post to.
	 * @param array<string, mixed> $args    Optional request arguments.
	 * @param array<int>           $allowedStatusCodes Optional allowed status codes (default: [200]).
	 * @return array{success: bool, body?: string, status_code?: int, error?: string} Response data.
	 */
	public static function post(string $url, array $args = [], array $allowedStatusCodes = [ 200 ]): array
	{
		$args = self::prepareArgs($args);
		$response = \wp_remote_post($url, $args);

		return self::processResponse($response, $url, $allowedStatusCodes);
	}

	/**
	 * Perform HEAD request with error handling.
	 *
	 * @param string               $url     URL to check.
	 * @param array<string, mixed> $args    Optional request arguments.
	 * @param array<int>           $allowedStatusCodes Optional allowed status codes (default: [200]).
	 * @return array{success: bool, headers?: array<string, string>, status_code?: int, error?: string} Response data.
	 */
	public static function head(string $url, array $args = [], array $allowedStatusCodes = [ 200 ]): array
	{
		$args = self::prepareArgs($args);
		$response = \wp_remote_head($url, $args);

		return self::processResponse($response, $url, $allowedStatusCodes, true);
	}

	/**
	 * Perform generic request with error handling.
	 *
	 * @param string               $url     URL to request.
	 * @param array<string, mixed> $args    Request arguments.
	 * @param array<int>           $allowedStatusCodes Optional allowed status codes (default: [200]).
	 * @return array{success: bool, body?: string, status_code?: int, error?: string} Response data.
	 */
	public static function request(string $url, array $args = [], array $allowedStatusCodes = [ 200 ]): array
	{
		$args = self::prepareArgs($args);
		$response = \wp_remote_request($url, $args);

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
			$errorMessage = \sprintf(
				'HTTP request failed for %s: %s',
				$url,
				$response->get_error_message()
			);

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
			$errorMessage = \sprintf(
				'HTTP request to %s returned unexpected status %d (allowed: %s)',
				$url,
				$statusCode,
				\implode(', ', $allowedStatusCodes)
			);

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

	/**
	 * Download file from URL with error handling.
	 *
	 * Downloads file to specified destination path.
	 *
	 * @param string               $url         URL to download.
	 * @param string               $destination Destination file path.
	 * @param array<string, mixed> $args        Optional request arguments.
	 * @return array{success: bool, file_path?: string, error?: string} Download result.
	 */
	public static function download(string $url, string $destination, array $args = []): array
	{
		$args = self::prepareArgs($args);

		// Fetch file content.
		$result = self::get($url, $args);

		if (! $result['success'] || empty($result['body'])) {
			return $result;
		}

		// Create directory if needed.
		$dir = \dirname($destination);
		if (! \file_exists($dir)) {
			\wp_mkdir_p($dir);
		}

		// Write file.
		$bytesWritten = \file_put_contents($destination, $result['body']);

		if (false === $bytesWritten) {
			return [
				'success' => false,
				'error'   => 'Failed to write file',
			];
		}

		return [
			'success'   => true,
			'file_path' => $destination,
		];
	}

	/**
	 * Check if URL is accessible (returns 200 OK).
	 *
	 * @param string               $url  URL to check.
	 * @param array<string, mixed> $args Optional request arguments.
	 * @return bool True if accessible.
	 */
	public static function isAccessible(string $url, array $args = []): bool
	{
		$result = self::head($url, $args);
		return $result['success'];
	}

	/**
	 * Get response headers for a URL.
	 *
	 * @param string               $url  URL to check.
	 * @param array<string, mixed> $args Optional request arguments.
	 * @return array<string, string>|null Headers or null on failure.
	 */
	public static function getHeaders(string $url, array $args = []): ?array
	{
		$result = self::head($url, $args);

		if (! $result['success']) {
			return null;
		}

		return $result['headers'] ?? null;
	}
}
