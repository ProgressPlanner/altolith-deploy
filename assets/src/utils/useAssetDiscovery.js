/**
 * Asset Discovery Hook
 *
 * Replaces PHP-based AssetDiscoveryService with browser-based implementation.
 * Detects WordPress.org plugins/themes by checking wordpress.org URLs.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import { debugWarn } from './debug';
import apiFetch from './api';

/**
 * Cache for WordPress.org existence checks to avoid duplicate requests
 * @type {Map<string, boolean>}
 */
const wporgCache = new Map();

/**
 * Normalize plugin slug to directory name only.
 * WordPress stores plugins as 'akismet/akismet.php' but WordPress.org expects just 'akismet'.
 *
 * @param {string} slug - Plugin slug (may include file path)
 * @return {string} Normalized slug (directory name only)
 */
export function normalizePluginSlug( slug ) {
	// If slug contains a slash, extract just the directory name (first part)
	// Example: 'akismet/akismet.php' -> 'akismet'
	if ( slug.includes( '/' ) ) {
		return slug.split( '/' )[ 0 ];
	}
	return slug;
}

/**
 * Check if a plugin or theme exists on WordPress.org
 *
 * Uses CORS proxy (cfp.s12y.org) to bypass browser CORS restrictions.
 *
 * @param {string} slug - Plugin or theme slug (will be normalized for plugins)
 * @param {string} type - 'plugin' or 'theme'
 * @return {Promise<boolean>} True if asset exists on WordPress.org
 */
export async function isFromWordPressOrg( slug, type ) {
	// Normalize plugin slugs (remove file path if present)
	// Example: 'akismet/akismet.php' -> 'akismet'
	const normalizedSlug =
		type === 'plugin' ? normalizePluginSlug( slug ) : slug;

	// Check cache first
	const cacheKey = `${ type }:${ normalizedSlug }`;
	if ( wporgCache.has( cacheKey ) ) {
		return wporgCache.get( cacheKey );
	}

	try {
		// Use Cloudflare Worker with D1 caching
		// Worker checks D1 first (sub-millisecond), falls back to WordPress.org if needed
		const workerUrl = `https://cfp.s12y.org/check-wporg?slug=${ encodeURIComponent(
			normalizedSlug
		) }&type=${ encodeURIComponent( type ) }`;

		const response = await fetch( workerUrl );

		if ( ! response.ok ) {
			throw new Error( `Worker returned ${ response.status }` );
		}

		const data = await response.json();

		if ( ! data.success ) {
			throw new Error( data.error || 'Unknown error' );
		}

		const exists = data.exists;

		// Cache the result
		wporgCache.set( cacheKey, exists );

		return exists;
	} catch ( error ) {
		// Network error - assume not from WordPress.org
		debugWarn(
			`Failed to check WordPress.org for ${ type } "${ slug }":`,
			error
		);

		// Cache the failure as false to avoid retrying
		wporgCache.set( cacheKey, false );

		return false;
	}
}

/**
 * Get all installed plugins and themes with metadata from REST API
 *
 * @return {Promise<Object>} Object with plugins and themes arrays
 */
async function getInstalledAssets() {
	try {
		const response = await apiFetch( {
			path: '/aether/v1/assets',
			method: 'GET',
		} );

		if ( ! response.success ) {
			throw new Error( response.error || 'Failed to fetch assets' );
		}

		return {
			plugins: response.plugins || [],
			themes: response.themes || [],
		};
	} catch ( error ) {
		debugWarn( 'Failed to fetch installed assets:', error );
		return {
			plugins: [],
			themes: [],
		};
	}
}

/**
 * Asset Discovery Hook
 *
 * Provides methods to discover and categorize installed plugins/themes.
 *
 * @return {Object} Hook methods and state
 */
