<?php

/**
 * Profiles Repository
 *
 * Handles storage and retrieval of profile instances.
 * Profiles are stored in the altolith_deploy_profiles option.
 * Sensitive fields are encrypted using CredentialEncryption.
 *
 * @package Altolith\Core
 */

namespace Altolith\Deploy\Core;

use Altolith\Deploy\Utilities\CredentialEncryption;

\defined('ABSPATH') || exit;

/**
 * Profiles Repository class.
 *
 * Manages profile CRUD operations and storage.
 */
class ProfilesRepository
{
	/**
	 * Option name for storing profiles.
	 *
	 * @var string
	 */
	private const OPTION_NAME = 'altolith_deploy_profiles';

	/**
	 * Get all profiles.
	 *
	 * @param bool $decrypt Whether to decrypt sensitive fields (default: true).
	 * @return array<string, array<string, mixed>> Array of profiles keyed by ID.
	 */
	public function getAll(bool $decrypt = true): array
	{
		$profiles = \get_option(self::OPTION_NAME, []);

		if (! \is_array($profiles)) {
			return [];
		}

		if ($decrypt) {
			$profiles = $this->decryptAllProfiles($profiles);
		}

		return $profiles;
	}

	/**
	 * Get a single profile by ID.
	 *
	 * @param string $profileId Profile ID (UUID).
	 * @param bool   $decrypt   Whether to decrypt sensitive fields (default: true).
	 * @return array<string, mixed>|null Profile data or null if not found.
	 */
	public function get(string $profileId, bool $decrypt = true): ?array
	{
		$profiles = $this->getAll(false);

		if (! isset($profiles[$profileId])) {
			return null;
		}

		$profile = $profiles[$profileId];

		if ($decrypt && isset($profile['fields']) && \is_array($profile['fields'])) {
			$profile['fields'] = $this->decryptFields($profile['fields']);
		}

		return $profile;
	}

	/**
	 * Get profiles by category.
	 *
	 * @param string $category Category ID (e.g., 'credentials', 'edge').
	 * @param bool   $decrypt  Whether to decrypt sensitive fields (default: true).
	 * @return array<string, array<string, mixed>> Array of profiles in the category.
	 */
	public function getByCategory(string $category, bool $decrypt = true): array
	{
		$profiles = $this->getAll($decrypt);

		return \array_filter($profiles, function ($profile) use ($category) {
			return isset($profile['category']) && $profile['category'] === $category;
		});
	}

	/**
	 * Get profiles by type (within a category).
	 *
	 * @param string $category Category ID.
	 * @param string $type     Type ID (e.g., 'cloudflare').
	 * @param bool   $decrypt  Whether to decrypt sensitive fields (default: true).
	 * @return array<string, array<string, mixed>> Array of profiles of the specified type.
	 */
	public function getByType(string $category, string $type, bool $decrypt = true): array
	{
		$profiles = $this->getByCategory($category, $decrypt);

		return \array_filter($profiles, function ($profile) use ($type) {
			return isset($profile['type']) && $profile['type'] === $type;
		});
	}

	/**
	 * Create a new profile.
	 *
	 * @param array<string, mixed> $data Profile data (name, category, type, fields).
	 * @return array<string, mixed>|null Created profile or null on failure.
	 */
	public function create(array $data): ?array
	{
		// Validate required fields.
		if (empty($data['name']) || empty($data['category']) || empty($data['type'])) {
			return null;
		}

		// Generate UUID for new profile.
		$profileId = $this->generateUuid();

		// Build profile structure.
		$profile = [
			'id' => $profileId,
			'name' => \sanitize_text_field($data['name']),
			'category' => \sanitize_key($data['category']),
			'type' => \sanitize_key($data['type']),
			'fields' => [],
			'created' => \gmdate('c'),
			'updated' => \gmdate('c'),
		];

		// Process fields.
		if (isset($data['fields']) && \is_array($data['fields'])) {
			$profile['fields'] = $this->sanitizeFields($data['fields']);
		}

		// Get existing profiles.
		$profiles = $this->getAll(false);

		// Encrypt sensitive fields before saving.
		$encryptedProfile = $profile;
		$encryptedProfile['fields'] = $this->encryptFields($profile['fields']);

		// Add new profile.
		$profiles[$profileId] = $encryptedProfile;

		// Save.
		if (! \update_option(self::OPTION_NAME, $profiles)) {
			return null;
		}

		/**
		 * Action fired after a profile is created.
		 *
		 * @param string $profileId The profile ID.
		 * @param array  $profile   The profile data (decrypted).
		 */
		\do_action('altolith_profile_created', $profileId, $profile);

		return $profile;
	}

