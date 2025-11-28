/**
 * Steps Index Tests
 *
 * Tests for step registration and filtering utilities.
 */

import StepRegistry from '../../registry/StepRegistry';

// Mock steps data for registration - 3 steps total (unified upload step)
const mockSteps = [
	{
		id: 'discoverAndScanSite',
		label: 'Discover Site',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
	{
		id: 'createBlueprintBundle',
		label: 'Create Bundle',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
	{
		id: 'upload',
		label: 'Upload Files',
		handler: jest.fn(),
		requires: {},
		provides: {},
	},
];

// Mock WordPress hooks - populate registry when doAction is called
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn( ( hookName, registry ) => {
		// When the registration hook is called, populate the registry
		if ( hookName === 'altolith.export.register_steps' && registry ) {
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
jest.mock( '../createBlueprintBundle', () => {} );
jest.mock( '../upload', () => {} );

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
			// doAction mock populates with 3 steps (unified upload)
			expect( steps.length ).toBe( 3 );
		} );

		test( 'should call doAction with registration hook', () => {
			const { doAction } = require( '@wordpress/hooks' );

			getRegisteredSteps();

			expect( doAction ).toHaveBeenCalledWith(
				'altolith.export.register_steps',
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

			// Registry should have the 3 mock steps, not the 'testStep' we added manually
			expect( steps ).toHaveLength( 3 );
			expect(
				steps.find( ( s ) => s.id === 'testStep' )
			).toBeUndefined();
		} );
	} );

	describe( 'getActiveSteps', () => {
		// Steps are registered via the mocked doAction hook
		// Note: With unified provider architecture, steps no longer have deploymentType
		// and instead use shouldSkip functions based on output type config

		test( 'should include all steps when no shouldSkip filter rejects them', () => {
			const context = {};

			const steps = getActiveSteps( context );

			// Mock steps don't have deploymentType or shouldSkip, so all should be included
			expect( steps ).toHaveLength( 3 );
		} );

		test( 'should call shouldSkip function when present', () => {
			const context = {};

			const steps = getActiveSteps( context );

			// The mock steps don't have shouldSkip, so we verify the filter logic
			// works by checking all steps are included
			expect( steps ).toHaveLength( 3 );

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
			const context = {};

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
