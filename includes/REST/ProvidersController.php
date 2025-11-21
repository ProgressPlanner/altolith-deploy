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
use Aether\SiteExporter\REST\Helpers\ProviderMetadataMapper;

/**
 * Providers REST controller.
 */
class ProvidersController
{
	use RESTHelpersTrait;

	/**
	 * Provider metadata mapper instance.
	 *
	 * @var ProviderMetadataMapper
	 */
	private ProviderMetadataMapper $metadataMapper;

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$this->metadataMapper = new ProviderMetadataMapper();
	}

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

		// Get specific provider (supports both provider types and instance IDs with colons).
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<provider_id>[a-z0-9_:-]+)',
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

		// Create new provider instance.
		\register_rest_route(
			$this->getNamespace(),
			'/providers/(?P<provider_type>[a-z0-9_-]+)/instances',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'createInstance' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'instance_name' => [
						'required' => true,
						'type'     => 'string',
					],
				],
			]
		);
	}

	/**
	 * Get all providers.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with provider metadata.
	 */
	public function getProviders(WP_REST_Request $request): WP_REST_Response // phpcs:ignore VariableAnalysis.CodeAnalysis
	{
		$registry = ProviderRegistry::getInstance();
		$providers = $registry->getAll();

		$metadata = [];
		foreach ($providers as $provider) {
			try {
				$metadata[] = $this->metadataMapper->map($provider);
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
	 * Get specific provider or provider instance.
	 *
	 * Supports both provider types (e.g., 'local-filesystem') and instance IDs (e.g., 'local-filesystem:uuid').
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function getProvider(WP_REST_Request $request)
	{
		$providerId = $request->get_param('provider_id');
		// Note: Cannot use sanitize_key() as it removes colons, which are needed for instance IDs
		$providerId = \sanitize_text_field($providerId);

		$registry = ProviderRegistry::getInstance();

		// Check if this is an instance ID (contains colon) or a provider type
		if (\strpos($providerId, ':') !== false) {
			// Instance ID - get the provider for this instance
			$provider = $registry->getProviderForInstance($providerId);

			if (! $provider) {
				return new WP_Error(
					'provider_not_found',
					/* translators: %s: Provider ID */
					\sprintf(\__('Provider instance not found: %s', 'aether-site-exporter'), $providerId),
					[ 'status' => 404 ]
				);
			}

			// Get instance-specific configuration
			$settings = \get_option('aether_site_exporter_settings', []);
			$instanceConfig = $settings['providers'][$providerId] ?? [];

			// Return provider metadata with instance config
			return new WP_REST_Response(
				[
					'success' => true,
					'provider' => $this->metadataMapper->map($provider),
					'config' => $instanceConfig,
				],
				200
			);
		} else {
			// Provider type - get the base provider
			$provider = $registry->get($providerId);

			if (! $provider) {
				return new WP_Error(
					'provider_not_found',
					/* translators: %s: Provider ID */
					\sprintf(\__('Provider not found: %s', 'aether-site-exporter'), $providerId),
					[ 'status' => 404 ]
				);
			}

			return new WP_REST_Response(
				[
					'success' => true,
					'provider' => $this->metadataMapper->map($provider),
				],
				200
			);
		}
	}

	/**
	 * Get providers by deployment type.
	 *
	 * Returns enabled provider instances that support the deployment type.
	 * This endpoint is used for backward compatibility but should be replaced
	 * with instance-based endpoints in new code.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with provider metadata.
	 */
	public function getProvidersByDeploymentType(WP_REST_Request $request): WP_REST_Response
	{
		$deploymentType = \sanitize_key($request->get_param('deployment_type'));
		$registry = ProviderRegistry::getInstance();

		// Get enabled instances for this deployment type
		$instance = $registry->getEnabledInstanceForDeploymentType($deploymentType);

		if ($instance) {
			// Get provider metadata for the instance's provider type
			$provider = $registry->getProviderForInstance($instance['instanceId']);
			if ($provider) {
				$metadata = [$this->metadataMapper->map($provider)];
			} else {
				$metadata = [];
			}
		} else {
			// Fallback to provider types for backward compatibility
			$providers = $registry->getByDeploymentType($deploymentType);
			$metadata = [];
			foreach ($providers as $provider) {
				$metadata[] = $this->metadataMapper->map($provider);
			}
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
	 * Create a new provider instance.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function createInstance(WP_REST_Request $request)
	{
		$providerType = \sanitize_key($request->get_param('provider_type'));
		$instanceName = \sanitize_text_field($request->get_param('instance_name'));
		$clientInstanceId = $request->get_param('instance_id'); // Optional client-generated ID

		// Verify provider type exists.
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->get($providerType);

		if (! $provider) {
			return new WP_Error(
				'provider_not_found',
				/* translators: %s: Provider type */
				\sprintf(\__('Provider type not found: %s', 'aether-site-exporter'), $providerType),
				[ 'status' => 404 ]
			);
		}

		// Use client-provided instance ID if valid, otherwise generate server-side.
		if ($clientInstanceId && \is_string($clientInstanceId)) {
			// Validate format: provider_type:uuid
			$parts = \explode(':', $clientInstanceId, 2);
			if (\count($parts) === 2 && $parts[0] === $providerType && ! empty($parts[1])) {
				$instanceId = \sanitize_text_field($clientInstanceId);
			} else {
				return new WP_Error(
					'invalid_instance_id',
					\__('Invalid instance ID format. Expected provider_type:uuid', 'aether-site-exporter'),
					[ 'status' => 400 ]
				);
			}
		} else {
			// Generate new instance ID server-side (backward compatible).
			$instanceId = $registry->createInstanceId($providerType);
		}

		// Create initial config with metadata.
		$config = [
			'provider_type' => $providerType,
			'instance_name' => $instanceName,
			'enabled' => false,
			'deployment_types' => $provider->getDeploymentTypes(),
		];

		// Save to database.
		$settings = \get_option('aether_site_exporter_settings', []);
		if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
			$settings['providers'] = [];
		}
		$settings['providers'][$instanceId] = $config;
		\update_option('aether_site_exporter_settings', $settings);

		/**
		 * Action fired after provider instance is created.
		 *
		 * @param string $instanceId   The instance ID.
		 * @param string $providerType The provider type.
		 * @param string $instanceName The instance name.
		 */
		\do_action('aether_provider_instance_created', $instanceId, $providerType, $instanceName);

		return new WP_REST_Response(
			[
				'success' => true,
				'instance_id' => $instanceId,
				'instance_name' => $instanceName,
				'provider_type' => $providerType,
				'message' => \__('Provider instance created successfully.', 'aether-site-exporter'),
			],
			201
		);
	}
}
