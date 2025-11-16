/**
 * Offload Media Step Tests
 *
 * Tests validate INTENDED behavior and catch potential bugs.
 *
 * @package
 */

import { offloadMediaHandler } from '../offloadMediaStep';

describe( 'offloadMediaStep', () => {
	describe( 'offloadMediaHandler', () => {
		test( 'INTENDED: offloads media successfully with progress tracking', async () => {
			const mockMediaOffload = {
				offloadMedia: jest.fn().mockResolvedValue( {
					success: true,
					uploaded: 5,
					skipped: 3,
				} ),
			};

			const mockSetStatusMessage = jest.fn();
			const mockRemoveMessage = jest.fn();

			const context = {
				mediaOffload: mockMediaOffload,
				providerId: 'cloudflare-r2',
				siteKey: 'test-site-key',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: mockRemoveMessage,
			};

			const result = await offloadMediaHandler( context );

			// INTENDED: mediaOffload called with correct parameters
			expect( mockMediaOffload.offloadMedia ).toHaveBeenCalledWith(
				'cloudflare-r2',
				'test-site-key',
				mockSetStatusMessage,
				mockRemoveMessage
			);

			// INTENDED: Status messages set correctly
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Offloading media to R2…',
				'progress',
				'offloadMedia'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Media offloaded: 5 uploaded, 3 skipped',
				'success',
				'offloadMedia'
			);

			// INTENDED: Returns upload statistics
			expect( result ).toEqual( {
				mediaOffloaded: true,
				mediaOffloadStats: {
					uploaded: 5,
					skipped: 3,
				},
			} );
		} );

		test( 'INTENDED: throws error if siteKey missing', async () => {
			// BUG DETECTION: Missing siteKey should fail fast
			const context = {
				mediaOffload: {},
				providerId: 'cloudflare-r2',
				siteKey: '', // Empty site key
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await expect( offloadMediaHandler( context ) ).rejects.toThrow(
				'Site key is required for media offload'
			);
		} );

		test( 'INTENDED: throws error if siteKey is null', async () => {
			// BUG DETECTION: Null siteKey should fail
			const context = {
				mediaOffload: {},
				providerId: 'cloudflare-r2',
				siteKey: null,
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await expect( offloadMediaHandler( context ) ).rejects.toThrow(
				'Site key is required for media offload'
			);
		} );

		test( 'INTENDED: throws error if offload fails', async () => {
			// BUG DETECTION: Failed offload should propagate error
			const mockMediaOffload = {
				offloadMedia: jest.fn().mockResolvedValue( {
					success: false,
				} ),
			};

			const context = {
				mediaOffload: mockMediaOffload,
				providerId: 'cloudflare-r2',
				siteKey: 'test-site-key',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await expect( offloadMediaHandler( context ) ).rejects.toThrow(
				'Media offload failed'
			);
		} );

		test( 'INTENDED: handles zero files uploaded and skipped', async () => {
			// BUG DETECTION: Zero stats should work correctly
			const mockMediaOffload = {
				offloadMedia: jest.fn().mockResolvedValue( {
					success: true,
					uploaded: 0,
					skipped: 0,
				} ),
			};

			const mockSetStatusMessage = jest.fn();

			const context = {
				mediaOffload: mockMediaOffload,
				providerId: 'cloudflare-r2',
				siteKey: 'test-site-key',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: jest.fn(),
			};

			const result = await offloadMediaHandler( context );

			// INTENDED: Message shows zero counts
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Media offloaded: 0 uploaded, 0 skipped',
				'success',
				'offloadMedia'
			);

			// INTENDED: Returns zero stats
			expect( result.mediaOffloadStats ).toEqual( {
				uploaded: 0,
				skipped: 0,
			} );
		} );

		test( 'INTENDED: uses storage provider ID, not static site provider', async () => {
			// BUG DETECTION: Must use correct provider for media offload
			const mockMediaOffload = {
				offloadMedia: jest.fn().mockResolvedValue( {
					success: true,
					uploaded: 1,
					skipped: 0,
				} ),
			};

			const context = {
				mediaOffload: mockMediaOffload,
				providerId: 'cloudflare-r2-storage', // Storage provider
				siteKey: 'test-site-key',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await offloadMediaHandler( context );

			// INTENDED: First parameter is storage provider ID
			expect( mockMediaOffload.offloadMedia ).toHaveBeenCalledWith(
				'cloudflare-r2-storage',
				expect.any( String ),
				expect.any( Function ),
				expect.any( Function )
			);
		} );

		test( 'INTENDED: passes status message and remove message callbacks', async () => {
			// BUG DETECTION: Callbacks must be passed for progress updates
			const mockMediaOffload = {
				offloadMedia: jest.fn().mockResolvedValue( {
					success: true,
					uploaded: 1,
					skipped: 0,
				} ),
			};

			const mockSetStatusMessage = jest.fn();
			const mockRemoveMessage = jest.fn();

			const context = {
				mediaOffload: mockMediaOffload,
				providerId: 'cloudflare-r2',
				siteKey: 'test-site-key',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: mockRemoveMessage,
			};

			await offloadMediaHandler( context );

			// INTENDED: Callbacks passed as 3rd and 4th parameters
			const callArgs = mockMediaOffload.offloadMedia.mock.calls[ 0 ];
			expect( callArgs[ 2 ] ).toBe( mockSetStatusMessage );
			expect( callArgs[ 3 ] ).toBe( mockRemoveMessage );
		} );

		test( 'INTENDED: mediaOffloaded flag set to true on success', async () => {
			// BUG DETECTION: Success flag must be set for downstream steps
			const mockMediaOffload = {
				offloadMedia: jest.fn().mockResolvedValue( {
					success: true,
					uploaded: 10,
					skipped: 5,
				} ),
			};

			const context = {
				mediaOffload: mockMediaOffload,
				providerId: 'cloudflare-r2',
				siteKey: 'test-site-key',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			const result = await offloadMediaHandler( context );

			// INTENDED: mediaOffloaded flag explicitly true
			expect( result.mediaOffloaded ).toBe( true );
		} );
	} );
} );
