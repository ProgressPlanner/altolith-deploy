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
import { formatFileSize } from '../../utils/helpers';

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Create archive', 'aether-site-exporter' ),
	running: () => __( 'Creating wp-content archive…', 'aether-site-exporter' ),
	complete: ( data ) => {
		const { zipSizeFormatted = '' } = data;
		if ( ! zipSizeFormatted ) {
			return __( 'Created wp-content archive', 'aether-site-exporter' );
		}
		return sprintf(
			/* translators: %s: File size */
			__( 'Created archive (%s)', 'aether-site-exporter' ),
			zipSizeFormatted
		);
	},
};

/**
 * Create wp-content archive step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - ExportAPI instance
 * @param {Object}   context.assetManager     - Asset manager instance
 * @param {Array}    context.discoveredAssets - Discovered assets from discoverBlueprintBundleAssets step
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress  - Step progress updater
 * @return {Promise<Object>} Step result with archive info
 */
async function handler( context ) {
	const {
		api,
		assetManager,
		discoveredAssets = [],
		setStatusMessage,
		setStepProgress,
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

	// Update progress with statusData for dynamic label
	if ( setStepProgress ) {
		setStepProgress( 'createWpContentArchive', {
			current: 1,
			total: 1,
			statusData: {
				zipSizeFormatted: sizeFormatted,
			},
		} );
	}

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
 * Step definition
 */
const stepDefinition = {
	id: 'createWpContentArchive',
	label: __( 'Create WP Content Archive', 'aether-site-exporter' ),
	description: __(
		'Package custom plugins, themes, and uploads',
		'aether-site-exporter'
	),
	deploymentType: 'blueprint_bundle',
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
		setStepProgress: {
			from: 'initial',
			required: false,
		},
		assetManager: {
			from: 'initial',
			required: false,
		},
	},
	provides: {
		zipPath: {
			type: 'string',
			scope: 'global',
		},
		zipUrl: {
			type: 'string',
			scope: 'global',
		},
		zipSize: {
			type: 'number',
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
	'aether/step-createWpContentArchive',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
