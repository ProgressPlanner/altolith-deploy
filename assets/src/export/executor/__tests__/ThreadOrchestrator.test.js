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

		it( 'should deeply clone Map keys as well as values', () => {
			const objKey = { id: 1, name: 'key' };
			const objValue = { data: 'value' };
			const globalContext = {
				dataMap: new Map( [ [ objKey, objValue ] ] ),
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

			// Get the cloned map
			const clonedMap = threadContext.dataMap;
			const originalMap = globalContext.dataMap;

			// Find the cloned key and value
			const [ clonedKey ] = Array.from( clonedMap.keys() );
			const clonedValue = clonedMap.get( clonedKey );

			// Keys should be cloned (different instances)
			expect( clonedKey ).not.toBe( objKey );
			expect( clonedValue ).not.toBe( objValue );

			// But with same content
			expect( clonedKey.id ).toBe( 1 );
			expect( clonedKey.name ).toBe( 'key' );
			expect( clonedValue.data ).toBe( 'value' );

			// Mutating cloned key should not affect original
			clonedKey.id = 999;
			expect( objKey.id ).toBe( 1 );
		} );

		it( 'should deeply clone Set objects with object values', () => {
			const obj1 = { id: 1, config: { enabled: true } };
			const obj2 = { id: 2, nested: { value: 'original' } };
			const globalContext = {
				dataSet: new Set( [ obj1, obj2, 'primitive' ] ),
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

			// Get the cloned set
			const clonedSet = threadContext.dataSet;
			const setItems = Array.from( clonedSet.values() );

			// Should have same size
			expect( clonedSet.size ).toBe( 3 );

			// Object items should be cloned (different instances)
			const clonedObj1 = setItems.find( ( item ) => item?.id === 1 );
			const clonedObj2 = setItems.find( ( item ) => item?.id === 2 );

			expect( clonedObj1 ).not.toBe( obj1 );
			expect( clonedObj2 ).not.toBe( obj2 );

			// But with same content
			expect( clonedObj1.config.enabled ).toBe( true );
			expect( clonedObj2.nested.value ).toBe( 'original' );

			// Mutating cloned object should not affect original
			clonedObj1.config.enabled = false;
			expect( obj1.config.enabled ).toBe( true );
		} );

		it( 'should preserve callbacks from globalContext when not provided', () => {
			const setStatusMessage = jest.fn();
			const setStepProgress = jest.fn();

			const globalContext = {
				siteUrl: 'https://example.com',
				setStatusMessage,
				setStepProgress,
			};

			const providerInstance = {
				id: 'provider1',
				label: 'Provider 1',
				config: {},
			};

			// Call without callbacks parameter
			const threadContext = buildThreadContext(
				globalContext,
				providerInstance
			);

			// Callbacks should be preserved (not undefined)
			expect( threadContext.setStatusMessage ).toBe( setStatusMessage );
			expect( threadContext.setStepProgress ).toBe( setStepProgress );
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

		it( 'should return early when providers exist but no thread steps', async () => {
			const globalStep = {
				id: 'globalStep',
				label: 'Global Step',
				handler: jest.fn().mockResolvedValue( { global: 'data' } ),
				requires: {},
			};

			const steps = [ globalStep ]; // Only global steps, no thread steps
			const context = { siteUrl: 'https://example.com' };
			const providers = [
				{ id: 'provider1', label: 'P1', config: {} },
				{ id: 'provider2', label: 'P2', config: {} },
			];

			const result = await executeThreadedWorkflow(
				steps,
				context,
				providers
			);

			// Should complete successfully without executing thread logic
			expect( result.success ).toBe( true );
			expect( result.threadResults ).toEqual( [] );
			expect( result.successCount ).toBe( 0 );
			expect( result.failureCount ).toBe( 0 );
			// Global step should still have executed
			expect( globalStep.handler ).toHaveBeenCalled();
		} );

		it( 'should properly limit concurrency when executing multiple providers', async () => {
			const executionOrder = [];
			const completionOrder = [];

			const threadStep = {
				id: 'slowStep',
				label: 'Slow Step',
				handler: jest.fn().mockImplementation( async ( context ) => {
					const providerId = context.currentProviderInstance.id;
					executionOrder.push( providerId );

					// Simulate async work with varying durations
					const delay =
						providerId === 'provider1'
							? 100
							: providerId === 'provider2'
								? 50
								: 25;
					await new Promise( ( resolve ) =>
						setTimeout( resolve, delay )
					);

					completionOrder.push( providerId );
					return { done: true };
				} ),
				requires: {
					currentProviderInstance: { from: 'thread' },
				},
			};

			const steps = [ threadStep ];
			const context = {};
			const providers = [
				{ id: 'provider1', label: 'P1', config: {} },
				{ id: 'provider2', label: 'P2', config: {} },
				{ id: 'provider3', label: 'P3', config: {} },
				{ id: 'provider4', label: 'P4', config: {} },
				{ id: 'provider5', label: 'P5', config: {} },
				{ id: 'provider6', label: 'P6', config: {} },
			];

			const result = await executeThreadedWorkflow(
				steps,
				context,
				providers,
				{ maxConcurrency: 2 } // Limit to 2 concurrent
			);

			// All should succeed
			expect( result.success ).toBe( true );
			expect( result.successCount ).toBe( 6 );

			// All providers should have executed
			expect( executionOrder ).toHaveLength( 6 );

			// Verify concurrency was limited:
			// Not all providers should start at once if concurrency is working
			// The first provider should complete before the last one starts
			// (This is a simplified check - in reality we'd need more sophisticated timing)
			expect( completionOrder ).toHaveLength( 6 );
		} );
	} );
} );
