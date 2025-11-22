/**
 * Tests for new per-provider queue StepExecutor
 */

import { executeSteps } from '../StepExecutor';

// Mock globalStepState module
jest.mock( '../../utils/globalStepState', () => ( {
	globalStepState: {
		clear: jest.fn(),
		lock: jest.fn(),
		unlock: jest.fn(),
		get: jest.fn(),
		set: jest.fn(),
		setError: jest.fn(),
		wait: jest.fn(),
		getState: jest.fn( () => ( {
			jobId: 'test-job',
			stepCount: 0,
			steps: [],
		} ) ),
		results: new Map(),
	},
} ) );

// Mock hooks
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

describe( 'StepExecutor - Per-Provider Queue Architecture', () => {
	let globalStepState;

	beforeEach( () => {
		// Reset mocks
		jest.clearAllMocks();

		// Get the mocked globalStepState
		globalStepState =
			require( '../../utils/globalStepState' ).globalStepState;

		// Reset implementation for each test
		globalStepState.clear.mockClear();
		globalStepState.lock.mockClear();
		globalStepState.get.mockClear();
		globalStepState.set.mockClear();
		globalStepState.setError.mockClear();
		globalStepState.wait.mockClear();

		// Set up default implementations
		globalStepState.get.mockReturnValue( null ); // No cached result
		globalStepState.lock.mockReturnValue( true ); // Lock acquired
		globalStepState.wait.mockResolvedValue( {} ); // Wait returns empty object
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
				jobId: 'job-123',
			};

			await executeSteps( steps, context );

			// Should clear global state
			expect( globalStepState.clear ).toHaveBeenCalledWith( 'job-123' );

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
				jobId: 'job-123',
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
				jobId: 'job-123',
			};

			await executeSteps( steps, context );

			// Step 1 must execute before step 2
			expect( executionOrder ).toEqual( [ 'step1', 'step2' ] );
		} );
	} );

	describe( 'global cache steps', () => {
		it( 'should execute global cache step only once', async () => {
			// First provider acquires lock, others wait
			globalStepState.lock
				.mockReturnValueOnce( true ) // Provider 1 gets lock
				.mockReturnValueOnce( false ) // Provider 2 waits
				.mockReturnValueOnce( false ); // Provider 3 waits

			// Waiting providers get the result
			globalStepState.wait.mockResolvedValue( {
				success: true,
				data: 'cached-result',
			} );

			const globalStepHandler = jest
				.fn()
				.mockResolvedValue( { success: true, data: 'cached-result' } );

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
				jobId: 'job-123',
			};

			await executeSteps( steps, context );

			// Should only execute once despite 3 providers
			expect( globalStepHandler ).toHaveBeenCalledTimes( 1 );

			// Should store result in global cache
			expect( globalStepState.set ).toHaveBeenCalledWith( 'globalStep', {
				success: true,
				data: 'cached-result',
			} );
		} );

		it( 'should use cached result if available', async () => {
			const cachedResult = { success: true, data: 'from-cache' };

			// Mock cache to return cached result
			globalStepState.get.mockResolvedValue( cachedResult );

			const globalStepHandler = jest.fn();

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
				providerIds: [ 'provider-1' ],
				jobId: 'job-123',
			};

			await executeSteps( steps, context );

			// Should not execute handler (use cache instead)
			expect( globalStepHandler ).not.toHaveBeenCalled();

			// Should retrieve from cache
			expect( globalStepState.get ).toHaveBeenCalledWith( 'globalStep' );
		} );

		it( 'should wait for global step if another provider is executing it', async () => {
			const completedResult = { success: true, data: 'completed' };

			// First provider acquires lock
			globalStepState.lock
				.mockResolvedValueOnce( true ) // Provider 1 gets lock
				.mockResolvedValueOnce( false ); // Provider 2 doesn't

			// Provider 2 waits and gets result
			globalStepState.wait.mockResolvedValue( completedResult );

			const globalStepHandler = jest
				.fn()
				.mockResolvedValue( completedResult );

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
				providerIds: [ 'provider-1', 'provider-2' ],
				jobId: 'job-123',
			};

			await executeSteps( steps, context );

			// Only one provider should execute
			expect( globalStepHandler ).toHaveBeenCalledTimes( 1 );

			// Other provider should wait
			expect( globalStepState.wait ).toHaveBeenCalledWith( 'globalStep' );
		} );

		it( 'should inject cached result into context for subsequent steps', async () => {
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
				jobId: 'job-123',
			};

			await executeSteps( steps, context );

			// Provider step should receive cached data in context
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
				jobId: 'job-123',
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
				jobId: 'job-123',
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
				jobId: 'job-123',
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
				jobId: 'job-123',
			};

			await executeSteps( steps, context, { onStepComplete } );

			expect( onStepComplete ).toHaveBeenCalledWith(
				'step1',
				{ success: true, data: 'result' },
				'provider-1'
			);
		} );

		it( 'should call onStepCached when using cached global step result', async () => {
			const onStepCached = jest.fn();
			const cachedResult = { success: true, data: 'cached' };

			globalStepState.get.mockResolvedValue( cachedResult );

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: jest.fn(),
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2' ],
				jobId: 'job-123',
			};

			await executeSteps( steps, context, { onStepCached } );

			// Should be called for both providers (both use cache)
			expect( onStepCached ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should call onStepWaiting when provider waits for global step', async () => {
			const onStepWaiting = jest.fn();

			// First provider gets lock, second waits
			globalStepState.lock
				.mockResolvedValueOnce( true )
				.mockResolvedValueOnce( false );

			globalStepState.wait.mockResolvedValue( {
				success: true,
			} );

			const steps = [
				{
					id: 'globalStep',
					label: 'Global Step',
					globalCache: true,
					dependencies: [],
					handler: jest.fn().mockResolvedValue( { success: true } ),
				},
			];

			const context = {
				providerIds: [ 'provider-1', 'provider-2' ],
				jobId: 'job-123',
			};

			await executeSteps( steps, context, { onStepWaiting } );

			// Should be called for provider that waits
			expect( onStepWaiting ).toHaveBeenCalledWith(
				'globalStep',
				'provider-2'
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
				jobId: 'job-123',
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
				jobId: 'job-123',
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
				jobId: 'job-123',
			};

			const result = await executeSteps( steps, context );

			// Provider should fail when global step fails
			expect( result[ 'provider-1' ].success ).toBe( false );

			// Provider step should not execute
			expect( providerHandler ).not.toHaveBeenCalled();
		} );

		it( 'should store error in global cache when global step fails', async () => {
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
				jobId: 'job-123',
			};

			await executeSteps( steps, context );

			// Should store error in cache
			expect( globalStepState.setError ).toHaveBeenCalledWith(
				'globalStep',
				error
			);
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
				jobId: 'job-123',
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
				jobId: 'job-123',
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
