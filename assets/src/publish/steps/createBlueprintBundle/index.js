/**
 * Create Blueprint Bundle Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @package
 */

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
		'Creating blueprint bundle…',
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
			archiveResponse.message || 'Failed to create blueprint bundle'
		);
	}

	const { zipPath, zipUrl, zipSize } = archiveResponse;
	const sizeFormatted = formatFileSize( zipSize || 0 );

	// Update asset manager if provided
	if ( assetManager && zipPath ) {
		assetManager.setArchivePath( zipPath );
	}

	setStatusMessage(
		`Created blueprint bundle (${ sizeFormatted })`,
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
	label: 'Create Bundle',
	description: 'Package custom plugins, themes, and uploads',
	dependencies: [ 'discoverBlueprintBundleAssets' ],
	provides: [ 'zipPath', 'zipUrl', 'zipSize' ],
	handler,
};
