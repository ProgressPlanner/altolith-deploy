<?php

/**
 * Provider Registry
 *
 * Singleton registry for managing all PHP provider instances.
 * Providers register themselves via the 'aether_providers' filter.
 *
 * @package Aether\Providers
 */

namespace Aether\SiteExporter\Providers;

/**
 * Provider registry singleton.
 */
class ProviderRegistry
{
	/**
	 * Singleton instance.
	 *
	 * @var ProviderRegistry|null
	 */
	private static ?ProviderRegistry $instance = null;

	/**
	 * Registered providers.
	 *
	 * @var array<string, BaseProvider>
	 */
	private array $providers = [];

	/**
	 * Get singleton instance.
	 *
	 * @return ProviderRegistry Registry instance
	 */
	public static function getInstance(): ProviderRegistry
	{
		if (null === self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Private constructor (singleton pattern).
	 */
	private function __construct()
	{
		$this->discoverProviders();
	}

	/**
	 * Discover and register all providers via filter.
	 *
	 * Can be called multiple times to discover providers registered after
	 * initial discovery. Duplicate providers (same ID) are skipped.
	 *
	 * @return void
	 */
	private function discoverProviders(): void
	{
		/**
		 * Filter to register providers.
		 *
		 * @param array<mixed> $providers Array of provider instances (may contain non-BaseProvider items)
		 * @return array<mixed> Modified array of providers
		 */
		$providers = \apply_filters('aether_providers', []);

		foreach ($providers as $provider) {
			if ($provider instanceof BaseProvider) {
				// Only register if not already registered (prevent duplicates)
				$providerId = $provider->getId();
				if (! isset($this->providers[$providerId])) {
					$this->register($provider);
				}
			}
		}
	}

	/**
	 * Register a provider instance.
	 *
	 * @param BaseProvider $provider Provider instance
	 * @return void
	 */
	public function register(BaseProvider $provider): void
	{
		$providerId = $provider->getId();
		$this->providers[$providerId] = $provider;
	}

	/**
	 * Get a provider by ID.
	 *
	 * Re-discovers providers to ensure all providers registered via the filter
	 * are included, even if they were registered after the registry was first
	 * instantiated.
	 *
	 * @param string $providerId Provider ID
	 * @return BaseProvider|null Provider instance or null if not found
	 */
	public function get(string $providerId): ?BaseProvider
	{
		// Re-discover providers to catch any that were registered after initial discovery
		$this->discoverProviders();
		return $this->providers[$providerId] ?? null;
	}

	/**
	 * Get all registered providers.
	 *
	 * Re-discovers providers to ensure all providers registered via the filter
	 * are included, even if they were registered after the registry was first
	 * instantiated.
	 *
	 * @return array<string, BaseProvider> Array of provider instances keyed by ID
	 */
	public function getAll(): array
	{
		// Re-discover providers to catch any that were registered after initial discovery
		$this->discoverProviders();
		return $this->providers;
	}

	/**
	 * Get all provider IDs.
	 *
	 * @return array<string> Array of provider IDs
	 */
	public function getAllIds(): array
	{
		return \array_keys($this->providers);
	}

	/**
	 * Get providers that support a specific deployment type.
	 *
	 * Re-discovers providers to ensure all providers registered via the filter
	 * are included, even if they were registered after the registry was first
	 * instantiated.
	 *
	 * @param string $deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
	 * @return array<BaseProvider> Array of providers that support the deployment type
	 */
	public function getByDeploymentType(string $deploymentType): array
	{
		// Re-discover providers to catch any that were registered after initial discovery
		$this->discoverProviders();
		$supported = [];
		foreach ($this->providers as $provider) {
			if (\in_array($deploymentType, $provider->getDeploymentTypes(), true)) {
				$supported[] = $provider;
			}
		}
		return $supported;
	}

	/**
	 * Get default provider.
	 *
	 * Re-discovers providers to ensure all providers registered via the filter
	 * are included, even if they were registered after the registry was first
	 * instantiated.
	 *
	 * Returns the first provider that supports static_site deployment,
	 * or the first registered provider if none found.
	 *
	 * @return BaseProvider|null Default provider or null if none registered
	 */
	public function getDefault(): ?BaseProvider
	{
		// Re-discover providers to catch any that were registered after initial discovery
		$this->discoverProviders();
		// Try to get provider for static_site deployment first
		$staticSiteProviders = $this->getByDeploymentType('static_site');
		if (! empty($staticSiteProviders)) {
			return $staticSiteProviders[0];
		}

		// Fallback to first registered provider
		if (! empty($this->providers)) {
			return \reset($this->providers);
		}

		return null;
	}

	/**
	 * Get provider for a specific deployment type.
	 *
	 * Returns the first provider that supports the deployment type.
	 *
	 * @param string $deploymentType Deployment type
	 * @return BaseProvider|null Provider instance or null if not found
	 */
	public function getForDeploymentType(string $deploymentType): ?BaseProvider
	{
		$providers = $this->getByDeploymentType($deploymentType);
		return ! empty($providers) ? $providers[0] : null;
	}

	/**
	 * Check if a provider is registered.
	 *
	 * Re-discovers providers to ensure all providers registered via the filter
	 * are included, even if they were registered after the registry was first
	 * instantiated.
	 *
	 * @param string $providerId Provider ID
	 * @return bool True if registered
	 */
	public function has(string $providerId): bool
	{
		// Re-discover providers to catch any that were registered after initial discovery
		$this->discoverProviders();
		return isset($this->providers[$providerId]);
	}

	/**
	 * Get count of registered providers.
	 *
	 * @return int Number of registered providers
	 */
	public function count(): int
	{
		return \count($this->providers);
	}

	/**
	 * Parse instance ID into provider type and UUID.
	 *
	 * Instance IDs have format: {provider_type}:{uuid}
	 * Example: "local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890"
	 *
	 * @param string $instanceId Instance ID to parse
	 * @return array{provider_type: string, uuid: string}|null Parsed components or null if invalid format
	 */
	public function parseInstanceId(string $instanceId): ?array
	{
		$parts = \explode(':', $instanceId, 2);
		if (\count($parts) !== 2) {
			return null;
		}

		return [
			'provider_type' => $parts[0],
			'uuid' => $parts[1],
		];
	}

	/**
	 * Get provider class for an instance ID.
	 *
	 * Extracts the provider type from the instance ID and returns the corresponding provider.
	 *
	 * @param string $instanceId Instance ID (format: {provider_type}:{uuid})
	 * @return BaseProvider|null Provider instance or null if not found
	 */
	public function getProviderForInstance(string $instanceId): ?BaseProvider
	{
		$parsed = $this->parseInstanceId($instanceId);
		if ($parsed === null) {
			return null;
		}

		return $this->get($parsed['provider_type']);
	}

	/**
	 * Create a new instance ID for a provider type.
	 *
	 * Generates a UUID v4 and combines it with the provider type.
	 *
	 * @param string $providerType Provider type (e.g., 'local-filesystem')
	 * @return string Instance ID (format: {provider_type}:{uuid})
	 */
	public function createInstanceId(string $providerType): string
	{
		// Generate UUID v4
		$uuid = \sprintf(
			'%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
			\mt_rand(0, 0xffff),
			\mt_rand(0, 0xffff),
			\mt_rand(0, 0xffff),
			\mt_rand(0, 0x0fff) | 0x4000,
			\mt_rand(0, 0x3fff) | 0x8000,
			\mt_rand(0, 0xffff),
			\mt_rand(0, 0xffff),
			\mt_rand(0, 0xffff)
		);

		return "{$providerType}:{$uuid}";
	}
}
