/**
 * Asset Discovery Hook
 *
 * Browser-based implementation for WordPress.org asset detection.
 * Checks are delegated to the server-side PHP endpoint which handles
 * caching via WordPress transients.
 */

import { useState, useCallback, useMemo } from '@wordpress/element';
import apiFetch from './api';
import {
	AssetDiscoveryService,
	normalizePluginSlug,
} from '../services/AssetDiscoveryService';

// Re-export normalizePluginSlug
export { normalizePluginSlug };

/**
 * Check if a plugin or theme exists on WordPress.org
 *
 * Delegates to server-side PHP endpoint which handles caching via WordPress transients.
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

	try {
		const response = await apiFetch( {
			path: '/aether/site-exporter/wporg/check-batch',
			method: 'POST',
			data: {
				items: [ { slug: normalizedSlug, type } ],
			},
		} );

		if ( response.success && response.results ) {
			const key = `${ type }:${ normalizedSlug }`;
			return response.results[ key ] === true;
		}

		return false;
	} catch ( error ) {
		// On error, assume it doesn't exist
		return false;
	}
}

/**
 * Check multiple plugins/themes for existence on WordPress.org in a single batch request.
 *
 * @param {Array<{slug: string, type: string}>} items - Array of items to check
 * @return {Promise<Object>} Object mapping "type:slug" to boolean
 */
export async function checkBatchWordPressOrg( items ) {
	if ( ! items || items.length === 0 ) {
		return {};
	}

	// Normalize plugin slugs
	const normalizedItems = items.map( ( item ) => ( {
		slug:
			item.type === 'plugin'
				? normalizePluginSlug( item.slug )
				: item.slug,
		type: item.type,
	} ) );

	try {
		const response = await apiFetch( {
			path: '/aether/site-exporter/wporg/check-batch',
			method: 'POST',
			data: {
				items: normalizedItems,
			},
		} );

		if ( response.success && response.results ) {
			return response.results;
		}

		return {};
	} catch ( error ) {
		// On error, return empty results
		return {};
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
		() => new AssetDiscoveryService( apiFetch, isFromWordPressOrg ),
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
