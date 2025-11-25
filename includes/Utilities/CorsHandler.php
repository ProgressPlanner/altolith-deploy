<?php

/**
 * CORS Handler Utility
 *
 * Handles Cross-Origin Resource Sharing (CORS) headers for WordPress REST API endpoints.
 * Required for WordPress Playground which runs in an iframe.
 *
 * @package Aether\Utilities
 */

namespace Aether\SiteExporter\Utilities;

\defined('ABSPATH') || exit;

/**
 * CORS handler utility class.
 */
class CorsHandler
{
	/**
	 * Handle CORS preflight requests (OPTIONS).
	 *
	 * WordPress REST API doesn't automatically handle OPTIONS requests for CORS.
	 * This method intercepts OPTIONS requests and sends appropriate CORS headers.
	 *
	 * @param mixed           $result  Response to replace the requested value with.
	 * @param \WP_REST_Server $server  Server instance.
	 * @param \WP_REST_Request $request Request used to generate the response.
	 * @return mixed Response or null to continue with normal processing.
	 */
	public function handlePreflight($result, \WP_REST_Server $server, \WP_REST_Request $request)
	{
		// Only handle OPTIONS requests for Aether endpoints.
		if ($request->get_method() !== 'OPTIONS') {
			return $result;
		}

		$route = $request->get_route();
		if (! \str_starts_with($route, '/aether/')) {
			return $result;
		}

		// Send CORS headers for preflight request.
		$this->sendHeaders();

		// Return empty response for OPTIONS request.
		return new \WP_REST_Response(null, 204);
	}

	/**
	 * Add CORS headers via filter (rest_pre_serve_request).
	 *
	 * @param bool              $served Whether the request has already been served.
	 * @param \WP_REST_Response $result Response data.
	 * @param mixed             $request Request object (may be WP_REST_Request or other types).
	 * @param \WP_REST_Server   $server Server instance.
	 * @return bool Unchanged served status.
	 */
	public function addHeadersFilter(bool $served, \WP_REST_Response $result, $request, \WP_REST_Server $server): bool // phpcs:ignore VariableAnalysis.CodeAnalysis
	{
		// Only add headers for Aether endpoints
		if ($request instanceof \WP_REST_Request) {
			$route = $request->get_route();
			if (! \str_starts_with($route, '/aether/')) {
				return $served;
			}
		}

		$this->sendHeaders();

		return $served;
	}

	/**
	 * Add CORS headers via action (rest_send_cors_headers).
	 *
	 * @return void
	 */
	public function addHeadersAction(): void
	{
		// Get current request from global REST server
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WordPress global variable
		global $wp_rest_server; // phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WordPress global variable
		if (! $wp_rest_server) { // phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps
			return;
		}

		// Check if this is an Aether endpoint by checking the request URI
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- CORS headers don't need nonce
		$requestUri = \sanitize_text_field(\wp_unslash($_SERVER['REQUEST_URI'] ?? ''));
		if (! \str_contains($requestUri, '/wp-json/aether/')) {
			return;
		}

		$this->sendHeaders();
	}

	/**
	 * Send CORS headers.
	 *
	 * Internal method to actually send the headers with origin whitelisting.
	 *
	 * @return void
	 */
	public function sendHeaders(): void
	{
		// Prevent duplicate headers.
		if (\headers_sent()) {
			return;
		}

		// Get the origin from the request
		$origin = isset($_SERVER['HTTP_ORIGIN']) ? \esc_url_raw(\wp_unslash($_SERVER['HTTP_ORIGIN'])) : '';

		// Get allowed origins
		$allowedOrigins = $this->getAllowedOrigins($origin);

		// Check if the request origin is in the allowed list
		if ($origin && \in_array($origin, $allowedOrigins, true)) {
			\header('Access-Control-Allow-Origin: ' . $origin);
			\header('Access-Control-Allow-Credentials: true');
		} elseif (!$origin) {
			// No origin header (same-origin request or non-browser client)
			// Allow it but don't send CORS headers
			return;
		} else {
			// Origin not allowed - don't send CORS headers
			// The browser will block the request
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Blocked CORS request from disallowed origin: %s',
					$origin
				));
			}
			return;
		}

		\header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
		\header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
		\header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours.
	}

	/**
	 * Get allowed origins for CORS requests.
	 *
	 * @param string $origin The request origin to validate.
	 * @return array<string> Array of allowed origin URLs.
	 */
	private function getAllowedOrigins(string $origin): array
	{
		// Define allowed origins (WordPress Playground and local development)
		$allowedOrigins = [
			'https://playground.wordpress.net',
			'https://wasm.wordpress.net',
		];

		// Allow same-origin requests (current site)
		$siteUrl = \get_site_url();
		if ($siteUrl) {
			$allowedOrigins[] = $siteUrl;
		}

		// Allow local development origins (requires explicit opt-in for security)
		// Define AETHER_ALLOW_LOCAL_CORS in wp-config.php to enable
		if (\defined('WP_DEBUG') && WP_DEBUG && \defined('AETHER_ALLOW_LOCAL_CORS') && \constant('AETHER_ALLOW_LOCAL_CORS')) {
			$allowedOrigins = \array_merge($allowedOrigins, $this->getLocalDevelopmentOrigins($origin));
		}

		// Allow WordPress Playground dynamic subdomains (e.g., https://playground.wordpress.net/*)
		// These are safe because they're official WordPress infrastructure
		$isPlaygroundOrigin = $origin && (
			\str_starts_with($origin, 'https://playground.wordpress.net') ||
			\str_starts_with($origin, 'https://wasm.wordpress.net')
		);
		if ($isPlaygroundOrigin) {
			$allowedOrigins[] = $origin;
		}

		// Apply filter to allow developers to add custom allowed origins
		$allowedOrigins = \apply_filters('aether_site_exporter_cors_allowed_origins', $allowedOrigins);

		return $allowedOrigins;
	}

	/**
	 * Get local development origins (localhost and 127.0.0.1 with common dev ports).
	 *
	 * @param string $origin The request origin to validate.
	 * @return array<string> Array of allowed local development origins.
	 */
	private function getLocalDevelopmentOrigins(string $origin): array
	{
		$localOrigins = [];
		// Security: Only allow common development ports to reduce attack surface
		$commonDevPorts = ['3000', '3001', '8000', '8080', '8888'];

		// Allow localhost/127.0.0.1 with common dev ports
		if ($origin && \preg_match('/^https?:\/\/(localhost|127\.0\.0\.1):(\d+)$/', $origin, $matches)) {
			if (\in_array($matches[2], $commonDevPorts, true)) {
				$localOrigins[] = $origin;
			}
		}

		return $localOrigins;
	}
}
