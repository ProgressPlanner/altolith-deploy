/**
 * Provider Discovery Tests
 *
 * Tests for provider discovery utilities.
 * Validates provider selection logic and API integration.
 *
 * @package
 */

import {
	getDefaultProvider,
	getProviderForDeploymentType,
} from '../providerDiscovery';
import apiFetch from '@wordpress/api-fetch';

// Mock dependencies
jest.mock( '@wordpress/api-fetch' );

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, defaultValue ) => defaultValue ),
} ) );

// Import the mock after jest.mock() is set up
import { applyFilters } from '@wordpress/hooks';

describe( 'providerDiscovery', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Reset to default: no filters applied
		applyFilters.mockImplementation(
			( hook, defaultValue ) => defaultValue
		);
		// Suppress console.error in tests
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		console.error.mockRestore();
	} );

	describe( 'getDefaultProvider()', () => {
		describe( 'Filter customization', () => {
			test( 'should use filtered value when provided', async () => {
				applyFilters.mockReturnValue( 'custom-provider' );

				const result = await getDefaultProvider();

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getDefault',
					null
				);
				expect( result ).toBe( 'custom-provider' );
				expect( apiFetch ).not.toHaveBeenCalled();
			} );

			test( 'should call applyFilters with correct hook name', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: false,
				} );

				await getDefaultProvider();

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getDefault',
					null
				);
			} );
		} );

		describe( 'API fetching', () => {
			test( 'should fetch providers from API when no filter', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [
						{
							id: 'provider-1',
							deployment_types: [ 'blueprint_bundle' ],
						},
					],
				} );

				await getDefaultProvider();

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers',
				} );
			} );

			test( 'should return first static_site provider when available', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [
						{
							id: 'provider-1',
							deployment_types: [ 'blueprint_bundle' ],
						},
						{
							id: 'provider-2',
							deployment_types: [ 'static_site' ],
						},
						{
							id: 'provider-3',
							deployment_types: [
								'static_site',
								'blueprint_bundle',
							],
						},
					],
				} );

				const result = await getDefaultProvider();

				expect( result ).toBe( 'provider-2' );
			} );

			test( 'should return first provider if no static_site providers', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [
						{
							id: 'provider-1',
							deployment_types: [ 'blueprint_bundle' ],
						},
						{
							id: 'provider-2',
							deployment_types: [ 'blueprint_bundle' ],
						},
					],
				} );

				const result = await getDefaultProvider();

				expect( result ).toBe( 'provider-1' );
			} );

			test( 'should handle providers without deployment_types field', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [
						{ id: 'provider-1' },
						{
							id: 'provider-2',
							deployment_types: [ 'static_site' ],
						},
					],
				} );

				const result = await getDefaultProvider();

				// Should find provider-2 which has static_site
				expect( result ).toBe( 'provider-2' );
			} );

			test( 'should return null when no providers available', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [],
				} );

				const result = await getDefaultProvider();

				expect( result ).toBeNull();
			} );

			test( 'should return null when success is false', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: false,
				} );

				const result = await getDefaultProvider();

				expect( result ).toBeNull();
			} );

			test( 'should return null when providers field is missing', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
				} );

				const result = await getDefaultProvider();

				expect( result ).toBeNull();
			} );

			test( 'should handle API error gracefully', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockRejectedValue( new Error( 'Network error' ) );

				const result = await getDefaultProvider();

				expect( result ).toBeNull();
				expect( console.error ).toHaveBeenCalledWith(
					'[Aether] Failed to fetch default provider:',
					expect.any( Error )
				);
			} );
		} );
	} );

	describe( 'getProviderForDeploymentType()', () => {
		describe( 'Filter customization', () => {
			test( 'should use filtered value when provided', async () => {
				applyFilters.mockReturnValue( 'custom-provider' );

				const result =
					await getProviderForDeploymentType( 'static_site' );

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getForDeploymentType',
					null,
					'static_site'
				);
				expect( result ).toBe( 'custom-provider' );
				expect( apiFetch ).not.toHaveBeenCalled();
			} );

			test( 'should call applyFilters with deployment type parameter', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: false,
				} );

				await getProviderForDeploymentType( 'blueprint_bundle' );

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getForDeploymentType',
					null,
					'blueprint_bundle'
				);
			} );
		} );

		describe( 'API fetching', () => {
			test( 'should fetch providers for deployment type from API', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [ { id: 'provider-1' } ],
				} );

				await getProviderForDeploymentType( 'static_site' );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/by-deployment-type/static_site',
				} );
			} );

			test( 'should return first provider when multiple available', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [
						{ id: 'provider-1' },
						{ id: 'provider-2' },
						{ id: 'provider-3' },
					],
				} );

				const result =
					await getProviderForDeploymentType( 'static_site' );

				expect( result ).toBe( 'provider-1' );
			} );

			test( 'should handle different deployment types', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [ { id: 'blueprint-provider' } ],
				} );

				await getProviderForDeploymentType( 'blueprint_bundle' );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/by-deployment-type/blueprint_bundle',
				} );
			} );

			test( 'should return null when no providers for type', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [],
				} );

				const result =
					await getProviderForDeploymentType( 'static_site' );

				expect( result ).toBeNull();
			} );

			test( 'should return null when success is false', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: false,
				} );

				const result =
					await getProviderForDeploymentType( 'static_site' );

				expect( result ).toBeNull();
			} );

			test( 'should return null when providers field is missing', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
				} );

				const result =
					await getProviderForDeploymentType( 'static_site' );

				expect( result ).toBeNull();
			} );

			test( 'should handle API error gracefully', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockRejectedValue( new Error( 'Network error' ) );

				const result =
					await getProviderForDeploymentType( 'static_site' );

				expect( result ).toBeNull();
				expect( console.error ).toHaveBeenCalledWith(
					'[Aether] Failed to fetch provider for deployment type static_site:',
					expect.any( Error )
				);
			} );
		} );

		describe( 'Edge cases', () => {
			test( 'should handle empty deployment type string', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [],
				} );

				await getProviderForDeploymentType( '' );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/by-deployment-type/',
				} );
			} );

			test( 'should handle null deployment type', async () => {
				applyFilters.mockReturnValue( null );
				apiFetch.mockResolvedValue( {
					success: true,
					providers: [],
				} );

				await getProviderForDeploymentType( null );

				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/by-deployment-type/null',
				} );
			} );
		} );
	} );

	describe( 'Integration scenarios', () => {
		test( 'both functions should handle filter override consistently', async () => {
			applyFilters.mockReturnValue( 'filtered-provider' );

			const default1 = await getDefaultProvider();
			const forType = await getProviderForDeploymentType( 'static_site' );

			expect( default1 ).toBe( 'filtered-provider' );
			expect( forType ).toBe( 'filtered-provider' );
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		test( 'both functions should return null on API failure', async () => {
			applyFilters.mockReturnValue( null );
			apiFetch.mockRejectedValue( new Error( 'API error' ) );

			const default1 = await getDefaultProvider();
			const forType = await getProviderForDeploymentType( 'static_site' );

			expect( default1 ).toBeNull();
			expect( forType ).toBeNull();
		} );
	} );
} );
