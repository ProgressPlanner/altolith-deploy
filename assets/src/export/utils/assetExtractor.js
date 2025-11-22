/**
 * Asset Extractor
 *
 * Extracts asset URLs (CSS, JS, fonts, images) from HTML content.
 *
 * @package
 */

import { resolveRelative, stripPlaygroundScope } from './urlRewriter';
import { isWebpackModuleId } from './assetExclusions';
import { applyFilters } from '@wordpress/hooks';
import { shouldCollectAsset } from './assetFilters';
import {
	STYLESHEET_PATTERNS,
	SCRIPT_PATTERN,
	INLINE_CSS_PATTERN,
	INLINE_JS_PATTERN,
	IMPORT_MAP_PATTERN,
	CSS_IMPORT_PATTERN,
	CSS_URL_PATTERN,
	JS_IMPORT_PATTERNS,
	JS_ASSET_PATTERNS,
	HTML_ATTR_PATTERNS,
	SRCSET_PATTERNS,
	INLINE_STYLE_PATTERN,
	getAssetType,
	parseSrcset,
	escapeRegex,
	extractHost,
} from './assetPatterns';

/**
 * Extract asset URLs from HTML content.
 *
 * @param {string} html    HTML content.
 * @param {string} pageUrl Page URL for resolving relative URLs.
 * @param {string} siteUrl Site URL for internal URL checking.
 * @return {Promise<Array<string>>} Array of asset URLs.
 */
export async function extractAssetsFromHtml( html, pageUrl, siteUrl ) {
	const collected = new Set();
	const processed = new Set();

	// Collect stylesheets
	for ( const pattern of STYLESHEET_PATTERNS ) {
		pattern.lastIndex = 0;
		const matches = html.matchAll( pattern );
		for ( const match of matches ) {
			const cssUrl = match[ 2 ];
			const resolvedUrl = resolveRelative( cssUrl, pageUrl );
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'css' ) ) {
				collected.add( resolvedUrl );
				await collectCssDependencies(
					resolvedUrl,
					siteUrl,
					collected,
					processed
				);
			}
		}
	}

	// Collect scripts
	SCRIPT_PATTERN.lastIndex = 0;
	const scriptMatches = html.matchAll( SCRIPT_PATTERN );
	for ( const match of scriptMatches ) {
		const jsUrl = match[ 2 ];
		const resolvedUrl = resolveRelative( jsUrl, pageUrl );
		if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
			collected.add( resolvedUrl );
			await collectJsDependencies(
				resolvedUrl,
				siteUrl,
				collected,
				processed
			);
		}
	}

	// Collect from inline CSS
	INLINE_CSS_PATTERN.lastIndex = 0;
	const inlineCssMatches = html.matchAll( INLINE_CSS_PATTERN );
	for ( const match of inlineCssMatches ) {
		collectCssInlineDependencies( match[ 1 ], pageUrl, siteUrl, collected );
	}

	// Collect from inline JS
	INLINE_JS_PATTERN.lastIndex = 0;
	const inlineJsMatches = html.matchAll( INLINE_JS_PATTERN );
	for ( const match of inlineJsMatches ) {
		await collectJsInlineDependencies(
			match[ 1 ],
			pageUrl,
			siteUrl,
			collected,
			processed
		);
	}

	// Collect from import maps
	IMPORT_MAP_PATTERN.lastIndex = 0;
	const importMapMatches = html.matchAll( IMPORT_MAP_PATTERN );
	for ( const match of importMapMatches ) {
		await collectImportmapModules(
			match[ 1 ],
			pageUrl,
			siteUrl,
			collected,
			processed
		);
	}

	// Collect from HTML attributes
	collectHtmlAttributeAssets( html, pageUrl, siteUrl, collected );

	let assets = Array.from( collected );

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
 * Collect assets from HTML attributes.
 *
 * @param {string}      html      HTML content.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 */
