/**
 * Asset Patterns
 *
 * Regex patterns for asset extraction from HTML, CSS, and JS.
 *
 */

/**
 * Stylesheet link patterns.
 * Two patterns handle both attribute orders: href-first and rel-first.
 */
export const STYLESHEET_PATTERNS = [
	/<link[^>]+href=(["'])([^"']+)\1[^>]*rel=["']stylesheet["'][^>]*>/gi,
	/<link[^>]+rel=["']stylesheet["'][^>]*href=(["'])([^"']+)\1[^>]*>/gi,
];

/**
 * Script src pattern.
 */
export const SCRIPT_PATTERN = /<script[^>]+src=(["'])([^"']+)\1[^>]*>/gi;

/**
 * Inline CSS in style tags pattern.
 */
export const INLINE_CSS_PATTERN = /<style[^>]*>(.*?)<\/style>/gis;

/**
 * Inline JS in script tags pattern.
 */
export const INLINE_JS_PATTERN = /<script[^>]*>(.*?)<\/script>/gis;

/**
 * Import map pattern.
 */
export const IMPORT_MAP_PATTERN =
	/<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis;

/**
 * CSS @import pattern.
 */
export const CSS_IMPORT_PATTERN =
	/@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;

/**
 * CSS url() pattern.
 * Handles quoted and unquoted URLs, stops at ) or whitespace for unquoted.
 */
export const CSS_URL_PATTERN = /url\(\s*["']?([^"')\s]+)["']?\s*\)/gi;

/**
 * JS import patterns.
 */
export const JS_IMPORT_PATTERNS = {
	// ES6 import: import ... from 'module'
	es6: /import\s+(?:[^;"']+\s+from\s+)?["']([^"']+)["']/gi,
	// Dynamic import: import('module')
	dynamic: /import\s*\(\s*["']([^"']+)["']\s*\)/gi,
	// CommonJS require: require('module')
	require: /require\s*\(\s*["']([^"']+)["']\s*\)/gi,
};

/**
 * JS asset reference patterns.
 */
export const JS_ASSET_PATTERNS = [
	// new URL() constructor
	/new\s+URL\s*\(\s*["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
	// String literals with asset extensions
	/["']([\.\/][^"']*\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
];

/**
 * HTML attribute patterns for asset extraction.
 */
export const HTML_ATTR_PATTERNS = [
	/<img[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
	/<video[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
	/<video[^>]+poster=(["'])([^"']+)\1[^>]*>?/gi,
	/<audio[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
	/<source[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
	/<link[^>]+(?:rel=["'](?:preload|prefetch)["'][^>]+)?href=(["'])([^"']+)\1[^>]*>?/gi,
];

/**
 * Srcset patterns.
 */
export const SRCSET_PATTERNS = {
	img: /<img[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi,
	source: /<source[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi,
};

/**
 * Inline style attribute pattern.
 */
export const INLINE_STYLE_PATTERN =
	/style\s*=\s*(["'])((?:(?!\1)(?:\\.|[^\\]))*)\1/gi;

/**
 * Asset type map by extension.
 */
export const ASSET_TYPE_MAP = {
	css: 'css',
	js: 'js',
	woff: 'font',
	woff2: 'font',
	ttf: 'font',
	otf: 'font',
	eot: 'font',
};

/**
 * Get file extension from URL.
 *
 * @param {string} url URL to extract extension from.
 * @return {string} File extension in lowercase, or empty string.
 */
export function getExtensionFromUrl( url ) {
	try {
		const urlObj = new URL( url );
		const pathname = urlObj.pathname;
		const lastDot = pathname.lastIndexOf( '.' );
		if ( lastDot !== -1 ) {
			return pathname.substring( lastDot + 1 ).toLowerCase();
		}
	} catch {
		const match = url.match( /\.([a-z0-9]+)(?:[?#]|$)/i );
		if ( match ) {
			return match[ 1 ].toLowerCase();
		}
	}
	return '';
}

/**
 * Get asset type from URL.
 *
 * @param {string} url Asset URL.
 * @return {string} Asset type ('css', 'js', 'font', or 'other').
 */
export function getAssetType( url ) {
	const extension = getExtensionFromUrl( url );
	return ASSET_TYPE_MAP[ extension ] || 'other';
}

/**
 * Parse srcset value into array of URLs.
 *
 * @param {string} srcsetValue Srcset attribute value.
 * @return {Array<string>} Array of URLs (without descriptors).
 */
export function parseSrcset( srcsetValue ) {
	return srcsetValue
		.split( ',' )
		.map( ( part ) => {
			const trimmed = part.trim();
			const urlMatch = trimmed.match( /^([^\s]+)/ );
			return urlMatch ? urlMatch[ 1 ] : null;
		} )
		.filter( Boolean );
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
 * Extract host from URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string.
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
