<?php
/**
 * ProviderRegistry Tests
 *
 * Tests for provider discovery, registration, and instance management.
 * Critical for ensuring the provider system works correctly.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Unit\Providers;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\Providers\ProviderRegistry;
use Aether\SiteExporter\Providers\BaseProvider;

/**
 * Mock provider for testing.
 */
class MockProvider extends BaseProvider {
	private $id;
	private $name;
	private $deployment_types;

	public function __construct( $id = 'mock-provider', $name = 'Mock Provider', $deployment_types = [ 'static_site' ] ) {
		$this->id               = $id;
		$this->name             = $name;
		$this->deployment_types = $deployment_types;
	}

	public function getId(): string {
		return $this->id;
	}

	public function getName(): string {
		return $this->name;
	}

	public function getDescription(): string {
		return 'Mock provider for testing';
	}

	public function getDeploymentTypes(): array {
		return $this->deployment_types;
	}

	public function getProviderSettings(): array {
		return [];
	}
}

/**
 * ProviderRegistry test case.
 */
class ProviderRegistryTest extends TestCase {

	/**
	 * Reset singleton between tests.
	 */
	public function tear_down() {
		// Reset the singleton by using reflection.
		$reflection = new \ReflectionClass( ProviderRegistry::class );
		$instance   = $reflection->getProperty( 'instance' );
		$instance->setAccessible( true );
		$instance->setValue( null );

		parent::tear_down();
	}

	// ========================================================================
	// Singleton Pattern Tests
	// ========================================================================

	/**
	 * Test singleton pattern returns same instance.
	 */
	public function test_singleton_returns_same_instance() {
		$instance1 = ProviderRegistry::getInstance();
		$instance2 = ProviderRegistry::getInstance();

		$this->assertSame( $instance1, $instance2, 'Should return same singleton instance' );
	}

	// ========================================================================
	// Provider Registration Tests
	// ========================================================================

	/**
	 * Test registering a provider manually.
	 */
	public function test_register_provider() {
		$registry = ProviderRegistry::getInstance();
		$provider = new MockProvider( 'test-provider', 'Test Provider' );

		$registry->register( $provider );

		$this->assertTrue( $registry->has( 'test-provider' ), 'Provider should be registered' );

		$retrieved = $registry->get( 'test-provider' );
		$this->assertSame( $provider, $retrieved, 'Should retrieve same provider instance' );
	}

	/**
	 * Test provider discovery via filter.
	 */
	public function test_providers_discovered_via_filter() {
		$provider = new MockProvider( 'filtered-provider', 'Filtered Provider' );

		add_filter(
			'aether_providers',
			function ( $providers ) use ( $provider ) {
				$providers[] = $provider;
				return $providers;
			}
		);

		$registry = ProviderRegistry::getInstance();

		$this->assertTrue( $registry->has( 'filtered-provider' ), 'Provider from filter should be registered' );
	}

	/**
	 * Test duplicate providers are not registered twice.
	 */
	public function test_duplicate_providers_not_registered() {
		$registry = ProviderRegistry::getInstance();
		$provider = new MockProvider( 'duplicate-test', 'Duplicate' );

		$registry->register( $provider );
		$initial_count = $registry->count();

		// Try to register again.
		$registry->register( $provider );

		$this->assertEquals( $initial_count, $registry->count(), 'Duplicate registration should not increase count' );
	}

	// ========================================================================
	// Provider Retrieval Tests
	// ========================================================================

	/**
	 * Test getting non-existent provider returns null.
	 */
	public function test_get_nonexistent_provider_returns_null() {
		$registry = ProviderRegistry::getInstance();

		$provider = $registry->get( 'nonexistent-provider' );

		$this->assertNull( $provider, 'Non-existent provider should return null' );
	}

	/**
	 * Test getting all providers.
	 */
	public function test_get_all_providers() {
		$registry  = ProviderRegistry::getInstance();
		$provider1 = new MockProvider( 'provider-1', 'Provider 1' );
		$provider2 = new MockProvider( 'provider-2', 'Provider 2' );

		$registry->register( $provider1 );
		$registry->register( $provider2 );

		$all = $registry->getAll();

		$this->assertIsArray( $all );
		$this->assertArrayHasKey( 'provider-1', $all );
		$this->assertArrayHasKey( 'provider-2', $all );
	}

	/**
	 * Test getting all provider IDs.
	 */
	public function test_get_all_ids() {
		$registry  = ProviderRegistry::getInstance();
		$provider1 = new MockProvider( 'id-test-1', 'Provider 1' );
		$provider2 = new MockProvider( 'id-test-2', 'Provider 2' );

		$registry->register( $provider1 );
		$registry->register( $provider2 );

		$ids = $registry->getAllIds();

		$this->assertIsArray( $ids );
		$this->assertContains( 'id-test-1', $ids );
		$this->assertContains( 'id-test-2', $ids );
	}

