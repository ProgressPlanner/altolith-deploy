/**
 * Create Blueprint Bundle Step
 *
 * Discovers custom assets and generates blueprint-bundle.zip containing
 * blueprint.json and wp-content.zip.
 *
 * This step consolidates asset discovery and bundle creation into a single step.
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '../../utils/helpers';

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
	pending: __( 'Create blueprint', 'aether-site-exporter' ),
	running: () => __( 'Creating blueprint bundle…', 'aether-site-exporter' ),
	complete: ( data ) => {
		const {
			bundleSizeFormatted = '',
			customPlugins = 0,
			customThemes = 0,
		} = data;
		const assetInfo =
			customPlugins + customThemes > 0
				? ` (${ buildAssetDescription( customPlugins, customThemes ) })`
				: '';
		if ( ! bundleSizeFormatted ) {
			return (
				__( 'Created blueprint bundle', 'aether-site-exporter' ) +
				assetInfo
			);
		}
		return (
			sprintf(
				/* translators: %s: File size */
				__( 'Created blueprint (%s)', 'aether-site-exporter' ),
				bundleSizeFormatted
			) + assetInfo
		);
	},
};

/**
 * Create blueprint bundle step handler
 *
 * Performs three phases:
 * 1. Discover custom plugins and themes not on WordPress.org
 * 2. Generate blueprint JSON
 * 3. Create blueprint-bundle.zip
 *
 * @param {Object}   context                       - Execution context
 * @param {Object}   context.api                   - ExportAPI instance
 * @param {Function} context.generateBlueprintJson - Blueprint JSON generator function
 * @param {string}   context.zipPath               - Path to wp-content.zip from createWpContentArchive
 * @param {string}   context.zipUrl                - URL to wp-content.zip
 * @param {Function} context.setStatusMessage      - Status message updater
 * @param {Function} context.setStepProgress       - Step progress updater
 * @return {Promise<Object>} Step result with discovered assets and blueprint bundle info
 */
async function handler( context ) {
	const {
		api,
		generateBlueprintJson,
		zipPath,
		zipUrl,
		setStatusMessage,
		setStepProgress,
	} = context;

	if ( ! zipPath ) {
		throw new Error(
			__(
				'Site archive not found. Please run createWpContentArchive first.',
				'aether-site-exporter'
			)
		);
	}

	// --- Phase 1: Discover assets ---
	setStatusMessage(
		__( 'Discovering plugins and themes…', 'aether-site-exporter' ),
		'progress',
		'createBlueprintBundle'
	);

	const discoveryResponse = await api.discoverBlueprintBundleAssets();

	if ( ! discoveryResponse.success ) {
		throw new Error(
			discoveryResponse.message ||
				__( 'Failed to discover assets', 'aether-site-exporter' )
		);
	}

	const discoveredAssets = discoveryResponse.assets || [];
	const plugins = discoveredAssets.filter( ( a ) => a.type === 'plugin' );
	const themes = discoveredAssets.filter( ( a ) => a.type === 'theme' );

	// Sub-step message for discovery completion
	const assetDescription = buildAssetDescription(
		plugins.length,
		themes.length
	);
	const discoveryMessage =
		plugins.length === 0 && themes.length === 0
			? __(
					'No custom plugins or themes to include',
					'aether-site-exporter'
			  )
			: sprintf(
					/* translators: %s: Discovered assets description */
					__( 'Discovered %s', 'aether-site-exporter' ),
					assetDescription
			  );

	setStatusMessage( discoveryMessage, 'progress', 'createBlueprintBundle' );

	// --- Phase 2: Generate blueprint JSON ---
	setStatusMessage(
		__( 'Generating blueprint…', 'aether-site-exporter' ),
		'progress',
		'createBlueprintBundle'
	);

	let blueprintData;
	if ( typeof generateBlueprintJson === 'function' ) {
		blueprintData = await generateBlueprintJson(
			{
				assets: discoveredAssets,
				wpContentZipUrl: zipUrl,
			},
			setStatusMessage
		);
	} else {
		// Fallback: use API to generate blueprint
		const blueprintResponse = await api.generateBlueprint( {
			assets: discoveredAssets,
			wpContentZipUrl: zipUrl,
		} );

		if ( ! blueprintResponse.success ) {
			throw new Error(
				blueprintResponse.message ||
					__( 'Failed to generate blueprint', 'aether-site-exporter' )
			);
		}
		blueprintData = blueprintResponse.blueprint;
	}

	// Allow filtering of blueprint data (JSON only)
	const filteredBlueprint = applyFilters(
		'aether.export.step.createBlueprintBundle.blueprintData',
		blueprintData,
		context
	);

	// --- Phase 3: Create bundle ZIP ---
	setStatusMessage(
		__( 'Creating blueprint bundle…', 'aether-site-exporter' ),
		'progress',
		'createBlueprintBundle'
	);

	const bundleResponse = await api.createBlueprintBundle( {
		blueprint: filteredBlueprint,
		wpContentZipPath: zipPath,
	} );

	if ( ! bundleResponse.success ) {
		throw new Error(
			bundleResponse.message ||
				__(
					'Failed to create blueprint bundle',
					'aether-site-exporter'
				)
		);
	}

	const { bundlePath, bundleUrl, bundleSize } = bundleResponse;
	const sizeFormatted = formatFileSize( bundleSize || 0 );

	// Update progress with statusData for dynamic label
	if ( setStepProgress ) {
		setStepProgress( 'createBlueprintBundle', {
			current: 1,
			total: 1,
			statusData: {
				bundleSizeFormatted: sizeFormatted,
				customPlugins: plugins.length,
				customThemes: themes.length,
			},
		} );
	}

	setStatusMessage(
		sprintf(
			/* translators: %s: File size */
			__( 'Created blueprint bundle (%s)', 'aether-site-exporter' ),
			sizeFormatted
		),
		'success',
		'createBlueprintBundle'
	);

	// Return data to merge into execution state
	return {
		discoveredAssets,
		blueprintData: filteredBlueprint,
		blueprintBundle: {
			bundlePath,
			bundleUrl,
			bundleSize,
		},
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'createBlueprintBundle',
	label: __( 'Create Blueprint Bundle', 'aether-site-exporter' ),
	description: __(
		'Discover assets and create blueprint-bundle.zip',
		'aether-site-exporter'
	),
	deploymentType: 'blueprint_bundle',
	supportsProgress: false,
	dependencies: [ 'createWpContentArchive' ],
	requires: {
		api: {
			from: 'initial',
			required: true,
		},
		generateBlueprintJson: {
			from: 'initial',
			required: true,
		},
		zipPath: {
			from: 'createWpContentArchive',
			required: true,
		},
		zipUrl: {
			from: 'createWpContentArchive',
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
		blueprintData: {
			type: 'object',
			scope: 'global',
		},
		blueprintBundle: {
			type: 'object',
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
	'aether/step-createBlueprintBundle',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
