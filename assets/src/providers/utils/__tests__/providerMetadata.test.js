/**
 * Provider Metadata Tests
 *
 * Tests for provider metadata retrieval utilities.
 * Validates ProviderRegistry integration.
 *
 * @package
 */

import {
	getProviderMetadata,
	getProvidersByDeploymentType,
	getProviderById,
	clearMetadataCache,
} from '../providerMetadata';
import ProviderRegistry from '../../registry/ProviderRegistry';

// Mock ProviderRegistry
const mockGetAll = jest.fn();
const mockGetByDeploymentType = jest.fn();
const mockGet = jest.fn();

jest.mock( '../../registry/ProviderRegistry', () => ( {
	__esModule: true,
	default: {
		getAll: () => mockGetAll(),
		getByDeploymentType: ( type ) => mockGetByDeploymentType( type ),
		get: ( id ) => mockGet( id ),
	},
} ) );

describe( 'providerMetadata', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Suppress console.error in tests
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		console.error.mockRestore();
	} );

	describe( 'getProviderMetadata()', () => {
		test( 'should get all providers from registry', () => {
			const mockProviders = [
				{
					getId: () => 'provider-1',
					getName: () => 'Provider 1',
					getDescription: () => 'Description 1',
					getType: () => 'type-1',
					getSupportedDeploymentTypes: () => [ 'static_site' ],
				},
				{
					getId: () => 'provider-2',
					getName: () => 'Provider 2',
					getDescription: () => 'Description 2',
					getType: () => 'type-2',
					getSupportedDeploymentTypes: () => [
						'static_site',
						'blueprint_bundle',
					],
				},
			];
			mockGetAll.mockReturnValue( mockProviders );

			const result = getProviderMetadata();

			expect( mockGetAll ).toHaveBeenCalled();
			expect( result ).toHaveLength( 2 );
			expect( result[ 0 ] ).toEqual( {
				id: 'provider-1',
				name: 'Provider 1',
				description: 'Description 1',
				type: 'type-1',
				deployment_types: [ 'static_site' ],
			} );
		} );

		test( 'should handle providers without optional methods', () => {
			const mockProviders = [
				{
					getId: () => 'provider-1',
					getName: () => 'Provider 1',
				},
			];
			mockGetAll.mockReturnValue( mockProviders );

			const result = getProviderMetadata();

			expect( result[ 0 ] ).toEqual( {
				id: 'provider-1',
				name: 'Provider 1',
				description: '',
				type: 'generic',
				deployment_types: [],
			} );
		} );

		test( 'should return empty array when no providers', () => {
			mockGetAll.mockReturnValue( [] );

			const result = getProviderMetadata();

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getProvidersByDeploymentType()', () => {
		test( 'should get providers for deployment type', () => {
			const mockProviders = [
				{
					getId: () => 'provider-1',
					getName: () => 'Provider 1',
					getDescription: () => 'Description 1',
					getType: () => 'type-1',
					getSupportedDeploymentTypes: () => [ 'static_site' ],
				},
			];
			mockGetByDeploymentType.mockReturnValue( mockProviders );

			const result = getProvidersByDeploymentType( 'static_site' );

			expect( mockGetByDeploymentType ).toHaveBeenCalledWith(
				'static_site'
			);
			expect( result ).toHaveLength( 1 );
			expect( result[ 0 ].id ).toBe( 'provider-1' );
		} );

		test( 'should return empty array when no providers for type', () => {
			mockGetByDeploymentType.mockReturnValue( [] );

			const result = getProvidersByDeploymentType( 'blueprint_bundle' );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getProviderById()', () => {
		test( 'should get provider by ID', () => {
			const mockProvider = {
				getId: () => 'provider-1',
				getName: () => 'Provider 1',
				getDescription: () => 'Description 1',
				getType: () => 'type-1',
				getSupportedDeploymentTypes: () => [ 'static_site' ],
			};
			mockGet.mockReturnValue( mockProvider );

			const result = getProviderById( 'provider-1' );

			expect( mockGet ).toHaveBeenCalledWith( 'provider-1' );
			expect( result ).toEqual( {
				id: 'provider-1',
				name: 'Provider 1',
				description: 'Description 1',
				type: 'type-1',
				deployment_types: [ 'static_site' ],
			} );
		} );

		test( 'should return null when provider not found', () => {
			mockGet.mockReturnValue( null );

			const result = getProviderById( 'non-existent' );

			expect( result ).toBeNull();
		} );
	} );

	describe( 'clearMetadataCache()', () => {
		test( 'should be a no-op function', () => {
			// clearMetadataCache is now a no-op since we use registry directly
			expect( () => clearMetadataCache() ).not.toThrow();
		} );
	} );
} );
