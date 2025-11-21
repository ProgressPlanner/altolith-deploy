/**
 * Discover Blueprint Bundle Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in the blueprint bundle.
 *
 * @package
 */

import { __, sprintf, _n } from '@wordpress/i18n';

/**
 * Discover blueprint bundle assets step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered assets.
 */
async function handler( context ) {
	const { api, setStatusMessage } = context;

	setStatusMessage(
		__( 'Discovering plugins and themes…', 'aether-site-exporter' ),
		'progress',
		'discoverBlueprintBundleAssets'
	);

	// Call client-side asset discovery
	const discoveryResponse = await api.discoverBlueprintBundleAssets();

	if ( ! discoveryResponse.success ) {
		throw new Error(
			discoveryResponse.message ||
				__( 'Failed to discover assets', 'aether-site-exporter' )
		);
	}

	const assets = discoveryResponse.assets || [];
	const plugins = assets.filter( ( a ) => a.type === 'plugin' );
	const themes = assets.filter( ( a ) => a.type === 'theme' );

	// Build success message
	let message;
	if ( assets.length === 0 ) {
		message = __(
			'Discovered 0 active custom plugins/themes',
			'aether-site-exporter'
		);
	} else {
		const parts = [];
		if ( plugins.length > 0 ) {
			const pluginText =
				plugins.length === 1
					? sprintf(
							__( '1 active custom plugin (%s)', 'aether-site-exporter' ),
							plugins[ 0 ].slug
					  )
					: sprintf(
							_n(
								'%d active custom plugin (%s)',
								'%d active custom plugins (%s)',
								plugins.length,
								'aether-site-exporter'
							),
							plugins.length,
							plugins.map( ( p ) => p.slug ).join( ', ' )
					  );
			parts.push( pluginText );
		}
		if ( themes.length > 0 ) {
			const themeText =
				themes.length === 1
					? sprintf(
							__( '1 active custom theme (%s)', 'aether-site-exporter' ),
							themes[ 0 ].slug
					  )
					: sprintf(
							_n(
								'%d active custom theme (%s)',
								'%d active custom themes (%s)',
								themes.length,
								'aether-site-exporter'
							),
							themes.length,
							themes.map( ( t ) => t.slug ).join( ', ' )
					  );
			parts.push( themeText );
		}
		message = sprintf(
			__( 'Discovered %s. These will be included in the blueprint bundle.', 'aether-site-exporter' ),
			parts.join( __( ' and ', 'aether-site-exporter' ) )
		);
	}

	setStatusMessage( message, 'success', 'discoverBlueprintBundleAssets' );

	// Return data to merge into execution state
	return {
		discoveredAssets: assets,
	};
}

/**
 * Discover Blueprint Bundle Assets step definition.
 */
export const discoverBlueprintBundleAssetsStep = {
	id: 'discoverBlueprintBundleAssets',
	label: __( 'Discover Assets', 'aether-site-exporter' ),
	description: __(
		'Find custom plugins and themes for blueprint bundle',
		'aether-site-exporter'
	),
	supportsProgress: false,
	dependencies: [],
	provides: [ 'discoveredAssets' ],
	handler,
};
