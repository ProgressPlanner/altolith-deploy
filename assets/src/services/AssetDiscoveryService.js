/**
 * Asset Discovery Service
 *
 * Pure functions and service class for discovering and categorizing WordPress assets.
 * Extracted from useAssetDiscovery hook for better testability.
 *
 * @package
 */

/**
 * Normalize plugin slug to directory name only.
 * WordPress stores plugins as 'akismet/akismet.php' but WordPress.org expects just 'akismet'.
 *
 * @param {string} slug - Plugin slug (may include file path)
 * @return {string} Normalized slug (directory name only)
 */
export function normalizePluginSlug( slug ) {
	if ( slug.includes( '/' ) ) {
		return slug.split( '/' )[ 0 ];
	}
	return slug;
}

/**
 * Filter assets to only active ones.
 *
 * @param {Array<Object>} assets Array of asset objects with is_active property.
 * @return {Array<Object>} Only active assets.
 */
export function filterActiveAssets( assets ) {
	return assets.filter( ( asset ) => asset.is_active );
}

/**
 * Get active theme from themes array.
 *
 * @param {Array<Object>} themes Array of theme objects.
 * @return {Object|null} Active theme or null if none found.
 */
export function getActiveTheme( themes ) {
	return themes.find( ( theme ) => theme.is_active ) || null;
}

/**
 * Filter assets by WordPress.org status.
 *
 * @param {Array<Object>} assets    Array of assets with from_wporg property.
 * @param {boolean}       fromWpOrg True to get WordPress.org assets, false for custom.
 * @return {Array<Object>} Filtered assets.
 */
export function filterByWpOrgStatus( assets, fromWpOrg ) {
	return assets.filter( ( asset ) => asset.from_wporg === fromWpOrg );
}

/**
 * Filter out built-in Playground plugins.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @return {Array<Object>} Plugins excluding built-in ones.
 */
export function filterBuiltInPlugins( plugins ) {
	const builtInSlugs = [ 'aether', 'sqlite-database-integration' ];
	return plugins.filter(
		( plugin ) =>
			! builtInSlugs.includes( normalizePluginSlug( plugin.slug ) )
	);
}

/**
 * Transform asset to custom asset format.
 *
 * @param {Object} asset Asset object with assetType, slug, name, version.
 * @return {Object} Custom asset format.
 */
export function toCustomAssetFormat( asset ) {
	return {
		type: asset.assetType,
		slug: asset.slug,
		name: asset.name,
		version: asset.version,
	};
}

/**
 * Transform asset to blueprint slug format.
 *
 * @param {Object} asset Asset object with slug.
 * @return {string} Normalized slug.
 */
export function toBlueprintSlugFormat( asset ) {
	return normalizePluginSlug( asset.slug );
}

/**
 * Combine plugins and themes with asset type tag.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @param {Array<Object>} themes  Array of theme objects.
 * @return {Array<Object>} Combined array with assetType property.
 */
export function combineAssetsWithType( plugins, themes ) {
	return [
		...plugins.map( ( p ) => ( { ...p, assetType: 'plugin' } ) ),
		...themes.map( ( t ) => ( { ...t, assetType: 'theme' } ) ),
	];
}

/**
 * Get site name from globals.
 * Separated as pure function for testability.
 *
 * @return {string} Site name from window.wp.siteName or document.title or empty string.
 */
export function getSiteName() {
	if ( typeof window !== 'undefined' && window.wp && window.wp.siteName ) {
		return window.wp.siteName;
	}
	if ( typeof document !== 'undefined' && document.title ) {
		return document.title;
	}
	return '';
}

/**
 * Asset Discovery Service
 *
 * Service class for discovering and categorizing WordPress assets.
 * Uses dependency injection for testability.
 */
export class AssetDiscoveryService {
	/**
	 * @param {Function} apiFetch      WordPress apiFetch function.
	 * @param {Function} checkWpOrg    Function to check if asset is from WordPress.org.
	 * @param {Object}   wporgCache    WordPress.org cache instance.
	 * @param {Function} getSiteNameFn Function to get site name (optional, defaults to getSiteName).
	 */
	constructor( apiFetch, checkWpOrg, wporgCache, getSiteNameFn = null ) {
		this.apiFetch = apiFetch;
		this.checkWpOrg = checkWpOrg;
		this.wporgCache = wporgCache;
		this.getSiteName = getSiteNameFn || getSiteName;
	}

