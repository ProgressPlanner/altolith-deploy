/**
 * Asset Manager Service Tests
 *
 * Tests for AssetManagerService pure functions and asset operations.
 * Validates asset merging, normalization, and filtering logic.
 *
 */

import {
	normalizeAssetData,
	calculateNeedsUpload,
	mergeAsset,
	createAsset,
	filterChangedAssets,
	clearAllUploadFlags,
	AssetManagerService,
} from '../AssetManagerService';

describe( 'AssetManagerService', () => {
	describe( 'normalizeAssetData() - Pure Function', () => {
		test( 'should normalize snake_case existsOnR2 to camelCase', () => {
			const input = {
				slug: 'test-asset',
				type: 'theme',
				name: 'Test Asset',
				exists_on_r2: true,
			};

			const result = normalizeAssetData( input );

			expect( result ).toEqual( {
				slug: 'test-asset',
				type: 'theme',
				name: 'Test Asset',
				existsOnR2: true,
			} );
		} );

		test( 'should preserve camelCase existsOnR2', () => {
			const input = {
				slug: 'test-asset',
				type: 'theme',
				name: 'Test Asset',
				existsOnR2: true,
			};

			const result = normalizeAssetData( input );

			expect( result ).toEqual( {
				slug: 'test-asset',
				type: 'theme',
				name: 'Test Asset',
				existsOnR2: true,
			} );
		} );

		test( 'should prefer camelCase over snake_case if both present', () => {
			const input = {
				slug: 'test-asset',
				type: 'theme',
				name: 'Test Asset',
				existsOnR2: true,
				exists_on_r2: false,
			};

			const result = normalizeAssetData( input );

			expect( result.existsOnR2 ).toBe( true );
		} );

		test( 'should default existsOnR2 to false if not present', () => {
			const input = {
				slug: 'test-asset',
				type: 'theme',
				name: 'Test Asset',
			};

			const result = normalizeAssetData( input );

			expect( result.existsOnR2 ).toBe( false );
		} );

		test( 'should preserve all other fields', () => {
			const input = {
				slug: 'test-asset',
				type: 'theme',
				name: 'Test Asset',
				customField: 'custom-value',
				existsOnR2: true,
			};

			const result = normalizeAssetData( input );

			expect( result.customField ).toBe( 'custom-value' );
		} );

		test( 'should handle null/undefined input', () => {
			expect( normalizeAssetData( null ) ).toEqual( {
				existsOnR2: false,
			} );
			expect( normalizeAssetData( undefined ) ).toEqual( {
				existsOnR2: false,
			} );
		} );
	} );

	describe( 'calculateNeedsUpload() - Pure Function', () => {
		test( 'should return true when asset does not exist on R2', () => {
			expect( calculateNeedsUpload( false ) ).toBe( true );
		} );

		test( 'should return false when asset exists on R2', () => {
			expect( calculateNeedsUpload( true ) ).toBe( false );
		} );

		test( 'should handle falsy values as not existing', () => {
			expect( calculateNeedsUpload( null ) ).toBe( true );
			expect( calculateNeedsUpload( undefined ) ).toBe( true );
			expect( calculateNeedsUpload( 0 ) ).toBe( true );
			expect( calculateNeedsUpload( '' ) ).toBe( true );
		} );
	} );

	describe( 'createAsset() - Pure Function', () => {
		test( 'should create new asset with needsUpload true', () => {
			const result = createAsset( 'theme', 'test-theme' );

			expect( result ).toEqual( {
				type: 'theme',
				slug: 'test-theme',
				existsOnR2: false,
				needsUpload: true,
			} );
		} );

		test( 'should create asset with name if provided', () => {
			const result = createAsset( 'theme', 'test-theme', 'Test Theme' );

			expect( result ).toEqual( {
				type: 'theme',
				slug: 'test-theme',
				name: 'Test Theme',
				existsOnR2: false,
				needsUpload: true,
			} );
		} );

		test( 'should create asset with existsOnR2 if provided', () => {
			const result = createAsset(
				'theme',
				'test-theme',
				'Test Theme',
				true
			);

			expect( result ).toEqual( {
				type: 'theme',
				slug: 'test-theme',
				name: 'Test Theme',
				existsOnR2: true,
				needsUpload: false,
			} );
		} );

		test( 'should calculate needsUpload based on existsOnR2', () => {
			const exists = createAsset(
				'theme',
				'test-theme',
				'Test Theme',
				true
			);
			const notExists = createAsset(
				'theme',
				'test-theme',
				'Test Theme',
				false
			);

			expect( exists.needsUpload ).toBe( false );
			expect( notExists.needsUpload ).toBe( true );
		} );
	} );

	describe( 'mergeAsset() - Pure Function', () => {
		test( 'should merge new data into existing asset', () => {
			const existing = {
				type: 'theme',
				slug: 'test-theme',
				name: 'Old Name',
				needsUpload: false,
			};

			const updated = {
				name: 'New Name',
				existsOnR2: true,
			};

			const result = mergeAsset( existing, updated );

			expect( result ).toEqual( {
				type: 'theme',
				slug: 'test-theme',
				name: 'New Name',
				existsOnR2: true,
				needsUpload: false,
			} );
		} );

		test( 'should preserve needsUpload when flag is true', () => {
			const existing = {
				type: 'theme',
				slug: 'test-theme',
				needsUpload: true,
			};

			const updated = {
				existsOnR2: true,
				name: 'Test Theme',
			};

			const result = mergeAsset( existing, updated, {
				preserveNeedsUpload: true,
			} );

			expect( result.needsUpload ).toBe( true );
		} );

		test( 'should recalculate needsUpload from existsOnR2 when not preserved', () => {
			const existing = {
				type: 'theme',
				slug: 'test-theme',
				needsUpload: false,
			};

			const updated = {
				existsOnR2: false,
			};

			const result = mergeAsset( existing, updated );

			expect( result.needsUpload ).toBe( true );
		} );

		test( 'should handle null/undefined existing asset', () => {
			const updated = {
				type: 'theme',
				slug: 'test-theme',
				existsOnR2: true,
			};

			const result1 = mergeAsset( null, updated );
			const result2 = mergeAsset( undefined, updated );

			expect( result1 ).toEqual( {
				type: 'theme',
				slug: 'test-theme',
				existsOnR2: true,
				needsUpload: false,
			} );
			expect( result2 ).toEqual( result1 );
		} );

		test( 'should handle null/undefined updated data', () => {
			const existing = {
				type: 'theme',
				slug: 'test-theme',
				needsUpload: false,
			};

			const result1 = mergeAsset( existing, null );
			const result2 = mergeAsset( existing, undefined );

			expect( result1 ).toEqual( existing );
			expect( result2 ).toEqual( existing );
		} );
	} );

	describe( 'filterChangedAssets() - Pure Function', () => {
		test( 'should return array of type:slug for assets needing upload', () => {
			const assets = {
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					needsUpload: true,
				},
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: false,
				},
				'theme-2': {
					type: 'theme',
					slug: 'theme-2',
					needsUpload: true,
				},
			};

			const result = filterChangedAssets( assets );

			expect( result ).toEqual( [ 'theme:theme-1', 'theme:theme-2' ] );
		} );

		test( 'should return empty array when no assets need upload', () => {
			const assets = {
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					needsUpload: false,
				},
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: false,
				},
			};

			const result = filterChangedAssets( assets );

			expect( result ).toEqual( [] );
		} );

		test( 'should return empty array for empty assets object', () => {
			expect( filterChangedAssets( {} ) ).toEqual( [] );
		} );

		test( 'should handle null/undefined assets', () => {
			expect( filterChangedAssets( null ) ).toEqual( [] );
			expect( filterChangedAssets( undefined ) ).toEqual( [] );
		} );
	} );

	describe( 'clearAllUploadFlags() - Pure Function', () => {
		test( 'should set needsUpload to false for all assets', () => {
			const assets = {
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					needsUpload: true,
				},
				'plugin-1': {
					type: 'plugin',
					slug: 'plugin-1',
					needsUpload: true,
				},
			};

			const result = clearAllUploadFlags( assets );

			expect( result[ 'theme-1' ].needsUpload ).toBe( false );
			expect( result[ 'plugin-1' ].needsUpload ).toBe( false );
		} );

		test( 'should preserve other asset properties', () => {
			const assets = {
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					name: 'Test Theme',
					existsOnR2: true,
					needsUpload: true,
				},
			};

			const result = clearAllUploadFlags( assets );

			expect( result[ 'theme-1' ] ).toEqual( {
				type: 'theme',
				slug: 'theme-1',
				name: 'Test Theme',
				existsOnR2: true,
				needsUpload: false,
			} );
		} );

		test( 'should return new object (not mutate)', () => {
			const assets = {
				'theme-1': {
					type: 'theme',
					slug: 'theme-1',
					needsUpload: true,
				},
			};

			const result = clearAllUploadFlags( assets );

			expect( result ).not.toBe( assets );
			expect( result[ 'theme-1' ] ).not.toBe( assets[ 'theme-1' ] );
			expect( assets[ 'theme-1' ].needsUpload ).toBe( true ); // Original unchanged
		} );

		test( 'should handle empty assets object', () => {
			expect( clearAllUploadFlags( {} ) ).toEqual( {} );
		} );

		test( 'should handle null/undefined assets', () => {
			expect( clearAllUploadFlags( null ) ).toEqual( {} );
			expect( clearAllUploadFlags( undefined ) ).toEqual( {} );
		} );
	} );

	describe( 'AssetManagerService - Service Class', () => {
		let service;
		let mockStorage;

		beforeEach( () => {
			mockStorage = {
				get: jest.fn(),
				set: jest.fn(),
			};
			service = new AssetManagerService( mockStorage );
		} );

		describe( 'load()', () => {
			test( 'should load assets from storage', () => {
				const mockAssets = {
					'theme-1': { type: 'theme', slug: 'theme-1' },
				};
				mockStorage.get.mockReturnValue( mockAssets );

				const result = service.load();

				expect( mockStorage.get ).toHaveBeenCalledWith(
					'aetherAssets',
					{}
				);
				expect( result ).toEqual( mockAssets );
			} );

			test( 'should return empty object if storage is empty', () => {
				mockStorage.get.mockReturnValue( {} );

				const result = service.load();

				expect( result ).toEqual( {} );
			} );
		} );

		describe( 'save()', () => {
			test( 'should save assets to storage', () => {
				const assets = {
					'theme-1': { type: 'theme', slug: 'theme-1' },
				};

				service.save( assets );

				expect( mockStorage.set ).toHaveBeenCalledWith(
					'aetherAssets',
					assets
				);
			} );
		} );

		describe( 'markAsChanged()', () => {
			test( 'should mark existing asset as needing upload', () => {
				const currentAssets = {
					'test-theme': {
						type: 'theme',
						slug: 'test-theme',
						needsUpload: false,
					},
				};

				const result = service.markAsChanged(
					currentAssets,
					'theme',
					'test-theme'
				);

				expect( result[ 'test-theme' ].needsUpload ).toBe( true );
			} );

			test( 'should create new asset if not exists', () => {
				const currentAssets = {};

				const result = service.markAsChanged(
					currentAssets,
					'theme',
					'new-theme'
				);

				expect( result[ 'new-theme' ] ).toEqual( {
					type: 'theme',
					slug: 'new-theme',
					existsOnR2: false,
					needsUpload: true,
				} );
			} );
		} );

		describe( 'updateFromServer()', () => {
			test( 'should update asset with server data', () => {
				const currentAssets = {
					'test-theme': {
						type: 'theme',
						slug: 'test-theme',
						needsUpload: true,
					},
				};

				const serverData = {
					slug: 'test-theme',
					type: 'theme',
					name: 'Test Theme',
					exists_on_r2: true,
				};

				const result = service.updateFromServer(
					currentAssets,
					serverData
				);

				expect( result[ 'test-theme' ] ).toEqual( {
					type: 'theme',
					slug: 'test-theme',
					name: 'Test Theme',
					existsOnR2: true,
					needsUpload: false,
				} );
			} );

			test( 'should create asset if not exists', () => {
				const currentAssets = {};

				const serverData = {
					slug: 'new-theme',
					type: 'theme',
					name: 'New Theme',
					existsOnR2: false,
				};

				const result = service.updateFromServer(
					currentAssets,
					serverData
				);

				expect( result[ 'new-theme' ] ).toEqual( {
					type: 'theme',
					slug: 'new-theme',
					name: 'New Theme',
					existsOnR2: false,
					needsUpload: true,
				} );
			} );
		} );

		describe( 'syncWithServer()', () => {
			test( 'should sync multiple assets from server', () => {
				const currentAssets = {
					'theme-1': {
						type: 'theme',
						slug: 'theme-1',
						needsUpload: true,
					},
				};

				const serverAssets = [
					{
						slug: 'theme-1',
						type: 'theme',
						name: 'Theme 1',
						exists_on_r2: true,
					},
					{
						slug: 'theme-2',
						type: 'theme',
						name: 'Theme 2',
						existsOnR2: false,
					},
				];

				const result = service.syncWithServer(
					currentAssets,
					serverAssets
				);

				expect( result[ 'theme-1' ] ).toEqual( {
					type: 'theme',
					slug: 'theme-1',
					name: 'Theme 1',
					existsOnR2: true,
					needsUpload: true, // Preserved
				} );
				expect( result[ 'theme-2' ] ).toEqual( {
					type: 'theme',
					slug: 'theme-2',
					name: 'Theme 2',
					existsOnR2: false,
					needsUpload: true,
				} );
			} );

			test( 'should handle non-array input', () => {
				const currentAssets = { 'theme-1': { slug: 'theme-1' } };

				const result1 = service.syncWithServer( currentAssets, null );
				const result2 = service.syncWithServer(
					currentAssets,
					undefined
				);
				const result3 = service.syncWithServer(
					currentAssets,
					'invalid'
				);

				expect( result1 ).toEqual( currentAssets );
				expect( result2 ).toEqual( currentAssets );
				expect( result3 ).toEqual( currentAssets );
			} );
		} );
	} );
} );
