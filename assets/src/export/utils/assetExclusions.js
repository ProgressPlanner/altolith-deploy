/**
 * Asset Exclusions Configuration
 *
 * Centralized configuration for assets and URL patterns that should be excluded
 * from static site generation.
 *
 */

/**
 * Image file extensions that are served from external CDNs.
 * These are skipped when found in CSS/JS, but collected when referenced in HTML.
 */
export const SKIP_EXTENSIONS = [
	'jpg',
	'jpeg',
	'png',
	'gif',
	'webp',
	'svg',
	'ico',
];

/**
 * Essential file extensions that should always be collected,
 * even if they are external URLs (e.g., Google Fonts).
 * These assets are critical for site functionality.
 */
export const ESSENTIAL_EXTENSIONS = [
	'css',
	'js',
	'woff',
	'woff2',
	'ttf',
	'eot',
	'otf',
];

/**
 * Webpack module IDs to skip (not real files, just module references).
 * These are webpack internal module IDs that don't correspond to actual files.
 */
export const WEBPACK_MODULE_IDS = [
	'react',
	'is-prop-valid',
	'uncategorized',
	'git-config',
	'react-dom',
	'react-jsx-runtime',
];

/**
 * URL patterns that should be excluded from asset collection.
 * Patterns starting with '/' are checked at the start of the URL pathname.
 * Other patterns are checked anywhere in the URL using includes().
 */
export const EXCLUDED_URL_PATTERNS = [
	'/wp-json/', // WordPress REST API endpoints
	'/xmlrpc.php', // WordPress XML-RPC endpoint
	'/wp-comments-post.php', // WordPress comment submission endpoint (405 Method Not Allowed)
	'imagedelivery.net', // External CDN (imagedelivery.net)
];

/**
 * Regex patterns for more complex exclusions.
 * These are checked after simple string patterns.
 */
export const EXCLUDED_URL_REGEX_PATTERNS = [
	/wp-admin\/.*\.php$/, // WordPress admin PHP files (wp-admin/*.php and wp-admin/**/*.php)
];

/**
 * Check if a URL matches any excluded pattern.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL should be excluded.
 */
export function isExcludedUrl( url ) {
	// Check simple string patterns first.
	const matchesStringPattern = EXCLUDED_URL_PATTERNS.some( ( pattern ) => {
		// Patterns starting with '/' should match at the start of the pathname.
		if ( pattern.startsWith( '/' ) ) {
			try {
				const urlObj = new URL( url );
				return urlObj.pathname.startsWith( pattern );
			} catch {
				// If URL parsing fails, check if URL string starts with pattern.
				return url.startsWith( pattern );
			}
		}
		// Other patterns are checked anywhere in the URL.
		return url.includes( pattern );
	} );

	if ( matchesStringPattern ) {
		return true;
	}

	// Check regex patterns for more complex exclusions.
	// Extract pathname for regex matching to avoid matching query strings or fragments.
	try {
		const urlObj = new URL( url );
		const pathname = urlObj.pathname;
		return EXCLUDED_URL_REGEX_PATTERNS.some( ( regex ) =>
			regex.test( pathname )
		);
	} catch {
		// If URL parsing fails, test against full URL string.
		return EXCLUDED_URL_REGEX_PATTERNS.some( ( regex ) =>
			regex.test( url )
		);
	}
}

/**
 * Check if a file extension is in the skip list.
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension should be skipped.
 */
export function isSkippedExtension( extension ) {
	return SKIP_EXTENSIONS.includes( extension.toLowerCase() );
}

/**
 * Check if a file extension is essential (always collected).
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension is essential.
 */
export function isEssentialExtension( extension ) {
	return ESSENTIAL_EXTENSIONS.includes( extension.toLowerCase() );
}

/**
 * Check if a module ID is a webpack internal reference.
 *
 * @param {string} moduleId Module ID to check.
 * @return {boolean} True if module ID should be skipped.
 */
export function isWebpackModuleId( moduleId ) {
	return WEBPACK_MODULE_IDS.includes( moduleId );
}