	/**
	 * Get all installed plugins and themes with metadata from REST API.
	 *
	 * @return {Promise<Object>} Object with plugins and themes arrays.
	 */
	async getInstalledAssets() {
		try {
			const response = await this.apiFetch( {
				path: '/aether/site-exporter/assets',
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
			return {
				plugins: [],
				themes: [],
			};
		}
	}

	/**
	 * Get plugin configuration from window.aetherData.
	 *
	 * Configuration was previously fetched from REST API endpoint /config,
	 * but that endpoint was removed in favor of reading from window.aetherData
	 * which is injected by PHP.
	 *
	 * @return {Promise<Object>} Configuration object.
	 */
	async getConfig() {
		// Read config from window.aetherData (injected by PHP).
		if (
			typeof window !== 'undefined' &&
			window.aetherData
		) {
			return {
				publicUrl: window.aetherData.publicUrl || '',
				adminUrl: window.aetherData.adminUrl || '',
				// Note: wporgCheckMethod and corsProxyUrl are not needed
				// because the JS code uses hardcoded defaults ('cors-proxy' with fallback to 'direct')
			};
		}

		// Fallback if window.aetherData is not available.
		return {
			publicUrl: '',
			adminUrl: '',
		};
	}

	/**
	 * Check all assets against WordPress.org in parallel.
	 *
	 * @param {Array<Object>} items  Array of items with slug and assetType.
	 * @param {Object}        config Configuration object for WordPress.org check.
	 * @return {Promise<Array<Object>>} Assets with from_wporg property added.
	 */
	async checkAssetsAgainstWpOrg( items, config ) {
		return Promise.all(
			items.map( async ( item ) => {
				const fromWpOrg = await this.checkWpOrg(
					item.slug,
					item.assetType,
					config
				);
				return {
					...item,
					from_wporg: fromWpOrg,
				};
			} )
		);
	}

	/**
	 * Discover all custom assets (not from WordPress.org).
	 *
	 * @return {Promise<Array<Object>>} Array of custom assets.
	 */
	async discoverCustomAssets() {
		const config = await this.getConfig();
		const { plugins, themes } = await this.getInstalledAssets();

		const activePlugins = filterActiveAssets( plugins );
		const activeTheme = getActiveTheme( themes );
		const activeThemes = activeTheme ? [ activeTheme ] : [];

		const items = combineAssetsWithType( activePlugins, activeThemes );
		const allAssets = await this.checkAssetsAgainstWpOrg( items, config );

		const customAssets = filterByWpOrgStatus( allAssets, false );
		return customAssets.map( toCustomAssetFormat );
	}

	/**
	 * Get WordPress.org assets for blueprint generation.
	 *
	 * Returns only active plugins/themes from WordPress.org.
	 * Custom assets will be included in wp-content.zip.
	 *
	 * @return {Promise<Object>} Object with plugins and themes arrays.
	 */
	async getBlueprintAssets() {
		const config = await this.getConfig();
		const { plugins, themes } = await this.getInstalledAssets();

		const activePlugins = filterActiveAssets( plugins );
		const activeTheme = getActiveTheme( themes );
		const activeThemes = activeTheme ? [ activeTheme ] : [];

		const items = combineAssetsWithType( activePlugins, activeThemes );
		const allAssets = await this.checkAssetsAgainstWpOrg( items, config );

		const wporgAssets = filterByWpOrgStatus( allAssets, true );

		const wporgPlugins = wporgAssets
			.filter( ( asset ) => asset.assetType === 'plugin' )
			.filter(
				( plugin ) => filterBuiltInPlugins( [ plugin ] ).length > 0
			)
			.map( toBlueprintSlugFormat );

		const wporgThemes = wporgAssets
			.filter( ( asset ) => asset.assetType === 'theme' )
			.map( toBlueprintSlugFormat );

		return {
			plugins: wporgPlugins,
			themes: wporgThemes,
			siteName: this.getSiteName(),
		};
	}
}
