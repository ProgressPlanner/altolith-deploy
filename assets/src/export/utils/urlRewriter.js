/**
 * URL Rewriter
 *
 * Rewrites WordPress URLs to static URLs for the static site.
 *
 */

import { applyFilters } from '@wordpress/hooks';

// Import URL utilities
import {
	resolveRelative,
	isExternal,
	forceHttps,
	stripPlaygroundScope,
	normalize,
	extractHost,
	shouldSkipUrl,
} from './urlUtils';

// Import HTML rewriting helpers
import {
	protectScriptContent,
	restoreScriptContent,
	collectSiteUrlMatches,
	replaceSiteUrlMatches,
	rewriteAbsolutePaths,
	rewriteSrcsetUrls,
	rewriteImportMaps,
} from './htmlRewriting';

/**
 * Create URL rewriter instance.
 *
 * @param {string}                 siteUrl   Site URL.
 * @param {string|null}            staticUrl Static site URL (where it will be deployed).
 * @param {Object<string, string>} urlMap    Optional URL mapping cache.
 * @return {Object} URL rewriter instance.
 */
export function createUrlRewriter( siteUrl, staticUrl = null, urlMap = {} ) {
	// Force HTTPS for site URL to avoid mixed content issues.
	const normalizedSiteUrl = forceHttps( siteUrl );

	// Treat empty string as null.
	const normalizedStaticUrl =
		staticUrl && staticUrl.trim() ? staticUrl.trim() : null;

	// Build initial URL mapping.
	const mapping = {
		[ normalizedSiteUrl ]: '/',
		[ normalizedSiteUrl + '/' ]: '/',
		...( siteUrl !== normalizedSiteUrl
			? {
					[ siteUrl ]: '/',
					[ siteUrl + '/' ]: '/',
			  }
			: {} ),
		...urlMap,
	};

	/**
	 * Convert WordPress URL to static path.
	 *
	 * @param {string} url URL to convert.
	 * @return {string} Static path.
	 */
	function convertToStaticPath( url ) {
		// Handle relative URLs.
		if ( url.startsWith( '/' ) && ! url.startsWith( '//' ) ) {
			return stripPlaygroundScope( url );
		}

		// Parse URL.
		let path = '/';
		try {
			const urlObj = new URL( url );
			path = decodeURIComponent( urlObj.pathname || '/' );
		} catch {
			const pathMatch = url.match( /^https?:\/\/[^\/]+(\/.*)$/ );
			if ( pathMatch ) {
				path = pathMatch[ 1 ];
			} else if ( url.includes( '?' ) ) {
				const parts = url.split( '?' );
				path = parts[ 0 ];
			}
		}

		// Remove leading/trailing slashes.
		path = path.replace( /^\/+|\/+$/g, '' );

		// Strip WordPress Playground scope.
		path = stripPlaygroundScope( path );

		if ( ! path ) {
			return '/';
		}

		// Handle WordPress query parameters.
		try {
			const urlObj = new URL( url );
			if ( urlObj.search ) {
				const params = new URLSearchParams( urlObj.search );
				if ( params.has( 's' ) ) {
					const query = params.get( 's' );
					return `/search/?q=${ encodeURIComponent( query ) }`;
				}
			}
		} catch {
			// URL parsing failed, continue with path
		}

		// Ensure trailing slash for directory-style URLs.
		path = '/' + path;

		// Add trailing slash if not a file.
		if ( ! /\.[a-z0-9]{2,5}$/i.test( path ) ) {
			path = path.replace( /\/$/, '' ) + '/';
		}

		return path;
	}

	/**
	 * Normalize a URL for comparison.
	 *
	 * @param {string} url URL to normalize.
	 * @return {string} Normalized URL.
	 */
	function normalizeUrl( url ) {
		return normalize( url, siteUrl );
	}

	/**
	 * Check if URL is external.
	 *
	 * @param {string} url URL to check.
	 * @return {boolean} True if external.
	 */
	function isExternalUrl( url ) {
		return isExternal( url, siteUrl );
	}

	/**
	 * Rewrite a single URL.
	 *
	 * @param {string} url        URL to rewrite.
	 * @param {string} contextUrl Context URL for relative URL resolution.
	 * @return {string} Rewritten URL.
	 */
	function rewriteUrl( url, contextUrl = '' ) {
		// Skip external URLs.
		if ( isExternalUrl( url ) ) {
			return url;
		}

		// Skip special URLs.
		if ( shouldSkipUrl( url ) ) {
			return url;
		}

		// Resolve relative URLs against context.
		let absoluteUrl = url;
		if (
			contextUrl &&
			! url.startsWith( 'http://' ) &&
			! url.startsWith( 'https://' ) &&
			! url.startsWith( '/' )
		) {
			absoluteUrl = resolveRelative( url, contextUrl );
		} else if ( contextUrl && url.startsWith( '/' ) ) {
			try {
				const contextObj = new URL( contextUrl );
				absoluteUrl = contextObj.origin + url;
			} catch {
				// If context URL parsing fails, use as-is
			}
		}

		// Check URL map first.
		const urlNormalized = normalizeUrl( absoluteUrl );
		let staticPath = mapping[ urlNormalized ];

		if ( ! staticPath ) {
			staticPath = convertToStaticPath( absoluteUrl );
		}

		// Apply static URL base if configured.
		let rewrittenUrl;
		if ( normalizedStaticUrl ) {
			try {
				const staticUrlObj = new URL( normalizedStaticUrl );
				const basePath = staticUrlObj.pathname.replace( /\/$/, '' );
				rewrittenUrl = staticUrlObj.origin + basePath + staticPath;
			} catch {
				rewrittenUrl =
					normalizedStaticUrl.replace( /\/$/, '' ) + staticPath;
			}
		} else {
			rewrittenUrl = staticPath;
		}

		return applyFilters(
			'altolith.url.rewrite',
			rewrittenUrl,
			url,
			contextUrl,
			normalizedSiteUrl,
			normalizedStaticUrl
		);
	}

	/**
	 * Rewrite all URLs in HTML content.
	 *
	 * @param {string} html       HTML content.
	 * @param {string} contextUrl Current page URL for relative URL resolution.
	 * @return {string} HTML with rewritten URLs.
	 */
	function rewriteHtml( html, contextUrl ) {
		// Protect inline script content
		const { html: protectedHtml, placeholders } =
			protectScriptContent( html );
		let result = protectedHtml;

		// Extract site host and rewrite URLs
		const siteHost = extractHost( siteUrl );

		if ( siteHost ) {
			const matches = collectSiteUrlMatches( result, siteHost );
			result = replaceSiteUrlMatches(
				result,
				matches,
				rewriteUrl,
				contextUrl
			);
		}

		// Rewrite absolute paths if static URL has subdirectories
		if ( normalizedStaticUrl ) {
			try {
				const staticUrlObj = new URL( normalizedStaticUrl );
				const basePath = staticUrlObj.pathname.replace( /\/$/, '' );
				result = rewriteAbsolutePaths( result, basePath );
			} catch ( error ) {
				// Error in absolute path rewriting, continue without rewriting
			}
		}

		// Rewrite srcset and import map URLs
		result = rewriteSrcsetUrls( result, rewriteUrl, contextUrl );
		result = rewriteImportMaps( result, rewriteUrl, contextUrl );

		// Restore inline script content
		result = restoreScriptContent( result, placeholders );

		return applyFilters(
			'altolith.url.rewrite_html',
			result,
			contextUrl,
			normalizedSiteUrl,
			normalizedStaticUrl
		);
	}

	return {
		rewriteHtml,
		rewriteUrl,
		addUrlMapping: ( originalUrl, staticPath ) => {
			const normalized = normalizeUrl( originalUrl );
			mapping[ normalized ] = staticPath;
		},
		getUrlMapping: () => ( { ...mapping } ),
	};
}