	/**
	 * Test provider count.
	 */
	public function test_count() {
		$registry = ProviderRegistry::getInstance();

		$initial_count = $registry->count();

		$registry->register( new MockProvider( 'count-test-1', 'Provider 1' ) );
		$registry->register( new MockProvider( 'count-test-2', 'Provider 2' ) );

		$this->assertEquals( $initial_count + 2, $registry->count(), 'Count should increase by 2' );
	}

	// ========================================================================
	// Deployment Type Filtering Tests
	// ========================================================================

	/**
	 * Test getting providers by deployment type.
	 */
	public function test_get_by_deployment_type() {
		$registry = ProviderRegistry::getInstance();

		$static_provider    = new MockProvider( 'static-only', 'Static', [ 'static_site' ] );
		$blueprint_provider = new MockProvider( 'blueprint-only', 'Blueprint', [ 'blueprint_bundle' ] );
		$both_provider      = new MockProvider( 'both', 'Both', [ 'static_site', 'blueprint_bundle' ] );

		$registry->register( $static_provider );
		$registry->register( $blueprint_provider );
		$registry->register( $both_provider );

		$static_providers = $registry->getByDeploymentType( 'static_site' );

		// At least 2 providers (our test providers), may include built-in providers like LocalFilesystemProvider.
		$this->assertGreaterThanOrEqual( 2, count( $static_providers ), 'Should find at least 2 providers supporting static_site' );

		// Verify our specific providers are included.
		$provider_ids = array_map( fn( $p ) => $p->getId(), $static_providers );
		$this->assertContains( 'static-only', $provider_ids );
		$this->assertContains( 'both', $provider_ids );

		$blueprint_providers = $registry->getByDeploymentType( 'blueprint_bundle' );
		$this->assertGreaterThanOrEqual( 2, count( $blueprint_providers ), 'Should find at least 2 providers supporting blueprint_bundle' );
	}

	/**
	 * Test getting default provider.
	 */
	public function test_get_default_provider() {
		$registry = ProviderRegistry::getInstance();

		$provider = new MockProvider( 'default-test', 'Default', [ 'static_site' ] );
		$registry->register( $provider );

		$default = $registry->getDefault();

		$this->assertNotNull( $default, 'Should return a default provider' );
		$this->assertInstanceOf( BaseProvider::class, $default );
	}

	/**
	 * Test getting provider for deployment type.
	 */
	public function test_get_for_deployment_type() {
		$registry = ProviderRegistry::getInstance();

		// Test with a deployment type that doesn't have built-in providers.
		$provider = new MockProvider( 'deployment-test', 'Test', [ 'blueprint_bundle' ] );
		$registry->register( $provider );

		$found = $registry->getForDeploymentType( 'blueprint_bundle' );

		$this->assertNotNull( $found );
		// Should return our provider since it's one of the blueprint_bundle providers.
		$this->assertInstanceOf( BaseProvider::class, $found );

		$not_found = $registry->getForDeploymentType( 'nonexistent_type' );
		$this->assertNull( $not_found, 'Should return null for unsupported deployment type' );
	}

	// ========================================================================
	// Instance ID Tests
	// ========================================================================

	/**
	 * Test parsing valid instance ID.
	 */
	public function test_parse_instance_id() {
		$registry = ProviderRegistry::getInstance();

		$instance_id = 'local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890';
		$parsed      = $registry->parseInstanceId( $instance_id );

		$this->assertIsArray( $parsed );
		$this->assertEquals( 'local-filesystem', $parsed['provider_type'] );
		$this->assertEquals( 'a3f2c1b0-4e5d-6789-abcd-ef1234567890', $parsed['uuid'] );
	}

	/**
	 * Test parsing invalid instance ID.
	 */
	public function test_parse_invalid_instance_id() {
		$registry = ProviderRegistry::getInstance();

		$invalid_ids = [
			'no-colon',    // Missing colon separator.
			'',            // Empty string.
		];

		foreach ( $invalid_ids as $invalid_id ) {
			$parsed = $registry->parseInstanceId( $invalid_id );
			$this->assertNull( $parsed, "Should return null for invalid ID: {$invalid_id}" );
		}
	}

	/**
	 * Test parsing instance ID with empty provider type (edge case).
	 *
	 * Currently, the implementation allows empty provider type.
	 * This may fail when trying to retrieve the provider via get().
	 */
	public function test_parse_instance_id_with_empty_provider_type() {
		$registry = ProviderRegistry::getInstance();

		$instance_id = ':only-uuid';
		$parsed      = $registry->parseInstanceId( $instance_id );

		// Implementation allows this but returns empty provider_type.
		$this->assertIsArray( $parsed );
		$this->assertEquals( '', $parsed['provider_type'] );
		$this->assertEquals( 'only-uuid', $parsed['uuid'] );

		// Attempting to get provider will return null (empty ID won't match any provider).
		$provider = $registry->getProviderForInstance( $instance_id );
		$this->assertNull( $provider );
	}

