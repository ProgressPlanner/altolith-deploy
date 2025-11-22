/**
 * Global Step State Tests
 *
 * Tests for module-level step coordination.
 */

import { GlobalStepState } from '../globalStepState';

describe( 'GlobalStepState', () => {
	let state;

	beforeEach( () => {
		// Create fresh instance for each test
		state = new GlobalStepState();
		state.clear( 'test-job-123' );
	} );

	describe( 'clear()', () => {
		it( 'should clear all results', () => {
			state.results.set( 'step1', {
				status: 'completed',
				result: { foo: 'bar' },
				timestamp: Date.now(),
			} );

			state.clear( 'new-job' );

			expect( state.results.size ).toBe( 0 );
			expect( state.jobId ).toBe( 'new-job' );
		} );

		it( 'should remove stale locks', () => {
			const staleLockTime = Date.now() - 11 * 60 * 1000; // 11 minutes ago

			state.results.set( 'step1', {
				status: 'running',
				timestamp: staleLockTime,
			} );

			state.clear( 'test-job' );

			expect( state.results.has( 'step1' ) ).toBe( false );
		} );

		it( 'should NOT preserve recent locks (clear() clears all)', () => {
			const recentTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago

			state.results.set( 'step1', {
				status: 'running',
				timestamp: recentTime,
			} );

			state.clear( 'test-job' );

			// clear() clears ALL results, even recent ones
			expect( state.results.has( 'step1' ) ).toBe( false );
		} );
	} );

	describe( 'lock()', () => {
		it( 'should acquire lock when none exists', () => {
			const acquired = state.lock( 'step1' );

			expect( acquired ).toBe( true );
			expect( state.results.has( 'step1' ) ).toBe( true );
			expect( state.results.get( 'step1' ).status ).toBe( 'running' );
		} );

		it( 'should fail to acquire lock when already held', () => {
			state.lock( 'step1' );
			const acquired = state.lock( 'step1' );

			expect( acquired ).toBe( false );
		} );

		it( 'should fail to acquire lock when step completed', () => {
			state.results.set( 'step1', {
				status: 'completed',
				result: {},
				timestamp: Date.now(),
			} );

			const acquired = state.lock( 'step1' );

			expect( acquired ).toBe( false );
		} );
	} );

	describe( 'unlock()', () => {
		it( 'should remove lock', () => {
			state.lock( 'step1' );
			state.unlock( 'step1' );

			expect( state.results.has( 'step1' ) ).toBe( false );
		} );
	} );

	describe( 'get()', () => {
		it( 'should return null when step not completed', () => {
			expect( state.get( 'step1' ) ).toBe( null );
		} );

		it( 'should return null when step is running', () => {
			state.lock( 'step1' );

			expect( state.get( 'step1' ) ).toBe( null );
		} );

		it( 'should return result when step completed', () => {
			const result = { foo: 'bar', count: 42 };
			state.set( 'step1', result );

			expect( state.get( 'step1' ) ).toEqual( result );
		} );

		it( 'should preserve class instances', () => {
			class TestClass {
				getValue() {
					return 'test-value';
				}
			}

			const instance = new TestClass();
			state.set( 'step1', { data: instance } );

			const retrieved = state.get( 'step1' );
			expect( retrieved.data ).toBe( instance );
			expect( retrieved.data.getValue() ).toBe( 'test-value' );
		} );
	} );

	describe( 'set()', () => {
		it( 'should store result and mark as completed', () => {
			const result = { data: 'test' };
			state.set( 'step1', result );

			const entry = state.results.get( 'step1' );
			expect( entry.status ).toBe( 'completed' );
			expect( entry.result ).toEqual( result );
			expect( entry.timestamp ).toBeDefined();
		} );

		it( 'should replace running lock', () => {
			state.lock( 'step1' );

			const result = { data: 'test' };
			state.set( 'step1', result );

			expect( state.results.get( 'step1' ).status ).toBe( 'completed' );
			expect( state.get( 'step1' ) ).toEqual( result );
		} );
	} );

	describe( 'setError()', () => {
		it( 'should store error', () => {
			const error = new Error( 'Test error' );
			state.setError( 'step1', error );

			const entry = state.results.get( 'step1' );
			expect( entry.status ).toBe( 'error' );
			expect( entry.error ).toBe( 'Test error' );
		} );

		it( 'should handle string errors', () => {
			state.setError( 'step1', 'String error' );

			const entry = state.results.get( 'step1' );
			expect( entry.error ).toBe( 'String error' );
		} );
	} );

	describe( 'wait()', () => {
		it( 'should return immediately if result exists', async () => {
			const result = { data: 'test' };
			state.set( 'step1', result );

			const retrieved = await state.wait( 'step1' );

			expect( retrieved ).toEqual( result );
		} );

		it( 'should throw on error status', async () => {
			state.setError( 'step1', new Error( 'Test error' ) );

			await expect( state.wait( 'step1' ) ).rejects.toThrow(
				'Test error'
			);
		} );

		it( 'should wait and return result when completed by another provider', async () => {
			// Simulate another provider completing the step after 100ms
			setTimeout( () => {
				state.set( 'step1', { data: 'completed' } );
			}, 100 );

			const result = await state.wait( 'step1' );

			expect( result ).toEqual( { data: 'completed' } );
		} );

		// Note: Timeout test skipped - would take 5 minutes to run
		// The wait() method has a 5-minute timeout in production
	} );

	describe( 'getState()', () => {
		it( 'should return current state information', () => {
			state.set( 'step1', { data: 'test' } );
			state.lock( 'step2' );

			const stateInfo = state.getState();

			expect( stateInfo.jobId ).toBe( 'test-job-123' );
			expect( stateInfo.stepCount ).toBe( 2 );
			expect( stateInfo.steps ).toHaveLength( 2 );
			expect( stateInfo.hasBroadcastChannel ).toBeDefined();
		} );

		it( 'should include step details', () => {
			state.set( 'step1', { data: 'test' } );

			const stateInfo = state.getState();
			const step1Info = stateInfo.steps.find(
				( s ) => s.stepId === 'step1'
			);

			expect( step1Info.status ).toBe( 'completed' );
			expect( step1Info.hasResult ).toBe( true );
			expect( step1Info.error ).toBe( null );
		} );
	} );

	describe( 'BroadcastChannel integration', () => {
		it( 'should handle BroadcastChannel not available', () => {
			// BroadcastChannel might not be available in test environment
			expect( () => new GlobalStepState() ).not.toThrow();
		} );
	} );
} );
