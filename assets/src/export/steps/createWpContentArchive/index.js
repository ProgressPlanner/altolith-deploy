/**
 * Create WP Content Archive Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { formatFileSize } from '@aether/utils/helpers';

/**
 * Create wp-content archive step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - ExportAPI instance
 * @param {Object}   context.assetManager     - Asset manager instance
 * @param {Array}    context.discoveredAssets - Discovered assets from discoverBlueprintBundleAssets step
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with archive info
 */
async function handler( context ) {
	const {
		api,
		assetManager,
		discoveredAssets = [],
		setStatusMessage,
	} = context;

	setStatusMessage(
		__( 'Creating wp-content archive…', 'aether' ),
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
				__( 'Failed to create wp-content archive', 'aether' )
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
			__( 'Created wp-content archive (%s)', 'aether' ),
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
 * Step definition
 */
const stepDefinition = {
	id: 'createWpContentArchive',
	label: __( 'Create WP Content Archive', 'aether' ),
	description: __( 'Package custom plugins, themes, and uploads', 'aether' ),
	supportsProgress: true,
	dependencies: [ 'discoverBlueprintBundleAssets' ],
	requires: {
		api: {
			from: 'initial',
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
		assetManager: {
			from: 'initial',
			required: false,
		},
	},
	provides: {
		zipPath: 'string',
		zipUrl: 'string',
		zipSize: 'number',
	},
	handler,
};

/**
 * Register step via WordPress hooks
 */
addAction(
	'aether.export.register_steps',
	'aether/step-createWpContentArchive',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
