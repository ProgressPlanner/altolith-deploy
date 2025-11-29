/**
 * Output Types Tests
 *
 * Tests for output type registration, filtering, and settings retrieval.
 */

import {
	getOutputTypes,
	getOutputType,
	getOutputTypeIds,
	getOutputTypeFields,
	getOutputTypesWithSettingsComponent,
	getGlobalSettings,
	getCrawlBatchSize,
	getEnabledOutputTypes,
	OUTPUT_TYPES_HOOK,
} from '../outputTypes';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hookName, value ) => value ),
} ) );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

describe( 'outputTypes', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Reset window.altolithData
		delete window.altolithData;
	} );

	describe( 'OUTPUT_TYPES_HOOK', () => {
		it( 'should export the hook name', () => {
			expect( OUTPUT_TYPES_HOOK ).toBe( 'altolith.outputTypes' );
		} );
	} );

	describe( 'getOutputTypes', () => {
		it( 'should return core output types', () => {
			const types = getOutputTypes();

			expect( types ).toBeInstanceOf( Array );
			expect( types.length ).toBeGreaterThanOrEqual( 2 );
		} );

		it( 'should include static_site type', () => {
			const types = getOutputTypes();
			const staticSite = types.find( ( t ) => t.id === 'static_site' );

			expect( staticSite ).toBeDefined();
			expect( staticSite.label ).toBeTruthy();
		} );

		it( 'should include blueprint type', () => {
			const types = getOutputTypes();
			const blueprint = types.find( ( t ) => t.id === 'blueprint' );

			expect( blueprint ).toBeDefined();
			expect( blueprint.label ).toBeTruthy();
			expect( blueprint.fields ).toBeInstanceOf( Array );
		} );

		it( 'should apply WordPress filter', () => {
			const { applyFilters } = require( '@wordpress/hooks' );

			getOutputTypes();

			expect( applyFilters ).toHaveBeenCalledWith(
				OUTPUT_TYPES_HOOK,
				expect.any( Array )
			);
		} );
	} );

	describe( 'getOutputType', () => {
		it( 'should return type by ID', () => {
			const type = getOutputType( 'static_site' );

			expect( type ).toBeDefined();
			expect( type.id ).toBe( 'static_site' );
		} );

		it( 'should return null for unknown ID', () => {
			const type = getOutputType( 'unknown_type' );

			expect( type ).toBeNull();
		} );
	} );

	describe( 'getOutputTypeIds', () => {
		it( 'should return array of type IDs', () => {
			const ids = getOutputTypeIds();

			expect( ids ).toBeInstanceOf( Array );
			expect( ids ).toContain( 'static_site' );
			expect( ids ).toContain( 'blueprint' );
		} );
	} );

	describe( 'getOutputTypeFields', () => {
		it( 'should return flattened fields from all types', () => {
			const fields = getOutputTypeFields();

			expect( fields ).toBeInstanceOf( Array );
			// Blueprint has blueprint_subfolder field
			const subfolderField = fields.find(
				( f ) => f.id === 'blueprint_subfolder'
			);
			expect( subfolderField ).toBeDefined();
		} );
	} );

	describe( 'getOutputTypesWithSettingsComponent', () => {
		it( 'should return empty array for core types (no settingsComponent)', () => {
			const types = getOutputTypesWithSettingsComponent();

			// Core types don't have settingsComponent
			expect( types ).toEqual( [] );
		} );

		it( 'should return types with settingsComponent when added via filter', () => {
			const { applyFilters } = require( '@wordpress/hooks' );

			// Mock a 3rd-party type with settingsComponent
			const MockComponent = () => null;
			applyFilters.mockImplementation( ( hookName, defaultTypes ) => {
				return [
					...defaultTypes,
					{
						id: 'media_offload',
						label: 'Media Offload',
						settingsComponent: MockComponent,
					},
				];
			} );

			const types = getOutputTypesWithSettingsComponent();

			expect( types ).toHaveLength( 1 );
			expect( types[ 0 ].id ).toBe( 'media_offload' );
			expect( types[ 0 ].settingsComponent ).toBe( MockComponent );
		} );
	} );

	describe( 'getGlobalSettings', () => {
		it( 'should return empty object when no settings', () => {
			const settings = getGlobalSettings();

			expect( settings ).toEqual( {} );
		} );

		it( 'should return settings from window.altolithData', () => {
			window.altolithData = {
				globalSettings: {
					exportStaticSite: true,
					crawlBatchSize: 15,
				},
			};

			const settings = getGlobalSettings();

			expect( settings.exportStaticSite ).toBe( true );
			expect( settings.crawlBatchSize ).toBe( 15 );
		} );
	} );

	describe( 'getCrawlBatchSize', () => {
		it( 'should return default 10 when not set', () => {
			const batchSize = getCrawlBatchSize();

			expect( batchSize ).toBe( 10 );
		} );

		it( 'should return configured batch size', () => {
			window.altolithData = {
				globalSettings: {
					crawlBatchSize: 25,
				},
			};

			const batchSize = getCrawlBatchSize();

			expect( batchSize ).toBe( 25 );
		} );

		it( 'should clamp to minimum 1', () => {
			window.altolithData = {
				globalSettings: {
					crawlBatchSize: 0,
				},
			};

			const batchSize = getCrawlBatchSize();

			expect( batchSize ).toBe( 10 ); // Falls back to default
		} );

		it( 'should clamp to maximum 50', () => {
			window.altolithData = {
				globalSettings: {
					crawlBatchSize: 100,
				},
			};

			const batchSize = getCrawlBatchSize();

			expect( batchSize ).toBe( 10 ); // Falls back to default
		} );

		it( 'should handle non-numeric values', () => {
			window.altolithData = {
				globalSettings: {
					crawlBatchSize: 'invalid',
				},
			};

			const batchSize = getCrawlBatchSize();

			expect( batchSize ).toBe( 10 ); // Falls back to default
		} );
	} );

	describe( 'getEnabledOutputTypes', () => {
		it( 'should return static_site and blueprint by default', () => {
			const enabled = getEnabledOutputTypes();

			expect( enabled ).toContain( 'static_site' );
			expect( enabled ).toContain( 'blueprint' );
		} );

		it( 'should exclude static_site when disabled', () => {
			window.altolithData = {
				globalSettings: {
					exportStaticSite: false,
				},
			};

			const enabled = getEnabledOutputTypes();

			expect( enabled ).not.toContain( 'static_site' );
			expect( enabled ).toContain( 'blueprint' );
		} );

		it( 'should exclude blueprint when disabled', () => {
			window.altolithData = {
				globalSettings: {
					exportBlueprint: false,
				},
			};

			const enabled = getEnabledOutputTypes();

			expect( enabled ).toContain( 'static_site' );
			expect( enabled ).not.toContain( 'blueprint' );
		} );

		it( 'should include 3rd-party types when enabled', () => {
			const { applyFilters } = require( '@wordpress/hooks' );

			// Mock a 3rd-party type
			applyFilters.mockImplementation( ( hookName, defaultTypes ) => {
				return [
					...defaultTypes,
					{
						id: 'media_offload',
						label: 'Media Offload',
					},
				];
			} );

			window.altolithData = {
				globalSettings: {
					exportMediaOffload: true,
				},
			};

			const enabled = getEnabledOutputTypes();

			expect( enabled ).toContain( 'media_offload' );
		} );

		it( 'should not include 3rd-party types when not enabled', () => {
			const { applyFilters } = require( '@wordpress/hooks' );

			// Mock a 3rd-party type
			applyFilters.mockImplementation( ( hookName, defaultTypes ) => {
				return [
					...defaultTypes,
					{
						id: 'media_offload',
						label: 'Media Offload',
					},
				];
			} );

			// No explicit enable setting
			window.altolithData = {
				globalSettings: {},
			};

			const enabled = getEnabledOutputTypes();

			expect( enabled ).not.toContain( 'media_offload' );
		} );
	} );
} );
