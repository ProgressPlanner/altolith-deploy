/**
 * Publish API Service
 *
 * Service for publish-related API operations.
 * Extracted from usePublishAPI hook for testability.
 *
 * @package
 */

const CHANGED_ASSETS_KEY = 'aether_changed_assets';

/**
 * Publish API Service Class
 *
 * Handles publish-related API calls and asset tracking.
 */
export class PublishAPIService {
	/**
	 * Create service instance
	 *
	 * @param {Function} apiFetch WordPress apiFetch function (injectable for testing)
	 * @param {Object} assetDiscovery Asset discovery service
	 * @param {Object} storage Storage implementation (injectable for testing)
	 */
	constructor( apiFetch, assetDiscovery, storage ) {
		this.apiFetch = apiFetch;
		this.assetDiscovery = assetDiscovery;
		this.storage = storage;
	}

	/**
	 * Discover custom assets
	 *
	 * Uses browser-based asset discovery instead of PHP endpoint.
	 * This avoids HTTP requests that fail in WordPress Playground.
	 *
	 * @return {Promise<Object>} Discovery response with assets array
	 */
	async discoverAssets() {
		const customAssets = await this.assetDiscovery.discoverCustomAssets();
		return {
			success: true,
			assets: customAssets,
			count: customAssets.length,
		};
	}

	/**
	 * Mark asset as changed
	 *
	 * Stores changed assets in localStorage.
	 * No server call needed - browser-only tracking.
	 *
	 * @param {string} type Asset type (theme, plugin)
	 * @param {string} slug Asset slug
	 * @return {Object} Success response
	 */
	markAssetChanged( type, slug ) {
		// Get current changed assets
		const changedAssets = this.storage.get( CHANGED_ASSETS_KEY, [] );
		const key = `${ type }:${ slug }`;

		// Add if not already present
		if ( ! changedAssets.includes( key ) ) {
			changedAssets.push( key );
			this.storage.set( CHANGED_ASSETS_KEY, changedAssets );
		}

		return {
			success: true,
			message: `Marked ${ type } ${ slug } as changed`,
		};
	}
}
