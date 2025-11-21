/**
 * Blueprint Generator Hook
 *
 * Generates WordPress Playground blueprint JSON for site deployment.
 * Fetches WordPress.org plugin/theme slugs and constructs blueprint with bundled resources.
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import useAssetDiscovery from '../../utils/useAssetDiscovery';
import {
	buildBlueprintSteps,
	buildBlueprintJson,
} from '../utils/blueprintStepBuilders';

/**
 * Hook for generating WordPress Playground blueprint JSON.
 *
 * @return {Object} Object with generateBlueprint function.
 */
export function useBlueprintGenerator() {
	const assetDiscovery = useAssetDiscovery();

	const generateBlueprint = useCallback(
		/**
		 * Generate blueprint JSON.
		 *
		 * @param {Object|Function} optionsOrSetStatusMessage Options object with assets/wpContentZipUrl, or setStatusMessage callback (for backward compatibility).
		 * @param {Array}          [optionsOrSetStatusMessage.assets] Discovered assets.
		 * @param {string}          [optionsOrSetStatusMessage.wpContentZipUrl] URL to wp-content.zip.
		 * @param {Function}        [setStatusMessage] Optional status message callback (if first param is options object).
		 * @return {Promise<Object>} Blueprint JSON object.
		 */
		async ( optionsOrSetStatusMessage = null, setStatusMessage = null ) => {
			// Handle both old signature (setStatusMessage) and new signature (options object, setStatusMessage)
			let actualSetStatusMessage = null;
			let assets = [];
			let wpContentZipUrl = null;

			if ( typeof optionsOrSetStatusMessage === 'function' ) {
				// Old signature: generateBlueprint(setStatusMessage)
				actualSetStatusMessage = optionsOrSetStatusMessage;
			} else if ( optionsOrSetStatusMessage && typeof optionsOrSetStatusMessage === 'object' ) {
				// New signature: generateBlueprint({ assets, wpContentZipUrl }, setStatusMessage)
				assets = optionsOrSetStatusMessage.assets || [];
				wpContentZipUrl = optionsOrSetStatusMessage.wpContentZipUrl || null;
				actualSetStatusMessage = setStatusMessage;
			}
			// Fetch WordPress.org plugin/theme slugs and site name using browser-based discovery.
			if ( actualSetStatusMessage ) {
				actualSetStatusMessage(
					'Detecting WordPress.org plugins and themes…',
					'progress',
					'detectWporgAssets'
				);
			}
			const assetsResponse = await assetDiscovery.getBlueprintAssets();

			let { plugins: wporgPlugins, themes: wporgThemes } = assetsResponse;

			/**
			 * Filter discovered WordPress.org assets.
			 *
			 * Allows modification of detected plugins and themes before blueprint generation.
			 *
			 * @param {Object}        assets         Discovered assets object.
			 * @param {Array<string>} assets.plugins WordPress.org plugin slugs.
			 * @param {Array<string>} assets.themes  WordPress.org theme slugs.
			 * @param {Object}        assetsResponse Full asset discovery response.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('aether.blueprint.assets', 'my-plugin', (assets) => {
			 *     // Exclude specific plugins
			 *     assets.plugins = assets.plugins.filter(slug => slug !== 'unwanted-plugin');
			 *
			 *     // Add additional plugins
			 *     assets.plugins.push('my-required-plugin');
			 *
			 *     return assets;
			 * });
			 */
			const filteredAssets = applyFilters(
				'aether.blueprint.assets',
				{ plugins: wporgPlugins, themes: wporgThemes },
				assetsResponse
			);

			wporgPlugins = filteredAssets.plugins || [];
			wporgThemes = filteredAssets.themes || [];

			// Start configuring Playground settings
			if ( actualSetStatusMessage ) {
				actualSetStatusMessage(
					'Configuring WordPress Playground settings…',
					'progress',
					'configurePlayground'
				);
			}

			// Build blueprint steps array with bundled wp-content resources.
			const steps = buildBlueprintSteps( {
				wporgPlugins,
				wporgThemes,
			} );

			// Construct blueprint JSON.
			let blueprint = buildBlueprintJson( steps );

			if ( actualSetStatusMessage ) {
				actualSetStatusMessage(
					`Blueprint generated: ${ steps.length } total steps`,
					'success',
					'generateBlueprint'
				);
				// Update detection message to success
				actualSetStatusMessage(
					'Detected WordPress.org plugins and themes',
					'success',
					'detectWporgAssets'
				);
				// Update configuration message to success
				actualSetStatusMessage(
					'Configured WordPress Playground settings',
					'success',
					'configurePlayground'
				);
				// Update plugin/theme messages to success
				// Keep original message text, just update type to success
				if ( wporgPlugins.length > 0 ) {
					const pluginNames = wporgPlugins.join( ', ' );
					actualSetStatusMessage(
						`Adding ${ wporgPlugins.length } WordPress.org plugin${
							wporgPlugins.length !== 1 ? 's' : ''
						} to blueprint`,
						'success',
						'addPluginsToBlueprint'
					);
					actualSetStatusMessage(
						`Plugins: ${ pluginNames }`,
						'success',
						'pluginsList'
					);
				}
				if ( wporgThemes.length > 0 ) {
					const themeNames = wporgThemes.join( ', ' );
					actualSetStatusMessage(
						`Adding ${ wporgThemes.length } WordPress.org theme${
							wporgThemes.length !== 1 ? 's' : ''
						} to blueprint`,
						'success',
						'addThemesToBlueprint'
					);
					actualSetStatusMessage(
						`Themes: ${ themeNames }`,
						'success',
						'themesList'
					);
				}
			}

			/**
			 * Filter final generated blueprint.
			 *
			 * Allows final modification of blueprint before it's used for deployment.
			 *
			 * @param {Object}        blueprint    Complete blueprint JSON object.
			 * @param {Array<string>} wporgPlugins WordPress.org plugin slugs.
			 * @param {Array<string>} wporgThemes  WordPress.org theme slugs.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('aether.blueprint.generated', 'my-plugin', (blueprint) => {
			 *     // Add custom metadata
			 *     blueprint.description = 'My custom WordPress site';
			 *
			 *     return blueprint;
			 * });
			 */
			blueprint = applyFilters(
				'aether.blueprint.generated',
				blueprint,
				wporgPlugins,
				wporgThemes
			);

			return blueprint;
		},
		[ assetDiscovery ]
	);

	return { generateBlueprint };
}