	/**
	 * Update an existing profile.
	 *
	 * @param string               $profileId Profile ID.
	 * @param array<string, mixed> $data      Updated profile data.
	 * @return array<string, mixed>|null Updated profile or null on failure.
	 */
	public function update(string $profileId, array $data): ?array
	{
		$profiles = $this->getAll(false);

		if (! isset($profiles[$profileId])) {
			return null;
		}

		$existing = $profiles[$profileId];

		// Update allowed fields.
		if (isset($data['name'])) {
			$existing['name'] = \sanitize_text_field($data['name']);
		}

		if (isset($data['fields']) && \is_array($data['fields'])) {
			// Decrypt existing fields to merge properly.
			$existingFields = $this->decryptFields($existing['fields'] ?? []);

			// Merge new fields with existing.
			$mergedFields = \array_merge($existingFields, $this->sanitizeFields($data['fields']));

			// Encrypt for storage.
			$existing['fields'] = $this->encryptFields($mergedFields);
		}

		$existing['updated'] = \gmdate('c');

		// Save.
		$profiles[$profileId] = $existing;

		if (! \update_option(self::OPTION_NAME, $profiles)) {
			return null;
		}

		// Return decrypted profile.
		$decryptedProfile = $existing;
		$decryptedProfile['fields'] = $this->decryptFields($existing['fields']);

		/**
		 * Action fired after a profile is updated.
		 *
		 * @param string $profileId The profile ID.
		 * @param array  $profile   The profile data (decrypted).
		 */
		\do_action('altolith_profile_updated', $profileId, $decryptedProfile);

		return $decryptedProfile;
	}

	/**
	 * Delete a profile.
	 *
	 * @param string $profileId Profile ID.
	 * @return bool True if deleted, false on failure.
	 */
	public function delete(string $profileId): bool
	{
		$profiles = $this->getAll(false);

		if (! isset($profiles[$profileId])) {
			return false;
		}

		$deleted = $profiles[$profileId];
		unset($profiles[$profileId]);

		if (! \update_option(self::OPTION_NAME, $profiles)) {
			return false;
		}

		/**
		 * Action fired after a profile is deleted.
		 *
		 * @param string $profileId The profile ID.
		 * @param array  $profile   The deleted profile data.
		 */
		\do_action('altolith_profile_deleted', $profileId, $deleted);

		return true;
	}

	/**
	 * Get provider instances that reference a profile.
	 *
	 * @param string $profileId Profile ID.
	 * @return array<array{instance_id: string, provider_type: string, instance_name: string}> Array of referencing instances.
	 */
	public function getReferences(string $profileId): array
	{
		$references = [];

		// Get all provider instances from settings.
		$settings = \get_option('altolith_deploy_settings', []);
		$providers = $settings['providers'] ?? [];

		foreach ($providers as $instanceId => $config) {
			if (! \is_array($config)) {
				continue;
			}

			// Check if this instance references the profile.
			// Profiles can be referenced via 'profiles' array or direct fields like 'credential_profile'.
			$referencesProfile = false;

			// Check profiles array.
			if (isset($config['profiles']) && \is_array($config['profiles'])) {
				foreach ($config['profiles'] as $profileRef) {
					if ($profileRef === $profileId) {
						$referencesProfile = true;
						break;
					}
				}
			}

			// Check direct profile reference fields (e.g., credential_profile).
			foreach ($config as $key => $value) {
				if (\str_contains($key, '_profile') && $value === $profileId) {
					$referencesProfile = true;
					break;
				}
			}

			if ($referencesProfile) {
				$references[] = [
					'instance_id' => $instanceId,
					'provider_type' => $config['provider_type'] ?? $this->parseProviderType($instanceId),
					'instance_name' => $config['instance_name'] ?? $instanceId,
				];
			}
		}

		return $references;
	}

	/**
	 * Check if a profile is referenced by any provider instances.
	 *
	 * @param string $profileId Profile ID.
	 * @return bool True if referenced, false otherwise.
	 */
	public function isReferenced(string $profileId): bool
	{
		return \count($this->getReferences($profileId)) > 0;
	}

