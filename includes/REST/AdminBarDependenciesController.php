<?php

/**
 * Admin Bar Dependencies REST Controller
 *
 * Provides WordPress script and style dependencies for dynamic loading.
 * Returns both scripts and styles in a single API call for efficiency.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WP_Scripts;
use WP_Styles;

/**
 * Admin Bar Dependencies REST endpoints.
 */
class AdminBarDependenciesController
{
	use RESTHelpersTrait;

	/**
	 * Required script handles for export modal.
	 *
	 * @var array<string>
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
	 * Required style handles for export modal.
	 *
	 * @var array<string>
	 */
	private const REQUIRED_STYLES = [
		'wp-components',
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
			'/admin-bar-dependencies',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getDependencies' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Get required WordPress scripts and styles for export modal.
	 *
	 * Returns script and style handles, IDs, URLs, and versions for dynamic loading.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response with scripts and styles arrays, or WP_Error on failure.
	 */
	public function getDependencies(WP_REST_Request $request) // phpcs:ignore VariableAnalysis
	{
		try {
			$scriptsData = $this->getScriptsData();
			$stylesData  = $this->getStylesData();

			return new WP_REST_Response([
				'success' => true,
				'scripts' => $scriptsData,
				'styles'  => $stylesData,
			], 200);
		} catch (\Exception $e) {
			// Sanitize exception message to prevent information disclosure.
			$sanitizedMessage = $this->sanitizeExceptionMessage($e->getMessage());

			return new WP_Error(
				'dependencies_fetch_failed',
				$sanitizedMessage,
				['status' => 500]
			);
		}
	}

	/**
	 * Get required WordPress scripts data.
	 *
	 * @return array<int, array{handle: string, id: string, src: string, version: string|bool, dependencies: array<string>}> Scripts data array.
	 */
	private function getScriptsData(): array
	{
		// Ensure scripts are registered (wp_scripts() handles this internally if needed).
		$scripts = \wp_scripts();

		// Collect all scripts including dependencies.
		$allScripts = [];
		$toProcess  = self::REQUIRED_SCRIPTS;

		// Process scripts and their dependencies recursively.
		while (!empty($toProcess)) {
			$handle = \array_shift($toProcess);

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

			// If src is false or empty, skip this script.
			if ($src === false || $src === '') {
				continue;
			}

			// If src is relative, make it absolute.
			if (!\preg_match('|^(https?:)?//|', $src) && !($scripts->content_url && \str_starts_with($src, $scripts->content_url))) {
				$src = $scripts->base_url . $src;
			}

			// Add version query parameter if available.
			if (!empty($script->ver)) {
				$src = \add_query_arg('ver', $script->ver, $src);
			}

			// Apply script_loader_src filter (matching WordPress core's do_item() method).
			// This allows plugins/themes to modify script URLs and ensures proper resolution
			// of file extensions (e.g., .min.js) based on SCRIPT_DEBUG and other factors.
			$src = \esc_url_raw(\apply_filters('script_loader_src', $src, $handle));

			// Script ID format: {handle}-js (WordPress standard).
			$scriptId = $handle . '-js';

			// Get dependencies - deps is always an array in _WP_Dependency.
			$deps = $script->deps;

			$allScripts[$handle] = [
				'handle'       => $handle,
				'id'           => $scriptId,
				'src'          => $src,
				'version'      => $script->ver !== false ? $script->ver : '',
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
		return \array_values($allScripts);
	}

	/**
	 * Get required WordPress styles data.
	 *
	 * @return array<int, array{handle: string, id: string, src: string, version: string|bool, dependencies: array<string>}> Styles data array.
	 */
	private function getStylesData(): array
	{
		// Ensure styles are registered (wp_styles() handles this internally if needed).
		$styles = \wp_styles();

		// Collect all styles including dependencies.
		$allStyles = [];
		$toProcess = self::REQUIRED_STYLES;

		// Process styles and their dependencies recursively.
		while (!empty($toProcess)) {
			$handle = \array_shift($toProcess);

			// Skip if already processed.
			if (isset($allStyles[$handle])) {
				continue;
			}

			$style = $styles->query($handle, 'registered');

			if (!$style) {
				// Style not registered - skip it.
				continue;
			}

			// Get style source URL.
			$src = $style->src;

			// If src is false or empty, skip this style.
			if ($src === false || $src === '') {
				continue;
			}

			// If src is relative, make it absolute.
			if (!\preg_match('|^(https?:)?//|', $src) && !($styles->content_url && \str_starts_with($src, $styles->content_url))) {
				$src = $styles->base_url . $src;
			}

			// Add version query parameter if available.
			if (!empty($style->ver)) {
				$src = \add_query_arg('ver', $style->ver, $src);
			}

			// Apply style_loader_src filter (matching WordPress core's do_item() method).
			// This allows plugins/themes to modify style URLs and ensures proper resolution
			// of file extensions (e.g., .min.css) based on SCRIPT_DEBUG and other factors.
			$src = \esc_url(\apply_filters('style_loader_src', $src, $handle));

			// Style ID format: {handle}-css (WordPress standard).
			$styleId = $handle . '-css';

			// Get dependencies - deps is always an array in _WP_Dependency.
			$deps = $style->deps;

			$allStyles[$handle] = [
				'handle'       => $handle,
				'id'           => $styleId,
				'src'          => $src,
				'version'      => $style->ver !== false ? $style->ver : '',
				'dependencies' => $deps,
			];

			// Add dependencies to queue for processing.
			foreach ($deps as $dep) {
				if (!isset($allStyles[$dep])) {
					$toProcess[] = $dep;
				}
			}
		}

		// Convert to indexed array for response.
		return \array_values($allStyles);
	}
}
