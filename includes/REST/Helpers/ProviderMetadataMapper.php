<?php

/**
 * Provider Metadata Mapper
 *
 * Maps provider instances to metadata arrays for REST API responses.
 *
 * @package Aether\REST\Helpers
 */

namespace Aether\SiteExporter\REST\Helpers;

use Aether\SiteExporter\Providers\BaseProvider;

\defined('ABSPATH') || exit;

/**
 * Provider metadata mapper helper class.
 */
class ProviderMetadataMapper
{
	/**
	 * Get provider metadata array.
	 *
	 * @param BaseProvider $provider Provider instance.
	 * @return array<string, mixed> Provider metadata.
	 */
	public function map(BaseProvider $provider): array
	{
		$settings = $provider->getSettings();

		// Get provider-specific deployment types from config
		$providerId = $provider->getId();
		$providerSettings = \get_option('aether_site_exporter_settings', []);
		$providerConfig = $providerSettings['providers'][$providerId] ?? [];
		$providerDeploymentTypes = $providerConfig['deployment_types'] ?? null;

		// Get global deployment types
		$globalDeploymentTypes = $providerSettings['global_deployment_types'] ?? null;

		// Merge: use provider-specific if set, otherwise use global defaults, otherwise use provider's supported types
		$deploymentTypes = $providerDeploymentTypes;
		if (!\is_array($deploymentTypes) || empty($deploymentTypes)) {
			if (\is_array($globalDeploymentTypes) && !empty($globalDeploymentTypes)) {
				$deploymentTypes = $globalDeploymentTypes;
			} else {
				$deploymentTypes = $provider->getDeploymentTypes();
			}
		}

		// Map settings fields
		$settingsFields = $this->mapSettingsFields($settings);

		return [
			'id' => $provider->getId(),
			'name' => $provider->getName(),
			'description' => $provider->getDescription(),
			'type' => $provider->getType(),
			'deployment_types' => $provider->getDeploymentTypes(), // Always return supported types for UI
			'dependencies' => $provider->getDependencies(), // Provider dependencies (provider IDs)
			'settings_fields' => $settingsFields,
		];
	}

	/**
	 * Map settings fields to frontend format.
	 *
	 * @param array<array<string, mixed>> $settings Settings fields from provider.
	 * @return array<array<string, mixed>> Mapped settings fields.
	 */
	private function mapSettingsFields(array $settings): array
	{
		$settingsFields = [];

		foreach ($settings as $field) {
			// Include all field properties needed by the frontend
			$fieldData = [
				'type' => $field['type'] ?? 'text',
				'label' => $field['label'] ?? '',
				'name' => $field['name'] ?? '',
			];

			// Include optional field properties
			if (isset($field['description'])) {
				$fieldData['description'] = $field['description'];
			}
			if (isset($field['options'])) {
				$fieldData['options'] = $field['options'];
			}
			if (isset($field['defaultValue'])) {
				$fieldData['defaultValue'] = $field['defaultValue'];
			}
			if (isset($field['required'])) {
				$fieldData['required'] = $field['required'];
			}
			if (isset($field['placeholder'])) {
				$fieldData['placeholder'] = $field['placeholder'];
			}
			if (isset($field['sensitive'])) {
				$fieldData['sensitive'] = $field['sensitive'];
			}
			// Include deploymentType property if present (for CSS-based hiding)
			if (isset($field['deploymentType'])) {
				$fieldData['deploymentType'] = $field['deploymentType'];
			}
			// Include hidden property if present (for hiding fields)
			if (isset($field['hidden'])) {
				$fieldData['hidden'] = (bool) $field['hidden'];
			}
			// Include is_advanced property if present (defaults to false)
			if (isset($field['is_advanced'])) {
				$fieldData['is_advanced'] = (bool) $field['is_advanced'];
			}

			$settingsFields[] = $fieldData;
		}

		return $settingsFields;
	}
}

