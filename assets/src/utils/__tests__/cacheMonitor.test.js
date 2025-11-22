/**
 * Cache Monitor Tests
 *
 */

import { CacheMonitor } from '../cacheMonitor';

// Mock all cache dependencies
jest.mock( '../wporgCache', () => ( {
	getWpOrgCache: jest.fn( () => ( {
		getStats: jest
			.fn()
			.mockResolvedValue( { totalCached: 5, memoryCached: 3 } ),
		clear: jest.fn().mockResolvedValue( true ),
		cleanup: jest.fn().mockResolvedValue( 2 ),
	} ) ),
} ) );

jest.mock( '../manifestCache', () => ( {
	getManifestCache: jest.fn( () => ( {
		getStats: jest.fn().mockResolvedValue( { totalCached: 10 } ),
		clear: jest.fn().mockResolvedValue( true ),
		cleanup: jest.fn().mockResolvedValue( 1 ),
	} ) ),
} ) );

jest.mock( '../uploadProgressCache', () => ( {
	getUploadProgressCache: jest.fn( () => ( {
		getStats: jest.fn().mockResolvedValue( {
			totalSessions: 3,
			resumableSessions: 1,
			statusBreakdown: {
				in_progress: 1,
				paused: 0,
				completed: 2,
				failed: 0,
			},
		} ),
		clear: jest.fn().mockResolvedValue( true ),
		cleanup: jest.fn().mockResolvedValue( 0 ),
		getResumableSessions: jest
			.fn()
			.mockResolvedValue( [ { id: 'session1' } ] ),
	} ) ),
} ) );

jest.mock( '../archiveProgressCache', () => ( {
	getArchiveProgressCache: jest.fn( () => ( {
		clearAll: jest.fn().mockResolvedValue( true ),
		cleanup: jest.fn().mockResolvedValue( 0 ),
	} ) ),
} ) );

jest.mock( '../indexedDB', () => ( {
	deleteDatabase: jest.fn().mockResolvedValue( true ),
	isIndexedDBAvailable: jest.fn().mockReturnValue( true ),
} ) );

jest.mock( '../debug', () => ( {
	debug: jest.fn(),
	debugError: jest.fn(),
} ) );

describe( 'CacheMonitor', () => {
	let monitor;

	beforeEach( () => {
		jest.clearAllMocks();
		monitor = new CacheMonitor();
	} );

	describe( 'isAvailable()', () => {
		test( 'should return IndexedDB availability', () => {
			expect( monitor.isAvailable() ).toBe( true );
		} );
	} );

	describe( 'getAllStats()', () => {
		test( 'should return aggregated stats from all caches', async () => {
			const stats = await monitor.getAllStats();

			expect( stats.wporg.totalCached ).toBe( 5 );
			expect( stats.manifest.totalCached ).toBe( 10 );
			expect( stats.uploadProgress.totalSessions ).toBe( 3 );
			expect( stats.total.totalEntries ).toBe( 18 ); // 5 + 10 + 3
		} );
	} );

	describe( 'getFormattedStats()', () => {
		test( 'should return formatted string', async () => {
			const formatted = await monitor.getFormattedStats();

			expect( formatted ).toContain( 'Aether Cache Monitor' );
			expect( formatted ).toContain( 'WordPress.org API Cache' );
			expect( formatted ).toContain( 'Manifest Cache' );
			expect( formatted ).toContain( 'Upload Progress Cache' );
		} );
	} );

	describe( 'clearAll()', () => {
		test( 'should clear all caches', async () => {
			const results = await monitor.clearAll();

			expect( results.wporg ).toBe( true );
			expect( results.manifest ).toBe( true );
			expect( results.uploadProgress ).toBe( true );
			expect( results.archiveProgress ).toBe( true );
		} );
	} );

	describe( 'clearCache()', () => {
		test( 'should clear specific cache', async () => {
			const result = await monitor.clearCache( 'wporg' );
			expect( result ).toBe( true );
		} );

		test( 'should return false for unknown cache', async () => {
			const result = await monitor.clearCache( 'unknown' );
			expect( result ).toBe( false );
		} );

		test( 'should use clearAll for archiveProgress', async () => {
			const result = await monitor.clearCache( 'archiveProgress' );
			expect( result ).toBe( true );
		} );
	} );

	describe( 'cleanupAll()', () => {
		test( 'should run cleanup on all caches', async () => {
			const results = await monitor.cleanupAll();

			expect( typeof results.wporg ).toBe( 'number' );
			expect( typeof results.manifest ).toBe( 'number' );
			expect( typeof results.uploadProgress ).toBe( 'number' );
			expect( typeof results.archiveProgress ).toBe( 'number' );
		} );
	} );

	describe( 'getResumableSessions()', () => {
		test( 'should return resumable upload sessions', async () => {
			const sessions = await monitor.getResumableSessions();

			expect( sessions ).toHaveLength( 1 );
			expect( sessions[ 0 ].id ).toBe( 'session1' );
		} );
	} );

	describe( 'formatBytes()', () => {
		test( 'should format bytes correctly', () => {
			expect( monitor.formatBytes( 0 ) ).toBe( '0 Bytes' );
			expect( monitor.formatBytes( 1024 ) ).toBe( '1 KB' );
			expect( monitor.formatBytes( 1048576 ) ).toBe( '1 MB' );
			expect( monitor.formatBytes( 1073741824 ) ).toBe( '1 GB' );
		} );

		test( 'should handle null/undefined', () => {
			expect( monitor.formatBytes( null ) ).toBe( 'Unknown' );
			expect( monitor.formatBytes( undefined ) ).toBe( 'Unknown' );
		} );
	} );

	describe( 'exportStats()', () => {
		test( 'should return JSON string', async () => {
			const json = await monitor.exportStats();
			const parsed = JSON.parse( json );

			expect( parsed.wporg ).toBeDefined();
			expect( parsed.manifest ).toBeDefined();
		} );
	} );
} );
