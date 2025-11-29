/**
 * Tests for unified upload step
 *
 * Tests the upload step that handles both static files and blueprint bundles
 * based on provider output type configuration.
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

// Mock outputTypes - new architecture with global settings
jest.mock( '@altolith/utils/outputTypes', () => ( {
	getEnabledOutputTypes: jest.fn( () => [ 'static_site', 'blueprint' ] ),
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
// Import the mocked module to control return values
const { getEnabledOutputTypes } = require( '@altolith/utils/outputTypes' );

describe( 'upload step', () => {
	let stepDefinition;

	beforeEach( () => {
		jest.clearAllMocks();

		// Import the step to trigger registration
		jest.isolateModules( () => {
			require( '../upload' );
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
			expect( stepDefinition.id ).toBe( 'upload' );
		} );

		it( 'should have correct label', () => {
			expect( stepDefinition.label ).toBe( 'Upload Files' );
		} );

		it( 'should support progress', () => {
			expect( stepDefinition.supportsProgress ).toBe( true );
		} );

		it( 'should depend on discoverAndScanSite and createBlueprintBundle', () => {
			expect( stepDefinition.dependencies ).toContain(
				'discoverAndScanSite'
			);
			expect( stepDefinition.dependencies ).toContain(
				'createBlueprintBundle'
			);
		} );

		it( 'should provide uploadResults', () => {
			expect( stepDefinition.provides ).toHaveProperty( 'uploadResults' );
			expect( stepDefinition.provides.uploadResults.type ).toBe(
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

		it( 'should throw error when static_site enabled but urls missing', async () => {
			// Mock only static_site enabled
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

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
				'URLs not found'
			);
		} );

		it( 'should throw error when blueprint enabled but data missing', async () => {
			// Mock only blueprint enabled
			getEnabledOutputTypes.mockReturnValue( [ 'blueprint' ] );

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
				'Blueprint data not found'
			);
		} );
	} );

	describe( 'statusLabels', () => {
		it( 'should have pending label', () => {
			expect( stepDefinition.statusLabels.pending ).toBe(
				'Upload files'
			);
		} );

		it( 'should have running label function', () => {
			expect( typeof stepDefinition.statusLabels.running ).toBe(
				'function'
			);
			expect( stepDefinition.statusLabels.running() ).toBe(
				'Uploading files…'
			);
		} );

		it( 'should have complete label function', () => {
			expect( typeof stepDefinition.statusLabels.complete ).toBe(
				'function'
			);
			expect( stepDefinition.statusLabels.complete() ).toBe(
				'Files uploaded'
			);
		} );
	} );
} );
