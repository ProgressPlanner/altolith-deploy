/**
 * Tests for useAssetDiscovery hook
 *
 * Tests the hook that checks plugins/themes against the PHP WordPress.org cache endpoint.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useAssetDiscovery, {
	isFromWordPressOrg,
	checkBatchWordPressOrg,
} from '../useAssetDiscovery';
import apiFetch from '../api';

// Mock apiFetch
jest.mock( '../api' );

describe( 'isFromWordPressOrg', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns true for existing WordPress.org plugin', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			results: {
				'plugin:akismet': true,
			},
		} );

		const result = await isFromWordPressOrg( 'akismet', 'plugin' );

		expect( result ).toBe( true );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/aether/site-exporter/wporg/check-batch',
			method: 'POST',
			data: {
				items: [ { slug: 'akismet', type: 'plugin' } ],
			},
		} );
	} );

	it( 'returns true for existing WordPress.org theme', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			results: {
				'theme:twentytwentyfour': true,
			},
		} );

		const result = await isFromWordPressOrg( 'twentytwentyfour', 'theme' );

		expect( result ).toBe( true );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/aether/site-exporter/wporg/check-batch',
			method: 'POST',
			data: {
				items: [ { slug: 'twentytwentyfour', type: 'theme' } ],
			},
		} );
	} );

	it( 'returns false for non-existent plugin', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			results: {
				'plugin:non-existent': false,
			},
		} );

		const result = await isFromWordPressOrg( 'non-existent', 'plugin' );

		expect( result ).toBe( false );
	} );

	it( 'normalizes plugin slugs', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			results: {
				'plugin:akismet': true,
			},
		} );

		const result = await isFromWordPressOrg(
			'akismet/akismet.php',
			'plugin'
		);

		expect( result ).toBe( true );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/aether/site-exporter/wporg/check-batch',
			method: 'POST',
			data: {
				items: [ { slug: 'akismet', type: 'plugin' } ],
			},
		} );
	} );

	it( 'returns false on network error', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

		const result = await isFromWordPressOrg( 'test-plugin', 'plugin' );

		expect( result ).toBe( false );
	} );
} );

describe( 'checkBatchWordPressOrg', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns batch results', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			results: {
				'plugin:akismet': true,
				'plugin:custom-plugin': false,
				'theme:twentytwentyfour': true,
			},
		} );

		const items = [
			{ slug: 'akismet', type: 'plugin' },
			{ slug: 'custom-plugin', type: 'plugin' },
			{ slug: 'twentytwentyfour', type: 'theme' },
		];

		const result = await checkBatchWordPressOrg( items );

		expect( result[ 'plugin:akismet' ] ).toBe( true );
		expect( result[ 'plugin:custom-plugin' ] ).toBe( false );
		expect( result[ 'theme:twentytwentyfour' ] ).toBe( true );
	} );

	it( 'returns empty object for empty input', async () => {
		const result = await checkBatchWordPressOrg( [] );

		expect( result ).toEqual( {} );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'normalizes plugin slugs in batch', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			results: {
				'plugin:akismet': true,
			},
		} );

		await checkBatchWordPressOrg( [
			{ slug: 'akismet/akismet.php', type: 'plugin' },
		] );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/aether/site-exporter/wporg/check-batch',
			method: 'POST',
			data: {
				items: [ { slug: 'akismet', type: 'plugin' } ],
			},
		} );
	} );

	it( 'returns empty object on error', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

		const result = await checkBatchWordPressOrg( [
			{ slug: 'test', type: 'plugin' },
		] );

		expect( result ).toEqual( {} );
	} );
} );

describe( 'useAssetDiscovery', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		// Setup mock window.wp.siteName
		global.window.wp = {
			siteName: 'Test Site',
		};
	} );

	afterEach( () => {
		delete global.window.wp;
	} );

	describe( 'discoverCustomAssets', () => {
		it( 'discovers custom plugins and themes', async () => {
			apiFetch.mockClear();

			// First call: assets endpoint
			apiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'akismet/akismet.php',
						name: 'Akismet',
						version: '5.0',
						is_active: true,
					},
					{
						slug: 'custom-plugin/custom-plugin.php',
						name: 'Custom Plugin',
						version: '1.0',
						is_active: true,
					},
				],
				themes: [
					{
						slug: 'twentytwentyfour',
						name: 'Twenty Twenty-Four',
						version: '1.0',
						is_active: true,
					},
				],
			} );

			// Subsequent calls: WordPress.org checks (one per asset)
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					results: { 'plugin:akismet': true },
				} )
				.mockResolvedValueOnce( {
					success: true,
					results: { 'plugin:custom-plugin': false },
				} )
				.mockResolvedValueOnce( {
					success: true,
					results: { 'theme:twentytwentyfour': true },
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let customAssets;
			await act( async () => {
				customAssets = await result.current.discoverCustomAssets();
			} );

			// Should only include custom-plugin (not from WordPress.org)
			expect( customAssets ).toHaveLength( 1 );
			expect( customAssets[ 0 ].slug ).toBe(
				'custom-plugin/custom-plugin.php'
			);
			expect( customAssets[ 0 ].name ).toBe( 'Custom Plugin' );
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
			apiFetch.mockClear();

			// Assets endpoint
			apiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'custom-plugin',
						name: 'Custom Plugin',
						version: '1.0',
						is_active: true,
					},
				],
				themes: [],
			} );

			// WordPress.org check fails
			apiFetch.mockRejectedValueOnce( new Error( 'Network failure' ) );

			const { result } = renderHook( () => useAssetDiscovery() );

			let customAssets;
			await act( async () => {
				customAssets = await result.current.discoverCustomAssets();
			} );

			// Asset should be treated as custom since wporg check failed
			expect( customAssets.length ).toBe( 1 );
			expect( customAssets[ 0 ].slug ).toBe( 'custom-plugin' );
			expect( result.current.loading ).toBe( false );
		} );
	} );

	describe( 'getBlueprintAssets', () => {
		it( 'returns only WordPress.org assets for blueprint', async () => {
			apiFetch.mockClear();
			document.title = 'Test Site';

			// Assets endpoint
			apiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'akismet/akismet.php',
						name: 'Akismet',
						version: '5.0',
						is_active: true,
					},
					{
						slug: 'custom-plugin/custom-plugin.php',
						name: 'Custom Plugin',
						version: '1.0',
						is_active: true,
					},
				],
				themes: [
					{
						slug: 'twentytwentyfour',
						name: 'Twenty Twenty-Four',
						version: '1.0',
						is_active: true,
					},
				],
			} );

			// WordPress.org checks
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					results: { 'plugin:akismet': true },
				} )
				.mockResolvedValueOnce( {
					success: true,
					results: { 'plugin:custom-plugin': false },
				} )
				.mockResolvedValueOnce( {
					success: true,
					results: { 'theme:twentytwentyfour': true },
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			// Should only include WordPress.org assets
			expect( assets.plugins ).toContain( 'akismet' );
			expect( assets.plugins ).not.toContain( 'custom-plugin' );
			expect( assets.themes ).toContain( 'twentytwentyfour' );
			expect( assets.siteName ).toBe( 'Test Site' );
		} );

		it( 'excludes built-in Playground plugins', async () => {
			apiFetch.mockClear();
			document.title = 'Test Site';

			// Assets endpoint
			apiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'aether/aether.php',
						name: 'Aether',
						version: '1.0',
						is_active: true,
					},
					{
						slug: 'sqlite-database-integration/load.php',
						name: 'SQLite',
						version: '1.0',
						is_active: true,
					},
				],
				themes: [],
			} );

			// WordPress.org checks
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					results: { 'plugin:aether': true },
				} )
				.mockResolvedValueOnce( {
					success: true,
					results: { 'plugin:sqlite-database-integration': true },
				} );

			const { result } = renderHook( () => useAssetDiscovery() );

			let assets;
			await act( async () => {
				assets = await result.current.getBlueprintAssets();
			} );

			// Built-in plugins should be excluded
			expect( assets.plugins ).not.toContain( 'aether' );
			expect( assets.plugins ).not.toContain(
				'sqlite-database-integration'
			);
		} );

		it( 'only includes active plugins', async () => {
			apiFetch.mockClear();
			document.title = 'Test Site';

			// Assets endpoint
			apiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'active-plugin/active-plugin.php',
						name: 'Active Plugin',
						version: '1.0',
						is_active: true,
					},
					{
						slug: 'inactive-plugin/inactive-plugin.php',
						name: 'Inactive Plugin',
						version: '1.0',
						is_active: false,
					},
				],
				themes: [],
			} );

			// WordPress.org check (only for active plugin)
			apiFetch.mockResolvedValueOnce( {
				success: true,
				results: { 'plugin:active-plugin': true },
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
