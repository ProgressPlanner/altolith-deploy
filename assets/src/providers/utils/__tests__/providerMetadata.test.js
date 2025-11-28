/**
 * Provider Metadata Tests
 *
 * Tests for provider metadata retrieval utilities.
 * Validates ProviderRegistry integration.
 *
 */

import {
	getProviderMetadata,
	getProviderById,
	clearMetadataCache,
} from '../providerMetadata';

// Mock ProviderRegistry
const mockGetAll = jest.fn();
const mockGet = jest.fn();

jest.mock( '../../registry/ProviderRegistry', () => ( {
	__esModule: true,
	default: {
		getAll: () => mockGetAll(),
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
			// Mock provider classes with static properties
			const mockProviders = [
				class {
					static ID = 'provider-1';
					static NAME = 'Provider 1';
					static DESCRIPTION = 'Description 1';
					static TYPE = 'type-1';
					static DEPLOYMENT_TYPE = 'static_site';
				},
				class {
					static ID = 'provider-2';
					static NAME = 'Provider 2';
					static DESCRIPTION = 'Description 2';
					static TYPE = 'type-2';
					static DEPLOYMENT_TYPE = 'blueprint_bundle';
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
			} );
		} );

		test( 'should handle providers without optional methods', () => {
			// Mock provider class with minimal static properties
			const mockProviders = [
				class {
					static ID = 'provider-1';
					static NAME = 'Provider 1';
				},
			];
			mockGetAll.mockReturnValue( mockProviders );

			const result = getProviderMetadata();

			expect( result[ 0 ] ).toEqual( {
				id: 'provider-1',
				name: 'Provider 1',
				description: '',
				type: 'generic',
			} );
		} );

		test( 'should return empty array when no providers', () => {
			mockGetAll.mockReturnValue( [] );

			const result = getProviderMetadata();

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getProviderById()', () => {
		test( 'should get provider by ID', () => {
			// Mock provider class with static properties
			const MockProvider = class {
				static ID = 'provider-1';
				static NAME = 'Provider 1';
				static DESCRIPTION = 'Description 1';
				static TYPE = 'type-1';
				static DEPLOYMENT_TYPE = 'static_site';
			};
			mockGet.mockReturnValue( MockProvider );

			const result = getProviderById( 'provider-1' );

			expect( mockGet ).toHaveBeenCalledWith( 'provider-1' );
			expect( result ).toEqual( {
				id: 'provider-1',
				name: 'Provider 1',
				description: 'Description 1',
				type: 'type-1',
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
