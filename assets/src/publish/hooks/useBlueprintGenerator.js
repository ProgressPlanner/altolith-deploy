/**
 * Blueprint Generator Hook
 *
 * Generates WordPress Playground blueprint JSON for site deployment.
 * Fetches WordPress.org plugin/theme slugs and constructs blueprint with bundled resources.
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
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
		 * @param {Function} setStatusMessage Optional status message callback.
		 * @return {Promise<Object>} Blueprint JSON object.
		 */
		async ( setStatusMessage = null ) => {
			// Fetch WordPress.org plugin/theme slugs and site name using browser-based discovery.
			if ( setStatusMessage ) {
				setStatusMessage(
					'Detecting WordPress.org plugins and themes…',
					'progress',
					'detectWporgAssets'
				);
			}
			const assetsResponse = await assetDiscovery.getBlueprintAssets();

			const { plugins: wporgPlugins, themes: wporgThemes } =
				assetsResponse;

			// Start configuring Playground settings
			if ( setStatusMessage ) {
				setStatusMessage(
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
			const blueprint = buildBlueprintJson( steps );

			if ( setStatusMessage ) {
				setStatusMessage(
					`Blueprint generated: ${ steps.length } total steps`,
					'success',
					'generateBlueprint'
				);
				// Update detection message to success
				setStatusMessage(
					'Detected WordPress.org plugins and themes',
					'success',
					'detectWporgAssets'
				);
				// Update configuration message to success
				setStatusMessage(
					'Configured WordPress Playground settings',
					'success',
					'configurePlayground'
				);
				// Update plugin/theme messages to success
				// Keep original message text, just update type to success
				if ( wporgPlugins.length > 0 ) {
					const pluginNames = wporgPlugins.join( ', ' );
					setStatusMessage(
						`Adding ${ wporgPlugins.length } WordPress.org plugin${
							wporgPlugins.length !== 1 ? 's' : ''
						} to blueprint`,
						'success',
						'addPluginsToBlueprint'
					);
					setStatusMessage(
						`Plugins: ${ pluginNames }`,
						'success',
						'pluginsList'
					);
				}
				if ( wporgThemes.length > 0 ) {
					const themeNames = wporgThemes.join( ', ' );
					setStatusMessage(
						`Adding ${ wporgThemes.length } WordPress.org theme${
							wporgThemes.length !== 1 ? 's' : ''
						} to blueprint`,
						'success',
						'addThemesToBlueprint'
					);
					setStatusMessage(
						`Themes: ${ themeNames }`,
						'success',
						'themesList'
					);
				}
			}

			return blueprint;
		},
		[ assetDiscovery ]
	);

	return { generateBlueprint };
}
