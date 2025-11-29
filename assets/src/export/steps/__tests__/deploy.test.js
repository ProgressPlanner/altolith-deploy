/**
 * Tests for deploy step
 *
 * Tests the deploy step that handles deploying files from gatherFilesToDeploy
 * to providers. Includes static files and blueprint bundles.
 */

// Mock WordPress dependencies
jest.mock( '@wordpress/i18n', () => ( {
	__: ( str ) => str,
	sprintf: ( str, ...args ) => {
		let result = str;
		args.forEach( ( arg, index ) => {
			result = result.replace( `%${ index + 1 }$s`, arg );
			result = result.replace( `%${ index + 1 }$d`, arg );
			result = result.replace( '%s', arg );
			result = result.replace( '%d', arg );
		} );
		return result;
	},
} ) );

jest.mock( '@wordpress/hooks', () => ( {
	addAction: jest.fn(),
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

// Mock staticSiteConfig
jest.mock( '@altolith/export/utils/staticSiteConfig', () => ( {
	fetchProviderConfig: jest.fn().mockResolvedValue( {
		public_url: 'https://example.com',
		blueprint_subfolder: 'playground',
	} ),
	createStorageService: jest.fn().mockResolvedValue( {
		upload: jest.fn().mockResolvedValue( { success: true } ),
	} ),
	buildStorageConfig: jest.fn().mockReturnValue( {} ),
} ) );

// Mock helpers
jest.mock( '../../utils/helpers', () => ( {
	formatFileSize: jest.fn( ( size ) => `${ size } bytes` ),
} ) );

import { addAction } from '@wordpress/hooks';

describe( 'deploy step', () => {
	let stepDefinition;

	beforeEach( () => {
		jest.clearAllMocks();

		// Import the step to trigger registration
		jest.isolateModules( () => {
			require( '../deploy' );
		} );

		// Get the registered step definition
		const registerCall = addAction.mock.calls.find(
			( call ) => call[ 0 ] === 'altolith.export.register_steps'
		);
		expect( registerCall ).toBeDefined();

		// Call the registration callback with a mock registry
		const mockRegistry = {
			register: jest.fn(),
		};
		registerCall[ 2 ]( mockRegistry );
		stepDefinition = mockRegistry.register.mock.calls[ 0 ][ 0 ];
	} );

	describe( 'step definition', () => {
		it( 'should have correct id', () => {
			expect( stepDefinition.id ).toBe( 'deploy' );
		} );

		it( 'should have correct label', () => {
			expect( stepDefinition.label ).toBe( 'Deploy Files' );
		} );

		it( 'should support progress', () => {
			expect( stepDefinition.supportsProgress ).toBe( true );
		} );

		it( 'should depend on gatherFilesToDeploy', () => {
			expect( stepDefinition.dependencies ).toContain(
				'gatherFilesToDeploy'
			);
			expect( stepDefinition.dependencies ).toHaveLength( 1 );
		} );

		it( 'should require filesToDeploy from gatherFilesToDeploy', () => {
			expect( stepDefinition.requires.filesToDeploy ).toEqual( {
				from: 'gatherFilesToDeploy',
			} );
		} );

		it( 'should provide deployResults', () => {
			expect( stepDefinition.provides ).toHaveProperty( 'deployResults' );
			expect( stepDefinition.provides.deployResults.type ).toBe(
				'object'
			);
		} );
	} );

	describe( 'handler', () => {
		it( 'should throw error when provider instance is missing', async () => {
			const context = {
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await expect( stepDefinition.handler( context ) ).rejects.toThrow(
				'Provider instance not found in thread context'
			);
		} );

		it( 'should throw error when filesToDeploy is missing', async () => {
			const context = {
				currentProviderInstance: {
					id: 'test:123',
					label: 'Test Provider',
					config: {},
				},
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await expect( stepDefinition.handler( context ) ).rejects.toThrow(
				'Files to deploy not found'
			);
		} );

		it( 'should handle empty filesToDeploy gracefully', async () => {
			const context = {
				currentProviderInstance: {
					id: 'test:123',
					label: 'Test Provider',
					config: {},
				},
				filesToDeploy: {
					staticSite: {},
					blueprint: {},
				},
				siteUrl: 'https://example.com',
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await stepDefinition.handler( context );

			expect( result.deployResults ).toBeDefined();
			expect( result.deployResults.staticUploadResults ).toBeNull();
			expect( result.deployResults.blueprintUploadResults ).toBeNull();
			expect( context.setStatusMessage ).toHaveBeenCalledWith(
				'No files to deploy',
				'success',
				'deploy'
			);
		} );
	} );

	describe( 'statusLabels', () => {
		it( 'should have pending label', () => {
			expect( stepDefinition.statusLabels.pending ).toBe(
				'Deploy files'
			);
		} );

		it( 'should have running label function', () => {
			expect( typeof stepDefinition.statusLabels.running ).toBe(
				'function'
			);
			expect( stepDefinition.statusLabels.running() ).toContain(
				'Deploying'
			);
		} );

		it( 'should have complete label function', () => {
			expect( typeof stepDefinition.statusLabels.complete ).toBe(
				'function'
			);
			expect( stepDefinition.statusLabels.complete() ).toContain(
				'deployed'
			);
		} );
	} );
} );
