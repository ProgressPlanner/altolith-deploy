/**
 * Provider Family Utilities Tests
 *
 * Tests for provider family detection and compatibility functions.
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import {
	getProviderFamily,
	getCompatibleInstances,
	isSameProviderFamily,
} from '../providerFamily';
import ProviderRegistry from '../../registry/ProviderRegistry';

// Mock the ProviderRegistry
jest.mock( '../../registry/ProviderRegistry', () => ( {
	get: jest.fn(),
} ) );

describe( 'providerFamily', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// ============================================================
	// getProviderFamily
	// ============================================================
	describe( 'getProviderFamily', () => {
		test( 'should read FAMILY from provider class when passed directly', () => {
			const MockProvider = class {
				static FAMILY = 'cloudflare-r2';
			};

			expect( getProviderFamily( MockProvider ) ).toBe( 'cloudflare-r2' );
		} );

		test( 'should look up provider class from registry and read FAMILY', () => {
			ProviderRegistry.get.mockReturnValue(
				class {
					static FAMILY = 'cloudflare-r2';
				}
			);

			expect( getProviderFamily( 'cloudflare-r2-static-site' ) ).toBe(
				'cloudflare-r2'
			);
			expect( ProviderRegistry.get ).toHaveBeenCalledWith(
				'cloudflare-r2-static-site'
			);
		} );

		test( 'should handle local-filesystem provider family', () => {
			ProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType.startsWith( 'local-filesystem' ) ) {
					return class {
						static FAMILY = 'local-filesystem';
					};
				}
				return null;
			} );

			expect( getProviderFamily( 'local-filesystem-static-site' ) ).toBe(
				'local-filesystem'
			);
			expect(
				getProviderFamily( 'local-filesystem-blueprint-bundle' )
			).toBe( 'local-filesystem' );
		} );

		test( 'should return provider type as-is if provider not in registry', () => {
			ProviderRegistry.get.mockReturnValue( null );

			expect( getProviderFamily( 'simple-provider' ) ).toBe(
				'simple-provider'
			);
		} );

		test( 'should return provider type as-is if provider has no FAMILY property', () => {
			ProviderRegistry.get.mockReturnValue(
				class {
					static ID = 'old-provider';
				}
			);

			expect( getProviderFamily( 'old-provider' ) ).toBe(
				'old-provider'
			);
		} );

		test( 'should handle empty string', () => {
			ProviderRegistry.get.mockReturnValue( null );

			expect( getProviderFamily( '' ) ).toBe( '' );
		} );

		test( 'should handle null', () => {
			expect( getProviderFamily( null ) ).toBe( '' );
		} );

		test( 'should handle undefined', () => {
			expect( getProviderFamily( undefined ) ).toBe( '' );
		} );

		test( 'should handle non-string, non-function input', () => {
			expect( getProviderFamily( 123 ) ).toBe( '' );
			expect( getProviderFamily( {} ) ).toBe( '' );
			expect( getProviderFamily( [] ) ).toBe( '' );
		} );
	} );

	// ============================================================
	// getCompatibleInstances
	// ============================================================
	describe( 'getCompatibleInstances', () => {
		beforeEach( () => {
			// Set up registry mock to return providers with FAMILY
			ProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType.startsWith( 'cloudflare-r2' ) ) {
					return class {
						static FAMILY = 'cloudflare-r2';
					};
				}
				if ( providerType.startsWith( 'local-filesystem' ) ) {
					return class {
						static FAMILY = 'local-filesystem';
					};
				}
				return null;
			} );
		} );

		const mockInstances = [
			{
				instanceId: 'cloudflare-r2-static-site:uuid-1',
				config: {
					provider_type: 'cloudflare-r2-static-site',
					instance_name: 'R2 Static 1',
				},
			},
			{
				instanceId: 'cloudflare-r2-static-site:uuid-2',
				config: {
					provider_type: 'cloudflare-r2-static-site',
					instance_name: 'R2 Static 2',
				},
			},
			{
				instanceId: 'cloudflare-r2-blueprint-bundle:uuid-3',
				config: {
					provider_type: 'cloudflare-r2-blueprint-bundle',
					instance_name: 'R2 Blueprint',
				},
			},
			{
				instanceId: 'local-filesystem-static-site:uuid-4',
				config: {
					provider_type: 'local-filesystem-static-site',
					instance_name: 'Local Static',
				},
			},
		];

		test( 'should return instances from same family, excluding target', () => {
			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				mockInstances
			);

			expect( result ).toHaveLength( 2 );
			expect( result.map( ( i ) => i.instanceId ) ).toEqual( [
				'cloudflare-r2-static-site:uuid-2',
				'cloudflare-r2-blueprint-bundle:uuid-3',
			] );
		} );

		test( 'should include different deployment types from same family', () => {
			const result = getCompatibleInstances(
				'cloudflare-r2-blueprint-bundle:uuid-3',
				mockInstances
			);

			expect( result ).toHaveLength( 2 );
			expect( result.map( ( i ) => i.instanceId ) ).toContain(
				'cloudflare-r2-static-site:uuid-1'
			);
			expect( result.map( ( i ) => i.instanceId ) ).toContain(
				'cloudflare-r2-static-site:uuid-2'
			);
		} );

		test( 'should not include instances from different families', () => {
			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				mockInstances
			);

			expect(
				result.some( ( i ) =>
					i.instanceId.startsWith( 'local-filesystem' )
				)
			).toBe( false );
		} );

		test( 'should exclude the target instance', () => {
			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				mockInstances
			);

			expect(
				result.some(
					( i ) => i.instanceId === 'cloudflare-r2-static-site:uuid-1'
				)
			).toBe( false );
		} );

		test( 'should return empty array when no compatible instances', () => {
			const singleInstance = [
				{
					instanceId: 'unique-provider:uuid-1',
					config: { provider_type: 'unique-provider' },
				},
			];

			const result = getCompatibleInstances(
				'unique-provider:uuid-1',
				singleInstance
			);

			expect( result ).toHaveLength( 0 );
		} );

		test( 'should return empty array for empty instances array', () => {
			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				[]
			);

			expect( result ).toHaveLength( 0 );
		} );

		test( 'should return empty array for null target instance ID', () => {
			const result = getCompatibleInstances( null, mockInstances );

			expect( result ).toHaveLength( 0 );
		} );

		test( 'should return empty array for null instances array', () => {
			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				null
			);

			expect( result ).toHaveLength( 0 );
		} );

		test( 'should extract provider type from instance ID if config missing', () => {
			const instancesWithoutConfigType = [
				{
					instanceId: 'cloudflare-r2-static-site:uuid-1',
					config: { instance_name: 'Instance 1' },
				},
				{
					instanceId: 'cloudflare-r2-blueprint-bundle:uuid-2',
					config: { instance_name: 'Instance 2' },
				},
			];

			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				instancesWithoutConfigType
			);

			expect( result ).toHaveLength( 1 );
			expect( result[ 0 ].instanceId ).toBe(
				'cloudflare-r2-blueprint-bundle:uuid-2'
			);
		} );

		test( 'should skip instances with invalid instance IDs', () => {
			const instancesWithInvalid = [
				{
					instanceId: 'cloudflare-r2-static-site:uuid-1',
					config: { provider_type: 'cloudflare-r2-static-site' },
				},
				{
					instanceId: null, // Invalid
					config: { provider_type: 'cloudflare-r2-static-site' },
				},
				{
					instanceId: 'cloudflare-r2-static-site:uuid-2',
					config: { provider_type: 'cloudflare-r2-static-site' },
				},
			];

			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				instancesWithInvalid
			);

			expect( result ).toHaveLength( 1 );
			expect( result[ 0 ].instanceId ).toBe(
				'cloudflare-r2-static-site:uuid-2'
			);
		} );

		test( 'should include media-offload provider in R2 family', () => {
			// Add media-offload to the registry mock
			ProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType.startsWith( 'cloudflare-r2' ) ) {
					return class {
						static FAMILY = 'cloudflare-r2';
					};
				}
				if ( providerType.startsWith( 'local-filesystem' ) ) {
					return class {
						static FAMILY = 'local-filesystem';
					};
				}
				return null;
			} );

			const instancesWithMediaOffload = [
				...mockInstances,
				{
					instanceId: 'cloudflare-r2-media-offload:uuid-5',
					config: {
						provider_type: 'cloudflare-r2-media-offload',
						instance_name: 'R2 Media',
					},
				},
			];

			const result = getCompatibleInstances(
				'cloudflare-r2-media-offload:uuid-5',
				instancesWithMediaOffload
			);

			// Should include all R2 instances except itself
			expect( result ).toHaveLength( 3 );
			expect( result.map( ( i ) => i.instanceId ) ).toContain(
				'cloudflare-r2-static-site:uuid-1'
			);
			expect( result.map( ( i ) => i.instanceId ) ).toContain(
				'cloudflare-r2-static-site:uuid-2'
			);
			expect( result.map( ( i ) => i.instanceId ) ).toContain(
				'cloudflare-r2-blueprint-bundle:uuid-3'
			);
		} );
	} );

	// ============================================================
	// isSameProviderFamily
	// ============================================================
	describe( 'isSameProviderFamily', () => {
		beforeEach( () => {
			// Set up registry mock
			ProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType.startsWith( 'cloudflare-r2' ) ) {
					return class {
						static FAMILY = 'cloudflare-r2';
					};
				}
				if ( providerType.startsWith( 'local-filesystem' ) ) {
					return class {
						static FAMILY = 'local-filesystem';
					};
				}
				return null;
			} );
		} );

		test( 'should return true for same family with different suffixes', () => {
			expect(
				isSameProviderFamily(
					'cloudflare-r2-static-site',
					'cloudflare-r2-blueprint-bundle'
				)
			).toBe( true );
		} );

		test( 'should return true for identical provider types', () => {
			expect(
				isSameProviderFamily(
					'cloudflare-r2-static-site',
					'cloudflare-r2-static-site'
				)
			).toBe( true );
		} );

		test( 'should return false for different families', () => {
			expect(
				isSameProviderFamily(
					'cloudflare-r2-static-site',
					'local-filesystem-static-site'
				)
			).toBe( false );
		} );

		test( 'should return false for providers without FAMILY property', () => {
			expect( isSameProviderFamily( 'provider-a', 'provider-b' ) ).toBe(
				false
			);
		} );

		test( 'should return true for same provider without FAMILY (uses ID as family)', () => {
			expect(
				isSameProviderFamily( 'simple-provider', 'simple-provider' )
			).toBe( true );
		} );

		test( 'should return true for media-offload and static-site in same family', () => {
			expect(
				isSameProviderFamily(
					'cloudflare-r2-static-site',
					'cloudflare-r2-media-offload'
				)
			).toBe( true );
		} );

		test( 'should handle empty strings', () => {
			expect( isSameProviderFamily( '', '' ) ).toBe( true );
			expect(
				isSameProviderFamily( 'cloudflare-r2-static-site', '' )
			).toBe( false );
		} );
	} );
} );
