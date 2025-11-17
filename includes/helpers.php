<?php

/**
 * Global Helper Functions
 *
 * Provides global utility functions for the Aether Site Exporter plugin.
 *
 * @package Aether\SiteExporter
 */

namespace Aether\SiteExporter;

\defined('ABSPATH') || exit;

/**
 * Get all storage provider settings in hierarchical format.
 *
 * Automatically migrates flat settings to hierarchical structure if needed.
 * The hierarchical structure is: ['activeProvider' => 'r2', 'providers' => [...]].
 *
 * Uses SettingsRepository which handles migration and structure validation automatically.
 *
 * @param bool $forceRefresh Whether to bypass the cache and refresh the data.
 *
 * @return array<string, mixed> Hierarchical settings array.
 */
function getStorageConfig(bool $forceRefresh = false): array
{
	static $repository = null;
	if (null === $repository) {
		$repository = new \Aether\SiteExporter\Core\SettingsRepository();
	}
	// Pass bypass_cache parameter to get fresh data when needed.
	return $repository->getAll($forceRefresh);
}

/**
 * Log security-related events with proper sanitization.
 *
 * Only logs when AETHER_SECURITY_LOGGING constant is defined and true.
 * This prevents accidental information disclosure in production logs.
 *
 * Usage:
 * - Define in wp-config.php: define('AETHER_SECURITY_LOGGING', true);
 * - Only enable on development/staging sites or during security investigations
 * - Never enable in production unless actively investigating security issues
 *
 * @param string $message Log message (will be sanitized to remove sensitive paths).
 * @param string $level   Log level: 'info', 'warning', 'error', 'critical'.
 *
 * @return void
 */
function securityLog(string $message, string $level = 'info'): void
{
	// Only log if explicitly enabled via constant
	if (! \defined('AETHER_SECURITY_LOGGING') || ! AETHER_SECURITY_LOGGING) {
		return;
	}

	// Sanitize message to prevent information disclosure
	// Remove absolute paths
	$sanitized = \preg_replace(
		'#' . \preg_quote(ABSPATH, '#') . '[^\s]*#',
		'[PATH]',
		$message
	);
	$message = \is_string($sanitized) ? $sanitized : $message;

	// Remove Windows-style paths
	$sanitized = \preg_replace('#[A-Za-z]:[\\\/][^\s]*#', '[PATH]', $message);
	$message = \is_string($sanitized) ? $sanitized : $message;

	// Remove temporary paths
	$sanitized = \preg_replace('#/(?:tmp|var/tmp)/[^\s]*#', '[TEMP]', $message);
	$message = \is_string($sanitized) ? $sanitized : $message;

	// Validate log level
	$validLevels = ['info', 'warning', 'error', 'critical'];
	if (! \in_array($level, $validLevels, true)) {
		$level = 'info';
	}

	// Format log message with timestamp, level, and plugin identifier
	$timestamp = \gmdate('Y-m-d H:i:s');
	$formattedMessage = \sprintf(
		'[%s] [Aether Security] [%s] %s',
		$timestamp,
		\strtoupper($level),
		$message
	);

	// Log using WordPress error_log if available
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- This is intentional security logging
	\error_log($formattedMessage);
}
