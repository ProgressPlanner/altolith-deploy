/**
 * Create Blueprint Bundle Step
 *
 * Generates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '../../utils/helpers';

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Create blueprint', 'aether-site-exporter' ),
	running: () => __( 'Creating blueprint bundle…', 'aether-site-exporter' ),
	complete: ( data ) => {
		const { bundleSizeFormatted = '' } = data;
		if ( ! bundleSizeFormatted ) {
			return __( 'Created blueprint bundle', 'aether-site-exporter' );
		}
		return sprintf(
			/* translators: %s: File size */
			__( 'Created blueprint (%s)', 'aether-site-exporter' ),
			bundleSizeFormatted
		);
	},
};

/**
 * Create blueprint bundle step handler
 *
 * @param {Object}   context                       - Execution context
 * @param {Object}   context.api                   - ExportAPI instance
 * @param {Function} context.generateBlueprintJson - Blueprint JSON generator function
 * @param {string}   context.zipPath               - Path to wp-content.zip from createWpContentArchive
 * @param {string}   context.zipUrl                - URL to wp-content.zip
 * @param {Array}    context.discoveredAssets      - Discovered assets
 * @param {Function} context.setStatusMessage      - Status message updater
 * @param {Function} context.setStepProgress       - Step progress updater
 * @return {Promise<Object>} Step result with blueprint bundle info
 */
async function handler( context ) {
	const {
		api,
		generateBlueprintJson,
		zipPath,
		zipUrl,
		discoveredAssets = [],
		setStatusMessage,
		setStepProgress,
	} = context;

	setStatusMessage(
		__( 'Creating blueprint bundle…', 'aether-site-exporter' ),
		'progress',
		'createBlueprintBundle'
	);

	if ( ! zipPath ) {
		throw new Error(
			__(
				'Site archive not found. Please run createWpContentArchive first.',
				'aether-site-exporter'
			)
		);
	}

	// Generate blueprint.json
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

	// Create the blueprint-bundle.zip via API
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
	description: __( 'Create blueprint-bundle.zip', 'aether-site-exporter' ),
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
		discoveredAssets: {
			from: 'discoverBlueprintBundleAssets',
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
