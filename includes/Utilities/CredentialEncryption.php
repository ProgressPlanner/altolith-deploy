<?php

/**
 * Credential Encryption Utility
 *
 * Handles secure encryption and decryption of sensitive credentials.
 *
 * @package Altolith\Utilities
 */

namespace Altolith\Deploy\Utilities;

\defined('ABSPATH') || exit;

/**
 * Class CredentialEncryption
 */
class CredentialEncryption
{
	/**
	 * Encryption method to use.
	 *
	 * @var string
	 */
	private const ENCRYPTION_METHOD = 'aes-256-cbc';

	/**
	 * Get encryption key.
	 *
	 * Uses a persistent, randomly-generated key stored in the database.
	 * This approach ensures the key remains stable across WordPress Playground
	 * sessions (where site URLs change) and site migrations.
	 *
	 * The key is generated once and stored in wp_options. If the option doesn't
	 * exist, a new key is generated using wp_generate_password() for cryptographic
	 * randomness.
	 *
	 * @return string Encryption key (32 bytes).
	 */
	private static function getEncryptionKey(): string
	{
		$optionName = 'altolith_deploy_encryption_key';
		$storedKey = \get_option($optionName);

		// If key exists and is valid length, use it.
		if (! empty($storedKey) && \is_string($storedKey) && \strlen($storedKey) === 64) {
			// Stored as hex (64 chars), convert to binary (32 bytes).
			$keyBinary = \hex2bin($storedKey);

			// PHPStan: hex2bin can return false, but won't with valid hex string (64 chars).
			\assert(\is_string($keyBinary));

			return $keyBinary;
		}

		// Generate new random key (32 bytes = 256 bits).
		// Use cryptographically secure random bytes generation
		$keyBinary = null;
		if (\function_exists('random_bytes')) {
			// PHP 7+: random_bytes() is cryptographically secure
			try {
				$randomBytes = \random_bytes(32);
				$keyBinary = $randomBytes; // Already 32 bytes, no need to hash
			} catch (\Exception $e) {
				// Fallback if random_bytes fails
				$randomBytes = null;
			}
		} else {
			$randomBytes = null;
		}

		// Fallback for older PHP or if random_bytes failed
		if (null === $keyBinary) {
			if (\function_exists('openssl_random_pseudo_bytes')) {
				$strongUsed = false;
				$randomBytes = \openssl_random_pseudo_bytes(32, $strongUsed);
				/** @phpstan-ignore-next-line -- openssl_random_pseudo_bytes returns string|false, defensive check */
				if (!$strongUsed || false === $randomBytes) {
					// OpenSSL didn't use strong algorithm, last resort
					throw new \Exception('Unable to generate cryptographically secure random bytes');
				}
				$keyBinary = $randomBytes; // Already 32 bytes
			} else {
				// No secure random source available
				throw new \Exception('No cryptographically secure random number generator available');
			}
		}

		// Store as hex string (easier to work with in database).
		$keyHex = \bin2hex($keyBinary);

		// Persist to database for future use.
		\update_option($optionName, $keyHex, false); // autoload = false for performance.

		return $keyBinary;
	}

	/**
	 * Get the initialization vector length for the encryption method.
	 *
	 * @return int The IV length in bytes.
	 */
	private static function getIvLength(): int
	{
		$length = \openssl_cipher_iv_length(self::ENCRYPTION_METHOD);
		// For AES-256-CBC, this always returns 16.
		// Provide fallback value if cipher is not supported.
		return $length ?: 16;
	}


