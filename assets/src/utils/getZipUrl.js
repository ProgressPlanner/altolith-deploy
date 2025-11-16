/**
 * Get ZIP File URL Utility
 *
 * Returns the URL to the wp-content.zip file.
 * The file is always located at wp-content/wp-content.zip relative to the site root.
 *
 * @package
 */

/**
 * Get the URL to wp-content.zip file.
 *
 * @return {string} URL to wp-content.zip file.
 */
export function getZipUrl() {
	const siteUrl = window.location.origin + '/';
	return `${ siteUrl }wp-content/wp-content.zip`;
}