function collectHtmlAttributeAssets( html, pageUrl, siteUrl, collected ) {
	const siteHost = extractHost( siteUrl );

	if ( siteHost ) {
		const escapedHost = escapeRegex( siteHost );
		const patterns = [
			new RegExp( `http://${ escapedHost }[^"'\`\\s<>]*`, 'gi' ),
			new RegExp( `https://${ escapedHost }[^"'\`\\s<>]*`, 'gi' ),
			new RegExp( `//${ escapedHost }[^"'\`\\s<>]*`, 'gi' ),
		];

		const allMatches = new Set();

		for ( let i = 0; i < patterns.length; i++ ) {
			const pattern = patterns[ i ];
			let match;
			while ( ( match = pattern.exec( html ) ) !== null ) {
				const url = match[ 0 ];
				if ( ! url.includes( 'imagedelivery.net' ) ) {
					// Protocol-relative URLs (third pattern, index 2)
					if ( i === 2 ) {
						try {
							const siteUrlObj = new URL( siteUrl );
							allMatches.add( siteUrlObj.protocol + url );
						} catch {
							allMatches.add( 'https:' + url );
						}
					} else {
						allMatches.add( url );
					}
				}
			}
		}

		for ( const url of allMatches ) {
			const resolvedUrl = resolveRelative( url, pageUrl );
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'html' ) ) {
				collected.add( resolvedUrl );
			}
		}
	}

	// Collect from attribute patterns
	for ( const pattern of HTML_ATTR_PATTERNS ) {
		pattern.lastIndex = 0;
		const matches = html.matchAll( pattern );
		for ( const match of matches ) {
			const url = match[ 2 ];
			const resolvedUrl = resolveRelative( url, pageUrl );
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'html' ) ) {
				collected.add( resolvedUrl );
			}
		}
	}

	// Collect from srcset
	for ( const [ , pattern ] of Object.entries( SRCSET_PATTERNS ) ) {
		pattern.lastIndex = 0;
		const matches = html.matchAll( pattern );
		for ( const match of matches ) {
			const urls = parseSrcset( match[ 2 ] );
			for ( const url of urls ) {
				const resolvedUrl = resolveRelative( url, pageUrl );
				if ( shouldCollectAsset( resolvedUrl, siteUrl, 'html' ) ) {
					collected.add( resolvedUrl );
				}
			}
		}
	}

	// Collect from inline styles
	INLINE_STYLE_PATTERN.lastIndex = 0;
	const inlineStyleMatches = html.matchAll( INLINE_STYLE_PATTERN );
	for ( const match of inlineStyleMatches ) {
		let inlineCss = match[ 2 ];
		inlineCss = inlineCss.replace( /\\(["'])/g, '$1' );
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
 * Collect modules from import map.
 *
 * @param {string}      json      Import map JSON.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectImportmapModules(
	json,
	pageUrl,
	siteUrl,
	collected,
	processed
) {
	try {
		const importmap = JSON.parse( json );
		if ( ! importmap?.imports ) {
			return;
		}

		for ( const moduleName in importmap.imports ) {
			if ( importmap.imports.hasOwnProperty( moduleName ) ) {
				const moduleUrl = importmap.imports[ moduleName ];
				const resolvedUrl = resolveRelative( moduleUrl, pageUrl );
				if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
					collected.add( resolvedUrl );
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
		// Invalid JSON
	}
}

/**
 * Collect CSS dependencies.
 *
 * @param {string}      cssUrl    CSS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectCssDependencies( cssUrl, siteUrl, collected, processed ) {
	if ( processed.has( cssUrl ) ) {
		return;
	}
	processed.add( cssUrl );

	try {
		const response = await fetch( cssUrl, {
			method: 'GET',
			credentials: 'omit',
			headers: { 'User-Agent': 'Aether Static Site Generator' },
		} );
		if ( ! response.ok ) {
			return;
		}

		const cssContent = await response.text();

		// @import statements
		CSS_IMPORT_PATTERN.lastIndex = 0;
		const importMatches = cssContent.matchAll( CSS_IMPORT_PATTERN );
		for ( const match of importMatches ) {
			const resolvedUrl = resolveRelative( match[ 1 ], cssUrl );
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'css' ) ) {
				collected.add( resolvedUrl );
				await collectCssDependencies(
					resolvedUrl,
					siteUrl,
					collected,
					processed
				);
			}
		}

		// url() references
		CSS_URL_PATTERN.lastIndex = 0;
		const urlMatches = cssContent.matchAll( CSS_URL_PATTERN );
		for ( const match of urlMatches ) {
			const assetUrl = match[ 1 ];
			if ( assetUrl.startsWith( 'data:' ) ) {
				continue;
			}
			const resolvedUrl = resolveRelative( assetUrl, cssUrl );
			if ( shouldCollectAsset( resolvedUrl, siteUrl, 'css' ) ) {
				collected.add( resolvedUrl );
			}
		}
	} catch {
		// Failed to fetch
	}
}

/**
 * Collect CSS inline dependencies.
 *
 * @param {string}      cssContent CSS content.
 * @param {string}      baseUrl    Base URL.
 * @param {string}      siteUrl    Site URL.
 * @param {Set<string>} collected  Collected URLs.
 * @param {string}      source     Source type.
 */
function collectCssInlineDependencies(
	cssContent,
	baseUrl,
	siteUrl,
	collected,
	source = 'css'
) {
	CSS_URL_PATTERN.lastIndex = 0;
	const urlMatches = cssContent.matchAll( CSS_URL_PATTERN );
	for ( const match of urlMatches ) {
		const assetUrl = match[ 1 ];
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
 * Collect JS dependencies.
 *
 * @param {string}      jsUrl     JS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsDependencies( jsUrl, siteUrl, collected, processed ) {
	if ( processed.has( jsUrl ) ) {
		return;
	}
	processed.add( jsUrl );

	try {
		const response = await fetch( jsUrl, {
			method: 'GET',
			credentials: 'omit',
			headers: { 'User-Agent': 'Aether Static Site Generator' },
		} );
		if ( ! response.ok ) {
			return;
		}

		const jsContent = await response.text();

		// Process all import patterns
		for ( const [ , pattern ] of Object.entries( JS_IMPORT_PATTERNS ) ) {
			pattern.lastIndex = 0;
			const matches = jsContent.matchAll( pattern );
			for ( const match of matches ) {
				const importUrl = match[ 1 ];
				if ( isWebpackModuleId( importUrl ) ) {
					continue;
				}
				const resolvedUrl = resolveRelative( importUrl, jsUrl );
				if ( shouldCollectAsset( resolvedUrl, siteUrl, 'js' ) ) {
					collected.add( resolvedUrl );
					await collectJsDependencies(
						resolvedUrl,
						siteUrl,
						collected,
						processed
					);
				}
			}
		}

		await collectJsInlineDependencies(
			jsContent,
			jsUrl,
			siteUrl,
			collected,
			processed
		);
	} catch {
		// Failed to fetch
	}
}

/**
 * Collect JS inline dependencies.
 *
 * @param {string}      jsContent JS content.
 * @param {string}      baseUrl   Base URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsInlineDependencies(
	jsContent,
	baseUrl,
	siteUrl,
	collected,
	processed
) {
	for ( const pattern of JS_ASSET_PATTERNS ) {
		pattern.lastIndex = 0;
		const matches = jsContent.matchAll( pattern );
		for ( const match of matches ) {
			const assetUrl = match[ 1 ];
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
 * Get asset local path.
 *
 * @param {string} url Asset URL.
 * @return {string|null} Local path or null.
 */
export function getAssetLocalPath( url ) {
	let path = '';
	try {
		const urlObj = new URL( url );
		path = urlObj.pathname || '';
	} catch {
		const pathMatch = url.match( /^https?:\/\/[^\/]+(\/.*)$/ );
		if ( pathMatch ) {
			path = pathMatch[ 1 ];
		}
	}

	path = path.replace( /^\/+/, '' );
	path = stripPlaygroundScope( path );

	if ( ! path || path === '' ) {
		return null;
	}

	return path;
}
