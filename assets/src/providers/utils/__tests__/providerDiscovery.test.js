/**
 * Provider Discovery Tests
 *
 * Tests for provider discovery utilities.
 * Validates provider selection logic using JavaScript ProviderRegistry.
 *
 */

import {
	getDefaultProvider,
	getProviderForDeploymentType,
} from '../providerDiscovery';
import ProviderRegistry from '../../registry/ProviderRegistry';

// Mock ProviderRegistry
const mockGetDefault = jest.fn();
const mockGetForDeploymentType = jest.fn();

jest.mock( '../../registry/ProviderRegistry', () => ( {
	__esModule: true,
	default: {
		getDefault: () => mockGetDefault(),
		getForDeploymentType: ( type ) => mockGetForDeploymentType( type ),
	},
} ) );

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
			test( 'should use filtered value when provided', () => {
				applyFilters.mockReturnValue( 'custom-provider' );

				const result = getDefaultProvider();

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getDefault',
					null
				);
				expect( result ).toBe( 'custom-provider' );
				expect( mockGetDefault ).not.toHaveBeenCalled();
			} );

			test( 'should call applyFilters with correct hook name', () => {
				applyFilters.mockReturnValue( null );
				mockGetDefault.mockReturnValue( null );

				getDefaultProvider();

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getDefault',
					null
				);
			} );
		} );

		describe( 'Registry lookup', () => {
			test( 'should get default provider from registry when no filter', () => {
				applyFilters.mockReturnValue( null );
				const mockProvider = {
					getId: () => 'provider-1',
				};
				mockGetDefault.mockReturnValue( mockProvider );

				const result = getDefaultProvider();

				expect( mockGetDefault ).toHaveBeenCalled();
				expect( result ).toBe( 'provider-1' );
			} );

			test( 'should return null when registry returns null', () => {
				applyFilters.mockReturnValue( null );
				mockGetDefault.mockReturnValue( null );

				const result = getDefaultProvider();

				expect( result ).toBeNull();
			} );
		} );
	} );

	describe( 'getProviderForDeploymentType()', () => {
		describe( 'Filter customization', () => {
			test( 'should use filtered value when provided', () => {
				applyFilters.mockReturnValue( 'custom-provider' );

				const result = getProviderForDeploymentType( 'static_site' );

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getForDeploymentType',
					null,
					'static_site'
				);
				expect( result ).toBe( 'custom-provider' );
				expect( mockGetForDeploymentType ).not.toHaveBeenCalled();
			} );

			test( 'should call applyFilters with deployment type parameter', () => {
				applyFilters.mockReturnValue( null );
				mockGetForDeploymentType.mockReturnValue( null );

				getProviderForDeploymentType( 'blueprint_bundle' );

				expect( applyFilters ).toHaveBeenCalledWith(
					'aether.provider.getForDeploymentType',
					null,
					'blueprint_bundle'
				);
			} );
		} );

		describe( 'Registry lookup', () => {
			test( 'should get provider for deployment type from registry', () => {
				applyFilters.mockReturnValue( null );
				const mockProvider = {
					getId: () => 'provider-1',
				};
				mockGetForDeploymentType.mockReturnValue( mockProvider );

				const result = getProviderForDeploymentType( 'static_site' );

				expect( mockGetForDeploymentType ).toHaveBeenCalledWith(
					'static_site'
				);
				expect( result ).toBe( 'provider-1' );
			} );

			test( 'should return null when no provider for deployment type', () => {
				applyFilters.mockReturnValue( null );
				mockGetForDeploymentType.mockReturnValue( null );

				const result = getProviderForDeploymentType( 'static_site' );

				expect( result ).toBeNull();
			} );

			test( 'should handle different deployment types', () => {
				applyFilters.mockReturnValue( null );
				const mockProvider = {
					getId: () => 'blueprint-provider',
				};
				mockGetForDeploymentType.mockReturnValue( mockProvider );

				const result =
					getProviderForDeploymentType( 'blueprint_bundle' );

				expect( mockGetForDeploymentType ).toHaveBeenCalledWith(
					'blueprint_bundle'
				);
				expect( result ).toBe( 'blueprint-provider' );
			} );
		} );
	} );

	describe( 'Integration scenarios', () => {
		test( 'both functions should handle filter override consistently', () => {
			applyFilters.mockReturnValue( 'filtered-provider' );

			const default1 = getDefaultProvider();
			const forType = getProviderForDeploymentType( 'static_site' );

			expect( default1 ).toBe( 'filtered-provider' );
			expect( forType ).toBe( 'filtered-provider' );
			expect( mockGetDefault ).not.toHaveBeenCalled();
			expect( mockGetForDeploymentType ).not.toHaveBeenCalled();
		} );

		test( 'both functions should use registry when no filter', () => {
			applyFilters.mockReturnValue( null );
			const mockProvider1 = { getId: () => 'provider-1' };
			const mockProvider2 = { getId: () => 'provider-2' };
			mockGetDefault.mockReturnValue( mockProvider1 );
			mockGetForDeploymentType.mockReturnValue( mockProvider2 );

			const default1 = getDefaultProvider();
			const forType = getProviderForDeploymentType( 'static_site' );

			expect( default1 ).toBe( 'provider-1' );
			expect( forType ).toBe( 'provider-2' );
		} );
	} );
} );
