/**
 * Create Blueprint Bundle Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '../../../utils/helpers';

/**
 * Create blueprint bundle step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Object}   context.assetManager     Asset manager instance.
 * @param {Array}    context.discoveredAssets Discovered assets from discoverBlueprintBundleAssets step.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with archive info.
 */
async function handler( context ) {
	const {
		api,
		assetManager,
		discoveredAssets = [],
		setStatusMessage,
	} = context;

	setStatusMessage(
		__( 'Creating blueprint bundle…', 'aether-site-exporter' ),
		'progress',
		'createBlueprintBundle'
	);

	// Determine which files to include
	const filesToInclude = applyFilters(
		'aether.publish.step.createBlueprintBundle.files',
		discoveredAssets,
		context
	);

	// Create the archive via API
	const archiveResponse = await api.createArchive( {
		assets: filesToInclude,
		includeUploads: true,
	} );

	if ( ! archiveResponse.success ) {
		throw new Error(
			archiveResponse.message ||
				__(
					'Failed to create blueprint bundle',
					'aether-site-exporter'
				)
		);
	}

	const { zipPath, zipUrl, zipSize } = archiveResponse;
	const sizeFormatted = formatFileSize( zipSize || 0 );

	// Update asset manager if provided
	if ( assetManager && zipPath ) {
		assetManager.setArchivePath( zipPath );
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
		zipPath,
		zipUrl,
		zipSize,
	};
}

/**
 * Create Blueprint Bundle step definition.
 */
export const createBlueprintBundleStep = {
	id: 'createBlueprintBundle',
	label: __( 'Create Bundle', 'aether-site-exporter' ),
	description: __(
		'Package custom plugins, themes, and uploads',
		'aether-site-exporter'
	),
	supportsProgress: true,
	dependencies: [ 'discoverBlueprintBundleAssets' ],
	provides: [ 'zipPath', 'zipUrl', 'zipSize' ],
	handler,
};
