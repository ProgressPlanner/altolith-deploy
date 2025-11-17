/**
 * URL Resolver Utility
 *
 * Provides reusable methods for URL parsing, resolution, and normalization.
 * Ported from PHP URLResolver class.
 *
 * @package
 */

import { debug, debugError } from '../../utils/debug';

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
	return base.origin + baseDir + '/' + url;
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

	// URLs that start with http:// or https:// - check host.
	if ( url.startsWith( 'http://' ) || url.startsWith( 'https://' ) ) {
		try {
			const urlObj = new URL( url );
			const siteObj = new URL( siteUrl );
			return urlObj.host !== siteObj.host;
		} catch {
			// If we can't parse, treat as external to be safe.
			return true;
		}
	}

	// Protocol-relative URLs - check host.
	if ( url.startsWith( '//' ) ) {
		try {
			const urlObj = new URL( 'https:' + url );
			const siteObj = new URL( siteUrl );
			return urlObj.host !== siteObj.host;
		} catch {
			// If we can't parse, treat as external to be safe.
			return true;
		}
	}

	// If it doesn't start with a scheme or /, treat as external to be safe.
	return true;
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
 * https://static-wp.s12y.org/scope:0.1208622458215515/
 *
 * @param {string} path Path that may contain Playground scope.
 * @return {string} Path with scope removed.
 */
