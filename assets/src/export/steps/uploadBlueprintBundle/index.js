/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { formatFileSize } from '@aether/utils/helpers';
import {
	createFileContext,
	FILE_TYPES,
	uploadFile,
} from '@aether/export/utils/unifiedFileUpload';
import { processBatch } from '@aether/export/utils/batchProcessor';

/**
 * Upload blueprint bundle step handler
 *
 * @param {Object}   context                          - Execution context
 * @param {Array}    context.blueprintBundleProviders - Providers for blueprint bundle
 * @param {Object}   context.blueprintBundle          - Bundle data from createBlueprintBundle
 * @param {string}   context.siteUrl                  - WordPress site URL
 * @param {Function} context.setStatusMessage         - Status message updater
 * @param {Function} context.setStepProgress          - Step progress updater
 * @return {Promise<Object>} Step result
 */
async function handler( context ) {
	const {
		blueprintBundleProviders = [],
		blueprintBundle,
		siteUrl,
		setStatusMessage,
		setStepProgress,
	} = context;

	const providers = blueprintBundleProviders;

	if ( providers.length === 0 ) {
		setStatusMessage(
			__( 'No providers enabled for blueprint bundle', 'aether' ),
			'warning',
			'uploadBlueprintBundle'
		);
		return { skipped: true, reason: 'no_providers' };
	}

	const bundleSize = blueprintBundle?.bundleSize || 0;
	const bundleSizeFormatted = formatFileSize( bundleSize );

	setStatusMessage(
		sprintf(
			/* translators: %1$s: File size, %2$d: Number of providers */
			_n(
				'Uploading blueprint bundle (%1$s) to %2$d provider…',
				'Uploading blueprint bundle (%1$s) to %2$d providers…',
				providers.length,
				'aether'
			),
			bundleSizeFormatted,
			providers.length
		),
		'progress',
		'uploadBlueprintBundle'
	);

	// Upload to providers with controlled parallelism
	// Note: For blueprint bundles, we upload one file to multiple providers
	// The batch size controls how many providers we upload to simultaneously
	const uploadResults = await processBatch(
		providers,
		async ( providerIdItem ) => {
			try {
				// Fetch provider config to get export_path and maxSimultaneousUploads
				let exportPath = 'blueprint-bundle/bundle.zip';
				try {
					const providerResponse = await apiFetch( {
						path: `/aether/site-exporter/providers/${ providerIdItem }/config`,
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
					providerId: providerIdItem,
					metadata: {
						...context,
						siteUrl,
						exportPath,
					},
				} );

				// Upload file using unified upload system
				// This fires aether.file.upload action which providers hook into
				await uploadFile( fileContext );

				return {
					status: 'fulfilled',
					value: {
						providerId: providerIdItem,
						success: true,
						exportPath,
					},
				};
			} catch ( error ) {
				return {
					status: 'rejected',
					reason: error,
					providerId: providerIdItem,
					error: error?.message || __( 'Unknown error', 'aether' ),
				};
			}
		},
		10, // Default batch size: 10 providers at a time
		( batchInfo ) => {
			// Update progress after each batch
			if ( setStepProgress ) {
				const progress = Math.round(
					( batchInfo.itemsProcessed / batchInfo.totalItems ) * 100
				);
				setStepProgress( 'uploadBlueprintBundle', progress );
			}
		}
	);

	// Count successes and failures
	const successCount = uploadResults.filter(
		( r ) => r.status === 'fulfilled'
	).length;
	const failureCount = uploadResults.filter(
		( r ) => r.status === 'rejected'
	).length;

	// Report results
	if ( successCount > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %1$s: File size, %2$d: Success count, %3$d: Total providers */
				_n(
					'Uploaded blueprint bundle (%1$s) to %2$d/%3$d provider',
					'Uploaded blueprint bundle (%1$s) to %2$d/%3$d providers',
					providers.length,
					'aether'
				),
				bundleSizeFormatted,
				successCount,
				providers.length
			),
			failureCount > 0 ? 'warning' : 'success',
			'uploadBlueprintBundle'
		);
	}

	if ( successCount === 0 ) {
		throw new Error(
			__( 'Failed to upload blueprint bundle to any provider', 'aether' )
		);
	}

	return {
		bundleUploadResults: {
			providers,
			results: uploadResults.map( ( r ) =>
				r.status === 'fulfilled' ? r.value : r.reason
			),
			successCount,
			failureCount,
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
		blueprintBundleProviders: {
			from: 'initial',
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
