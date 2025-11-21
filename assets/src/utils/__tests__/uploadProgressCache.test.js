/**
 * Upload Progress Cache Tests
 *
 * @package
 */

import {
	UploadProgressCache,
	SESSION_STATUS,
	getUploadProgressCache,
} from '../uploadProgressCache';

// Mock IndexedDB
jest.mock( '../indexedDB', () => {
	const mockStore = new Map();

	return jest.fn().mockImplementation( () => ( {
		get: jest.fn( ( key ) => Promise.resolve( mockStore.get( key ) ) ),
		set: jest.fn( ( key, value ) => {
			mockStore.set( key, value );
			return Promise.resolve();
		} ),
		delete: jest.fn( ( key ) => {
			mockStore.delete( key );
			return Promise.resolve();
		} ),
		getAll: jest.fn( () =>
			Promise.resolve( Array.from( mockStore.values() ) )
		),
		deleteOlderThan: jest.fn( () => Promise.resolve( 0 ) ),
		clear: jest.fn( () => {
			mockStore.clear();
			return Promise.resolve( true );
		} ),
		_mockStore: mockStore,
	} ) );
} );

describe( 'uploadProgressCache', () => {
	let cache;

	beforeEach( () => {
		jest.clearAllMocks();
		cache = new UploadProgressCache();
	} );

	describe( 'SESSION_STATUS', () => {
		test( 'should export session status constants', () => {
			expect( SESSION_STATUS.IN_PROGRESS ).toBe( 'in_progress' );
			expect( SESSION_STATUS.PAUSED ).toBe( 'paused' );
			expect( SESSION_STATUS.COMPLETED ).toBe( 'completed' );
			expect( SESSION_STATUS.FAILED ).toBe( 'failed' );
		} );
	} );

	describe( 'generateSessionId()', () => {
		test( 'should generate unique session IDs', () => {
			const id1 = cache.generateSessionId();
			const id2 = cache.generateSessionId();

			expect( id1 ).not.toBe( id2 );
			expect( id1 ).toMatch( /^\d+-[a-z0-9]+$/ );
		} );
	} );

	describe( 'createSession()', () => {
		test( 'should create a new session with defaults', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			expect( session.sessionId ).toBeDefined();
			expect( session.providerId ).toBe( 'test-provider' );
			expect( session.status ).toBe( SESSION_STATUS.IN_PROGRESS );
			expect( session.urls ).toEqual( [] );
			expect( session.progress.totalFiles ).toBe( 0 );
			expect( session.uploadedFilesList ).toEqual( [] );
			expect( session.completedSteps ).toEqual( [] );
		} );

		test( 'should create session with custom options', async () => {
			const session = await cache.createSession( {
				providerId: 'my-provider',
				urls: [ 'https://example.com' ],
				exportTypes: { static: true },
			} );

			expect( session.urls ).toEqual( [ 'https://example.com' ] );
			expect( session.exportTypes ).toEqual( { static: true } );
		} );
	} );

	describe( 'getSession()', () => {
		test( 'should return null for non-existent session', async () => {
			const session = await cache.getSession( 'non-existent' );
			expect( session ).toBeNull();
		} );

		test( 'should return session if exists', async () => {
			const created = await cache.createSession( {
				providerId: 'test-provider',
			} );

			const retrieved = await cache.getSession( created.sessionId );
			expect( retrieved.sessionId ).toBe( created.sessionId );
		} );
	} );

	describe( 'updateSession()', () => {
		test( 'should update progress', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			const result = await cache.updateSession( session.sessionId, {
				progress: { totalFiles: 10, uploadedFiles: 5 },
			} );

			expect( result ).toBe( true );
			const updated = await cache.getSession( session.sessionId );
			expect( updated.progress.totalFiles ).toBe( 10 );
			expect( updated.progress.uploadedFiles ).toBe( 5 );
		} );

		test( 'should add uploaded files', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			await cache.updateSession( session.sessionId, {
				uploadedFiles: [ { storageKey: 'file1.txt' } ],
			} );

			const updated = await cache.getSession( session.sessionId );
			expect( updated.uploadedFilesList ).toHaveLength( 1 );
			expect( updated.uploadedFilesList[ 0 ].storageKey ).toBe(
				'file1.txt'
			);
		} );

		test( 'should add completed steps without duplicates', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			await cache.updateSession( session.sessionId, {
				completedSteps: [ 'step1', 'step2' ],
			} );
			await cache.updateSession( session.sessionId, {
				completedSteps: [ 'step2', 'step3' ],
			} );

			const updated = await cache.getSession( session.sessionId );
			expect( updated.completedSteps ).toContain( 'step1' );
			expect( updated.completedSteps ).toContain( 'step2' );
			expect( updated.completedSteps ).toContain( 'step3' );
			expect(
				updated.completedSteps.filter( ( s ) => s === 'step2' )
			).toHaveLength( 1 );
		} );

		test( 'should return false for non-existent session', async () => {
			const result = await cache.updateSession( 'non-existent', {
				status: SESSION_STATUS.COMPLETED,
			} );
			expect( result ).toBe( false );
		} );
	} );

	describe( 'completeSession()', () => {
		test( 'should mark session as completed', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			await cache.completeSession( session.sessionId );

			const updated = await cache.getSession( session.sessionId );
			expect( updated.status ).toBe( SESSION_STATUS.COMPLETED );
		} );
	} );

	describe( 'failSession()', () => {
		test( 'should mark session as failed with error', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			await cache.failSession(
				session.sessionId,
				'Something went wrong'
			);

			const updated = await cache.getSession( session.sessionId );
			expect( updated.status ).toBe( SESSION_STATUS.FAILED );
			expect( updated.workflowState.error ).toBe(
				'Something went wrong'
			);
		} );
	} );

	describe( 'pauseSession() and resumeSession()', () => {
		test( 'should pause and resume session', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			await cache.pauseSession( session.sessionId );
			let updated = await cache.getSession( session.sessionId );
			expect( updated.status ).toBe( SESSION_STATUS.PAUSED );

			await cache.resumeSession( session.sessionId );
			updated = await cache.getSession( session.sessionId );
			expect( updated.status ).toBe( SESSION_STATUS.IN_PROGRESS );
		} );
	} );

	describe( 'isFileUploaded()', () => {
		test( 'should return true if file was uploaded', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			await cache.updateSession( session.sessionId, {
				uploadedFiles: [ { storageKey: 'index.html' } ],
			} );

			const result = await cache.isFileUploaded(
				session.sessionId,
				'index.html'
			);
			expect( result ).toBe( true );
		} );

		test( 'should return false if file was not uploaded', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			const result = await cache.isFileUploaded(
				session.sessionId,
				'missing.html'
			);
			expect( result ).toBe( false );
		} );

		test( 'should return false for non-existent session', async () => {
			const result = await cache.isFileUploaded(
				'non-existent',
				'file.txt'
			);
			expect( result ).toBe( false );
		} );
	} );

	describe( 'deleteSession()', () => {
		test( 'should delete session', async () => {
			const session = await cache.createSession( {
				providerId: 'test-provider',
			} );

			const deleted = await cache.deleteSession( session.sessionId );
			expect( deleted ).toBe( true );

			const retrieved = await cache.getSession( session.sessionId );
			expect( retrieved ).toBeNull();
		} );
	} );

	describe( 'getUploadProgressCache()', () => {
		test( 'should return singleton instance', () => {
			const instance1 = getUploadProgressCache();
			const instance2 = getUploadProgressCache();
			expect( instance1 ).toBe( instance2 );
		} );
	} );
} );
