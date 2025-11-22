/**
 * Tests for GlobalStepCache
 */

import { GlobalStepCache } from '../globalStepCache';

// Mock IndexedDB
class MockIDBDatabase {
	constructor() {
		this.data = new Map();
		this.objectStoreNames = { contains: () => true };
	}

	transaction( storeName, mode ) {
		return new MockIDBTransaction( this.data );
	}
}

class MockIDBTransaction {
	constructor( data ) {
		this.data = data;
	}

	objectStore() {
		return new MockIDBObjectStore( this.data );
	}
}

class MockIDBObjectStore {
	constructor( data ) {
		this.data = data;
	}

	put( value ) {
		const request = new MockIDBRequest();
		setTimeout( () => {
			this.data.set( value.stepId, value );
			request.result = value;
			if ( request.onsuccess ) {
				request.onsuccess( { target: request } );
			}
		}, 0 );
		return request;
	}

	get( key ) {
		const request = new MockIDBRequest();
		setTimeout( () => {
			request.result = this.data.get( key );
			if ( request.onsuccess ) {
				request.onsuccess( { target: request } );
			}
		}, 0 );
		return request;
	}

	clear() {
		const request = new MockIDBRequest();
		setTimeout( () => {
			this.data.clear();
			if ( request.onsuccess ) {
				request.onsuccess( { target: request } );
			}
		}, 0 );
		return request;
	}

	openCursor() {
		const request = new MockIDBRequest();
		setTimeout( () => {
			const entries = Array.from( this.data.entries() );
			let index = 0;

			// If no entries, return null cursor
			if ( entries.length === 0 ) {
				if ( request.onsuccess ) {
					request.onsuccess( { target: { result: null } } );
				}
				return;
			}

			const cursor = {
				value: entries[ 0 ][ 1 ],
				continue: () => {
					index++;
					setTimeout( () => {
						if ( index < entries.length ) {
							cursor.value = entries[ index ][ 1 ];
							if ( request.onsuccess ) {
								request.onsuccess( {
									target: { result: cursor },
								} );
							}
						} else if ( request.onsuccess ) {
							// No more entries
							request.onsuccess( {
								target: { result: null },
							} );
						}
					}, 0 );
				},
				delete: () => {
					if ( index < entries.length ) {
						this.data.delete( entries[ index ][ 0 ] );
					}
				},
			};

			if ( request.onsuccess ) {
				request.onsuccess( { target: { result: cursor } } );
			}
		}, 0 );
		return request;
	}
}

class MockIDBRequest {
	constructor() {
		this.result = null;
		this.error = null;
		this.onsuccess = null;
		this.onerror = null;
	}
}

class MockIDBOpenDBRequest extends MockIDBRequest {
	constructor( db ) {
		super();
		this.db = db;
		setTimeout( () => {
			this.result = this.db;
			if ( this.onsuccess ) {
				this.onsuccess( { target: this } );
			}
		}, 0 );
	}
}

