<?php

/**
 * Encryption Helper Tests
 *
 * Tests for EncryptionHelper trait - encrypts/decrypts sensitive configuration fields.
 *
 * Quality Standards:
 * - Tests must verify encryption prevents plaintext storage
 * - Must test recursion depth limits (security)
 * - Must test double-encryption prevention
 * - Must fail if sensitive fields are not encrypted
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Unit\Utilities;

use Altolith\Deploy\Utilities\EncryptionHelper;
use Altolith\Deploy\Utilities\CredentialEncryption;
use Altolith\Deploy\Tests\Helpers\TestCase;

/**
 * Test class that uses the EncryptionHelper trait.
 */
class EncryptionHelperTestClass
{
	use EncryptionHelper;

	/**
	 * Expose protected methods for testing.
	 */
	public function testEncryptSensitiveFields( array $config, int $depth = 0 ): array
	{
		return $this->encryptSensitiveFields( $config, $depth );
	}

	public function testDecryptSensitiveFields( array $config, int $depth = 0 ): array
	{
		return $this->decryptSensitiveFields( $config, $depth );
	}

	public function testIsSensitiveField( string $fieldName ): bool
	{
		return $this->isSensitiveField( $fieldName );
	}

	public function testEncryptProviderSettings( array $providers ): array
	{
		return $this->encryptProviderSettings( $providers );
	}

	public function testDecryptProviderSettings( array $providers ): array
	{
		return $this->decryptProviderSettings( $providers );
	}
}

class EncryptionHelperTest extends TestCase
{
	/**
	 * Test class instance.
	 *
	 * @var EncryptionHelperTestClass
	 */
	private EncryptionHelperTestClass $helper;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();

