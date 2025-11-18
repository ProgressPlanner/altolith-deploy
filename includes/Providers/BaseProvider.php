<?php

/**
 * Base Provider Class
 *
 * Abstract base class for all Aether providers.
 * Defines the interface for provider registration, settings, and REST API endpoints.
 *
 * @package Aether\Providers
 */

namespace Aether\SiteExporter\Providers;

/**
 * Base provider class.
 *
 * All providers must extend this class and implement required methods.
 */
abstract class BaseProvider
{
	/**
	 * Get the unique provider identifier.
	 *
	 * @return string Provider ID (e.g., 'local-filesystem')
	 */
	abstract public function getId(): string;

	/**
	 * Get the human-readable provider name.
	 *
	 * @return string Provider display name
	 */
	abstract public function getName(): string;

	/**
	 * Get the provider description.
	 *
	 * @return string Provider description
	 */
	abstract public function getDescription(): string;

	/**
	 * Get deployment types this provider supports.
	 *
	 * @return array<string> Array of deployment type constants (e.g., ['static_site', 'blueprint_bundle'])
	 */
	abstract public function getDeploymentTypes(): array;

	/**
	 * Get provider settings fields definition.
	 *
	 * Each field should be an array with:
	 * - 'type': Field type (text, checkbox, select, etc.)
	 * - 'label': Human-readable label
	 * - 'name': Field name (used in form submission, e.g., 'export_path' or 'foo[bar]')
	 * - 'sanitize_callback': Callable to sanitize the value before saving
	 * - 'get': Callable to retrieve the current value
	 * - 'set': Callable to save the value
	 *
	 * @return array<array<string, mixed>> Array of field definitions
	 */
	abstract public function getSettings(): array;

	/**
	 * Register provider-specific REST API routes.
	 *
	 * Override this method to register custom REST endpoints for the provider.
	 * Routes will be automatically namespaced under /aether/v1/providers/{provider_id}/
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Default implementation does nothing.
		// Providers can override to register custom endpoints.
	}

	/**
	 * Get provider type/category.
	 *
	 * @return string Provider type (e.g., 'local-storage', 'cloud-storage', 'git-hosting')
	 */
	public function getType(): string
	{
		return 'generic';
	}

	/**
	 * Check if provider is configured.
	 *
	 * Default implementation checks if any settings field has a value.
	 * Providers can override for custom logic.
	 *
	 * @return bool True if configured, false otherwise
	 */
	public function isConfigured(): bool
	{
		$settings = $this->getSettings();
		foreach ($settings as $field) {
			if (isset($field['get']) && \is_callable($field['get'])) {
				$value = \call_user_func($field['get']);
				if (! empty($value)) {
					return true;
				}
			}
		}
		return false;
	}
}

