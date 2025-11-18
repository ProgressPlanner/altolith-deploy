/**
 * FileHashCache Tests
 *
 * @package
 */

import { FileHashCache, getFileHashCache } from '../fileHashCache';
import { calculateFileHash } from '../fileHash';

// Mock calculateFileHash
jest.mock( '../fileHash', () => ( {
	calculateFileHash: jest.fn(),
} ) );

// Mock IndexedDB store
const mockIndexedDBStore = {
	get: jest.fn(),
	set: jest.fn(),
	delete: jest.fn(),
	clear: jest.fn(),
	count: jest.fn(),
	deleteOlderThan: jest.fn(),
};

jest.mock( '../indexedDB', () => {
	return {
		__esModule: true,
		default: jest.fn( () => mockIndexedDBStore ),
	};
} );

describe( 'FileHashCache', () => {
	let cache;

	beforeEach( () => {
		cache = new FileHashCache();
		jest.clearAllMocks();
		mockIndexedDBStore.get.mockResolvedValue( null );
		mockIndexedDBStore.set.mockResolvedValue( true );
		mockIndexedDBStore.delete.mockResolvedValue( true );
		mockIndexedDBStore.clear.mockResolvedValue( true );
		mockIndexedDBStore.count.mockResolvedValue( 0 );
		mockIndexedDBStore.deleteOlderThan.mockResolvedValue( 0 );
		calculateFileHash.mockResolvedValue(
			'abc123def456789012345678901234567890123456789012345678901234'
		);
	} );

	describe( 'Cache Key Generation', () => {
		test( 'generates cache key with all metadata', () => {
			const key = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876543
			);
			expect( key ).toBe( 'path/to/file.jpg:1024:1699876543' );
		} );

		test( 'handles missing lastModified with 0', () => {
			const key = cache.getCacheKey( 'path/to/file.jpg', 1024, 0 );
			expect( key ).toBe( 'path/to/file.jpg:1024:0' );
		} );

		test( 'generates different keys for different sizes', () => {
			const key1 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876543
			);
			const key2 = cache.getCacheKey(
				'path/to/file.jpg',
				2048,
				1699876543
			);
			expect( key1 ).not.toBe( key2 );
		} );

		test( 'generates different keys for different timestamps', () => {
			const key1 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876543
			);
			const key2 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876999
			);
			expect( key1 ).not.toBe( key2 );
		} );
	} );

	describe( 'Get and Set', () => {
		test( 'returns null for cache miss', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );

			const result = await cache.get(
				'path/to/file.jpg',
				1024,
				1699876543
			);

			expect( result ).toBeNull();
		} );

		test( 'returns cached hash if not expired', async () => {
			const cachedData = {
				hash: 'abc123',
				timestamp: Date.now() - 1000, // 1 second ago
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			const result = await cache.get(
				'path/to/file.jpg',
				1024,
				1699876543
			);

			expect( result ).toBe( 'abc123' );
		} );

		test( 'returns null and deletes if expired', async () => {
			const cachedData = {
				hash: 'abc123',
				timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			const result = await cache.get(
				'path/to/file.jpg',
				1024,
				1699876543
			);

			expect( result ).toBeNull();
			expect( mockIndexedDBStore.delete ).toHaveBeenCalled();
		} );

		test( 'sets hash with metadata', async () => {
			await cache.set( 'path/to/file.jpg', 1024, 1699876543, 'abc123' );

			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				'path/to/file.jpg:1024:1699876543',
				{ hash: 'abc123' },
				{
					storageKey: 'path/to/file.jpg',
					size: 1024,
					lastModified: 1699876543,
				}
			);
		} );
	} );

	describe( 'getOrCalculateHash', () => {
		test( 'returns cached hash if available', async () => {
			const cachedData = {
				hash: 'cached-hash',
				timestamp: Date.now() - 1000,
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			// Create mock file with size and lastModified
			const file = {
				size: 1024,
				lastModified: 1699876543,
			};

			const hash = await cache.getOrCalculateHash(
				file,
				'path/to/file.txt'
			);

			expect( hash ).toBe( 'cached-hash' );
			expect( calculateFileHash ).not.toHaveBeenCalled();
		} );

		test( 'calculates and caches hash on miss', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );
			calculateFileHash.mockResolvedValue( 'new-hash' );

			// Create mock file with size and lastModified
			const file = {
				size: 1024,
				lastModified: 1699876543,
			};

			const hash = await cache.getOrCalculateHash(
				file,
				'path/to/file.txt'
			);

			expect( hash ).toBe( 'new-hash' );
			expect( calculateFileHash ).toHaveBeenCalledWith( file );
			expect( mockIndexedDBStore.set ).toHaveBeenCalled();
		} );

		test( 'handles files without lastModified', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );
			calculateFileHash.mockResolvedValue( 'new-hash' );

			// Create mock file without lastModified
			const file = {
				size: 1024,
				// No lastModified property
			};

			const hash = await cache.getOrCalculateHash(
				file,
				'path/to/file.txt'
			);

			expect( hash ).toBe( 'new-hash' );
			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				'path/to/file.txt:1024:0',
				{ hash: 'new-hash' },
				expect.objectContaining( {
					storageKey: 'path/to/file.txt',
					size: 1024,
					lastModified: 0,
				} )
			);
		} );
	} );

	describe( 'Cleanup', () => {
		test( 'deletes expired entries', async () => {
			mockIndexedDBStore.deleteOlderThan.mockResolvedValue( 10 );

			const deleted = await cache.cleanup();

			expect( deleted ).toBe( 10 );
			expect( mockIndexedDBStore.deleteOlderThan ).toHaveBeenCalledWith(
				30 * 24 * 60 * 60 * 1000
			);
		} );
	} );

	describe( 'Clear', () => {
		test( 'clears all cached data', async () => {
			await cache.clear();

			expect( mockIndexedDBStore.clear ).toHaveBeenCalled();
		} );
	} );

	describe( 'Statistics', () => {
		test( 'returns cache statistics', async () => {
			mockIndexedDBStore.count.mockResolvedValue( 250 );

			const stats = await cache.getStats();

			expect( stats ).toEqual( {
				totalCached: 250,
			} );
		} );
	} );

	describe( 'Singleton', () => {
		test( 'returns same instance', () => {
			const instance1 = getFileHashCache();
			const instance2 = getFileHashCache();

			expect( instance1 ).toBe( instance2 );
		} );
	} );

	describe( 'Error Handling', () => {
		test( 'handles get errors gracefully', async () => {
			mockIndexedDBStore.get.mockRejectedValue(
				new Error( 'Database error' )
			);

			const result = await cache.get(
				'path/to/file.jpg',
				1024,
				1699876543
			);

			expect( result ).toBeNull();
		} );

		test( 'handles set errors gracefully', async () => {
			mockIndexedDBStore.set.mockRejectedValue(
				new Error( 'Database error' )
			);

			const result = await cache.set(
				'path/to/file.jpg',
				1024,
				1699876543,
				'abc123'
			);

			expect( result ).toBe( false );
		} );
	} );
} );
