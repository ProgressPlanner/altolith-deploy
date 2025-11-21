/**
 * Static Site Cache Tests
 *
 * @package
 */

import { StaticSiteCache } from '../staticSiteCache';

// Mock IndexedDB
const mockStore = new Map();
let mockIndexedDBAvailable = true;

jest.mock( '../indexedDB', () => {
	return {
		__esModule: true,
		default: jest.fn().mockImplementation( () => ( {
			get: jest.fn( ( key ) => Promise.resolve( mockStore.get( key ) ) ),
			set: jest.fn( ( key, value, extra ) => {
				mockStore.set( key, { ...value, url: key, ...extra, timestamp: Date.now() } );
				return Promise.resolve( true );
			} ),
			delete: jest.fn( ( key ) => {
				mockStore.delete( key );
				return Promise.resolve( true );
			} ),
			clear: jest.fn( () => {
				mockStore.clear();
				return Promise.resolve( true );
			} ),
			count: jest.fn( () => Promise.resolve( mockStore.size ) ),
			getByIndex: jest.fn( ( indexName, value ) => {
				const results = [];
				mockStore.forEach( ( item, key ) => {
					if ( item[ indexName ] === value ) {
						results.push( { ...item, url: key } );
					}
				} );
				return Promise.resolve( results );
			} ),
			getStorageEstimate: jest.fn( () => Promise.resolve( {
				usage: 1000000,
				quota: 10000000,
				percentUsed: 10,
			} ) ),
			deleteOlderThan: jest.fn( () => Promise.resolve( 5 ) ),
		} ) ),
		isIndexedDBAvailable: jest.fn( () => mockIndexedDBAvailable ),
	};
} );