	/**
	 * Test parsing instance ID with colons in UUID (valid).
	 *
	 * The implementation uses explode($id, 2), so UUIDs can contain colons.
	 * This is intentional to support various UUID formats.
	 */
	public function test_parse_instance_id_with_colons_in_uuid() {
		$registry = ProviderRegistry::getInstance();

		$instance_id = 'provider:uuid:with:colons';
		$parsed      = $registry->parseInstanceId( $instance_id );

		$this->assertIsArray( $parsed );
		$this->assertEquals( 'provider', $parsed['provider_type'] );
		$this->assertEquals( 'uuid:with:colons', $parsed['uuid'] );
	}

	/**
	 * Test creating instance ID.
	 */
	public function test_create_instance_id() {
		$registry = ProviderRegistry::getInstance();

		$instance_id = $registry->createInstanceId( 'local-filesystem' );

		$this->assertIsString( $instance_id );
		$this->assertStringStartsWith( 'local-filesystem:', $instance_id );

		// Verify it can be parsed back.
		$parsed = $registry->parseInstanceId( $instance_id );
		$this->assertNotNull( $parsed );
		$this->assertEquals( 'local-filesystem', $parsed['provider_type'] );
	}

	/**
	 * Test UUID uniqueness.
	 */
	public function test_uuid_uniqueness() {
		$registry = ProviderRegistry::getInstance();

		$id1 = $registry->createInstanceId( 'test-provider' );
		$id2 = $registry->createInstanceId( 'test-provider' );

		$this->assertNotEquals( $id1, $id2, 'Generated UUIDs should be unique' );
	}

	/**
	 * Test getting provider for instance.
	 */
	public function test_get_provider_for_instance() {
		$registry = ProviderRegistry::getInstance();

		$provider = new MockProvider( 'instance-test', 'Test' );
		$registry->register( $provider );

		$instance_id = 'instance-test:a3f2c1b0-4e5d-6789-abcd-ef1234567890';
		$found       = $registry->getProviderForInstance( $instance_id );

		$this->assertNotNull( $found );
		$this->assertEquals( 'instance-test', $found->getId() );
	}

	/**
	 * Test getting provider for invalid instance ID.
	 */
	public function test_get_provider_for_invalid_instance() {
		$registry = ProviderRegistry::getInstance();

		$found = $registry->getProviderForInstance( 'invalid-format' );

		$this->assertNull( $found, 'Should return null for invalid instance ID format' );
	}

	// ========================================================================
	// Enabled Instance Tests
	// ========================================================================

	/**
	 * Test getting enabled instance for deployment type.
	 */
	public function test_get_enabled_instance_for_deployment_type() {
		// Set up test settings with enabled instance.
		$test_settings = [
			'providers' => [
				'local-filesystem:test-uuid' => [
					'enabled'          => true,
					'deployment_types' => [ 'static_site' ],
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $test_settings );

		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType( 'static_site' );

		$this->assertNotNull( $instance, 'Should find enabled instance' );
		$this->assertArrayHasKey( 'instanceId', $instance );
		$this->assertArrayHasKey( 'config', $instance );
		$this->assertEquals( 'local-filesystem:test-uuid', $instance['instanceId'] );
	}

	/**
	 * Test disabled instances are not returned.
	 */
	public function test_disabled_instances_not_returned() {
		$test_settings = [
			'providers' => [
				'local-filesystem:disabled' => [
					'enabled'          => false,
					'deployment_types' => [ 'static_site' ],
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $test_settings );

		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType( 'static_site' );

		$this->assertNull( $instance, 'Disabled instances should not be returned' );
	}

	/**
	 * Test instances without deployment type are not returned.
	 */
	public function test_instances_without_deployment_type_not_returned() {
		$test_settings = [
			'providers' => [
				'local-filesystem:wrong-type' => [
					'enabled'          => true,
					'deployment_types' => [ 'blueprint_bundle' ],
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $test_settings );

		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType( 'static_site' );

		$this->assertNull( $instance, 'Instances not supporting deployment type should not be returned' );
	}

	/**
	 * Test default enabled for instances without enabled flag.
	 */
	public function test_instances_default_to_enabled() {
		$test_settings = [
			'providers' => [
				'local-filesystem:default-enabled' => [
					'deployment_types' => [ 'static_site' ],
					// 'enabled' not set - should default to enabled.
				],
			],
		];

		update_option( 'aether_site_exporter_settings', $test_settings );

		$registry = ProviderRegistry::getInstance();
		$instance = $registry->getEnabledInstanceForDeploymentType( 'static_site' );

		$this->assertNotNull( $instance, 'Instances without enabled flag should default to enabled' );
	}
}
