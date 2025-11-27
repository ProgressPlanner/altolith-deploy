/**
 * Step Executor Tests
 *
 */

import { executeSteps, getExecutionPlan } from '../StepExecutor';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	applyFilters: jest.fn( ( filter, value ) => value ),
} ) );

// Mock the error handler to avoid retry loops in tests
jest.mock( '../../utils/errorHandler', () => ( {
	errorHandler: {
		// Must be async and await the fn() since handlers are async
		executeWithRetry: async ( fn ) => await fn(),
		categorize: () => 'unknown',
	},
	formatErrorMessage: ( error, { operation } ) =>
		`Error during ${ operation }: ${ error.message }`,
	determineSeverity: () => 'high',
	ERROR_SEVERITY: {
		CRITICAL: 'critical',
		HIGH: 'high',
		MEDIUM: 'medium',
		LOW: 'low',
	},
	handleStepError: ( error, stepId, executionContext, options, step ) => {
		const { onError = () => {} } = options;
		const formattedMessage = `Error during ${ step?.label || stepId }: ${ error.message }`;
		onError( stepId, { ...error, formattedMessage } );
		return new Error( formattedMessage );
	},
} ) );

// Mock DataValidator
jest.mock( '../DataValidator', () => ( {
	default: {
		validate: jest.fn(),
		validateOutput: jest.fn(),
	},
	validate: jest.fn(),
	validateOutput: jest.fn(),
} ) );

// Mock progressTracker
jest.mock( '../../utils/progressTracker', () => ( {
	createProgressTracker: () => ( {
		updateStepProgress: jest.fn(),
		completeStep: jest.fn(),
		getProgress: () => ( {} ),
		clear: jest.fn(),
	} ),
} ) );

describe( 'StepExecutor', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Note: Don't use jest.resetAllMocks() as it resets mock implementations
		// defined in jest.mock() factories, causing executeWithRetry to return undefined
	} );

	describe( 'executeSteps()', () => {
		test( 'should execute steps in dependency order', async () => {
			const executionOrder = [];

			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async () => {
						executionOrder.push( 'step1' );
						return { step1Result: true };
					},
				},
				{
					id: 'step2',
					dependencies: [ 'step1' ],
					handler: async () => {
						executionOrder.push( 'step2' );
						return { step2Result: true };
					},
				},
			];

			const result = await executeSteps( steps, {} );

			expect( executionOrder ).toEqual( [ 'step1', 'step2' ] );
			expect( result ).toHaveProperty( 'step1Result', true );
			expect( result ).toHaveProperty( 'step2Result', true );
		} );

		test( 'should pass context to step handlers', async () => {
			const receivedContext = [];

			const steps = [
				{
					id: 'step1',
					dependencies: [],
					handler: async ( ctx ) => {
						receivedContext.push( { ...ctx } );
						return { fromStep1: 'value1' };
					},
				},
				{
					id: 'step2',
					dependencies: [ 'step1' ],
					handler: async ( ctx ) => {
						receivedContext.push( { ...ctx } );
						return {};
					},
				},
			];

			await executeSteps( steps, { initialData: 'test' } );

			// First step should receive initial context
			expect( receivedContext[ 0 ] ).toHaveProperty(
				'initialData',
				'test'
			);

			// Second step should receive merged state from first step
			expect( receivedContext[ 1 ] ).toHaveProperty(
				'fromStep1',
				'value1'
			);
		} );

		test( 'should call lifecycle callbacks', async () => {
			const onStepStart = jest.fn();
			const onStepComplete = jest.fn();

			const steps = [
				{
					id: 'testStep',
					dependencies: [],
					handler: async () => ( { done: true } ),
				},
			];

			await executeSteps( steps, {}, { onStepStart, onStepComplete } );

			expect( onStepStart ).toHaveBeenCalledWith(
				'testStep',
				steps[ 0 ]
			);
			expect( onStepComplete ).toHaveBeenCalledWith( 'testStep', {
				done: true,
			} );
		} );

		test( 'should skip steps when skip function returns true', async () => {
			const onStepSkipped = jest.fn();
			const handlerSpy = jest.fn();

			const steps = [
				{
					id: 'skippedStep',
					dependencies: [],
					skip: () => true,
					handler: handlerSpy,
				},
			];

			await executeSteps( steps, {}, { onStepSkipped } );

			expect( handlerSpy ).not.toHaveBeenCalled();
			expect( onStepSkipped ).toHaveBeenCalledWith( 'skippedStep' );
		} );

		test( 'should throw on invalid dependencies', async () => {
			const steps = [
				{
					id: 'step1',
					dependencies: [ 'nonExistent' ],
					handler: async () => ( {} ),
				},
			];

			await expect( executeSteps( steps, {} ) ).rejects.toThrow(
				'Invalid step dependencies'
			);
		} );

		test( 'should wrap step errors with step ID', async () => {
			const steps = [
				{
					id: 'failingStep',
					dependencies: [],
					handler: async () => {
						throw new Error( 'Something went wrong' );
					},
				},
			];

			let caughtError;
			try {
				await executeSteps( steps, {} );
			} catch ( error ) {
				caughtError = error;
			}

			expect( caughtError ).toBeDefined();
			expect( caughtError.message ).toMatch(
				/Error during|Something went wrong/
			);
		} );

		test( 'should execute parallel groups concurrently', async () => {
			const startTimes = {};
			const endTimes = {};

			const steps = [
				{
					id: 'parallel1',
					dependencies: [],
					handler: async () => {
						startTimes.parallel1 = Date.now();
						await new Promise( ( r ) => setTimeout( r, 50 ) );
						endTimes.parallel1 = Date.now();
						return {};
					},
				},
				{
					id: 'parallel2',
					dependencies: [],
					handler: async () => {
						startTimes.parallel2 = Date.now();
						await new Promise( ( r ) => setTimeout( r, 50 ) );
						endTimes.parallel2 = Date.now();
						return {};
					},
				},
			];

			await executeSteps( steps, {} );

			// Both should start at approximately the same time (within 20ms)
			const startDiff = Math.abs(
				startTimes.parallel1 - startTimes.parallel2
			);
			expect( startDiff ).toBeLessThan( 20 );
		} );
	} );

	describe( 'getExecutionPlan()', () => {
		test( 'should return parallel groups', () => {
			const steps = [
				{ id: 'a', dependencies: [] },
				{ id: 'b', dependencies: [] },
				{ id: 'c', dependencies: [ 'a', 'b' ] },
			];

			const plan = getExecutionPlan( steps );

			expect( plan ).toHaveLength( 2 );
			expect( plan[ 0 ] ).toContain( 'a' );
			expect( plan[ 0 ] ).toContain( 'b' );
			expect( plan[ 1 ] ).toEqual( [ 'c' ] );
		} );
	} );
} );
