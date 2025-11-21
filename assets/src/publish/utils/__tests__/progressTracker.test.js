/**
 * Progress Tracker Tests
 *
 * Tests for progressTracker utility with equal step weights and IndexedDB persistence.
 *
 * @package
 */

import {
	createProgressTracker,
	calculateOverallProgress,
} from '../progressTracker';

// Mock IndexedDB
const mockIndexedDB = () => {
	const store = new Map();
	const requestResult = null;

	return {
		open: jest.fn( ( name, version ) => {
			const request = {
				result: {
					objectStoreNames: {
						contains: jest.fn( () => false ),
					},
					createObjectStore: jest.fn( () => ( {
						createIndex: jest.fn(),
					} ) ),
					transaction: jest.fn( () => ( {
						objectStore: jest.fn( () => ( {
							put: jest.fn( ( data ) => {
								store.set( data.workflowId, data );
								return {
									onsuccess: null,
									onerror: null,
									result: data,
								};
							} ),
							get: jest.fn( ( key ) => {
								const result = store.get( key ) || null;
								return {
									onsuccess: null,
									onerror: null,
									result,
								};
							} ),
							delete: jest.fn( ( key ) => {
								store.delete( key );
								return {
									onsuccess: null,
									onerror: null,
								};
							} ),
						} ) ),
					} ) ),
				},
				onsuccess: null,
				onerror: null,
				onupgradeneeded: null,
			};

			// Simulate async behavior
			setTimeout( () => {
				if ( request.onsuccess ) {
					request.onsuccess();
				}
			}, 0 );

			return request;
		} ),
	};
};

// Mock IndexedDB globally
global.indexedDB = mockIndexedDB();

describe( 'progressTracker', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

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
		test( 'should update step progress', async () => {
			const stepIds = [ 'step1', 'step2' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			await tracker.updateStepProgress( 'step1', 50 );

			const progress = tracker.getProgress();
			expect( progress.stepProgress.step1 ).toBe( 50 );
		} );

		test( 'should clamp progress to 0-100', async () => {
			const stepIds = [ 'step1' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			await tracker.updateStepProgress( 'step1', -10 );
			expect( tracker.getProgress().stepProgress.step1 ).toBe( 0 );

			await tracker.updateStepProgress( 'step1', 150 );
			expect( tracker.getProgress().stepProgress.step1 ).toBe( 100 );
		} );

		test( 'should calculate overall progress correctly', async () => {
			const stepIds = [ 'step1', 'step2', 'step3' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			await tracker.updateStepProgress( 'step1', 100 );
			await tracker.updateStepProgress( 'step2', 50 );
			await tracker.updateStepProgress( 'step3', 0 );

			const progress = tracker.getProgress();
			// step1: 100% of 33.33% = 33.33%
			// step2: 50% of 33.33% = 16.67%
			// step3: 0% of 33.33% = 0%
			// Total: ~50%
			expect( progress.overallProgress ).toBeGreaterThanOrEqual( 48 );
			expect( progress.overallProgress ).toBeLessThanOrEqual( 52 );
		} );

		test( 'should ignore unknown step IDs', async () => {
			const stepIds = [ 'step1' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			await tracker.updateStepProgress( 'unknown-step', 50 );

			const progress = tracker.getProgress();
			expect( progress.stepProgress[ 'unknown-step' ] ).toBeUndefined();
		} );
	} );

	describe( 'completeStep()', () => {
		test( 'should mark step as completed', async () => {
			const stepIds = [ 'step1', 'step2' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			await tracker.completeStep( 'step1' );

			const progress = tracker.getProgress();
			expect( progress.stepProgress.step1 ).toBe( 100 );
			expect( progress.completedSteps ).toContain( 'step1' );
		} );

		test( 'should not duplicate completed steps', async () => {
			const stepIds = [ 'step1' ];
			const tracker = createProgressTracker( 'workflow-1', stepIds );

			await tracker.completeStep( 'step1' );
			await tracker.completeStep( 'step1' );

			const progress = tracker.getProgress();
			expect(
				progress.completedSteps.filter( ( s ) => s === 'step1' ).length
			).toBe( 1 );
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
