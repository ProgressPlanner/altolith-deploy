/**
 * Cache Monitor
 *
 * Simplified cache monitoring for wporgCache only.
 * All other caches have been removed.
 *
 */

import { getWpOrgCache } from './wporgCache';

/**
 * Get cache statistics from wporgCache.
 *
 * @return {Promise<Object>} Cache statistics.
 */
export async function getCacheStats() {
	const wporgCache = getWpOrgCache();
	const wporgStats = await wporgCache.getStats();

	return {
		wporg: wporgStats,
		totalSize: wporgStats.storageEstimate || 0,
		totalEntries: wporgStats.totalCached || 0,
	};
}

/**
 * Clear all caches (only wporgCache now).
 *
 * @return {Promise<void>}
 */
export async function clearAllCaches() {
	const wporgCache = getWpOrgCache();
	await wporgCache.clearAll();
}

/**
 * Delete a specific cache entry from wporgCache.
 *
 * @param {string} key Cache key to delete.
 * @return {Promise<void>}
 */
export async function deleteCacheEntry( key ) {
	const wporgCache = getWpOrgCache();
	await wporgCache.delete( key );
}

// Expose cache monitor utilities on window for debugging
if ( typeof window !== 'undefined' ) {
	window.aetherCacheMonitor = {
		getStats: getCacheStats,
		clearAll: clearAllCaches,
		deleteEntry: deleteCacheEntry,
	};
}
