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

describe( 'providerFamily', () => {
	// ============================================================
	// getProviderFamily
	// ============================================================
	describe( 'getProviderFamily', () => {
		test( 'should extract family from static-site suffix', () => {
			expect( getProviderFamily( 'cloudflare-r2-static-site' ) ).toBe(
				'cloudflare-r2'
			);
		} );

		test( 'should extract family from blueprint-bundle suffix', () => {
			expect(
				getProviderFamily( 'cloudflare-r2-blueprint-bundle' )
			).toBe( 'cloudflare-r2' );
		} );

		test( 'should extract family from edge-functions suffix', () => {
			expect( getProviderFamily( 'cloudflare-r2-edge-functions' ) ).toBe(
				'cloudflare-r2'
			);
		} );

		test( 'should handle local-filesystem provider', () => {
			expect( getProviderFamily( 'local-filesystem-static-site' ) ).toBe(
				'local-filesystem'
			);
			expect(
				getProviderFamily( 'local-filesystem-blueprint-bundle' )
			).toBe( 'local-filesystem' );
		} );

		test( 'should return provider type as-is if no known suffix', () => {
			expect( getProviderFamily( 'simple-provider' ) ).toBe(
				'simple-provider'
			);
		} );

		test( 'should handle provider with hyphens in name', () => {
			expect(
				getProviderFamily( 'my-custom-provider-static-site' )
			).toBe( 'my-custom-provider' );
		} );

		test( 'should handle empty string', () => {
			expect( getProviderFamily( '' ) ).toBe( '' );
		} );

		test( 'should handle null', () => {
			expect( getProviderFamily( null ) ).toBe( '' );
		} );

		test( 'should handle undefined', () => {
			expect( getProviderFamily( undefined ) ).toBe( '' );
		} );

		test( 'should handle non-string input', () => {
			expect( getProviderFamily( 123 ) ).toBe( '' );
			expect( getProviderFamily( {} ) ).toBe( '' );
			expect( getProviderFamily( [] ) ).toBe( '' );
		} );
	} );

	// ============================================================
	// getCompatibleInstances
	// ============================================================
	describe( 'getCompatibleInstances', () => {
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

		test( 'should handle empty instances array', () => {
			const result = getCompatibleInstances(
				'cloudflare-r2-static-site:uuid-1',
				[]
			);

			expect( result ).toHaveLength( 0 );
		} );

		test( 'should handle null target instance ID', () => {
			const result = getCompatibleInstances( null, mockInstances );

			expect( result ).toHaveLength( 0 );
		} );

		test( 'should handle null instances array', () => {
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
	} );

	// ============================================================
	// isSameProviderFamily
	// ============================================================
	describe( 'isSameProviderFamily', () => {
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

		test( 'should return false for providers without suffixes', () => {
			expect( isSameProviderFamily( 'provider-a', 'provider-b' ) ).toBe(
				false
			);
		} );

		test( 'should return true for same provider without suffix', () => {
			expect(
				isSameProviderFamily( 'simple-provider', 'simple-provider' )
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
