<?php
/**
 * CredentialEncryption Tests
 *
 * Tests for credential encryption and security functions.
 * These tests are critical for preventing credential leaks.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Utilities;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Utilities\CredentialEncryption;

/**
 * CredentialEncryption test case.
 */
class CredentialEncryptionTest extends TestCase {

	// ========================================================================
	// Encryption/Decryption Tests (Core Functionality)
	// ========================================================================

	/**
	 * Test that encryption and decryption round-trip works correctly.
	 *
	 * This is the most critical test - data must survive encrypt->decrypt.
	 */
	public function test_encrypt_decrypt_roundtrip() {
		$plaintext = 'my-secret-api-key-12345';

		$encrypted = CredentialEncryption::encrypt( $plaintext );
		$this->assertNotFalse( $encrypted, 'Encryption should succeed' );
		$this->assertNotEquals( $plaintext, $encrypted, 'Encrypted data should differ from plaintext' );

		$decrypted = CredentialEncryption::decrypt( $encrypted );
		$this->assertEquals( $plaintext, $decrypted, 'Decrypted data should match original plaintext' );
	}

	/**
	 * Test that each encryption has a unique IV (prevents pattern analysis).
	 *
	 * Security requirement: Same plaintext encrypted twice should produce different ciphertext.
	 */
	public function test_each_encryption_has_unique_iv() {
		$plaintext = 'same-secret-key';

		$encrypted1 = CredentialEncryption::encrypt( $plaintext );
		$encrypted2 = CredentialEncryption::encrypt( $plaintext );

		$this->assertNotEquals(
			$encrypted1,
			$encrypted2,
			'Same plaintext encrypted twice should produce different ciphertext (unique IV)'
		);

		// Both should decrypt to same plaintext.
		$this->assertEquals( $plaintext, CredentialEncryption::decrypt( $encrypted1 ) );
		$this->assertEquals( $plaintext, CredentialEncryption::decrypt( $encrypted2 ) );
	}

	/**
	 * Test that encrypted data looks random (no plaintext visible).
	 */
	public function test_encrypted_data_looks_random() {
		$plaintext = 'my-secret-password';

		$encrypted = CredentialEncryption::encrypt( $plaintext );

		// Encrypted data should not contain plaintext.
		$this->assertStringNotContainsString( $plaintext, $encrypted, 'Plaintext should not be visible in encrypted data' );

		// Encrypted data should be base64-encoded.
		$this->assertMatchesRegularExpression( '/^[A-Za-z0-9+\/=]+$/', $encrypted, 'Encrypted data should be base64-encoded' );
	}

	// ========================================================================
	// Security Boundary Tests
	// ========================================================================

	/**
	 * Test that tampered encrypted data is rejected.
	 *
	 * Security requirement: Modified ciphertext must not decrypt successfully.
	 */
	public function test_rejects_tampered_data() {
		$plaintext = 'secret-api-key';
		$encrypted = CredentialEncryption::encrypt( $plaintext );

		// Tamper with the encrypted data.
		$tampered = substr( $encrypted, 0, -5 ) . 'XXXXX';

		$decrypted = CredentialEncryption::decrypt( $tampered );

		// Decryption should fail (return false).
		$this->assertFalse( $decrypted, 'Tampered data should fail to decrypt' );
	}

	/**
	 * Test that malformed base64 data is rejected.
	 */
	public function test_rejects_malformed_base64() {
		$malformed = 'not-valid-base64!!!';

		$decrypted = CredentialEncryption::decrypt( $malformed );

		// Should return the data as-is (not encrypted).
		$this->assertEquals( $malformed, $decrypted );
	}

	/**
	 * Test that isEncrypted correctly identifies encrypted data.
	 */
	public function test_is_encrypted_detection() {
		$plaintext = 'my-secret';
		$encrypted = CredentialEncryption::encrypt( $plaintext );

		$this->assertTrue( CredentialEncryption::isEncrypted( $encrypted ), 'Should detect encrypted data' );
		$this->assertFalse( CredentialEncryption::isEncrypted( $plaintext ), 'Should not detect plaintext as encrypted' );
		$this->assertFalse( CredentialEncryption::isEncrypted( '' ), 'Should not detect empty string as encrypted' );
	}

	// ========================================================================
	// Edge Case Tests
	// ========================================================================

	/**
	 * Test handling of empty string.
	 */
	public function test_handles_empty_string() {
		$encrypted = CredentialEncryption::encrypt( '' );
		$this->assertEquals( '', $encrypted, 'Empty string should return empty string' );

		$decrypted = CredentialEncryption::decrypt( '' );
		$this->assertEquals( '', $decrypted, 'Decrypting empty string should return empty string' );
	}

