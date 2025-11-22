/**
 * Asset Discovery Hook
 *
 * Browser-based implementation for WordPress.org asset detection.
 * Detects WordPress.org plugins/themes by checking wordpress.org APIs.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
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
 * Uses browser-based method (default: CORS proxy) to check WordPress.org.
 * Can be switched to direct API calls via config.
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

	// Try CORS proxy method first, then fallback to direct API calls
	let result = await checkWithMethod(
		normalizedSlug,
		type,
		'cors-proxy',
		config
	);

	// If CORS proxy method returned null (unable to check), try direct API fallback
	if ( result === null ) {
		debugWarn(
			`CORS proxy WordPress.org check returned null for ${ type } "${ slug }", trying direct API fallback`
		);
		result = await checkWithMethod(
			normalizedSlug,
			type,
			'direct',
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
 * @param {string} method - 'cors-proxy' or 'direct'
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
			default:
				// Direct WordPress.org API calls (may fail in some browsers due to CORS)
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
		}

		// Use plain fetch for all methods (browser-based checking)
		const response = await fetch( checkUrl );

		if ( ! response.ok ) {
			throw new Error(
				`WordPress.org check returned ${ response.status }`
			);
		}

		const data = await response.json();

		// Handle different response formats
		let exists;
		if ( method === 'direct' ) {
			// Direct WordPress.org API: check for 'error' field
			exists = ! data.error && ( data.slug || data.name );
		} else {
			// CORS proxy: standardized response with 'success' and 'exists' fields
			if ( ! data.success ) {
				throw new Error(
					data.error || __( 'Unknown error', 'aether-site-exporter' )
				);
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
