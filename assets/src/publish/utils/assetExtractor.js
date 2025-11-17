/**
 * Asset Extractor
 *
 * Extracts asset URLs (CSS, JS, fonts, images) from HTML content.
 * Ported from PHP AssetCollectorService logic.
 *
 * @package
 */

import {
	resolveRelative,
	isExternal,
	stripPlaygroundScope,
} from './urlRewriter';
import {
	isExcludedUrl,
	isSkippedExtension,
	isEssentialExtension,
	isWebpackModuleId,
} from './assetExclusions';
import { applyFilters } from '@wordpress/hooks';

/**
 * Extract asset URLs from HTML content.
 *
 * @param {string} html    HTML content.
 * @param {string} pageUrl Page URL for resolving relative URLs.
 * @param {string} siteUrl Site URL for internal URL checking.
 * @return {Promise<Array<string>>} Array of asset URLs.
 */
export async function extractAssetsFromHtml( html, pageUrl, siteUrl ) {
	const collected = new Set(); // Deduplicated asset URLs
	const processed = new Set(); // Track processed assets to avoid infinite loops in recursive dependency collection

	// Collect stylesheets from <link rel="stylesheet"> tags.
	// Two patterns handle both attribute orders: href-first and rel-first.
	const stylesheetPatterns = [
		/<link[^>]+href=(["'])([^"']+)\1[^>]*rel=["']stylesheet["'][^>]*>/gi,
		/<link[^>]+rel=["']stylesheet["'][^>]*href=(["'])([^"']+)\1[^>]*>/gi,
	];

	for ( const pattern of stylesheetPatterns ) {
		const matches = html.matchAll( pattern );
		for ( const match of matches ) {
			const cssUrl = match[ 2 ];
			const resolvedUrl = resolveRelative( cssUrl, pageUrl );

			// Filter assets (skip CF Images, aether plugin, external URLs for non-essential assets).
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'css' ) ) {
				collected.add( resolvedUrl );

				// RECURSIVE: Parse CSS file for @import and url() dependencies (fonts, background images).
				// collectCssDependencies fetches the CSS file and extracts nested dependencies.
				await collectCssDependencies(
					resolvedUrl,
					siteUrl,
					collected,
					processed
				);
			}
		}
	}

	// Collect JavaScript files from <script src="..."> tags.
	const scriptPattern = /<script[^>]+src=(["'])([^"']+)\1[^>]*>/gi;
	const scriptMatches = html.matchAll( scriptPattern );
	for ( const match of scriptMatches ) {
		const jsUrl = match[ 2 ];
		const resolvedUrl = resolveRelative( jsUrl, pageUrl );

		if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
			collected.add( resolvedUrl );

			// RECURSIVE: Parse JS file for import/require dependencies.
			// collectJsDependencies fetches the JS file and extracts nested dependencies (ES6 imports, dynamic imports, CommonJS requires).
			await collectJsDependencies(
				resolvedUrl,
				siteUrl,
				collected,
				processed
			);
		}
	}

	// Collect assets from inline CSS in <style> tags.
	// Extracts url() references (fonts, background images).
	const inlineCssPattern = /<style[^>]*>(.*?)<\/style>/gis;
	const inlineCssMatches = html.matchAll( inlineCssPattern );
	for ( const match of inlineCssMatches ) {
		const inlineCss = match[ 1 ];
		collectCssInlineDependencies( inlineCss, pageUrl, siteUrl, collected );
	}

	// Collect assets from inline JavaScript in <script> tags (no src attribute).
	// Extracts asset references like new URL('path') or './path.js' strings.
	const inlineJsPattern = /<script[^>]*>(.*?)<\/script>/gis;
	const inlineJsMatches = html.matchAll( inlineJsPattern );
	for ( const match of inlineJsMatches ) {
		const inlineJs = match[ 1 ];
		await collectJsInlineDependencies(
			inlineJs,
			pageUrl,
			siteUrl,
			collected,
			processed
		);
	}

	// Collect ES modules from import maps (WordPress 6.5+ feature).
	// Import maps define module specifier mappings for ES modules.
	const importMapPattern =
		/<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis;
	const importMapMatches = html.matchAll( importMapPattern );
	for ( const match of importMapMatches ) {
		const importmapJson = match[ 1 ];
		await collectImportmapModules(
			importmapJson,
			pageUrl,
			siteUrl,
			collected,
			processed
		);
	}

	// Collect assets from HTML attributes (img, source, video, audio, link tags).
	collectHtmlAttributeAssets( html, pageUrl, siteUrl, collected );

	let assets = Array.from( collected );

	/**
	 * Filter extracted assets before returning.
	 *
	 * Allows modification of asset list after extraction.
	 *
	 * @param {Array}  assets  Extracted asset URLs.
	 * @param {string} html    HTML content that was processed.
	 * @param {string} pageUrl Page URL.
	 * @param {string} siteUrl Site URL.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('aether.assets.extracted', 'my-plugin', (assets, html, pageUrl, siteUrl) => {
	 *     // Add custom asset
	 *     assets.push('https://example.com/custom-asset.js');
	 *     return assets;
	 * });
	 */
	assets = applyFilters(
		'aether.assets.extracted',
		assets,
		html,
		pageUrl,
		siteUrl
	);

	return assets;
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
 * Collect assets from HTML attributes (img, source, video, audio, link tags).
 *
 * Uses global regex to find all instances of site URLs in HTML, then extracts
 * and resolves them. This catches all edge cases automatically (meta tags,
 * form actions, canonical links, etc.).
 *
 * @param {string}      html      HTML content.
 * @param {string}      pageUrl   Page URL for resolving relative URLs.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 */
function collectHtmlAttributeAssets( html, pageUrl, siteUrl, collected ) {
	// Extract site URL host for matching.
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

		// Find all site URLs and collect them.
		const allMatches = new Set();

		// Collect http:// URLs.
		let match;
		while ( ( match = httpPattern.exec( html ) ) !== null ) {
			const url = match[ 0 ];
			// Skip CF Images URLs.
			if ( ! url.includes( 'imagedelivery.net' ) ) {
				allMatches.add( url );
			}
		}

		// Collect https:// URLs.
		while ( ( match = httpsPattern.exec( html ) ) !== null ) {
			const url = match[ 0 ];
			// Skip CF Images URLs.
			if ( ! url.includes( 'imagedelivery.net' ) ) {
				allMatches.add( url );
			}
		}

		// Collect protocol-relative URLs.
		while ( ( match = protocolRelativePattern.exec( html ) ) !== null ) {
			const url = match[ 0 ];
			// Skip CF Images URLs.
			if ( ! url.includes( 'imagedelivery.net' ) ) {
				// Convert protocol-relative to absolute using source site's protocol.
				// This ensures protocol consistency with the source site.
				let protocol = 'https:';
				try {
					const siteUrlObj = new URL( siteUrl );
					protocol = siteUrlObj.protocol;
				} catch {
					// Fallback to HTTPS if siteUrl parsing fails
				}
				const absoluteUrl = protocol + url;
				allMatches.add( absoluteUrl );
			}
		}

		// Process all collected URLs.
		for ( const url of allMatches ) {
			const resolvedUrl = resolveRelative( url, pageUrl );
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'html' ) ) {
				collected.add( resolvedUrl );
			}
		}
	}

	// Collect relative URLs from common attributes (src, poster, href for preload/prefetch).
	// These patterns handle relative URLs that don't include the site host.
	// Patterns are tolerant of malformed HTML (missing closing bracket).
	const attrPatterns = [
		// img src
		/<img[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
		// video src
		/<video[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
		// video poster
		/<video[^>]+poster=(["'])([^"']+)\1[^>]*>?/gi,
		// audio src
		/<audio[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
		// source src
		/<source[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
		// link preload/prefetch href
		/<link[^>]+(?:rel=["'](?:preload|prefetch)["'][^>]+)?href=(["'])([^"']+)\1[^>]*>?/gi,
	];

	for ( const pattern of attrPatterns ) {
		const matches = html.matchAll( pattern );
		for ( const match of matches ) {
			const url = match[ 2 ];
			const resolvedUrl = resolveRelative( url, pageUrl );
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'html' ) ) {
				collected.add( resolvedUrl );
			}
		}
	}

	// Still handle srcset attributes separately to extract individual URLs with descriptors.
	// Pattern: "image-300w.webp 300w, image-600w.webp 600w"
	const imgSrcsetPattern = /<img[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi;
	const srcsetMatches = html.matchAll( imgSrcsetPattern );
	for ( const match of srcsetMatches ) {
		const srcsetValue = match[ 2 ];
		// Parse srcset: "image-300w.webp 300w, image-600w.webp 600w"
		const srcsetUrls = srcsetValue.split( ',' ).map( ( part ) => {
			// Extract URL (everything before the descriptor like "300w" or "1x").
			const trimmed = part.trim();
			const urlMatch = trimmed.match( /^([^\s]+)/ );
			return urlMatch ? urlMatch[ 1 ] : null;
		} );
		for ( const srcsetUrl of srcsetUrls ) {
			if ( srcsetUrl ) {
				const resolvedUrl = resolveRelative( srcsetUrl, pageUrl );
				if ( shouldCollectAsset( resolvedUrl, siteUrl, 'html' ) ) {
					collected.add( resolvedUrl );
				}
			}
		}
	}

	const sourceSrcsetPattern = /<source[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi;
	const sourceSrcsetMatches = html.matchAll( sourceSrcsetPattern );
	for ( const match of sourceSrcsetMatches ) {
		const srcsetValue = match[ 2 ];
		const srcsetUrls = srcsetValue.split( ',' ).map( ( part ) => {
			const trimmed = part.trim();
			const urlMatch = trimmed.match( /^([^\s]+)/ );
			return urlMatch ? urlMatch[ 1 ] : null;
		} );
		for ( const srcsetUrl of srcsetUrls ) {
			if ( srcsetUrl ) {
				const resolvedUrl = resolveRelative( srcsetUrl, pageUrl );
				if ( shouldCollectAsset( resolvedUrl, siteUrl, 'html' ) ) {
					collected.add( resolvedUrl );
				}
			}
		}
	}

	// Collect assets from inline style attributes (e.g., style="background: url('...')").
	// Extract url() references from inline CSS in style attributes.
	// Pattern handles both single and double quotes, allowing nested quotes of different type.
	// Also handles escaped quotes: style="background: url(\"...\")"
	// Match style="..." or style='...' - extract everything between matching quotes, handling escapes.
	// Pattern: match opening quote, then any character that's not the closing quote (unless escaped), then closing quote.
	const inlineStylePattern =
		/style\s*=\s*(["'])((?:(?!\1)(?:\\.|[^\\]))*)\1/gi;
	const inlineStyleMatches = html.matchAll( inlineStylePattern );
	for ( const match of inlineStyleMatches ) {
		let inlineCss = match[ 2 ];
		// Unescape escaped quotes for proper CSS parsing
		inlineCss = inlineCss.replace( /\\(["'])/g, '$1' );
		// Use the same CSS dependency collection logic for inline styles.
		// Pass 'html' as source so images are collected.
		collectCssInlineDependencies(
			inlineCss,
			pageUrl,
			siteUrl,
			collected,
			'html'
		);
	}
}

/**
 * Collect modules referenced in an import map.
 *
 * @param {string}      importmapJson Import map JSON content.
 * @param {string}      pageUrl       Page URL for resolving relative URLs.
 * @param {string}      siteUrl       Site URL.
 * @param {Set<string>} collected     Collected asset URLs.
 * @param {Set<string>} processed     Processed URLs to avoid loops.
 */
async function collectImportmapModules(
	importmapJson,
	pageUrl,
	siteUrl,
	collected,
	processed
) {
	try {
		const importmap = JSON.parse( importmapJson );

		if (
			! importmap ||
			typeof importmap !== 'object' ||
			! importmap.imports
		) {
			return;
		}

		for ( const moduleName in importmap.imports ) {
			if ( importmap.imports.hasOwnProperty( moduleName ) ) {
				const moduleUrl = importmap.imports[ moduleName ];
				const resolvedUrl = resolveRelative( moduleUrl, pageUrl );

				if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
					collected.add( resolvedUrl );
					// Recursively collect module dependencies.
					await collectJsDependencies(
						resolvedUrl,
						siteUrl,
						collected,
						processed
					);
				}
			}
		}
	} catch {
		// Invalid JSON, skip
	}
}

/**
 * Collect CSS dependencies (fonts, images, @import).
 *
 * @param {string}      cssUrl    CSS file URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 * @param {Set<string>} processed Processed URLs to avoid loops.
 */
async function collectCssDependencies( cssUrl, siteUrl, collected, processed ) {
	if ( processed.has( cssUrl ) ) {
		return; // Already processed
	}
	processed.add( cssUrl );

	try {
		const response = await fetch( cssUrl, {
			method: 'GET',
			credentials: 'omit',
			headers: {
				'User-Agent': 'Aether Static Site Generator',
			},
		} );
		if ( ! response.ok ) {
			return;
		}

		const cssContent = await response.text();

		// Extract @import statements.
		const importPattern = /@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;
		const importMatches = cssContent.matchAll( importPattern );
		for ( const match of importMatches ) {
			const importUrl = match[ 1 ];
			const resolvedUrl = resolveRelative( importUrl, cssUrl );

			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'css' ) ) {
				collected.add( resolvedUrl );
				// Recursively collect dependencies.
				await collectCssDependencies(
					resolvedUrl,
					siteUrl,
					collected,
					processed
				);
			}
		}

		// Extract url() references (fonts, background images).
		const urlPattern = /url\(["']?([^"')]+)["']?\)/gi;
		const urlMatches = cssContent.matchAll( urlPattern );
		for ( const match of urlMatches ) {
			const assetUrl = match[ 1 ];
			// Skip data URLs.
			if ( assetUrl.startsWith( 'data:' ) ) {
				continue;
			}

			const resolvedUrl = resolveRelative( assetUrl, cssUrl );

			// Collect fonts and other assets (but skip images - they're on CF Images).
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'css' ) ) {
				collected.add( resolvedUrl );
			}
		}
	} catch ( error ) {
		// Failed to fetch CSS - skip this asset
	}
}

/**
 * Collect CSS dependencies from inline CSS content.
 *
 * @param {string}      cssContent Inline CSS content.
 * @param {string}      baseUrl    Base URL for resolving relative URLs.
 * @param {string}      siteUrl    Site URL.
 * @param {Set<string>} collected  Collected asset URLs.
 * @param {string}      source     Source where CSS was found ('html', 'css', 'js').
 */
function collectCssInlineDependencies(
	cssContent,
	baseUrl,
	siteUrl,
	collected,
	source = 'css'
) {
	// Extract url() references (fonts, background images).
	const urlPattern = /url\(["']?([^"')]+)["']?\)/gi;
	const urlMatches = cssContent.matchAll( urlPattern );
	for ( const match of urlMatches ) {
		const assetUrl = match[ 1 ];
		// Skip data URLs.
		if ( assetUrl.startsWith( 'data:' ) ) {
			continue;
		}

		const resolvedUrl = resolveRelative( assetUrl, baseUrl );

		if ( shouldCollectAsset( resolvedUrl, siteUrl, source ) ) {
			collected.add( resolvedUrl );
		}
	}
}

/**
 * Collect JS dependencies (imports, dynamic imports, asset references).
 *
 * @param {string}      jsUrl     JavaScript file URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 * @param {Set<string>} processed Processed URLs to avoid loops.
 */
async function collectJsDependencies( jsUrl, siteUrl, collected, processed ) {
	if ( processed.has( jsUrl ) ) {
		return; // Already processed
	}
	processed.add( jsUrl );

	try {
		const response = await fetch( jsUrl, {
			method: 'GET',
			credentials: 'omit',
			headers: {
				'User-Agent': 'Aether Static Site Generator',
			},
		} );
		if ( ! response.ok ) {
			return;
		}

		const jsContent = await response.text();

		// Extract ES6 import statements: import ... from 'module'
		const importPattern =
			/import\s+(?:[^;"']+\s+from\s+)?["']([^"']+)["']/gi;
		const importMatches = jsContent.matchAll( importPattern );
		for ( const match of importMatches ) {
			const importUrl = match[ 1 ];

			// Skip webpack module IDs (not real files)
			if ( isWebpackModuleId( importUrl ) ) {
				continue;
			}

			const resolvedUrl = resolveRelative( importUrl, jsUrl );

			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
				collected.add( resolvedUrl );
				// Recursively collect dependencies.
				await collectJsDependencies(
					resolvedUrl,
					siteUrl,
					collected,
					processed
				);
			}
		}

		// Extract dynamic imports: import('module').
		const dynamicImportPattern = /import\s*\(\s*["']([^"']+)["']\s*\)/gi;
		const dynamicImportMatches = jsContent.matchAll( dynamicImportPattern );
		for ( const match of dynamicImportMatches ) {
			const importUrl = match[ 1 ];

			// Skip webpack module IDs (not real files)
			if ( isWebpackModuleId( importUrl ) ) {
				continue;
			}

			const resolvedUrl = resolveRelative( importUrl, jsUrl );

			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
				collected.add( resolvedUrl );
				// Recursively collect dependencies.
				await collectJsDependencies(
					resolvedUrl,
					siteUrl,
					collected,
					processed
				);
			}
		}

		// Extract CommonJS require: require('module').
		const requirePattern = /require\s*\(\s*["']([^"']+)["']\s*\)/gi;
		const requireMatches = jsContent.matchAll( requirePattern );
		for ( const match of requireMatches ) {
			const requireUrl = match[ 1 ];

			// Skip webpack module IDs (not real files)
			if ( isWebpackModuleId( requireUrl ) ) {
				continue;
			}

			const resolvedUrl = resolveRelative( requireUrl, jsUrl );

			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
				collected.add( resolvedUrl );
				// Recursively collect dependencies.
				await collectJsDependencies(
					resolvedUrl,
					siteUrl,
					collected,
					processed
				);
			}
		}

		// Extract URL references in strings (for images, fonts, etc).
		await collectJsInlineDependencies(
			jsContent,
			jsUrl,
			siteUrl,
			collected,
			processed
		);
	} catch ( error ) {
		// Failed to fetch JS - skip this asset
	}
}

/**
 * Collect asset dependencies from inline JS content.
 *
 * @param {string}      jsContent Inline JS content.
 * @param {string}      baseUrl   Base URL for resolving relative URLs.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 * @param {Set<string>} processed Processed URLs to avoid loops.
 */
async function collectJsInlineDependencies(
	jsContent,
	baseUrl,
	siteUrl,
	collected,
	processed
) {
	// Extract URL references: new URL('path', ...) or 'path' in context of URLs.
	const assetPatterns = [
		// new URL() constructor.
		/new\s+URL\s*\(\s*["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
		// String literals with asset extensions (more conservative to avoid false positives).
		/["']([\.\/][^"']*\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
	];

	for ( const pattern of assetPatterns ) {
		const matches = jsContent.matchAll( pattern );
		for ( const match of matches ) {
			const assetUrl = match[ 1 ];
			// Skip data URLs and absolute URLs to external domains.
			if (
				assetUrl.startsWith( 'data:' ) ||
				assetUrl.startsWith( 'http://' ) ||
				assetUrl.startsWith( 'https://' )
			) {
				continue;
			}

			const resolvedUrl = resolveRelative( assetUrl, baseUrl );

			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
				collected.add( resolvedUrl );

				// If it's a CSS or JS file, recursively collect its dependencies.
				const type = getAssetType( resolvedUrl );
				if ( type === 'css' ) {
					await collectCssDependencies(
						resolvedUrl,
						siteUrl,
						collected,
						processed
					);
				} else if ( type === 'js' ) {
					await collectJsDependencies(
						resolvedUrl,
						siteUrl,
						collected,
						processed
					);
				}
			}
		}
	}
}

/**
 * Check if asset should be collected.
 *
 * @param {string} url     Asset URL.
 * @param {string} siteUrl Site URL.
 * @param {string} source  Source where asset was found ('html', 'css', 'js').
 * @return {boolean} True if should collect.
 */
function shouldCollectAsset( url, siteUrl, source = 'css' ) {
	// FILTER 0: Skip webpack module IDs (not real files).
	// These are webpack internal module references that don't correspond to actual files.
	// Extract just the filename/path part to check against module IDs.
	try {
		const urlObj = new URL( url );
		const pathname = urlObj.pathname;
		const filename = pathname.split( '/' ).pop() || pathname;
		const moduleId = filename.replace( /\.[^.]*$/, '' ); // Remove extension

		if ( isWebpackModuleId( moduleId ) ) {
			return false;
		}
	} catch {
		// If URL parsing fails, try to extract filename manually
		const filenameMatch = url.match( /\/([^\/]+)(?:\.[^.]*)?(?:\?|$)/ );
		if ( filenameMatch ) {
			const moduleId = filenameMatch[ 1 ];
			if ( isWebpackModuleId( moduleId ) ) {
				return false;
			}
		}
	}

	// Extract file extension to determine asset type.
	let extension = '';
	try {
		const urlObj = new URL( url );
		const pathname = urlObj.pathname;
		const lastDot = pathname.lastIndexOf( '.' );
		if ( lastDot !== -1 ) {
			extension = pathname.substring( lastDot + 1 ).toLowerCase();
		}
	} catch {
		// Fallback: If URL parsing fails, use regex to extract extension.
		const match = url.match( /\.([a-z0-9]+)(?:[?#]|$)/i );
		if ( match ) {
			extension = match[ 1 ].toLowerCase();
		}
	}

	// PRIORITY 1: Always collect essential assets (CSS, JS, fonts) EVEN IF EXTERNAL.
	// These assets are critical for site functionality and must be included.
	// External CDN assets (Google Fonts, etc) are collected and self-hosted.
	// Check this BEFORE exclusion patterns to ensure essential assets are never excluded.
	if ( isEssentialExtension( extension ) ) {
		return true;
	}

	// FILTER 1 & 2: Skip excluded URL patterns (external CDNs, Aether plugin, REST API, etc.).
	// Only applies to non-essential assets (essential assets already returned above).
	if ( isExcludedUrl( url ) ) {
		return false;
	}

	// FILTER 3: Always skip external URLs (including offloaded assets) for non-essential assets.
	// Only collect internal URLs to avoid collecting external/offloaded assets.
	if ( isExternal( url, siteUrl ) ) {
		return false;
	}

	// PRIORITY 2: Collect images when referenced in HTML (internal URLs only).
	// Images in CSS are handled by CF Images, but HTML-referenced images need to be uploaded.
	if ( source === 'html' && isSkippedExtension( extension ) ) {
		// Already checked for external URLs above, so this is an internal image
		return true;
	}

	// FILTER 4: Skip image files when found in CSS/JS (handled by CF Images).
	// Images may be hosted on external CDNs, not stored in static site.
	if ( isSkippedExtension( extension ) ) {
		return false;
	}

	// PRIORITY 3: For other non-essential assets, collect if internal to this site.
	// This prevents collecting random external assets that aren't critical.
	let shouldCollect = true;

	/**
	 * Filter whether an asset should be collected.
	 *
	 * Allows custom logic to include/exclude specific assets.
	 *
	 * @param {boolean} shouldCollect Whether to collect this asset (default: true).
	 * @param {string}  url           Asset URL.
	 * @param {string}  siteUrl       Site URL.
	 * @param {string}  source        Asset source ('css', 'js', 'html').
	 * @param {string}  extension     File extension.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('aether.assets.should_collect', 'my-plugin', (shouldCollect, url, siteUrl, source, extension) => {
	 *     // Skip all PDF files
	 *     if (extension === 'pdf') {
	 *         return false;
	 *     }
	 *     return shouldCollect;
	 * });
	 */
	shouldCollect = applyFilters(
		'aether.assets.should_collect',
		shouldCollect,
		url,
		siteUrl,
		source,
		extension
	);

	return shouldCollect;
}

/**
 * Get asset type from URL.
 *
 * @param {string} url Asset URL.
 * @return {string} Asset type.
 */
function getAssetType( url ) {
	let extension = '';
	try {
		const urlObj = new URL( url );
		const pathname = urlObj.pathname;
		const lastDot = pathname.lastIndexOf( '.' );
		if ( lastDot !== -1 ) {
			extension = pathname.substring( lastDot + 1 ).toLowerCase();
		}
	} catch {
		// If URL parsing fails, try to extract extension manually
		const match = url.match( /\.([a-z0-9]+)(?:[?#]|$)/i );
		if ( match ) {
			extension = match[ 1 ].toLowerCase();
		}
	}

	const typeMap = {
		css: 'css',
		js: 'js',
		woff: 'font',
		woff2: 'font',
		ttf: 'font',
		otf: 'font',
		eot: 'font',
	};

	return typeMap[ extension ] || 'other';
}

/**
 * Get asset local path for an asset URL.
 *
 * @param {string} url Asset URL.
 * @return {string} Local file path (relative to static root).
 */
export function getAssetLocalPath( url ) {
	// Extract pathname from URL.
	let path = '';
	try {
		const urlObj = new URL( url );
		path = urlObj.pathname || '';
	} catch {
		// Fallback: If URL parsing fails, extract path manually with regex.
		const pathMatch = url.match( /^https?:\/\/[^\/]+(\/.*)$/ );
		if ( pathMatch ) {
			path = pathMatch[ 1 ];
		}
	}

	// Remove leading slashes (normalize path).
	path = path.replace( /^\/+/, '' );

	// CRITICAL: Remove WordPress Playground scope prefix.
	// Playground URLs contain scope prefix like /scope:12345/wp-content/...
	// This must be stripped to get the actual file path: wp-content/...
	path = stripPlaygroundScope( path );

	return path;
}