	/**
	 * Encrypt profile fields.
	 *
	 * @param array<string, mixed> $fields Fields to encrypt.
	 * @return array<string, mixed> Encrypted fields.
	 */
	private function encryptFields(array $fields): array
	{
		$encrypted = [];

		foreach ($fields as $key => $value) {
			if (\is_string($value) && ! empty($value) && $this->isSensitiveField($key)) {
				$encryptedValue = CredentialEncryption::encrypt($value);
				$encrypted[$key] = false !== $encryptedValue ? $encryptedValue : $value;
			} else {
				$encrypted[$key] = $value;
			}
		}

		return $encrypted;
	}

	/**
	 * Decrypt profile fields.
	 *
	 * @param array<string, mixed> $fields Fields to decrypt.
	 * @return array<string, mixed> Decrypted fields.
	 */
	private function decryptFields(array $fields): array
	{
		$decrypted = [];

		foreach ($fields as $key => $value) {
			if (\is_string($value) && ! empty($value) && $this->isSensitiveField($key)) {
				$decryptedValue = CredentialEncryption::decrypt($value);
				$decrypted[$key] = false !== $decryptedValue ? $decryptedValue : $value;
			} else {
				$decrypted[$key] = $value;
			}
		}

		return $decrypted;
	}

	/**
	 * Decrypt all profiles.
	 *
	 * @param array<string, array<string, mixed>> $profiles Profiles to decrypt.
	 * @return array<string, array<string, mixed>> Decrypted profiles.
	 */
	private function decryptAllProfiles(array $profiles): array
	{
		foreach ($profiles as $id => $profile) {
			if (isset($profile['fields']) && \is_array($profile['fields'])) {
				$profiles[$id]['fields'] = $this->decryptFields($profile['fields']);
			}
		}

		return $profiles;
	}

	/**
	 * Sanitize fields array.
	 *
	 * @param array<string, mixed> $fields Fields to sanitize.
	 * @return array<string, mixed> Sanitized fields.
	 */
	private function sanitizeFields(array $fields): array
	{
		$sanitized = [];

		foreach ($fields as $key => $value) {
			$sanitizedKey = \preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $key);

			if (null === $sanitizedKey || '' === $sanitizedKey) {
				continue;
			}

			if (\is_string($value)) {
				// Don't use sanitize_text_field for sensitive fields as it may alter the value.
				$sanitized[$sanitizedKey] = $this->isSensitiveField($sanitizedKey)
					? $value
					: \sanitize_text_field($value);
			} elseif (\is_bool($value)) {
				$sanitized[$sanitizedKey] = $value;
			} elseif (\is_numeric($value)) {
				$sanitized[$sanitizedKey] = $value;
			} elseif (\is_array($value)) {
				$sanitized[$sanitizedKey] = $this->sanitizeFields($value);
			}
		}

		return $sanitized;
	}

	/**
	 * Check if field name indicates sensitive data.
	 *
	 * @param string $fieldName Field name.
	 * @return bool True if sensitive.
	 */
	private function isSensitiveField(string $fieldName): bool
	{
		$normalized = \strtolower($fieldName);

		$patterns = [
			'token',
			'key',
			'secret',
			'password',
			'api_key',
			'access_token',
			'private_key',
			'account_id',
			'api_token',
			'access_key',
			'secret_key',
			'personal_access_token',
		];

		foreach ($patterns as $pattern) {
			if (\str_contains($normalized, $pattern)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Parse provider type from instance ID.
	 *
	 * @param string $instanceId Instance ID (format: provider_type:uuid).
	 * @return string Provider type.
	 */
	private function parseProviderType(string $instanceId): string
	{
		$parts = \explode(':', $instanceId, 2);
		return $parts[0];
	}

	/**
	 * Generate a UUID v4.
	 *
	 * @return string UUID string.
	 */
	private function generateUuid(): string
	{
		// Generate 16 random bytes.
		$data = \random_bytes(16);

		// Set version to 4.
		$data[6] = \chr((\ord($data[6]) & 0x0f) | 0x40);
		// Set bits 6-7 to 10.
		$data[8] = \chr((\ord($data[8]) & 0x3f) | 0x80);

		// Format as UUID string.
		return \vsprintf('%s%s-%s-%s-%s-%s%s%s', \str_split(\bin2hex($data), 4));
	}
}
