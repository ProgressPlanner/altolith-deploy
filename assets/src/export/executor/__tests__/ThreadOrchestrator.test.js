/**
 * ThreadOrchestrator Tests
 *
 * Integration tests for multi-threaded workflow execution.
 */

import {
	categorizeSteps,
	buildThreadContext,
	executeThreadedWorkflow,
} from '../ThreadOrchestrator';

describe( 'ThreadOrchestrator', () => {
	describe( 'categorizeSteps', () => {
		it( 'should categorize steps into global and thread', () => {
			const steps = [
				{
					id: 'globalStep',
					requires: {
						siteUrl: { from: 'initial' },
					},
				},
				{
					id: 'threadStep',
					requires: {
						currentProviderInstance: { from: 'thread' },
					},
				},
				{
					id: 'anotherGlobalStep',
					requires: {
						api: { from: 'initial' },
					},
				},
			];

			const { globalSteps, threadSteps } = categorizeSteps( steps );

			expect( globalSteps ).toHaveLength( 2 );
			expect( threadSteps ).toHaveLength( 1 );
			expect( globalSteps[ 0 ].id ).toBe( 'globalStep' );
			expect( threadSteps[ 0 ].id ).toBe( 'threadStep' );
		} );

		it( 'should handle all global steps', () => {
			const steps = [
				{
					id: 'step1',
					requires: { siteUrl: { from: 'initial' } },
				},
				{
					id: 'step2',
					requires: { api: { from: 'initial' } },
				},
			];

			const { globalSteps, threadSteps } = categorizeSteps( steps );

			expect( globalSteps ).toHaveLength( 2 );
			expect( threadSteps ).toHaveLength( 0 );
		} );

		it( 'should handle all thread steps', () => {
			const steps = [
				{
					id: 'step1',
					requires: {
						currentProviderInstance: { from: 'thread' },
					},
				},
				{
					id: 'step2',
					requires: {
						currentProviderInstance: { from: 'thread' },
					},
				},
			];

			const { globalSteps, threadSteps } = categorizeSteps( steps );

			expect( globalSteps ).toHaveLength( 0 );
			expect( threadSteps ).toHaveLength( 2 );
		} );

		it( 'should handle empty steps array', () => {
			const { globalSteps, threadSteps } = categorizeSteps( [] );

			expect( globalSteps ).toHaveLength( 0 );
			expect( threadSteps ).toHaveLength( 0 );
		} );
	} );

	describe( 'buildThreadContext', () => {
		it( 'should build thread context from global context', () => {
			const globalContext = {
				siteUrl: 'https://example.com',
				api: {},
				discoveredAssets: [ 'asset1' ],
			};

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: { apiKey: 'test' },
			};

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			expect( threadContext.siteUrl ).toBe( 'https://example.com' );
			expect( threadContext.api ).toBe( globalContext.api );
			expect( threadContext.discoveredAssets ).toBe(
				globalContext.discoveredAssets
			);
			expect( threadContext.currentProviderInstance ).toBe(
				providerInstance
			);
			expect( threadContext.providerInstanceConfig ).toEqual( {
				apiKey: 'test',
			} );
		} );

		it( 'should override callbacks with thread-specific ones', () => {
			const globalContext = {
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: {},
			};

			const threadCallbacks = {
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance,
				threadCallbacks
			);

			expect( threadContext.setStatusMessage ).toBe(
				threadCallbacks.setStatusMessage
			);
			expect( threadContext.setStepProgress ).toBe(
				threadCallbacks.setStepProgress
			);
		} );

		it( 'should handle provider instance without config', () => {
			const globalContext = { siteUrl: 'https://example.com' };
			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
			};

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			expect( threadContext.providerInstanceConfig ).toEqual( {} );
		} );
	} );

	describe( 'executeThreadedWorkflow', () => {
		it( 'should execute global steps once', async () => {
			const globalStep = {
				id: 'globalStep',
				handler: jest.fn().mockResolvedValue( {
					globalData: 'test',
				} ),
				requires: {
					siteUrl: { from: 'initial' },
				},
			};

			const steps = [ globalStep ];
			const context = { siteUrl: 'https://example.com' };

			const result = await executeThreadedWorkflow(
				steps,
				context,
				[]
			);

			expect( result.success ).toBe( true );
			expect( globalStep.handler ).toHaveBeenCalledTimes( 1 );
			// Global state comes from step handler results
			expect( result.globalState ).toHaveProperty( 'globalData' );
			expect( result.threadResults ).toHaveLength( 0 );
		} );

		it( 'should execute thread steps for each provider', async () => {
			const threadStep = {
				id: 'threadStep',
				label: 'Thread Step',
				handler: jest.fn().mockResolvedValue( {
					result: 'success',
				} ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = { setProviderProgress: jest.fn() };
			const providers = [
				{ id: 'provider1', label: 'Provider 1', config: {} },
				{ id: 'provider2', label: 'Provider 2', config: {} },
			];

			const result = await executeThreadedWorkflow(
				steps,
				context,
				providers
			);

			expect( result.success ).toBe( true );
			expect( threadStep.handler ).toHaveBeenCalledTimes( 2 );
			expect( result.threadResults ).toHaveLength( 2 );
			expect( result.successCount ).toBe( 2 );
			expect( result.failureCount ).toBe( 0 );
		} );

		it( 'should execute global then thread steps', async () => {
			const executionOrder = [];

			const globalStep = {
				id: 'globalStep',
				handler: jest.fn().mockImplementation( () => {
					executionOrder.push( 'global' );
					return Promise.resolve( { globalData: 'test' } );
				} ),
				requires: {
					siteUrl: { from: 'initial' },
				},
			};

			const threadStep = {
				id: 'threadStep',
				label: 'Thread Step',
				handler: jest.fn().mockImplementation( () => {
					executionOrder.push( 'thread' );
					return Promise.resolve( { result: 'success' } );
				} ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ globalStep, threadStep ];
			const context = { siteUrl: 'https://example.com', setProviderProgress: jest.fn() };
			const providers = [ { id: 'provider1', label: 'P1', config: {} } ];

			await executeThreadedWorkflow( steps, context, providers );

			expect( executionOrder[ 0 ] ).toBe( 'global' );
			expect( executionOrder[ 1 ] ).toBe( 'thread' );
		} );

		it( 'should handle thread execution errors', async () => {
			const threadStep = {
				id: 'threadStep',
				label: 'Thread Step',
				handler: jest
					.fn()
					.mockRejectedValue( new Error( 'Thread error' ) ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = { setProviderProgress: jest.fn() };
			const providers = [ { id: 'provider1', label: 'P1', config: {} } ];

			const result = await executeThreadedWorkflow(
				steps,
				context,
				providers
			);

			expect( result.success ).toBe( false );
			expect( result.successCount ).toBe( 0 );
			expect( result.failureCount ).toBe( 1 );
			expect( result.threadResults[ 0 ].success ).toBe( false );
			// Error message is present (may be wrapped by error handler/translation)
			expect( result.threadResults[ 0 ].error ).toBeDefined();
			expect( result.threadResults[ 0 ].error.length ).toBeGreaterThan( 0 );
		} );

		it( 'should succeed if at least one thread succeeds', async () => {
			const threadStep = {
				id: 'threadStep',
				label: 'Thread Step',
				handler: jest
					.fn()
					.mockResolvedValueOnce( { result: 'success' } )
					.mockRejectedValueOnce( new Error( 'Failed' ) ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = { setProviderProgress: jest.fn() };
			const providers = [
				{ id: 'provider1', label: 'P1', config: {} },
				{ id: 'provider2', label: 'P2', config: {} },
			];

			const result = await executeThreadedWorkflow(
				steps,
				context,
				providers
			);

			expect( result.success ).toBe( true );
			expect( result.successCount ).toBe( 1 );
			expect( result.failureCount ).toBe( 1 );
		} );

		it( 'should handle zero providers', async () => {
			const globalStep = {
				id: 'globalStep',
				handler: jest.fn().mockResolvedValue( { data: 'test' } ),
				requires: {},
			};

			const steps = [ globalStep ];
			const context = {};
			const providers = [];

			const result = await executeThreadedWorkflow(
				steps,
				context,
				providers
			);

			expect( result.success ).toBe( true );
			expect( result.threadResults ).toHaveLength( 0 );
			// Global state comes from step handler
			expect( result.globalState ).toHaveProperty( 'data' );
		} );

		it( 'should call setProviderProgress for thread steps', async () => {
			const setProviderProgress = jest.fn();

			const threadStep = {
				id: 'uploadFiles',
				label: 'Upload Files',
				handler: jest.fn().mockResolvedValue( { uploaded: 5 } ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = { setProviderProgress };
			const providers = [ { id: 'provider1', label: 'P1', config: {} } ];

			await executeThreadedWorkflow( steps, context, providers );

			// Should be called for completion
			expect( setProviderProgress ).toHaveBeenCalledWith(
				'provider1',
				expect.objectContaining( {
					status: 'complete',
					progress: 100,
				} )
			);
		} );

		it( 'should call setProviderProgress on error', async () => {
			const setProviderProgress = jest.fn();

			const threadStep = {
				id: 'uploadFiles',
				label: 'Upload Files',
				handler: jest
					.fn()
					.mockRejectedValue( new Error( 'Upload failed' ) ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = { setProviderProgress };
			const providers = [ { id: 'provider1', label: 'P1', config: {} } ];

			await executeThreadedWorkflow( steps, context, providers );

			// Should be called with error status
			// Error message may be wrapped by error handler
			expect( setProviderProgress ).toHaveBeenCalledWith(
				'provider1',
				expect.objectContaining( {
					status: 'error',
				} )
			);
			// Verify error is present (may be wrapped)
			const call = setProviderProgress.mock.calls[ 0 ][ 1 ];
			expect( call.error ).toBeDefined();
		} );
	} );
} );
