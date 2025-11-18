<?php

/**
 * Local Filesystem Provider
 *
 * Provider for local file storage without cloud deployment.
 * Stores exported sites locally in the WordPress uploads directory.
 *
 * @package Aether\Providers
 */

namespace Aether\SiteExporter\Providers;

/**
 * Local filesystem provider class.
 */
class LocalFilesystemProvider extends BaseProvider
{
	/**
	 * Provider ID.
	 *
	 * @var string
	 */
	private const PROVIDER_ID = 'local-filesystem';

	/**
	 * Get the unique provider identifier.
	 *
	 * @return string Provider ID
	 */
	public function getId(): string
	{
		return self::PROVIDER_ID;
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * @return string Provider name
	 */
	public function getName(): string
	{
		return \__('Local Filesystem', 'aether-site-exporter');
	}

	/**
	 * Get the provider description.
	 *
	 * @return string Provider description
	 */
	public function getDescription(): string
	{
		return \__('Store exported sites locally in the WordPress uploads directory. No cloud deployment required.', 'aether-site-exporter');
	}

	/**
	 * Get deployment types this provider supports.
	 *
	 * @return array<string> Array of deployment types
	 */
	public function getDeploymentTypes(): array
	{
		return ['static_site', 'blueprint_bundle'];
	}

	/**
	 * Get provider type.
	 *
	 * @return string Provider type
	 */
	public function getType(): string
	{
		return 'local-storage';
	}

	/**
	 * Get provider settings fields definition.
	 *
	 * @return array<array<string, mixed>> Array of field definitions
	 */
	public function getSettings(): array
	{
		return [
			[
				'type' => 'checkbox-group',
				'label' => \__('Deployment Types', 'aether-site-exporter'),
				'name' => 'deployment_types',
				'sanitize_callback' => function ($value) {
					if (! \is_array($value)) {
						return ['static_site', 'blueprint_bundle'];
					}
					$validTypes = ['static_site', 'blueprint_bundle', 'edge_functions'];
					return \array_values(\array_intersect($value, $validTypes));
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					$deploymentTypes = $settings['providers'][self::PROVIDER_ID]['deployment_types'] ?? null;
					// Default to both static_site and blueprint_bundle if not set
					if (! \is_array($deploymentTypes) || empty($deploymentTypes)) {
						return ['static_site', 'blueprint_bundle'];
					}
					return $deploymentTypes;
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['deployment_types'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'text',
				'label' => \__('Blueprint-bundle file path', 'aether-site-exporter'),
				'name' => 'export_path',
				'sanitize_callback' => function ($value) {
					if (! \is_string($value)) {
						return 'blueprint-bundle/bundle.zip';
					}
					// Validate path doesn't contain path traversal or absolute paths
					if (
						\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $value) ||
						\preg_match('#^[/\\\\]#', $value) ||
						\strpos($value, "\0") !== false
					) {
						return 'blueprint-bundle/bundle.zip';
					}
					return \sanitize_text_field($value);
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['export_path'] ?? 'blueprint-bundle/bundle.zip';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['export_path'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'text',
				'label' => \__('Public URL', 'aether-site-exporter'),
				'name' => 'public_url',
				'sanitize_callback' => function ($value) {
					if (empty($value)) {
						return '';
					}
					return \esc_url_raw($value);
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['public_url'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['public_url'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'text',
				'label' => \__('Static Files Directory', 'aether-site-exporter'),
				'name' => 'static_files_path',
				'sanitize_callback' => function ($value) {
					if (! \is_string($value)) {
						return 'static/';
					}
					// Validate path doesn't contain path traversal or absolute paths
					if (
						\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $value) ||
						\preg_match('#^[/\\\\]#', $value) ||
						\strpos($value, "\0") !== false
					) {
						return 'static/';
					}
					return \sanitize_text_field($value);
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['static_files_path'] ?? 'static/';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['static_files_path'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
		];
	}

	/**
	 * Check if provider is configured.
	 *
	 * Local filesystem is always considered configured since it doesn't require credentials.
	 *
	 * @return bool True if configured
	 */
	public function isConfigured(): bool
	{
		return true;
	}
}

