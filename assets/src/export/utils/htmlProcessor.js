/**
 * HTML Processor
 *
 * Processes HTML for static site generation.
 * Ported from PHP HTMLGeneratorService::processHtml() logic.
 *
 */

import { createUrlRewriter, stripPlaygroundScope } from './urlRewriter';

/**
 * Process HTML for static site.
 *
 * @param {string}      html          HTML content.
 * @param {string}      url           Source URL.
 * @param {string}      siteUrl       Site URL.
 * @param {string|null} staticSiteUrl Static site URL for URL rewriting.
 * @return {string} Processed HTML.
 */
export function processHtml( html, url, siteUrl, staticSiteUrl = null ) {
	// STEP 1: Remove admin bar from HTML (in case source was generated while logged in).
	// This removes #wpadminbar div, related CSS/JS, and body classes.
	html = removeAdminBar( html );

	// STEP 2: Remove dynamic WordPress links (RSS comments feed, REST API, XML-RPC).
	// These features don't exist in static exports.
	html = removeDynamicWpLinks( html );

	// STEP 3: Replace all internal URLs (absolute → relative or custom domain).
	// This is the main URL rewriting step that makes the static site work.
	const urlRewriter = createUrlRewriter( siteUrl, staticSiteUrl );
	html = urlRewriter.rewriteHtml( html, url );

	return html;
}

/**
 * Remove admin bar from HTML.
 *
 * Strips the WordPress admin bar (#wpadminbar) and related styles/scripts
 * that may have been rendered if the source page was fetched while logged in.
 *
 * @param {string} html HTML content.
 * @return {string} HTML with admin bar removed.
 */
