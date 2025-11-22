/**
 * Create Blueprint Bundle Step
 *
 * Generates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '@aether/utils/helpers';

/**
 * Create blueprint bundle step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Object}   context.api                   ExportAPI instance.
 * @param {Function} context.generateBlueprintJson Blueprint JSON generator function.
 * @param {string}   context.zipPath               Path to wp-content.zip from createWpContentArchive.
 * @param {string}   context.zipUrl                URL to wp-content.zip.
 * @param {Array}    context.discoveredAssets      Discovered assets.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @return {Promise<Object>} Step result with blueprint bundle info.
 */
async function handler( context ) {
	const {
		api,
		generateBlueprintJson,
		zipPath,
		zipUrl,
		discoveredAssets = [],
		setStatusMessage,
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
	// This will be cached globally and shared across all providers
	return {
		success: true,
		blueprintData: filteredBlueprint,
		blueprintBundle: {
			bundlePath,
			bundleUrl,
			bundleSize,
		},
		// Also expose bundlePath at top level for easier access
		bundlePath,
	};
}

/**
 * Create Blueprint Bundle step definition.
 */
export const createBlueprintBundleStep = {
	id: 'createBlueprintBundle',
	label: __( 'Create Blueprint Bundle', 'aether-site-exporter' ),
	description: __( 'Create blueprint-bundle.zip', 'aether-site-exporter' ),
	supportsProgress: false,
	globalCache: true,
	dependencies: [ 'createWpContentArchive' ],
	provides: [ 'blueprintData', 'blueprintBundle' ],
	handler,
};
