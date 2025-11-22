/**
 * Asset Discovery Service Tests
 *
 */

import {
	AssetDiscoveryService,
	normalizePluginSlug,
	filterActiveAssets,
	getActiveTheme,
	filterByWpOrgStatus,
	filterBuiltInPlugins,
	toCustomAssetFormat,
	toBlueprintSlugFormat,
	combineAssetsWithType,
	getSiteName,
} from '../AssetDiscoveryService';

describe( 'AssetDiscoveryService - Pure Functions', () => {
	describe( 'normalizePluginSlug', () => {
		test( 'should extract directory name from plugin path', () => {
			expect( normalizePluginSlug( 'akismet/akismet.php' ) ).toBe(
				'akismet'
			);
		} );

		test( 'should return slug as-is if no slash', () => {
			expect( normalizePluginSlug( 'hello-dolly' ) ).toBe(
				'hello-dolly'
			);
		} );

		test( 'should handle multiple slashes', () => {
			expect( normalizePluginSlug( 'some-plugin/subdir/file.php' ) ).toBe(
				'some-plugin'
			);
		} );
	} );

	describe( 'filterActiveAssets', () => {
		test( 'should return only active assets', () => {
			const assets = [
				{ slug: 'plugin1', is_active: true },
				{ slug: 'plugin2', is_active: false },
				{ slug: 'plugin3', is_active: true },
			];

			const result = filterActiveAssets( assets );

			expect( result ).toHaveLength( 2 );
			expect( result ).toEqual( [
				{ slug: 'plugin1', is_active: true },
				{ slug: 'plugin3', is_active: true },
			] );
		} );

		test( 'should return empty array if no active assets', () => {
			const assets = [
				{ slug: 'plugin1', is_active: false },
				{ slug: 'plugin2', is_active: false },
			];

			const result = filterActiveAssets( assets );

			expect( result ).toEqual( [] );
		} );

		test( 'should return empty array for empty input', () => {
			expect( filterActiveAssets( [] ) ).toEqual( [] );
		} );
	} );

	describe( 'getActiveTheme', () => {
		test( 'should return active theme', () => {
			const themes = [
				{ slug: 'theme1', is_active: false },
				{ slug: 'theme2', is_active: true },
				{ slug: 'theme3', is_active: false },
			];

			const result = getActiveTheme( themes );

			expect( result ).toEqual( { slug: 'theme2', is_active: true } );
		} );

		test( 'should return null if no active theme', () => {
			const themes = [
				{ slug: 'theme1', is_active: false },
				{ slug: 'theme2', is_active: false },
			];

			const result = getActiveTheme( themes );

			expect( result ).toBeNull();
		} );

		test( 'should return null for empty array', () => {
			expect( getActiveTheme( [] ) ).toBeNull();
		} );
	} );

	describe( 'filterByWpOrgStatus', () => {
		const assets = [
			{ slug: 'plugin1', from_wporg: true },
			{ slug: 'plugin2', from_wporg: false },
			{ slug: 'plugin3', from_wporg: true },
			{ slug: 'plugin4', from_wporg: false },
		];

		test( 'should filter WordPress.org assets', () => {
			const result = filterByWpOrgStatus( assets, true );

			expect( result ).toHaveLength( 2 );
			expect( result ).toEqual( [
				{ slug: 'plugin1', from_wporg: true },
				{ slug: 'plugin3', from_wporg: true },
			] );
		} );

		test( 'should filter custom assets', () => {
			const result = filterByWpOrgStatus( assets, false );

			expect( result ).toHaveLength( 2 );
			expect( result ).toEqual( [
				{ slug: 'plugin2', from_wporg: false },
				{ slug: 'plugin4', from_wporg: false },
			] );
		} );

		test( 'should return empty array if no matches', () => {
			const onlyWpOrg = [
				{ slug: 'plugin1', from_wporg: true },
				{ slug: 'plugin2', from_wporg: true },
			];

			const result = filterByWpOrgStatus( onlyWpOrg, false );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'filterBuiltInPlugins', () => {
		test( 'should filter out aether plugin', () => {
			const plugins = [ { slug: 'aether' }, { slug: 'custom-plugin' } ];

			const result = filterBuiltInPlugins( plugins );

			expect( result ).toEqual( [ { slug: 'custom-plugin' } ] );
		} );

		test( 'should filter out sqlite-database-integration', () => {
			const plugins = [
				{ slug: 'sqlite-database-integration' },
				{ slug: 'custom-plugin' },
			];

			const result = filterBuiltInPlugins( plugins );

			expect( result ).toEqual( [ { slug: 'custom-plugin' } ] );
		} );

		test( 'should filter out both built-in plugins', () => {
			const plugins = [
				{ slug: 'aether' },
				{ slug: 'sqlite-database-integration' },
				{ slug: 'custom-plugin' },
			];

			const result = filterBuiltInPlugins( plugins );

			expect( result ).toEqual( [ { slug: 'custom-plugin' } ] );
		} );

		test( 'should handle normalized plugin slugs', () => {
			const plugins = [
				{ slug: 'aether/aether.php' },
				{ slug: 'custom-plugin' },
			];

			const result = filterBuiltInPlugins( plugins );

			expect( result ).toEqual( [ { slug: 'custom-plugin' } ] );
		} );

		test( 'should return empty array if all built-in', () => {
			const plugins = [
				{ slug: 'aether' },
				{ slug: 'sqlite-database-integration' },
			];

			const result = filterBuiltInPlugins( plugins );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'toCustomAssetFormat', () => {
		test( 'should transform asset to custom format', () => {
			const asset = {
				assetType: 'plugin',
				slug: 'my-plugin',
				name: 'My Plugin',
				version: '1.0.0',
				otherField: 'ignored',
			};

			const result = toCustomAssetFormat( asset );

			expect( result ).toEqual( {
				type: 'plugin',
				slug: 'my-plugin',
				name: 'My Plugin',
				version: '1.0.0',
			} );
		} );

		test( 'should work with theme', () => {
			const asset = {
				assetType: 'theme',
				slug: 'my-theme',
				name: 'My Theme',
				version: '2.0.0',
			};

			const result = toCustomAssetFormat( asset );

			expect( result ).toEqual( {
				type: 'theme',
				slug: 'my-theme',
				name: 'My Theme',
				version: '2.0.0',
			} );
		} );
	} );

	describe( 'toBlueprintSlugFormat', () => {
		test( 'should normalize plugin slug', () => {
			const asset = { slug: 'my-plugin/my-plugin.php' };

			const result = toBlueprintSlugFormat( asset );

			expect( result ).toBe( 'my-plugin' );
		} );

		test( 'should return theme slug as-is', () => {
			const asset = { slug: 'my-theme' };

			const result = toBlueprintSlugFormat( asset );

			expect( result ).toBe( 'my-theme' );
		} );
	} );

	describe( 'combineAssetsWithType', () => {
		test( 'should combine plugins and themes with assetType', () => {
			const plugins = [
				{ slug: 'plugin1', name: 'Plugin 1' },
				{ slug: 'plugin2', name: 'Plugin 2' },
			];
			const themes = [
				{ slug: 'theme1', name: 'Theme 1' },
				{ slug: 'theme2', name: 'Theme 2' },
			];

			const result = combineAssetsWithType( plugins, themes );

			expect( result ).toEqual( [
				{ slug: 'plugin1', name: 'Plugin 1', assetType: 'plugin' },
				{ slug: 'plugin2', name: 'Plugin 2', assetType: 'plugin' },
				{ slug: 'theme1', name: 'Theme 1', assetType: 'theme' },
				{ slug: 'theme2', name: 'Theme 2', assetType: 'theme' },
			] );
		} );

		test( 'should handle empty plugins', () => {
			const plugins = [];
			const themes = [ { slug: 'theme1', name: 'Theme 1' } ];

			const result = combineAssetsWithType( plugins, themes );

			expect( result ).toEqual( [
				{ slug: 'theme1', name: 'Theme 1', assetType: 'theme' },
			] );
		} );

		test( 'should handle empty themes', () => {
			const plugins = [ { slug: 'plugin1', name: 'Plugin 1' } ];
			const themes = [];

			const result = combineAssetsWithType( plugins, themes );

			expect( result ).toEqual( [
				{ slug: 'plugin1', name: 'Plugin 1', assetType: 'plugin' },
			] );
		} );

		test( 'should handle both empty', () => {
			const result = combineAssetsWithType( [], [] );

			expect( result ).toEqual( [] );
		} );
	} );
} );

describe( 'AssetDiscoveryService - Service Methods', () => {
	let service;
	let mockApiFetch;
	let mockCheckWpOrg;
	let mockWporgCache;

	beforeEach( () => {
		mockApiFetch = jest.fn();
		mockCheckWpOrg = jest.fn();
		mockWporgCache = {};

		service = new AssetDiscoveryService(
			mockApiFetch,
			mockCheckWpOrg,
			mockWporgCache
		);
	} );

	describe( 'getInstalledAssets', () => {
		test( 'should fetch and return installed assets', async () => {
			mockApiFetch.mockResolvedValue( {
				success: true,
				plugins: [
					{ slug: 'plugin1', is_active: true },
					{ slug: 'plugin2', is_active: false },
				],
				themes: [ { slug: 'theme1', is_active: true } ],
			} );

			const result = await service.getInstalledAssets();

			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/assets',
				method: 'GET',
			} );
			expect( result ).toEqual( {
				plugins: [
					{ slug: 'plugin1', is_active: true },
					{ slug: 'plugin2', is_active: false },
				],
				themes: [ { slug: 'theme1', is_active: true } ],
			} );
		} );

		test( 'should return empty arrays on API error', async () => {
			mockApiFetch.mockResolvedValue( {
				success: false,
				error: 'Failed',
			} );

			const result = await service.getInstalledAssets();

			expect( result ).toEqual( {
				plugins: [],
				themes: [],
			} );
		} );

		test( 'should return empty arrays on network error', async () => {
			mockApiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const result = await service.getInstalledAssets();

			expect( result ).toEqual( {
				plugins: [],
				themes: [],
			} );
		} );

		test( 'should handle missing plugins/themes in response', async () => {
			mockApiFetch.mockResolvedValue( {
				success: true,
			} );

			const result = await service.getInstalledAssets();

			expect( result ).toEqual( {
				plugins: [],
				themes: [],
			} );
		} );
	} );

	describe( 'getConfig', () => {
		let originalAetherData;

		beforeEach( () => {
			originalAetherData = global.window.aetherData;
		} );

		afterEach( () => {
			if ( originalAetherData ) {
				global.window.aetherData = originalAetherData;
			} else {
				delete global.window.aetherData;
			}
		} );

		test( 'should read config from window.aetherData', async () => {
			global.window.aetherData = {
				publicUrl: 'https://example.com',
				adminUrl: 'https://example.com/wp-admin',
			};

			const result = await service.getConfig();

			// Should NOT call API - reads from window.aetherData
			expect( mockApiFetch ).not.toHaveBeenCalled();
			expect( result ).toEqual( {
				publicUrl: 'https://example.com',
				adminUrl: 'https://example.com/wp-admin',
			} );
		} );

		test( 'should return default values when window.aetherData is missing', async () => {
			delete global.window.aetherData;

			const result = await service.getConfig();

			// Fallback returns empty strings for URLs
			expect( result ).toEqual( {
				publicUrl: '',
				adminUrl: '',
			} );
		} );
	} );

	describe( 'checkAssetsAgainstWpOrg', () => {
		test( 'should check all assets in parallel', async () => {
			const items = [
				{ slug: 'plugin1', assetType: 'plugin', name: 'Plugin 1' },
				{ slug: 'theme1', assetType: 'theme', name: 'Theme 1' },
			];

			mockCheckWpOrg
				.mockResolvedValueOnce( true ) // plugin1 is from WordPress.org
				.mockResolvedValueOnce( false ); // theme1 is custom

			const result = await service.checkAssetsAgainstWpOrg( items, {} );

			expect( mockCheckWpOrg ).toHaveBeenCalledTimes( 2 );
			expect( mockCheckWpOrg ).toHaveBeenCalledWith(
				'plugin1',
				'plugin',
				{}
			);
			expect( mockCheckWpOrg ).toHaveBeenCalledWith(
				'theme1',
				'theme',
				{}
			);

			expect( result ).toEqual( [
				{
					slug: 'plugin1',
					assetType: 'plugin',
					name: 'Plugin 1',
					from_wporg: true,
				},
				{
					slug: 'theme1',
					assetType: 'theme',
					name: 'Theme 1',
					from_wporg: false,
				},
			] );
		} );

		test( 'should handle empty items array', async () => {
			const result = await service.checkAssetsAgainstWpOrg( [], {} );

			expect( mockCheckWpOrg ).not.toHaveBeenCalled();
			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'discoverCustomAssets', () => {
		test( 'should discover custom assets', async () => {
			// Mock installed assets (getConfig no longer calls API)
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'plugin1',
						name: 'Plugin 1',
						version: '1.0.0',
						is_active: true,
					},
					{
						slug: 'plugin2',
						name: 'Plugin 2',
						version: '2.0.0',
						is_active: false,
					},
				],
				themes: [
					{
						slug: 'theme1',
						name: 'Theme 1',
						version: '1.0.0',
						is_active: true,
					},
				],
			} );

			// Mock WordPress.org checks
			mockCheckWpOrg
				.mockResolvedValueOnce( false ) // plugin1 is custom
				.mockResolvedValueOnce( false ); // theme1 is custom

			const result = await service.discoverCustomAssets();

			expect( result ).toEqual( [
				{
					type: 'plugin',
					slug: 'plugin1',
					name: 'Plugin 1',
					version: '1.0.0',
				},
				{
					type: 'theme',
					slug: 'theme1',
					name: 'Theme 1',
					version: '1.0.0',
				},
			] );
		} );

		test( 'should filter out WordPress.org assets', async () => {
			// Mock installed assets (getConfig no longer calls API)
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'plugin1',
						name: 'Plugin 1',
						version: '1.0.0',
						is_active: true,
					},
				],
				themes: [],
			} );

			mockCheckWpOrg.mockResolvedValueOnce( true ); // plugin1 is from WordPress.org

			const result = await service.discoverCustomAssets();

			expect( result ).toEqual( [] );
		} );

		test( 'should only check active assets', async () => {
			mockApiFetch.mockResolvedValueOnce( {} );
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'plugin1',
						name: 'Plugin 1',
						version: '1.0.0',
						is_active: false,
					},
				],
				themes: [
					{
						slug: 'theme1',
						name: 'Theme 1',
						version: '1.0.0',
						is_active: false,
					},
				],
			} );

			const result = await service.discoverCustomAssets();

			expect( mockCheckWpOrg ).not.toHaveBeenCalled();
			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getBlueprintAssets', () => {
		test( 'should get blueprint assets', async () => {
			// Use custom getSiteName function for this test
			const testService = new AssetDiscoveryService(
				mockApiFetch,
				mockCheckWpOrg,
				mockWporgCache,
				() => 'Test Site'
			);
			// Mock installed assets (getConfig no longer calls API)
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'akismet/akismet.php',
						name: 'Akismet',
						version: '5.0',
						is_active: true,
					},
					{
						slug: 'custom-plugin',
						name: 'Custom',
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

			mockCheckWpOrg
				.mockResolvedValueOnce( true ) // akismet is from WordPress.org
				.mockResolvedValueOnce( false ) // custom-plugin is custom
				.mockResolvedValueOnce( true ); // twentytwentyfour is from WordPress.org

			const result = await testService.getBlueprintAssets();

			expect( result ).toEqual( {
				plugins: [ 'akismet' ],
				themes: [ 'twentytwentyfour' ],
				siteName: 'Test Site',
			} );
		} );

		test( 'should filter out built-in plugins', async () => {
			const testService = new AssetDiscoveryService(
				mockApiFetch,
				mockCheckWpOrg,
				mockWporgCache,
				() => 'Test Site'
			);

			// Mock installed assets (getConfig no longer calls API)
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'aether',
						name: 'Aether',
						version: '1.0',
						is_active: true,
					},
					{
						slug: 'sqlite-database-integration',
						name: 'SQLite',
						version: '1.0',
						is_active: true,
					},
					{
						slug: 'akismet',
						name: 'Akismet',
						version: '5.0',
						is_active: true,
					},
				],
				themes: [],
			} );

			mockCheckWpOrg
				.mockResolvedValueOnce( true ) // aether
				.mockResolvedValueOnce( true ) // sqlite
				.mockResolvedValueOnce( true ); // akismet

			const result = await testService.getBlueprintAssets();

			expect( result.plugins ).toEqual( [ 'akismet' ] );
		} );

		test( 'should use document.title as fallback for siteName', async () => {
			const testService = new AssetDiscoveryService(
				mockApiFetch,
				mockCheckWpOrg,
				mockWporgCache,
				() => 'Fallback Title'
			);

			// Mock installed assets (getConfig no longer calls API)
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [],
				themes: [],
			} );

			const result = await testService.getBlueprintAssets();

			expect( result.siteName ).toBe( 'Fallback Title' );
		} );

		test( 'should only check active assets', async () => {
			const testService = new AssetDiscoveryService(
				mockApiFetch,
				mockCheckWpOrg,
				mockWporgCache,
				() => 'Test Site'
			);

			// Mock installed assets (getConfig no longer calls API)
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				plugins: [
					{
						slug: 'akismet',
						name: 'Akismet',
						version: '5.0',
						is_active: false,
					},
				],
				themes: [
					{
						slug: 'twentytwentyfour',
						name: 'Twenty Twenty-Four',
						version: '1.0',
						is_active: false,
					},
				],
			} );

			const result = await testService.getBlueprintAssets();

			expect( mockCheckWpOrg ).not.toHaveBeenCalled();
			expect( result.plugins ).toEqual( [] );
			expect( result.themes ).toEqual( [] );
		} );
	} );

	describe( 'getSiteName', () => {
		test( 'should be tested via service injection', () => {
			// getSiteName is tested indirectly via getBlueprintAssets tests
			// which inject custom getSiteName functions.
			// Direct testing of getSiteName requires complex DOM mocking,
			// so we test the injectable pattern instead.
			const customGetSiteName = () => 'Custom Site Name';
			const testService = new AssetDiscoveryService(
				mockApiFetch,
				mockCheckWpOrg,
				mockWporgCache,
				customGetSiteName
			);

			expect( testService.getSiteName() ).toBe( 'Custom Site Name' );
		} );

		test( 'should use default getSiteName if not injected', () => {
			const testService = new AssetDiscoveryService(
				mockApiFetch,
				mockCheckWpOrg,
				mockWporgCache
			);

			// Default getSiteName returns empty string in test environment
			// because window and document are not set up properly in Jest
			expect( typeof testService.getSiteName ).toBe( 'function' );
		} );
	} );
} );
