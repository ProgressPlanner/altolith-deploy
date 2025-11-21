/**
 * Asset Discovery Hook
 *
 * Replaces PHP-based AssetDiscoveryService with browser-based implementation.
 * Detects WordPress.org plugins/themes by checking wordpress.org URLs.
 *
 * @package
 */

import { useState, useCallback, useMemo } from '@wordpress/element';
import apiFetch from './api';
import { getWpOrgCache } from './wporgCache';
import { debugWarn } from './debug';
import {
	AssetDiscoveryService,
	normalizePluginSlug,
} from '../services/AssetDiscoveryService';

// Re-export normalizePluginSlug
export { normalizePluginSlug };

/**
 * Check if a plugin or theme exists on WordPress.org
 *
 * Uses filterable method (default: PHP server-side) to check WordPress.org.
 * Can be switched to CORS proxy or direct API calls via WordPress filters.
 *
 * @param {string} slug   - Plugin or theme slug (will be normalized for plugins)
 * @param {string} type   - 'plugin' or 'theme'
 * @param {Object} config - Configuration object with wporgCheckMethod and corsProxyUrl
 * @return {Promise<boolean>} True if asset exists on WordPress.org
 */
export async function isFromWordPressOrg( slug, type, config = {} ) {
	// Normalize plugin slugs (remove file path if present)
	// Example: 'akismet/akismet.php' -> 'akismet'
	const normalizedSlug =
		type === 'plugin' ? normalizePluginSlug( slug ) : slug;

	// Check persistent cache first (IndexedDB + memory)
	const cache = getWpOrgCache();
	const cached = await cache.get( normalizedSlug, type );
	if ( cached !== null ) {
		return cached;
	}

	// Try PHP method first, then fallback to CORS proxy
	let result = await checkWithMethod( normalizedSlug, type, 'php', config );

	// If PHP method returned null (unable to check), try CORS proxy fallback
	if ( result === null ) {
		debugWarn(
			`PHP WordPress.org check returned null for ${ type } "${ slug }", trying CORS proxy fallback`
		);
		result = await checkWithMethod(
			normalizedSlug,
			type,
			'cors-proxy',
			config
		);
	}

	// If still null after fallback, treat as false
	if ( result === null ) {
		debugWarn(
			`All WordPress.org check methods failed for ${ type } "${ slug }", treating as custom asset`
		);
		result = false;
	}

	// Cache the result (only if we got a definitive answer)
	if ( result !== null ) {
		await cache.set( normalizedSlug, type, result );
	}

	return result;
}

/**
 * Check WordPress.org using specific method
 *
 * @param {string} slug   - Normalized plugin/theme slug
 * @param {string} type   - 'plugin' or 'theme'
 * @param {string} method - 'php', 'cors-proxy', or 'direct'
 * @param {Object} config - Configuration object
 * @return {Promise<boolean|null>} True if exists, false if doesn't exist, null if unable to check
 */
async function checkWithMethod( slug, type, method, config = {} ) {
	try {
		let checkUrl;

		switch ( method ) {
			case 'cors-proxy':
				// Use external CORS proxy (e.g., cfp.s12y.org or custom worker)
				checkUrl =
					config.corsProxyUrl || 'https://cfp.s12y.org/check-wporg';
				checkUrl += `?slug=${ encodeURIComponent(
					slug
				) }&type=${ encodeURIComponent( type ) }`;
				break;

			case 'direct':
				// Direct WordPress.org API calls (will fail in browsers due to CORS)
				if ( type === 'theme' ) {
					checkUrl = `https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=${ encodeURIComponent(
						slug
					) }`;
				} else {
					checkUrl = `https://api.wordpress.org/plugins/info/1.0/${ encodeURIComponent(
						slug
					) }.json`;
				}
				break;

			case 'php':
			default:
				// PHP server-side method (default, no CORS issues)
				// apiFetch expects path without /wp-json prefix
				checkUrl = `/aether/site-exporter/check-wporg?slug=${ encodeURIComponent(
					slug
				) }&type=${ encodeURIComponent( type ) }`;
				break;
		}

		// For PHP method, use apiFetch (includes WordPress auth)
		// For other methods, use plain fetch
		let data;
		if ( method === 'php' ) {
			// Use apiFetch for internal WordPress REST API calls
			// This includes nonce and authentication automatically
			data = await apiFetch( { path: checkUrl } );
		} else {
			// Use plain fetch for external URLs (cors-proxy, direct)
			const response = await fetch( checkUrl );

			if ( ! response.ok ) {
				throw new Error(
					`WordPress.org check returned ${ response.status }`
				);
			}

			data = await response.json();
		}

		// Handle different response formats
		let exists;
		if ( method === 'direct' ) {
			// Direct WordPress.org API: check for 'error' field
			exists = ! data.error && ( data.slug || data.name );
		} else {
			// PHP or CORS proxy: standardized response with 'success' and 'exists' fields
			if ( ! data.success ) {
				throw new Error( data.error || 'Unknown error' );
			}
			exists = data.exists;
		}

		// Return the result (could be true, false, or null)
		// null means "unable to check" and should trigger fallback
		return exists;
	} catch ( error ) {
		// Network/API error - return null to indicate unable to check
		debugWarn(
			`Failed to check WordPress.org for ${ type } "${ slug }" using ${ method } method:`,
			error
		);
		return null;
	}
}

/**
 * Asset Discovery Hook
 *
 * Provides methods to discover and categorize installed plugins/themes.
 * Uses AssetDiscoveryService for business logic.
 *
 * @return {Object} Hook methods and state
 */
export default function useAssetDiscovery() {
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	// Create service instance with dependencies
	const service = useMemo(
		() =>
			new AssetDiscoveryService(
				apiFetch,
				isFromWordPressOrg,
				getWpOrgCache()
			),
		[]
	);

	/**
	 * Discover all custom assets (not from WordPress.org)
	 *
	 * @return {Promise<Array<Object>>} Array of custom assets
	 */
	const discoverCustomAssets = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			const customAssets = await service.discoverCustomAssets();
			setLoading( false );
			return customAssets;
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [ service ] );

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
			const blueprintAssets = await service.getBlueprintAssets();
			setLoading( false );
			return blueprintAssets;
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [ service ] );

	return {
		discoverCustomAssets,
		getBlueprintAssets,
		loading,
		error,
	};
}
