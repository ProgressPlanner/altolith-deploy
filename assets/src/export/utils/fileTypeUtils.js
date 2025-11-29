/**
 * File Type Utils
 *
 * Utilities for determining how files should be processed during static site export.
 * Binary assets (images, fonts, video, audio) can be streamed directly to save memory,
 * while text assets (HTML, CSS, JS) need to be stored in memory for URL replacement.
 */

/**
 * Extensions that can be streamed directly without storing in memory.
 * These are binary files that don't contain URLs that need replacement.
 *
 * @type {Set<string>}
 */
export const STREAMABLE_EXTENSIONS = new Set( [
	// Images (binary, no URL content)
	'jpg',
	'jpeg',
	'png',
	'gif',
	'webp',
	'ico',
	'avif',
	'bmp',
	'tiff',
	'tif',

	// Video
	'mp4',
	'webm',
	'ogg',
	'ogv',
	'avi',
	'mov',
	'mkv',

	// Audio
	'mp3',
	'wav',
	'flac',
	'aac',
	'm4a',
	'oga',

	// Fonts
	'woff',
	'woff2',
	'ttf',
	'eot',
	'otf',

	// Documents
	'pdf',
	'doc',
	'docx',
	'xls',
	'xlsx',
	'ppt',
	'pptx',

	// Archives
	'zip',
	'rar',
	'7z',
	'tar',
	'gz',
] );

/**
 * Extensions that need to be stored in memory for URL replacement.
 * These are text files that may contain URLs pointing to the WordPress site.
 *
 * @type {Set<string>}
 */
export const MEMORY_EXTENSIONS = new Set( [
	// Stylesheets (contain URLs in url(), @import)
	'css',

	// JavaScript (may contain URLs, API calls)
	'js',
	'mjs',

	// Markup (contain URLs in src, href, etc.)
	'html',
	'htm',
	'xhtml',

	// Data files (may contain URLs)
	'json',
	'xml',
	'xsl',
	'xslt',

	// SVG (XML-based, may contain URLs in href, xlink:href)
	'svg',

	// Web manifests (contain icon URLs)
	'webmanifest',

	// Source maps (contain URLs)
	'map',

	// Text files (may need processing)
	'txt',
	'md',
] );

/**
 * Extract the file extension from a URL.
 *
 * Handles query parameters, hash fragments, and mixed case.
 *
 * @param {string} url URL to extract extension from.
 * @return {string} Lowercase extension without dot, or empty string if none.
 */
export function getFileExtension( url ) {
	if ( ! url || typeof url !== 'string' ) {
		return '';
	}

	try {
		// Remove query params and hash
		const cleanUrl = url.split( '?' )[ 0 ].split( '#' )[ 0 ];

		// Get the last path segment
		const segments = cleanUrl.split( '/' );
		const filename = segments[ segments.length - 1 ];

		// Extract extension
		const lastDotIndex = filename.lastIndexOf( '.' );
		if ( lastDotIndex === -1 || lastDotIndex === filename.length - 1 ) {
			return '';
		}

		return filename.slice( lastDotIndex + 1 ).toLowerCase();
	} catch {
		return '';
	}
}

/**
 * Determine if a file should be stored in memory for processing.
 *
 * Text-based files (CSS, JS, HTML, SVG, JSON) need to be stored in memory
 * because they may contain URLs that need to be rewritten for the static site.
 *
 * Binary files (images, fonts, video, audio) can be streamed directly to the
 * storage provider without being stored in memory, significantly reducing
 * memory usage for large sites.
 *
 * @param {string} url URL or path to check.
 * @return {boolean} True if file should be stored in memory, false if it can be streamed.
 */
export function shouldStoreInMemory( url ) {
	const extension = getFileExtension( url );

	// No extension - default to memory (safer for unknown content)
	if ( ! extension ) {
		return true;
	}

	// Check if explicitly streamable
	if ( STREAMABLE_EXTENSIONS.has( extension ) ) {
		return false;
	}

	// Check if explicitly needs memory
	if ( MEMORY_EXTENSIONS.has( extension ) ) {
		return true;
	}

	// Unknown extension - default to memory (safer)
	return true;
}
