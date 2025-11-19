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
	 * Whether providers have been discovered.
	 *
	 * @var bool
	 */
	private bool $discovered = false;

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
		 * @param array<BaseProvider> $providers Array of provider instances
		 * @return array<BaseProvider> Modified array of providers
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

		$this->discovered = true;
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
	 * @param string $providerId Provider ID
	 * @return BaseProvider|null Provider instance or null if not found
	 */
	public function get(string $providerId): ?BaseProvider
	{
		return $this->providers[$providerId] ?? null;
	}

	/**
	 * Get all registered providers.
	 *
	 * Re-discovers providers if not yet discovered to ensure all providers
	 * registered via the filter are included, even if they were registered
	 * after the registry was first instantiated.
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
	 * @param string $deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
	 * @return array<BaseProvider> Array of providers that support the deployment type
	 */
	public function getByDeploymentType(string $deploymentType): array
	{
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
	 * Returns the first provider that supports static_site deployment,
	 * or the first registered provider if none found.
	 *
	 * @return BaseProvider|null Default provider or null if none registered
	 */
	public function getDefault(): ?BaseProvider
	{
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
	 * @param string $providerId Provider ID
	 * @return bool True if registered
	 */
	public function has(string $providerId): bool
	{
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
}

