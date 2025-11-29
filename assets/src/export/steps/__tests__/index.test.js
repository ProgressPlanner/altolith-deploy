/**
 * Steps Index Tests
 *
 * Tests for step registration and filtering utilities.
 */

import StepRegistry from '../../registry/StepRegistry';

// Mock steps data for registration - 4 steps total
const mockSteps = [
	{
		id: 'discoverAndScanSite',
		label: 'Discover Site',
		handler: jest.fn(),
		requires: {},
		provides: {},
		deploymentType: 'static_site',
	},
	{
		id: 'prepareBlueprint',
		label: 'Prepare Blueprint',
		handler: jest.fn(),
		requires: {},
		provides: {},
		deploymentType: 'blueprint',
	},
	{
		id: 'gatherFilesToDeploy',
		label: 'Gather Files',
		handler: jest.fn(),
		requires: {},
		provides: {},
		hidden: true, // Hidden from UI but still executes
		// No deploymentType - should show if ANY output type is enabled
	},
	{
		id: 'deploy',
		label: 'Deploy Files',
		handler: jest.fn(),
		requires: {},
		provides: {},
		// No deploymentType - should show if ANY output type is enabled
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
jest.mock( '../prepareBlueprint', () => {} );
jest.mock( '../gatherFilesToDeploy', () => {} );
jest.mock( '../deploy', () => {} );

// Mock outputTypes utility
const mockGetEnabledOutputTypes = jest.fn( () => [
	'static_site',
	'blueprint',
] );
jest.mock( '@altolith/utils/outputTypes', () => ( {
	getEnabledOutputTypes: mockGetEnabledOutputTypes,
} ) );

// Import after mocks are set up
import { getRegisteredSteps, getActiveSteps, getStepsForUI } from '../index';

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
			// doAction mock populates with 4 steps
			expect( steps.length ).toBe( 4 );
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

			// Registry should have the 4 mock steps, not the 'testStep' we added manually
			expect( steps ).toHaveLength( 4 );
			expect(
				steps.find( ( s ) => s.id === 'testStep' )
			).toBeUndefined();
		} );
	} );

	describe( 'getStepsForUI', () => {
		beforeEach( () => {
			mockGetEnabledOutputTypes.mockReturnValue( [
				'static_site',
				'blueprint',
			] );
		} );

		test( 'should return all steps when both output types are enabled', () => {
			const steps = getStepsForUI();

			expect( steps ).toHaveLength( 3 ); // gatherFilesToDeploy is hidden
			expect( steps.map( ( s ) => s.id ) ).toContain(
				'discoverAndScanSite'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain(
				'prepareBlueprint'
			);
			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'gatherFilesToDeploy'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain( 'deploy' );
		} );

		test( 'should filter out static_site step when only blueprint is enabled', () => {
			mockGetEnabledOutputTypes.mockReturnValue( [ 'blueprint' ] );

			const steps = getStepsForUI();

			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'discoverAndScanSite'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain(
				'prepareBlueprint'
			);
			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'gatherFilesToDeploy'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain( 'deploy' );
		} );

		test( 'should filter out blueprint step when only static_site is enabled', () => {
			mockGetEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

			const steps = getStepsForUI();

			expect( steps.map( ( s ) => s.id ) ).toContain(
				'discoverAndScanSite'
			);
			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'prepareBlueprint'
			);
			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'gatherFilesToDeploy'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain( 'deploy' );
		} );

		test( 'should return empty array when no output types are enabled', () => {
			mockGetEnabledOutputTypes.mockReturnValue( [] );

			const steps = getStepsForUI();

			expect( steps ).toHaveLength( 0 );
		} );
	} );

	describe( 'getActiveSteps', () => {
		beforeEach( () => {
			mockGetEnabledOutputTypes.mockReturnValue( [
				'static_site',
				'blueprint',
			] );
		} );

		test( 'should filter steps by enabled output types and provider instances', () => {
			const context = {
				providerInstancesByType: {
					static_site: [ { id: 'provider1' } ],
					blueprint: [ { id: 'provider2' } ],
				},
			};

			const steps = getActiveSteps( context );

			// All steps should be included when both types are enabled and have providers
			expect( steps ).toHaveLength( 4 );
		} );

		test( 'should filter out static_site step when not enabled', () => {
			mockGetEnabledOutputTypes.mockReturnValue( [ 'blueprint' ] );
			const context = {
				providerInstancesByType: {
					blueprint: [ { id: 'provider2' } ],
				},
			};

			const steps = getActiveSteps( context );

			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'discoverAndScanSite'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain(
				'prepareBlueprint'
			);
		} );

		test( 'should filter out steps when no provider instances exist', () => {
			const context = {
				providerInstancesByType: {
					static_site: [],
					blueprint: [],
				},
			};

			const steps = getActiveSteps( context );

			// Steps with deploymentType should be filtered out when no providers
			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'discoverAndScanSite'
			);
			expect( steps.map( ( s ) => s.id ) ).not.toContain(
				'prepareBlueprint'
			);
			// Steps without deploymentType should also be filtered out
			expect( steps ).toHaveLength( 0 );
		} );

		test( 'should include steps without deploymentType when any output type has providers', () => {
			const context = {
				providerInstancesByType: {
					static_site: [ { id: 'provider1' } ],
					blueprint: [],
				},
			};

			const steps = getActiveSteps( context );

			expect( steps.map( ( s ) => s.id ) ).toContain(
				'discoverAndScanSite'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain(
				'gatherFilesToDeploy'
			);
			expect( steps.map( ( s ) => s.id ) ).toContain( 'deploy' );
		} );
	} );
} );
