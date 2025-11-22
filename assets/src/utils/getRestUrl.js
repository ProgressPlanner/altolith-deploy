/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from window.aetherData or returns a default.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
 * @package
 */

/**
 * Get REST API URL from window.aetherData or default.
 *
 * @return {string} REST API base URL.
 */
export function getRestUrl() {
	if (
		typeof window !== 'undefined' &&
		window.aetherData &&
		window.aetherData.restUrl
	) {
		return window.aetherData.restUrl;
	}
	return '/wp-json/aether/site-exporter/';
}