export default function useAssetDiscovery() {
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	/**
	 * Discover all custom assets (not from WordPress.org)
	 *
	 * @return {Promise<Array<Object>>} Array of custom assets
	 */
	const discoverCustomAssets = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			const { plugins, themes } = await getInstalledAssets();

			// Check each asset against WordPress.org via D1-cached Worker
			// No rate limiting needed - Worker caches results in D1 (sub-millisecond lookups)
			const items = [
				...plugins.map( ( p ) => ( { ...p, assetType: 'plugin' } ) ),
				...themes.map( ( t ) => ( { ...t, assetType: 'theme' } ) ),
			];

			// Check all assets in parallel - fast with D1 caching
			const allAssets = await Promise.all(
				items.map( async ( item ) => {
					const fromWpOrg = await isFromWordPressOrg(
						item.slug,
						item.assetType
					);
					return {
						...item,
						from_wporg: fromWpOrg,
					};
				} )
			);

			// Filter to only custom assets (not from WordPress.org)
			const customAssets = allAssets
				.filter( ( asset ) => ! asset.from_wporg )
				.map( ( asset ) => ( {
					type: asset.assetType,
					slug: asset.slug,
					name: asset.name,
					version: asset.version,
				} ) );

			setLoading( false );
			return customAssets;
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [] );

	/**
	 * Get WordPress.org assets for blueprint generation
	 *
	 * Returns only active plugins/themes from WordPress.org.
	 * Custom assets will be included in wp-content.zip.
	 *
	 * @return {Promise<Object>} Object with plugins and themes arrays
	 */
	const getBlueprintAssets = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			const { plugins, themes } = await getInstalledAssets();

			// Only check active plugins
			const activePlugins = plugins.filter(
				( plugin ) => plugin.is_active
			);

			// Get active theme and parent themes
			const activeTheme = themes.find( ( theme ) => theme.is_active );
			const activeThemes = activeTheme ? [ activeTheme ] : [];

			// Check each asset against WordPress.org via D1-cached Worker
			// No rate limiting needed - Worker caches results in D1 (sub-millisecond lookups)
			const items = [
				...activePlugins.map( ( p ) => ( {
					...p,
					assetType: 'plugin',
				} ) ),
				...activeThemes.map( ( t ) => ( {
					...t,
					assetType: 'theme',
				} ) ),
			];

			// Check all assets in parallel - fast with D1 caching
			const allAssets = await Promise.all(
				items.map( async ( item ) => {
					const fromWpOrg = await isFromWordPressOrg(
						item.slug,
						item.assetType
					);
					return {
						...item,
						from_wporg: fromWpOrg,
					};
				} )
			);

			// Filter to only WordPress.org assets
			const wporgPlugins = allAssets
				.filter(
					( asset ) =>
						asset.assetType === 'plugin' && asset.from_wporg
				)
				.filter(
					( plugin ) =>
						// Skip plugins that are built into Playground or already included
						! [ 'aether', 'sqlite-database-integration' ].includes(
							normalizePluginSlug( plugin.slug )
						)
				)
				.map( ( plugin ) => normalizePluginSlug( plugin.slug ) );

			const wporgThemes = allAssets
				.filter(
					( asset ) => asset.assetType === 'theme' && asset.from_wporg
				)
				.map( ( theme ) => normalizePluginSlug( theme.slug ) );

			setLoading( false );
			return {
				plugins: wporgPlugins,
				themes: wporgThemes,
				siteName: window.wp?.siteName || document.title,
			};
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [] );

	/**
	 * Check if a specific asset is from WordPress.org
	 *
	 * @param {string} slug - Asset slug
	 * @param {string} type - 'plugin' or 'theme'
	 * @return {Promise<Object>} Result with from_wporg boolean
	 */
	const checkAsset = useCallback( async ( slug, type ) => {
		setLoading( true );
		setError( null );

		try {
			const fromWpOrg = await isFromWordPressOrg( slug, type );

			setLoading( false );
			return {
				slug,
				type,
				from_wporg: fromWpOrg,
			};
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [] );

	return {
		discoverCustomAssets,
		getBlueprintAssets,
		checkAsset,
		loading,
		error,
	};
}
