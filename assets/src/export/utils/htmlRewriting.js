/**
 * HTML Rewriting Utilities
 *
 * Helper functions for HTML URL rewriting.
 *
 */

import { escapeRegex } from './urlUtils';

/**
 * Protect inline script content by replacing with placeholders.
 *
 * @param {string} html HTML content.
 * @return {Object} Object with protected HTML and placeholders map.
 */
export function protectScriptContent( html ) {
	const placeholders = {};
	let counter = 0;

	const protectedHtml = html.replace(
		/<script(?![^>]*type=["']importmap["'])([^>]*)>(.*?)<\/script>/gis,
		( match, openingAttrs, content ) => {
			if ( content.trim() ) {
				const placeholder = `___SCRIPT_CONTENT_${ counter }___`;
				placeholders[ placeholder ] = content;
				counter++;
				return `<script${ openingAttrs }>${ placeholder }</script>`;
			}
			return match;
		}
	);

	return { html: protectedHtml, placeholders };
}

/**
 * Restore inline script content from placeholders.
 *
 * @param {string} html         HTML content with placeholders.
 * @param {Object} placeholders Placeholders map.
 * @return {string} HTML with restored script content.
 */
export function restoreScriptContent( html, placeholders ) {
	let result = html;
	for ( const placeholder in placeholders ) {
		if ( placeholders.hasOwnProperty( placeholder ) ) {
			result = result.replace( placeholder, placeholders[ placeholder ] );
		}
	}
	return result;
}

/**
 * Collect all site URL matches from HTML.
 *
 * @param {string} html     HTML content.
 * @param {string} siteHost Site host to match.
 * @return {Array} Array of match objects with index, length, match, and type.
 */
export function collectSiteUrlMatches( html, siteHost ) {
	const escapedHost = escapeRegex( siteHost );
	const matches = [];

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

	let match;

	while ( ( match = httpPattern.exec( html ) ) !== null ) {
		matches.push( {
			index: match.index,
			length: match[ 0 ].length,
			match: match[ 0 ],
			type: 'http',
		} );
	}

	while ( ( match = httpsPattern.exec( html ) ) !== null ) {
		matches.push( {
			index: match.index,
			length: match[ 0 ].length,
			match: match[ 0 ],
			type: 'https',
		} );
	}

	while ( ( match = protocolRelativePattern.exec( html ) ) !== null ) {
		matches.push( {
			index: match.index,
			length: match[ 0 ].length,
			match: match[ 0 ],
			type: 'protocol-relative',
		} );
	}

	// Sort by index
	matches.sort( ( a, b ) => a.index - b.index );

	return matches;
}

/**
 * Replace site URL matches in HTML.
 *
 * @param {string}   html       HTML content.
 * @param {Array}    matches    Match objects from collectSiteUrlMatches.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with replaced URLs.
 */
export function replaceSiteUrlMatches( html, matches, rewriteUrl, contextUrl ) {
	let result = '';
	let lastIndex = 0;
	let lastMatchEnd = 0;

	for ( const matchData of matches ) {
		// Skip overlapping matches
		if ( matchData.index < lastMatchEnd ) {
			continue;
		}

		// Skip CF Images URLs
		if ( matchData.match.includes( 'imagedelivery.net' ) ) {
			continue;
		}

		let urlToRewrite = matchData.match;
		if ( matchData.type === 'protocol-relative' ) {
			urlToRewrite = 'https:' + matchData.match;
		}

		const rewritten = rewriteUrl( urlToRewrite, contextUrl );

		if ( rewritten !== urlToRewrite ) {
			result += html.substring( lastIndex, matchData.index );
			result += rewritten;
			lastIndex = matchData.index + matchData.length;
			lastMatchEnd = matchData.index + matchData.length;
		} else {
			lastMatchEnd = matchData.index + matchData.length;
		}
	}

	result += html.substring( lastIndex );
	return result;
}

/**
 * Rewrite absolute paths in HTML attributes.
 *
 * @param {string} html     HTML content.
 * @param {string} basePath Base path to prepend.
 * @return {string} HTML with rewritten paths.
 */
export function rewriteAbsolutePaths( html, basePath ) {
	if ( ! basePath || basePath === '' || basePath === '/' ) {
		return html;
	}

	const result = html.replace(
		/(\b(?:href|src|action|data|poster|content)=)(["'`])(\/(?!\/)[^"'`]*)\2/gi,
		( match, attrPart, quote, path ) => {
			// Skip if already includes the base path
			if ( path.startsWith( basePath + '/' ) ) {
				return match;
			}

			// Skip anchors and special paths
			if (
				path === '/' ||
				path.startsWith( '/#' ) ||
				path.startsWith( '/data:' )
			) {
				return match;
			}

			const rewrittenPath = basePath + path;
			return attrPart + quote + rewrittenPath + quote;
		}
	);

	return result;
}

/**
 * Rewrite srcset attribute URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten srcset URLs.
 */
export function rewriteSrcsetUrls( html, rewriteUrl, contextUrl ) {
	return html.replace(
		/(<(?:img|source)[^>]+srcset=)(["'`])([^"'`]+)\2/gi,
		( match, tag, quote, srcsetValue ) => {
			const srcsetParts = srcsetValue.split( ',' ).map( ( part ) => {
				const trimmed = part.trim();
				const urlMatch = trimmed.match( /^([^\s]+)(\s+.+)?$/ );
				if ( ! urlMatch ) {
					return trimmed;
				}

				const url = urlMatch[ 1 ];
				const descriptor = urlMatch[ 2 ] || '';

				if ( url.includes( 'imagedelivery.net' ) ) {
					return trimmed;
				}

				const rewritten = rewriteUrl( url, contextUrl );
				return rewritten + descriptor;
			} );
			return tag + quote + srcsetParts.join( ', ' ) + quote;
		}
	);
}

/**
 * Rewrite import map URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten import map URLs.
 */
export function rewriteImportMaps( html, rewriteUrl, contextUrl ) {
	return html.replace(
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

				for ( const moduleName in importmap.imports ) {
					if ( importmap.imports.hasOwnProperty( moduleName ) ) {
						importmap.imports[ moduleName ] = rewriteUrl(
							importmap.imports[ moduleName ],
							contextUrl
						);
					}
				}

				const newJson = JSON.stringify( importmap );
				return match.replace( jsonContent, newJson );
			} catch {
				return match;
			}
		}
	);
}
