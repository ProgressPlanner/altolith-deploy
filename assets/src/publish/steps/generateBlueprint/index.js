/**
 * Generate Blueprint Step
 *
 * Generates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '../../../utils/helpers';

/**
 * Generate blueprint step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Object}   context.api                   PublishAPI instance.
 * @param {Function} context.generateBlueprintJson Blueprint JSON generator function.
 * @param {string}   context.zipPath               Path to wp-content.zip from createBlueprintBundle.
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
		__( 'Generating blueprint bundle…', 'aether-site-exporter' ),
		'progress',
		'generateBlueprint'
	);

	if ( ! zipPath ) {
		throw new Error(
			__(
				'Site archive not found. Please run createBlueprintBundle first.',
				'aether-site-exporter'
			)
		);
	}

	// Generate blueprint.json
	let blueprintData;
	if ( typeof generateBlueprintJson === 'function' ) {
		blueprintData = await generateBlueprintJson( {
			assets: discoveredAssets,
			wpContentZipUrl: zipUrl,
		} );
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

	// Allow filtering of blueprint data
	const filteredBlueprint = applyFilters(
		'aether.publish.step.generateBlueprint.data',
		blueprintData,
		context
	);

	// Create the bundle via API
	const bundleResponse = await api.createBlueprintBundle( {
		blueprint: filteredBlueprint,
		wpContentZipPath: zipPath,
	} );

	if ( ! bundleResponse.success ) {
		throw new Error(
			bundleResponse.message ||
				__( 'Failed to create blueprint bundle', 'aether-site-exporter' )
		);
	}

	const { bundlePath, bundleUrl, bundleSize } = bundleResponse;
	const sizeFormatted = formatFileSize( bundleSize || 0 );

	setStatusMessage(
		sprintf(
			__( 'Generated blueprint bundle (%s)', 'aether-site-exporter' ),
			sizeFormatted
		),
		'success',
		'generateBlueprint'
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
 * Generate Blueprint step definition.
 */
export const generateBlueprintStep = {
	id: 'generateBlueprint',
	label: __( 'Generate Blueprint', 'aether-site-exporter' ),
	description: __( 'Create blueprint-bundle.zip', 'aether-site-exporter' ),
	supportsProgress: false,
	dependencies: [ 'createBlueprintBundle' ],
	provides: [ 'blueprintData', 'blueprintBundle' ],
	handler,
};
