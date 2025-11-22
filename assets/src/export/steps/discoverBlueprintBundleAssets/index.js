/**
 * Discover Blueprint Bundle Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in the blueprint bundle.
 *
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
							/* translators: %s: Plugin slug */
							__(
								'1 active custom plugin (%s)',
								'aether-site-exporter'
							),
							plugins[ 0 ].slug
					  )
					: sprintf(
							/* translators: %1$d: Number of plugins, %2$s: Comma-separated plugin slugs */
							_n(
								'%1$d active custom plugin (%2$s)',
								'%1$d active custom plugins (%2$s)',
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
							/* translators: %s: Theme slug */
							__(
								'1 active custom theme (%s)',
								'aether-site-exporter'
							),
							themes[ 0 ].slug
					  )
					: sprintf(
							/* translators: %1$d: Number of themes, %2$s: Comma-separated theme slugs */
							_n(
								'%1$d active custom theme (%2$s)',
								'%1$d active custom themes (%2$s)',
								themes.length,
								'aether-site-exporter'
							),
							themes.length,
							themes.map( ( t ) => t.slug ).join( ', ' )
					  );
			parts.push( themeText );
		}
		message = sprintf(
			/* translators: %s: Discovered assets description */
			__(
				'Discovered %s. These will be included in the blueprint bundle.',
				'aether-site-exporter'
			),
			parts.join( __( ' and ', 'aether-site-exporter' ) )
		);
	}

	setStatusMessage( message, 'success', 'discoverBlueprintBundleAssets' );

	// Return data to merge into execution state
	// Global cache requires success: true
	return {
		success: true,
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
	globalCache: true,
	dependencies: [],
	provides: [ 'discoveredAssets' ],
	handler,
};