export function stripPlaygroundScope( path ) {
	// Pattern matches: /scope:some-words/ or scope:some-words/
	// Both at the beginning of the string and repeated in the path.
	// Scope can contain alphanumeric, hyphens, dots, and colons (e.g., scope:0.1208622458215515)
	let result = path.replace( /^\/?scope:[a-z0-9.:-]+\//i, '' );
	result = result.replace( /\/scope:[a-z0-9.:-]+\//gi, '/' );
	// Handle case where path is just the scope with no trailing content.
	result = result.replace( /^\/?scope:[a-z0-9.:-]+$/i, '' );

	return result;
}

/**
 * Normalize a URL for comparison.
 *
 * Removes fragments, trailing slashes, and normalizes scheme.
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
		// If URL parsing fails, try to strip scope from path directly
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

	return url;
}

/**
 * URL Rewriter
 *
 * Rewrites WordPress URLs to static URLs for the static site.
 * Ported from PHP URLRewriterService class.
 *
 * @package
 */

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
	// Do NOT force HTTPS on static URL - preserve the protocol the user configured
	const normalizedStaticUrl =
		staticUrl && staticUrl.trim() ? staticUrl.trim() : null;

	// Detect if static URL is a public URL (direct R2 access) vs worker endpoint.
	// Public URLs need /static/ prefix, worker endpoints add it internally.
	// Worker endpoints contain .workers.dev.
	// Local URLs with paths (like localhost:10003/static) should NOT get prefix - they already have the path.
	let isPublicUrl =
		normalizedStaticUrl && ! normalizedStaticUrl.includes( '.workers.dev' );

	// If the static URL has a pathname component (other than /), don't add /static prefix
	// Example: http://localhost:10003/static already has /static in the path
	if ( isPublicUrl && normalizedStaticUrl ) {
		try {
			const urlObj = new URL( normalizedStaticUrl );
			if ( urlObj.pathname && urlObj.pathname !== '/' ) {
				// URL already has a path component, don't add /static prefix
				isPublicUrl = false;
			}
		} catch {
			// URL parsing failed, leave isPublicUrl as is
		}
	}

	// Build initial URL mapping (homepage).
	// Include both HTTP and HTTPS versions of the site URL in the mapping.
	const mapping = {
		[ normalizedSiteUrl ]: '/',
		[ normalizedSiteUrl + '/' ]: '/',
		// Also include original siteUrl (HTTP) if different from normalized
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
			// Strip WordPress Playground scope from relative URLs.
			return stripPlaygroundScope( url );
		}

		// Parse URL.
		let path = '/';
		try {
			const urlObj = new URL( url );
			path = urlObj.pathname || '/';
		} catch {
			// If URL parsing fails, try to extract path manually
			const pathMatch = url.match( /^https?:\/\/[^\/]+(\/.*)$/ );
			if ( pathMatch ) {
				path = pathMatch[ 1 ];
			} else if ( url.includes( '?' ) ) {
				// Handle query parameters
				const parts = url.split( '?' );
				path = parts[ 0 ];
			}
		}

		// Remove leading/trailing slashes.
		path = path.replace( /^\/+|\/+$/g, '' );

		// Strip WordPress Playground scope from path.
		path = stripPlaygroundScope( path );

		if ( ! path ) {
			return '/';
		}

		// Handle WordPress query parameters.
		try {
			const urlObj = new URL( url );
			if ( urlObj.search ) {
				const params = new URLSearchParams( urlObj.search );

				// Note: We can't resolve ?p=123 or ?page_id=123 without WordPress API
				// These will be handled by the URL mapping if provided, or left as query params
				// For now, convert search queries
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
		// Use original siteUrl (not normalized) for normalization to match both HTTP and HTTPS URLs.
		return normalize( url, siteUrl );
	}

	/**
	 * Check if URL is external.
	 *
	 * @param {string} url URL to check.
	 * @return {boolean} True if external.
	 */
	function isExternalUrl( url ) {
		// Use original siteUrl (not normalized) for comparison to match both HTTP and HTTPS URLs.
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

		// Skip CF Images URLs.
		if ( url.includes( 'imagedelivery.net' ) ) {
			return url;
		}

		// Skip anchors.
		if ( url.startsWith( '#' ) ) {
			return url;
		}

		// Skip data URLs.
		if ( url.startsWith( 'data:' ) ) {
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
			// Convert to static path.
			staticPath = convertToStaticPath( absoluteUrl );
		}

		// If using public URL (direct R2 access), add /static/ prefix.
		// Worker endpoints add /static/ internally, so don't add it for those.
		if (
			isPublicUrl &&
			staticPath &&
			staticPath !== '/' &&
			! staticPath.startsWith( '/static/' )
		) {
			// Don't add /static/ to the homepage or paths that already have it.
			staticPath = '/static' + staticPath;
		}

		// Apply static URL base if configured.
		if ( normalizedStaticUrl ) {
			// Preserve the protocol from the configured static URL
			// Users can choose HTTP or HTTPS based on their deployment needs
			try {
				const staticUrlObj = new URL( normalizedStaticUrl );
				// Preserve the base path from static URL
				// Remove trailing slash from base, then append staticPath
				const basePath = staticUrlObj.pathname.replace( /\/$/, '' );
				return staticUrlObj.origin + basePath + staticPath;
			} catch {
				// If URL parsing fails, fall back to simple concatenation
				return normalizedStaticUrl.replace( /\/$/, '' ) + staticPath;
			}
		}

		return staticPath;
	}

	/**
	 * Escape special regex characters in a string.
	 *
	 * @param {string} str String to escape.
	 * @return {string} Escaped string.
	 */
	function escapeRegex( str ) {
		return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	}

	/**
	 * Rewrite all URLs in HTML content using global replace.
	 *
	 * @param {string} html       HTML content.
	 * @param {string} contextUrl Current page URL for relative URL resolution.
	 * @return {string} HTML with rewritten URLs.
	 */
	function rewriteHtml( html, contextUrl ) {
		debug( '[URL Rewriter] rewriteHtml called with:' );
		debug( '  - contextUrl:', contextUrl );
		debug( '  - siteUrl:', siteUrl );
		debug( '  - normalizedStaticUrl:', normalizedStaticUrl );
		debug( '  - HTML length:', html.length );

		// First, temporarily replace ONLY inline script content (not the tags themselves) to avoid
		// rewriting URLs inside JavaScript code. We keep the opening/closing tags so that
		// src attributes can still be rewritten.
		const scriptContentPlaceholders = {};
		let scriptCounter = 0;

		html = html.replace(
			/<script(?![^>]*type=["']importmap["'])([^>]*)>(.*?)<\/script>/gis,
			( match, openingAttrs, content ) => {
				// Only create placeholder if there's actual content (not just src attribute).
				if ( content.trim() ) {
					const placeholder = `___SCRIPT_CONTENT_${ scriptCounter }___`;
					scriptContentPlaceholders[ placeholder ] = content;
					scriptCounter++;
					return `<script${ openingAttrs }>${ placeholder }</script>`;
				}

				// No content, just return the tag as-is (external script).
				return match;
			}
		);

		// Extract site URL host for matching.
		// Use the original siteUrl (not normalized) to match both HTTP and HTTPS URLs.
		let siteHost = '';
		try {
			const siteUrlObj = new URL( siteUrl );
			siteHost = siteUrlObj.host;
		} catch {
			// If URL parsing fails, try to extract host manually.
			const hostMatch = siteUrl.match( /^https?:\/\/([^\/]+)/ );
			if ( hostMatch ) {
				siteHost = hostMatch[ 1 ];
			}
		}

		if ( siteHost ) {
			// Escape special regex characters in host.
			const escapedHost = escapeRegex( siteHost );

			// Create regex patterns to match site URLs.
			// Match complete URLs: http://host/path?query#fragment
			// Stop at quotes, whitespace, or HTML tag boundaries
			// Use word boundary-like approach: match until we hit a quote, whitespace, or HTML tag
			const httpPattern = new RegExp(
				`http://${ escapedHost }[^"'\`\\s<>]*`,
				'gi'
			);
			const httpsPattern = new RegExp(
				`https://${ escapedHost }[^"'\`\\s<>]*`,
				'gi'
			);
			const protocolRelativePattern = new RegExp(
				`//${ escapedHost }[^"'\`\\s<>]*`,
				'gi'
			);

			// Global replace: find all instances of site URLs and replace them.
			// Use a more robust approach: replace all matches in one pass
			const allMatches = [];
			let match;

			// Collect all HTTP matches
			while ( ( match = httpPattern.exec( html ) ) !== null ) {
				allMatches.push( {
					index: match.index,
					length: match[ 0 ].length,
					match: match[ 0 ],
					type: 'http',
				} );
			}

			// Collect all HTTPS matches
			while ( ( match = httpsPattern.exec( html ) ) !== null ) {
				allMatches.push( {
					index: match.index,
					length: match[ 0 ].length,
					match: match[ 0 ],
					type: 'https',
				} );
			}

			// Collect all protocol-relative matches
			while (
				( match = protocolRelativePattern.exec( html ) ) !== null
			) {
				allMatches.push( {
					index: match.index,
					length: match[ 0 ].length,
					match: match[ 0 ],
					type: 'protocol-relative',
				} );
			}

			// Sort matches by index (ascending order - forward processing)
			allMatches.sort( ( a, b ) => a.index - b.index );

			// Build new HTML by processing matches in forward order.
			// This avoids index corruption from in-place string modifications.
			let result = '';
			let lastIndex = 0;
			let lastMatchEnd = 0; // Track end of last processed match to detect overlaps

			for ( const matchData of allMatches ) {
				// Skip overlapping matches (e.g., http://host/path and //host/path)
				// This happens because protocol-relative pattern can match part of absolute URLs
				if ( matchData.index < lastMatchEnd ) {
					continue;
				}

				// Skip CF Images URLs.
				if ( matchData.match.includes( 'imagedelivery.net' ) ) {
					continue;
				}

				let urlToRewrite = matchData.match;
				if ( matchData.type === 'protocol-relative' ) {
					// Convert protocol-relative to absolute for rewriting.
					urlToRewrite = 'https:' + matchData.match;
				}

				const rewritten = rewriteUrl( urlToRewrite, contextUrl );

				// Only replace if the rewritten URL is different.
				if ( rewritten !== urlToRewrite ) {
					// Add everything from lastIndex up to this match
					result += html.substring( lastIndex, matchData.index );
					// Add the rewritten URL
					result += rewritten;
					// Update lastIndex to skip past this match
					lastIndex = matchData.index + matchData.length;
					// Track end of this match to detect overlaps in next iteration
					lastMatchEnd = matchData.index + matchData.length;
				} else {
					// Even if not replaced, update lastMatchEnd to prevent overlap issues
					lastMatchEnd = matchData.index + matchData.length;
				}
			}

			// Add remaining HTML after the last match
			result += html.substring( lastIndex );
			html = result;
		}

		// Rewrite absolute paths (starting with /) when static URL includes subdirectories.
		// This ensures paths like /wp-includes/js/file.js are rewritten to
		// /static/wp-includes/js/file.js when needed.
		if ( normalizedStaticUrl ) {
			try {
				const staticUrlObj = new URL( normalizedStaticUrl );
				const basePath = staticUrlObj.pathname.replace( /\/$/, '' );

				// Debug logging
				debug(
					'[URL Rewriter] normalizedStaticUrl:',
					normalizedStaticUrl
				);
				debug( '[URL Rewriter] basePath:', basePath );

				// Only rewrite if the static URL has a non-root base path
				if ( basePath && basePath !== '' && basePath !== '/' ) {
					debug(
						'[URL Rewriter] Rewriting absolute paths with base:',
						basePath
					);
					// Match absolute paths in href, src, action, data, and other URL attributes.
					// Pattern explanation:
					// - Match attribute names followed by = and quote
					// - Capture the absolute path (starts with /, not //)
					// - Stop at closing quote
					// We use a negative lookahead (?!//) to exclude protocol-relative URLs like //example.com
					let replaceCount = 0;
					html = html.replace(
						/(\b(?:href|src|action|data|poster|content)=)(["'`])(\/(?!\/)[^"'`]*)\2/gi,
						( match, attrPart, quote, path ) => {
							replaceCount++;
							// Skip if already includes the base path
							if ( path.startsWith( basePath + '/' ) ) {
								return match;
							}

							// Skip anchors
							if ( path === '/' || path.startsWith( '/#' ) ) {
								return match;
							}

							// Skip special paths that don't need rewriting
							if (
								path.startsWith( '/data:' ) ||
								path.startsWith( '/#' )
							) {
								return match;
							}

							// Prepend base path
							const rewrittenPath = basePath + path;
							debug(
								`[URL Rewriter] Rewriting: ${ path } -> ${ rewrittenPath }`
							);
							return attrPart + quote + rewrittenPath + quote;
						}
					);
					debug(
						`[URL Rewriter] Processed ${ replaceCount } absolute path attributes`
					);
				}
			} catch ( error ) {
				// If URL parsing fails, skip absolute path rewriting
				debugError(
					'[URL Rewriter] Error in absolute path rewriting:',
					error
				);
			}
		}

		// Handle srcset attributes (contains multiple URLs with descriptors).
		// Pattern: "image-300w.webp 300w, image-600w.webp 600w"
		// We still need special handling here to preserve descriptors.
		html = html.replace(
			/(<(?:img|source)[^>]+srcset=)(["'`])([^"'`]+)\2/gi,
			( match, tag, quote, srcsetValue ) => {
				// Parse and rewrite each URL in srcset while preserving descriptors.
				const srcsetParts = srcsetValue.split( ',' ).map( ( part ) => {
					const trimmed = part.trim();
					// Match URL and descriptor: "image-300w.webp 300w" or "image.webp 1x"
					const urlMatch = trimmed.match( /^([^\s]+)(\s+.+)?$/ );
					if ( ! urlMatch ) {
						return trimmed; // Return as-is if we can't parse
					}
					const url = urlMatch[ 1 ];
					const descriptor = urlMatch[ 2 ] || '';

					// Skip CF Images URLs.
					if ( url.includes( 'imagedelivery.net' ) ) {
						return trimmed;
					}

					// URL may have already been rewritten by global replace, but check if it needs rewriting.
					const rewritten = rewriteUrl( url, contextUrl );
					return rewritten + descriptor;
				} );
				return tag + quote + srcsetParts.join( ', ' ) + quote;
			}
		);

		// Rewrite URLs in import maps (WordPress 6.5+).
		// We still need special handling here for JSON parsing.
		html = html.replace(
			/<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis,
			( match, jsonContent ) => {
				try {
					const importmap = JSON.parse( jsonContent );

					if (
						! importmap ||
						typeof importmap !== 'object' ||
						! importmap.imports
					) {
						return match;
					}

					// Rewrite each module URL.
					for ( const moduleName in importmap.imports ) {
						if ( importmap.imports.hasOwnProperty( moduleName ) ) {
							importmap.imports[ moduleName ] = rewriteUrl(
								importmap.imports[ moduleName ],
								contextUrl
							);
						}
					}

					// Reconstruct the script tag with rewritten URLs.
					const newJson = JSON.stringify( importmap );
					return match.replace( jsonContent, newJson );
				} catch {
					// Return original if parsing fails.
					return match;
				}
			}
		);

		// Restore inline script content.
		for ( const placeholder in scriptContentPlaceholders ) {
			if ( scriptContentPlaceholders.hasOwnProperty( placeholder ) ) {
				html = html.replace(
					placeholder,
					scriptContentPlaceholders[ placeholder ]
				);
			}
		}

		return html;
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
