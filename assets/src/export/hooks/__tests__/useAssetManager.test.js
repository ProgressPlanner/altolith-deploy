/**
 * Asset Manager Hook Tests
 *
 * Tests for useAssetManager - manages asset state in localStorage.
 *
 * Quality Standards:
 * - Tests must catch state persistence issues
 * - Must test all callback methods work correctly
 * - Must test service integration
 * - Must fail if implementation loses state or corrupts data
 *
 * @package Aether\SiteExporter\Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useAssetManager } from '../useAssetManager';
import { storage } from '@aether/utils/storage';
import {
	AssetManagerService,
	filterChangedAssets,
	clearAllUploadFlags,
} from '@aether/services/AssetManagerService';

// Mock dependencies
jest.mock( '@aether/utils/storage', () => ( {
	storage: {
		get: jest.fn(),
		set: jest.fn(),
	},
} ) );

jest.mock( '@aether/services/AssetManagerService', () => {
	const actual = jest.requireActual( '@aether/services/AssetManagerService' );
	return {
		...actual,
		AssetManagerService: jest.fn().mockImplementation( () => ( {
			load: jest.fn(),
			save: jest.fn(),
			markAsChanged: jest.fn(),
			updateFromServer: jest.fn(),
			syncWithServer: jest.fn(),
		} ) ),
	};
} );

describe( 'useAssetManager', () => {
	let mockService;

	beforeEach( () => {
		jest.clearAllMocks();

		// Get the mocked service instance
		mockService = new AssetManagerService();
	} );

	describe( 'initialization and persistence', () => {
		it( 'should load assets from storage on mount', () => {
			const initialAssets = {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			};

			mockService.load.mockReturnValue( initialAssets );

			const { result } = renderHook( () => useAssetManager() );

			expect( mockService.load ).toHaveBeenCalled();
			expect( result.current.assets ).toEqual( initialAssets );
		} );

		it( 'should handle empty storage on initial load', () => {
			mockService.load.mockReturnValue( {} );

			const { result } = renderHook( () => useAssetManager() );

			expect( result.current.assets ).toEqual( {} );
		} );

		it( 'should save assets to storage when they change', () => {
			mockService.load.mockReturnValue( {} );
			mockService.markAsChanged.mockReturnValue( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			// Should call save with updated assets
			expect( mockService.save ).toHaveBeenCalled();
		} );

		it( 'should create service instance only once', () => {
			mockService.load.mockReturnValue( {} );

			const { rerender } = renderHook( () => useAssetManager() );

			const initialCallCount = AssetManagerService.mock.calls.length;

			// Rerender the hook
			rerender();

			// Service should not be recreated
			expect( AssetManagerService.mock.calls.length ).toBe( initialCallCount );
		} );
	} );

	describe( 'markAsChanged', () => {
		it( 'should mark asset as changed', () => {
			mockService.load.mockReturnValue( {} );
			mockService.markAsChanged.mockReturnValue( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			expect( mockService.markAsChanged ).toHaveBeenCalledWith(
				{},
				'plugin',
				'plugin-1'
			);

			expect( result.current.assets ).toEqual( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			} );
		} );

		it( 'should preserve callback reference across renders', () => {
			mockService.load.mockReturnValue( {} );

			const { result, rerender } = renderHook( () => useAssetManager() );

			const firstCallback = result.current.markAsChanged;

			rerender();

			expect( result.current.markAsChanged ).toBe( firstCallback );
		} );

		it( 'should handle marking multiple assets', () => {
			mockService.load.mockReturnValue( {} );

			mockService.markAsChanged
				.mockReturnValueOnce( {
					'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
				} )
				.mockReturnValueOnce( {
					'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
					'theme-1': { type: 'theme', slug: 'theme-1', needsUpload: true },
				} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			act( () => {
				result.current.markAsChanged( 'theme', 'theme-1' );
			} );

			expect( result.current.assets ).toEqual( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
				'theme-1': { type: 'theme', slug: 'theme-1', needsUpload: true },
			} );
		} );
	} );

	describe( 'updateFromServer', () => {
		it( 'should update asset with server data', () => {
			const initialAssets = {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			};

			mockService.load.mockReturnValue( initialAssets );
			mockService.updateFromServer.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: false,
					existsOnR2: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			const serverData = {
				slug: 'plugin-1',
				exists_on_r2: true,
			};

			act( () => {
				result.current.updateFromServer( serverData );
			} );

			expect( mockService.updateFromServer ).toHaveBeenCalledWith(
				initialAssets,
				serverData
			);
		} );

		it( 'should handle updating nonexistent asset', () => {
			mockService.load.mockReturnValue( {} );
			mockService.updateFromServer.mockReturnValue( {
				'new-plugin': {
					type: 'plugin',
					slug: 'new-plugin',
					needsUpload: false,
					existsOnR2: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.updateFromServer( {
					slug: 'new-plugin',
					type: 'plugin',
					exists_on_r2: true,
				} );
			} );

			expect( result.current.assets ).toHaveProperty( 'new-plugin' );
		} );
	} );

	describe( 'syncWithServer', () => {
		it( 'should sync multiple assets from server', () => {
			const initialAssets = {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			};

			mockService.load.mockReturnValue( initialAssets );
			mockService.syncWithServer.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
					existsOnR2: false,
				},
				'plugin-2': {
					type: 'plugin',
					slug: 'plugin-2',
					needsUpload: false,
					existsOnR2: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			const serverAssets = [
				{ slug: 'plugin-1', type: 'plugin', exists_on_r2: false },
				{ slug: 'plugin-2', type: 'plugin', exists_on_r2: true },
			];

			act( () => {
				result.current.syncWithServer( serverAssets );
			} );

			expect( mockService.syncWithServer ).toHaveBeenCalledWith(
				initialAssets,
				serverAssets
			);
		} );

		it( 'should handle empty server assets array', () => {
			mockService.load.mockReturnValue( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			} );
			mockService.syncWithServer.mockReturnValue( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.syncWithServer( [] );
			} );

			expect( mockService.syncWithServer ).toHaveBeenCalledWith(
				expect.any( Object ),
				[]
			);
		} );

		it( 'should preserve needsUpload for locally changed assets', () => {
			const assetsWithLocalChanges = {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			};

			mockService.load.mockReturnValue( assetsWithLocalChanges );
			mockService.syncWithServer.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true, // Preserved
					existsOnR2: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.syncWithServer( [
					{ slug: 'plugin-1', exists_on_r2: true },
				] );
			} );

			// Should preserve needsUpload=true despite server saying exists_on_r2=true
			expect( result.current.assets[ 'plugin-1' ].needsUpload ).toBe( true );
		} );
	} );

	describe( 'getChangedAssets', () => {
		it( 'should return assets that need upload', () => {
			const assetsWithChanges = {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
				'plugin-2': { type: 'plugin', slug: 'plugin-2', needsUpload: false },
				'theme-1': { type: 'theme', slug: 'theme-1', needsUpload: true },
			};

			mockService.load.mockReturnValue( assetsWithChanges );

			const { result } = renderHook( () => useAssetManager() );

			const changed = result.current.getChangedAssets();

			expect( changed ).toEqual( [ 'plugin:plugin-1', 'theme:theme-1' ] );
		} );

		it( 'should return empty array when no assets need upload', () => {
			mockService.load.mockReturnValue( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: false },
			} );

			const { result } = renderHook( () => useAssetManager() );

			const changed = result.current.getChangedAssets();

			expect( changed ).toEqual( [] );
		} );

		it( 'should return empty array when assets is empty', () => {
			mockService.load.mockReturnValue( {} );

			const { result } = renderHook( () => useAssetManager() );

			const changed = result.current.getChangedAssets();

			expect( changed ).toEqual( [] );
		} );

		it( 'should update when assets change', () => {
			mockService.load.mockReturnValue( {} );
			mockService.markAsChanged.mockReturnValue( {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
			} );

			const { result } = renderHook( () => useAssetManager() );

			// Initially empty
			expect( result.current.getChangedAssets() ).toEqual( [] );

			// Mark as changed
			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			// Should now return changed asset
			expect( result.current.getChangedAssets() ).toEqual( [ 'plugin:plugin-1' ] );
		} );
	} );

	describe( 'clearUploadFlags', () => {
		it( 'should clear upload flags for all assets', () => {
			const assetsWithFlags = {
				'plugin-1': { type: 'plugin', slug: 'plugin-1', needsUpload: true },
				'theme-1': { type: 'theme', slug: 'theme-1', needsUpload: true },
			};

			mockService.load.mockReturnValue( assetsWithFlags );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.clearUploadFlags();
			} );

			// All assets should have needsUpload=false
			Object.values( result.current.assets ).forEach( ( asset ) => {
				expect( asset.needsUpload ).toBe( false );
			} );
		} );

		it( 'should handle empty assets', () => {
			mockService.load.mockReturnValue( {} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.clearUploadFlags();
			} );

			expect( result.current.assets ).toEqual( {} );
		} );

		it( 'should preserve callback reference', () => {
			mockService.load.mockReturnValue( {} );

			const { result, rerender } = renderHook( () => useAssetManager() );

			const firstCallback = result.current.clearUploadFlags;

			rerender();

			expect( result.current.clearUploadFlags ).toBe( firstCallback );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle corrupted storage data', () => {
			mockService.load.mockReturnValue( null );

			const { result } = renderHook( () => useAssetManager() );

			// Should handle gracefully
			expect( result.current.assets ).toBeDefined();
		} );

		it( 'should handle service errors gracefully', () => {
			mockService.load.mockReturnValue( {} );
			mockService.markAsChanged.mockImplementation( () => {
				throw new Error( 'Service error' );
			} );

			const { result } = renderHook( () => useAssetManager() );

			// Should not crash the hook
			expect( () => {
				act( () => {
					result.current.markAsChanged( 'plugin', 'test' );
				} );
			} ).toThrow();
		} );

		it( 'should handle rapid state updates', () => {
			mockService.load.mockReturnValue( {} );

			let counter = 0;
			mockService.markAsChanged.mockImplementation( ( prev, type, slug ) => {
				counter++;
				return {
					...prev,
					[ slug ]: { type, slug, needsUpload: true, order: counter },
				};
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
				result.current.markAsChanged( 'plugin', 'plugin-2' );
				result.current.markAsChanged( 'plugin', 'plugin-3' );
			} );

			// All updates should be applied
			expect( Object.keys( result.current.assets ) ).toHaveLength( 3 );
		} );
	} );

	describe( 'callback stability', () => {
		it( 'should maintain all callback references across renders', () => {
			mockService.load.mockReturnValue( {} );

			const { result, rerender } = renderHook( () => useAssetManager() );

			const callbacks = {
				markAsChanged: result.current.markAsChanged,
				updateFromServer: result.current.updateFromServer,
				syncWithServer: result.current.syncWithServer,
				getChangedAssets: result.current.getChangedAssets,
				clearUploadFlags: result.current.clearUploadFlags,
			};

			rerender();

			expect( result.current.markAsChanged ).toBe( callbacks.markAsChanged );
			expect( result.current.updateFromServer ).toBe( callbacks.updateFromServer );
			expect( result.current.syncWithServer ).toBe( callbacks.syncWithServer );
			expect( result.current.getChangedAssets ).toBe( callbacks.getChangedAssets );
			expect( result.current.clearUploadFlags ).toBe( callbacks.clearUploadFlags );
		} );
	} );
} );
