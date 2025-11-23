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
			// Note: Deep clone means these are NOT the same references
			expect( threadContext.api ).not.toBe( globalContext.api );
			expect( threadContext.discoveredAssets ).not.toBe(
				globalContext.discoveredAssets
			);
			expect( threadContext.currentProviderInstance ).toBe(
				providerInstance
			);
			expect( threadContext.providerInstanceConfig ).toEqual( {
				apiKey: 'test',
			} );
		} );

		it( 'should deep clone global context for thread isolation', () => {
			const globalContext = {
				config: { nested: { value: 'original' } },
				items: [ 1, 2, 3 ],
			};

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: {},
			};

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			// Mutate thread context
			threadContext.config.nested.value = 'modified';
			threadContext.items.push( 4 );

			// Global context should NOT be affected (deep clone)
			expect( globalContext.config.nested.value ).toBe( 'original' );
			expect( globalContext.items ).toEqual( [ 1, 2, 3 ] );
		} );

		it( 'should deeply clone Maps with object values', () => {
			const globalContext = {
				dataMap: new Map( [
					[ 'key1', { value: 'original' } ],
					[ 'key2', { nested: { value: 42 } } ],
				] ),
			};

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: {},
			};

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			// Mutate cloned Map's object values
			threadContext.dataMap.get( 'key1' ).value = 'modified';
			threadContext.dataMap.get( 'key2' ).nested.value = 99;

			// Original should NOT be affected
			expect( globalContext.dataMap.get( 'key1' ).value ).toBe(
				'original'
			);
			expect( globalContext.dataMap.get( 'key2' ).nested.value ).toBe(
				42
			);
		} );

		it( 'should deeply clone Arrays with object elements', () => {
			const globalContext = {
				items: [
					{ id: 1, config: { enabled: true } },
					{ id: 2, nested: [ { value: 'original' } ] },
				],
			};

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: {},
			};

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			// Mutate cloned array's objects
			threadContext.items[ 0 ].config.enabled = false;
			threadContext.items[ 1 ].nested[ 0 ].value = 'modified';

			// Original should NOT be affected
			expect( globalContext.items[ 0 ].config.enabled ).toBe( true );
			expect( globalContext.items[ 1 ].nested[ 0 ].value ).toBe(
				'original'
			);
		} );

		it( 'should handle circular references without crashing', () => {
			const globalContext = {
				data: { value: 'test' },
			};
			// Create circular reference
			globalContext.data.self = globalContext.data;

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: {},
			};

			// Should not throw error
			expect( () =>
				buildThreadContext( globalContext, providerInstance )
			).not.toThrow();

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			// Should have circular reference in clone
			expect( threadContext.data.self ).toBe( threadContext.data );
			// But not reference original
			expect( threadContext.data ).not.toBe( globalContext.data );
		} );

		it( 'should clone Date and RegExp objects correctly', () => {
			const testDate = new Date( '2025-01-01' );
			const testRegex = /test-pattern/gi;

			const globalContext = {
				timestamp: testDate,
				pattern: testRegex,
			};

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: {},
			};

			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			// Should be different instances
			expect( threadContext.timestamp ).not.toBe(
				globalContext.timestamp
			);
			expect( threadContext.pattern ).not.toBe( globalContext.pattern );

			// But with same values
			expect( threadContext.timestamp.getTime() ).toBe(
				testDate.getTime()
			);
			expect( threadContext.pattern.source ).toBe( testRegex.source );
			expect( threadContext.pattern.flags ).toBe( testRegex.flags );
		} );

		it( 'should throw error for invalid provider instance', () => {
			const globalContext = { siteUrl: 'https://example.com' };

			// Missing id
			expect( () =>
				buildThreadContext( globalContext, { label: 'Provider 1' } )
			).toThrow( 'Invalid provider instance: missing id' );

			// Null instance
			expect( () => buildThreadContext( globalContext, null ) ).toThrow(
				'Invalid provider instance: missing id'
			);
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

			const result = await executeThreadedWorkflow( steps, context, [] );

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
			const context = {
				siteUrl: 'https://example.com',
				setProviderProgress: jest.fn(),
			};
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
			expect( result.threadResults[ 0 ].error.length ).toBeGreaterThan(
				0
			);
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

		it( 'should handle zero providers with only global steps', async () => {
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

		it( 'should throw error when thread steps exist but no providers', async () => {
			const threadStep = {
				id: 'threadStep',
				label: 'Thread Step',
				handler: jest.fn(),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = {};
			const providers = [];

			await expect(
				executeThreadedWorkflow( steps, context, providers )
			).rejects.toThrow(
				/No provider instances configured, but thread steps require execution/
			);
		} );

		it( 'should return partial success info when some providers fail', async () => {
			const threadStep = {
				id: 'threadStep',
				label: 'Thread Step',
				handler: jest
					.fn()
					.mockResolvedValueOnce( { result: 'success' } )
					.mockRejectedValueOnce( new Error( 'Failed' ) )
					.mockResolvedValueOnce( { result: 'success' } ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = { setProviderProgress: jest.fn() };
			const providers = [
				{ id: 'provider1', label: 'P1', config: {} },
				{ id: 'provider2', label: 'P2', config: {} },
				{ id: 'provider3', label: 'P3', config: {} },
			];

			const result = await executeThreadedWorkflow(
				steps,
				context,
				providers
			);

			expect( result.success ).toBe( true );
			expect( result.partialSuccess ).toBe( true );
			expect( result.allSucceeded ).toBe( false );
			expect( result.successCount ).toBe( 2 );
			expect( result.failureCount ).toBe( 1 );
			expect( result.failedProviders ).toHaveLength( 1 );
			expect( result.failedProviders[ 0 ].providerId ).toBe(
				'provider2'
			);
		} );

		it( 'should return allSucceeded when all providers succeed', async () => {
			const threadStep = {
				id: 'threadStep',
				label: 'Thread Step',
				handler: jest.fn().mockResolvedValue( { result: 'success' } ),
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
			expect( result.partialSuccess ).toBe( false );
			expect( result.allSucceeded ).toBe( true );
			expect( result.successCount ).toBe( 2 );
			expect( result.failureCount ).toBe( 0 );
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
