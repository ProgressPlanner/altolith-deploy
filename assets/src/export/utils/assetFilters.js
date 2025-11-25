/**
 * Asset Filters
 *
 * Pure functions for determining which assets to collect.
 *
 */

import { applyFilters } from '@wordpress/hooks';
import { isExternal } from './urlRewriter';
import {
	isExcludedUrl,
	isSkippedExtension,
	isEssentialExtension,
	isWebpackModuleId,
} from './assetExclusions';
import { getExtensionFromUrl } from './assetPatterns';

/**
 * Extract module ID from URL for webpack checking.
 *
 * @param {string} url URL to extract module ID from.
 * @return {string|null} Module ID or null.
 */
function extractModuleId( url ) {
	try {
		const urlObj = new URL( url );
		const pathname = urlObj.pathname;
		const filename = pathname.split( '/' ).pop() || pathname;
		return filename.replace( /\.[^.]*$/, '' );
	} catch {
		const filenameMatch = url.match( /\/([^\/]+)(?:\.[^.]*)?(?:\?|$)/ );
		return filenameMatch ? filenameMatch[ 1 ] : null;
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
export function shouldCollectAsset( url, siteUrl, source = 'css' ) {
	// FILTER 0: Skip webpack module IDs (not real files)
	const moduleId = extractModuleId( url );
	if ( moduleId && isWebpackModuleId( moduleId ) ) {
		return false;
	}

	// Get file extension
	const extension = getExtensionFromUrl( url );

	// PRIORITY 1: Always collect essential assets (CSS, JS, fonts) EVEN IF EXTERNAL
	if ( isEssentialExtension( extension ) ) {
		return true;
	}

	// FILTER 1 & 2: Skip excluded URL patterns
	if ( isExcludedUrl( url ) ) {
		return false;
	}

	// FILTER 3: Skip external URLs for non-essential assets
	if ( isExternal( url, siteUrl ) ) {
		return false;
	}

	// PRIORITY 2: Collect images when referenced in HTML (internal URLs only)
	if ( source === 'html' && isSkippedExtension( extension ) ) {
		return true;
	}

	// FILTER 4: Skip image files when found in CSS/JS
	if ( isSkippedExtension( extension ) ) {
		return false;
	}

	// FILTER 5: Skip HTML page URLs (no extension) when found in HTML
	// These are internal page links, not assets - they should NOT be collected
	// as assets because they would be uploaded without URL rewriting
	if ( source === 'html' && ! extension ) {
		try {
			const urlObj = new URL( url );
			const pathname = urlObj.pathname;
			// Skip if pathname ends with / or has no file extension
			if ( pathname.endsWith( '/' ) || ! pathname.includes( '.' ) ) {
				return false;
			}
		} catch {
			// If URL parsing fails and no extension, skip it
			return false;
		}
	}

	// PRIORITY 3: For other assets, apply filter hook
	let shouldCollect = true;

	/**
	 * Filter whether an asset should be collected.
	 *
	 * @param {boolean} shouldCollect Whether to collect this asset.
	 * @param {string}  url           Asset URL.
	 * @param {string}  siteUrl       Site URL.
	 * @param {string}  source        Asset source.
	 * @param {string}  extension     File extension.
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
