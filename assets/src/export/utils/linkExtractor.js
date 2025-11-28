/**
 * Link Extractor
 *
 * Extracts internal page links from HTML content for crawl-based URL discovery.
 * Uses parse5 for robust HTML parsing instead of regex.
 *
 */

import { resolveRelative, isExternal, normalize } from './urlUtils';
import { applyFilters } from '@wordpress/hooks';

/**
 * Lazy-loaded parse5 module.
 */
let parse5Module = null;

/**
 * Load parse5 module lazily.
 *
 * @return {Promise<Object>} parse5 module.
 */
async function loadParse5() {
	if ( parse5Module ) {
		return parse5Module;
	}
	parse5Module = await import( 'parse5' );
	return parse5Module;
}

/**
 * Hardcoded exclusions for internal links (NOT assets).
 * Assets from these paths are still valid and collected by assetExtractor.
 */
const LINK_EXCLUSIONS = [
	'/wp-admin/',
	'/wp-login.php',
	'/wp-json/',
	'?preview=true',
	'?s=', // Search results
	'/feed/',
	'/comments/feed/',
	'/trackback/',
	'/xmlrpc.php',
	'/wp-cron.php',
	'/wp-comments-post.php',
];

/**
 * Asset file extensions to skip (these are handled by assetExtractor).
 */
const ASSET_EXTENSIONS = [
	'.css',
	'.js',
	'.jpg',
	'.jpeg',
	'.png',
	'.gif',
	'.webp',
	'.svg',
	'.ico',
	'.woff',
	'.woff2',
	'.ttf',
	'.eot',
	'.otf',
	'.pdf',
	'.zip',
	'.mp3',
	'.mp4',
	'.webm',
	'.ogg',
	'.wav',
	'.avi',
	'.mov',
	'.wmv',
	'.flv',
	'.doc',
	'.docx',
	'.xls',
	'.xlsx',
	'.ppt',
	'.pptx',
	'.txt',
	'.xml',
	'.json',
];

/**
 * Walk DOM tree and execute callback on each node.
 *
 * @param {Object}   node     DOM node.
 * @param {Function} callback Callback function.
 */
function walkTree( node, callback ) {
	callback( node );
	if ( node.childNodes ) {
		for ( const child of node.childNodes ) {
			walkTree( child, callback );
		}
	}
}

/**
 * Extract internal page links from HTML content.
 *
 * @param {string} html    HTML content to parse.
 * @param {string} pageUrl Current page URL for resolving relative URLs.
 * @param {string} siteUrl Site base URL for internal URL checking.
 * @return {Promise<Array<string>>} Array of internal page URLs.
 */
export async function extractInternalLinks( html, pageUrl, siteUrl ) {
	const links = new Set();
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	walkTree( document, ( node ) => {
		if ( node.nodeName !== 'a' ) {
			return;
		}

		const hrefAttr = node.attrs?.find( ( attr ) => attr.name === 'href' );
		if ( ! hrefAttr ) {
			return;
		}

		const href = hrefAttr.value;

		// Skip non-URL hrefs
		if ( shouldSkipHref( href ) ) {
			return;
		}

		// Resolve relative URLs to absolute
		const resolvedUrl = resolveRelative( href, pageUrl );

		// Skip external URLs
		if ( isExternal( resolvedUrl, siteUrl ) ) {
			return;
		}

		// Skip excluded paths (wp-admin, feeds, etc.)
		if ( isExcludedLink( resolvedUrl ) ) {
			return;
		}

		// Skip asset files (handled by assetExtractor)
		if ( isAssetUrl( resolvedUrl ) ) {
			return;
		}

		// Normalize and add to set
		const normalizedUrl = normalize( resolvedUrl, siteUrl );
		if ( normalizedUrl ) {
			links.add( normalizedUrl );
		}
	} );

	return applyFilters(
		'altolith.links.extracted',
		Array.from( links ),
		html,
		pageUrl,
		siteUrl
	);
}

/**
 * Check if href should be skipped entirely.
 *
 * @param {string} href Href value to check.
 * @return {boolean} True if should skip.
 */
function shouldSkipHref( href ) {
	return (
		! href ||
		href.startsWith( '#' ) ||
		href.startsWith( 'javascript:' ) ||
		href.startsWith( 'mailto:' ) ||
		href.startsWith( 'tel:' ) ||
		href.startsWith( 'data:' ) ||
		href.startsWith( 'blob:' )
	);
}

/**
 * Check if URL matches exclusion patterns for links.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL should be excluded.
 */
function isExcludedLink( url ) {
	const lowerUrl = url.toLowerCase();

	for ( const pattern of LINK_EXCLUSIONS ) {
		if ( lowerUrl.includes( pattern.toLowerCase() ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Check if URL points to an asset file (not a page).
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL is an asset file.
 */
function isAssetUrl( url ) {
	try {
		const urlObj = new URL( url );
		const pathname = urlObj.pathname.toLowerCase();

		// Check for asset extensions
		for ( const ext of ASSET_EXTENSIONS ) {
			if ( pathname.endsWith( ext ) ) {
				return true;
			}
		}

		return false;
	} catch {
		// If URL parsing fails, check the string directly
		const lowerUrl = url.toLowerCase();
		for ( const ext of ASSET_EXTENSIONS ) {
			if ( lowerUrl.includes( ext + '?' ) || lowerUrl.endsWith( ext ) ) {
				return true;
			}
		}
		return false;
	}
}
