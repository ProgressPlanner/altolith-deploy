/**
 * Create Site Archive Step Tests
 *
 * Tests validate INTENDED behavior and catch potential bugs.
 *
 * @package
 */

import { createSiteArchiveHandler } from '../createSiteArchiveStep';
import apiFetch from '../../../utils/api';

// Mock apiFetch
jest.mock( '../../../utils/api' );

describe( 'createSiteArchiveStep', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'createSiteArchiveHandler', () => {
		test( 'INTENDED: creates site archive successfully', async () => {
			// Mock successful archive creation
			apiFetch.mockResolvedValue( {
				success: true,
				data: {
					zipPath: '/path/to/wp-content.zip',
					zipSize: 1024000,
				},
				message: 'Site archive created successfully',
			} );

			const mockSetStatusMessage = jest.fn();
			const mockSetStepProgress = jest.fn();

			const context = {
				setStatusMessage: mockSetStatusMessage,
				setStepProgress: mockSetStepProgress,
			};

			const result = await createSiteArchiveHandler( context );

			// INTENDED: Calls createArchive endpoint
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/publish/createArchive',
				method: 'POST',
			} );

			// INTENDED: Progress set to 100%
			expect( mockSetStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				100
			);

			// INTENDED: Status messages set
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Zipping the wp-content.zip file',
				'progress',
				'createSiteArchive'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Zipped the wp-content.zip file',
				'success',
				'createSiteArchive'
			);

			// INTENDED: Returns response data
			expect( result ).toEqual( {
				zipPath: '/path/to/wp-content.zip',
				zipSize: 1024000,
			} );
		} );

		test( 'INTENDED: throws error if archive creation fails', async () => {
			// BUG DETECTION: Failed creation should propagate error
			apiFetch.mockResolvedValue( {
				success: false,
				message: 'Archive creation failed',
			} );

			const context = {
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await expect( createSiteArchiveHandler( context ) ).rejects.toThrow(
				'Archive creation failed'
			);
		} );

		test( 'INTENDED: throws error if API call fails', async () => {
			// BUG DETECTION: Network/API errors should propagate
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const context = {
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await expect( createSiteArchiveHandler( context ) ).rejects.toThrow(
				'Network error'
			);
		} );

		test( 'INTENDED: returns empty object if response data missing', async () => {
			// BUG DETECTION: Missing data should not crash
			apiFetch.mockResolvedValue( {
				success: true,
				// data missing
			} );

			const context = {
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await createSiteArchiveHandler( context );

			expect( result ).toEqual( {} );
		} );

		test( 'INTENDED: uses default error message if message missing', async () => {
			// BUG DETECTION: Should have fallback error message
			apiFetch.mockResolvedValue( {
				success: false,
				// message missing
			} );

			const context = {
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await expect( createSiteArchiveHandler( context ) ).rejects.toThrow(
				'Failed to create site archive'
			);
		} );

		test( 'INTENDED: sets progress before making API call', async () => {
			// BUG DETECTION: User should see progress message immediately
			const callOrder = [];

			apiFetch.mockImplementation( () => {
				callOrder.push( 'apiFetch' );
				return Promise.resolve( {
					success: true,
					data: {},
				} );
			} );

			const mockSetStatusMessage = jest.fn( () => {
				callOrder.push( 'setStatusMessage' );
			} );

			const context = {
				setStatusMessage: mockSetStatusMessage,
				setStepProgress: jest.fn(),
			};

			await createSiteArchiveHandler( context );

			// INTENDED: setStatusMessage called before apiFetch
			expect( callOrder[ 0 ] ).toBe( 'setStatusMessage' );
			expect( callOrder[ 1 ] ).toBe( 'apiFetch' );
		} );
	} );
} );
