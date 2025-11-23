/**
 * Discover Blueprint Bundle Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in the blueprint bundle.
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';

/**
 * Discover blueprint bundle assets step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with discovered assets
 */
async function handler( context ) {
	const { api, setStatusMessage } = context;

	setStatusMessage(
		__( 'Discovering plugins and themes…', 'aether' ),
		'progress',
		'discoverBlueprintBundleAssets'
	);

	// Call client-side asset discovery
	const discoveryResponse = await api.discoverBlueprintBundleAssets();

	if ( ! discoveryResponse.success ) {
		throw new Error(
			discoveryResponse.message ||
				__( 'Failed to discover assets', 'aether' )
		);
	}

	const assets = discoveryResponse.assets || [];
	const plugins = assets.filter( ( a ) => a.type === 'plugin' );
	const themes = assets.filter( ( a ) => a.type === 'theme' );

	// Build success message
	let message;
	if ( assets.length === 0 ) {
		message = __( 'Discovered 0 active custom plugins/themes', 'aether' );
	} else {
		const parts = [];
		if ( plugins.length > 0 ) {
			const pluginText =
				plugins.length === 1
					? sprintf(
							/* translators: %s: Plugin slug */
							__( '1 active custom plugin (%s)', 'aether' ),
							plugins[ 0 ].slug
					  )
					: sprintf(
							/* translators: %1$d: Number of plugins, %2$s: Comma-separated plugin slugs */
							_n(
								'%1$d active custom plugin (%2$s)',
								'%1$d active custom plugins (%2$s)',
								plugins.length,
								'aether'
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
							__( '1 active custom theme (%s)', 'aether' ),
							themes[ 0 ].slug
					  )
					: sprintf(
							/* translators: %1$d: Number of themes, %2$s: Comma-separated theme slugs */
							_n(
								'%1$d active custom theme (%2$s)',
								'%1$d active custom themes (%2$s)',
								themes.length,
								'aether'
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
				'aether'
			),
			parts.join( __( ' and ', 'aether' ) )
		);
	}

	setStatusMessage( message, 'success', 'discoverBlueprintBundleAssets' );

	// Return data to merge into execution state
	return {
		discoveredAssets: assets,
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'discoverBlueprintBundleAssets',
	label: __( 'Discover Assets', 'aether' ),
	description: __(
		'Find custom plugins and themes for blueprint bundle',
		'aether'
	),
	supportsProgress: false,
	dependencies: [],
	requires: {
		api: {
			from: 'initial',
			required: true,
		},
		setStatusMessage: {
			from: 'initial',
			required: true,
		},
	},
	provides: {
		discoveredAssets: {
			type: 'array',
			scope: 'global',
		},
	},
	handler,
};

/**
 * Register step via WordPress hooks
 */
addAction(
	'aether.export.register_steps',
	'aether/step-discoverBlueprintBundleAssets',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
