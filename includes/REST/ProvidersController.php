<?php

/**
 * Providers REST Controller
 *
 * REST API endpoints for provider metadata and discovery.
 *
 * @package Aether\REST
 */

namespace Aether\SiteExporter\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Aether\SiteExporter\Providers\ProviderRegistry;

/**
 * Providers REST controller.
 */
class ProvidersController
{
	use RESTHelpersTrait;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Get all providers.
		\register_rest_route(
			$this->getNamespace(),
			'/providers',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getProviders' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get specific provider.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<provider_id>[a-z0-9_-]+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getProvider' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Get providers by deployment type.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/by-deployment-type/(?P<deployment_type>[a-z0-9_-]+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getProvidersByDeploymentType' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Get all providers.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with provider metadata.
	 */
	public function getProviders(WP_REST_Request $request): WP_REST_Response
	{
		$registry = ProviderRegistry::getInstance();
		$providers = $registry->getAll();

		$metadata = [];
		foreach ($providers as $provider) {
			try {
				$metadata[] = $this->getProviderMetadata($provider);
			} catch (\Throwable $e) {
				// Log error but continue processing other providers
				\error_log(\sprintf(
					'Aether: Error getting metadata for provider %s: %s',
					$provider->getId(),
					$e->getMessage()
				));
			}
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'providers' => $metadata,
			],
			200
		);
	}

	/**
	 * Get specific provider.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function getProvider(WP_REST_Request $request)
	{
		$providerId = \sanitize_key($request->get_param('provider_id'));
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->get($providerId);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				\sprintf(\__('Provider not found: %s', 'aether-site-exporter'), $providerId),
				[ 'status' => 404 ]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'provider' => $this->getProviderMetadata($provider),
			],
			200
		);
	}

	/**
	 * Get providers by deployment type.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with provider metadata.
	 */
	public function getProvidersByDeploymentType(WP_REST_Request $request): WP_REST_Response
	{
		$deploymentType = \sanitize_key($request->get_param('deployment_type'));
		$registry = ProviderRegistry::getInstance();
		$providers = $registry->getByDeploymentType($deploymentType);

		$metadata = [];
		foreach ($providers as $provider) {
			$metadata[] = $this->getProviderMetadata($provider);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'deployment_type' => $deploymentType,
				'providers' => $metadata,
			],
			200
		);
	}

	/**
	 * Get provider metadata array.
	 *
	 * @param \Aether\SiteExporter\Providers\BaseProvider $provider Provider instance.
	 * @return array<string, mixed> Provider metadata.
	 */
	private function getProviderMetadata($provider): array
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

		// Include all settings fields (no filtering - fields will be hidden via CSS)
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

			$settingsFields[] = $fieldData;
		}

		return [
			'id' => $provider->getId(),
			'name' => $provider->getName(),
			'description' => $provider->getDescription(),
			'type' => $provider->getType(),
			'deployment_types' => $provider->getDeploymentTypes(), // Always return supported types for UI
			'dependencies' => $provider->getDependencies(), // Provider dependencies (provider IDs)
			'settings_fields' => $settingsFields,
			'configured' => $provider->isConfigured(),
		];
	}
}