describe( 'StaticSiteCache', () => {
	let cache;

	beforeEach( () => {
		jest.clearAllMocks();
		mockStore.clear();
		mockIndexedDBAvailable = true;
		cache = new StaticSiteCache( 'test-session' );
	} );

	describe( 'constructor', () => {
		test( 'should create with provided session ID', () => {
			expect( cache.sessionId ).toBe( 'test-session' );
		} );

		test( 'should generate session ID if not provided', () => {
			const autoCache = new StaticSiteCache();
			expect( autoCache.sessionId ).toMatch( /^session_\d+_[a-z0-9]+$/ );
		} );
	} );

	describe( 'isReady()', () => {
		test( 'should return true when IndexedDB available', () => {
			expect( cache.isReady() ).toBe( true );
		} );

		test( 'should return false when IndexedDB unavailable', () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();
			expect( fallbackCache.isReady() ).toBe( false );
		} );
	} );

	describe( 'set()', () => {
		test( 'should cache HTML and assets', async () => {
			const result = await cache.set( 'https://example.com/', '<html></html>', [ '/style.css' ] );
			expect( result ).toBe( true );
		} );

		test( 'should use memory fallback when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			const result = await fallbackCache.set( 'https://example.com/', '<html></html>', [] );

			expect( result ).toBe( true );
			expect( fallbackCache.memoryCache.has( 'https://example.com/' ) ).toBe( true );
		} );
	} );

	describe( 'get()', () => {
		test( 'should retrieve cached data', async () => {
			await cache.set( 'https://example.com/', '<html></html>', [ '/a.css' ] );

			const result = await cache.get( 'https://example.com/' );

			expect( result ).not.toBeNull();
			expect( result.rawHtml ).toBe( '<html></html>' );
			expect( result.assetUrls ).toEqual( [ '/a.css' ] );
		} );

		test( 'should return null for non-existent URL', async () => {
			const result = await cache.get( 'https://notfound.com/' );
			expect( result ).toBeNull();
		} );

		test( 'should support legacy processedHtml field', async () => {
			// Manually set with legacy field
			mockStore.set( 'https://legacy.com/', {
				processedHtml: '<old></old>',
				assetUrls: [],
				url: 'https://legacy.com/',
				timestamp: Date.now(),
			} );

			const result = await cache.get( 'https://legacy.com/' );

			expect( result.rawHtml ).toBe( '<old></old>' );
		} );

		test( 'should use memory fallback when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			await fallbackCache.set( 'https://example.com/', '<html></html>', [] );
			const result = await fallbackCache.get( 'https://example.com/' );

			expect( result ).not.toBeNull();
			expect( result.rawHtml ).toBe( '<html></html>' );
		} );
	} );

	describe( 'has()', () => {
		test( 'should return true for cached URL', async () => {
			await cache.set( 'https://example.com/', '<html></html>', [] );
			expect( await cache.has( 'https://example.com/' ) ).toBe( true );
		} );

		test( 'should return false for non-cached URL', async () => {
			expect( await cache.has( 'https://notcached.com/' ) ).toBe( false );
		} );
	} );

	describe( 'delete()', () => {
		test( 'should delete cached URL', async () => {
			await cache.set( 'https://example.com/', '<html></html>', [] );
			const result = await cache.delete( 'https://example.com/' );

			expect( result ).toBe( true );
			expect( await cache.has( 'https://example.com/' ) ).toBe( false );
		} );

		test( 'should use memory fallback when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			await fallbackCache.set( 'https://example.com/', '<html></html>', [] );
			const result = await fallbackCache.delete( 'https://example.com/' );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'getAllUrls()', () => {
		test( 'should return all cached URLs for session', async () => {
			await cache.set( 'https://a.com/', '<a></a>', [] );
			await cache.set( 'https://b.com/', '<b></b>', [] );

			const urls = await cache.getAllUrls();

			expect( urls ).toContain( 'https://a.com/' );
			expect( urls ).toContain( 'https://b.com/' );
		} );

		test( 'should return memory cache keys when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			await fallbackCache.set( 'https://a.com/', '<a></a>', [] );

			const urls = await fallbackCache.getAllUrls();

			expect( urls ).toContain( 'https://a.com/' );
		} );
	} );

	describe( 'getStats()', () => {
		test( 'should return cache statistics', async () => {
			const stats = await cache.getStats();

			expect( stats ).toHaveProperty( 'totalCached' );
			expect( stats ).toHaveProperty( 'sessionCached' );
			expect( stats ).toHaveProperty( 'storageUsed' );
			expect( stats ).toHaveProperty( 'storageQuota' );
			expect( stats.usingFallback ).toBe( false );
		} );

		test( 'should return fallback stats when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			await fallbackCache.set( 'https://a.com/', '<a></a>', [] );
			const stats = await fallbackCache.getStats();

			expect( stats.usingFallback ).toBe( true );
			expect( stats.totalCached ).toBe( 1 );
		} );
	} );

	describe( 'clearSession()', () => {
		test( 'should clear cache for current session', async () => {
			await cache.set( 'https://a.com/', '<a></a>', [] );
			await cache.set( 'https://b.com/', '<b></b>', [] );

			const deleted = await cache.clearSession();

			expect( deleted ).toBeGreaterThanOrEqual( 0 );
		} );

		test( 'should clear memory cache when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			await fallbackCache.set( 'https://a.com/', '<a></a>', [] );
			const deleted = await fallbackCache.clearSession();

			expect( deleted ).toBe( 1 );
			expect( fallbackCache.memoryCache.size ).toBe( 0 );
		} );
	} );

	describe( 'clearAll()', () => {
		test( 'should clear all cache', async () => {
			await cache.set( 'https://a.com/', '<a></a>', [] );

			const result = await cache.clearAll();

			expect( result ).toBe( true );
		} );

		test( 'should clear memory cache when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			await fallbackCache.set( 'https://a.com/', '<a></a>', [] );
			const result = await fallbackCache.clearAll();

			expect( result ).toBe( true );
			expect( fallbackCache.memoryCache.size ).toBe( 0 );
		} );
	} );

	describe( 'cleanup()', () => {
		test( 'should return number of deleted items', async () => {
			const deleted = await cache.cleanup();
			expect( typeof deleted ).toBe( 'number' );
		} );

		test( 'should clear memory cache when IndexedDB unavailable', async () => {
			mockIndexedDBAvailable = false;
			const fallbackCache = new StaticSiteCache();

			await fallbackCache.set( 'https://a.com/', '<a></a>', [] );
			const deleted = await fallbackCache.cleanup();

			expect( deleted ).toBe( 1 );
		} );
	} );

	describe( 'batchGet()', () => {
		test( 'should return map of cached URLs', async () => {
			await cache.set( 'https://a.com/', '<a></a>', [] );
			await cache.set( 'https://b.com/', '<b></b>', [] );

			const results = await cache.batchGet( [ 'https://a.com/', 'https://b.com/', 'https://c.com/' ] );

			expect( results.has( 'https://a.com/' ) ).toBe( true );
			expect( results.has( 'https://b.com/' ) ).toBe( true );
			expect( results.has( 'https://c.com/' ) ).toBe( false );
		} );
	} );

	describe( 'batchSet()', () => {
		test( 'should set multiple items', async () => {
			const items = [
				{ url: 'https://a.com/', rawHtml: '<a></a>', assetUrls: [] },
				{ url: 'https://b.com/', rawHtml: '<b></b>', assetUrls: [] },
			];

			const count = await cache.batchSet( items );

			expect( count ).toBe( 2 );
		} );

		test( 'should support legacy processedHtml field', async () => {
			const items = [
				{ url: 'https://legacy.com/', processedHtml: '<old></old>', assetUrls: [] },
			];

			const count = await cache.batchSet( items );

			expect( count ).toBe( 1 );
		} );
	} );

	describe( 'getHealth()', () => {
		test( 'should return health information', async () => {
			const health = await cache.getHealth();

			expect( health ).toHaveProperty( 'isHealthy' );
			expect( health ).toHaveProperty( 'usingFallback' );
			expect( health ).toHaveProperty( 'cacheSize' );
			expect( health ).toHaveProperty( 'recommendations' );
		} );
	} );

	describe( 'getRecommendations()', () => {
		test( 'should recommend when using fallback', () => {
			const recommendations = cache.getRecommendations( { usingFallback: true } );
			expect( recommendations.length ).toBeGreaterThan( 0 );
			expect( recommendations[ 0 ] ).toContain( 'IndexedDB' );
		} );

		test( 'should warn about storage when over 80%', () => {
			const recommendations = cache.getRecommendations( {
				storagePercent: 85,
				usingFallback: false,
			} );
			expect( recommendations.some( ( r ) => r.includes( '85%' ) ) ).toBe( true );
		} );

		test( 'should warn about nearly full storage', () => {
			const recommendations = cache.getRecommendations( {
				storagePercent: 96,
				usingFallback: false,
			} );
			expect( recommendations.some( ( r ) => r.includes( 'nearly full' ) ) ).toBe( true );
		} );

		test( 'should suggest cleanup when old data detected', () => {
			const recommendations = cache.getRecommendations( {
				totalCached: 100,
				sessionCached: 10,
				usingFallback: false,
			} );
			expect( recommendations.some( ( r ) => r.includes( 'cleanup' ) ) ).toBe( true );
		} );

		test( 'should return empty array when healthy', () => {
			const recommendations = cache.getRecommendations( {
				storagePercent: 20,
				usingFallback: false,
				totalCached: 10,
				sessionCached: 10,
			} );
			expect( recommendations ).toHaveLength( 0 );
		} );
	} );
} );
