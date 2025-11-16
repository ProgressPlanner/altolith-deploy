<?php

/**
 * Credential Encryption Utility
 *
 * Handles secure encryption and decryption of sensitive credentials.
 *
 * @package Aether\Utilities
 */

namespace Aether\Utilities;

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
		$optionName = 'aether_encryption_key';
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
		// wp_generate_password() uses wp_rand() which is cryptographically secure.
		$randomBytes = \wp_generate_password(32, true, true);

		// Hash to ensure exactly 32 bytes and uniform distribution.
		$keyBinary = \hash('sha256', $randomBytes, true);

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

		// If decryption failed, return original value.
		if (false === $decrypted) {
			return $encryptedData;
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
}
