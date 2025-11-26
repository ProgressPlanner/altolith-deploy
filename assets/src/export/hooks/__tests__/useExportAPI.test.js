/**
 * useExportAPI Hook Tests
 *
 * Tests for the useExportAPI hook that handles API calls for export operations.
 */

import { renderHook } from '@testing-library/react';
import { useExportAPI } from '../useExportAPI';

// Mock WordPress element
jest.mock( '@wordpress/element', () => ( {
	useCallback: ( fn ) => fn,
	useMemo: ( fn ) => fn(),
} ) );

// Mock API fetch
jest.mock( '@aether/utils/api', () => jest.fn() );

// Mock asset discovery
jest.mock( '@aether/utils/useAssetDiscovery', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Mock storage
jest.mock( '@aether/utils/storage', () => ( {
	storage: {
		get: jest.fn(),
		set: jest.fn(),
	},
} ) );

// Mock ExportAPIService
jest.mock( '@aether/services/ExportAPIService', () => ( {
	ExportAPIService: jest.fn().mockImplementation( () => ( {
		discoverBlueprintBundleAssets: jest.fn(),
		markAssetChanged: jest.fn(),
		discoverUrls: jest.fn(),
		createArchive: jest.fn(),
		generateBlueprint: jest.fn(),
		createBlueprintBundle: jest.fn(),
	} ) ),
} ) );

import apiFetch from '@aether/utils/api';
import useAssetDiscovery from '@aether/utils/useAssetDiscovery';
import { storage } from '@aether/utils/storage';
import { ExportAPIService } from '@aether/services/ExportAPIService';

describe( 'useExportAPI', () => {
	let mockServiceInstance;

	beforeEach( () => {
		jest.clearAllMocks();

		// Setup mock asset discovery
		useAssetDiscovery.mockReturnValue( {
			discoverCustomAssets: jest.fn(),
		} );

		// Get reference to mock service instance
		mockServiceInstance = {
			discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
				success: true,
				assets: [],
				count: 0,
			} ),
			markAssetChanged: jest.fn().mockReturnValue( {
				success: true,
				message: 'Asset marked as changed',
			} ),
			discoverUrls: jest.fn().mockResolvedValue( {
				success: true,
				urls: [],
			} ),
			createArchive: jest.fn().mockResolvedValue( {
				success: true,
				zipPath: '/path/to/archive.zip',
			} ),
			generateBlueprint: jest.fn().mockResolvedValue( {
				success: false,
				message: 'Blueprint generation must be done client-side',
			} ),
			createBlueprintBundle: jest.fn().mockResolvedValue( {
				success: true,
				bundlePath: '/path/to/bundle.zip',
			} ),
		};

		ExportAPIService.mockImplementation( () => mockServiceInstance );
	} );

	describe( 'Hook Initialization', () => {
		test( 'should create ExportAPIService with dependencies', () => {
			renderHook( () => useExportAPI() );

			expect( ExportAPIService ).toHaveBeenCalledWith(
				apiFetch,
				expect.any( Object ),
				storage
			);
		} );

		test( 'should return all API methods', () => {
			const { result } = renderHook( () => useExportAPI() );

			expect( result.current ).toHaveProperty(
				'discoverBlueprintBundleAssets'
			);
			expect( result.current ).toHaveProperty( 'getAssetStatus' );
			expect( result.current ).toHaveProperty( 'markAssetChanged' );
			expect( result.current ).toHaveProperty( 'discoverUrls' );
			expect( result.current ).toHaveProperty( 'createArchive' );
			expect( result.current ).toHaveProperty( 'generateBlueprint' );
			expect( result.current ).toHaveProperty( 'createBlueprintBundle' );
		} );
	} );

	describe( 'discoverBlueprintBundleAssets', () => {
		test( 'should call service.discoverBlueprintBundleAssets', async () => {
			const { result } = renderHook( () => useExportAPI() );

			await result.current.discoverBlueprintBundleAssets();

			expect(
				mockServiceInstance.discoverBlueprintBundleAssets
			).toHaveBeenCalled();
		} );

		test( 'should return service response', async () => {
			mockServiceInstance.discoverBlueprintBundleAssets.mockResolvedValue(
				{
					success: true,
					assets: [ { slug: 'test-plugin' } ],
					count: 1,
				}
			);

			const { result } = renderHook( () => useExportAPI() );
			const response =
				await result.current.discoverBlueprintBundleAssets();

			expect( response.success ).toBe( true );
			expect( response.count ).toBe( 1 );
		} );
	} );

	describe( 'getAssetStatus', () => {
		test( 'should be an alias for discoverBlueprintBundleAssets', async () => {
			const { result } = renderHook( () => useExportAPI() );

			await result.current.getAssetStatus();

			expect(
				mockServiceInstance.discoverBlueprintBundleAssets
			).toHaveBeenCalled();
		} );
	} );

	describe( 'markAssetChanged', () => {
		test( 'should call service.markAssetChanged with type and slug', async () => {
			const { result } = renderHook( () => useExportAPI() );

			await result.current.markAssetChanged( 'plugin', 'my-plugin' );

			expect( mockServiceInstance.markAssetChanged ).toHaveBeenCalledWith(
				'plugin',
				'my-plugin'
			);
		} );

		test( 'should return promise that resolves to service result', async () => {
			mockServiceInstance.markAssetChanged.mockReturnValue( {
				success: true,
				message: 'Marked plugin my-plugin as changed',
			} );

			const { result } = renderHook( () => useExportAPI() );
			const response = await result.current.markAssetChanged(
				'plugin',
				'my-plugin'
			);

			expect( response.success ).toBe( true );
		} );
	} );

	describe( 'discoverUrls', () => {
		test( 'should call service.discoverUrls', async () => {
			const { result } = renderHook( () => useExportAPI() );

			await result.current.discoverUrls();

			expect( mockServiceInstance.discoverUrls ).toHaveBeenCalled();
		} );

		test( 'should return discovered URLs', async () => {
			mockServiceInstance.discoverUrls.mockResolvedValue( {
				success: true,
				urls: [ 'https://example.com/', 'https://example.com/about/' ],
			} );

			const { result } = renderHook( () => useExportAPI() );
			const response = await result.current.discoverUrls();

			expect( response.success ).toBe( true );
			expect( response.urls ).toHaveLength( 2 );
		} );
	} );

	describe( 'createArchive', () => {
		test( 'should call service.createArchive with options', async () => {
			const { result } = renderHook( () => useExportAPI() );
			const options = { assets: [], includeUploads: true };

			await result.current.createArchive( options );

			expect( mockServiceInstance.createArchive ).toHaveBeenCalledWith(
				options
			);
		} );

		test( 'should return archive result', async () => {
			mockServiceInstance.createArchive.mockResolvedValue( {
				success: true,
				zipPath: '/path/to/wp-content.zip',
				zipSize: 1024000,
			} );

			const { result } = renderHook( () => useExportAPI() );
			const response = await result.current.createArchive( {} );

			expect( response.success ).toBe( true );
			expect( response.zipPath ).toBe( '/path/to/wp-content.zip' );
		} );
	} );

	describe( 'generateBlueprint', () => {
		test( 'should call service.generateBlueprint with options', async () => {
			const { result } = renderHook( () => useExportAPI() );
			const options = { archivePath: '/path/to/archive.zip' };

			await result.current.generateBlueprint( options );

			expect(
				mockServiceInstance.generateBlueprint
			).toHaveBeenCalledWith( options );
		} );
	} );

	describe( 'createBlueprintBundle', () => {
		test( 'should call service.createBlueprintBundle with options', async () => {
			const { result } = renderHook( () => useExportAPI() );
			const options = {
				blueprint: { steps: [] },
				wpContentZipPath: '/path/to/wp-content.zip',
			};

			await result.current.createBlueprintBundle( options );

			expect(
				mockServiceInstance.createBlueprintBundle
			).toHaveBeenCalledWith( options );
		} );

		test( 'should return bundle result', async () => {
			mockServiceInstance.createBlueprintBundle.mockResolvedValue( {
				success: true,
				bundlePath: '/path/to/bundle.zip',
				bundleUrl: 'https://example.com/bundle.zip',
				bundleSize: 2048000,
			} );

			const { result } = renderHook( () => useExportAPI() );
			const response = await result.current.createBlueprintBundle( {
				blueprint: { steps: [] },
				wpContentZipPath: '/path/to/archive.zip',
			} );

			expect( response.success ).toBe( true );
			expect( response.bundlePath ).toBe( '/path/to/bundle.zip' );
		} );
	} );
} );
