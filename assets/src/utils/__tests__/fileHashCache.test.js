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
		test( 'generates cache key with all metadata for Files', () => {
			const key = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876543,
				false // isBlob = false (File)
			);
			expect( key ).toBe( 'path/to/file.jpg:1024:1699876543' );
		} );

		test( 'generates cache key without lastModified for Blobs', () => {
			const key = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				0,
				true // isBlob = true
			);
			expect( key ).toBe( 'path/to/file.jpg:1024' );
		} );

		test( 'handles missing lastModified for Blobs', () => {
			const key = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				0,
				true // isBlob = true
			);
			expect( key ).toBe( 'path/to/file.jpg:1024' );
		} );

		test( 'handles missing lastModified for Files (uses 0)', () => {
			const key = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				0,
				false // isBlob = false (File)
			);
			expect( key ).toBe( 'path/to/file.jpg:1024:0' );
		} );

		test( 'generates different keys for different sizes', () => {
			const key1 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876543,
				false
			);
			const key2 = cache.getCacheKey(
				'path/to/file.jpg',
				2048,
				1699876543,
				false
			);
			expect( key1 ).not.toBe( key2 );
		} );

		test( 'generates different keys for different timestamps (Files only)', () => {
			const key1 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876543,
				false // File
			);
			const key2 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876999,
				false // File
			);
			expect( key1 ).not.toBe( key2 );
		} );

		test( 'generates same key for Blobs regardless of lastModified', () => {
			const key1 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876543,
				true // Blob
			);
			const key2 = cache.getCacheKey(
				'path/to/file.jpg',
				1024,
				1699876999,
				true // Blob
			);
			expect( key1 ).toBe( key2 );
			expect( key1 ).toBe( 'path/to/file.jpg:1024' );
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

		test( 'sets hash with metadata for Files', async () => {
			await cache.set(
				'path/to/file.jpg',
				1024,
				1699876543,
				'abc123',
				false // isBlob = false (File)
			);

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

		test( 'sets hash with metadata for Blobs (no lastModified in key)', async () => {
			await cache.set(
				'path/to/file.jpg',
				1024,
				0,
				'abc123',
				true // isBlob = true
			);

			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				'path/to/file.jpg:1024',
				{ hash: 'abc123' },
				{
					storageKey: 'path/to/file.jpg',
					size: 1024,
					lastModified: 0,
				}
			);
		} );
	} );

	describe( 'getOrCalculateHash', () => {
		test( 'returns cached hash if available (File)', async () => {
			const cachedData = {
				hash: 'cached-hash',
				timestamp: Date.now() - 1000,
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			// Create mock File with size and lastModified
			const file = new File( [ 'content' ], 'file.txt', {
				type: 'text/plain',
			} );
			Object.defineProperty( file, 'lastModified', {
				value: 1699876543,
				writable: false,
			} );

			const hash = await cache.getOrCalculateHash(
				file,
				'path/to/file.txt'
			);

			expect( hash ).toBe( 'cached-hash' );
			expect( calculateFileHash ).not.toHaveBeenCalled();
		} );

		test( 'returns cached hash if available (Blob)', async () => {
			const cachedData = {
				hash: 'cached-hash',
				timestamp: Date.now() - 1000,
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			// Create mock Blob (no lastModified property)
			const blob = new Blob( [ 'content' ], { type: 'text/plain' } );

			const hash = await cache.getOrCalculateHash(
				blob,
				'path/to/file.txt'
			);

			expect( hash ).toBe( 'cached-hash' );
			expect( calculateFileHash ).not.toHaveBeenCalled();
			// Should use Blob cache key (no lastModified) - format: storageKey:size
			expect( mockIndexedDBStore.get ).toHaveBeenCalledWith(
				`path/to/file.txt:${ blob.size }`
			);
		} );

		test( 'calculates and caches hash on miss (File)', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );
			calculateFileHash.mockResolvedValue( 'new-hash' );

			// Create mock File with size and lastModified
			const file = new File( [ 'content' ], 'file.txt', {
				type: 'text/plain',
			} );
			Object.defineProperty( file, 'lastModified', {
				value: 1699876543,
				writable: false,
			} );

			const hash = await cache.getOrCalculateHash(
				file,
				'path/to/file.txt'
			);

			expect( hash ).toBe( 'new-hash' );
			expect( calculateFileHash ).toHaveBeenCalledWith( file );
			expect( mockIndexedDBStore.set ).toHaveBeenCalled();
		} );

		test( 'calculates and caches hash on miss (Blob)', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );
			calculateFileHash.mockResolvedValue( 'new-hash' );

			// Create mock Blob (no lastModified property)
			const blob = new Blob( [ 'content' ], { type: 'text/plain' } );

			const hash = await cache.getOrCalculateHash(
				blob,
				'path/to/file.txt'
			);

			expect( hash ).toBe( 'new-hash' );
			expect( calculateFileHash ).toHaveBeenCalledWith( blob );
			// Should cache with Blob key (no lastModified)
			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				expect.stringMatching( /^path\/to\/file\.txt:\d+$/ ), // storageKey:size (no lastModified)
				{ hash: 'new-hash' },
				expect.objectContaining( {
					storageKey: 'path/to/file.txt',
					size: blob.size,
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
				1699876543,
				false // isBlob = false (File)
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
				'abc123',
				false // isBlob = false (File)
			);

			expect( result ).toBe( false );
		} );
	} );
} );
