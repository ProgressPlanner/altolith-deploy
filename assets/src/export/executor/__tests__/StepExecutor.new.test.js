/**
 * Tests for new per-provider queue StepExecutor
 */

import { executeSteps } from '../StepExecutor';

// Mock hooks
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

describe( 'StepExecutor - Per-Provider Queue Architecture', () => {
	beforeEach( () => {
		// Reset mocks
		jest.clearAllMocks();
	} );

	describe( 'basic execution', () => {
		it( 'should execute simple workflow for single provider', async () => {
			const step1Handler = jest.fn().mockResolvedValue( {
				success: true,
				data: 'step1-result',
			} );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler: step1Handler,
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			await executeSteps( steps, context );

			// Should execute handler once for the provider
			expect( step1Handler ).toHaveBeenCalledTimes( 1 );
			expect( step1Handler ).toHaveBeenCalledWith(
				expect.objectContaining( {
					providerId: 'provider-1',
				} )
			);
		} );

		it( 'should execute workflow for multiple providers in parallel', async () => {
			const step1Handler = jest.fn().mockResolvedValue( {
				success: true,
			} );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler: step1Handler,
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2', 'provider-3' ],
			};

			const startTime = Date.now();
			await executeSteps( steps, context );
			const duration = Date.now() - startTime;

			// Should execute for all providers
			expect( step1Handler ).toHaveBeenCalledTimes( 3 );

			// Should run in parallel (not take 3x as long)
			// If sequential: 3 providers * ~10ms each = ~30ms minimum
			// If parallel: ~10ms total
			// Allow some margin for overhead
			expect( duration ).toBeLessThan( 100 );
		} );

		it( 'should respect step dependencies within provider queue', async () => {
			const executionOrder = [];

			const step1Handler = jest.fn().mockImplementation( async () => {
				executionOrder.push( 'step1' );
				return { success: true };
			} );

			const step2Handler = jest.fn().mockImplementation( async () => {
				executionOrder.push( 'step2' );
				return { success: true };
			} );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler: step1Handler,
				},
				{
					id: 'step2',
					label: 'Step 2',
					globalCache: false,
					dependencies: [ 'step1' ],
					handler: step2Handler,
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			await executeSteps( steps, context );

			// Step 1 must execute before step 2
			expect( executionOrder ).toEqual( [ 'step1', 'step2' ] );
		} );
	} );

	describe( 'global cache steps', () => {
		it( 'should execute global cache step per provider (no caching)', async () => {
			const globalStepHandler = jest
				.fn()
				.mockResolvedValue( { success: true, data: 'result' } );

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: globalStepHandler,
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2', 'provider-3' ],
			};

			await executeSteps( steps, context );

			// Should execute once per provider (no caching)
			expect( globalStepHandler ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should inject result into context for subsequent steps', async () => {
			const cachedData = { bundlePath: '/tmp/bundle.zip' };

			const globalStepHandler = jest
				.fn()
				.mockResolvedValue( { success: true, ...cachedData } );

			const providerStepHandler = jest
				.fn()
				.mockResolvedValue( { success: true } );

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: globalStepHandler,
				},
				{
					id: 'providerStep',
					label: 'Provider Step',
					globalCache: false,
					dependencies: [ 'globalStep' ],
					handler: providerStepHandler,
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			await executeSteps( steps, context );

			// Provider step should receive global step data in context
			expect( providerStepHandler ).toHaveBeenCalledWith(
				expect.objectContaining( {
					bundlePath: '/tmp/bundle.zip',
				} )
			);
		} );
	} );

	describe( 'mixed workflow (global + provider-specific)', () => {
		it( 'should execute global steps once and provider steps per-provider', async () => {
			const globalHandler = jest
				.fn()
				.mockResolvedValue( { success: true, sharedData: 'global' } );

			const providerHandler = jest
				.fn()
				.mockResolvedValue( { success: true } );

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: globalHandler,
				},
				{
					id: 'providerStep',
					label: 'Provider Step',
					globalCache: false,
					dependencies: [ 'globalStep' ],
					handler: providerHandler,
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2' ],
			};

			await executeSteps( steps, context );

			// Global step executes once
			expect( globalHandler ).toHaveBeenCalledTimes( 1 );

			// Provider step executes per provider
			expect( providerHandler ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should allow providers to proceed independently after global steps', async () => {
			const executionTimes = {};

			const globalHandler = jest.fn().mockResolvedValue( {
				success: true,
			} );

			const providerHandler = jest
				.fn()
				.mockImplementation( async ( context ) => {
					// Provider 1 is slow, Provider 2 is fast
					const delay =
						context.providerId === 'provider-1' ? 100 : 10;
					await new Promise( ( resolve ) =>
						setTimeout( resolve, delay )
					);
					executionTimes[ context.providerId ] = Date.now();
					return { success: true };
				} );

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: globalHandler,
				},
				{
					id: 'providerStep',
					label: 'Provider Step',
					globalCache: false,
					dependencies: [ 'globalStep' ],
					handler: providerHandler,
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2' ],
			};

			await executeSteps( steps, context );

			// Provider 2 should finish before Provider 1
			expect( executionTimes[ 'provider-2' ] ).toBeLessThan(
				executionTimes[ 'provider-1' ]
			);
		} );
	} );

	describe( 'callback notifications', () => {
		it( 'should fire aether.step.start hook for each provider-step combination', async () => {
			const { doAction } = require( '@wordpress/hooks' );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler: jest.fn().mockResolvedValue( { success: true } ),
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2' ],
			};

			await executeSteps( steps, context );

			// Should fire hook once per provider
			expect( doAction ).toHaveBeenCalledWith(
				'aether.step.start',
				'step1',
				'provider-1'
			);
			expect( doAction ).toHaveBeenCalledWith(
				'aether.step.start',
				'step1',
				'provider-2'
			);
		} );

		it( 'should call onStepComplete after each step completes', async () => {
			const onStepComplete = jest.fn();

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler: jest
						.fn()
						.mockResolvedValue( { success: true, data: 'result' } ),
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			await executeSteps( steps, context, { onStepComplete } );

			expect( onStepComplete ).toHaveBeenCalledWith(
				'step1',
				{ success: true, data: 'result' },
				'provider-1'
			);
		} );


		it( 'should call onError when step fails', async () => {
			const onError = jest.fn();
			const error = new Error( 'Step failed' );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler: jest.fn().mockRejectedValue( error ),
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			const result = await executeSteps( steps, context, { onError } );

			// Provider should fail but not throw (allow other providers to continue)
			expect( result[ 'provider-1' ].success ).toBe( false );
			expect( onError ).toHaveBeenCalledWith(
				'step1',
				error,
				'provider-1'
			);
		} );
	} );

	describe( 'error handling', () => {
		it( 'should continue other providers if one provider fails', async () => {
			const handler = jest.fn().mockImplementation( async ( context ) => {
				if ( context.providerId === 'provider-1' ) {
					throw new Error( 'Provider 1 failed' );
				}
				return { success: true };
			} );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler,
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2', 'provider-3' ],
			};

			const result = await executeSteps( steps, context );

			// Should return results for all providers
			expect( result ).toHaveProperty( 'provider-1' );
			expect( result ).toHaveProperty( 'provider-2' );
			expect( result ).toHaveProperty( 'provider-3' );

			// Provider 1 should have error
			expect( result[ 'provider-1' ].error ).toBeDefined();

			// Other providers should succeed
			expect( result[ 'provider-2' ].success ).toBe( true );
			expect( result[ 'provider-3' ].success ).toBe( true );
		} );

		it( 'should fail all providers if global step fails', async () => {
			const globalHandler = jest
				.fn()
				.mockRejectedValue( new Error( 'Global step failed' ) );

			const providerHandler = jest.fn();

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: globalHandler,
				},
				{
					id: 'providerStep',
					label: 'Provider Step',
					globalCache: false,
					dependencies: [ 'globalStep' ],
					handler: providerHandler,
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			const result = await executeSteps( steps, context );

			// Provider should fail when global step fails
			expect( result[ 'provider-1' ].success ).toBe( false );

			// Provider step should not execute
			expect( providerHandler ).not.toHaveBeenCalled();
		} );

		it( 'should fail provider when global step fails', async () => {
			const error = new Error( 'Global step failed' );

			const globalHandler = jest.fn().mockRejectedValue( error );

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: globalHandler,
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			const result = await executeSteps( steps, context );

			// Provider should fail when global step fails
			expect( result[ 'provider-1' ].success ).toBe( false );
			expect( result[ 'provider-1' ].error ).toBeDefined();
		} );
	} );

	describe( 'context management', () => {
		it( 'should pass providerId to each provider queue', async () => {
			const handler = jest.fn().mockResolvedValue( { success: true } );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler,
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2' ],
				sharedData: 'test',
			};

			await executeSteps( steps, context );

			// Each provider should get its own context with providerId
			expect( handler ).toHaveBeenCalledWith(
				expect.objectContaining( {
					providerId: 'provider-1',
					sharedData: 'test',
				} )
			);

			expect( handler ).toHaveBeenCalledWith(
				expect.objectContaining( {
					providerId: 'provider-2',
					sharedData: 'test',
				} )
			);
		} );

		it( 'should accumulate results from previous steps in context', async () => {
			const step1Handler = jest
				.fn()
				.mockResolvedValue( { success: true, step1Data: 'data1' } );

			const step2Handler = jest
				.fn()
				.mockResolvedValue( { success: true, step2Data: 'data2' } );

			const steps = [
				{
					id: 'step1',
					label: 'Step 1',
					globalCache: false,
					dependencies: [],
					handler: step1Handler,
				},
				{
					id: 'step2',
					label: 'Step 2',
					globalCache: false,
					dependencies: [ 'step1' ],
					handler: step2Handler,
				},
			];

			const context = {
				providerIds: [ 'provider-1' ],
			};

			await executeSteps( steps, context );

			// Step 2 should receive step 1's result in context
			expect( step2Handler ).toHaveBeenCalledWith(
				expect.objectContaining( {
					step1Data: 'data1',
				} )
			);
		} );
	} );
} );
