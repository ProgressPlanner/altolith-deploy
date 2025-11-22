/**
 * Publish API Service Tests
 *
 * Tests for ExportAPIService and asset discovery operations.
 * Validates API call wrappers and storage operations.
 *
 */

import { ExportAPIService } from '../ExportAPIService';

describe( 'ExportAPIService', () => {
	let service;
	let mockApiFetch;
	let mockAssetDiscovery;
	let mockStorage;

	beforeEach( () => {
		mockApiFetch = jest.fn();
		mockAssetDiscovery = {
			discoverCustomAssets: jest.fn(),
		};
		mockStorage = {
			get: jest.fn(),
			set: jest.fn(),
		};
		service = new ExportAPIService(
			mockApiFetch,
			mockAssetDiscovery,
			mockStorage
		);
	} );

	describe( 'discoverBlueprintBundleAssets()', () => {
		test( 'should discover assets and return success response', async () => {
			const mockAssets = [
				{ type: 'theme', slug: 'theme-1' },
				{ type: 'plugin', slug: 'plugin-1' },
			];

			mockAssetDiscovery.discoverCustomAssets.mockResolvedValue(
				mockAssets
			);

			const result = await service.discoverBlueprintBundleAssets();

			expect(
				mockAssetDiscovery.discoverCustomAssets
			).toHaveBeenCalled();
			expect( result ).toEqual( {
				success: true,
				assets: mockAssets,
				count: 2,
			} );
		} );

		test( 'should handle empty asset discovery', async () => {
			mockAssetDiscovery.discoverCustomAssets.mockResolvedValue( [] );

			const result = await service.discoverBlueprintBundleAssets();

			expect( result ).toEqual( {
				success: true,
				assets: [],
				count: 0,
			} );
		} );

		test( 'should propagate errors from asset discovery', async () => {
			const error = new Error( 'Discovery failed' );
			mockAssetDiscovery.discoverCustomAssets.mockRejectedValue( error );

			await expect(
				service.discoverBlueprintBundleAssets()
			).rejects.toThrow( 'Discovery failed' );
		} );
	} );

	describe( 'markAssetChanged()', () => {
		test( 'should add asset to changed assets list', () => {
			mockStorage.get.mockReturnValue( [] );

			const result = service.markAssetChanged( 'theme', 'test-theme' );

			expect( mockStorage.get ).toHaveBeenCalledWith(
				'aether_changed_assets',
				[]
			);
			expect( mockStorage.set ).toHaveBeenCalledWith(
				'aether_changed_assets',
				[ 'theme:test-theme' ]
			);
			expect( result ).toEqual( {
				success: true,
				message: 'Marked theme test-theme as changed',
			} );
		} );

		test( 'should not add duplicate assets', () => {
			mockStorage.get.mockReturnValue( [ 'theme:test-theme' ] );

			const result = service.markAssetChanged( 'theme', 'test-theme' );

			expect( mockStorage.set ).not.toHaveBeenCalled();
			expect( result ).toEqual( {
				success: true,
				message: 'Marked theme test-theme as changed',
			} );
		} );

		test( 'should append to existing changed assets', () => {
			mockStorage.get.mockReturnValue( [
				'theme:existing-theme',
				'plugin:existing-plugin',
			] );

			service.markAssetChanged( 'theme', 'new-theme' );

			expect( mockStorage.set ).toHaveBeenCalledWith(
				'aether_changed_assets',
				[
					'theme:existing-theme',
					'plugin:existing-plugin',
					'theme:new-theme',
				]
			);
		} );
	} );
} );
