/**
 * Prepare Blueprint Files Step
 *
 * Prepares individual blueprint files for upload:
 * 1. wp-content.zip archive (database, uploads, mu-plugins)
 * 2. Individual plugin zips for custom plugins
 * 3. Individual theme zips for custom themes
 * 4. Blueprint JSON data (with URL-based resources)
 *
 * Files are uploaded separately by the upload step, NOT bundled into a single zip.
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { getEnabledOutputTypes } from '@altolith/utils/outputTypes';
import { fetchProviderConfig } from '@altolith/export/utils/staticSiteConfig';

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
	pending: __( 'Prepare blueprint files', 'altolith-deploy' ),
	running: () => __( 'Preparing blueprint files…', 'altolith-deploy' ),
	complete: ( data ) => {
		const { customPlugins = 0, customThemes = 0 } = data;
		const assetInfo =
			customPlugins + customThemes > 0
				? ` (${ buildAssetDescription( customPlugins, customThemes ) })`
				: '';
		return __( 'Blueprint files prepared', 'altolith-deploy' ) + assetInfo;
	},
};

/**
 * Prepare blueprint files step handler
 *
 * Performs four phases:
 * 1. Determine target URL from provider config
 * 2. Generate blueprint JSON with URL-based resources
 * 3. Export core content (database, uploads, mu-plugins)
 * 4. Export custom plugins and themes as individual zips
 *
 * Files are NOT bundled - they're returned as individual paths for the upload step.
 *
 * @param {Object}   context                       - Execution context
 * @param {Object}   context.api                   - ExportAPI instance
 * @param {Array}    context.providerInstances     - All provider instances
 * @param {Function} context.generateBlueprintJson - Blueprint JSON generator function
 * @param {Function} context.setStatusMessage      - Status message updater
 * @param {Function} context.setStepProgress       - Step progress updater
 * @return {Promise<Object>} Step result with individual file paths and blueprint data
 */
