/**
 * Get Static Site URLs Step Tests
 *
 * Tests validate INTENDED behavior and catch potential bugs.
 *
 * @package
 */

import { getStaticSiteUrlsHandler } from '../getStaticSiteUrlsStep';

// Mock apiFetch
jest.mock( '../../../utils/api', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

import apiFetch from '../../../utils/api';

describe( 'getStaticSiteUrlsStep', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'getStaticSiteUrlsHandler', () => {
		test( 'INTENDED: discovers URLs successfully', async () => {
			const mockUrls = [
				'https://example.com/',
				'https://example.com/about/',
				'https://example.com/blog/',
			];

			apiFetch.mockResolvedValue( {
				success: true,
				urls: mockUrls,
				staticSiteUrl: 'https://static.example.com',
			} );

			const mockSetStatusMessage = jest.fn();
			const context = { setStatusMessage: mockSetStatusMessage };

			const result = await getStaticSiteUrlsHandler( context );

			// INTENDED: Calls correct REST endpoint
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/v1/publish/steps/getStaticSiteUrls',
			} );

			// INTENDED: Status messages set
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovering URLs for static site…',
				'progress',
				'getStaticSiteUrls'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovered 3 URLs for static site',
				'success',
				'getStaticSiteUrls'
			);

			// INTENDED: Returns URLs and metadata
			expect( result ).toEqual( {
				urls: mockUrls,
				staticSiteUrl: 'https://static.example.com',
				urlsCount: 3,
			} );
		} );

		test( 'INTENDED: throws error if API response indicates failure', async () => {
			// BUG DETECTION: Failed API response should throw
			apiFetch.mockResolvedValue( {
				success: false,
				message: 'URL discovery failed',
			} );

			const context = { setStatusMessage: jest.fn() };

			await expect( getStaticSiteUrlsHandler( context ) ).rejects.toThrow(
				'URL discovery failed'
			);
		} );

		test( 'INTENDED: throws error with default message if no message provided', async () => {
			// BUG DETECTION: Missing error message should have default
			apiFetch.mockResolvedValue( {
				success: false,
			} );

			const context = { setStatusMessage: jest.fn() };

			await expect( getStaticSiteUrlsHandler( context ) ).rejects.toThrow(
				'Failed to discover URLs'
			);
		} );

		test( 'INTENDED: throws error if urls array missing', async () => {
			// BUG DETECTION: Missing URLs should fail
			apiFetch.mockResolvedValue( {
				success: true,
				// urls missing
			} );

			const context = { setStatusMessage: jest.fn() };

			await expect( getStaticSiteUrlsHandler( context ) ).rejects.toThrow(
				'Failed to discover URLs'
			);
		} );

		test( 'INTENDED: handles empty URLs array', async () => {
			// BUG DETECTION: Empty site should return empty array, not error
			apiFetch.mockResolvedValue( {
				success: true,
				urls: [],
				staticSiteUrl: null,
			} );

			const mockSetStatusMessage = jest.fn();
			const context = { setStatusMessage: mockSetStatusMessage };

			const result = await getStaticSiteUrlsHandler( context );

			// INTENDED: Success message shows zero URLs
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovered 0 URLs for static site',
				'success',
				'getStaticSiteUrls'
			);

			// INTENDED: Returns empty array
			expect( result.urls ).toEqual( [] );
			expect( result.urlsCount ).toBe( 0 );
		} );

		test( 'INTENDED: handles missing staticSiteUrl', async () => {
			// BUG DETECTION: staticSiteUrl is optional
			apiFetch.mockResolvedValue( {
				success: true,
				urls: [ 'https://example.com/' ],
				// staticSiteUrl missing
			} );

			const context = { setStatusMessage: jest.fn() };

			const result = await getStaticSiteUrlsHandler( context );

			// INTENDED: staticSiteUrl defaults to null
			expect( result.staticSiteUrl ).toBeNull();
		} );

		test( 'INTENDED: counts URLs correctly', async () => {
			// BUG DETECTION: urlsCount must match urls.length
			const mockUrls = new Array( 100 )
				.fill( null )
				.map( ( _, i ) => `https://example.com/page-${ i }/` );

			apiFetch.mockResolvedValue( {
				success: true,
				urls: mockUrls,
			} );

			const context = { setStatusMessage: jest.fn() };

			const result = await getStaticSiteUrlsHandler( context );

			// INTENDED: urlsCount matches array length
			expect( result.urlsCount ).toBe( 100 );
			expect( result.urls.length ).toBe( 100 );
		} );

		test( 'INTENDED: handles API network errors', async () => {
			// BUG DETECTION: Network errors should propagate
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const context = { setStatusMessage: jest.fn() };

			await expect( getStaticSiteUrlsHandler( context ) ).rejects.toThrow(
				'Network error'
			);
		} );
	} );
} );
