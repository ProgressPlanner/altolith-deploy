<?php

/**
 * Path Validator - Universal path validation for all environments
 *
 * Provides path validation that works in all environments including
 * WordPress Playground WASM where realpath() may not work as expected.
 *
 * @package Aether\SiteExporter
 */

namespace Aether\SiteExporter\Utilities;

/**
 * Class PathValidator
 *
 * Validates file paths to prevent security issues like path traversal.
 */
class PathValidator
{
	/**
	 * Validate a path against a base directory
	 *
	 * Ensures the path is within the allowed base directory and doesn't
	 * contain path traversal sequences. Works in all environments.
	 *
	 * @param string $path     The path to validate
	 * @param string $basePath The base directory that path must be within
	 * @return bool True if path is valid and within base, false otherwise
	 */
	public static function isPathWithinBase($path, $basePath)
	{
		// Normalize paths using WordPress function
		$normalizedPath = wp_normalize_path($path);
		$normalizedBase = wp_normalize_path($basePath);

		// Try realpath first (works in most environments)
		$realPath = realpath($path);
		$realBase = realpath($basePath);

		// If realpath works, use it (most reliable)
		if (false !== $realPath && false !== $realBase) {
			$realPath = wp_normalize_path($realPath);
			$realBase = wp_normalize_path($realBase);

			// Check if path starts with base
			return 0 === strpos($realPath, $realBase);
		}

		// Fallback: String-based validation when realpath fails
		// This handles WASM and other environments where realpath doesn't work

		// Check for path traversal sequences
		if (self::containsPathTraversal($normalizedPath)) {
			return false;
		}

		// Check if path starts with base
		if (0 !== strpos($normalizedPath, $normalizedBase)) {
			return false;
		}

		return true;
	}

	/**
	 * Check if a path contains path traversal sequences
	 *
	 * @param string $path The path to check
	 * @return bool True if path contains traversal, false otherwise
	 */
	public static function containsPathTraversal($path)
	{
		// Normalize first
		$path = wp_normalize_path($path);

		// Check for ../ or ..\ sequences
		if (preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $path)) {
			return true;
		}

		// Check for null bytes
		if (strpos($path, "\0") !== false) {
			return true;
		}

		return false;
	}

	/**
	 * Validate a path is safe (no traversal, no absolute path)
	 *
	 * @param string $path The path to validate
	 * @return bool True if safe, false otherwise
	 */
	public static function isSafePath($path)
	{
		// Check for path traversal
		if (self::containsPathTraversal($path)) {
			return false;
		}

		// Check for absolute paths (security risk)
		if (preg_match('#^[/\\\\]#', $path)) {
			return false;
		}

		// Check for Windows drive letters (C:\, etc)
		if (preg_match('#^[a-zA-Z]:[/\\\\]#', $path)) {
			return false;
		}

		return true;
	}

	/**
	 * Safely join path components
	 *
	 * Joins paths while validating each component is safe.
	 *
	 * @param string ...$parts Path components to join
	 * @return string|false Joined path or false if any component is unsafe
	 */
	public static function joinPaths(...$parts)
	{
		$joinedParts = [];

		foreach ($parts as $part) {
			// Skip empty parts
			if (empty($part)) {
				continue;
			}

			// First part can be absolute, others must be relative
			if (count($joinedParts) > 0) {
				// Validate relative parts
				if (! self::isSafePath($part)) {
					return false;
				}
			}

			$joinedParts[] = $part;
		}

		// Join with directory separator and normalize
		$path = implode('/', $joinedParts);
		return wp_normalize_path($path);
	}

	/**
	 * Check if a path is likely a symlink
	 *
	 * Works in environments where is_link() may not function properly.
	 *
	 * @param string $path The path to check
	 * @return bool True if likely a symlink, false otherwise
	 */
	public static function isLikelySymlink($path)
	{
		// Try is_link first if available
		if (function_exists('is_link')) {
			$result = @is_link($path);
			if (false !== $result) {
				return $result;
			}
		}

		// Fallback: Check if realpath differs from path
		$realPath = @realpath($path);
		if (false === $realPath) {
			// Can't determine, assume not a symlink
			return false;
		}

		// Normalize both for comparison
		$normalizedPath = wp_normalize_path($path);
		$normalizedReal = wp_normalize_path($realPath);

		// If they differ, likely a symlink
		return $normalizedPath !== $normalizedReal;
	}

	/**
	 * Sanitize a filename for safe filesystem use
	 *
	 * @param string $filename The filename to sanitize
	 * @return string Sanitized filename
	 */
	public static function sanitizeFilename($filename)
	{
		// Remove path components (security)
		$filename = basename($filename);

		// Use WordPress sanitization
		$filename = sanitize_file_name($filename);

		// Additional security: remove null bytes
		$filename = str_replace("\0", '', $filename);

		return $filename;
	}

	/**
	 * Validate a complete file path for security
	 *
	 * Comprehensive validation including:
	 * - Base directory check
	 * - Path traversal check
	 * - Null byte check
	 * - Symlink detection (optional)
	 *
	 * @param string $path          The full path to validate
	 * @param string $basePath      The base directory path must be within
	 * @param bool   $allowSymlinks Whether to allow symlinks (default: false)
	 * @return array<string, mixed> Array with 'valid' (bool) and 'error' (string) keys
	 */
	public static function validatePath($path, $basePath, $allowSymlinks = false)
	{
		// Check for null bytes
		if (strpos($path, "\0") !== false || strpos($basePath, "\0") !== false) {
			return [
				'valid' => false,
				'error' => 'Path contains null bytes',
			];
		}

		// Check for path traversal
		if (self::containsPathTraversal($path)) {
			return [
				'valid' => false,
				'error' => 'Path contains traversal sequences',
			];
		}

		// Check if path is within base
		if (! self::isPathWithinBase($path, $basePath)) {
			return [
				'valid' => false,
				'error' => 'Path is outside allowed directory',
			];
		}

		// Check for symlinks if not allowed
		if (! $allowSymlinks && file_exists($path)) {
			if (self::isLikelySymlink($path)) {
				return [
					'valid' => false,
					'error' => 'Symlinks are not allowed',
				];
			}
		}

		return [
			'valid' => true,
			'error' => null,
		];
	}

	/**
	 * Get the relative path from base to target
	 *
	 * @param string $from Base path
	 * @param string $to   Target path
	 * @return string|false Relative path or false on error
	 */
	public static function getRelativePath($from, $to)
	{
		// Normalize paths
		$from = wp_normalize_path($from);
		$to   = wp_normalize_path($to);

		// Use realpath if available
		$realFrom = realpath($from);
		$realTo   = realpath($to);

		if (false !== $realFrom && false !== $realTo) {
			$from = wp_normalize_path($realFrom);
			$to   = wp_normalize_path($realTo);
		}

		// Split into components
		$fromParts = explode('/', trim($from, '/'));
		$toParts   = explode('/', trim($to, '/'));

		// Find common base
		$common = 0;
		$length = min(count($fromParts), count($toParts));

		for ($i = 0; $i < $length; $i++) {
			if ($fromParts[ $i ] === $toParts[ $i ]) {
				$common++;
			} else {
				break;
			}
		}

		// Build relative path
		$relativeParts = [];

		// Add ../ for each remaining from component
		$remaining = count($fromParts) - $common;
		for ($i = 0; $i < $remaining; $i++) {
			$relativeParts[] = '..';
		}

		// Add remaining to components
		$toRemaining = array_slice($toParts, $common);
		$relativeParts = array_merge($relativeParts, $toRemaining);

		return implode('/', $relativeParts);
	}
}
