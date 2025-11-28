<?php

/**
 * Profile Resolver
 *
 * Resolves profile references in provider configurations.
 * When a provider config contains a *_profile field pointing to a profile ID,
 * this class resolves the profile and injects its fields into the config.
 *
 * @package Altolith\Deploy\Core
 */

namespace Altolith\Deploy\Core;

\defined('ABSPATH') || exit;

/**
 * Profile Resolver class.
 *
 * Handles automatic resolution of profile references in provider configs.
 */
class ProfileResolver
{
	/**
	 * Profiles repository instance.
	 *
	 * @var ProfilesRepository
	 */
	private ProfilesRepository $profilesRepository;

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$this->profilesRepository = new ProfilesRepository();
	}

	/**
	 * Initialize profile resolver hooks.
	 *
	 * @return void
	 */
	public function init(): void
	{
		// Hook into provider config loading to resolve profiles.
		\add_filter('altolith_provider_config_load', [ $this, 'resolveProfileReferences' ], 10, 2);
	}

	/**
	 * Resolve profile references in provider configuration.
	 *
	 * Looks for fields ending with '_profile' that contain profile IDs.
	 * When found, resolves the profile and injects its fields into the config.
	 *
	 * For example, if config contains:
	 *   credential_profile: "abc123-uuid"
	 *
	 * And profile "abc123-uuid" has fields:
	 *   account_id: "my-account"
	 *   api_token: "my-token"
	 *
	 * The resolved config will contain:
	 *   credential_profile: "abc123-uuid"
	 *   account_id: "my-account"
	 *   api_token: "my-token"
	 *
	 * @param array<string, mixed> $config     Provider configuration.
	 * @param string               $instanceId Provider instance ID (unused, but required by filter signature).
	 * @return array<string, mixed> Configuration with resolved profiles.
	 */
	public function resolveProfileReferences(array $config, string $instanceId): array // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	{
		// Find all fields ending with '_profile'.
		foreach ($config as $key => $value) {
			if (! \str_ends_with($key, '_profile')) {
				continue;
			}

			if (empty($value) || ! \is_string($value)) {
				continue;
			}

			// This looks like a profile reference - try to resolve it.
			$profile = $this->profilesRepository->get($value);

			if (null === $profile) {
				// Profile not found - skip but don't modify config.
				continue;
			}

			// Inject profile fields into config.
			// Profile fields have lower priority (don't overwrite existing config).
			if (isset($profile['fields']) && \is_array($profile['fields'])) {
				foreach ($profile['fields'] as $fieldKey => $fieldValue) {
					// Don't overwrite existing config values.
					if (! isset($config[$fieldKey])) {
						$config[$fieldKey] = $fieldValue;
					}
				}
			}

			// Add profile metadata for reference.
			$config[$key . '_resolved'] = [
				'id' => $profile['id'] ?? $value,
				'name' => $profile['name'] ?? '',
				'category' => $profile['category'] ?? '',
				'type' => $profile['type'] ?? '',
			];
		}

		return $config;
	}
}
