/**
 * Tests for useAssetDiscovery hook
 *
 * @package
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useAssetDiscovery, { isFromWordPressOrg } from '../useAssetDiscovery';
import apiFetch from '../api';

// Mock apiFetch
jest.mock( '../api' );

describe( 'isFromWordPressOrg', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Setup fetch mock
		global.fetch = jest.fn();
	} );

	it( 'returns true for existing WordPress.org plugin', async () => {
		// Use 'cors-proxy' method (default) which uses fetch
		global.fetch.mockResolvedValueOnce( {
			ok: true,
			json: async () => ( {
				success: true,
				exists: true,
			} ),
		} );

		const result = await isFromWordPressOrg( 'akismet-test-1', 'plugin' );

		expect( result ).toBe( true );
		expect( global.fetch ).toHaveBeenCalledWith(
			expect.stringContaining( 'check-wporg' )
		);
	} );

	it( 'returns true for existing WordPress.org theme', async () => {
		// Use 'cors-proxy' method (default) which uses fetch
		global.fetch.mockResolvedValueOnce( {
			ok: true,
			json: async () => ( {
				success: true,
				exists: true,
			} ),
		} );

		const result = await isFromWordPressOrg(
			'twentytwentyfour-test-1',
			'theme'
		);

		expect( result ).toBe( true );
		expect( global.fetch ).toHaveBeenCalledWith(
			expect.stringContaining( 'check-wporg' )
		);
	} );

	it( 'returns false for non-existent plugin (404)', async () => {
		global.fetch.mockResolvedValueOnce( {
			ok: true,
			json: async () => ( {
				success: true,
				exists: false,
			} ),
		} );

		const result = await isFromWordPressOrg(
			'non-existent-plugin',
			'plugin'
		);

		expect( result ).toBe( false );
	} );

	it( 'returns false when response is redirected', async () => {
		// Use 'direct' method to test redirect behavior
		global.fetch = jest.fn().mockResolvedValueOnce( {
			status: 200,
			type: 'opaqueredirect',
		} );

		const result = await isFromWordPressOrg( 'redirected', 'plugin', {
			wporgCheckMethod: 'direct',
		} );

		expect( result ).toBe( false );
	} );

	it( 'returns false on network error', async () => {
		global.fetch.mockRejectedValueOnce( new Error( 'Network error' ) );

		const result = await isFromWordPressOrg( 'test-plugin', 'plugin' );

		expect( result ).toBe( false );
	} );

	it( 'returns false on CORS error', async () => {
		global.fetch.mockRejectedValueOnce( new TypeError( 'CORS error' ) );

		const result = await isFromWordPressOrg( 'test-plugin-cors', 'plugin' );

		expect( result ).toBe( false );
	} );
} );

describe( 'useAssetDiscovery', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		// Setup mock window.wp.siteName
		global.window.wp = {
			siteName: 'Test Site',
		};

		// Setup fetch mock
		global.fetch = jest.fn();
	} );

	afterEach( () => {
		delete global.window.wp;
	} );

	describe( 'discoverCustomAssets', () => {
		it( 'discovers custom plugins and themes', async () => {
			// Clear any previous mocks
			apiFetch.mockClear();

			// Mock apiFetch for config and assets endpoints
			// Note: apiFetch is called for:
			// 1. Config endpoint
			// 2. Assets endpoint
			apiFetch
				.mockResolvedValueOnce( {
					// Config response
					wporgCheckMethod: 'cors-proxy',
				} )
				.mockResolvedValueOnce( {
					// Assets response
					success: true,
					plugins: [
						{
							slug: 'akismet-test-2/akismet-test-2',
							name: 'Akismet',
							version: '5.0',
							is_active: true,
						},
						{
							slug: 'custom-plugin-test-2/custom-plugin-test-2',
							name: 'Custom Plugin',
							version: '1.0',
							is_active: true,
						},
					],
					themes: [
						{
							slug: 'twentytwentyfour-test-2',
							name: 'Twenty Twenty-Four',
							version: '1.0',
							is_active: true,
						},
						{
							slug: 'custom-theme-test-2',
							name: 'Custom Theme',
							version: '1.0',
							is_active: false,
						},
					],
				} );

			// Mock WordPress.org checks via fetch (cors-proxy method)
			// Checks are done for active plugins/themes only, in order
			global.fetch
				.mockResolvedValueOnce( {
					// akismet-test-2 - from wporg (should be filtered out)
					ok: true,
					json: async () => ( {
						success: true,
						exists: true,
					} ),
				} )
				.mockResolvedValueOnce( {
					// custom-plugin-test-2 - not from wporg (should be included)
					ok: true,
					json: async () => ( {
						success: true,
						exists: false,
					} ),
				} )
				.mockResolvedValueOnce( {
					// twentytwentyfour-test-2 - from wporg (should be filtered out)
					ok: true,
					json: async () => ( {
						success: true,
						exists: true,
					} ),
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let customAssets;
			await act( async () => {
				customAssets = await result.current.discoverCustomAssets();
			} );

			// Should only include custom-plugin-test-2 (akismet-test-2 and twentytwentyfour-test-2 are from wporg)
			expect( customAssets ).toHaveLength( 1 );
			expect( customAssets ).toContainEqual( {
				type: 'plugin',
				slug: 'custom-plugin-test-2/custom-plugin-test-2',
				name: 'Custom Plugin',
				version: '1.0',
			} );
			// Should not include wporg assets
			expect( customAssets ).not.toContainEqual(
				expect.objectContaining( {
					slug: 'akismet-test-2/akismet-test-2',
				} )
			);
			expect( customAssets ).not.toContainEqual(
				expect.objectContaining( { slug: 'twentytwentyfour-test-2' } )
			);
		} );

		it( 'sets loading state during discovery', async () => {
			apiFetch.mockImplementation(
				() =>
					new Promise( ( resolve ) =>
						setTimeout(
							() =>
								resolve( {
									success: true,
									plugins: [],
									themes: [],
								} ),
							100
						)
					)
			);

			const { result } = renderHook( () => useAssetDiscovery() );

			expect( result.current.loading ).toBe( false );

			act( () => {
				result.current.discoverCustomAssets();
			} );

			expect( result.current.loading ).toBe( true );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );
		} );

		it( 'handles errors gracefully', async () => {
			// Clear any previous mocks
			apiFetch.mockClear();

			// Mock apiFetch to return config and assets
			apiFetch
				.mockResolvedValueOnce( {
					wporgCheckMethod: 'cors-proxy',
				} )
				.mockResolvedValueOnce( {
					success: true,
					plugins: [
						{
							slug: 'custom-plugin-test-3',
							name: 'Custom Plugin',
							version: '1.0',
							is_active: true,
						},
					],
					themes: [],
				} );

			// Mock fetch to fail on wporg check
			global.fetch.mockRejectedValueOnce( new Error( 'Network failure' ) );

			const { result } = renderHook( () => useAssetDiscovery() );

			let customAssets;
			await act( async () => {
				customAssets = await result.current.discoverCustomAssets();
			} );

			// Asset should be treated as custom since wporg check failed (error returns false)
			expect( customAssets.length ).toBe( 1 );
			expect( customAssets[ 0 ].slug ).toBe( 'custom-plugin-test-3' );
			expect( result.current.loading ).toBe( false );
		} );
	} );

	describe( 'getBlueprintAssets', () => {
		it( 'returns only WordPress.org assets for blueprint', async () => {
			// Clear any previous mocks
			apiFetch.mockClear();

			// Mock apiFetch for config and assets endpoints
			apiFetch
				.mockResolvedValueOnce( {
					// Config response
					wporgCheckMethod: 'cors-proxy',
				} )
				.mockResolvedValueOnce( {
					// Assets response
					success: true,
					plugins: [
						{
							slug: 'akismet-test-4/akismet-test-4',
							name: 'Akismet',
							version: '5.0',
							is_active: true,
						},
						{
							slug: 'custom-plugin-test-4/custom-plugin-test-4',
							name: 'Custom Plugin',
							version: '1.0',
							is_active: true,
						},
					],
					themes: [
						{
							slug: 'twentytwentyfour-test-4',
							name: 'Twenty Twenty-Four',
							version: '1.0',
							is_active: true,
						},
					],
				} );

			// Mock WordPress.org checks via fetch (cors-proxy method)
			global.fetch
				.mockResolvedValueOnce( {
					// akismet-test-4 - from wporg, active
					ok: true,
					json: async () => ( {
						success: true,
						exists: true,
					} ),
				} )
				.mockResolvedValueOnce( {
					// custom-plugin-test-4 - NOT from wporg
					ok: true,
					json: async () => ( {
						success: true,
						exists: false,
					} ),
				} )
				.mockResolvedValueOnce( {
					// twentytwentyfour-test-4 - from wporg, active
					ok: true,
					json: async () => ( {
						success: true,
						exists: true,
					} ),
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			// Should only include WordPress.org assets (akismet-test-4 and twentytwentyfour-test-4)
			// custom-plugin-test-4 should be excluded because exists: false
			expect( assets.plugins ).toContain( 'akismet-test-4' );
			expect( assets.plugins ).not.toContain( 'custom-plugin-test-4' );
			expect( assets.themes ).toContain( 'twentytwentyfour-test-4' );
			expect( assets.siteName ).toBe( 'Test Site' );
		} );

		it( 'excludes built-in Playground plugins', async () => {
			// Clear any previous mocks
			apiFetch.mockClear();

			apiFetch
				.mockResolvedValueOnce( {
					wporgCheckMethod: 'cors-proxy',
				} )
				.mockResolvedValueOnce( {
					success: true,
					plugins: [
						{
							slug: 'aether/aether',
							name: 'Aether',
							version: '1.0',
							is_active: true,
						},
						{
							slug: 'sqlite-database-integration/sqlite-database-integration',
							name: 'SQLite',
							version: '1.0',
							is_active: true,
						},
					],
					themes: [],
				} );

			// Mock WordPress.org checks via fetch
			global.fetch
				.mockResolvedValueOnce( {
					// aether - from wporg but should be excluded (built-in)
					ok: true,
					json: async () => ( {
						success: true,
						exists: true,
					} ),
				} )
				.mockResolvedValueOnce( {
					// sqlite-database-integration - from wporg but should be excluded (built-in)
					ok: true,
					json: async () => ( {
						success: true,
						exists: true,
					} ),
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			// Built-in plugins should be excluded even if they're from WordPress.org
			expect( assets.plugins ).not.toContain( 'aether' );
			expect( assets.plugins ).not.toContain(
				'sqlite-database-integration'
			);
		} );

		it( 'only includes active plugins', async () => {
			// Clear any previous mocks
			apiFetch.mockClear();

			apiFetch
				.mockResolvedValueOnce( {
					wporgCheckMethod: 'cors-proxy',
				} )
				.mockResolvedValueOnce( {
					success: true,
					plugins: [
						{
							slug: 'active-plugin-test-6',
							name: 'Active Plugin',
							version: '1.0',
							is_active: true,
						},
						{
							slug: 'inactive-plugin-test-6',
							name: 'Inactive Plugin',
							version: '1.0',
							is_active: false,
						},
					],
					themes: [],
				} );

			// Mock WordPress.org check via fetch
			global.fetch.mockResolvedValueOnce( {
				// active-plugin-test-6 - from wporg, should be included
				ok: true,
				json: async () => ( {
					success: true,
					exists: true,
				} ),
			} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			expect( assets.plugins ).toContain( 'active-plugin-test-6' );
			expect( assets.plugins ).not.toContain( 'inactive-plugin-test-6' );
		} );
	} );
} );
