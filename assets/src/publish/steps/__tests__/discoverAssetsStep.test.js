/**
 * Discover Assets Step Tests
 *
 * @package
 */

import { discoverAssetsHandler } from '../discoverAssetsStep';

describe( 'discoverAssetsStep', () => {
	describe( 'discoverAssetsHandler', () => {
		test( 'discovers assets successfully', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [
						{ slug: 'custom-plugin-1', type: 'plugin' },
						{ slug: 'custom-theme-1', type: 'theme' },
					],
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			const result = await discoverAssetsHandler( context );

			// API called
			expect( mockApi.discoverAssets ).toHaveBeenCalled();

			// Status messages set
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovering plugins and themes…',
				'progress',
				'discoverAssets'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Discovered' ),
				'success',
				'discoverAssets'
			);

			// Returns discovered assets
			expect( result ).toEqual( {
				discoveredAssets: [
					{ slug: 'custom-plugin-1', type: 'plugin' },
					{ slug: 'custom-theme-1', type: 'theme' },
				],
			} );
		} );

		test( 'handles no assets found', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [],
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			const result = await discoverAssetsHandler( context );

			// Success message shows zero assets
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovered 0 active custom plugins/themes',
				'success',
				'discoverAssets'
			);

			// Returns empty array
			expect( result.discoveredAssets ).toEqual( [] );
		} );

		test( 'formats message for single plugin', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [ { slug: 'my-plugin', type: 'plugin' } ],
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			await discoverAssetsHandler( context );

			// Message shows singular form with full text
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( '1 active custom plugin (my-plugin)' ),
				'success',
				'discoverAssets'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'These will be included in the blueprint bundle' ),
				'success',
				'discoverAssets'
			);
		} );

		test( 'formats message for multiple plugins', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [
						{ slug: 'plugin-1', type: 'plugin' },
						{ slug: 'plugin-2', type: 'plugin' },
					],
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			await discoverAssetsHandler( context );

			// Message shows plural form with list and full text
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining(
					'2 active custom plugins (plugin-1, plugin-2)'
				),
				'success',
				'discoverAssets'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'These will be included in the blueprint bundle' ),
				'success',
				'discoverAssets'
			);
		} );

		test( 'formats message for single theme', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [ { slug: 'my-theme', type: 'theme' } ],
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			await discoverAssetsHandler( context );

			// Message shows singular form with full text
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( '1 active custom theme (my-theme)' ),
				'success',
				'discoverAssets'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'These will be included in the blueprint bundle' ),
				'success',
				'discoverAssets'
			);
		} );

		test( 'formats message for plugins and themes', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [
						{ slug: 'plugin-1', type: 'plugin' },
						{ slug: 'theme-1', type: 'theme' },
					],
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			await discoverAssetsHandler( context );

			// Message shows both plugins and themes
			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( 'plugin' );
			expect( successCall[ 0 ] ).toContain( 'theme' );
			expect( successCall[ 0 ] ).toContain( 'and' );
		} );

		test( 'throws error if discovery fails', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Discovery failed',
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			await expect( discoverAssetsHandler( context ) ).rejects.toThrow(
				'Discovery failed'
			);
		} );

		test( 'throws error with default message if no message provided', async () => {
			const mockApi = {
				discoverAssets: jest.fn().mockResolvedValue( {
					success: false,
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			};

			await expect( discoverAssetsHandler( context ) ).rejects.toThrow(
				'Failed to discover assets'
			);
		} );
	} );
} );
