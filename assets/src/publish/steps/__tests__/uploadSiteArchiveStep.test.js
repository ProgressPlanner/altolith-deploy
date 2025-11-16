/**
 * Upload Site Archive Step Tests
 *
 * Tests validate INTENDED behavior and catch potential bugs.
 *
 * @package
 */

import { uploadSiteArchiveHandler } from '../uploadSiteArchiveStep';

describe( 'uploadSiteArchiveStep', () => {
	describe( 'uploadSiteArchiveHandler', () => {
		test( 'INTENDED: uploads site archive successfully', async () => {
			const mockHandleSiteArchiveUpload = jest
				.fn()
				.mockResolvedValue( undefined );

			const mockSetStatusMessage = jest.fn();

			const context = {
				handleSiteArchiveUpload: mockHandleSiteArchiveUpload,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: mockSetStatusMessage,
			};

			const result = await uploadSiteArchiveHandler( context );

			// INTENDED: handleSiteArchiveUpload called with correct parameters
			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'test-site-key',
				'cloudflare-r2'
			);

			// INTENDED: Status messages set
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Uploading site archive…',
				'progress',
				'uploadSiteArchive'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Site archive uploaded successfully',
				'success',
				'uploadSiteArchive'
			);

			// INTENDED: Returns empty object (stateless)
			expect( result ).toEqual( {} );
		} );

		test( 'INTENDED: calls status message functions in correct order', async () => {
			// BUG DETECTION: Progress message before success message
			const callOrder = [];

			const mockHandleSiteArchiveUpload = jest
				.fn()
				.mockImplementation( () => {
					callOrder.push( 'upload' );
					return Promise.resolve();
				} );

			const mockSetStatusMessage = jest
				.fn()
				.mockImplementation( ( message, type ) => {
					if ( type === 'progress' ) {
						callOrder.push( 'progress' );
					} else if ( type === 'success' ) {
						callOrder.push( 'success' );
					}
				} );

			const context = {
				handleSiteArchiveUpload: mockHandleSiteArchiveUpload,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: mockSetStatusMessage,
			};

			await uploadSiteArchiveHandler( context );

			// INTENDED: Progress -> Upload -> Success
			expect( callOrder ).toEqual( [ 'progress', 'upload', 'success' ] );
		} );

		test( 'INTENDED: propagates upload errors', async () => {
			// BUG DETECTION: Upload errors should propagate
			const mockHandleSiteArchiveUpload = jest
				.fn()
				.mockRejectedValue( new Error( 'Upload failed' ) );

			const context = {
				handleSiteArchiveUpload: mockHandleSiteArchiveUpload,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: jest.fn(),
			};

			await expect( uploadSiteArchiveHandler( context ) ).rejects.toThrow(
				'Upload failed'
			);
		} );

		test( 'INTENDED: passes siteKey and providerId to upload handler', async () => {
			// BUG DETECTION: All parameters must be passed in correct order
			const mockHandleSiteArchiveUpload = jest
				.fn()
				.mockResolvedValue( undefined );

			const context = {
				handleSiteArchiveUpload: mockHandleSiteArchiveUpload,
				siteKey: 'specific-site-key',
				providerId: 'specific-provider',
				setStatusMessage: jest.fn(),
			};

			await uploadSiteArchiveHandler( context );

			// INTENDED: siteKey and providerId in correct order
			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'specific-site-key',
				'specific-provider'
			);
		} );

		test( 'INTENDED: sets progress message before upload starts', async () => {
			// BUG DETECTION: User should see progress message immediately
			const callOrder = [];

			const mockHandleSiteArchiveUpload = jest
				.fn()
				.mockImplementation( () => {
					callOrder.push( 'upload' );
					return Promise.resolve();
				} );

			const mockSetStatusMessage = jest.fn().mockImplementation( () => {
				callOrder.push( 'statusMessage' );
			} );

			const context = {
				handleSiteArchiveUpload: mockHandleSiteArchiveUpload,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: mockSetStatusMessage,
			};

			await uploadSiteArchiveHandler( context );

			// INTENDED: statusMessage called before upload
			expect( callOrder[ 0 ] ).toBe( 'statusMessage' );
			expect( callOrder[ 1 ] ).toBe( 'upload' );
		} );

		test( 'INTENDED: always returns empty object on success', async () => {
			// BUG DETECTION: Stateless - no data to return
			const mockHandleSiteArchiveUpload = jest
				.fn()
				.mockResolvedValue( { unexpectedData: true } );

			const context = {
				handleSiteArchiveUpload: mockHandleSiteArchiveUpload,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: jest.fn(),
			};

			const result = await uploadSiteArchiveHandler( context );

			// INTENDED: Returns empty object regardless of upload return value
			expect( result ).toEqual( {} );
		} );
	} );
} );
