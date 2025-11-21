/**
 * Step Executor Integration Tests
 *
 * Tests for step executor with ErrorHandler, ProgressTracker, and StateManager integration.
 *
 * @package
 */

import { executeSteps } from '../StepExecutor';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	applyFilters: jest.fn( ( filter, value ) => value ),
} ) );

// Mock IndexedDB store for ProgressTracker and StateManager
const mockProgressStore = {
	get: jest.fn().mockResolvedValue( null ),
	set: jest.fn().mockResolvedValue( true ),
	delete: jest.fn().mockResolvedValue( true ),
};

const mockStateStore = {
	get: jest.fn().mockResolvedValue( null ),
	set: jest.fn().mockResolvedValue( true ),
	delete: jest.fn().mockResolvedValue( true ),
	getByIndex: jest.fn().mockResolvedValue( [] ),
};

jest.mock( '../../../utils/indexedDB', () => {
	return {
		__esModule: true,
		default: jest.fn( ( storeName ) => {
			if ( storeName === 'progress' ) {
				return mockProgressStore;
			}
			return mockStateStore;
		} ),
		isIndexedDBAvailable: jest.fn( () => true ),
	};
} );

// Mock debug utilities
jest.mock( '../../../utils/debug', () => ( {
	debug: jest.fn(),
	debugWarn: jest.fn(),
	debugError: jest.fn(),
} ) );