	/**
	 * Encrypt a credential value.
	 *
	 * Encrypts credentials using AES-256-CBC with a unique initialization vector.
	 * Provides defense-in-depth for database storage.
	 *
	 * @param string $plaintext The plaintext credential to encrypt.
	 * @return string|false The encrypted credential (base64 encoded) or false on failure.
	 */
	public static function encrypt(string $plaintext)
	{
		if (empty($plaintext)) {
			return $plaintext;
		}

		// Generate random IV for this encryption.
		// get_iv_length() always returns int (16 for AES-256-CBC), never false.
		$ivLength = self::getIvLength();
		$iv        = \openssl_random_pseudo_bytes($ivLength);

		// Encrypt the plaintext.
		$encrypted = \openssl_encrypt(
			$plaintext,
			self::ENCRYPTION_METHOD,
			self::getEncryptionKey(),
			OPENSSL_RAW_DATA,
			$iv
		);

		if (false === $encrypted) {
			return false;
		}

		// Return IV + encrypted data, base64 encoded.
		// Base64 encoding is necessary here to safely store binary encrypted data in the database as text.
		// This is data encoding for storage, not obfuscation - the security comes from AES encryption.
		return \base64_encode($iv . $encrypted);
	}

	/**
	 * Decrypt a credential value.
	 *
	 * Returns plaintext unchanged if not encrypted.
	 *
	 * @param string $encryptedData The encrypted credential (base64 encoded) or plaintext.
	 * @return string|false Decrypted credential or original value.
	 */
	public static function decrypt(string $encryptedData)
	{
		if (empty($encryptedData)) {
			return $encryptedData;
		}

		// Check if this looks like encrypted data.
		if (! self::isEncrypted($encryptedData)) {
			// Not encrypted, return as-is.
			return $encryptedData;
		}

		// Decode base64-encoded encrypted data.
		// Base64 decoding is necessary to convert the text-stored data back to binary for decryption.
		// This is data decoding, not deobfuscation - the security comes from AES encryption.
		$data = \base64_decode($encryptedData, true);
		if (false === $data) {
			// Not valid base64, return as-is.
			return $encryptedData;
		}

		// Extract IV and encrypted text.
		// get_iv_length() always returns int (16 for AES-256-CBC), never false.
		$ivLength = self::getIvLength();

		if (\strlen($data) <= $ivLength) {
			// Data too short, return as-is.
			return $encryptedData;
		}

		$iv        = \substr($data, 0, $ivLength);
		$encrypted = \substr($data, $ivLength);

		// Decrypt.
		$decrypted = \openssl_decrypt(
			$encrypted,
			self::ENCRYPTION_METHOD,
			self::getEncryptionKey(),
			OPENSSL_RAW_DATA,
			$iv
		);

		// If decryption failed, return false to indicate failure
		// This allows calling code to handle the error appropriately
		// rather than silently using empty credentials which could cause confusing failures
		if (false === $decrypted) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log('Altolith: Decryption failed for data (possible tampering detected)');
			}
			// Return false to indicate decryption failure
			// Calling code should check for false and handle appropriately
			return false;
		}

		return $decrypted;
	}

	/**
	 * Check if a value is encrypted.
	 *
	 * @param string $value Value to check.
	 * @return bool True if encrypted, false otherwise.
	 */
	public static function isEncrypted(string $value): bool
	{
		if (empty($value)) {
			return false;
		}

		// Check if it's valid base64-encoded data.
		// Base64 detection is necessary to identify encrypted vs. plaintext credentials.
		$decoded = \base64_decode($value, true);
		if (false === $decoded) {
			return false;
		}

		// Check if decoded data has expected length (IV + at least some encrypted data).
		// get_iv_length() always returns int (16 for AES-256-CBC), never false.
		$ivLength = self::getIvLength();

		return \strlen($decoded) > $ivLength;
	}

	/**
	 * Rotate encryption key and re-encrypt all stored credentials.
	 *
	 * This method provides a mechanism for periodic key rotation as a security best practice.
	 * Key rotation limits the impact of potential key compromise.
	 *
	 * USAGE:
	 * This method should be called via WP-CLI or custom admin interface.
	 * Example WP-CLI command:
	 *     wp eval "Altolith\Deploy\Utilities\CredentialEncryption::rotateEncryptionKey();"
	 *
	 * WARNING:
	 * - This operation CANNOT be undone
	 * - Always backup your database before rotating keys
	 * - If the process fails mid-rotation, credentials may become inaccessible
	 * - Consider running during maintenance window
	 *
	 * @return array{success: bool, message: string, providers_rotated: int} Result array with success status and message.
	 */
	public static function rotateEncryptionKey(): array
	{
		// Step 1: Get all settings that may contain encrypted credentials
		$settings = \get_option('altolith_deploy_settings', []);

		if (empty($settings['providers']) || ! \is_array($settings['providers'])) {
			return [
				'success'           => true,
				'message'           => \__('No provider credentials to rotate.', 'altolith-deploy'),
				'providers_rotated' => 0,
			];
		}

		// Step 2: Decrypt all credentials with current (old) key
		$decryptedProviders = [];
		foreach ($settings['providers'] as $providerId => $config) {
			if (! \is_array($config)) {
				// Skip non-array values
				$decryptedProviders[ $providerId ] = $config;
				continue;
			}

			// Decrypt all string values in config
			$decryptedConfig = [];
			foreach ($config as $key => $value) {
				if (\is_string($value) && self::isEncrypted($value)) {
					$decrypted = self::decrypt($value);
					if (false === $decrypted) {
						// Decryption failed - abort rotation
						return [
							'success'           => false,
							'message'           => \sprintf(
								/* translators: %s: Provider ID */
								\__('Failed to decrypt credentials for provider: %s. Aborting key rotation.', 'altolith-deploy'),
								$providerId
							),
							'providers_rotated' => 0,
						];
					}
					$decryptedConfig[ $key ] = $decrypted;
				} else {
					$decryptedConfig[ $key ] = $value;
				}
			}

			$decryptedProviders[ $providerId ] = $decryptedConfig;
		}

		// Step 3: Delete old encryption key to force generation of new one
		\delete_option('altolith_deploy_encryption_key');

		// Step 4: Re-encrypt all credentials with new key
		$reencryptedProviders = [];
		foreach ($decryptedProviders as $providerId => $config) {
			if (! \is_array($config)) {
				$reencryptedProviders[ $providerId ] = $config;
				continue;
			}

			// Re-encrypt all string values
			$reencryptedConfig = [];
			foreach ($config as $key => $value) {
				if (\is_string($value) && ! empty($value)) {
					// Encrypt the value
					$encrypted = self::encrypt($value);
					if (false === $encrypted) {
						// Encryption failed - this is a critical error
						// The old key is already deleted, so we can't recover
						return [
							'success'           => false,
							'message'           => \sprintf(
								/* translators: %s: Provider ID */
								\__('CRITICAL: Failed to re-encrypt credentials for provider: %s. Old key deleted. Manual recovery required.', 'altolith-deploy'),
								$providerId
							),
							'providers_rotated' => 0,
						];
					}
					$reencryptedConfig[ $key ] = $encrypted;
				} else {
					$reencryptedConfig[ $key ] = $value;
				}
			}

			$reencryptedProviders[ $providerId ] = $reencryptedConfig;
		}

		// Step 5: Save re-encrypted credentials
		$settings['providers'] = $reencryptedProviders;
		$updated = \update_option('altolith_deploy_settings', $settings);

		if (! $updated) {
			return [
				'success'           => false,
				'message'           => \__('Failed to save re-encrypted credentials to database.', 'altolith-deploy'),
				'providers_rotated' => 0,
			];
		}

		return [
			'success'           => true,
			'message'           => \sprintf(
				/* translators: %d: Number of providers */
				\__('Successfully rotated encryption key and re-encrypted credentials for %d provider(s).', 'altolith-deploy'),
				\count($reencryptedProviders)
			),
			'providers_rotated' => \count($reencryptedProviders),
		];
	}
}
