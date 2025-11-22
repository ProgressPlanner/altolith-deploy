/**
 * Create WP Content Archive Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '@aether/utils/helpers';

/**
 * Create wp-content archive step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              ExportAPI instance.
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
		__( 'Creating wp-content archive…', 'aether-site-exporter' ),
		'progress',
		'createWpContentArchive'
	);

	// Determine which files to include
	const filesToInclude = applyFilters(
		'aether.export.step.createWpContentArchive.files',
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
					'Failed to create wp-content archive',
					'aether-site-exporter'
				)
		);
	}

	const { zipPath, zipUrl, zipSize } = archiveResponse;
	const sizeFormatted = formatFileSize( zipSize || 0 );

	// Update asset manager if provided and method exists
	if (
		assetManager &&
		zipPath &&
		typeof assetManager.setArchivePath === 'function'
	) {
		assetManager.setArchivePath( zipPath );
	}

	setStatusMessage(
		sprintf(
			/* translators: %s: File size */
			__( 'Created wp-content archive (%s)', 'aether-site-exporter' ),
			sizeFormatted
		),
		'success',
		'createWpContentArchive'
	);

	// Return data to merge into execution state
	return {
		zipPath,
		zipUrl,
		zipSize,
	};
}

/**
 * Create WP Content Archive step definition.
 */
export const createWpContentArchiveStep = {
	id: 'createWpContentArchive',
	label: __( 'Create WP Content Archive', 'aether-site-exporter' ),
	description: __(
		'Package custom plugins, themes, and uploads',
		'aether-site-exporter'
	),
	supportsProgress: true,
	globalCache: true,
	dependencies: [ 'discoverBlueprintBundleAssets' ],
	provides: [ 'zipPath', 'zipUrl', 'zipSize' ],
	handler,
};
