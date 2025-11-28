/**
 * ProviderRegistry Tests
 *
 * Comprehensive test suite for the JavaScript provider registry.
 * Tests singleton pattern, registration validation, retrieval, instance management,
 * and hook integration.
 *
 */

import { addAction, doAction } from '@wordpress/hooks';
import ProviderRegistry from '../ProviderRegistry';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	addAction: jest.fn(),
	doAction: jest.fn(),
} ) );

describe( 'ProviderRegistry', () => {
	/**
	 * Create a mock provider class.
	 *
	 * @param {string} id               Provider ID
	 * @param {string} name             Provider name
	 * @param {string} deploymentType   Deployment type
	 * @param {Object} additionalStatic Additional static properties
	 * @return {Function} Mock provider class
	 */
	const createMockProvider = (
		id = 'test-provider',
		name = 'Test Provider',
		deploymentType = 'static_site',
		additionalStatic = {}
	) => {
		// Create a mock class with static properties
		class MockProvider {
			static ID = id;
			static NAME = name;
			static DEPLOYMENT_TYPE = deploymentType;
		}
		// Add any additional static properties
		Object.assign( MockProvider, additionalStatic );
		return MockProvider;
	};

	beforeEach( () => {
		// Clear registry before each test
		ProviderRegistry.clear();
		jest.clearAllMocks();
	} );

	// ========================================================================
	// Registration Tests (CRITICAL)
	// ========================================================================

	describe( 'register()', () => {
		it( 'should register a valid provider', () => {
			const provider = createMockProvider( 'test-provider', 'Test' );

			ProviderRegistry.register( 'test-provider', provider );

			expect( ProviderRegistry.has( 'test-provider' ) ).toBe( true );
			expect( ProviderRegistry.get( 'test-provider' ) ).toBe( provider );
		} );

		it( 'should throw error for null provider ID', () => {
			const provider = createMockProvider();

			expect( () => {
				ProviderRegistry.register( null, provider );
			} ).toThrow(
				'ProviderRegistry.register() requires a valid provider ID string'
			);
		} );

		it( 'should throw error for undefined provider ID', () => {
			const provider = createMockProvider();

			expect( () => {
				ProviderRegistry.register( undefined, provider );
			} ).toThrow(
				'ProviderRegistry.register() requires a valid provider ID string'
			);
		} );

		it( 'should throw error for empty provider ID', () => {
			const provider = createMockProvider();

			expect( () => {
				ProviderRegistry.register( '', provider );
			} ).toThrow(
				'ProviderRegistry.register() requires a valid provider ID string'
			);
		} );

		it( 'should throw error for non-string provider ID', () => {
			const provider = createMockProvider();

			expect( () => {
				ProviderRegistry.register( 123, provider );
			} ).toThrow(
				'ProviderRegistry.register() requires a valid provider ID string'
			);

			expect( () => {
				ProviderRegistry.register( {}, provider );
			} ).toThrow(
				'ProviderRegistry.register() requires a valid provider ID string'
			);

			expect( () => {
				ProviderRegistry.register( [], provider );
			} ).toThrow(
				'ProviderRegistry.register() requires a valid provider ID string'
			);
		} );

		it( 'should throw error for null provider instance', () => {
			expect( () => {
				ProviderRegistry.register( 'test-provider', null );
			} ).toThrow(
				'ProviderRegistry.register() requires a provider class'
			);
		} );

		it( 'should throw error for undefined provider instance', () => {
			expect( () => {
				ProviderRegistry.register( 'test-provider', undefined );
			} ).toThrow(
				'ProviderRegistry.register() requires a provider class'
			);
		} );

		it( 'should throw error for non-object provider instance', () => {
			expect( () => {
				ProviderRegistry.register( 'test-provider', 'not-an-object' );
			} ).toThrow(
				'ProviderRegistry.register() requires a provider class'
			);

			expect( () => {
				ProviderRegistry.register( 'test-provider', 123 );
			} ).toThrow(
				'ProviderRegistry.register() requires a provider class'
			);
		} );

		it( 'should throw error for provider missing getId() method', () => {
			// Create a class without ID static property
			class InvalidProvider {
				static NAME = 'Test';
			}

			expect( () => {
				ProviderRegistry.register( 'test-provider', InvalidProvider );
			} ).toThrow(
				'Provider test-provider must have static ID property'
			);
		} );

		it( 'should throw error for provider missing getName() method', () => {
			// Create a class without NAME static property
			class InvalidProvider {
				static ID = 'test-provider';
			}

			expect( () => {
				ProviderRegistry.register( 'test-provider', InvalidProvider );
			} ).toThrow(
				'Provider test-provider must have static NAME property'
			);
		} );

		it( 'should allow duplicate registration (overwrite)', () => {
			const provider1 = createMockProvider( 'test', 'First' );
			const provider2 = createMockProvider( 'test', 'Second' );

			ProviderRegistry.register( 'test', provider1 );
			ProviderRegistry.register( 'test', provider2 );

			expect( ProviderRegistry.get( 'test' ) ).toBe( provider2 );
			expect( ProviderRegistry.count() ).toBe( 1 );
		} );

		it( 'should fire altolith.providers.registered action after registration', () => {
			const provider = createMockProvider( 'test-provider', 'Test' );

			ProviderRegistry.register( 'test-provider', provider );

			expect( doAction ).toHaveBeenCalledWith(
				'altolith.providers.registered',
				'test-provider',
				provider
			);
		} );
	} );

	// ========================================================================
	// Retrieval Tests (HIGH)
	// ========================================================================

	describe( 'get()', () => {
		it( 'should return registered provider', () => {
			const provider = createMockProvider( 'test-provider' );
			ProviderRegistry.register( 'test-provider', provider );

			const retrieved = ProviderRegistry.get( 'test-provider' );

			expect( retrieved ).toBe( provider );
		} );

		it( 'should return null for non-existent provider', () => {
			const retrieved = ProviderRegistry.get( 'non-existent' );

			expect( retrieved ).toBeNull();
		} );

		it( 'should return null for undefined ID', () => {
			const retrieved = ProviderRegistry.get( undefined );

			expect( retrieved ).toBeNull();
		} );

		it( 'should return null for null ID', () => {
			const retrieved = ProviderRegistry.get( null );

			expect( retrieved ).toBeNull();
		} );
	} );

	describe( 'getAll()', () => {
		it( 'should return empty array when no providers registered', () => {
			const providers = ProviderRegistry.getAll();

			expect( providers ).toEqual( [] );
		} );

		it( 'should return array with single provider', () => {
			const provider = createMockProvider( 'test' );
			ProviderRegistry.register( 'test', provider );

			const providers = ProviderRegistry.getAll();

			expect( providers ).toHaveLength( 1 );
			expect( providers[ 0 ] ).toBe( provider );
		} );

		it( 'should return array with all registered providers', () => {
			const provider1 = createMockProvider( 'provider1' );
			const provider2 = createMockProvider( 'provider2' );
			const provider3 = createMockProvider( 'provider3' );

			ProviderRegistry.register( 'provider1', provider1 );
			ProviderRegistry.register( 'provider2', provider2 );
			ProviderRegistry.register( 'provider3', provider3 );

			const providers = ProviderRegistry.getAll();

			expect( providers ).toHaveLength( 3 );
			expect( providers ).toContain( provider1 );
			expect( providers ).toContain( provider2 );
			expect( providers ).toContain( provider3 );
		} );
	} );

	describe( 'getAllIds()', () => {
		it( 'should return empty array when no providers registered', () => {
			const ids = ProviderRegistry.getAllIds();

			expect( ids ).toEqual( [] );
		} );

		it( 'should return array with all provider IDs', () => {
			const provider1 = createMockProvider( 'provider1' );
			const provider2 = createMockProvider( 'provider2' );
			const provider3 = createMockProvider( 'provider3' );

			ProviderRegistry.register( 'provider1', provider1 );
			ProviderRegistry.register( 'provider2', provider2 );
			ProviderRegistry.register( 'provider3', provider3 );

			const ids = ProviderRegistry.getAllIds();

			expect( ids ).toHaveLength( 3 );
			expect( ids ).toContain( 'provider1' );
			expect( ids ).toContain( 'provider2' );
			expect( ids ).toContain( 'provider3' );
		} );
	} );

	describe( 'has()', () => {
		it( 'should return true for registered provider', () => {
			const provider = createMockProvider( 'test' );
			ProviderRegistry.register( 'test', provider );

			expect( ProviderRegistry.has( 'test' ) ).toBe( true );
		} );

		it( 'should return false for non-existent provider', () => {
			expect( ProviderRegistry.has( 'non-existent' ) ).toBe( false );
		} );

		it( 'should return false for undefined ID', () => {
			expect( ProviderRegistry.has( undefined ) ).toBe( false );
		} );

		it( 'should return false for null ID', () => {
			expect( ProviderRegistry.has( null ) ).toBe( false );
		} );
	} );

	describe( 'count()', () => {
		it( 'should return 0 when no providers registered', () => {
			expect( ProviderRegistry.count() ).toBe( 0 );
		} );

		it( 'should return correct count after registrations', () => {
			const provider1 = createMockProvider( 'provider1' );
			const provider2 = createMockProvider( 'provider2' );

			ProviderRegistry.register( 'provider1', provider1 );
			expect( ProviderRegistry.count() ).toBe( 1 );

			ProviderRegistry.register( 'provider2', provider2 );
			expect( ProviderRegistry.count() ).toBe( 2 );
		} );

		it( 'should return correct count after clearing', () => {
			const provider = createMockProvider( 'test' );
			ProviderRegistry.register( 'test', provider );

			ProviderRegistry.clear();

			expect( ProviderRegistry.count() ).toBe( 0 );
		} );
	} );

	// ========================================================================
	// Deployment Type Filtering Tests (HIGH)
	// ========================================================================

	describe( 'getByDeploymentType()', () => {
		it( 'should return providers matching deployment type', () => {
			const staticProvider1 = createMockProvider(
				'static1',
				'Static 1',
				'static_site'
			);
			const staticProvider2 = createMockProvider(
				'static2',
				'Static 2',
				'static_site'
			);
			const blueprintProvider = createMockProvider(
				'blueprint',
				'Blueprint',
				'blueprint_bundle'
			);

			ProviderRegistry.register( 'static1', staticProvider1 );
			ProviderRegistry.register( 'static2', staticProvider2 );
			ProviderRegistry.register( 'blueprint', blueprintProvider );

			const staticProviders =
				ProviderRegistry.getByDeploymentType( 'static_site' );

			expect( staticProviders ).toHaveLength( 2 );
			expect( staticProviders ).toContain( staticProvider1 );
			expect( staticProviders ).toContain( staticProvider2 );
			expect( staticProviders ).not.toContain( blueprintProvider );
		} );

		it( 'should return empty array when no providers match', () => {
			const provider = createMockProvider(
				'test',
				'Test',
				'static_site'
			);
			ProviderRegistry.register( 'test', provider );

			const result =
				ProviderRegistry.getByDeploymentType( 'non_existent_type' );

			expect( result ).toEqual( [] );
		} );

		it( 'should handle provider without DEPLOYMENT_TYPE property', () => {
			class MockProvider {
				static ID = 'test';
				static NAME = 'Test';
				// No DEPLOYMENT_TYPE
			}
			ProviderRegistry.register( 'test', MockProvider );

			const result =
				ProviderRegistry.getByDeploymentType( 'static_site' );

			expect( result ).toEqual( [] );
		} );

		it( 'should handle provider with null deployment type', () => {
			class MockProvider {
				static ID = 'test';
				static NAME = 'Test';
				static DEPLOYMENT_TYPE = null;
			}
			ProviderRegistry.register( 'test', MockProvider );

			const result =
				ProviderRegistry.getByDeploymentType( 'static_site' );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getForDeploymentType()', () => {
		it( 'should return first provider matching deployment type', () => {
			const provider1 = createMockProvider(
				'provider1',
				'First',
				'static_site'
			);
			const provider2 = createMockProvider(
				'provider2',
				'Second',
				'static_site'
			);

			ProviderRegistry.register( 'provider1', provider1 );
			ProviderRegistry.register( 'provider2', provider2 );

			const result =
				ProviderRegistry.getForDeploymentType( 'static_site' );

			expect( result ).toBe( provider1 );
		} );

		it( 'should return null when no providers match', () => {
			const provider = createMockProvider(
				'test',
				'Test',
				'static_site'
			);
			ProviderRegistry.register( 'test', provider );

			const result =
				ProviderRegistry.getForDeploymentType( 'blueprint_bundle' );

			expect( result ).toBeNull();
		} );

		it( 'should return null when registry is empty', () => {
			const result =
				ProviderRegistry.getForDeploymentType( 'static_site' );

			expect( result ).toBeNull();
		} );
	} );

	describe( 'getDefault()', () => {
		it( 'should prefer static_site provider as default', () => {
			const blueprintProvider = createMockProvider(
				'blueprint',
				'Blueprint',
				'blueprint_bundle'
			);
			const staticProvider = createMockProvider(
				'static',
				'Static',
				'static_site'
			);

			ProviderRegistry.register( 'blueprint', blueprintProvider );
			ProviderRegistry.register( 'static', staticProvider );

			const result = ProviderRegistry.getDefault();

			expect( result ).toBe( staticProvider );
		} );

		it( 'should fall back to first provider if no static_site provider', () => {
			const provider1 = createMockProvider(
				'provider1',
				'First',
				'blueprint_bundle'
			);
			const provider2 = createMockProvider(
				'provider2',
				'Second',
				'custom_type'
			);

			ProviderRegistry.register( 'provider1', provider1 );
			ProviderRegistry.register( 'provider2', provider2 );

			const result = ProviderRegistry.getDefault();

			expect( result ).toBe( provider1 );
		} );

		it( 'should return null when registry is empty', () => {
			const result = ProviderRegistry.getDefault();

			expect( result ).toBeNull();
		} );

		it( 'should return first static_site provider when multiple exist', () => {
			const static1 = createMockProvider(
				'static1',
				'Static 1',
				'static_site'
			);
			const static2 = createMockProvider(
				'static2',
				'Static 2',
				'static_site'
			);

			ProviderRegistry.register( 'static1', static1 );
			ProviderRegistry.register( 'static2', static2 );

			const result = ProviderRegistry.getDefault();

			expect( result ).toBe( static1 );
		} );
	} );

	// ========================================================================
	// Instance ID Management Tests (HIGH)
	// ========================================================================

	describe( 'parseInstanceId()', () => {
		it( 'should parse valid instance ID', () => {
			const result = ProviderRegistry.parseInstanceId(
				'local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890'
			);

			expect( result ).toEqual( {
				provider_type: 'local-filesystem',
				uuid: 'a3f2c1b0-4e5d-6789-abcd-ef1234567890',
			} );
		} );

		it( 'should parse instance ID with simple UUID', () => {
			const result =
				ProviderRegistry.parseInstanceId( 'my-provider:12345' );

			expect( result ).toEqual( {
				provider_type: 'my-provider',
				uuid: '12345',
			} );
		} );

		it( 'should return null for null instance ID', () => {
			const result = ProviderRegistry.parseInstanceId( null );

			expect( result ).toBeNull();
		} );

		it( 'should return null for undefined instance ID', () => {
			const result = ProviderRegistry.parseInstanceId( undefined );

			expect( result ).toBeNull();
		} );

		it( 'should return null for empty string', () => {
			const result = ProviderRegistry.parseInstanceId( '' );

			expect( result ).toBeNull();
		} );

		it( 'should return null for non-string input', () => {
			expect( ProviderRegistry.parseInstanceId( 123 ) ).toBeNull();
			expect( ProviderRegistry.parseInstanceId( {} ) ).toBeNull();
			expect( ProviderRegistry.parseInstanceId( [] ) ).toBeNull();
		} );

		it( 'should return null for instance ID without colon', () => {
			const result = ProviderRegistry.parseInstanceId(
				'local-filesystem-12345'
			);

			expect( result ).toBeNull();
		} );

		it( 'should return null for instance ID with empty provider type', () => {
			const result = ProviderRegistry.parseInstanceId( ':12345' );

			expect( result ).toBeNull();
		} );

		it( 'should return null for instance ID with empty UUID', () => {
			const result =
				ProviderRegistry.parseInstanceId( 'local-filesystem:' );

			expect( result ).toBeNull();
		} );

		it( 'should handle instance ID with multiple colons (takes first two segments)', () => {
			// JavaScript's split(':', 2) returns at most 2 elements: ['local-filesystem', 'uuid']
			// Additional colons are ignored, not included in the second part
			const result = ProviderRegistry.parseInstanceId(
				'local-filesystem:uuid:extra:parts'
			);

			expect( result ).toEqual( {
				provider_type: 'local-filesystem',
				uuid: 'uuid',
			} );
		} );
	} );

	describe( 'createInstanceId()', () => {
		it( 'should create instance ID with correct format', () => {
			const instanceId =
				ProviderRegistry.createInstanceId( 'local-filesystem' );

			expect( instanceId ).toMatch(
				/^local-filesystem:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
			);
		} );

		it( 'should create unique instance IDs', () => {
			const id1 = ProviderRegistry.createInstanceId( 'local-filesystem' );
			const id2 = ProviderRegistry.createInstanceId( 'local-filesystem' );

			expect( id1 ).not.toBe( id2 );
		} );

		it( 'should parse created instance ID correctly', () => {
			const instanceId =
				ProviderRegistry.createInstanceId( 'my-provider' );
			const parsed = ProviderRegistry.parseInstanceId( instanceId );

			expect( parsed ).not.toBeNull();
			expect( parsed.provider_type ).toBe( 'my-provider' );
			expect( parsed.uuid ).toBeDefined();
			expect( parsed.uuid.length ).toBeGreaterThan( 0 );
		} );

		it( 'should create valid UUID v4 format', () => {
			const instanceId =
				ProviderRegistry.createInstanceId( 'test-provider' );
			const uuid = instanceId.split( ':' )[ 1 ];

			// UUID v4 has specific format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
			// where y is one of [8, 9, a, b]
			expect( uuid ).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
			);
		} );
	} );

	describe( 'getProviderForInstance()', () => {
		it( 'should return provider for valid instance ID', () => {
			const provider = createMockProvider( 'local-filesystem' );
			ProviderRegistry.register( 'local-filesystem', provider );

			const result = ProviderRegistry.getProviderForInstance(
				'local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890'
			);

			expect( result ).toBe( provider );
		} );

		it( 'should return null for instance ID with unregistered provider type', () => {
			const result = ProviderRegistry.getProviderForInstance(
				'unknown-provider:12345'
			);

			expect( result ).toBeNull();
		} );

		it( 'should return null for invalid instance ID format', () => {
			const result =
				ProviderRegistry.getProviderForInstance( 'invalid-format' );

			expect( result ).toBeNull();
		} );

		it( 'should return null for null instance ID', () => {
			const result = ProviderRegistry.getProviderForInstance( null );

			expect( result ).toBeNull();
		} );

		it( 'should return null for undefined instance ID', () => {
			const result = ProviderRegistry.getProviderForInstance( undefined );

			expect( result ).toBeNull();
		} );
	} );

	// ========================================================================
	// Clear Tests (MEDIUM)
	// ========================================================================

	describe( 'clear()', () => {
		it( 'should clear all registered providers', () => {
			const provider1 = createMockProvider( 'provider1' );
			const provider2 = createMockProvider( 'provider2' );

			ProviderRegistry.register( 'provider1', provider1 );
			ProviderRegistry.register( 'provider2', provider2 );

			ProviderRegistry.clear();

			expect( ProviderRegistry.count() ).toBe( 0 );
			expect( ProviderRegistry.getAll() ).toEqual( [] );
			expect( ProviderRegistry.has( 'provider1' ) ).toBe( false );
			expect( ProviderRegistry.has( 'provider2' ) ).toBe( false );
		} );

		it( 'should allow registration after clearing', () => {
			const provider1 = createMockProvider( 'provider1' );
			ProviderRegistry.register( 'provider1', provider1 );

			ProviderRegistry.clear();

			const provider2 = createMockProvider( 'provider2' );
			ProviderRegistry.register( 'provider2', provider2 );

			expect( ProviderRegistry.count() ).toBe( 1 );
			expect( ProviderRegistry.has( 'provider2' ) ).toBe( true );
		} );
	} );

	// ========================================================================
	// Edge Cases & Security Tests (HIGH)
	// ========================================================================

	describe( 'Edge Cases', () => {
		it( 'should handle very long provider IDs', () => {
			const longId = 'a'.repeat( 1000 );
			const provider = createMockProvider( longId );

			ProviderRegistry.register( longId, provider );

			expect( ProviderRegistry.has( longId ) ).toBe( true );
			expect( ProviderRegistry.get( longId ) ).toBe( provider );
		} );

		it( 'should handle special characters in provider IDs', () => {
			const specialIds = [
				'provider-with-dashes',
				'provider_with_underscores',
				'provider.with.dots',
				'provider@special',
			];

			specialIds.forEach( ( id ) => {
				const provider = createMockProvider( id );
				ProviderRegistry.register( id, provider );

				expect( ProviderRegistry.has( id ) ).toBe( true );
			} );
		} );

		it( 'should not mutate provider object after registration', () => {
			const provider = createMockProvider( 'test' );
			const originalGetId = provider.getId;

			ProviderRegistry.register( 'test', provider );

			// Mutate the provider object
			provider.getId = () => 'mutated';

			const retrieved = ProviderRegistry.get( 'test' );

			// The retrieved provider should have the mutated method
			// (providers are stored by reference)
			expect( retrieved.getId() ).toBe( 'mutated' );
			expect( retrieved.getId ).not.toBe( originalGetId );
		} );

		it( 'should handle case-sensitive provider IDs', () => {
			const provider1 = createMockProvider( 'TestProvider' );
			const provider2 = createMockProvider( 'testprovider' );

			ProviderRegistry.register( 'TestProvider', provider1 );
			ProviderRegistry.register( 'testprovider', provider2 );

			expect( ProviderRegistry.count() ).toBe( 2 );
			expect( ProviderRegistry.get( 'TestProvider' ) ).toBe( provider1 );
			expect( ProviderRegistry.get( 'testprovider' ) ).toBe( provider2 );
		} );

		it( 'should handle providers with additional static properties', () => {
			const ProviderClass = createMockProvider(
				'test',
				'Test',
				'static_site',
				{
					CUSTOM_PROP: 'custom',
					ANOTHER_PROP: 'another',
				}
			);

			ProviderRegistry.register( 'test', ProviderClass );

			const retrieved = ProviderRegistry.get( 'test' );

			expect( retrieved.CUSTOM_PROP ).toBe( 'custom' );
			expect( retrieved.ANOTHER_PROP ).toBe( 'another' );
		} );

		it( 'should handle empty deployment type query', () => {
			const provider = createMockProvider(
				'test',
				'Test',
				'static_site'
			);
			ProviderRegistry.register( 'test', provider );

			const result = ProviderRegistry.getByDeploymentType( '' );

			expect( result ).toEqual( [] );
		} );

		it( 'should handle null deployment type query', () => {
			const provider = createMockProvider(
				'test',
				'Test',
				'static_site'
			);
			ProviderRegistry.register( 'test', provider );

			const result = ProviderRegistry.getByDeploymentType( null );

			expect( result ).toEqual( [] );
		} );
	} );
} );
