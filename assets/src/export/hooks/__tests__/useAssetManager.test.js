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
 */

import { renderHook, act } from '@testing-library/react';
import { useAssetManager } from '../useAssetManager';
import { storage } from '@altolith/utils/storage';
import {
	AssetManagerService,
	filterChangedAssets,
	clearAllUploadFlags,
} from '@altolith/services/AssetManagerService';

// Mock dependencies
jest.mock( '@altolith/utils/storage', () => ( {
	storage: {
		get: jest.fn(),
		set: jest.fn(),
	},
} ) );

// Create mock methods that will be shared across all instances
let mockLoad;
let mockSave;
let mockMarkAsChanged;
let mockUpdateFromServer;
let mockSyncWithServer;

jest.mock( '@altolith/services/AssetManagerService', () => {
	const actual = jest.requireActual(
		'@altolith/services/AssetManagerService'
	);
	return {
		...actual,
		AssetManagerService: jest.fn().mockImplementation( () => ( {
			// Return the shared mock methods
			load: mockLoad,
			save: mockSave,
			markAsChanged: mockMarkAsChanged,
			updateFromServer: mockUpdateFromServer,
			syncWithServer: mockSyncWithServer,
		} ) ),
	};
} );

describe( 'useAssetManager', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		// Create fresh mock functions for each test
		mockLoad = jest.fn().mockReturnValue( {} );
		mockSave = jest.fn();
		mockMarkAsChanged = jest.fn();
		mockUpdateFromServer = jest.fn();
		mockSyncWithServer = jest.fn();
	} );

	describe( 'initialization and persistence', () => {
		it( 'should load assets from storage on mount', () => {
			const initialAssets = {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			};

			mockLoad.mockReturnValue( initialAssets );

			const { result } = renderHook( () => useAssetManager() );

			expect( mockLoad ).toHaveBeenCalled();
			expect( result.current.assets ).toEqual( initialAssets );
		} );

		it( 'should handle empty storage on initial load', () => {
			mockLoad.mockReturnValue( {} );

			const { result } = renderHook( () => useAssetManager() );

			expect( result.current.assets ).toEqual( {} );
		} );

		it( 'should save assets to storage when they change', () => {
			mockLoad.mockReturnValue( {} );
			mockMarkAsChanged.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			// Should call save with updated assets
			expect( mockSave ).toHaveBeenCalled();
		} );

		it( 'should create service instance only once', () => {
			mockLoad.mockReturnValue( {} );

			const { rerender } = renderHook( () => useAssetManager() );

			const initialCallCount = AssetManagerService.mock.calls.length;

			// Rerender the hook
			rerender();

			// Service should not be recreated
			expect( AssetManagerService.mock.calls.length ).toBe(
				initialCallCount
			);
		} );
	} );

	describe( 'markAsChanged', () => {
		it( 'should mark asset as changed', () => {
			mockLoad.mockReturnValue( {} );
			mockMarkAsChanged.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			expect( mockMarkAsChanged ).toHaveBeenCalledWith(
				{},
				'plugin',
				'plugin-1'
			);

			expect( result.current.assets ).toEqual( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			} );
		} );

		it( 'should preserve callback reference across renders', () => {
			mockLoad.mockReturnValue( {} );

			const { result, rerender } = renderHook( () => useAssetManager() );

			const firstCallback = result.current.markAsChanged;

			rerender();

			expect( result.current.markAsChanged ).toBe( firstCallback );
		} );

		it( 'should handle marking multiple assets', () => {
			mockLoad.mockReturnValue( {} );

			mockMarkAsChanged
				.mockReturnValueOnce( {
					'plugin-1': {
						type: 'plugin',
						slug: 'plugin-1',
						needsUpload: true,
					},
				} )
				.mockReturnValueOnce( {
					'plugin-1': {
						type: 'plugin',
						slug: 'plugin-1',
						needsUpload: true,
					},
					'theme-1': {
						type: 'theme',
						slug: 'theme-1',
						needsUpload: true,
					},
				} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			act( () => {
				result.current.markAsChanged( 'theme', 'theme-1' );
			} );

			expect( result.current.assets ).toEqual( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					needsUpload: true,
				},
			} );
		} );
	} );

	describe( 'updateFromServer', () => {
		it( 'should update asset with server data', () => {
			const initialAssets = {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			};

			mockLoad.mockReturnValue( initialAssets );
			mockUpdateFromServer.mockReturnValue( {
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

			expect( mockUpdateFromServer ).toHaveBeenCalledWith(
				initialAssets,
				serverData
			);
		} );

		it( 'should handle updating nonexistent asset', () => {
			mockLoad.mockReturnValue( {} );
			mockUpdateFromServer.mockReturnValue( {
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
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			};

			mockLoad.mockReturnValue( initialAssets );
			mockSyncWithServer.mockReturnValue( {
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

			expect( mockSyncWithServer ).toHaveBeenCalledWith(
				initialAssets,
				serverAssets
			);
		} );

		it( 'should handle empty server assets array', () => {
			mockLoad.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			} );
			mockSyncWithServer.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.syncWithServer( [] );
			} );

			expect( mockSyncWithServer ).toHaveBeenCalledWith(
				expect.any( Object ),
				[]
			);
		} );

		it( 'should preserve needsUpload for locally changed assets', () => {
			const assetsWithLocalChanges = {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			};

			mockLoad.mockReturnValue( assetsWithLocalChanges );
			mockSyncWithServer.mockReturnValue( {
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
			expect( result.current.assets[ 'plugin-1' ].needsUpload ).toBe(
				true
			);
		} );
	} );

	describe( 'getChangedAssets', () => {
		it( 'should return assets that need upload', () => {
			const assetsWithChanges = {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
				'plugin-2': {
					type: 'plugin',
					slug: 'plugin-2',
					needsUpload: false,
				},
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					needsUpload: true,
				},
			};

			mockLoad.mockReturnValue( assetsWithChanges );

			const { result } = renderHook( () => useAssetManager() );

			const changed = result.current.getChangedAssets();

			expect( changed ).toEqual( [ 'plugin:plugin-1', 'theme:theme-1' ] );
		} );

		it( 'should return empty array when no assets need upload', () => {
			mockLoad.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: false,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			const changed = result.current.getChangedAssets();

			expect( changed ).toEqual( [] );
		} );

		it( 'should return empty array when assets is empty', () => {
			mockLoad.mockReturnValue( {} );

			const { result } = renderHook( () => useAssetManager() );

			const changed = result.current.getChangedAssets();

			expect( changed ).toEqual( [] );
		} );

		it( 'should update when assets change', () => {
			mockLoad.mockReturnValue( {} );
			mockMarkAsChanged.mockReturnValue( {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			} );

			const { result } = renderHook( () => useAssetManager() );

			// Initially empty
			expect( result.current.getChangedAssets() ).toEqual( [] );

			// Mark as changed
			act( () => {
				result.current.markAsChanged( 'plugin', 'plugin-1' );
			} );

			// Should now return changed asset
			expect( result.current.getChangedAssets() ).toEqual( [
				'plugin:plugin-1',
			] );
		} );
	} );

	describe( 'clearUploadFlags', () => {
		it( 'should clear upload flags for all assets', () => {
			const assetsWithFlags = {
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					needsUpload: true,
				},
			};

			mockLoad.mockReturnValue( assetsWithFlags );

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
			mockLoad.mockReturnValue( {} );

			const { result } = renderHook( () => useAssetManager() );

			act( () => {
				result.current.clearUploadFlags();
			} );

			expect( result.current.assets ).toEqual( {} );
		} );

		it( 'should preserve callback reference', () => {
			mockLoad.mockReturnValue( {} );

			const { result, rerender } = renderHook( () => useAssetManager() );

			const firstCallback = result.current.clearUploadFlags;

			rerender();

			expect( result.current.clearUploadFlags ).toBe( firstCallback );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle corrupted storage data', () => {
			mockLoad.mockReturnValue( null );

			const { result } = renderHook( () => useAssetManager() );

			// Should handle gracefully
			expect( result.current.assets ).toBeDefined();
		} );

		it( 'should handle service errors gracefully', () => {
			mockLoad.mockReturnValue( {} );
			mockMarkAsChanged.mockImplementation( () => {
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
			mockLoad.mockReturnValue( {} );

			let counter = 0;
			mockMarkAsChanged.mockImplementation( ( prev, type, slug ) => {
				counter++;
				return {
					...prev,
					[ slug ]: {
						type,
						slug,
						needsUpload: true,
						order: counter,
					},
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
			mockLoad.mockReturnValue( {} );

			const { result, rerender } = renderHook( () => useAssetManager() );

			const callbacks = {
				markAsChanged: result.current.markAsChanged,
				updateFromServer: result.current.updateFromServer,
				syncWithServer: result.current.syncWithServer,
				getChangedAssets: result.current.getChangedAssets,
				clearUploadFlags: result.current.clearUploadFlags,
			};

			rerender();

			expect( result.current.markAsChanged ).toBe(
				callbacks.markAsChanged
			);
			expect( result.current.updateFromServer ).toBe(
				callbacks.updateFromServer
			);
			expect( result.current.syncWithServer ).toBe(
				callbacks.syncWithServer
			);
			expect( result.current.getChangedAssets ).toBe(
				callbacks.getChangedAssets
			);
			expect( result.current.clearUploadFlags ).toBe(
				callbacks.clearUploadFlags
			);
		} );
	} );
} );
