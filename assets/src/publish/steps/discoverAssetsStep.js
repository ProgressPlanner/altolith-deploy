/**
 * Discover Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in wp-content.zip.
 *
 * @package
 */

/**
 * Discover assets step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered assets.
 */
export async function discoverAssetsHandler( context ) {
	const { api, setStatusMessage } = context;

	setStatusMessage(
		'Discovering plugins and themes…',
		'progress',
		'discoverAssets'
	);

	// Call client-side asset discovery
	const discoveryResponse = await api.discoverAssets();

	if ( ! discoveryResponse.success ) {
		throw new Error(
			discoveryResponse.message || 'Failed to discover assets'
		);
	}

	const assets = discoveryResponse.assets || [];
	const plugins = assets.filter( ( a ) => a.type === 'plugin' );
	const themes = assets.filter( ( a ) => a.type === 'theme' );

	// Build success message
	let message;
	if ( assets.length === 0 ) {
		message = 'Discovered 0 active custom plugins/themes';
	} else {
		const parts = [];
		if ( plugins.length > 0 ) {
			const pluginText =
				plugins.length === 1
					? `1 active custom plugin (${ plugins[ 0 ].slug })`
					: `${ plugins.length } active custom plugins (${ plugins
							.map( ( p ) => p.slug )
							.join( ', ' ) })`;
			parts.push( pluginText );
		}
		if ( themes.length > 0 ) {
			const themeText =
				themes.length === 1
					? `1 active custom theme (${ themes[ 0 ].slug })`
					: `${ themes.length } active custom themes (${ themes
							.map( ( t ) => t.slug )
							.join( ', ' ) })`;
			parts.push( themeText );
		}
		message = `Discovered ${ parts.join(
			' and '
		) }. These will be included in the blueprint bundle.`;
	}

	setStatusMessage( message, 'success', 'discoverAssets' );

	// Return data to merge into job status
	return {
		discoveredAssets: assets,
	};
}