function removeAdminBar( html ) {
	// Helper function to remove HTML elements by attribute matching.
	// Used to remove admin bar CSS, JS, and HTML by ID or class.
	const removeElementsByAttr = (
		htmlContent,
		element,
		attribute,
		valuePattern,
		exactMatch = false
	) => {
		// Escape regex special characters in pattern.
		const escapedPattern = valuePattern.replace(
			/[.*+?^${}()|[\]\\]/g,
			'\\$&'
		);

		// Build regex pattern for attribute matching.
		// exactMatch=true: id="exact-value"
		// exactMatch=false: id="contains-value-anywhere"
		let attrPattern;
		if ( exactMatch ) {
			attrPattern = `${ attribute }=["']${ escapedPattern }["']`;
		} else {
			attrPattern = `${ attribute }=["'][^"']*${ escapedPattern }[^"']*["']`;
		}

		// Handle self-closing tags (link).
		// Pattern: <link ... id="admin-bar-css" ... >
		if ( element === 'link' ) {
			const pattern = new RegExp(
				`<${ element }[^>]*${ attrPattern }[^>]*>`,
				'gi'
			);
			return htmlContent.replace( pattern, '' );
		}

		// Handle tags with content (script, style, div).
		// Pattern: <script ... id="admin-bar-js" ...>...</script>
		const pattern = new RegExp(
			`<${ element }[^>]*${ attrPattern }[^>]*>.*?<\/${ element }>`,
			'gis'
		);
		return htmlContent.replace( pattern, '' );
	};

	// Remove admin bar CSS link.
	html = removeElementsByAttr( html, 'link', 'id', 'admin-bar-css', true );
	html = removeElementsByAttr( html, 'script', 'id', 'admin-bar-css', true );
	html = removeElementsByAttr( html, 'style', 'id', 'admin-bar-css', true );
	html = removeElementsByAttr( html, 'div', 'id', 'admin-bar-css', true );

	// Remove dashicons CSS link (used by admin bar).
	html = removeElementsByAttr( html, 'link', 'id', 'dashicons-css', true );
	html = removeElementsByAttr( html, 'script', 'id', 'dashicons-css', true );
	html = removeElementsByAttr( html, 'style', 'id', 'dashicons-css', true );
	html = removeElementsByAttr( html, 'div', 'id', 'dashicons-css', true );

	// Remove admin bar container div.
	html = removeElementsByAttr( html, 'link', 'id', 'wpadminbar', true );
	html = removeElementsByAttr( html, 'script', 'id', 'wpadminbar', true );
	html = removeElementsByAttr( html, 'style', 'id', 'wpadminbar', true );
	html = removeElementsByAttr( html, 'div', 'id', 'wpadminbar', true );

	// Remove admin bar inline styles.
	html = removeElementsByAttr(
		html,
		'link',
		'id',
		'admin-bar-inline-css',
		true
	);
	html = removeElementsByAttr(
		html,
		'script',
		'id',
		'admin-bar-inline-css',
		true
	);
	html = removeElementsByAttr(
		html,
		'style',
		'id',
		'admin-bar-inline-css',
		true
	);
	html = removeElementsByAttr(
		html,
		'div',
		'id',
		'admin-bar-inline-css',
		true
	);

	// Remove admin bar scripts.
	html = removeElementsByAttr( html, 'link', 'id', 'admin-bar-js', true );
	html = removeElementsByAttr( html, 'script', 'id', 'admin-bar-js', true );
	html = removeElementsByAttr( html, 'style', 'id', 'admin-bar-js', true );
	html = removeElementsByAttr( html, 'div', 'id', 'admin-bar-js', true );

	// Remove any remaining admin bar related inline styles.
	html = html.replace( /<style[^>]*>.*?#wpadminbar.*?<\/style>/gis, '' );

	// Remove logged-in and admin-bar classes from body tag.
	// These classes affect page layout and should be removed for static site.
	const classesToRemove = [ 'logged-in', 'admin-bar' ];
	for ( const className of classesToRemove ) {
		const escapedClass = className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
		const pattern = new RegExp(
			`(class=["'][^"']*)\\b${ escapedClass }\\b([^"']*["'])`,
			'gi'
		);
		html = html.replace( pattern, '$1$2' );
	}

	// Add no-admin-bar class to body (opposite of admin-bar class).
	// WordPress themes use this class to adjust layout when admin bar is absent.
	if ( ! html.includes( 'no-admin-bar' ) ) {
		html = html.replace(
			/(<body[^>]*class=["'][^"']*)(")/i,
			'$1 no-admin-bar$2'
		);
	}

	// AGGRESSIVE CLEANUP: Remove everything between <body> and wp-site-blocks div.
	// This is a last-resort cleanup for any remaining admin bar HTML.
	// Only runs if admin bar classes are still present in HTML.
	if ( html.includes( 'wp-admin-bar-' ) ) {
		html = html.replace(
			/(<body[^>]*>).*?(<div[^>]*class=["'][^"']*wp-site-blocks)/gis,
			'$1$2'
		);
	}

	return html;
}

/**
 * Remove dynamic WordPress links from HTML.
 *
 * Removes links to features that don't exist in static exports:
 * - Comments RSS feed
 * - REST API discovery
 * - XML-RPC/RSD
 *
 * @param {string} html HTML content.
 * @return {string} HTML with dynamic links removed.
 */
function removeDynamicWpLinks( html ) {
	// Remove comments feed link.
	// <link rel="alternate" type="application/rss+xml" title="..." href=".../comments/feed/" />.
	html = html.replace(
		/<link[^>]*rel=["']alternate["'][^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*>/gi,
		''
	);

	// Alternative pattern (href before rel).
	html = html.replace(
		/<link[^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*rel=["']alternate["'][^>]*>/gi,
		''
	);

	// Remove REST API discovery link.
	// <link rel="https://api.w.org/" href=".../wp-json/" />.
	html = html.replace(
		/<link[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*>/gi,
		''
	);

	// Remove XML-RPC/RSD discovery link.
	// <link rel="EditURI" type="application/rsd+xml" title="RSD" href=".../xmlrpc.php" />.
	html = html.replace(
		/<link[^>]*rel=["']EditURI["'][^>]*type=["']application\/rsd\+xml["'][^>]*>/gi,
		''
	);

	// Alternative pattern (type before rel).
	html = html.replace(
		/<link[^>]*type=["']application\/rsd\+xml["'][^>]*rel=["']EditURI["'][^>]*>/gi,
		''
	);

	return html;
}

/**
 * Get static file path for a URL.
 *
 * @param {string} url URL to convert.
 * @return {string} File path (relative to static root).
 */
export function getStaticFilePath( url ) {
	// Extract pathname from URL.
	let path = '/';
	try {
		const urlObj = new URL( url );
		path = decodeURIComponent( urlObj.pathname || '/' );
	} catch {
		// Fallback: If URL parsing fails, extract path manually with regex.
		const pathMatch = url.match( /^https?:\/\/[^\/]+(\/.*)$/ );
		if ( pathMatch ) {
			path = pathMatch[ 1 ];
		}
	}

	// Handle homepage (root URL).
	if ( ! path || path === '/' ) {
		return 'index.html';
	}

	// Remove leading slash (normalize path).
	path = path.replace( /^\/+/, '' );

	// Remove WordPress Playground scope prefix.
	// Playground URLs contain scope like /scope:12345/path → path
	path = stripPlaygroundScope( path );

	// Remove trailing slash (normalize path).
	path = path.replace( /\/+$/, '' );

	// Check if path is empty after removing scope (homepage case).
	if ( ! path ) {
		return 'index.html';
	}

	// Convert URL path to directory structure with index.html.
	// Example: /about → about/index.html
	// This allows static files to be served via directory URLs: example.com/about/
	return path + '/index.html';
}
