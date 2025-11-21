<?php

/**
 * Security Validator Utility
 *
 * Centralizes security validation patterns to prevent common vulnerabilities
 * like path traversal, null byte injection, and unauthorized path access.
 *
 * @package Aether\Utilities
 */

namespace Aether\SiteExporter\Utilities;

\defined('ABSPATH') || exit;

/**
 * Security validator utility class.
 */
class SecurityValidator
{
	/**
	 * Validate that a path does not contain path traversal sequences.
	 *
	 * @param string $path The path to validate.
	 * @return bool True if path is safe, false if it contains traversal sequences.
	 */
	public static function isValidPath(string $path): bool
	{
		// Check for path traversal sequences (../ or ..\)
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $path)) {
			return false;
		}

		// Check for null bytes
		if (\strpos($path, "\0") !== false) {
			return false;
		}

		return true;
	}

	/**
	 * Validate that a path is relative (not absolute).
	 *
	 * @param string $path The path to validate.
	 * @return bool True if path is relative, false if absolute.
	 */
	public static function isRelativePath(string $path): bool
	{
		// Check for Unix-style absolute paths
		if (\preg_match('#^[/\\\\]#', $path)) {
			return false;
		}

		// Check for Windows-style absolute paths (C:\, D:\, etc.)
		if (\preg_match('#^[A-Za-z]:[/\\\\]#', $path)) {
			return false;
		}

		return true;
	}

	/**
	 * Validate a slug/identifier for safe use in file paths.
	 *
	 * @param string $slug The slug to validate.
	 * @return bool True if slug is safe, false otherwise.
	 */
	public static function isValidSlug(string $slug): bool
	{
		// Check for empty slug
		if (empty($slug)) {
			return false;
		}

		// Check for path traversal
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $slug)) {
			return false;
		}

		// Check for null bytes
		if (\strpos($slug, "\0") !== false) {
			return false;
		}

		// Check for dangerous values
		if ($slug === '.' || $slug === '..') {
			return false;
		}

		return true;
	}

	/**
	 * Validate a path for export operations.
	 *
	 * Validates that a path is safe for use in export operations:
	 * - No path traversal sequences
	 * - No null bytes
	 * - Relative path (not absolute)
	 *
	 * @param string $path The path to validate.
	 * @return array{valid: bool, error?: string} Validation result with 'valid' boolean and optional 'error' message.
	 */
	public static function validateExportPath(string $path): array
	{
		// Check for path traversal
		if (! self::isValidPath($path)) {
			return [
				'valid' => false,
				'error' => 'Path contains traversal sequences or null bytes',
			];
		}

		// Check for absolute paths
		if (! self::isRelativePath($path)) {
			return [
				'valid' => false,
				'error' => 'Path must be relative, not absolute',
			];
		}

		return [
			'valid' => true,
		];
	}

	/**
	 * Validate a slug for use in file operations.
	 *
	 * @param string $slug The slug to validate.
	 * @return array{valid: bool, error?: string} Validation result with 'valid' boolean and optional 'error' message.
	 */
	public static function validateSlug(string $slug): array
	{
		if (! self::isValidSlug($slug)) {
			return [
				'valid' => false,
				'error' => 'Invalid slug: contains dangerous characters or path traversal',
			];
		}

		return [
			'valid' => true,
		];
	}

	/**
	 * Validate multiple security checks at once.
	 *
	 * @param string      $path          The path to validate.
	 * @param string|null $basePath      Optional base path to ensure path is within.
	 * @param bool        $requireRelative Whether path must be relative (default: false).
	 * @return array{valid: bool, error?: string} Validation result.
	 */
	public static function validatePathComprehensive(string $path, ?string $basePath = null, bool $requireRelative = false): array
	{
		// Basic path validation
		if (! self::isValidPath($path)) {
			return [
				'valid' => false,
				'error' => 'Path contains traversal sequences or null bytes',
			];
		}

		// Check if relative path is required
		if ($requireRelative && ! self::isRelativePath($path)) {
			return [
				'valid' => false,
				'error' => 'Path must be relative, not absolute',
			];
		}

		// Check if path is within base path
		if ($basePath !== null) {
			$validation = PathValidator::validatePath($path, $basePath, false);
			if (! $validation['valid']) {
				return $validation;
			}
		}

		return [
			'valid' => true,
		];
	}
}

