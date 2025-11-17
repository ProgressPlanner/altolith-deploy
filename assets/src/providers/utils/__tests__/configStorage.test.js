/**
 * ConfigStorage Tests
 *
 * @package
 */

import { ConfigStorage } from '../configStorage';
import apiFetch from '../../../utils/api';
import { applyFilters } from '@wordpress/hooks';

jest.mock( '../../../utils/api' );
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

describe( 'ConfigStorage', () => {
	let storage;

	beforeEach( () => {
		storage = new ConfigStorage( 'test-provider' );
		jest.clearAllMocks();
		localStorage.clear();
	} );

	describe( 'Provider Config Isolation', () => {
		test( 'load() returns only config for specific provider', async () => {
			apiFetch.mockResolvedValue( {
				config: {
					api_key: 'test-key',
					bucket_name: 'test-bucket',
				},
			} );

			const config = await storage.load();

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/test-provider/config',
				method: 'GET',
			} );
			expect( config ).toEqual( {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			} );
		} );

		test( 'save() saves only config for specific provider', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const config = {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			};

			await storage.save( config );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/test-provider/config',
				method: 'POST',
				data: { config },
			} );
		} );

		test( 'save() does not affect other provider configs', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const config = {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			};

			await storage.save( config );

			// Verify only this provider's config endpoint was called
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/providers/test-provider/config',
				} )
			);
		} );

		test( 'delete() deletes only config for specific provider', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			await storage.delete();

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/test-provider/config',
				method: 'DELETE',
			} );
		} );
	} );

	describe( 'Cache Management', () => {
		test( 'loads from cache if available and not stale', async () => {
			const cachedConfig = {
				api_key: 'cached-key',
				bucket_name: 'cached-bucket',
			};
			const cacheData = {
				config: cachedConfig,
				timestamp: Date.now() - 1000, // 1 second ago (not stale)
			};
			localStorage.setItem(
				'aetherProviderConfigTest-provider',
				JSON.stringify( cacheData )
			);

			const config = await storage.load();

			expect( config ).toEqual( cachedConfig );
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		test( 'fetches from API if cache is stale', async () => {
			const staleCache = {
				config: { api_key: 'stale-key' },
				timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago (stale)
			};
			localStorage.setItem(
				'aetherProviderConfigTest-provider',
				JSON.stringify( staleCache )
			);

			apiFetch.mockResolvedValue( {
				config: { api_key: 'fresh-key' },
			} );

			const config = await storage.load();

			expect( config ).toEqual( { api_key: 'fresh-key' } );
			expect( apiFetch ).toHaveBeenCalled();
		} );

		test( 'updates cache after successful save', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const config = {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			};

			await storage.save( config );

			// Verify cache was updated
			const cached = localStorage.getItem(
				'aetherProviderConfigTest-provider'
			);
			expect( cached ).toBeTruthy();
			const cacheData = JSON.parse( cached );
			expect( cacheData.config ).toEqual( config );
		} );
	} );
} );