	/**
	 * Test handling of very long data (large API tokens).
	 */
	public function test_handles_very_long_data() {
		// Simulate a very long JWT token or API key.
		$long_token = str_repeat( 'abcdef1234567890', 100 ); // 1600 chars.

		$encrypted = CredentialEncryption::encrypt( $long_token );
		$this->assertNotFalse( $encrypted );

		$decrypted = CredentialEncryption::decrypt( $encrypted );
		$this->assertEquals( $long_token, $decrypted, 'Long data should survive encryption roundtrip' );
	}

	/**
	 * Test handling of special characters and Unicode.
	 */
	public function test_handles_special_characters() {
		$special_chars = [
			'password with spaces',
			'pass@word#123!',
			'пароль', // Cyrillic.
			'密码',   // Chinese.
			'emoji🔐password',
		];

		foreach ( $special_chars as $password ) {
			$encrypted = CredentialEncryption::encrypt( $password );
			$this->assertNotFalse( $encrypted, "Should encrypt: {$password}" );

			$decrypted = CredentialEncryption::decrypt( $encrypted );
			$this->assertEquals( $password, $decrypted, "Should decrypt correctly: {$password}" );
		}
	}

	// ========================================================================
	// Key Management Tests
	// ========================================================================

	/**
	 * Test that encryption key is persisted across calls.
	 */
	public function test_key_persisted_across_calls() {
		// Clear any existing key.
		delete_option( 'aether_site_exporter_encryption_key' );

		$plaintext = 'test-secret';

		// First encryption generates and stores key.
		$encrypted1 = CredentialEncryption::encrypt( $plaintext );

		// Second encryption should use same key.
		$encrypted2 = CredentialEncryption::encrypt( 'another-secret' );

		// Both should decrypt successfully (proving same key used).
		$this->assertEquals( $plaintext, CredentialEncryption::decrypt( $encrypted1 ) );
		$this->assertEquals( 'another-secret', CredentialEncryption::decrypt( $encrypted2 ) );

		// Key should exist in database.
		$stored_key = get_option( 'aether_site_exporter_encryption_key' );
		$this->assertNotEmpty( $stored_key );
		$this->assertEquals( 64, strlen( $stored_key ), 'Stored key should be 64 hex characters (32 bytes)' );
	}

	/**
	 * Test key rotation workflow.
	 */
	public function test_key_rotation_reencrypts_data() {
		// Set up test provider credentials.
		$test_settings = [
			'providers' => [
				'provider1' => [
					'type'       => 'test',
					'api_key'    => CredentialEncryption::encrypt( 'secret-key-1' ),
					'api_secret' => CredentialEncryption::encrypt( 'secret-value-1' ),
				],
				'provider2' => [
					'type'       => 'test',
					'api_key'    => CredentialEncryption::encrypt( 'secret-key-2' ),
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $test_settings );

		// Perform key rotation.
		$result = CredentialEncryption::rotateEncryptionKey();

		$this->assertTrue( $result['success'], 'Key rotation should succeed' );
		$this->assertEquals( 2, $result['providers_rotated'], 'Should rotate 2 providers' );

		// Verify credentials can still be decrypted.
		$rotated_settings = get_option( 'aether_site_exporter_settings' );

		$decrypted1 = CredentialEncryption::decrypt( $rotated_settings['providers']['provider1']['api_key'] );
		$this->assertEquals( 'secret-key-1', $decrypted1, 'Rotated credentials should decrypt correctly' );

		$decrypted2 = CredentialEncryption::decrypt( $rotated_settings['providers']['provider2']['api_key'] );
		$this->assertEquals( 'secret-key-2', $decrypted2, 'Rotated credentials should decrypt correctly' );
	}

	/**
	 * Test key rotation with no providers.
	 */
	public function test_key_rotation_with_no_providers() {
		update_option( 'aether_site_exporter_settings', [] );

		$result = CredentialEncryption::rotateEncryptionKey();

		$this->assertTrue( $result['success'] );
		$this->assertEquals( 0, $result['providers_rotated'] );
		$this->assertStringContainsString( 'No provider credentials', $result['message'] );
	}

	// ========================================================================
	// Plaintext Passthrough Tests
	// ========================================================================

	/**
	 * Test that decrypting plaintext returns it unchanged.
	 *
	 * This allows for backward compatibility and migration scenarios.
	 */
	public function test_decrypt_plaintext_returns_unchanged() {
		$plaintext = 'plain-api-key';

		$result = CredentialEncryption::decrypt( $plaintext );

		$this->assertEquals( $plaintext, $result, 'Plaintext should pass through unchanged' );
	}
}
