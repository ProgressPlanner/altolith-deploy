/**
 * Static Files Cache
 *
 * IndexedDB-based cache for storing discovered URLs and their content
 * during static site export. Stores text content for HTML, CSS, JS, etc.
 * but only metadata for binary files (images, fonts).
 *
 * @since 1.0.0
 */

import IndexedDBStore from '@aether/utils/indexedDB';

/**
 * Database configuration
 */
const DB_NAME = 'aether-export-static-files';
const STORE_NAME = 'files';

/**
 * MIME types that should have their content stored.
 * Binary types (images, fonts, etc.) only store metadata.
 */
const TEXT_MIME_TYPES = [
	'text/html',
	'text/css',
	'text/javascript',
	'application/javascript',
	'application/json',
	'text/plain',
	'image/svg+xml',
	'text/xml',
	'application/xml',
];

/**
 * IndexedDB configuration for the static files cache
 */
const config = {
	dbName: DB_NAME,
	version: 1,
	stores: {
		[ STORE_NAME ]: {
			keyPath: 'url',
			indexes: [
				{ name: 'timestamp', keyPath: 'timestamp', unique: false },
				{ name: 'mimeType', keyPath: 'mimeType', unique: false },
			],
		},
	},
};

/**
 * Check if a MIME type should have its content stored
 *
 * @param {string} mimeType - The MIME type to check
 * @return {boolean} True if content should be stored
 */
function shouldStoreContent( mimeType ) {
	if ( ! mimeType ) {
		return false;
	}
	const lowerMimeType = mimeType.toLowerCase();
	return TEXT_MIME_TYPES.some( ( type ) => lowerMimeType.startsWith( type ) );
}

/**
 * Static Files Cache Class
 *
 * Provides methods to cache and retrieve static file data during export.
 */
class StaticFilesCache {
	/**
	 * Constructor
	 */
	constructor() {
		this.store = new IndexedDBStore( STORE_NAME, config );
	}

	/**
	 * Initialize the cache by clearing any existing data.
	 * Should be called at the start of each export.
	 *
	 * @return {Promise<void>}
	 */
	async initialize() {
		await this.store.clear();
	}

	/**
	 * Check if a URL exists in the cache
	 *
	 * @param {string} url - The URL to check
	 * @return {Promise<boolean>} True if URL is cached
	 */
	async has( url ) {
		const entry = await this.store.get( url );
		return entry !== null;
	}

	/**
	 * Get cached data for a URL
	 *
	 * @param {string} url - The URL to retrieve
	 * @return {Promise<Object|null>} Cached entry or null
	 */
	async get( url ) {
		return await this.store.get( url );
	}

	/**
	 * Add a URL and its data to the cache
	 *
	 * @param {string}      url      - The normalized URL
	 * @param {string}      mimeType - The Content-Type header value
	 * @param {string|null} content  - The text content (null for binary files)
	 * @return {Promise<boolean>} True if successful
	 */
	async add( url, mimeType, content = null ) {
		const storeContent = shouldStoreContent( mimeType );

		return await this.store.set( url, {
			url,
			mimeType: mimeType || 'application/octet-stream',
			content: storeContent ? content : null,
		} );
	}

	/**
	 * Add HTML content with extracted asset URLs
	 *
	 * @param {string}   url       - The normalized URL
	 * @param {string}   content   - The HTML content
	 * @param {string[]} assetUrls - Array of asset URLs extracted from HTML
	 * @return {Promise<boolean>} True if successful
	 */
	async addHtmlWithAssets( url, content, assetUrls ) {
		return await this.store.set( url, {
			url,
			mimeType: 'text/html',
			content,
			assetUrls,
		} );
	}

	/**
	 * Get cached data for a URL with deep cloning for thread isolation
	 *
	 * Returns a deep clone of the cached data to ensure each provider
	 * thread gets its own independent copy with no shared references.
	 *
	 * @param {string} url - The URL to retrieve
	 * @return {Promise<Object|null>} Cloned cached entry or null
	 */
	async getCloned( url ) {
		const entry = await this.store.get( url );
		if ( ! entry ) {
			return null;
		}

		return {
			url: entry.url,
			mimeType: entry.mimeType,
			content: entry.content,
			assetUrls: entry.assetUrls ? [ ...entry.assetUrls ] : null,
		};
	}

	/**
	 * Clear all cached data
	 *
	 * @return {Promise<boolean>} True if successful
	 */
	async clear() {
		return await this.store.clear();
	}

	/**
	 * Get the number of cached entries
	 *
	 * @return {Promise<number>} Number of cached entries
	 */
	async count() {
		return await this.store.count();
	}

	/**
	 * Get all cached URLs
	 *
	 * @return {Promise<Array<string>>} Array of cached URLs
	 */
	async getAllUrls() {
		return await this.store.getAllKeys();
	}
}

/**
 * Singleton instance
 */
let instance = null;

/**
 * Get the singleton StaticFilesCache instance
 *
 * @return {StaticFilesCache} The cache instance
 */
export function getStaticFilesCache() {
	if ( ! instance ) {
		instance = new StaticFilesCache();
	}
	return instance;
}

/**
 * Initialize the static files cache.
 * Clears any existing data and returns the cache instance.
 * Should be called at the start of each export.
 *
 * @return {Promise<StaticFilesCache>} The initialized cache instance
 */
export async function initializeStaticFilesCache() {
	const cache = getStaticFilesCache();
	await cache.initialize();
	return cache;
}

/**
 * Check if a MIME type is text-based (content will be stored)
 *
 * @param {string} mimeType - The MIME type to check
 * @return {boolean} True if content will be stored for this MIME type
 */
export function isTextBasedMimeType( mimeType ) {
	return shouldStoreContent( mimeType );
}
