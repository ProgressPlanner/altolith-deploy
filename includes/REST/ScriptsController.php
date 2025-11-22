<?php

/**
 * Scripts REST Controller
 *
 * Provides WordPress script dependencies for dynamic loading.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Scripts;

/**
 * Scripts REST endpoints.
 */
class ScriptsController
{
	use RESTHelpersTrait;

	/**
	 * Required script handles for export modal.
	 *
	 * @var array
	 */
	private const REQUIRED_SCRIPTS = [
		'react-jsx-runtime',
		'wp-api-fetch',
		'wp-components',
		'wp-element',
		'wp-hooks',
		'wp-i18n',
	];

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		\register_rest_route(
			$this->getNamespace(),
			'/scripts',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getScripts' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Get required WordPress scripts for export modal.
	 *
	 * Returns script handles, IDs, URLs, and versions for dynamic loading.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with scripts array.
	 */
	public function getScripts(WP_REST_Request $request) // phpcs:ignore VariableAnalysis
	{
		try {
			// Ensure scripts are registered (wp_scripts() handles this internally if needed).
			$scripts     = \wp_scripts();
			$scriptsData = [];

			// Collect all scripts including dependencies.
			$allScripts = [];
			$toProcess  = self::REQUIRED_SCRIPTS;

			// Process scripts and their dependencies recursively.
			while (!empty($toProcess)) {
				$handle = array_shift($toProcess);

				// Skip if already processed.
				if (isset($allScripts[$handle])) {
					continue;
				}

				$script = $scripts->query($handle, 'registered');

				if (!$script) {
					// Script not registered - skip it.
					continue;
				}

				// Get script source URL.
				$src = $script->src;

				// If src is relative, make it absolute.
				if (!preg_match('|^(https?:)?//|', $src) && !($scripts->content_url && str_starts_with($src, $scripts->content_url))) {
					$src = $scripts->base_url . $src;
				}

				// Add version query parameter if available.
				if (!empty($script->ver)) {
					$src = \add_query_arg('ver', $script->ver, $src);
				}

				// Script ID format: {handle}-js (WordPress standard).
				$scriptId = $handle . '-js';

				// Get dependencies.
				$deps = isset($script->deps) ? $script->deps : [];

				$allScripts[$handle] = [
					'handle'      => $handle,
					'id'          => $scriptId,
					'src'         => $src,
					'version'     => $script->ver ?? '',
					'dependencies' => $deps,
				];

				// Add dependencies to queue for processing.
				foreach ($deps as $dep) {
					if (!isset($allScripts[$dep])) {
						$toProcess[] = $dep;
					}
				}
			}

			// Convert to indexed array for response.
			$scriptsData = array_values($allScripts);

			return new WP_REST_Response([
				'success' => true,
				'scripts' => $scriptsData,
			], 200);
		} catch (\Exception $e) {
			// Sanitize exception message to prevent information disclosure.
			$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());

			return new WP_REST_Response([
				'success' => false,
				'error'   => $sanitizedMessage,
			], 500);
		}
	}
}
