<?php

/**
 * Encryption Helper Trait
 *
 * Provides methods for encrypting and decrypting sensitive fields in configuration arrays.
 * Consolidates encryption logic used across multiple controllers.
 *
 * @package Aether\Utilities
 */

namespace Aether\Utilities;

use Aether\Utilities\CredentialEncryption;

/**
 * Trait for handling encryption/decryption of sensitive configuration fields.
 */
trait EncryptionHelper
{
	/**
	 * Encrypt sensitive fields recursively.
	 *
	 * @param array<string, mixed> $config Configuration array.
	 * @return array<string, mixed> Configuration with encrypted fields.
	 */
	protected function encryptSensitiveFields(array $config): array
	{
		$encrypted = [];

		foreach ($config as $key => $value) {
			if (\is_array($value)) {
				$encrypted[ $key ] = $this->encryptSensitiveFields($value);
			} elseif ($this->isSensitiveField($key) && ! empty($value)) {
				// Check if already encrypted
				$decrypted = CredentialEncryption::decrypt($value);
				if (false !== $decrypted) {
					$encrypted[ $key ] = $value; // Already encrypted
				} else {
					$encryptedValue = CredentialEncryption::encrypt($value);
					$encrypted[ $key ] = false !== $encryptedValue ? $encryptedValue : $value;
				}
			} else {
				$encrypted[ $key ] = $value;
			}
		}

		return $encrypted;
	}

	/**
	 * Decrypt sensitive fields recursively.
	 *
	 * @param array<string, mixed> $config Configuration array.
	 * @return array<string, mixed> Configuration with decrypted fields.
	 */
	protected function decryptSensitiveFields(array $config): array
	{
		$decrypted = [];

		foreach ($config as $key => $value) {
			if (\is_array($value)) {
				$decrypted[ $key ] = $this->decryptSensitiveFields($value);
			} elseif ($this->isSensitiveField($key) && ! empty($value)) {
				$decryptedValue = CredentialEncryption::decrypt($value);
				$decrypted[ $key ] = false !== $decryptedValue ? $decryptedValue : $value;
			} else {
				$decrypted[ $key ] = $value;
			}
		}

		return $decrypted;
	}

	/**
	 * Encrypt provider settings.
	 *
	 * Helper method to encrypt all provider configs in a providers array.
	 *
	 * @param array<string, mixed> $providers Providers settings array.
	 * @return array<string, mixed> Providers with encrypted sensitive fields.
	 */
	protected function encryptProviderSettings(array $providers): array
	{
		$encrypted = [];

		foreach ($providers as $providerId => $config) {
			if (! \is_array($config)) {
				$encrypted[ $providerId ] = $config;
				continue;
			}

			$encrypted[ $providerId ] = $this->encryptSensitiveFields($config);
		}

		return $encrypted;
	}

	/**
	 * Decrypt provider settings.
	 *
	 * Helper method to decrypt all provider configs in a providers array.
	 *
	 * @param array<string, mixed> $providers Providers settings array.
	 * @return array<string, mixed> Providers with decrypted sensitive fields.
	 */
	protected function decryptProviderSettings(array $providers): array
	{
		$decrypted = [];

		foreach ($providers as $providerId => $config) {
			if (! \is_array($config)) {
				$decrypted[ $providerId ] = $config;
				continue;
			}

			$decrypted[ $providerId ] = $this->decryptSensitiveFields($config);
		}

		return $decrypted;
	}

	/**
	 * Check if field name indicates sensitive data.
	 *
	 * Patterns include: tokens, keys, secrets, passwords, API keys, account IDs, etc.
	 * Uses snake_case naming convention.
	 *
	 * @param string $fieldName Field name.
	 * @return bool True if sensitive.
	 */
	protected function isSensitiveField(string $fieldName): bool
	{
		// Normalize to lowercase for pattern matching (case-insensitive)
		$normalized = \strtolower($fieldName);

		$patterns = [
			// snake_case patterns
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
}
