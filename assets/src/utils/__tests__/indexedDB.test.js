/**
 * IndexedDB Tests
 *
 */

import {
	IndexedDBStore,
	isIndexedDBAvailable,
	deleteDatabase,
} from '../indexedDB';

// Mock idb library
const mockDb = {
	get: jest.fn(),
	getAll: jest.fn(),
	getAllKeys: jest.fn(),
	put: jest.fn(),
	delete: jest.fn(),
	clear: jest.fn(),
	count: jest.fn(),
	getAllFromIndex: jest.fn(),
	transaction: jest.fn(),
};

jest.mock( 'idb', () => ( {
	openDB: jest.fn( () => Promise.resolve( mockDb ) ),
} ) );

// Mock global indexedDB
const mockDeleteDatabase = jest.fn();
global.indexedDB = {
	deleteDatabase: mockDeleteDatabase,
};

global.IDBKeyRange = {
	upperBound: jest.fn( ( value ) => ( { type: 'upperBound', value } ) ),
};

describe( 'IndexedDBStore', () => {
	let store;

	beforeEach( () => {
		jest.clearAllMocks();
		store = new IndexedDBStore( 'cache' );
	} );

	describe( 'constructor', () => {
		test( 'should create store with name', () => {
			expect( store.storeName ).toBe( 'cache' );
		} );

		test( 'should use default keyPath', () => {
			expect( store.keyPath ).toBe( 'key' );
		} );

		test( 'should use custom keyPath from config', () => {
			const customStore = new IndexedDBStore( 'custom', {
				dbName: 'test',
				version: 1,
				stores: {
					custom: { keyPath: 'id' },
				},
			} );
			expect( customStore.keyPath ).toBe( 'id' );
		} );
	} );

	describe( 'get()', () => {
		test( 'should return value for key', async () => {
			mockDb.get.mockResolvedValue( { key: 'test', value: 'data' } );

			const result = await store.get( 'test' );

			expect( mockDb.get ).toHaveBeenCalledWith( 'cache', 'test' );
			expect( result ).toEqual( { key: 'test', value: 'data' } );
		} );

		test( 'should return null when not found', async () => {
			mockDb.get.mockResolvedValue( undefined );

			const result = await store.get( 'nonexistent' );

			expect( result ).toBeNull();
		} );

		test( 'should return null on error', async () => {
			mockDb.get.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.get( 'test' );

			expect( result ).toBeNull();
		} );
	} );

	describe( 'getAll()', () => {
		test( 'should return all values', async () => {
			mockDb.getAll.mockResolvedValue( [ { key: 'a' }, { key: 'b' } ] );

			const result = await store.getAll();

			expect( result ).toHaveLength( 2 );
		} );

		test( 'should respect limit', async () => {
			mockDb.getAll.mockResolvedValue( [ { key: 'a' } ] );

			await store.getAll( 1 );

			expect( mockDb.getAll ).toHaveBeenCalledWith(
				'cache',
				undefined,
				1
			);
		} );

		test( 'should return empty array on error', async () => {
			mockDb.getAll.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.getAll();

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getAllKeys()', () => {
		test( 'should return all keys', async () => {
			mockDb.getAllKeys.mockResolvedValue( [ 'key1', 'key2' ] );

			const result = await store.getAllKeys();

			expect( result ).toEqual( [ 'key1', 'key2' ] );
		} );

		test( 'should return empty array on error', async () => {
			mockDb.getAllKeys.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.getAllKeys();

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'set()', () => {
		test( 'should set object value', async () => {
			mockDb.put.mockResolvedValue( undefined );

			const result = await store.set( 'test', { data: 'value' } );

			expect( result ).toBe( true );
			expect( mockDb.put ).toHaveBeenCalledWith(
				'cache',
				expect.objectContaining( {
					key: 'test',
					data: 'value',
					timestamp: expect.any( Number ),
				} )
			);
		} );

		test( 'should set primitive value', async () => {
			mockDb.put.mockResolvedValue( undefined );

			const result = await store.set( 'test', 'string value' );

			expect( result ).toBe( true );
			expect( mockDb.put ).toHaveBeenCalledWith(
				'cache',
				expect.objectContaining( {
					key: 'test',
					value: 'string value',
				} )
			);
		} );

		test( 'should include metadata', async () => {
			mockDb.put.mockResolvedValue( undefined );

			await store.set( 'test', { data: 1 }, { type: 'custom' } );

			expect( mockDb.put ).toHaveBeenCalledWith(
				'cache',
				expect.objectContaining( { type: 'custom' } )
			);
		} );

		test( 'should return false on error', async () => {
			mockDb.put.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.set( 'test', 'value' );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'delete()', () => {
		test( 'should delete key', async () => {
			mockDb.delete.mockResolvedValue( undefined );

			const result = await store.delete( 'test' );

			expect( result ).toBe( true );
			expect( mockDb.delete ).toHaveBeenCalledWith( 'cache', 'test' );
		} );

		test( 'should return false on error', async () => {
			mockDb.delete.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.delete( 'test' );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'clear()', () => {
		test( 'should clear store', async () => {
			mockDb.clear.mockResolvedValue( undefined );

			const result = await store.clear();

			expect( result ).toBe( true );
			expect( mockDb.clear ).toHaveBeenCalledWith( 'cache' );
		} );

		test( 'should return false on error', async () => {
			mockDb.clear.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.clear();

			expect( result ).toBe( false );
		} );
	} );

	describe( 'count()', () => {
		test( 'should return count', async () => {
			mockDb.count.mockResolvedValue( 42 );

			const result = await store.count();

			expect( result ).toBe( 42 );
		} );

		test( 'should return 0 on error', async () => {
			mockDb.count.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.count();

			expect( result ).toBe( 0 );
		} );
	} );

	describe( 'getByIndex()', () => {
		test( 'should get values by index', async () => {
			mockDb.getAllFromIndex.mockResolvedValue( [ { key: 'a' } ] );

			const result = await store.getByIndex( 'type', 'custom' );

			expect( mockDb.getAllFromIndex ).toHaveBeenCalledWith(
				'cache',
				'type',
				'custom'
			);
			expect( result ).toHaveLength( 1 );
		} );

		test( 'should return empty array on error', async () => {
			mockDb.getAllFromIndex.mockRejectedValue( new Error( 'DB error' ) );

			const result = await store.getByIndex( 'type', 'custom' );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getStorageEstimate()', () => {
		test( 'should return storage estimate', async () => {
			const mockEstimate = { quota: 1000000, usage: 500000 };
			navigator.storage = {
				estimate: jest.fn().mockResolvedValue( mockEstimate ),
			};

			const result = await store.getStorageEstimate();

			expect( result.quota ).toBe( 1000000 );
			expect( result.usage ).toBe( 500000 );
			expect( result.percentUsed ).toBe( 50 );
		} );

		test( 'should return nulls when storage API unavailable', async () => {
			delete navigator.storage;

			const result = await store.getStorageEstimate();

			expect( result.quota ).toBeNull();
			expect( result.usage ).toBeNull();
		} );
	} );
} );

describe( 'isIndexedDBAvailable()', () => {
	test( 'should return true when IndexedDB available', () => {
		expect( isIndexedDBAvailable() ).toBe( true );
	} );
} );

describe( 'deleteDatabase()', () => {
	test( 'should delete database', async () => {
		mockDeleteDatabase.mockImplementation( ( name ) => {
			const request = { onsuccess: null, onerror: null };
			setTimeout( () => request.onsuccess?.(), 0 );
			return request;
		} );

		const result = await deleteDatabase( 'test-db' );

		expect( result ).toBe( true );
		expect( mockDeleteDatabase ).toHaveBeenCalledWith( 'test-db' );
	} );
} );
