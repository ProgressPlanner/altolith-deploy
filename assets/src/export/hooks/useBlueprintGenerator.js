/**
 * Blueprint Generator Hook
 *
 * Generates WordPress Playground blueprint JSON for site deployment.
 * Fetches WordPress.org plugin/theme slugs and constructs blueprint with bundled resources.
 *
 */

import { useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import useAssetDiscovery from '@altolith/utils/useAssetDiscovery';
import {
	buildBlueprintSteps,
	buildBlueprintJson,
} from '@altolith/export/utils/blueprintStepBuilders';

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
		 * @param {Object}   [options]           Optional options object.
		 * @param {string}   [options.baseUrl]   Base URL for URL-based resources (e.g., 'https://example.com').
		 * @param {string}   [options.subfolder] Subfolder path for blueprint files (e.g., 'playground').
		 * @param {Function} [setStatusMessage]  Optional status message callback.
		 * @return {Promise<Object>} Blueprint JSON object with customPlugins and customThemes arrays.
		 */
		async ( options = null, setStatusMessage = null ) => {
			// Handle case where first argument is setStatusMessage (backwards compatibility).
			let actualSetStatusMessage;
			let actualOptions = {};
			if ( typeof options === 'function' ) {
				actualSetStatusMessage = options;
			} else {
				actualSetStatusMessage = setStatusMessage;
				actualOptions = options || {};
			}

			// Extract URL options for resource generation
			const { baseUrl, subfolder } = actualOptions;
			// Fetch WordPress.org and custom plugin/theme slugs using browser-based discovery.
			if ( actualSetStatusMessage ) {
				actualSetStatusMessage(
					'Detecting plugins and themes…',
					'progress',
					'detectAssets'
				);
			}
			const assetsResponse = await assetDiscovery.getBlueprintAssets();

			let {
				plugins: wporgPlugins,
				themes: wporgThemes,
				customPlugins,
				customThemes,
			} = assetsResponse;

			/**
			 * Filter discovered assets.
			 *
			 * Allows modification of detected plugins and themes before blueprint generation.
			 *
			 * @param {Object}        assets               Discovered assets object.
			 * @param {Array<string>} assets.plugins       WordPress.org plugin slugs.
			 * @param {Array<string>} assets.themes        WordPress.org theme slugs.
			 * @param {Array<string>} assets.customPlugins Custom plugin slugs.
			 * @param {Array<string>} assets.customThemes  Custom theme slugs.
			 * @param {Object}        assetsResponse       Full asset discovery response.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('altolith.export.step.createBlueprintBundle.assets', 'my-plugin', (assets) => {
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
				'altolith.export.step.createBlueprintBundle.assets',
				{
					plugins: wporgPlugins,
					themes: wporgThemes,
					customPlugins,
					customThemes,
				},
				assetsResponse
			);

			wporgPlugins = filteredAssets.plugins || [];
			wporgThemes = filteredAssets.themes || [];
			customPlugins = filteredAssets.customPlugins || [];
			customThemes = filteredAssets.customThemes || [];

			// Start configuring Playground settings
			if ( actualSetStatusMessage ) {
				actualSetStatusMessage(
					'Configuring WordPress Playground settings…',
					'progress',
					'configurePlayground'
				);
			}

			// Build blueprint steps array.
			// If baseUrl is provided, uses URL-based resources; otherwise uses bundled resources.
			const steps = buildBlueprintSteps( {
				wporgPlugins,
				wporgThemes,
				customPlugins,
				customThemes,
				baseUrl,
				subfolder,
			} );

			// Construct blueprint JSON.
			let blueprint = buildBlueprintJson( steps );

			if ( actualSetStatusMessage ) {
				actualSetStatusMessage(
					`Blueprint generated: ${ steps.length } total steps`,
					'success',
					'createBlueprintBundle'
				);
				// Update detection message to success
				actualSetStatusMessage(
					'Detected plugins and themes',
					'success',
					'detectAssets'
				);
				// Update configuration message to success
				actualSetStatusMessage(
					'Configured WordPress Playground settings',
					'success',
					'configurePlayground'
				);
				// WordPress.org plugins
				if ( wporgPlugins.length > 0 ) {
					actualSetStatusMessage(
						`Adding ${ wporgPlugins.length } WordPress.org plugin${
							wporgPlugins.length !== 1 ? 's' : ''
						}: ${ wporgPlugins.join( ', ' ) }`,
						'success',
						'addWporgPluginsToBlueprint'
					);
				}
				// Custom plugins
				if ( customPlugins.length > 0 ) {
					actualSetStatusMessage(
						`Adding ${ customPlugins.length } custom plugin${
							customPlugins.length !== 1 ? 's' : ''
						}: ${ customPlugins.join( ', ' ) }`,
						'success',
						'addCustomPluginsToBlueprint'
					);
				}
				// WordPress.org themes
				if ( wporgThemes.length > 0 ) {
					actualSetStatusMessage(
						`Adding ${ wporgThemes.length } WordPress.org theme${
							wporgThemes.length !== 1 ? 's' : ''
						}: ${ wporgThemes.join( ', ' ) }`,
						'success',
						'addWporgThemesToBlueprint'
					);
				}
				// Custom themes
				if ( customThemes.length > 0 ) {
					actualSetStatusMessage(
						`Adding ${ customThemes.length } custom theme${
							customThemes.length !== 1 ? 's' : ''
						}: ${ customThemes.join( ', ' ) }`,
						'success',
						'addCustomThemesToBlueprint'
					);
				}
			}

			/**
			 * Filter final generated blueprint.
			 *
			 * Allows final modification of blueprint before it's used for deployment.
			 *
			 * @param {Object}        blueprint     Complete blueprint JSON object.
			 * @param {Array<string>} wporgPlugins  WordPress.org plugin slugs.
			 * @param {Array<string>} wporgThemes   WordPress.org theme slugs.
			 * @param {Array<string>} customPlugins Custom plugin slugs.
			 * @param {Array<string>} customThemes  Custom theme slugs.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('altolith.export.step.createBlueprintBundle.generated', 'my-plugin', (blueprint) => {
			 *     // Add custom metadata
			 *     blueprint.description = 'My custom WordPress site';
			 *
			 *     return blueprint;
			 * });
			 */
			blueprint = applyFilters(
				'altolith.export.step.createBlueprintBundle.generated',
				blueprint,
				wporgPlugins,
				wporgThemes,
				customPlugins,
				customThemes
			);

			// Return blueprint with asset lists for bundle generation.
			return {
				blueprint,
				customPlugins,
				customThemes,
			};
		},
		[ assetDiscovery ]
	);

	return { generateBlueprint };
}
