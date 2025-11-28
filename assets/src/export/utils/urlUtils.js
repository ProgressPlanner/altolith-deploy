/**
 * URL Utilities
 *
 * Pure functions for URL parsing, resolution, and normalization.
 *
 */

import { applyFilters } from '@wordpress/hooks';

/**
 * Resolve relative URL against a base URL.
 *
 * @param {string} url     Relative or absolute URL.
 * @param {string} baseUrl Base URL for resolution.
 * @return {string} Absolute URL.
 */
export function resolveRelative( url, baseUrl ) {
	// Data URLs should never be resolved - return as-is.
	if ( url.startsWith( 'data:' ) ) {
		return url;
	}

	// Already absolute.
	try {
		new URL( url );
		return url;
	} catch {
		// Not a valid absolute URL, continue
	}

	// Protocol-relative.
	if ( url.startsWith( '//' ) ) {
		return 'https:' + url;
	}

	// Absolute path.
	if ( url.startsWith( '/' ) ) {
		const base = new URL( baseUrl );
		return base.origin + url;
	}

	// Relative to base URL directory.
	const base = new URL( baseUrl );
	const baseDir = base.pathname.substring(
		0,
		base.pathname.lastIndexOf( '/' )
	);
	const resolvedUrl = base.origin + baseDir + '/' + url;

	return applyFilters( 'altolith.url.resolve', resolvedUrl, url, baseUrl );
}

/**
 * Check if URL is external to the site.
 *
 * @param {string} url     URL to check.
 * @param {string} siteUrl Site URL for comparison.
 * @return {boolean} True if external.
 */
export function isExternal( url, siteUrl ) {
	// Relative URLs are not external.
	if ( url.startsWith( '/' ) && ! url.startsWith( '//' ) ) {
		return false;
	}

	let isExternalUrl = false;

	// URLs that start with http:// or https:// - check host.
	if ( url.startsWith( 'http://' ) || url.startsWith( 'https://' ) ) {
		try {
			const urlObj = new URL( url );
			const siteObj = new URL( siteUrl );
			isExternalUrl = urlObj.host !== siteObj.host;
		} catch {
			isExternalUrl = true;
		}
	}
	// Protocol-relative URLs - check host.
	else if ( url.startsWith( '//' ) ) {
		try {
			const urlObj = new URL( 'https:' + url );
			const siteObj = new URL( siteUrl );
			isExternalUrl = urlObj.host !== siteObj.host;
		} catch {
			isExternalUrl = true;
		}
	}
	// If it doesn't start with a scheme or /, treat as external to be safe.
	else {
		isExternalUrl = true;
	}

	return applyFilters(
		'altolith.url.is_external',
		isExternalUrl,
		url,
		siteUrl
	);
}

/**
 * Force URL to use HTTPS scheme.
 *
 * @param {string} url URL to convert.
 * @return {string} URL with HTTPS scheme.
 */
export function forceHttps( url ) {
	// Skip data URLs, anchors, and protocol-relative URLs.
	if (
		url.startsWith( 'data:' ) ||
		url.startsWith( '#' ) ||
		url.startsWith( '//' )
	) {
		return url;
	}

	// Convert http:// to https://.
	if ( url.startsWith( 'http://' ) ) {
		return 'https://' + url.substring( 7 );
	}

	return url;
}

/**
 * Strip WordPress Playground scope from path.
 *
 * WordPress Playground uses scoped URLs like:
 * https://playground.wordpress.net/scope:happy-classic-town/
 *
 * @param {string} path Path that may contain Playground scope.
 * @return {string} Path with scope removed.
 */
export function stripPlaygroundScope( path ) {
	let result = path.replace( /^\/?scope:[a-z0-9.:-]+\//i, '' );
	result = result.replace( /\/scope:[a-z0-9.:-]+\//gi, '/' );
	result = result.replace( /^\/?scope:[a-z0-9.:-]+$/i, '' );
	return result;
}

/**
 * Normalize a URL for comparison.
 *
 * @param {string} url     URL to normalize.
 * @param {string} siteUrl Site URL for HTTPS enforcement.
 * @return {string} Normalized URL.
 */
export function normalize( url, siteUrl ) {
	// Handle relative URLs.
	if ( url.startsWith( '/' ) && ! url.startsWith( '//' ) ) {
		try {
			const siteObj = new URL( siteUrl );
			url = siteObj.origin + url;
		} catch {
			// If siteUrl is invalid, return as-is
		}
	}

	// Strip WordPress Playground scope from URL path.
	try {
		const urlObj = new URL( url );
		if ( urlObj.pathname ) {
			urlObj.pathname = stripPlaygroundScope( urlObj.pathname );
			url = urlObj.toString();
		}
	} catch {
		const pathMatch = url.match( /^https?:\/\/[^\/]+(\/.*)$/ );
		if ( pathMatch ) {
			const strippedPath = stripPlaygroundScope( pathMatch[ 1 ] );
			url = url.replace( pathMatch[ 1 ], strippedPath );
		}
	}

	// Remove URL fragments.
	const fragmentIndex = url.indexOf( '#' );
	if ( fragmentIndex !== -1 ) {
		url = url.substring( 0, fragmentIndex );
	}

	// Remove trailing slash.
	url = url.replace( /\/$/, '' );

	return applyFilters( 'altolith.url.normalize', url, siteUrl );
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
export function escapeRegex( str ) {
	return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Extract host from a URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string if invalid.
 */
export function extractHost( url ) {
	try {
		const urlObj = new URL( url );
		return urlObj.host;
	} catch {
		const hostMatch = url.match( /^https?:\/\/([^\/]+)/ );
		return hostMatch ? hostMatch[ 1 ] : '';
	}
}

/**
 * Check if URL should be skipped (anchors, data URLs, CF Images).
 *
 * @param {string} url URL to check.
 * @return {boolean} True if should skip.
 */
export function shouldSkipUrl( url ) {
	return (
		url.startsWith( '#' ) ||
		url.startsWith( 'data:' ) ||
		url.includes( 'imagedelivery.net' )
	);
}