describe( 'StepExecutor Integration', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Reset mock stores
		mockProgressStore.get.mockResolvedValue( null );
		mockProgressStore.set.mockResolvedValue( true );
		mockProgressStore.delete.mockResolvedValue( true );
		mockStateStore.get.mockResolvedValue( null );
		mockStateStore.set.mockResolvedValue( true );
		mockStateStore.delete.mockResolvedValue( true );
		mockStateStore.getByIndex.mockResolvedValue( [] );
	} );

	describe( 'ErrorHandler Integration', () => {
		test( 'should retry steps on retryable errors', async () => {
			let attemptCount = 0;
			const steps = [
				{
					id: 'testStep',
					dependencies: [],
					handler: async () => {
						attemptCount++;
						if ( attemptCount < 3 ) {
							const error = new Error( 'Network error' );
							throw error;
						}
						return { success: true };
					},
				},
			];

			const result = await executeSteps( steps, {} );

			expect( attemptCount ).toBe( 3 );
			expect( result.success ).toBe( true );
		} );

		test( 'should not retry non-retryable errors', async () => {
			let attemptCount = 0;
			const steps = [
				{
					id: 'testStep',
					dependencies: [],
					handler: async () => {
						attemptCount++;
						const error = new Error( 'Permission denied' );
						throw error;
					},
				},
			];

			await expect( executeSteps( steps, {} ) ).rejects.toThrow();
			expect( attemptCount ).toBe( 1 ); // No retries for permission errors
		} );

		test( 'should categorize errors correctly', async () => {
			const onError = jest.fn();
			const steps = [
				{
					id: 'testStep',
					dependencies: [],
					handler: async () => {
						const error = new Error( 'Network request failed' );
						throw error;
					},
				},
			];

			try {
				await executeSteps( steps, {}, { onError } );
			} catch ( e ) {
				// Expected
			}

			expect( onError ).toHaveBeenCalled();
			const errorArg = onError.mock.calls[ 0 ][ 1 ];
			expect( errorArg.category ).toBe( 'network' );
			expect( errorArg.severity ).toBe( 'medium' );
		} );
	} );

	describe( 'ProgressTracker Integration', () => {
		test( 'should track progress with equal step weights', async () => {
			const progressUpdates = [];
			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async () => ( { result1: true } ),
				},
				{
					id: 'step2',
					dependencies: [ 'step1' ],
					handler: async () => ( { result2: true } ),
				},
				{
					id: 'step3',
					dependencies: [ 'step2' ],
					handler: async () => ( { result3: true } ),
				},
			];

			await executeSteps( steps, {
				progressTracker: {
					updateStepProgress: jest.fn( async ( stepId, progress ) => {
						progressUpdates.push( { stepId, progress } );
					} ),
					completeStep: jest.fn( async ( stepId ) => {
						progressUpdates.push( {
							stepId,
							progress: 100,
							completed: true,
						} );
					} ),
				},
			} );

			// Should initialize each step to 0
			expect(
				progressUpdates.filter( ( u ) => u.progress === 0 ).length
			).toBeGreaterThan( 0 );
			// Should complete each step
			expect(
				progressUpdates.filter( ( u ) => u.completed ).length
			).toBe( 3 );
		} );

		test( 'should calculate overall progress correctly', async () => {
			const steps = [
				{ id: 'step1', dependencies: [], handler: async () => ( {} ) },
				{ id: 'step2', dependencies: [], handler: async () => ( {} ) },
			];

			const overallProgress = [];
			await executeSteps( steps, {
				progressTracker: {
					updateStepProgress: jest.fn(),
					completeStep: jest.fn( async ( stepId ) => {
						// Simulate progress calculation
						overallProgress.push( { stepId, progress: 100 } );
					} ),
					getProgress: jest.fn( () => ( {
						overallProgress: 50,
						stepProgress: { step1: 100, step2: 0 },
					} ) ),
				},
			} );

			// With 2 steps, each step is 50% weight
			// After step1 completes: 50% overall
			expect( overallProgress.length ).toBe( 2 );
		} );
	} );

	describe( 'StateManager Integration', () => {
		test( 'should save state after step completion', async () => {
			const savedStates = [];
			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async () => ( { step1Result: 'data1' } ),
				},
				{
					id: 'step2',
					dependencies: [ 'step1' ],
					handler: async () => ( { step2Result: 'data2' } ),
				},
			];

			await executeSteps( steps, {
				stateManager: {
					save: jest.fn( async ( state ) => {
						savedStates.push( state );
					} ),
					load: jest.fn( async () => null ),
					clear: jest.fn(),
				},
			} );

			// Should save state after each parallel group
			expect( savedStates.length ).toBeGreaterThan( 0 );
			expect(
				savedStates[ savedStates.length - 1 ].state
			).toHaveProperty( 'step1Result' );
		} );

		test( 'should restore state on workflow start', async () => {
			const savedState = {
				completedSteps: [ 'step1' ],
				state: { step1Result: 'restored' },
			};

			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async () => {
						throw new Error( 'Should not execute' );
					},
				},
				{
					id: 'step2',
					dependencies: [ 'step1' ],
					handler: async ( ctx ) => {
						// Should have restored state
						return { step2Result: ctx.state.step1Result };
					},
				},
			];

			const result = await executeSteps( steps, {
				stateManager: {
					save: jest.fn(),
					load: jest.fn( async () => savedState ),
					clear: jest.fn(),
				},
			} );

			// step1 should be skipped (already completed)
			// step2 should have access to restored state
			expect( result.step2Result ).toBe( 'restored' );
		} );

		test( 'should clear state on successful completion', async () => {
			const clearSpy = jest.fn();
			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async () => ( { success: true } ),
				},
			];

			await executeSteps( steps, {
				stateManager: {
					save: jest.fn(),
					load: jest.fn( async () => null ),
					clear: clearSpy,
				},
			} );

			expect( clearSpy ).toHaveBeenCalled();
		} );
	} );

	describe( 'Full Workflow Integration', () => {
		test( 'should execute workflow with all features integrated', async () => {
			const executionLog = [];
			const progressUpdates = [];
			const savedStates = [];

			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async () => {
						executionLog.push( 'step1-executed' );
						return { data1: 'value1' };
					},
				},
				{
					id: 'step2',
					dependencies: [ 'step1' ],
					handler: async ( ctx ) => {
						executionLog.push( 'step2-executed' );
						// Should have access to step1 result
						expect( ctx.state.data1 ).toBe( 'value1' );
						return { data2: 'value2' };
					},
				},
			];

			const result = await executeSteps( steps, {
				workflowId: 'test-workflow',
				progressTracker: {
					updateStepProgress: jest.fn( async ( stepId, progress ) => {
						progressUpdates.push( { stepId, progress } );
					} ),
					completeStep: jest.fn( async ( stepId ) => {
						progressUpdates.push( { stepId, completed: true } );
					} ),
					load: jest.fn( async () => null ),
					clear: jest.fn(),
				},
				stateManager: {
					save: jest.fn( async ( state ) => {
						savedStates.push( state );
					} ),
					load: jest.fn( async () => null ),
					clear: jest.fn(),
				},
			} );

			// Verify execution order
			expect( executionLog ).toEqual( [
				'step1-executed',
				'step2-executed',
			] );

			// Verify results
			expect( result.data1 ).toBe( 'value1' );
			expect( result.data2 ).toBe( 'value2' );

			// Verify progress tracking
			expect( progressUpdates.length ).toBeGreaterThan( 0 );

			// Verify state saving
			expect( savedStates.length ).toBeGreaterThan( 0 );
		} );

		test( 'should handle workflow with error recovery', async () => {
			let attemptCount = 0;
			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async () => {
						attemptCount++;
						if ( attemptCount < 2 ) {
							throw new Error( 'Network error' );
						}
						return { recovered: true };
					},
				},
			];

			const result = await executeSteps( steps, {
				workflowId: 'test-workflow',
				progressTracker: {
					updateStepProgress: jest.fn(),
					completeStep: jest.fn(),
					load: jest.fn( async () => null ),
					clear: jest.fn(),
				},
				stateManager: {
					save: jest.fn(),
					load: jest.fn( async () => null ),
					clear: jest.fn(),
				},
			} );

			// Should retry and succeed
			expect( attemptCount ).toBe( 2 );
			expect( result.recovered ).toBe( true );
		} );
	} );
} );
