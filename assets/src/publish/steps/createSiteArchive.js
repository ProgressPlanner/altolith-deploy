/**
 * Create Site Archive Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '../../utils/helpers';

/**
 * Create site archive step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Object}   context.assetManager     Asset manager instance.
 * @param {Array}    context.discoveredAssets Discovered assets from discoverAssets step.
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
		'Creating site archive…',
		'progress',
		'createSiteArchive'
	);

	// Determine which files to include
	const filesToInclude = applyFilters(
		'aether.publish.step.createSiteArchive.files',
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
			archiveResponse.message || 'Failed to create site archive'
		);
	}

	const { zipPath, zipUrl, zipSize } = archiveResponse;
	const sizeFormatted = formatFileSize( zipSize || 0 );

	// Update asset manager if provided
	if ( assetManager && zipPath ) {
		assetManager.setArchivePath( zipPath );
	}

	setStatusMessage(
		`Created site archive (${ sizeFormatted })`,
		'success',
		'createSiteArchive'
	);

	// Return data to merge into execution state
	return {
		zipPath,
		zipUrl,
		zipSize,
	};
}

/**
 * Create Site Archive step definition.
 */
export const createSiteArchiveStep = {
	id: 'createSiteArchive',
	label: 'Create Archive',
	description: 'Package custom plugins, themes, and uploads',
	dependencies: [ 'discoverAssets' ],
	provides: [ 'zipPath', 'zipUrl', 'zipSize' ],
	handler,
};
