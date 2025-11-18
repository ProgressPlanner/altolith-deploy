/**
 * Upload Static Site Files Step Tests
 *
 * Tests validate INTENDED behavior and catch potential bugs.
 *
 * @package
 */

import { uploadStaticSiteFilesHandler } from '../uploadStaticSiteFilesStep';

// Mock @wordpress/hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

describe( 'uploadStaticSiteFilesStep', () => {
	describe( 'uploadStaticSiteFilesHandler', () => {
		test( 'INTENDED: uploads static site files successfully', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				uploadedFiles: [ 'index.html', 'about.html' ],
				filesUploaded: 2,
			} );

			const mockSetStatusMessage = jest.fn();
			const mockRemoveMessage = jest.fn();

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: [
						'https://example.com/',
						'https://example.com/about/',
					],
					staticSiteUrl: 'https://static.example.com',
					blueprintData: { $schema: 'test' },
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: mockRemoveMessage,
			};

			const result = await uploadStaticSiteFilesHandler( context );

			// INTENDED: processStaticSiteUrls called with correct parameters
			// Note: URLs are filtered through applyFilters, so they may be modified
			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				expect.arrayContaining( [
					'https://example.com/',
					'https://example.com/about/',
				] ),
				'https://static.example.com',
				'local-filesystem',
				'https://example.com',
				mockSetStatusMessage,
				{ $schema: 'test' },
				mockRemoveMessage
			);

			// INTENDED: Status messages set
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Uploading static site files…',
				'progress',
				'uploadStaticSiteFiles'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Uploaded static site files (2 files)',
				'success',
				'uploadStaticSiteFiles'
			);

			// INTENDED: Returns correct format
			expect( result ).toEqual( {
				staticFiles: [ 'index.html', 'about.html' ],
				filesUploaded: 2,
			} );
		} );

		test( 'INTENDED: throws error if URLs missing from currentStatus', async () => {
			// BUG DETECTION: Missing URLs should fail
			const context = {
				processStaticSiteUrls: jest.fn(),
				currentStatus: {}, // No urls
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await expect(
				uploadStaticSiteFilesHandler( context )
			).rejects.toThrow(
				'URLs not found. Please run getStaticSiteUrls first.'
			);
		} );

		test( 'INTENDED: throws error if URLs is not an array', async () => {
			// BUG DETECTION: Invalid URLs format should fail
			const context = {
				processStaticSiteUrls: jest.fn(),
				currentStatus: {
					urls: 'not-an-array',
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await expect(
				uploadStaticSiteFilesHandler( context )
			).rejects.toThrow(
				'URLs not found. Please run getStaticSiteUrls first.'
			);
		} );

		test( 'INTENDED: handles empty URLs array', async () => {
			// BUG DETECTION: Empty URLs should work, not error
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				uploadedFiles: [],
				filesUploaded: 0,
			} );

			const mockSetStatusMessage = jest.fn();

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: [],
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: jest.fn(),
			};

			const result = await uploadStaticSiteFilesHandler( context );

			// INTENDED: Success message shows zero files
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Uploaded static site files (0 files)',
				'success',
				'uploadStaticSiteFiles'
			);

			// INTENDED: Returns zero counts
			expect( result.filesUploaded ).toBe( 0 );
			expect( result.staticFiles ).toEqual( [] );
		} );

		test( 'INTENDED: handles missing staticSiteUrl', async () => {
			// BUG DETECTION: staticSiteUrl is optional, should default to null
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				uploadedFiles: [ 'index.html' ],
				filesUploaded: 1,
			} );

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: [ 'https://example.com/' ],
					// staticSiteUrl missing
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await uploadStaticSiteFilesHandler( context );

			// INTENDED: Second parameter is null
			const callArgs = mockProcessStaticSiteUrls.mock.calls[ 0 ];
			expect( callArgs[ 1 ] ).toBeNull();
		} );

		test( 'INTENDED: passes all parameters to processStaticSiteUrls', async () => {
			// BUG DETECTION: All 8 parameters must be passed correctly
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				uploadedFiles: [],
				filesUploaded: 0,
			} );

			const mockSetStatusMessage = jest.fn();
			const mockRemoveMessage = jest.fn();
			const mockBlueprint = { $schema: 'test', steps: [] };

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: [ 'https://example.com/' ],
					staticSiteUrl: 'https://static.example.com',
					blueprintData: mockBlueprint,
				},
				siteUrl: 'https://unique-site.com',
				providerId: 'specific-provider',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: mockRemoveMessage,
			};

			await uploadStaticSiteFilesHandler( context );

			// INTENDED: All parameters in correct order
			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				[ 'https://example.com/' ], // urls
				'https://static.example.com', // staticSiteUrl
				'specific-provider', // providerId
				'https://unique-site.com', // siteUrl
				mockSetStatusMessage, // setStatusMessage
				mockBlueprint, // blueprintData
				mockRemoveMessage // removeMessage
			);
		} );

		test( 'INTENDED: handles missing uploadedFiles in result', async () => {
			// BUG DETECTION: Result may not include uploadedFiles array
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				filesUploaded: 5,
				// uploadedFiles missing
			} );

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: [ 'https://example.com/' ],
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			const result = await uploadStaticSiteFilesHandler( context );

			// INTENDED: Defaults to empty array
			expect( result.staticFiles ).toEqual( [] );
			expect( result.filesUploaded ).toBe( 5 );
		} );

		test( 'INTENDED: handles missing filesUploaded in result', async () => {
			// BUG DETECTION: Result may not include filesUploaded count
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				uploadedFiles: [ 'index.html' ],
				// filesUploaded missing
			} );

			const mockSetStatusMessage = jest.fn();

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: [ 'https://example.com/' ],
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: jest.fn(),
			};

			const result = await uploadStaticSiteFilesHandler( context );

			// INTENDED: Defaults to 0
			expect( result.filesUploaded ).toBe( 0 );

			// INTENDED: Success message shows 0
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Uploaded static site files (0 files)',
				'success',
				'uploadStaticSiteFiles'
			);
		} );

		test( 'INTENDED: propagates errors from processStaticSiteUrls', async () => {
			// BUG DETECTION: Upload errors should propagate
			const mockProcessStaticSiteUrls = jest
				.fn()
				.mockRejectedValue( new Error( 'Upload failed' ) );

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: [ 'https://example.com/' ],
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: jest.fn(),
				removeMessage: jest.fn(),
			};

			await expect(
				uploadStaticSiteFilesHandler( context )
			).rejects.toThrow( 'Upload failed' );
		} );

		test( 'INTENDED: handles large number of files', async () => {
			// BUG DETECTION: Large file counts should work
			const mockFiles = new Array( 500 )
				.fill( null )
				.map( ( _, i ) => `page-${ i }.html` );
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				uploadedFiles: mockFiles,
				filesUploaded: 500,
			} );

			const mockSetStatusMessage = jest.fn();

			const context = {
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				currentStatus: {
					urls: mockFiles.map(
						( f ) => `https://example.com/${ f }`
					),
				},
				siteUrl: 'https://example.com',
				providerId: 'local-filesystem',
				setStatusMessage: mockSetStatusMessage,
				removeMessage: jest.fn(),
			};

			const result = await uploadStaticSiteFilesHandler( context );

			// INTENDED: Success message shows correct count
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Uploaded static site files (500 files)',
				'success',
				'uploadStaticSiteFiles'
			);

			// INTENDED: Result has all files
			expect( result.filesUploaded ).toBe( 500 );
			expect( result.staticFiles.length ).toBe( 500 );
		} );
	} );
} );
