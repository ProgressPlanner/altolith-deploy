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
	 * Get provider-specific settings fields definition.
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
	abstract public function getProviderSettings(): array;

	/**
	 * Get provider settings fields definition.
	 *
	 * This method automatically prepends the deployment_types field to provider-specific settings.
	 * The deployment_types field is generated based on getDeploymentTypes().
	 *
	 * @return array<array<string, mixed>> Array of field definitions
	 */
	public function getSettings(): array
	{
		// Get supported deployment types for this provider
		$supportedTypes = $this->getDeploymentTypes();

		// Map deployment types to option labels
		$deploymentTypeLabels = [
			'static_site' => \__('Static Site', 'aether-site-exporter'),
			'blueprint_bundle' => \__('Blueprint Bundle', 'aether-site-exporter'),
			'edge_functions' => \__('Edge Functions', 'aether-site-exporter'),
		];

		// Build options array only for supported deployment types
		$deploymentTypeOptions = [];
		foreach ($supportedTypes as $type) {
			if (isset($deploymentTypeLabels[$type])) {
				$deploymentTypeOptions[] = [
					'value' => $type,
					'label' => $deploymentTypeLabels[$type],
				];
			}
		}

		$providerId = $this->getId();

		// Generate deployment_types field
		$deploymentTypesField = [
			'type' => 'checkbox-group',
			'label' => \__('Deployment Types', 'aether-site-exporter'),
			'name' => 'deployment_types',
			'description' => \__('Select which types of exports this provider should handle.', 'aether-site-exporter'),
			'options' => $deploymentTypeOptions,
			'defaultValue' => $supportedTypes, // Default to all supported types
			'sanitize_callback' => function ($value) use ($supportedTypes) {
				if (!\is_array($value)) {
					return $supportedTypes; // Default to all supported types
				}
				// Only allow values that are in supported types
				return \array_values(\array_intersect($value, $supportedTypes));
			},
			'get' => function () use ($supportedTypes, $providerId) {
				$settings = \get_option('aether_site_exporter_settings', []);
				$deploymentTypes = $settings['providers'][$providerId]['deployment_types'] ?? null;
				// Default to all supported types if not set
				if (!\is_array($deploymentTypes) || empty($deploymentTypes)) {
					return $supportedTypes;
				}
				// Ensure only supported types are returned
				return \array_values(\array_intersect($deploymentTypes, $supportedTypes));
			},
			'set' => function ($value) use ($providerId) {
				$settings = \get_option('aether_site_exporter_settings', []);
				if (!isset($settings['providers']) || !\is_array($settings['providers'])) {
					$settings['providers'] = [];
				}
				if (!isset($settings['providers'][$providerId]) || !\is_array($settings['providers'][$providerId])) {
					$settings['providers'][$providerId] = [];
				}
				$settings['providers'][$providerId]['deployment_types'] = $value;
				\update_option('aether_site_exporter_settings', $settings);
			},
		];

		// Get provider-specific settings
		$providerSettings = $this->getProviderSettings();

		// Prepend deployment_types field to provider settings
		return \array_merge([$deploymentTypesField], $providerSettings);
	}

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

	/**
	 * Get provider dependencies.
	 *
	 * Returns an array of provider IDs that this provider depends on.
	 * A provider cannot be enabled unless all its dependencies are satisfied
	 * (exist, are enabled, and are configured).
	 *
	 * @return array<string> Array of provider IDs this provider depends on
	 */
	public function getDependencies(): array
	{
		return [];
	}
}
