/**
 * Progress Tracker Tests
 *
 * Tests for progressTracker utility with equal step weights.
 * Progress is tracked in-memory only (no persistence).
 */

import {
	createProgressTracker,
	calculateOverallProgress,
} from '../progressTracker';

describe( 'progressTracker', () => {
	describe( 'createProgressTracker()', () => {
		test( 'should create tracker with equal step weights', () => {
			const stepIds = [ 'step1', 'step2', 'step3' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			expect( tracker ).toBeDefined();
			expect( tracker.updateStepProgress ).toBeDefined();
			expect( tracker.completeStep ).toBeDefined();
			expect( tracker.getProgress ).toBeDefined();
		} );

		test( 'should calculate equal step weight', () => {
			const stepIds = [ 'step1', 'step2', 'step3', 'step4' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );
			const progress = tracker.getProgress();

			expect( progress.stepWeight ).toBe( 25 ); // 100 / 4
		} );

		test( 'should handle empty step list', () => {
			const tracker = createProgressTracker( 'workflow-1', [] );
			const progress = tracker.getProgress();

			expect( progress.stepWeight ).toBe( 0 );
		} );
	} );

	describe( 'updateStepProgress()', () => {
		test( 'should update step progress', () => {
			const stepIds = [ 'step1', 'step2' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			tracker.updateStepProgress( 'step1', 50 );

			const progress = tracker.getProgress();
			expect( progress.stepProgress.step1 ).toBe( 50 );
		} );

		test( 'should clamp progress to 0-100', () => {
			const stepIds = [ 'step1' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			tracker.updateStepProgress( 'step1', -10 );
			expect( tracker.getProgress().stepProgress.step1 ).toBe( 0 );

			tracker.updateStepProgress( 'step1', 150 );
			expect( tracker.getProgress().stepProgress.step1 ).toBe( 100 );
		} );

		test( 'should calculate overall progress correctly', () => {
			const stepIds = [ 'step1', 'step2', 'step3' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			tracker.updateStepProgress( 'step1', 100 );
			tracker.updateStepProgress( 'step2', 50 );
			tracker.updateStepProgress( 'step3', 0 );

			const progress = tracker.getProgress();
			// step1: 100% of 33.33% = 33.33%
			// step2: 50% of 33.33% = 16.67%
			// step3: 0% of 33.33% = 0%
			// Total: ~50%
			expect( progress.overallProgress ).toBeGreaterThanOrEqual( 48 );
			expect( progress.overallProgress ).toBeLessThanOrEqual( 52 );
		} );

		test( 'should ignore unknown step IDs', () => {
			const stepIds = [ 'step1' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			tracker.updateStepProgress( 'unknown-step', 50 );

			const progress = tracker.getProgress();
			expect( progress.stepProgress[ 'unknown-step' ] ).toBeUndefined();
		} );

		test( 'should call onProgressChange callback', () => {
			const stepIds = [ 'step1', 'step2' ];
			const onProgressChange = jest.fn();
			const tracker = createProgressTracker(
				'workflow-1',
				stepIds,
				onProgressChange
			);

			tracker.updateStepProgress( 'step1', 50 );

			expect( onProgressChange ).toHaveBeenCalledWith( {
				stepId: 'step1',
				stepProgress: 50,
				overallProgress: 25,
				progressState: expect.objectContaining( {
					stepProgress: { step1: 50 },
				} ),
			} );
		} );
	} );

	describe( 'completeStep()', () => {
		test( 'should mark step as completed', () => {
			const stepIds = [ 'step1', 'step2' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			tracker.completeStep( 'step1' );

			const progress = tracker.getProgress();
			expect( progress.stepProgress.step1 ).toBe( 100 );
			expect( progress.completedSteps ).toContain( 'step1' );
		} );

		test( 'should not duplicate completed steps', () => {
			const stepIds = [ 'step1' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			tracker.completeStep( 'step1' );
			tracker.completeStep( 'step1' );

			const progress = tracker.getProgress();
			expect(
				progress.completedSteps.filter( ( s ) => s === 'step1' ).length
			).toBe( 1 );
		} );
	} );

	describe( 'clear()', () => {
		test( 'should reset progress to initial state', () => {
			const tracker = createProgressTracker( 'workflow-1', [ 'step1' ] );
			tracker.updateStepProgress( 'step1', 50 );

			tracker.clear();

			const progress = tracker.getProgress();
			expect( progress.overallProgress ).toBe( 0 );
			expect( progress.stepProgress ).toEqual( {} );
			expect( progress.completedSteps ).toEqual( [] );
		} );
	} );

	describe( 'calculateOverallProgress()', () => {
		test( 'should calculate progress with equal weights', () => {
			const stepIds = [ 'step1', 'step2', 'step3' ];
			const stepProgress = {
				step1: 100,
				step2: 50,
				step3: 0,
			};

			const overall = calculateOverallProgress( stepIds, stepProgress );
			expect( overall ).toBeGreaterThanOrEqual( 48 );
			expect( overall ).toBeLessThanOrEqual( 52 );
		} );

		test( 'should return 0 for empty step list', () => {
			const overall = calculateOverallProgress( [], {} );
			expect( overall ).toBe( 0 );
		} );

		test( 'should handle missing step progress', () => {
			const stepIds = [ 'step1', 'step2' ];
			const stepProgress = {
				step1: 100,
			};

			const overall = calculateOverallProgress( stepIds, stepProgress );
			expect( overall ).toBe( 50 ); // step1: 100% of 50% = 50%
		} );
	} );
} );