describe( 'GlobalStepCache', () => {
	let cache;
	let mockDB;

	beforeEach( () => {
		mockDB = new MockIDBDatabase();
		global.indexedDB = {
			open: jest.fn( () => new MockIDBOpenDBRequest( mockDB ) ),
		};
		cache = new GlobalStepCache();
	} );

	afterEach( () => {
		delete global.indexedDB;
	} );

	describe( 'initialize', () => {
		it( 'should initialize cache with jobId', async () => {
			await cache.initialize( 'job-123' );
			expect( cache.jobId ).toBe( 'job-123' );
		} );

		it( 'should flush old data on initialization', async () => {
			// Pre-populate with old data
			mockDB.data.set( 'oldStep', {
				stepId: 'oldStep',
				jobId: 'old-job',
				result: {},
			} );

			await cache.initialize( 'new-job' );

			// Old data should be cleared
			expect( mockDB.data.size ).toBe( 0 );
		} );

		it( 'should open IndexedDB database', async () => {
			await cache.initialize( 'job-123' );
			expect( global.indexedDB.open ).toHaveBeenCalledWith(
				'aether-global-step-cache',
				1
			);
		} );
	} );

	describe( 'getStepResult', () => {
		beforeEach( async () => {
			await cache.initialize( 'job-123' );
		} );

		it( 'should return null if step not cached', async () => {
			const result = await cache.getStepResult( 'nonexistent' );
			expect( result ).toBeNull();
		} );

		it( 'should return null if step is still running', async () => {
			mockDB.data.set( 'runningStep', {
				stepId: 'runningStep',
				jobId: 'job-123',
				status: 'running',
				result: null,
			} );

			const result = await cache.getStepResult( 'runningStep' );
			expect( result ).toBeNull();
		} );

		it( 'should return result if step is completed', async () => {
			const cachedResult = { bundlePath: '/tmp/bundle.zip' };
			mockDB.data.set( 'completedStep', {
				stepId: 'completedStep',
				jobId: 'job-123',
				status: 'completed',
				result: cachedResult,
			} );

			const result = await cache.getStepResult( 'completedStep' );
			expect( result ).toEqual( cachedResult );
		} );

		it( 'should return null if step has error status', async () => {
			mockDB.data.set( 'errorStep', {
				stepId: 'errorStep',
				jobId: 'job-123',
				status: 'error',
				error: 'Something went wrong',
			} );

			const result = await cache.getStepResult( 'errorStep' );
			expect( result ).toBeNull();
		} );
	} );

	describe( 'setStepRunning', () => {
		beforeEach( async () => {
			await cache.initialize( 'job-123' );
		} );

		it( 'should acquire lock if step not running', async () => {
			const acquired = await cache.setStepRunning( 'newStep' );
			expect( acquired ).toBe( true );

			const entry = mockDB.data.get( 'newStep' );
			expect( entry ).toEqual( {
				stepId: 'newStep',
				jobId: 'job-123',
				status: 'running',
				timestamp: expect.any( Number ),
				result: null,
			} );
		} );

		it( 'should not acquire lock if step already running', async () => {
			// First provider acquires lock
			mockDB.data.set( 'runningStep', {
				stepId: 'runningStep',
				jobId: 'job-123',
				status: 'running',
				timestamp: Date.now(),
				result: null,
			} );

			// Second provider tries to acquire
			const acquired = await cache.setStepRunning( 'runningStep' );
			expect( acquired ).toBe( false );
		} );

		it( 'should not acquire lock if step already completed', async () => {
			mockDB.data.set( 'completedStep', {
				stepId: 'completedStep',
				jobId: 'job-123',
				status: 'completed',
				result: {},
			} );

			const acquired = await cache.setStepRunning( 'completedStep' );
			expect( acquired ).toBe( false );
		} );
	} );

	describe( 'setStepResult', () => {
		beforeEach( async () => {
			await cache.initialize( 'job-123' );
		} );

		it( 'should store step result with completed status', async () => {
			const result = { bundlePath: '/tmp/bundle.zip' };
			await cache.setStepResult( 'myStep', result );

			const entry = mockDB.data.get( 'myStep' );
			expect( entry ).toEqual( {
				stepId: 'myStep',
				jobId: 'job-123',
				status: 'completed',
				result,
				timestamp: expect.any( Number ),
			} );
		} );

		it( 'should store step error with error status', async () => {
			const error = new Error( 'Step failed' );
			await cache.setStepError( 'failedStep', error );

			const entry = mockDB.data.get( 'failedStep' );
			expect( entry ).toEqual( {
				stepId: 'failedStep',
				jobId: 'job-123',
				status: 'error',
				error: error.message,
				timestamp: expect.any( Number ),
			} );
		} );
	} );

	describe( 'waitForStep', () => {
		beforeEach( async () => {
			await cache.initialize( 'job-123' );
		} );

		it( 'should return immediately if step already completed', async () => {
			const cachedResult = { bundlePath: '/tmp/bundle.zip' };
			mockDB.data.set( 'completedStep', {
				stepId: 'completedStep',
				jobId: 'job-123',
				status: 'completed',
				result: cachedResult,
			} );

			const result = await cache.waitForStep( 'completedStep', 10 );
			expect( result ).toEqual( cachedResult );
		} );

		it( 'should poll until step completes', async () => {
			// Start with running status
			mockDB.data.set( 'pollingStep', {
				stepId: 'pollingStep',
				jobId: 'job-123',
				status: 'running',
				result: null,
			} );

			// Complete after 50ms
			setTimeout( () => {
				mockDB.data.set( 'pollingStep', {
					stepId: 'pollingStep',
					jobId: 'job-123',
					status: 'completed',
					result: { success: true },
				} );
			}, 50 );

			const result = await cache.waitForStep( 'pollingStep', 10 );
			expect( result ).toEqual( { success: true } );
		} );

		it( 'should throw error if step fails', async () => {
			// Start with running status
			mockDB.data.set( 'failingStep', {
				stepId: 'failingStep',
				jobId: 'job-123',
				status: 'running',
				result: null,
			} );

			// Fail after 50ms
			setTimeout( () => {
				mockDB.data.set( 'failingStep', {
					stepId: 'failingStep',
					jobId: 'job-123',
					status: 'error',
					error: 'Step execution failed',
				} );
			}, 50 );

			await expect(
				cache.waitForStep( 'failingStep', 10 )
			).rejects.toThrow( 'Step execution failed' );
		} );

		it( 'should timeout if step never completes', async () => {
			mockDB.data.set( 'hangingStep', {
				stepId: 'hangingStep',
				jobId: 'job-123',
				status: 'running',
				result: null,
			} );

			await expect(
				cache.waitForStep( 'hangingStep', 10, 100 )
			).rejects.toThrow( 'Timeout waiting for step' );
		} );
	} );

	describe( 'clearCache', () => {
		beforeEach( async () => {
			await cache.initialize( 'job-123' );
		} );

		it( 'should only clear data from different jobs or old data', async () => {
			// Add entry from same job (should NOT be cleared)
			mockDB.data.set( 'step1', {
				stepId: 'step1',
				jobId: 'job-123',
				status: 'completed',
				result: {},
				timestamp: Date.now(),
			} );

			// Add entry from different job (should be cleared)
			mockDB.data.set( 'step2', {
				stepId: 'step2',
				jobId: 'different-job',
				status: 'completed',
				result: {},
				timestamp: Date.now(),
			} );

			// Add old entry (should be cleared)
			const TWO_HOURS_AGO = Date.now() - 2 * 60 * 60 * 1000;
			mockDB.data.set( 'step3', {
				stepId: 'step3',
				jobId: 'job-123',
				status: 'completed',
				result: {},
				timestamp: TWO_HOURS_AGO,
			} );

			await cache.clearCache();

			// Only step1 (same job, recent) should remain
			expect( mockDB.data.size ).toBe( 1 );
			expect( mockDB.data.has( 'step1' ) ).toBe( true );
		} );
	} );

	describe( 'concurrent access', () => {
		beforeEach( async () => {
			await cache.initialize( 'job-123' );
		} );

		it( 'should allow only one provider to execute global step', async () => {
			// First provider acquires lock
			const acquired1 = await cache.setStepRunning( 'concurrentStep' );
			expect( acquired1 ).toBe( true );

			// Second provider tries to acquire same lock (share same DB)
			const cache2 = new GlobalStepCache();
			cache2.db = cache.db; // Share database instance
			cache2.jobId = 'job-123';
			const acquired2 = await cache2.setStepRunning( 'concurrentStep' );

			// Second provider should fail
			expect( acquired2 ).toBe( false );
		} );
	} );

	describe( 'job isolation', () => {
		it( 'should not return results from different job', async () => {
			// Cache result for job-1
			await cache.initialize( 'job-1' );
			await cache.setStepResult( 'myStep', { data: 'job-1-data' } );

			// Switch to job-2
			await cache.initialize( 'job-2' );
			const result = await cache.getStepResult( 'myStep' );

			// Should not get job-1's result
			expect( result ).toBeNull();
		} );
	} );
} );
