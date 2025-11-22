/**
 * Asset Tracker
 *
 * Tracks uploaded assets to prevent duplicate uploads.
 *
 */

/**
 * Create an asset tracker instance.
 *
 * @return {Object} Asset tracker instance.
 */
export function createAssetTracker() {
	// Track uploaded assets by normalized URL.
	const uploadedAssets = new Set();
	// Track failed assets by normalized URL.
	const failedAssets = new Set();

	/**
	 * Check if an asset has already been uploaded.
	 *
	 * @param {string} url Asset URL.
	 * @return {boolean} True if already uploaded.
	 */
	function isUploaded( url ) {
		// Normalize URL for comparison (remove fragments, trailing slashes).
		const normalized = normalizeUrl( url );
		return uploadedAssets.has( normalized );
	}

	/**
	 * Mark an asset as uploaded.
	 *
	 * @param {string} url Asset URL.
	 */
	function markUploaded( url ) {
		const normalized = normalizeUrl( url );
		uploadedAssets.add( normalized );
	}

	/**
	 * Mark an asset as failed.
	 *
	 * @param {string} url Asset URL.
	 */
	function markFailed( url ) {
		const normalized = normalizeUrl( url );
		failedAssets.add( normalized );
	}

	/**
	 * Check if an asset has failed.
	 *
	 * @param {string} url Asset URL.
	 * @return {boolean} True if failed.
	 */
	function isFailed( url ) {
		const normalized = normalizeUrl( url );
		return failedAssets.has( normalized );
	}

	/**
	 * Get count of uploaded assets.
	 *
	 * @return {number} Number of uploaded assets.
	 */
	function getCount() {
		return uploadedAssets.size;
	}

	/**
	 * Get count of failed assets.
	 *
	 * @return {number} Number of failed assets.
	 */
	function getFailedCount() {
		return failedAssets.size;
	}

	/**
	 * Clear all tracked assets.
	 */
	function clear() {
		uploadedAssets.clear();
		failedAssets.clear();
	}

	/**
	 * Normalize a URL for comparison.
	 *
	 * @param {string} url URL to normalize.
	 * @return {string} Normalized URL.
	 */
	function normalizeUrl( url ) {
		try {
			const urlObj = new URL( url );
			// Remove fragments.
			urlObj.hash = '';
			// Remove trailing slash from path.
			if ( urlObj.pathname.endsWith( '/' ) && urlObj.pathname !== '/' ) {
				urlObj.pathname = urlObj.pathname.slice( 0, -1 );
			}
			return urlObj.toString();
		} catch {
			// If URL parsing fails, return as-is (will still work for exact matches).
			return url;
		}
	}

	return {
		isUploaded,
		markUploaded,
		markFailed,
		isFailed,
		getCount,
		getFailedCount,
		clear,
	};
}
