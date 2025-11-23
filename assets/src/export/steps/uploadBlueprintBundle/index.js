/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { formatFileSize } from '@aether/utils/helpers';
import {
	createFileContext,
	FILE_TYPES,
	uploadFile,
} from '@aether/export/utils/unifiedFileUpload';

/**
 * Upload blueprint bundle step handler
 *
 * Processes a single provider instance (thread context).
 * Called once per provider by ThreadOrchestrator.
 *
 * @param {Object}   context                          - Execution context
 * @param {Object}   context.currentProviderInstance  - Current provider instance from thread
 * @param {Object}   context.blueprintBundle          - Bundle data from createBlueprintBundle
 * @param {string}   context.siteUrl                  - WordPress site URL
 * @param {Function} context.setStatusMessage         - Status message updater
 * @param {Function} context.setStepProgress          - Step progress updater
 * @return {Promise<Object>} Step result
 */
async function handler( context ) {
	const {
		currentProviderInstance,
		blueprintBundle,
		siteUrl,
		setStatusMessage,
		setStepProgress,
	} = context;

	if ( ! currentProviderInstance ) {
		throw new Error(
			__( 'Provider instance not found in thread context', 'aether' )
		);
	}

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	const bundleSize = blueprintBundle?.bundleSize || 0;
	const bundleSizeFormatted = formatFileSize( bundleSize );

	setStatusMessage(
		sprintf(
			/* translators: %1$s: Provider label, %2$s: File size */
			__( 'Uploading blueprint bundle (%2$s) to %1$s…', 'aether' ),
			providerLabel,
			bundleSizeFormatted
		),
		'progress',
		'uploadBlueprintBundle'
	);

	// Fetch provider config to get export_path
	let exportPath = 'blueprint-bundle/bundle.zip';
	try {
		const providerResponse = await apiFetch( {
			path: `/aether/site-exporter/providers/${ providerId }/config`,
		} );
		if ( providerResponse.success && providerResponse.config ) {
			const providerConfig = providerResponse.config || {};
			if ( providerConfig.export_path ) {
				exportPath = providerConfig.export_path;
			}
		}
	} catch {
		// Use default path on error
	}

	// Create unified file context for blueprint bundle
	const fileContext = createFileContext( {
		fileType: FILE_TYPES.BLUEPRINT_BUNDLE,
		filePath: blueprintBundle.bundlePath,
		fileContent: null,
		contentType: 'application/zip',
		storageKey: exportPath,
		providerId,
		metadata: {
			...context,
			siteUrl,
			exportPath,
		},
	} );

	// Upload file using unified upload system
	// This fires aether.file.upload action which providers hook into
	await uploadFile( fileContext );

	// Report success
	setStatusMessage(
		sprintf(
			/* translators: %1$s: Provider label, %2$s: File size */
			__( 'Uploaded blueprint bundle (%2$s) to %1$s', 'aether' ),
			providerLabel,
			bundleSizeFormatted
		),
		'success',
		'uploadBlueprintBundle'
	);

	return {
		bundleUploadResults: {
			providerId,
			providerLabel,
			success: true,
			exportPath,
			bundleSize,
		},
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'uploadBlueprintBundle',
	label: __( 'Upload Blueprint Bundle', 'aether' ),
	description: __( 'Upload blueprint-bundle.zip to providers', 'aether' ),
	supportsProgress: true,
	dependencies: [ 'createBlueprintBundle' ],
	requires: {
		currentProviderInstance: {
			from: 'thread',
			required: true,
		},
		blueprintBundle: {
			from: 'createBlueprintBundle',
			required: true,
		},
		siteUrl: {
			from: 'initial',
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
		bundleUploadResults: {
			type: 'object',
			scope: 'thread',
		},
	},
	handler,
};

/**
 * Register step via WordPress hooks
 */
addAction(
	'aether.export.register_steps',
	'aether/step-uploadBlueprintBundle',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
