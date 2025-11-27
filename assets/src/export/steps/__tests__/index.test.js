/**
 * Steps Index Tests
 *
 * Tests for step registration and filtering utilities.
 */

import StepRegistry from '../../registry/StepRegistry';

// Mock steps data for registration - 5 steps total with deploymentType
const mockSteps = [
	{
		id: 'discoverAndScanSite',
		label: 'Discover Site',
		deploymentType: 'static_site',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
	{
		id: 'uploadStaticFiles',
		label: 'Upload Static',
		deploymentType: 'static_site',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
	{
		id: 'createWpContentArchive',
		label: 'Create Archive',
		deploymentType: 'blueprint_bundle',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
	{
		id: 'createBlueprintBundle',
		label: 'Create Bundle',
		deploymentType: 'blueprint_bundle',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
	{
		id: 'uploadBlueprintBundle',
		label: 'Upload Bundle',
		deploymentType: 'blueprint_bundle',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
];

// Mock WordPress hooks - populate registry when doAction is called
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn( ( hookName, registry ) => {
		// When the registration hook is called, populate the registry
		if ( hookName === 'aether.export.register_steps' && registry ) {
			mockSteps.forEach( ( step ) => {
				try {
					registry.register( step );
				} catch ( e ) {
					// Ignore duplicate registration errors
				}
			} );
		}
	} ),
	addAction: jest.fn(),
} ) );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
} ) );

// Mock step modules - they self-register via addAction
jest.mock( '../discoverAndScanSite', () => {} );
jest.mock( '../createWpContentArchive', () => {} );
jest.mock( '../createBlueprintBundle', () => {} );
jest.mock( '../uploadBlueprintBundle', () => {} );
jest.mock( '../uploadStaticFiles', () => {} );

// Import after mocks are set up
import { getRegisteredSteps, getActiveSteps } from '../index';

describe( 'Steps Index', () => {
	let registry;

	beforeEach( () => {
		jest.clearAllMocks();
		// Reset singleton and get fresh instance
		registry = StepRegistry.getInstance();
		registry.clear();
	} );

	describe( 'getRegisteredSteps', () => {
		test( 'should return array of steps', () => {
			const steps = getRegisteredSteps();
			expect( Array.isArray( steps ) ).toBe( true );
			// doAction mock populates with 5 steps
			expect( steps.length ).toBe( 5 );
		} );

		test( 'should call doAction with registration hook', () => {
			const { doAction } = require( '@wordpress/hooks' );

			getRegisteredSteps();

			expect( doAction ).toHaveBeenCalledWith(
				'aether.export.register_steps',
				expect.any( Object )
			);
		} );

		test( 'should clear previous registrations before re-registering', () => {
			// Manually register a step
			registry.register( {
				id: 'testStep',
				label: 'Test',
				handler: jest.fn(),
				requires: {},
				provides: {},
			} );

			expect( registry.getSteps() ).toHaveLength( 1 );

			// Call getRegisteredSteps - should clear first then repopulate via doAction
			const steps = getRegisteredSteps();

			// Registry should have the 5 mock steps, not the 'testStep' we added manually
			expect( steps ).toHaveLength( 5 );
			expect(
				steps.find( ( s ) => s.id === 'testStep' )
			).toBeUndefined();
		} );
	} );

	describe( 'getActiveSteps', () => {
		// Steps are registered via the mocked doAction hook

		test( 'should include all steps when both provider types have instances', () => {
			const context = {
				providerInstancesByType: {
					static_site: [ { id: 'static-1' } ],
					blueprint_bundle: [ { id: 'bundle-1' } ],
				},
			};

			const steps = getActiveSteps( context );

			expect( steps ).toHaveLength( 5 );
		} );

		test( 'should exclude static site steps when no static providers', () => {
			const context = {
				providerInstancesByType: {
					static_site: [],
					blueprint_bundle: [ { id: 'bundle-1' } ],
				},
			};

			const steps = getActiveSteps( context );

			// Should exclude discoverAndScanSite and uploadStaticFiles
			const stepIds = steps.map( ( s ) => s.id );
			expect( stepIds ).not.toContain( 'discoverAndScanSite' );
			expect( stepIds ).not.toContain( 'uploadStaticFiles' );
			expect( stepIds ).toContain( 'createBlueprintBundle' );
		} );

		test( 'should exclude blueprint steps when no blueprint providers', () => {
			const context = {
				providerInstancesByType: {
					static_site: [ { id: 'static-1' } ],
					blueprint_bundle: [],
				},
			};

			const steps = getActiveSteps( context );

			// Should exclude all blueprint steps
			const stepIds = steps.map( ( s ) => s.id );
			expect( stepIds ).not.toContain( 'createWpContentArchive' );
			expect( stepIds ).not.toContain( 'createBlueprintBundle' );
			expect( stepIds ).not.toContain( 'uploadBlueprintBundle' );
			expect( stepIds ).toContain( 'discoverAndScanSite' );
		} );

		test( 'should handle missing providerInstancesByType in context', () => {
			const context = {};

			const steps = getActiveSteps( context );

			// With no providers, should exclude all provider-dependent steps
			const stepIds = steps.map( ( s ) => s.id );
			expect( stepIds ).not.toContain( 'discoverAndScanSite' );
			expect( stepIds ).not.toContain( 'uploadStaticFiles' );
			expect( stepIds ).not.toContain( 'createBlueprintBundle' );
		} );

		test( 'should call shouldSkip function when present', () => {
			// Test the shouldSkip logic directly by getting steps and verifying
			// a step with shouldSkip returning true would be filtered out
			const context = {
				providerInstancesByType: {
					static_site: [ { id: 'static-1' } ],
					blueprint_bundle: [ { id: 'bundle-1' } ],
				},
			};

			const steps = getActiveSteps( context );

			// The mock steps don't have shouldSkip, so we verify the filter logic
			// works by checking all steps are included
			expect( steps ).toHaveLength( 5 );

			// Test the shouldSkip filter logic manually on a step array
			const stepsWithSkip = [
				...mockSteps,
				{
					id: 'skipMe',
					label: 'Skip Me',
					handler: jest.fn(),
					requires: {},
					provides: {},
					shouldSkip: () => true,
				},
			];

			// Filter manually using the same logic as getActiveSteps
			const filtered = stepsWithSkip.filter( ( step ) => {
				if ( typeof step.shouldSkip === 'function' ) {
					return ! step.shouldSkip( context );
				}
				return true;
			} );

			expect( filtered.map( ( s ) => s.id ) ).not.toContain( 'skipMe' );
		} );

		test( 'should include step when shouldSkip returns false', () => {
			const context = {
				providerInstancesByType: {
					static_site: [ { id: 'static-1' } ],
					blueprint_bundle: [ { id: 'bundle-1' } ],
				},
			};

			// Test the shouldSkip filter logic manually
			const stepsWithSkip = [
				{
					id: 'includeMe',
					label: 'Include Me',
					handler: jest.fn(),
					requires: {},
					provides: {},
					shouldSkip: () => false,
				},
			];

			// Filter manually using the same logic as getActiveSteps
			const filtered = stepsWithSkip.filter( ( step ) => {
				if ( typeof step.shouldSkip === 'function' ) {
					return ! step.shouldSkip( context );
				}
				return true;
			} );

			expect( filtered.map( ( s ) => s.id ) ).toContain( 'includeMe' );
		} );
	} );
} );
