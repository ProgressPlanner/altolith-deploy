/**
 * Archive Progress Cache Tests
 *
 * @package
 */

import {
	ArchiveProgressCache,
	getArchiveProgressCache,
} from '../archiveProgressCache';

// Mock IndexedDB
jest.mock( '../indexedDB', () => {
	const mockStore = new Map();

	return jest.fn().mockImplementation( () => ( {
		get: jest.fn( ( key ) => Promise.resolve( mockStore.get( key ) ) ),
		set: jest.fn( ( key, value, meta ) => {
			mockStore.set( key, { ...value, timestamp: meta?.timestamp || Date.now() } );
			return Promise.resolve();
		} ),
		delete: jest.fn( ( key ) => {
			mockStore.delete( key );
			return Promise.resolve();
		} ),
		deleteOlderThan: jest.fn( () => Promise.resolve( 0 ) ),
		clear: jest.fn( () => {
			mockStore.clear();
			return Promise.resolve( true );
		} ),
		_mockStore: mockStore,
	} ) );
} );

// Mock debug
jest.mock( '../debug', () => ( {
	debug: jest.fn(),
	debugError: jest.fn(),
} ) );

describe( 'archiveProgressCache', () => {
	let cache;

	beforeEach( () => {
		jest.clearAllMocks();
		cache = new ArchiveProgressCache();
	} );

	describe( 'get()', () => {
		test( 'should return null for non-existent progress', async () => {
			const result = await cache.get( 'non-existent' );
			expect( result ).toBeNull();
		} );

		test( 'should return progress if exists', async () => {
			await cache.set( 'test-id', { phase: 'collecting' } );
			const result = await cache.get( 'test-id' );
			expect( result ).toEqual( { phase: 'collecting' } );
		} );
	} );

	describe( 'set()', () => {
		test( 'should set progress successfully', async () => {
			const result = await cache.set( 'test-id', {
				phase: 'building',
				percent: 50,
			} );

			expect( result ).toBe( true );
			const retrieved = await cache.get( 'test-id' );
			expect( retrieved.phase ).toBe( 'building' );
			expect( retrieved.percent ).toBe( 50 );
		} );
	} );

	describe( 'update()', () => {
		test( 'should create progress if not exists', async () => {
			const result = await cache.update( 'new-id', { phase: 'init' } );
			expect( result ).toBe( true );

			const retrieved = await cache.get( 'new-id' );
			expect( retrieved.phase ).toBe( 'init' );
		} );

		test( 'should merge with existing progress', async () => {
			await cache.set( 'test-id', { phase: 'collecting', count: 10 } );
			await cache.update( 'test-id', { percent: 75 } );

			const retrieved = await cache.get( 'test-id' );
			expect( retrieved.phase ).toBe( 'collecting' );
			expect( retrieved.count ).toBe( 10 );
			expect( retrieved.percent ).toBe( 75 );
		} );
	} );

	describe( 'deepMerge()', () => {
		test( 'should merge nested objects', () => {
			const target = { phases: { db: true, files: false } };
			const source = { phases: { files: true } };
			const result = cache.deepMerge( target, source );

			expect( result.phases.db ).toBe( true );
			expect( result.phases.files ).toBe( true );
		} );

		test( 'should replace arrays', () => {
			const target = { items: [ 1, 2 ] };
			const source = { items: [ 3, 4, 5 ] };
			const result = cache.deepMerge( target, source );

			expect( result.items ).toEqual( [ 3, 4, 5 ] );
		} );

		test( 'should replace primitives', () => {
			const target = { value: 10 };
			const source = { value: 20 };
			const result = cache.deepMerge( target, source );

			expect( result.value ).toBe( 20 );
		} );

		test( 'should preserve unchanged values', () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3 };
			const result = cache.deepMerge( target, source );

			expect( result.a ).toBe( 1 );
			expect( result.b ).toBe( 3 );
		} );
	} );

	describe( 'clear()', () => {
		test( 'should clear specific progress', async () => {
			await cache.set( 'test-id', { phase: 'done' } );
			const result = await cache.clear( 'test-id' );

			expect( result ).toBe( true );
			const retrieved = await cache.get( 'test-id' );
			expect( retrieved ).toBeNull();
		} );
	} );

	describe( 'cleanup()', () => {
		test( 'should run cleanup without error', async () => {
			const deleted = await cache.cleanup();
			expect( typeof deleted ).toBe( 'number' );
		} );

		test( 'should return number of deleted entries', async () => {
			const deleted = await cache.cleanup();
			expect( deleted ).toBeGreaterThanOrEqual( 0 );
		} );
	} );

	describe( 'clearAll()', () => {
		test( 'should clear all cached data', async () => {
			await cache.set( 'id1', { phase: 'a' } );
			await cache.set( 'id2', { phase: 'b' } );

			const result = await cache.clearAll();
			expect( result ).toBe( true );
		} );
	} );

	describe( 'getArchiveProgressCache()', () => {
		test( 'should return singleton instance', () => {
			const instance1 = getArchiveProgressCache();
			const instance2 = getArchiveProgressCache();
			expect( instance1 ).toBe( instance2 );
		} );
	} );
} );
