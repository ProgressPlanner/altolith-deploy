/**
 * API Fetch Utility
 *
 * Enhanced wrapper around @wordpress/api-fetch with:
 * - Request deduplication (prevents concurrent identical requests)
 * - Response caching with TTL (GET requests only)
 * - Nonce handling from meta tags
 * - Auth header utilities for external APIs
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch';
import { getRestUrl } from './getRestUrl';

/**
 * Create authorization headers for external API calls.
 *
 * Utility for building consistent Authorization headers.
 *
 * @param {string} token API token or key.
 * @param {string} type  Auth type (default: 'Bearer').
 * @return {Object} Headers object with Authorization and Content-Type.
 */
export function createAuthHeaders( token, type = 'Bearer' ) {
	return {
		Authorization: `${ type } ${ token }`,
		'Content-Type': 'application/json',
	};
}

/**
 * Get REST API nonce from meta tag or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
	const metaTag = document.querySelector( 'meta[name="aether-rest-nonce"]' );
	if ( metaTag ) {
		return metaTag.getAttribute( 'content' ) || '';
	}
	return '';
}

/**
 * Request deduplication middleware
 *
 * Prevents concurrent identical requests by returning the same Promise
 * for duplicate in-flight requests.
 *
 * Uses request key (method + path + data) to identify duplicates.
 */
const pendingRequests = new Map();

function createRequestKey( options ) {
	const method = options.method || 'GET';
	const path = options.path || '';
	const data = options.data ? JSON.stringify( options.data ) : '';
	return `${ method }:${ path }:${ data }`;
}

const requestDeduplicationMiddleware = ( options, next ) => {
	const requestKey = createRequestKey( options );

	// Check if this request is already in flight
	if ( pendingRequests.has( requestKey ) ) {
		// Return the existing Promise
		return pendingRequests.get( requestKey );
	}

	// Make the request
	const promise = next( options );

	// Store the Promise
	pendingRequests.set( requestKey, promise );

	// Clean up when request completes (success or error)
	// Use finally() to guarantee cleanup regardless of outcome
	promise.finally( () => {
		pendingRequests.delete( requestKey );
	} );

	return promise;
};

/**
 * Response caching middleware
 *
 * Caches GET request responses with TTL to reduce redundant API calls.
 *
 * Cache format: Map<requestKey, {response, timestamp}>
 * TTL: 5 minutes (300000ms)
 */
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid( cacheEntry ) {
	if ( ! cacheEntry ) {
		return false;
	}
	const age = Date.now() - cacheEntry.timestamp;
	return age < CACHE_TTL;
}

const responseCachingMiddleware = ( options, next ) => {
	const method = options.method || 'GET';

	// Only cache GET requests
	if ( method !== 'GET' ) {
		return next( options );
	}

	const requestKey = createRequestKey( options );
	const cached = responseCache.get( requestKey );

	// Return cached response if valid
	if ( isCacheValid( cached ) ) {
		return Promise.resolve( cached.response );
	}

	// Make the request
	const promise = next( options );

	// Cache successful responses
	promise
		.then( ( response ) => {
			responseCache.set( requestKey, {
				response,
				timestamp: Date.now(),
			} );
			return response;
		} )
		.catch( ( error ) => {
			// Don't cache errors
			throw error;
		} );

	return promise;
};

/**
 * Invalidate cache for a specific path or all cached responses
 *
 * @param {string|null} path Optional path to invalidate (invalidates all if not provided)
 */
export function invalidateCache( path = null ) {
	if ( path ) {
		// Invalidate all cache entries matching this path
		for ( const [ key ] of responseCache.entries() ) {
			if ( key.includes( path ) ) {
				responseCache.delete( key );
			}
		}
	} else {
		// Clear all cache
		responseCache.clear();
	}
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
export function setAPINonce( nonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( nonce ) );
}

/**
 * Configure API fetch with base URL, nonce, and middleware.
 * Automatically fetches from meta tags if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from meta if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from meta if not provided).
 */
export function configureAPI( restUrl, nonce ) {
	const url = restUrl || getRestUrl();
	const token = nonce || getNonce();

	apiFetch.use( apiFetch.createRootURLMiddleware( url ) );
	if ( token ) {
		setAPINonce( token );
	}

	// Add custom middleware (order matters: caching before deduplication)
	apiFetch.use( responseCachingMiddleware );
	apiFetch.use( requestDeduplicationMiddleware );
}

// Auto-configure on module load.
configureAPI();

export default apiFetch;
