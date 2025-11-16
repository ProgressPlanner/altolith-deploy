/**
 * Generate Blueprint Step Tests
 *
 * Tests validate INTENDED behavior and catch potential bugs.
 *
 * @package
 */

import { generateBlueprintHandler } from '../generateBlueprintStep';

describe( 'generateBlueprintStep', () => {
	describe( 'generateBlueprintHandler', () => {
		test( 'INTENDED: generates blueprint successfully', async () => {
			const mockBlueprint = {
				$schema:
					'https://playground.wordpress.net/blueprint-schema.json',
				landingPage: '/wp-login.php',
				steps: [],
			};

			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprint );
			const mockSetStatusMessage = jest.fn();

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: mockSetStatusMessage,
			};

			const result = await generateBlueprintHandler( context );

			// INTENDED: Blueprint generator called with correct parameters
			expect( mockGenerateBlueprintJson ).toHaveBeenCalledWith(
				'test-site-key',
				'cloudflare-r2',
				mockSetStatusMessage
			);

			// INTENDED: Status messages set
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Generating the blueprint file',
				'progress',
				'generateBlueprint'
			);
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Generated the blueprint file',
				'success',
				'generateBlueprint'
			);

			// INTENDED: Returns blueprint data
			expect( result ).toEqual( {
				blueprintData: mockBlueprint,
			} );
		} );

		test( 'INTENDED: passes siteKey to blueprint generator', async () => {
			// BUG DETECTION: siteKey must be passed for storage path
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				siteKey: 'unique-site-key-123',
				providerId: 'cloudflare-r2',
				setStatusMessage: jest.fn(),
			};

			await generateBlueprintHandler( context );

			// INTENDED: First parameter is siteKey
			expect( mockGenerateBlueprintJson ).toHaveBeenCalledWith(
				'unique-site-key-123',
				expect.any( String ),
				expect.any( Function )
			);
		} );

		test( 'INTENDED: passes providerId to blueprint generator', async () => {
			// BUG DETECTION: providerId needed for wp-content.zip URL
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				siteKey: 'test-site-key',
				providerId: 'specific-provider-id',
				setStatusMessage: jest.fn(),
			};

			await generateBlueprintHandler( context );

			// INTENDED: Second parameter is providerId
			expect( mockGenerateBlueprintJson ).toHaveBeenCalledWith(
				expect.any( String ),
				'specific-provider-id',
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

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: jest.fn(),
			};

			await expect( generateBlueprintHandler( context ) ).rejects.toThrow(
				'Blueprint generation failed'
			);
		} );

		test( 'INTENDED: returns blueprint data in expected format', async () => {
			// BUG DETECTION: Result must have blueprintData key for downstream steps
			const mockBlueprint = {
				$schema:
					'https://playground.wordpress.net/blueprint-schema.json',
				steps: [ { step: 'importWordPressFiles' } ],
			};

			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprint );

			const context = {
				generateBlueprintJson: mockGenerateBlueprintJson,
				siteKey: 'test-site-key',
				providerId: 'cloudflare-r2',
				setStatusMessage: jest.fn(),
			};

			const result = await generateBlueprintHandler( context );

			// INTENDED: blueprintData key exists
			expect( result ).toHaveProperty( 'blueprintData' );
			expect( result.blueprintData ).toBe( mockBlueprint );
		} );
	} );
} );
