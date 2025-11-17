<?php

/**
 * REST API Helpers Trait
 *
 * Provides common functionality for REST controllers.
 * Replaces BaseRESTController inheritance.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

/**
 * Trait providing REST API helper methods.
 */
trait RESTHelpersTrait
{
	/**
	 * Permission check for REST endpoints.
	 *
	 * Requires manage_options capability.
	 *
	 * @return bool True if user has permission.
	 */
	public function permissionCheck(): bool
	{
		return \current_user_can('manage_options');
	}

	/**
	 * Verify WordPress REST API nonce for CSRF protection.
	 *
	 * WordPress REST API automatically validates nonces via cookie authentication,
	 * but this provides an explicit validation for defense in depth.
	 *
	 * Note: This check is redundant with WordPress's built-in REST API nonce validation,
	 * but provides an explicit layer of CSRF protection for state-changing operations.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return bool|\WP_Error True if valid, WP_Error if invalid.
	 */
	public function verifyNonce(\WP_REST_Request $request)
	{
		// WordPress REST API automatically handles cookie authentication + nonce validation.
		// If we reach this point and the user is authenticated, nonce was already validated.
		// This explicit check serves as defense in depth for state-changing operations.

		// Get nonce from header (sent by @wordpress/api-fetch)
		$nonce = $request->get_header('X-WP-Nonce');

		if (empty($nonce)) {
			// Check if user is authenticated via cookie (nonce in cookie session)
			// If user is logged in and we got here, WordPress already validated the session
			if (\is_user_logged_in()) {
				return true;
			}

			// Log security event for monitoring (only in debug mode)
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				$ip = isset($_SERVER['REMOTE_ADDR']) ? \sanitize_text_field(\wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
				\error_log(\sprintf('Aether Security: Missing nonce from IP %s', $ip));
			}

			return new \WP_Error(
				'missing_nonce',
				\__('CSRF token missing. Please refresh and try again.', 'aether-site-exporter'),
				['status' => 403]
			);
		}

		// Verify nonce explicitly for defense in depth
		if (!\wp_verify_nonce($nonce, 'wp_rest')) {
			// Log security event for monitoring (only in debug mode)
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				$ip = isset($_SERVER['REMOTE_ADDR']) ? \sanitize_text_field(\wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
				\error_log(\sprintf('Aether Security: Invalid nonce verification from IP %s', $ip));
			}

			return new \WP_Error(
				'invalid_nonce',
				\__('CSRF token invalid. Please refresh and try again.', 'aether-site-exporter'),
				['status' => 403]
			);
		}

		return true;
	}

	/**
	 * Get REST API namespace.
	 *
	 * @return string API namespace.
	 */
	public function getNamespace(): string
	{
		return 'aether/site-exporter';
	}

	/**
	 * Validate array complexity to prevent DoS attacks.
	 *
	 * Checks array depth and total element count to prevent:
	 * - Stack overflow from deeply nested arrays
	 * - Memory exhaustion from extremely large arrays
	 * - CPU exhaustion from processing complex structures
	 *
	 * @param mixed $data       Data to validate (typically from JSON request body).
	 * @param int   $maxDepth   Maximum nesting depth (default: 10).
	 * @param int   $maxElements Maximum total elements (default: 10000).
	 * @return bool|\WP_Error True if valid, WP_Error if invalid.
	 */
	public function validateArrayComplexity($data, int $maxDepth = 10, int $maxElements = 10000)
	{
		if (! \is_array($data)) {
			return true; // Not an array, no complexity check needed
		}

		$elementCount = 0;

		$checkComplexity = function ($array, $depth) use (&$checkComplexity, &$elementCount, $maxDepth, $maxElements) {
			// Check depth limit
			if ($depth > $maxDepth) {
				return new \WP_Error(
					'array_too_deep',
					\sprintf(
						/* translators: %d: maximum allowed depth */
						\__('Request data is too deeply nested (max depth: %d).', 'aether-site-exporter'),
						$maxDepth
					),
					['status' => 400]
				);
			}

			// Count elements and check limit
			foreach ($array as $value) {
				$elementCount++;

				// Check element count limit
				if ($elementCount > $maxElements) {
					return new \WP_Error(
						'array_too_large',
						\sprintf(
							/* translators: %d: maximum allowed elements */
							\__('Request data is too large (max elements: %d).', 'aether-site-exporter'),
							$maxElements
						),
						['status' => 400]
					);
				}

				// Recursively check nested arrays
				if (\is_array($value)) {
					$result = $checkComplexity($value, $depth + 1);
					if (\is_wp_error($result)) {
						return $result;
					}
				}
			}

			return true;
		};

		return $checkComplexity($data, 0);
	}

