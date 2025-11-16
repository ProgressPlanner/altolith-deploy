/**
 * Blueprint Generator Hook
 *
 * Generates WordPress Playground blueprint JSON for site deployment.
 * Fetches WordPress.org plugin/theme slugs and constructs blueprint with correct URLs.
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import { getCredentials } from '../../utils/credentialManager';
import useAssetDiscovery from '../../utils/useAssetDiscovery';
import {
	buildBlueprintSteps,
	buildBlueprintJson,
	constructWpContentUrl,
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
		 * @param {string}   siteKey           Site key for storage path.
		 * @param {string}   storageProviderId Storage provider ID.
		 * @param {Function} setStatusMessage  Optional status message callback.
		 * @return {Promise<Object>} Blueprint JSON object.
		 */
		async ( siteKey, storageProviderId, setStatusMessage = null ) => {
			if ( ! siteKey ) {
				throw new Error(
					'Site key is required for blueprint generation'
				);
			}

			if ( ! storageProviderId ) {
				throw new Error(
					'Storage provider ID is required for blueprint generation'
				);
			}

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

			// Get storage provider credentials.
			const credentials = await getCredentials( storageProviderId );
			const customDomain = credentials.custom_domain || '';
			let publicUrl = credentials.public_url || '';
			const workerEndpoint = credentials.worker_endpoint || '';
			const bucketName = credentials.bucket_name || '';

			// For Cloudflare R2, if public_url is not set but custom_domain is set,
			// construct the R2 public URL by adding the 'r2.' subdomain prefix.
			// This allows direct access to R2 bucket files without going through the worker.
			if (
				! publicUrl &&
				customDomain &&
				storageProviderId === 'cloudflare-r2'
			) {
				try {
					const customDomainUrl = new URL( customDomain );
					// Extract the hostname (e.g., 's12y.org' from 'https://s12y.org')
					const hostname = customDomainUrl.hostname;
					// Construct R2 public URL: 'r2.' + hostname (e.g., 'r2.s12y.org')
					publicUrl = `${ customDomainUrl.protocol }//r2.${ hostname }`;
				} catch ( e ) {
					// If URL parsing fails, fall back to existing logic
				}
			}

			if ( ! workerEndpoint && ! customDomain && ! publicUrl ) {
				throw new Error(
					'Storage provider must have customDomain, publicUrl, or workerEndpoint configured'
				);
			}

			// Construct wp-content.zip URL from storage configuration.
			const wpContentUrl = constructWpContentUrl( siteKey, {
				public_url: publicUrl,
				worker_endpoint: workerEndpoint,
				custom_domain: customDomain,
				bucket_name: bucketName,
			} );

			// Build blueprint steps array.
			const steps = buildBlueprintSteps( {
				wpContentUrl,
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
