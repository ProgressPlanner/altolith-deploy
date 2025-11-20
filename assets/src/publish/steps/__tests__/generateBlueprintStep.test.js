/**
 * Generate Blueprint Step Tests
 *
 * Tests validate INTENDED behavior and catch potential bugs.
 *
 * @package
 */

import { handler as generateBlueprintHandler } from '../../jobs/buildBlueprintBundle/phases/generate/steps/generateBlueprint';
import apiFetch from '../../../utils/api';

// Mock apiFetch
jest.mock( '../../../utils/api' );

describe( 'generateBlueprintStep', () => {
	describe( 'generateBlueprintHandler', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'INTENDED: generates blueprint successfully', async () => {
			const mockBlueprint = {
				$schema:
					'https://playground.wordpress.net/blueprint-schema.json',
				landingPage: '/wp-login.php',
				steps: [],
			};

			const mockArchiveData = {
				zipPath: '/path/to/archive.zip',
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
			};

			const mockBlueprintBundle = {
				success: true,
				data: {
					bundlePath: '/path/to/blueprint-bundle.zip',
					fileName: 'blueprint-bundle.zip',
				},
			};

			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprint );
			const mockSetStatusMessage = jest.fn();

			// Mock apiFetch response
			apiFetch.mockResolvedValue( mockBlueprintBundle );

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipPath: mockArchiveData.zipPath,
				zipUrl: mockArchiveData.zipUrl,
				zipSize: mockArchiveData.zipSize,
			};

			const result = await generateBlueprintHandler( context );

			// INTENDED: Blueprint generator called without providerId
			expect( mockGenerateBlueprintJson ).toHaveBeenCalledWith(
				mockSetStatusMessage
			);

			// INTENDED: Status messages set
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Generating the blueprint file',
				'progress',
				'generateBlueprint'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Creating blueprint bundle',
				'progress',
				'generateBlueprint'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Generated the blueprint bundle',
				'success',
				'generateBlueprint'
			);

			// INTENDED: REST endpoint called with correct data
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/publish/generateBlueprintBundle',
				method: 'POST',
				data: {
					blueprintData: mockBlueprint,
					archiveResult: mockArchiveData,
				},
			} );

			// INTENDED: Returns both blueprint data and bundle
			expect( result ).toEqual( {
				blueprintData: mockBlueprint,
				blueprintBundle: mockBlueprintBundle.data,
			} );
		} );

		test( 'INTENDED: does not accept providerId parameter', async () => {
			// BUG DETECTION: providerId has been removed from the handler
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockSetStatusMessage = jest.fn();

			const mockBlueprintBundle = {
				success: true,
				data: {},
			};

			apiFetch.mockResolvedValue( mockBlueprintBundle );

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipPath: '/path/to/archive.zip',
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
			};

			await generateBlueprintHandler( context );

			// INTENDED: generateBlueprintJson called with only setStatusMessage
			expect( mockGenerateBlueprintJson ).toHaveBeenCalledWith(
				expect.any( Function )
			);
			// INTENDED: Not called with providerId as first parameter
			expect( mockGenerateBlueprintJson ).not.toHaveBeenCalledWith(
				'local-filesystem',
				expect.any( Function )
			);
		} );

		test( 'INTENDED: propagates errors from blueprint generator', async () => {
			// BUG DETECTION: Blueprint generation errors should propagate
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockRejectedValue(
					new Error( 'Blueprint generation failed' )
				);
			const mockSetStatusMessage = jest.fn();

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipPath: '/path/to/archive.zip',
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
			};

			await expect( generateBlueprintHandler( context ) ).rejects.toThrow(
				'Blueprint generation failed'
			);
		} );

		test( 'INTENDED: throws error when zipPath is missing', async () => {
			// BUG DETECTION: Missing zipPath should fail
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockSetStatusMessage = jest.fn();

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipPath: null,
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
			};

			await expect( generateBlueprintHandler( context ) ).rejects.toThrow(
				'Archive result not found. createSiteArchive must run before generateBlueprint.'
			);
		} );

		test( 'INTENDED: throws error when zipPath is undefined', async () => {
			// BUG DETECTION: Undefined zipPath should fail
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockSetStatusMessage = jest.fn();

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
				// Missing zipPath
			};

			await expect( generateBlueprintHandler( context ) ).rejects.toThrow(
				'Archive result not found. createSiteArchive must run before generateBlueprint.'
			);
		} );

		test( 'INTENDED: returns blueprint data and bundle in expected format', async () => {
			// BUG DETECTION: Result must have blueprintData and blueprintBundle keys
			const mockBlueprint = {
				$schema:
					'https://playground.wordpress.net/blueprint-schema.json',
				steps: [ { step: 'importWordPressFiles' } ],
			};

			const mockBundleData = {
				bundlePath: '/path/to/blueprint-bundle.zip',
			};

			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprint );
			const mockSetStatusMessage = jest.fn();

			apiFetch.mockResolvedValue( {
				success: true,
				data: mockBundleData,
			} );

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipPath: '/path/to/archive.zip',
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
			};

			const result = await generateBlueprintHandler( context );

			// INTENDED: blueprintData key exists
			expect( result ).toHaveProperty( 'blueprintData' );
			expect( result.blueprintData ).toBe( mockBlueprint );

			// INTENDED: blueprintBundle key exists
			expect( result ).toHaveProperty( 'blueprintBundle' );
			expect( result.blueprintBundle ).toBe( mockBundleData );
		} );

		test( 'INTENDED: propagates errors from blueprint bundle REST endpoint', async () => {
			// BUG DETECTION: Bundle generation errors should propagate
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockSetStatusMessage = jest.fn();

			apiFetch.mockRejectedValue(
				new Error( 'Bundle generation failed' )
			);

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipPath: '/path/to/archive.zip',
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
			};

			await expect( generateBlueprintHandler( context ) ).rejects.toThrow(
				'Bundle generation failed'
			);
		} );

		test( 'INTENDED: handles error response from blueprint bundle endpoint', async () => {
			// BUG DETECTION: Unsuccessful response should throw error
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockSetStatusMessage = jest.fn();

			apiFetch.mockResolvedValue( {
				success: false,
				message: 'Bundle creation failed',
			} );

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				zipPath: '/path/to/archive.zip',
				zipUrl: 'http://example.com/archive.zip',
				zipSize: '5 MB',
			};

			await expect( generateBlueprintHandler( context ) ).rejects.toThrow(
				'Bundle creation failed'
			);
		} );
	} );
} );
