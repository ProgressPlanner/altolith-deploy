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
	 * Get REST API namespace.
	 *
	 * @return string API namespace.
	 */
	public function getNamespace(): string
	{
		return 'aether/site-exporter';
	}

	/**
	 * Send CORS headers for REST responses.
	 *
	 * Handles cross-origin requests for WordPress Playground iframe contexts.
	 * Uses actual request origin instead of wildcard when credentials are needed.
	 *
	 * @return void
	 */
	public function sendCorsHeaders(): void
	{
		// Get the origin from the request
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
		$origin = isset($_SERVER['HTTP_ORIGIN']) ? \esc_url_raw(\wp_unslash($_SERVER['HTTP_ORIGIN'])) : '';

		if ($origin) {
			// Use actual origin to allow credentials (required for cookie authentication)
			\header('Access-Control-Allow-Origin: ' . $origin);
		} else {
			// Fallback to wildcard for non-cross-origin requests
			\header('Access-Control-Allow-Origin: *');
		}

		\header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
		\header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
		\header('Access-Control-Allow-Credentials: true');
	}
}
