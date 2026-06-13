/**
 * Playground Redirect Utilities
 *
 * Generates the `wp-admin/index.html` redirect file that bounces visitors of the
 * exported static site into a WordPress Playground instance with the exported
 * blueprint preloaded — effectively a "log in / edit this site" entry point.
 *
 * The blueprint JSON is base64-encoded and passed in the URL hash fragment
 * (e.g. `https://host/index.html#<base64(json)>`), NOT by reference via
 * `?blueprint-url=`. Passing the blueprint by URL reference proved unreliable,
 * so the whole document is inlined. The target Playground loader reads
 * `location.hash`, runs `atob()` on it and `JSON.parse`s the result, so the
 * encoding here must be plain `btoa( jsonString )`.
 */

import { applyFilters } from '@wordpress/hooks';

/**
 * Default Playground editor/loader URL.
 *
 * A custom Playground build that reads a base64-encoded blueprint from the URL
 * hash fragment and boots WordPress in the browser with it.
 *
 * @type {string}
 */
export const DEFAULT_PLAYGROUND_EDITOR_URL =
	'https://static-wp.s12y.org/index.html';

/**
 * Get the Playground editor URL.
 *
 * Overridable via the `altolith.playground.editorUrl` filter so installs can
 * point at a different Playground loader.
 *
 * @return {string} The Playground editor/loader URL.
 */
export function getPlaygroundEditorUrl() {
	return applyFilters(
		'altolith.playground.editorUrl',
		DEFAULT_PLAYGROUND_EDITOR_URL
	);
}

/**
 * Build the Playground redirect URL for a blueprint JSON string.
 *
 * @param {string} blueprintJsonString The already-resolved blueprint JSON string.
 * @param {string} [editorUrl]         Optional editor URL override (defaults to filtered value).
 * @return {string} Full redirect URL with the base64 blueprint in the hash fragment.
 */
export function buildPlaygroundRedirectUrl( blueprintJsonString, editorUrl ) {
	const base = editorUrl || getPlaygroundEditorUrl();
	// Match the loader contract: it does `JSON.parse( atob( hash ) )`.
	const encoded = btoa( blueprintJsonString );
	return `${ base }#${ encoded }`;
}

/**
 * Build the `wp-admin/index.html` redirect document.
 *
 * Uses both a `<meta http-equiv="refresh">` and a JS redirect for resilience.
 * The hash only ever contains base64 characters, so it is safe to interpolate
 * into the attribute/markup unescaped.
 *
 * @param {string} blueprintJsonString The already-resolved blueprint JSON string.
 * @param {string} [editorUrl]         Optional editor URL override.
 * @return {string} HTML document that redirects to the Playground instance.
 */
export function buildPlaygroundRedirectHtml( blueprintJsonString, editorUrl ) {
	const playgroundUrl = buildPlaygroundRedirectUrl(
		blueprintJsonString,
		editorUrl
	);
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta http-equiv="refresh" content="0; url=${ playgroundUrl }">
	<title>Redirecting to WordPress Playground...</title>
</head>
<body>
	<p>Redirecting to <a href="${ playgroundUrl }">WordPress Playground</a>...</p>
	<script>window.location.href = ${ JSON.stringify( playgroundUrl ) };</script>
</body>
</html>`;
}