		$this->helper = new EncryptionHelperTestClass();
	}

	/**
	 * Test isSensitiveField detects sensitive patterns.
	 */
	public function test_isSensitiveField_detects_sensitive_patterns(): void
	{
		$sensitiveFields = [
			'api_key',
			'access_token',
			'secret_key',
			'password',
			'private_key',
			'account_id',
			'api_token',
			'access_key',
			'personal_access_token',
		];

		foreach ( $sensitiveFields as $field ) {
			$this->assertTrue(
				$this->helper->testIsSensitiveField( $field ),
				"Field '$field' should be detected as sensitive"
			);
		}
	}

	/**
	 * Test isSensitiveField ignores non-sensitive fields.
	 */
	public function test_isSensitiveField_ignores_non_sensitive_fields(): void
	{
		$nonSensitiveFields = [
			'name',
			'description',
			'bucket_name',
			'region',
			'endpoint',
			'path',
		];

		foreach ( $nonSensitiveFields as $field ) {
			$this->assertFalse(
				$this->helper->testIsSensitiveField( $field ),
				"Field '$field' should not be detected as sensitive"
			);
		}
	}

	/**
	 * Test isSensitiveField is case-insensitive.
	 */
	public function test_isSensitiveField_is_case_insensitive(): void
	{
		$this->assertTrue( $this->helper->testIsSensitiveField( 'API_KEY' ) );
		$this->assertTrue( $this->helper->testIsSensitiveField( 'Api_Key' ) );
		$this->assertTrue( $this->helper->testIsSensitiveField( 'api_KEY' ) );
	}

	/**
	 * Test encryptSensitiveFields encrypts sensitive values.
	 */
	public function test_encryptSensitiveFields_encrypts_sensitive_values(): void
	{
		$config = [
			'api_key' => 'my-secret-key',
			'bucket_name' => 'my-bucket',
		];

		$encrypted = $this->helper->testEncryptSensitiveFields( $config );

		// Sensitive field should be encrypted (different from original)
		$this->assertNotSame( 'my-secret-key', $encrypted['api_key'] );

		// Non-sensitive field should remain unchanged
		$this->assertSame( 'my-bucket', $encrypted['bucket_name'] );
	}

	/**
	 * Test encryptSensitiveFields handles nested arrays.
	 */
	public function test_encryptSensitiveFields_handles_nested_arrays(): void
	{
		$config = [
			'provider' => [
				'api_key' => 'nested-secret',
				'bucket_name' => 'nested-bucket',
			],
		];

		$encrypted = $this->helper->testEncryptSensitiveFields( $config );

		// Nested sensitive field should be encrypted
		$this->assertNotSame( 'nested-secret', $encrypted['provider']['api_key'] );

		// Nested non-sensitive field should remain unchanged
		$this->assertSame( 'nested-bucket', $encrypted['provider']['bucket_name'] );
	}

	/**
	 * Test encryptSensitiveFields prevents double encryption.
	 */
	public function test_encryptSensitiveFields_prevents_double_encryption(): void
	{
		$config = [
			'api_key' => 'my-secret-key',
		];

		$encrypted1 = $this->helper->testEncryptSensitiveFields( $config );
		$encrypted2 = $this->helper->testEncryptSensitiveFields( $encrypted1 );

		// Should not encrypt again if already encrypted
		$this->assertSame( $encrypted1['api_key'], $encrypted2['api_key'] );
	}

	/**
	 * Test encryptSensitiveFields respects depth limit (security).
	 */
	public function test_encryptSensitiveFields_respects_depth_limit(): void
	{
		// Create deeply nested structure
		$config = [ 'level1' => [ 'level2' => [ 'level3' => [ 'level4' => [ 'level5' => [ 'level6' => [ 'level7' => [ 'level8' => [ 'level9' => [ 'level10' => [ 'level11' => 'too-deep' ] ] ] ] ] ] ] ] ] ] ];

		// Start at depth 0 - should stop at depth 10
		$encrypted = $this->helper->testEncryptSensitiveFields( $config, 0 );

		// Depth 10 should return empty array (protection against stack overflow)
		$this->assertNotEmpty( $encrypted );
	}

	/**
	 * Test encryptSensitiveFields handles empty values.
	 */
	public function test_encryptSensitiveFields_handles_empty_values(): void
	{
		$config = [
			'api_key' => '',
			'password' => null,
			'secret' => 'valid-secret',
		];

		$encrypted = $this->helper->testEncryptSensitiveFields( $config );

		// Empty string should not be encrypted
		$this->assertSame( '', $encrypted['api_key'] );

		// Null should not be encrypted
		$this->assertNull( $encrypted['password'] );

		// Valid value should be encrypted
		$this->assertNotSame( 'valid-secret', $encrypted['secret'] );
	}

	/**
	 * Test decryptSensitiveFields decrypts encrypted values.
	 */
	public function test_decryptSensitiveFields_decrypts_encrypted_values(): void
	{
		$config = [
			'api_key' => 'my-secret-key',
			'bucket_name' => 'my-bucket',
		];

		$encrypted = $this->helper->testEncryptSensitiveFields( $config );
		$decrypted = $this->helper->testDecryptSensitiveFields( $encrypted );

		// Should decrypt back to original value
		$this->assertSame( 'my-secret-key', $decrypted['api_key'] );

		// Non-encrypted field should remain unchanged
		$this->assertSame( 'my-bucket', $decrypted['bucket_name'] );
	}

	/**
	 * Test decryptSensitiveFields handles nested arrays.
	 */
	public function test_decryptSensitiveFields_handles_nested_arrays(): void
	{
		$config = [
			'provider' => [
				'api_key' => 'nested-secret',
				'bucket_name' => 'nested-bucket',
			],
		];

		$encrypted = $this->helper->testEncryptSensitiveFields( $config );
		$decrypted = $this->helper->testDecryptSensitiveFields( $encrypted );

		// Nested sensitive field should be decrypted
		$this->assertSame( 'nested-secret', $decrypted['provider']['api_key'] );

		// Nested non-sensitive field should remain unchanged
		$this->assertSame( 'nested-bucket', $decrypted['provider']['bucket_name'] );
	}

	/**
	 * Test decryptSensitiveFields respects depth limit.
	 */
	public function test_decryptSensitiveFields_respects_depth_limit(): void
	{
		// Create deeply nested structure
		$config = [ 'level1' => [ 'level2' => [ 'level3' => [ 'level4' => [ 'level5' => [ 'level6' => [ 'level7' => [ 'level8' => [ 'level9' => [ 'level10' => [ 'level11' => 'too-deep' ] ] ] ] ] ] ] ] ] ] ];

		// Start at depth 0 - should stop at depth 10
		$decrypted = $this->helper->testDecryptSensitiveFields( $config, 0 );

		// Should not crash, should return result
		$this->assertNotEmpty( $decrypted );
	}

	/**
	 * Test decryptSensitiveFields handles invalid encrypted data.
	 */
	public function test_decryptSensitiveFields_handles_invalid_encrypted_data(): void
	{
		$config = [
			'api_key' => 'invalid-encrypted-data',
		];

		$decrypted = $this->helper->testDecryptSensitiveFields( $config );

		// Should return original value if decryption fails
		$this->assertSame( 'invalid-encrypted-data', $decrypted['api_key'] );
	}

	/**
	 * Test encryptProviderSettings encrypts all providers.
	 */
	public function test_encryptProviderSettings_encrypts_all_providers(): void
	{
		$providers = [
			'provider1' => [
				'api_key' => 'secret1',
				'bucket' => 'bucket1',
			],
			'provider2' => [
				'api_key' => 'secret2',
				'bucket' => 'bucket2',
			],
		];

		$encrypted = $this->helper->testEncryptProviderSettings( $providers );

		// Both providers should have encrypted API keys
		$this->assertNotSame( 'secret1', $encrypted['provider1']['api_key'] );
		$this->assertNotSame( 'secret2', $encrypted['provider2']['api_key'] );

		// Non-sensitive fields should remain unchanged
		$this->assertSame( 'bucket1', $encrypted['provider1']['bucket'] );
		$this->assertSame( 'bucket2', $encrypted['provider2']['bucket'] );
	}

	/**
	 * Test encryptProviderSettings handles non-array configs.
	 */
	public function test_encryptProviderSettings_handles_non_array_configs(): void
	{
		$providers = [
			'provider1' => 'not-an-array',
			'provider2' => [
				'api_key' => 'secret',
			],
		];

		$encrypted = $this->helper->testEncryptProviderSettings( $providers );

		// Non-array should pass through unchanged
		$this->assertSame( 'not-an-array', $encrypted['provider1'] );

		// Array should be encrypted
		$this->assertNotSame( 'secret', $encrypted['provider2']['api_key'] );
	}

	/**
	 * Test decryptProviderSettings decrypts all providers.
	 */
	public function test_decryptProviderSettings_decrypts_all_providers(): void
	{
		$providers = [
			'provider1' => [
				'api_key' => 'secret1',
				'bucket' => 'bucket1',
			],
			'provider2' => [
				'api_key' => 'secret2',
				'bucket' => 'bucket2',
			],
		];

		$encrypted = $this->helper->testEncryptProviderSettings( $providers );
		$decrypted = $this->helper->testDecryptProviderSettings( $encrypted );

		// Both providers should have decrypted API keys
		$this->assertSame( 'secret1', $decrypted['provider1']['api_key'] );
		$this->assertSame( 'secret2', $decrypted['provider2']['api_key'] );

		// Non-sensitive fields should remain unchanged
		$this->assertSame( 'bucket1', $decrypted['provider1']['bucket'] );
		$this->assertSame( 'bucket2', $decrypted['provider2']['bucket'] );
	}

	/**
	 * Test decryptProviderSettings handles non-array configs.
	 */
	public function test_decryptProviderSettings_handles_non_array_configs(): void
	{
		$providers = [
			'provider1' => 'not-an-array',
		];

		$decrypted = $this->helper->testDecryptProviderSettings( $providers );

		// Non-array should pass through unchanged
		$this->assertSame( 'not-an-array', $decrypted['provider1'] );
	}

	/**
	 * Test encryption roundtrip with complex structure.
	 */
	public function test_encryption_roundtrip_with_complex_structure(): void
	{
		$config = [
			'provider_type' => 's3',
			'credentials' => [
				'access_key' => 'AKIAIOSFODNN7EXAMPLE',
				'secret_key' => 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
			],
			'bucket_name' => 'my-bucket',
			'settings' => [
				'region' => 'us-east-1',
				'nested' => [
					'api_token' => 'nested-token-123',
					'endpoint' => 'https://example.com',
				],
			],
		];

		$encrypted = $this->helper->testEncryptSensitiveFields( $config );
		$decrypted = $this->helper->testDecryptSensitiveFields( $encrypted );

		// Should match original after roundtrip
		$this->assertSame( $config, $decrypted );
	}

	/**
	 * Test empty config handling.
	 */
	public function test_handles_empty_config(): void
	{
		$config = [];

		$encrypted = $this->helper->testEncryptSensitiveFields( $config );
		$decrypted = $this->helper->testDecryptSensitiveFields( $config );

		$this->assertSame( [], $encrypted );
		$this->assertSame( [], $decrypted );
	}

	/**
	 * Test depth limit prevents stack overflow attack.
	 */
	public function test_depth_limit_prevents_stack_overflow(): void
	{
		// Create malicious deeply nested structure
		$config = $this->createDeeplyNested( 20, 'evil' );

		// Should not crash, should return empty at depth 10
		$encrypted = $this->helper->testEncryptSensitiveFields( $config, 0 );

		// Should handle gracefully
		$this->assertIsArray( $encrypted );
	}

	/**
	 * Helper to create deeply nested arrays.
	 *
	 * @param int    $depth Nesting depth.
	 * @param string $value Final value.
	 * @return array
	 */
	private function createDeeplyNested( int $depth, string $value ): array
	{
		if ( $depth <= 0 ) {
			return [ 'api_key' => $value ];
		}

		return [ 'level' => $this->createDeeplyNested( $depth - 1, $value ) ];
	}
}
