/**
 * Provider Metadata Tests
 *
 * Tests for provider metadata caching and retrieval utilities.
 * Validates caching behavior and API integration.
 *
 * @package
 */

import {
	getProviderMetadata,
	getProvidersByDeploymentType,
	getProviderById,
	clearMetadataCache,
} from '../providerMetadata';
import apiFetch from '@wordpress/api-fetch';

// Mock dependencies
jest.mock( '@wordpress/api-fetch' );

describe( 'providerMetadata', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		clearMetadataCache();
		// Suppress console.error in tests
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		console.error.mockRestore();
	} );

	describe( 'getProviderMetadata()', () => {
		describe( 'Caching behavior', () => {
			test( 'should fetch metadata on first call', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [
						{ id: 'provider-1', name: 'Provider 1' },
						{ id: 'provider-2', name: 'Provider 2' },
					],
				} );

				const result = await getProviderMetadata();

				expect( apiFetch ).toHaveBeenCalledTimes( 1 );
				expect( result ).toHaveLength( 2 );
			} );

			test( 'should use cache on subsequent calls', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [ { id: 'provider-1', name: 'Provider 1' } ],
				} );

				await getProviderMetadata();
				const result = await getProviderMetadata();

				expect( apiFetch ).toHaveBeenCalledTimes( 1 );
				expect( result ).toHaveLength( 1 );
			} );

			test( 'should return same reference from cache', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [ { id: 'provider-1' } ],
				} );

				const result1 = await getProviderMetadata();
				const result2 = await getProviderMetadata();

				expect( result1 ).toBe( result2 );
			} );

			test( 'should refetch after cache clear', async () => {
				apiFetch
					.mockResolvedValueOnce( {
						success: true,
						providers: [ { id: 'provider-1' } ],
					} )
					.mockResolvedValueOnce( {
						success: true,
						providers: [ { id: 'provider-2' } ],
					} );

				await getProviderMetadata();
				clearMetadataCache();
				const result = await getProviderMetadata();

				expect( apiFetch ).toHaveBeenCalledTimes( 2 );
				expect( result[ 0 ].id ).toBe( 'provider-2' );
			} );
		} );

		describe( 'API response handling', () => {
			test( 'should return providers array on success', async () => {
				const mockProviders = [
					{ id: 'provider-1', name: 'Provider 1' },
					{ id: 'provider-2', name: 'Provider 2' },
				];

				apiFetch.mockResolvedValue( {
					success: true,
					providers: mockProviders,
				} );

				const result = await getProviderMetadata();

				expect( result ).toEqual( mockProviders );
			} );

			test( 'should return empty array when success is false', async () => {
				apiFetch.mockResolvedValue( {
					success: false,
				} );

				const result = await getProviderMetadata();

				expect( result ).toEqual( [] );
			} );

			test( 'should return empty array when providers is missing', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
				} );

				const result = await getProviderMetadata();

				expect( result ).toEqual( [] );
			} );

			test( 'should return empty array on API error', async () => {
				apiFetch.mockRejectedValue( new Error( 'Network error' ) );

				const result = await getProviderMetadata();

				expect( result ).toEqual( [] );
				expect( console.error ).toHaveBeenCalledWith(
					'[Aether] Failed to fetch provider metadata:',
					expect.any( Error )
				);
			} );

			test( 'should not cache empty array on error', async () => {
				apiFetch
					.mockRejectedValueOnce( new Error( 'Network error' ) )
					.mockResolvedValueOnce( {
						success: true,
						providers: [ { id: 'provider-1' } ],
					} );

				await getProviderMetadata();
				const result = await getProviderMetadata();

				expect( apiFetch ).toHaveBeenCalledTimes( 2 );
				expect( result ).toHaveLength( 1 );
			} );
		} );
	} );

	describe( 'getProvidersByDeploymentType()', () => {
		describe( 'No caching (always fetches)', () => {
			test( 'should fetch every time', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [ { id: 'provider-1' } ],
				} );

				await getProvidersByDeploymentType( 'static_site' );
				await getProvidersByDeploymentType( 'static_site' );

				expect( apiFetch ).toHaveBeenCalledTimes( 2 );
			} );

			test( 'should use correct API path', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [],
				} );

				await getProvidersByDeploymentType( 'static_site' );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/by-deployment-type/static_site',
				} );
			} );

			test( 'should handle different deployment types', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [],
				} );

				await getProvidersByDeploymentType( 'blueprint_bundle' );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/by-deployment-type/blueprint_bundle',
				} );
			} );
		} );

		describe( 'API response handling', () => {
			test( 'should return providers array on success', async () => {
				const mockProviders = [
					{ id: 'provider-1' },
					{ id: 'provider-2' },
				];

				apiFetch.mockResolvedValue( {
					success: true,
					providers: mockProviders,
				} );

				const result =
					await getProvidersByDeploymentType( 'static_site' );

				expect( result ).toEqual( mockProviders );
			} );

			test( 'should return empty array when success is false', async () => {
				apiFetch.mockResolvedValue( {
					success: false,
				} );

				const result =
					await getProvidersByDeploymentType( 'static_site' );

				expect( result ).toEqual( [] );
			} );

			test( 'should return empty array when providers is missing', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
				} );

				const result =
					await getProvidersByDeploymentType( 'static_site' );

				expect( result ).toEqual( [] );
			} );

			test( 'should return empty array on API error', async () => {
				apiFetch.mockRejectedValue( new Error( 'Network error' ) );

				const result =
					await getProvidersByDeploymentType( 'static_site' );

				expect( result ).toEqual( [] );
				expect( console.error ).toHaveBeenCalledWith(
					'[Aether] Failed to fetch providers for deployment type static_site:',
					expect.any( Error )
				);
			} );
		} );
	} );

	describe( 'getProviderById()', () => {
		describe( 'No caching (always fetches)', () => {
			test( 'should fetch every time', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					provider: { id: 'provider-1' },
				} );

				await getProviderById( 'provider-1' );
				await getProviderById( 'provider-1' );

				expect( apiFetch ).toHaveBeenCalledTimes( 2 );
			} );

			test( 'should use correct API path', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					provider: {},
				} );

				await getProviderById( 'local-filesystem' );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/local-filesystem',
				} );
			} );

			test( 'should handle different provider IDs', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
					provider: {},
				} );

				await getProviderById( 'cloudflare-r2' );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/cloudflare-r2',
				} );
			} );
		} );

		describe( 'API response handling', () => {
			test( 'should return provider object on success', async () => {
				const mockProvider = {
					id: 'provider-1',
					name: 'Provider 1',
				};

				apiFetch.mockResolvedValue( {
					success: true,
					provider: mockProvider,
				} );

				const result = await getProviderById( 'provider-1' );

				expect( result ).toEqual( mockProvider );
			} );

			test( 'should return null when success is false', async () => {
				apiFetch.mockResolvedValue( {
					success: false,
				} );

				const result = await getProviderById( 'provider-1' );

				expect( result ).toBeNull();
			} );

			test( 'should return null when provider is missing', async () => {
				apiFetch.mockResolvedValue( {
					success: true,
				} );

				const result = await getProviderById( 'provider-1' );

				expect( result ).toBeNull();
			} );

			test( 'should return null on API error', async () => {
				apiFetch.mockRejectedValue( new Error( 'Network error' ) );

				const result = await getProviderById( 'provider-1' );

				expect( result ).toBeNull();
				expect( console.error ).toHaveBeenCalledWith(
					'[Aether] Failed to fetch provider provider-1:',
					expect.any( Error )
				);
			} );
		} );
	} );

	describe( 'clearMetadataCache()', () => {
		test( 'should clear the cache', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				providers: [ { id: 'provider-1' } ],
			} );

			await getProviderMetadata();
			clearMetadataCache();

			// Next call should fetch again
			await getProviderMetadata();

			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'should be safe to call when cache is empty', () => {
			expect( () => clearMetadataCache() ).not.toThrow();
		} );

		test( 'should be safe to call multiple times', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				providers: [],
			} );

			clearMetadataCache();
			clearMetadataCache();
			clearMetadataCache();

			expect( () => clearMetadataCache() ).not.toThrow();
		} );
	} );

	describe( 'Integration scenarios', () => {
		test( 'getProviderMetadata cache should not affect other functions', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				providers: [ { id: 'provider-1' } ],
				provider: { id: 'provider-1' },
			} );

			await getProviderMetadata();
			await getProviderById( 'provider-1' );
			await getProvidersByDeploymentType( 'static_site' );

			// getProviderMetadata should use cache (1 call)
			// Other functions should not (2 calls each)
			expect( apiFetch ).toHaveBeenCalledTimes( 3 );
		} );

		test( 'should handle sequential calls with caching', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				providers: [ { id: 'provider-1' } ],
			} );

			// First call fetches
			await getProviderMetadata();
			// Subsequent calls use cache
			await getProviderMetadata();
			await getProviderMetadata();

			// Should only fetch once
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should handle mixed success and failure calls', async () => {
			apiFetch
				.mockRejectedValueOnce( new Error( 'Error' ) )
				.mockResolvedValueOnce( {
					success: true,
					providers: [ { id: 'provider-1' } ],
				} );

			const result1 = await getProviderMetadata();
			const result2 = await getProviderMetadata();

			expect( result1 ).toEqual( [] );
			expect( result2 ).toEqual( [ { id: 'provider-1' } ] );
		} );
	} );
} );
