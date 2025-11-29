/**
 * Prepare Blueprint Step
 *
 * Prepares individual blueprint files for deployment:
 * 1. wp-content.zip archive (database, uploads, mu-plugins)
 * 2. Individual plugin zips for custom plugins
 * 3. Individual theme zips for custom themes
 * 4. Blueprint JSON data (with URL-based resources)
 *
 * Files are deployed separately by the deploy step, NOT bundled into a single zip.
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { getEnabledOutputTypes } from '@altolith/utils/outputTypes';

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
 * 1. Generate blueprint JSON with URL-based resources (using placeholder URL)
 * 2. Export core content (database, uploads, mu-plugins)
 * 3. Export custom plugins as individual zips
 * 4. Export custom themes as individual zips
 *
 * Files are NOT bundled - they're returned as individual paths for the deploy step.
 * The placeholder URL {targetUrl} will be replaced by each provider during deployment.
 *
 * @param {Object}   context                       - Execution context
 * @param {Object}   context.api                   - ExportAPI instance
 * @param {Function} context.generateBlueprintJson - Blueprint JSON generator function
 * @param {Function} context.setStatusMessage      - Status message updater
 * @param {Function} context.setStepProgress       - Step progress updater
 * @return {Promise<Object>} Step result with individual file paths and blueprint data
 */
async function handler( context ) {
	const { api, generateBlueprintJson, setStatusMessage, setStepProgress } =
		context;

	// Check if blueprint export is enabled in global settings
	const enabledOutputTypes = getEnabledOutputTypes();
	if ( ! enabledOutputTypes.includes( 'blueprint' ) ) {
		// Blueprint not enabled, return empty result
		return {
			blueprintFiles: {},
			blueprintJson: null,
		};
	}

	// Use placeholder URL - will be replaced during deploy step
	// Each provider will replace {targetUrl} with their actual public_url
	const baseUrl = '{targetUrl}';
	// Use placeholder for blueprint path - will be replaced during deploy step
	// Each provider will replace {blueprintPath} with their actual blueprint_subfolder
	const subfolder = '{blueprintPath}';

	// --- Phase 1: Generate blueprint JSON with URL-based resources ---
	setStatusMessage(
		__( 'Generating blueprint\u2026', 'altolith-deploy' ),
		'progress',
		'prepareBlueprint'
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
		'altolith.export.step.prepareBlueprint.blueprintData',
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

	setStatusMessage( discoveryMessage, 'progress', 'prepareBlueprint' );

	// Build blueprintFiles object - maps relative paths to source info
	const blueprintFiles = {};

	// --- Phase 2: Export core content ---
	setStatusMessage(
		__(
			'Exporting core content (database, uploads)\u2026',
			'altolith-deploy'
		),
		'progress',
		'prepareBlueprint'
	);

	const coreContentResponse = await api.exportCoreContent();

	if ( ! coreContentResponse.success ) {
		throw new Error(
			coreContentResponse.message ||
				__( 'Failed to export core content', 'altolith-deploy' )
		);
	}

	// Add core content to blueprintFiles
	blueprintFiles[ 'wp-content.zip' ] = {
		sourcePath: coreContentResponse.zipPath,
		size: coreContentResponse.zipSize || 0,
		type: 'core',
	};

	// --- Phase 3: Export custom plugins ---
	if ( customPlugins.length > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %d: Number of plugins */
				__( 'Exporting %d custom plugin(s)\u2026', 'altolith-deploy' ),
				customPlugins.length
			),
			'progress',
			'prepareBlueprint'
		);

		for ( const slug of customPlugins ) {
			const pluginResponse = await api.exportPlugin( slug );
			if ( pluginResponse.success ) {
				blueprintFiles[ `plugins/${ slug }.zip` ] = {
					sourcePath: pluginResponse.zipPath,
					type: 'plugin',
					slug,
				};
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
	if ( customThemes.length > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %d: Number of themes */
				__( 'Exporting %d custom theme(s)\u2026', 'altolith-deploy' ),
				customThemes.length
			),
			'progress',
			'prepareBlueprint'
		);

		for ( const slug of customThemes ) {
			const themeResponse = await api.exportTheme( slug );
			if ( themeResponse.success ) {
				blueprintFiles[ `themes/${ slug }.zip` ] = {
					sourcePath: themeResponse.zipPath,
					type: 'theme',
					slug,
				};
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
		setStepProgress( 'prepareBlueprint', {
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
		'prepareBlueprint'
	);

	// Return simplified output: just blueprintFiles and blueprintJson
	// blueprintFiles: maps relative paths to source info
	// blueprintJson: the JSON data with {targetUrl} placeholders
	return {
		blueprintFiles,
		blueprintJson: filteredBlueprint,
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'prepareBlueprint',
	label: __( 'Prepare Blueprint', 'altolith-deploy' ),
	description: __(
		'Prepare wp-content archive and blueprint files for deployment',
		'altolith-deploy'
	),
	deploymentType: 'blueprint',
	supportsProgress: false,
	dependencies: [],
	requires: {
		api: true,
		generateBlueprintJson: true,
		setStatusMessage: true,
		setStepProgress: false,
	},
	provides: {
		blueprintFiles: {
			type: 'object',
			scope: 'global',
		},
		blueprintJson: {
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
	'altolith/step-prepareBlueprint',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
