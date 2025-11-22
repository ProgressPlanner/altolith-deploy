/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { formatFileSize } from '@aether/utils/helpers';
import {
	createFileContext,
	FILE_TYPES,
	uploadFile,
} from '@aether/export/utils/unifiedFileUpload';

/**
 * Upload blueprint bundle step handler.
 *
 * @param {Object}   context                          Execution context.
 * @param {Array}    context.blueprintBundleProviders Providers for blueprint bundle.
 * @param {Object}   context.blueprintBundle          Bundle data from "./createBlueprintBundle.
 * @param {string}   context.siteUrl                  WordPress site URL.
 * @param {Function} context.setStatusMessage         Status message updater.
 * @param {Function} context.setStepProgress          Step progress updater.
 * @param {Function} context.setOverallProgressValue  Overall progress updater.
 * @return {Promise<Object>} Step result.
 */
async function handler( context ) {
	const {
		providerId,
		blueprintBundle,
		bundlePath,
		siteUrl,
		setStatusMessage,
		setStepProgress,
	} = context;

	// Use bundlePath from global cache (createBlueprintBundle step) if available
	const bundlePathToUse = bundlePath || blueprintBundle?.bundlePath;

	if ( ! bundlePathToUse ) {
		throw new Error(
			__( 'Blueprint bundle path not found', 'aether-site-exporter' )
		);
	}

	const bundleSize = blueprintBundle?.bundleSize || 0;
	const bundleSizeFormatted = formatFileSize( bundleSize );

	setStatusMessage(
		sprintf(
			/* translators: %s: File size */
			__( 'Uploading blueprint bundle (%s)…', 'aether-site-exporter' ),
			bundleSizeFormatted
		),
		'progress',
		`uploadBlueprintBundle-${ providerId }`
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
		filePath: bundlePathToUse,
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

	// Update progress to 100%
	if ( setStepProgress ) {
		setStepProgress( `uploadBlueprintBundle-${ providerId }`, 100 );
	}

	setStatusMessage(
		sprintf(
			/* translators: %s: File size */
			__( 'Uploaded blueprint bundle (%s)', 'aether-site-exporter' ),
			bundleSizeFormatted
		),
		'success',
		`uploadBlueprintBundle-${ providerId }`
	);

	return {
		success: true,
		providerId,
		exportPath,
	};
}

/**
 * Upload Blueprint Bundle step definition.
 */
export const uploadBlueprintBundleStep = {
	id: 'uploadBlueprintBundle',
	label: __( 'Upload Blueprint Bundle', 'aether-site-exporter' ),
	description: __(
		'Upload blueprint-bundle.zip to providers',
		'aether-site-exporter'
	),
	supportsProgress: true,
	globalCache: false,
	dependencies: [ 'createBlueprintBundle' ],
	provides: [],
	handler,
};