async function handler( context ) {
	const {
		api,
		providerInstances = [],
		generateBlueprintJson,
		setStatusMessage,
		setStepProgress,
	} = context;

	// --- Phase 1: Determine target URL from first blueprint-enabled provider ---
	// Find the first provider instance that has blueprint enabled
	let blueprintProviderConfig = null;
	for ( const instance of providerInstances ) {
		const instanceConfig = instance.config || {};
		const enabledOutputTypes = getEnabledOutputTypes( instanceConfig );
		if ( enabledOutputTypes.includes( 'blueprint' ) ) {
			// Fetch full provider config to get public_url
			blueprintProviderConfig = await fetchProviderConfig( instance.id );
			break;
		}
	}

	if ( ! blueprintProviderConfig ) {
		throw new Error(
			__( 'No provider with blueprint enabled found', 'altolith-deploy' )
		);
	}

	const baseUrl = blueprintProviderConfig.public_url || '';
	const subfolder =
		blueprintProviderConfig.blueprint_subfolder || 'playground';

	// --- Phase 2: Generate blueprint JSON with URL-based resources ---
	setStatusMessage(
		__( 'Generating blueprint…', 'altolith-deploy' ),
		'progress',
		'createBlueprintBundle'
	);

	let blueprintResult;
	if ( typeof generateBlueprintJson === 'function' ) {
		// Pass baseUrl and subfolder so blueprint uses URL-based resources
		blueprintResult = await generateBlueprintJson(
			{ baseUrl, subfolder },
			setStatusMessage
		);
	} else {
		throw new Error(
			__( 'Blueprint generator function is required', 'altolith-deploy' )
		);
	}

	const {
		blueprint: blueprintData,
		customPlugins,
		customThemes,
	} = blueprintResult;

	// Allow filtering of blueprint data (JSON only)
	const filteredBlueprint = applyFilters(
		'altolith.export.step.createBlueprintBundle.blueprintData',
		blueprintData,
		context
	);

	// Sub-step message for discovery completion
	const assetDescription = buildAssetDescription(
		customPlugins.length,
		customThemes.length
	);
	const discoveryMessage =
		customPlugins.length === 0 && customThemes.length === 0
			? __( 'No custom plugins or themes to bundle', 'altolith-deploy' )
			: sprintf(
					/* translators: %s: Discovered assets description */
					__( 'Will bundle %s', 'altolith-deploy' ),
					assetDescription
			  );

	setStatusMessage( discoveryMessage, 'progress', 'createBlueprintBundle' );

	// --- Phase 2: Export core content ---
	setStatusMessage(
		__( 'Exporting core content (database, uploads)…', 'altolith-deploy' ),
		'progress',
		'createBlueprintBundle'
	);

	const coreContentResponse = await api.exportCoreContent();

	if ( ! coreContentResponse.success ) {
		throw new Error(
			coreContentResponse.message ||
				__( 'Failed to export core content', 'altolith-deploy' )
		);
	}

	const { zipPath: coreContentZipPath, zipSize: coreContentZipSize } =
		coreContentResponse;

	// --- Phase 3: Export custom plugins ---
	const pluginZips = {};
	if ( customPlugins.length > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %d: Number of plugins */
				__( 'Exporting %d custom plugin(s)…', 'altolith-deploy' ),
				customPlugins.length
			),
			'progress',
			'createBlueprintBundle'
		);

		for ( const slug of customPlugins ) {
			const pluginResponse = await api.exportPlugin( slug );
			if ( pluginResponse.success ) {
				pluginZips[ slug ] = pluginResponse.zipPath;
			} else {
				// Log warning but continue - one plugin failure shouldn't stop the bundle
				// eslint-disable-next-line no-console
				console.warn(
					`Failed to export plugin ${ slug }:`,
					pluginResponse.message
				);
			}
		}
	}

	// --- Phase 4: Export custom themes ---
	const themeZips = {};
	if ( customThemes.length > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %d: Number of themes */
				__( 'Exporting %d custom theme(s)…', 'altolith-deploy' ),
				customThemes.length
			),
			'progress',
			'createBlueprintBundle'
		);

		for ( const slug of customThemes ) {
			const themeResponse = await api.exportTheme( slug );
			if ( themeResponse.success ) {
				themeZips[ slug ] = themeResponse.zipPath;
			} else {
				// Log warning but continue
				// eslint-disable-next-line no-console
				console.warn(
					`Failed to export theme ${ slug }:`,
					themeResponse.message
				);
			}
		}
	}

	// Update progress with statusData for dynamic label
	if ( setStepProgress ) {
		setStepProgress( 'createBlueprintBundle', {
			current: 1,
			total: 1,
			statusData: {
				customPlugins: customPlugins.length,
				customThemes: customThemes.length,
			},
		} );
	}

	setStatusMessage(
		__( 'Blueprint files prepared', 'altolith-deploy' ),
		'success',
		'createBlueprintBundle'
	);

	// Return individual file paths for the upload step
	// NO bundle - files are uploaded individually
	return {
		// Core content archive data
		coreContentZipPath,
		coreContentZipSize,
		// Plugin and theme zips (individual files)
		pluginZips,
		themeZips,
		// Blueprint JSON data (will be serialized and uploaded by upload step)
		blueprintData: filteredBlueprint,
		// Lists of custom assets
		customPlugins,
		customThemes,
		// Blueprint subfolder for upload step
		blueprintSubfolder: subfolder,
	};
}

/**
 * Check if step should be skipped
 *
 * Skip if no provider instance has blueprint export enabled.
 *
 * @param {Object} context - Execution context
 * @return {boolean} True if step should be skipped
 */
function shouldSkip( context ) {
	const { providerInstances = [] } = context;

	// Check if any provider instance has blueprint enabled
	const anyBlueprintEnabled = providerInstances.some( ( instance ) => {
		const instanceConfig = instance.config || {};
		const enabledOutputTypes = getEnabledOutputTypes( instanceConfig );
		return enabledOutputTypes.includes( 'blueprint' );
	} );

	// Skip if no provider has blueprint enabled
	return ! anyBlueprintEnabled;
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'createBlueprintBundle',
	label: __( 'Prepare Blueprint Files', 'altolith-deploy' ),
	description: __(
		'Prepare wp-content archive and blueprint files for upload',
		'altolith-deploy'
	),
	shouldSkip,
	supportsProgress: false,
	dependencies: [],
	requires: {
		api: {
			from: 'initial',
			required: true,
		},
		providerInstances: {
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
		coreContentZipPath: {
			type: 'string',
			scope: 'global',
		},
		coreContentZipSize: {
			type: 'number',
			scope: 'global',
		},
		pluginZips: {
			type: 'object',
			scope: 'global',
		},
		themeZips: {
			type: 'object',
			scope: 'global',
		},
		blueprintData: {
			type: 'object',
			scope: 'global',
		},
		customPlugins: {
			type: 'array',
			scope: 'global',
		},
		customThemes: {
			type: 'array',
			scope: 'global',
		},
		blueprintSubfolder: {
			type: 'string',
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
