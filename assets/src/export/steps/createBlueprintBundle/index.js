/**
 * Create Blueprint Bundle Step
 *
 * Creates the complete blueprint bundle including:
 * 1. wp-content.zip archive (custom plugins, themes, uploads)
 * 2. Asset discovery (identifies custom vs WordPress.org assets)
 * 3. Blueprint JSON generation
 * 4. Final blueprint-bundle.zip
 *
 * This step consolidates all blueprint bundle creation into a single step.
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
					'altolith-deploy'
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
					'altolith-deploy'
				),
				customThemes
			)
		);
	}

	if ( parts.length === 0 ) {
		return __( 'no custom assets', 'altolith-deploy' );
	}

	return parts.join( __( ' and ', 'altolith-deploy' ) );
}

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Create blueprint', 'altolith-deploy' ),
	running: () => __( 'Creating blueprint bundle…', 'altolith-deploy' ),
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
				__( 'Created blueprint bundle', 'altolith-deploy' ) + assetInfo
			);
		}
		return (
			sprintf(
				/* translators: %s: File size */
				__( 'Created blueprint (%s)', 'altolith-deploy' ),
				bundleSizeFormatted
			) + assetInfo
		);
	},
};

/**
 * Create blueprint bundle step handler
 *
 * Performs four phases:
 * 1. Create wp-content archive (plugins, themes, uploads)
 * 2. Discover custom plugins and themes not on WordPress.org
 * 3. Generate blueprint JSON
 * 4. Create blueprint-bundle.zip
 *
 * @param {Object}   context                       - Execution context
 * @param {Object}   context.api                   - ExportAPI instance
 * @param {Function} context.generateBlueprintJson - Blueprint JSON generator function
 * @param {Function} context.setStatusMessage      - Status message updater
 * @param {Function} context.setStepProgress       - Step progress updater
 * @return {Promise<Object>} Step result with archive info, discovered assets and blueprint bundle
 */
async function handler( context ) {
	const { api, generateBlueprintJson, setStatusMessage, setStepProgress } =
		context;

	// --- Phase 1: Create wp-content archive ---
	setStatusMessage(
		__( 'Creating wp-content archive…', 'altolith-deploy' ),
		'progress',
		'createBlueprintBundle'
	);

	const archiveResponse = await api.createArchive( {
		includeUploads: true,
	} );

	if ( ! archiveResponse.success ) {
		throw new Error(
			archiveResponse.message ||
				__( 'Failed to create wp-content archive', 'altolith-deploy' )
		);
	}

	const { zipPath, zipUrl, zipSize } = archiveResponse;

	// --- Phase 2: Discover assets ---
	setStatusMessage(
		__( 'Discovering plugins and themes…', 'altolith-deploy' ),
		'progress',
		'createBlueprintBundle'
	);

	const discoveryResponse = await api.discoverBlueprintBundleAssets();

	if ( ! discoveryResponse.success ) {
		throw new Error(
			discoveryResponse.message ||
				__( 'Failed to discover assets', 'altolith-deploy' )
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
			? __( 'No custom plugins or themes to include', 'altolith-deploy' )
			: sprintf(
					/* translators: %s: Discovered assets description */
					__( 'Discovered %s', 'altolith-deploy' ),
					assetDescription
			  );

	setStatusMessage( discoveryMessage, 'progress', 'createBlueprintBundle' );

	// --- Phase 3: Generate blueprint JSON ---
	setStatusMessage(
		__( 'Generating blueprint…', 'altolith-deploy' ),
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
					__( 'Failed to generate blueprint', 'altolith-deploy' )
			);
		}
		blueprintData = blueprintResponse.blueprint;
	}

	// Allow filtering of blueprint data (JSON only)
	const filteredBlueprint = applyFilters(
		'altolith.export.step.createBlueprintBundle.blueprintData',
		blueprintData,
		context
	);

	// --- Phase 4: Create bundle ZIP ---
	setStatusMessage(
		__( 'Creating blueprint bundle…', 'altolith-deploy' ),
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
				__( 'Failed to create blueprint bundle', 'altolith-deploy' )
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
			__( 'Created blueprint bundle (%s)', 'altolith-deploy' ),
			sizeFormatted
		),
		'success',
		'createBlueprintBundle'
	);

	// Return data to merge into execution state
	return {
		// Archive data (for potential downstream use)
		zipPath,
		zipUrl,
		zipSize,
		// Discovery and blueprint data
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
	label: __( 'Create Blueprint Bundle', 'altolith-deploy' ),
	description: __(
		'Create wp-content archive and blueprint-bundle.zip',
		'altolith-deploy'
	),
	deploymentType: 'blueprint_bundle',
	supportsProgress: false,
	dependencies: [],
	requires: {
		api: {
			from: 'initial',
			required: true,
		},
		generateBlueprintJson: {
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
		zipPath: {
			type: 'string',
			scope: 'global',
		},
		zipUrl: {
			type: 'string',
			scope: 'global',
		},
		zipSize: {
			type: 'number',
			scope: 'global',
		},
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
	'altolith.export.register_steps',
	'altolith/step-createBlueprintBundle',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
