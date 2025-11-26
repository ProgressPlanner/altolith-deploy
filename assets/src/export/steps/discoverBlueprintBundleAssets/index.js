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
 * Build a human-readable description of discovered assets
 *
 * @param {number} customPlugins Number of custom plugins
 * @param {number} customThemes  Number of custom themes
 * @return {string} Human-readable description
 */
function buildAssetDescription( customPlugins, customThemes ) {
	const parts = [];

	if ( customPlugins > 0 ) {
		parts.push(
			sprintf(
				/* translators: %d: Number of custom plugins */
				_n(
					'%d custom plugin',
					'%d custom plugins',
					customPlugins,
					'aether-site-exporter'
				),
				customPlugins
			)
		);
	}

	if ( customThemes > 0 ) {
		parts.push(
			sprintf(
				/* translators: %d: Number of custom themes */
				_n(
					'%d custom theme',
					'%d custom themes',
					customThemes,
					'aether-site-exporter'
				),
				customThemes
			)
		);
	}

	if ( parts.length === 0 ) {
		return __( 'no custom assets', 'aether-site-exporter' );
	}

	return parts.join( __( ' and ', 'aether-site-exporter' ) );
}

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Discover assets', 'aether-site-exporter' ),
	running: () =>
		__( 'Discovering plugins and themes…', 'aether-site-exporter' ),
	complete: ( data ) => {
		const { customPlugins = 0, customThemes = 0 } = data;
		if ( customPlugins === 0 && customThemes === 0 ) {
			return __(
				'No custom plugins or themes to include',
				'aether-site-exporter'
			);
		}
		return sprintf(
			/* translators: %s: Description of discovered assets */
			__( 'Discovered %s', 'aether-site-exporter' ),
			buildAssetDescription( customPlugins, customThemes )
		);
	},
};

/**
 * Discover blueprint bundle assets step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress  - Step progress updater
 * @return {Promise<Object>} Step result with discovered assets
 */
async function handler( context ) {
	const { api, setStatusMessage, setStepProgress } = context;

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

	// Update progress with statusData for dynamic label
	if ( setStepProgress ) {
		setStepProgress( 'discoverBlueprintBundleAssets', {
			current: 1,
			total: 1,
			statusData: {
				customPlugins: plugins.length,
				customThemes: themes.length,
			},
		} );
	}

	// Build success message
	const assetDescription = buildAssetDescription(
		plugins.length,
		themes.length
	);
	const message =
		plugins.length === 0 && themes.length === 0
			? __(
					'No custom plugins or themes to include',
					'aether-site-exporter'
			  )
			: sprintf(
					/* translators: %s: Discovered assets description */
					__(
						'Discovered %s for blueprint bundle',
						'aether-site-exporter'
					),
					assetDescription
			  );

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
	label: __( 'Discover Assets', 'aether-site-exporter' ),
	description: __(
		'Find custom plugins and themes for blueprint bundle',
		'aether-site-exporter'
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
		setStepProgress: {
			from: 'initial',
			required: false,
		},
	},
	provides: {
		discoveredAssets: {
			type: 'array',
			scope: 'global',
		},
	},
	statusLabels,
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
