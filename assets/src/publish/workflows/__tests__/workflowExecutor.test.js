/**
 * Workflow Executor Tests
 *
 * @package
 */

import {
	executeWorkflow,
	calculateProgress,
	validateWorkflowStructure,
} from '../workflowExecutor';

// Mock @wordpress/hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

describe( 'workflowExecutor', () => {
	describe( 'executeWorkflow', () => {
		test( 'executes sequential workflow successfully', async () => {
			const workflow = [ [ [ 'step1', 50 ] ], [ [ 'step2', 50 ] ] ];

			const results = [];
			const handlers = {
				step1: jest.fn( async ( context ) => {
					results.push( 'step1' );
					return { step1Data: 'data1' };
				} ),
				step2: jest.fn( async ( context ) => {
					results.push( 'step2' );
					return { step2Data: 'data2' };
				} ),
			};

			const context = { testContext: true };
			const state = await executeWorkflow( workflow, handlers, context );

			// Steps executed in order
			expect( results ).toEqual( [ 'step1', 'step2' ] );

			// Handlers called with context
			expect( handlers.step1 ).toHaveBeenCalledWith(
				expect.objectContaining( {
					testContext: true,
					stepId: 'step1',
					weight: 50,
				} )
			);

			// State accumulated (may include cumulativeProgress)
			expect( state ).toMatchObject( {
				step1Data: 'data1',
				step2Data: 'data2',
			} );
		} );

		test( 'executes parallel steps in same phase', async () => {
			const workflow = [
				[
					[ 'step1', 25 ],
					[ 'step2', 25 ],
				],
			];

			const startTimes = {};
			const handlers = {
				step1: jest.fn( async () => {
					startTimes.step1 = Date.now();
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 10 )
					);
					return { step1: true };
				} ),
				step2: jest.fn( async () => {
					startTimes.step2 = Date.now();
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 10 )
					);
					return { step2: true };
				} ),
			};

			const context = {};
			await executeWorkflow( workflow, handlers, context );

			// Both steps should start at approximately the same time
			const timeDiff = Math.abs( startTimes.step1 - startTimes.step2 );
			expect( timeDiff ).toBeLessThan( 50 ); // Within 50ms

			// Both handlers called
			expect( handlers.step1 ).toHaveBeenCalled();
			expect( handlers.step2 ).toHaveBeenCalled();
		} );

		test( 'calls lifecycle callbacks', async () => {
			const workflow = [ [ [ 'step1', 50 ] ], [ [ 'step2', 50 ] ] ];

			const handlers = {
				step1: jest.fn( async () => ( {} ) ),
				step2: jest.fn( async () => ( {} ) ),
			};

			const callbacks = {
				onPhaseStart: jest.fn(),
				onPhaseComplete: jest.fn(),
				onStepStart: jest.fn(),
				onStepComplete: jest.fn(),
				onProgress: jest.fn(),
			};

			await executeWorkflow( workflow, handlers, {}, callbacks );

			// Phase callbacks
			expect( callbacks.onPhaseStart ).toHaveBeenCalledTimes( 2 );
			expect( callbacks.onPhaseComplete ).toHaveBeenCalledTimes( 2 );

			// Step callbacks
			expect( callbacks.onStepStart ).toHaveBeenCalledTimes( 2 );
			expect( callbacks.onStepComplete ).toHaveBeenCalledTimes( 2 );

			// Progress callback
			expect( callbacks.onProgress ).toHaveBeenCalled();
		} );

		test( 'throws error if handler fails', async () => {
			const workflow = [ [ [ 'step1', 100 ] ] ];

			const handlers = {
				step1: jest.fn( async () => {
					throw new Error( 'Step failed' );
				} ),
			};

			await expect(
				executeWorkflow( workflow, handlers, {} )
			).rejects.toThrow( 'Step step1 failed' );
		} );

		test( 'throws error if handler missing', async () => {
			const workflow = [ [ [ 'step1', 100 ] ] ];
			const handlers = {}; // No handler for step1

			await expect(
				executeWorkflow( workflow, handlers, {} )
			).rejects.toThrow( 'No handler found for step: step1' );
		} );

		test( 'passes step-specific context to handlers', async () => {
			const workflow = [ [ [ 'step1', 50 ] ] ];

			const handlers = {
				step1: jest.fn( async ( context ) => context ),
			};

			const context = { shared: 'data' };
			await executeWorkflow( workflow, handlers, context );

			expect( handlers.step1 ).toHaveBeenCalledWith(
				expect.objectContaining( {
					shared: 'data',
					stepId: 'step1',
					weight: 50,
					cumulativeProgress: 0,
				} )
			);
		} );
	} );

	describe( 'calculateProgress', () => {
		test( 'calculates progress at start of step', () => {
			expect( calculateProgress( 0, 50, 0 ) ).toBe( 0 );
			expect( calculateProgress( 50, 50, 0 ) ).toBe( 50 );
		} );

		test( 'calculates progress at end of step', () => {
			expect( calculateProgress( 0, 50, 100 ) ).toBe( 50 );
			expect( calculateProgress( 50, 50, 100 ) ).toBe( 100 );
		} );

		test( 'calculates progress mid-step', () => {
			expect( calculateProgress( 0, 50, 50 ) ).toBe( 25 );
			expect( calculateProgress( 50, 30, 50 ) ).toBe( 65 );
		} );

		test( 'clamps progress to 100', () => {
			expect( calculateProgress( 95, 10, 100 ) ).toBe( 100 );
		} );

		test( 'rounds progress to integer', () => {
			expect( calculateProgress( 0, 33, 50 ) ).toBe( 17 ); // 16.5 rounded
		} );
	} );

	describe( 'validateWorkflowStructure', () => {
		test( 'validates correct workflow', () => {
			const workflow = [ [ [ 'step1', 50 ] ], [ [ 'step2', 50 ] ] ];
			const handlers = {
				step1: jest.fn(),
				step2: jest.fn(),
			};

			const result = validateWorkflowStructure( workflow, handlers );

			expect( result.isValid ).toBe( true );
			expect( result.errors ).toEqual( [] );
		} );

		test( 'detects non-array workflow', () => {
			const result = validateWorkflowStructure( 'not-array', {} );

			expect( result.isValid ).toBe( false );
			expect( result.errors ).toContain( 'Workflow must be an array' );
		} );

		test( 'detects non-array phase', () => {
			const workflow = [ 'not-array' ];
			const handlers = {};

			const result = validateWorkflowStructure( workflow, handlers );

			expect( result.isValid ).toBe( false );
			expect( result.errors[ 0 ] ).toContain(
				'Phase 0 must be an array'
			);
		} );

		test( 'detects empty phase', () => {
			const workflow = [ [] ];
			const handlers = {};

			const result = validateWorkflowStructure( workflow, handlers );

			expect( result.isValid ).toBe( false );
			expect( result.errors[ 0 ] ).toContain( 'Phase 0 is empty' );
		} );

		test( 'detects invalid step format', () => {
			const workflow = [ [ 'invalid' ] ];
			const handlers = {};

			const result = validateWorkflowStructure( workflow, handlers );

			expect( result.isValid ).toBe( false );
			expect( result.errors[ 0 ] ).toContain(
				'must be [stepId, weight]'
			);
		} );

		test( 'detects non-string stepId', () => {
			const workflow = [ [ [ 123, 50 ] ] ];
			const handlers = {};

			const result = validateWorkflowStructure( workflow, handlers );

			expect( result.isValid ).toBe( false );
			expect( result.errors[ 0 ] ).toContain( 'stepId must be a string' );
		} );

		test( 'detects invalid weight', () => {
			const workflow = [
				[ [ 'step1', -10 ] ], // Negative
				[ [ 'step2', 0 ] ], // Zero
				[ [ 'step3', 101 ] ], // Too large
				[ [ 'step4', 'not-number' ] ], // Not number
			];
			const handlers = {
				step1: jest.fn(),
				step2: jest.fn(),
				step3: jest.fn(),
				step4: jest.fn(),
			};

			const result = validateWorkflowStructure( workflow, handlers );

			expect( result.isValid ).toBe( false );
			expect( result.errors.length ).toBeGreaterThan( 0 );
			result.errors.forEach( ( error ) => {
				expect( error ).toContain( 'weight' );
			} );
		} );

		test( 'detects missing handler', () => {
			const workflow = [ [ [ 'step1', 100 ] ] ];
			const handlers = {}; // No handler for step1

			const result = validateWorkflowStructure( workflow, handlers );

			expect( result.isValid ).toBe( false );
			expect( result.errors[ 0 ] ).toContain( 'no handler found' );
		} );
	} );
} );
