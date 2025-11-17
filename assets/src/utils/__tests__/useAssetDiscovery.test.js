/**
 * Tests for useAssetDiscovery hook
 *
 * @package
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useAssetDiscovery, { isFromWordPressOrg } from '../useAssetDiscovery';

// Mock global fetch
global.fetch = jest.fn();

describe( 'isFromWordPressOrg', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns true for existing WordPress.org plugin', async () => {
		global.fetch.mockResolvedValueOnce( {
			status: 200,
			type: 'basic',
		} );

		const result = await isFromWordPressOrg( 'akismet', 'plugin' );

		expect( result ).toBe( true );
		expect( global.fetch ).toHaveBeenCalledWith(
			'https://wordpress.org/plugins/akismet/',
			{
				method: 'HEAD',
				redirect: 'manual',
			}
		);
	} );

	it( 'returns true for existing WordPress.org theme', async () => {
		global.fetch.mockResolvedValueOnce( {
			status: 200,
			type: 'basic',
		} );

		const result = await isFromWordPressOrg( 'twentytwentyfour', 'theme' );

		expect( result ).toBe( true );
		expect( global.fetch ).toHaveBeenCalledWith(
			'https://wordpress.org/themes/twentytwentyfour/',
			{
				method: 'HEAD',
				redirect: 'manual',
			}
		);
	} );

	it( 'returns false for non-existent plugin (404)', async () => {
		global.fetch.mockResolvedValueOnce( {
			status: 404,
			type: 'basic',
		} );

		const result = await isFromWordPressOrg(
			'non-existent-plugin',
			'plugin'
		);

		expect( result ).toBe( false );
	} );

	it( 'returns false when response is redirected', async () => {
		global.fetch.mockResolvedValueOnce( {
			status: 200,
			type: 'opaqueredirect',
		} );

		const result = await isFromWordPressOrg( 'redirected', 'plugin' );

		expect( result ).toBe( false );
	} );

	it( 'returns false on network error', async () => {
		global.fetch.mockRejectedValueOnce( new Error( 'Network error' ) );

		const result = await isFromWordPressOrg( 'test-plugin', 'plugin' );

		expect( result ).toBe( false );
	} );

	it( 'returns false on CORS error', async () => {
		global.fetch.mockRejectedValueOnce( new TypeError( 'CORS error' ) );

		const result = await isFromWordPressOrg( 'test-plugin', 'plugin' );

		expect( result ).toBe( false );
	} );
} );

describe( 'useAssetDiscovery', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		// Setup mock WordPress data
		global.window.wp = {
			plugins: {
				'akismet/akismet': {
					Name: 'Akismet',
					Version: '5.0',
					active: true,
				},
				'custom-plugin/custom-plugin': {
					Name: 'Custom Plugin',
					Version: '1.0',
					active: true,
				},
			},
			themes: {
				twentytwentyfour: {
					Name: 'Twenty Twenty-Four',
					Version: '1.0',
					active: true,
				},
				'custom-theme': {
					Name: 'Custom Theme',
					Version: '1.0',
					active: false,
				},
			},
			siteName: 'Test Site',
		};
	} );

	afterEach( () => {
		delete global.window.wp;
	} );

	describe( 'discoverCustomAssets', () => {
		it( 'discovers custom plugins and themes', async () => {
			// Mock WordPress.org checks
			global.fetch
				.mockResolvedValueOnce( {
					// akismet - from wporg
					status: 200,
					type: 'basic',
				} )
				.mockResolvedValueOnce( {
					// custom-plugin - not from wporg
					status: 404,
					type: 'basic',
				} )
				.mockResolvedValueOnce( {
					// twentytwentyfour - from wporg
					status: 200,
					type: 'basic',
				} )
				.mockResolvedValueOnce( {
					// custom-theme - not from wporg
					status: 404,
					type: 'basic',
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let customAssets;
			await act( async () => {
				customAssets = await result.current.discoverCustomAssets();
			} );

			expect( customAssets ).toHaveLength( 2 );
			expect( customAssets ).toContainEqual( {
				type: 'plugin',
				slug: 'custom-plugin/custom-plugin',
				name: 'Custom Plugin',
				version: '1.0',
			} );
			expect( customAssets ).toContainEqual( {
				type: 'theme',
				slug: 'custom-theme',
				name: 'Custom Theme',
				version: '1.0',
			} );
		} );

		it( 'sets loading state during discovery', async () => {
			global.fetch.mockImplementation(
				() =>
					new Promise( ( resolve ) =>
						setTimeout(
							() =>
								resolve( {
									status: 200,
									type: 'basic',
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
			// isFromWordPressOrg catches network errors and returns false
			// So assets will be marked as custom, not cause an error
			global.fetch.mockRejectedValue( new Error( 'Network failure' ) );

			const { result } = renderHook( () => useAssetDiscovery() );

			let customAssets;
			await act( async () => {
				customAssets = await result.current.discoverCustomAssets();
			} );

			// All assets should be treated as custom since wporg checks failed
			expect( customAssets.length ).toBeGreaterThan( 0 );
			expect( result.current.loading ).toBe( false );
		} );
	} );

	describe( 'getBlueprintAssets', () => {
		it( 'returns only WordPress.org assets for blueprint', async () => {
			// Mock WordPress.org checks - need to return results for ALL active plugins/themes
			global.fetch
				.mockResolvedValueOnce( {
					// akismet - from wporg, active
					status: 200,
					type: 'basic',
				} )
				.mockResolvedValueOnce( {
					// custom-plugin - NOT from wporg (inactive gets filtered out before check)
					status: 404,
					type: 'basic',
				} )
				.mockResolvedValueOnce( {
					// twentytwentyfour - from wporg, active
					status: 200,
					type: 'basic',
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			expect( assets ).toEqual( {
				plugins: [ 'akismet/akismet' ],
				themes: [ 'twentytwentyfour' ],
				siteName: 'Test Site',
			} );
		} );

		it( 'excludes built-in Playground plugins', async () => {
			global.window.wp.plugins = {
				...global.window.wp.plugins,
				aether: {
					Name: 'Aether',
					Version: '1.0',
					active: true,
				},
				'sqlite-database-integration': {
					Name: 'SQLite',
					Version: '1.0',
					active: true,
				},
			};

			global.fetch.mockResolvedValue( {
				status: 200,
				type: 'basic',
			} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			expect( assets.plugins ).not.toContain( 'aether' );
			expect( assets.plugins ).not.toContain(
				'sqlite-database-integration'
			);
		} );

		it( 'only includes active plugins', async () => {
			global.window.wp.plugins = {
				'active-plugin': {
					Name: 'Active Plugin',
					Version: '1.0',
					active: true,
				},
				'inactive-plugin': {
					Name: 'Inactive Plugin',
					Version: '1.0',
					active: false,
				},
			};

			global.fetch.mockResolvedValue( {
				status: 200,
				type: 'basic',
			} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			expect( assets.plugins ).toContain( 'active-plugin' );
			expect( assets.plugins ).not.toContain( 'inactive-plugin' );
		} );
	} );
} );