	/**
	 * Rate limit requests to prevent abuse.
	 *
	 * Uses WordPress transients to track request counts per user/IP.
	 * Prevents DoS attacks by limiting the number of requests within a time window.
	 *
	 * @param string $operation   Operation identifier (e.g., 'url_discovery').
	 * @param int    $maxRequests Maximum requests allowed in time window.
	 * @param int    $timeWindow  Time window in seconds (default: 60).
	 * @return bool|\WP_Error True if allowed, WP_Error if rate limited.
	 */
	public function checkRateLimit(string $operation, int $maxRequests = 10, int $timeWindow = 60)
	{
		$userId = \get_current_user_id();

		// For logged-in users, use user ID; otherwise use IP address + User-Agent for better tracking
		if ($userId > 0) {
			$identifier = "user_{$userId}";
		} else {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
			$ip = isset($_SERVER['REMOTE_ADDR']) ? \sanitize_text_field(\wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
			$ua = isset($_SERVER['HTTP_USER_AGENT']) ? \sanitize_text_field(\wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';
			// Combine IP and User-Agent for better rate limiting (harder to bypass with proxies)
			$identifier = "ip_" . \md5($ip . $ua);
		}

		$transientKey = "aether_ratelimit_{$operation}_{$identifier}";
		$requests = \get_transient($transientKey);

		if (false === $requests) {
			// First request in this time window
			\set_transient($transientKey, 1, $timeWindow);
			return true;
		}

		if ($requests >= $maxRequests) {
			// Log security event for monitoring (only in debug mode)
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				$ip = isset($_SERVER['REMOTE_ADDR']) ? \sanitize_text_field(\wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
				\error_log(\sprintf('Aether Security: Rate limit exceeded for operation "%s" from IP %s', $operation, $ip));
			}

			return new \WP_Error(
				'rate_limit_exceeded',
				\sprintf(
					/* translators: %d: number of seconds to wait */
					\__('Rate limit exceeded. Please wait %d seconds before trying again.', 'aether-site-exporter'),
					$timeWindow
				),
				['status' => 429]
			);
		}

		// Increment counter
		\set_transient($transientKey, $requests + 1, $timeWindow);
		return true;
	}

	/**
	 * Sanitize exception message to prevent information disclosure.
	 *
	 * Removes sensitive information from exception messages like:
	 * - Absolute file paths (replace with relative paths or [REDACTED])
	 * - Database credentials
	 * - Internal implementation details
	 *
	 * @param string $message Exception message to sanitize.
	 * @return string Sanitized message safe for public display.
	 */
	public function sanitizeExceptionMessage(string $message): string
	{
		// Remove absolute paths - replace with [PATH]
		$result = \preg_replace('#' . \preg_quote(ABSPATH, '#') . '[^\s]*#', '[PATH]', $message);
		$message = \is_string($result) ? $result : $message;

		// Remove common sensitive patterns
		$patterns = [
			// Database credentials
			'#password[\'"]?\s*[:=]\s*[\'"]?[^\s\'"]+#i' => 'password=[REDACTED]',
			'#user[\'"]?\s*[:=]\s*[\'"]?[^\s\'"]+#i' => 'user=[REDACTED]',
			// API keys and tokens
			'#(api[_-]?key|token|secret)[\'"]?\s*[:=]\s*[\'"]?[^\s\'"]+#i' => '$1=[REDACTED]',
			// Email addresses
			'#[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}#' => '[EMAIL]',
		];

		foreach ($patterns as $pattern => $replacement) {
			$result = \preg_replace($pattern, $replacement, $message);
			$message = \is_string($result) ? $result : $message;
		}

		return $message;
	}
}
