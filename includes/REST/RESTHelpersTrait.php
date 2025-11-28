<?php

/**
 * REST API Helpers Trait
 *
 * Provides common functionality for REST controllers.
 * Replaces BaseRESTController inheritance.
 *
 * @package Altolith\REST
 */

namespace Altolith\Deploy\REST;

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
				\error_log(\sprintf('Altolith Security: Missing nonce from IP %s', $ip));
			}

			return new \WP_Error(
				'missing_nonce',
				\__('CSRF token missing. Please refresh and try again.', 'altolith-deploy'),
				['status' => 403]
			);
		}

		// Verify nonce explicitly for defense in depth
		if (!\wp_verify_nonce($nonce, 'wp_rest')) {
			// Log security event for monitoring (only in debug mode)
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				$ip = isset($_SERVER['REMOTE_ADDR']) ? \sanitize_text_field(\wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
				\error_log(\sprintf('Altolith Security: Invalid nonce verification from IP %s', $ip));
			}

			return new \WP_Error(
				'invalid_nonce',
				\__('CSRF token invalid. Please refresh and try again.', 'altolith-deploy'),
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
		return 'altolith/deploy';
	}

	/**
	 * Validate that a required parameter is not empty.
	 *
	 * Returns a WP_Error if the value is empty, null otherwise.
	 * This centralizes common validation error handling patterns.
	 *
	 * @param mixed  $value     Value to validate.
	 * @param string $paramName Parameter name for error messages.
	 * @return \WP_Error|null WP_Error if validation fails, null if valid.
	 */
	protected function validateRequiredParam($value, string $paramName): ?\WP_Error
	{
		if (empty($value)) {
			return new \WP_Error(
				"missing_{$paramName}",
				/* translators: %s: Parameter name */
				\sprintf(\__('%s is required', 'altolith-deploy'), $paramName),
				['status' => 400]
			);
		}

		return null;
	}

	/**
	 * Validate that a required array parameter is not empty and is an array.
	 *
	 * Returns a WP_Error if the value is empty or not an array, null otherwise.
	 *
	 * @param mixed  $value     Value to validate.
	 * @param string $paramName Parameter name for error messages.
	 * @return \WP_Error|null WP_Error if validation fails, null if valid.
	 */
	protected function validateRequiredArray($value, string $paramName): ?\WP_Error
	{
		if (empty($value) || !\is_array($value)) {
			return new \WP_Error(
				"missing_{$paramName}",
				/* translators: %s: Parameter name */
				\sprintf(\__('%s array is required', 'altolith-deploy'), $paramName),
				['status' => 400]
			);
		}

		return null;
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
						\__('Request data is too deeply nested (max depth: %d).', 'altolith-deploy'),
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
							\__('Request data is too large (max elements: %d).', 'altolith-deploy'),
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
		// Remove absolute paths - replace with [PATH] (Unix-style)
		$message = \preg_replace('#' . \preg_quote(ABSPATH, '#') . '[^\s]*#', '[PATH]', $message) ?? $message;

		// Remove Windows-style absolute paths (C:\Users\..., D:\...)
		$message = \preg_replace('#[A-Za-z]:[\\\/][^\s]*#', '[PATH]', $message) ?? $message;

		// Remove temporary directory paths (/tmp/..., /var/tmp/...)
		$message = \preg_replace('#/(?:tmp|var/tmp)/[^\s]*#', '[TEMP]', $message) ?? $message;

		// Remove stack trace line information (in /path/to/file.php on line 123)
		$message = \preg_replace('#in /[^\s]+ on line \d+#', 'in [PATH] on line [LINE]', $message) ?? $message;

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
			$message = \preg_replace($pattern, $replacement, $message) ?? $message;
		}

		return $message;
	}

	/**
	 * Get default value for a configuration key.
	 *
	 * Centralizes default value logic for special configuration fields.
	 *
	 * @param string $key Configuration key.
	 * @return string|null Default value if key has a default, null otherwise.
	 */
	private function getDefaultForConfigKey(string $key): ?string
	{
		$defaults = [
			'static_files_path' => 'static/',
			'export_path' => 'blueprint-bundle/bundle.zip',
		];

		return $defaults[ $key ] ?? null;
	}

	/**
	 * Sanitize a single configuration value based on its type.
	 *
	 * @param mixed  $value Value to sanitize.
	 * @param string $key   Configuration key (for context).
	 * @param int    $depth Current recursion depth.
	 * @return mixed Sanitized value.
	 */
	private function sanitizeConfigValue($value, string $key, int $depth)
	{
		if (\is_array($value)) {
			return $this->sanitizeConfig($value, $depth + 1);
		}

		if (\is_bool($value)) {
			return (bool) $value;
		}

		if (\is_numeric($value)) {
			return $value;
		}

		if (\is_string($value)) {
			// Sanitize URLs
			if (\preg_match('/^https?:\/\//i', $value)) {
				return \esc_url_raw($value);
			}

			// Apply default if value is empty and key has a default
			$default = $this->getDefaultForConfigKey($key);
			if (null !== $default) {
				$trimmed = \trim($value);

				// Special handling for export_path - must end with .zip
				if ('export_path' === $key && !empty($trimmed) && !\preg_match('/\.zip$/i', $trimmed)) {
					return $default;
				}

				// Use default if value is empty
				if (empty($trimmed)) {
					return $default;
				}

				return $trimmed;
			}

			return \sanitize_text_field($value);
		}

		// Fallback for other types
		return \sanitize_text_field((string) $value);
	}

	/**
	 * Sanitize configuration array recursively with depth limit.
	 *
	 * Preserves snake_case keys (unlike sanitize_key which converts to lowercase).
	 * Prevents stack overflow by limiting recursion to 10 levels.
	 *
	 * @param array<string, mixed> $config Configuration to sanitize.
	 * @param int                  $depth  Current recursion depth.
	 * @return array<string, mixed> Sanitized configuration.
	 */
	protected function sanitizeConfig(array $config, int $depth = 0): array
	{
		// Prevent stack overflow attacks by limiting recursion depth
		if ($depth > 10) {
			return [];
		}

		$sanitized = [];

		foreach ($config as $key => $value) {
			// Preserve case for snake_case keys instead of lowercasing with sanitize_key()
			// Allow alphanumeric, underscore, and hyphen
			$sanitizedKey = \preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $key);

			// Skip empty or null keys after sanitization
			if (null === $sanitizedKey || '' === $sanitizedKey) {
				continue;
			}

			$sanitized[ $sanitizedKey ] = $this->sanitizeConfigValue($value, $sanitizedKey, $depth);
		}

		/**
		 * Filter sanitized configuration values.
		 *
		 * Allows custom sanitization rules for specific configuration fields.
		 *
		 * @param array $sanitized The sanitized configuration array.
		 * @param array $config    The original (unsanitized) configuration array.
		 * @param int   $depth     Current recursion depth.
		 *
		 * @example
		 * add_filter('altolith_provider_config_sanitize', function($sanitized, $config, $depth) {
		 *     // Only process at root level
		 *     if ($depth === 0 && isset($sanitized['custom_field'])) {
		 *         $sanitized['custom_field'] = strtoupper($sanitized['custom_field']);
		 *     }
		 *     return $sanitized;
		 * }, 10, 3);
		 */
		return \apply_filters('altolith_provider_config_sanitize', $sanitized, $config, $depth);
	}
}
