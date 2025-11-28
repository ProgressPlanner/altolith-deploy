/**
 * Unified Upload Step
 *
 * Handles uploading both static files and blueprint bundles based on
 * provider output type configuration (enable_static_site, enable_blueprint).
 *
 * This unified step replaces the separate uploadStaticFiles and uploadBlueprintBundle steps.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { fetchProviderConfig } from '@altolith/export/utils/staticSiteConfig';
import {
	createStorageService,
	buildStorageConfig,
} from '../../utils/staticSiteConfig';
import { getEnabledOutputTypes } from '@altolith/utils/outputTypes';

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Upload files', 'altolith-deploy' ),
	running: () => __( 'Uploading files…', 'altolith-deploy' ),
	complete: () => __( 'Files uploaded', 'altolith-deploy' ),
};

/**
 * Check if step should be skipped for this provider
 *
 * Skip if no output types are enabled for this provider instance.
 *
 * @param {Object} context - Execution context
 * @return {boolean} True if step should be skipped
 */
function shouldSkip( context ) {
	const { currentProviderInstance } = context;

	if ( ! currentProviderInstance ) {
		return false; // Let handler throw the proper error
	}

	// Check which output types are enabled for this provider instance
	const instanceConfig = currentProviderInstance.config || {};
	const enabledOutputTypes = getEnabledOutputTypes( instanceConfig );

	// Skip if no output types are enabled
	return enabledOutputTypes.length === 0;
}

/**
 * Upload static files for a provider
 *
 * @param {Object} context        - Execution context
 * @param {Object} providerConfig - Provider configuration
 * @return {Promise<Object>} Upload result
 */
async function uploadStaticFiles( context, providerConfig ) {
	const {
		currentProviderInstance,
		urls,
		htmlDataMap,
		staticSiteUrl,
		siteUrl,
		processStaticSiteUrls,
		setStatusMessage,
		updateStaticSiteProgressContext,
	} = context;

	// blueprintData is optional
	const blueprintData = context.blueprintData || null;

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	// Use provider-specific public_url if available
	let providerSpecificStaticSiteUrl = staticSiteUrl;
	if ( providerConfig.public_url ) {
		providerSpecificStaticSiteUrl = providerConfig.public_url;
	}

	setStatusMessage(
		sprintf(
			/* translators: %s: Provider label */
			__( 'Processing static site for %s…', 'altolith-deploy' ),
			providerLabel
		),
		'progress',
		'upload'
	);

	// Filter URLs before processing
	const filteredUrls = applyFilters(
		'altolith.export.step.upload.staticFiles.urls',
		urls,
		[ providerId ],
		{
			siteUrl,
			blueprintData,
			staticSiteUrl: providerSpecificStaticSiteUrl,
			providerId,
		}
	);

	// Update progress context with current provider ID
	if ( updateStaticSiteProgressContext ) {
		updateStaticSiteProgressContext( 0, 1, providerId );
	}

	// Process URLs for this provider instance
	const result = await processStaticSiteUrls(
		filteredUrls,
		providerSpecificStaticSiteUrl,
		providerId,
		siteUrl,
		setStatusMessage,
		htmlDataMap
	);

	const filesUploaded = result.filesUploaded || 0;
	const success = result.success && filesUploaded > 0;

	if ( ! success ) {
		const errorMessage =
			result.error || __( 'No files uploaded', 'altolith-deploy' );
		throw new Error(
			sprintf(
				/* translators: %1$s: Provider label, %2$s: Error message */
				__(
					'Failed to upload static files to %1$s: %2$s',
					'altolith-deploy'
				),
				providerLabel,
				errorMessage
			)
		);
	}

	return {
		success: true,
		filesUploaded: result.filesUploaded || 0,
		filesSkipped: result.filesSkipped || 0,
		urlsProcessed: result.urlsProcessed || 0,
		urlsSucceeded: result.urlsSucceeded || 0,
		urlsFailed: result.urlsFailed || 0,
		assetsUploaded: result.assetsUploaded || 0,
		assetsFailed: result.assetsFailed || 0,
		failedUrls: result.failedUrls || [],
		uploadedFiles: result.uploadedFiles || [],
	};
}

/**
 * Upload individual blueprint files for a provider
 *
 * Uploads:
 * - blueprint.json (serialized from blueprintData)
 * - wp-content.zip (core content)
 * - plugins/{slug}.zip (for each custom plugin)
 * - themes/{slug}.zip (for each custom theme)
 *
 * @param {Object} context        - Execution context
 * @param {Object} providerConfig - Provider configuration
 * @return {Promise<Object>} Upload result
 */
async function uploadBlueprintFiles( context, providerConfig ) {
	const {
		currentProviderInstance,
		blueprintData,
		coreContentZipPath,
		pluginZips,
		themeZips,
		blueprintSubfolder: contextSubfolder,
		siteUrl,
		setStatusMessage,
	} = context;

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	// Get subfolder from provider config, falling back to context subfolder or default
	const subfolder =
		providerConfig.blueprint_subfolder || contextSubfolder || 'playground';

	setStatusMessage(
		sprintf(
			/* translators: %s: Provider label */
			__( 'Uploading blueprint files to %s…', 'altolith-deploy' ),
			providerLabel
		),
		'progress',
		'upload'
	);

	// Build storage config and create storage service
	const storageConfig = buildStorageConfig( siteUrl, siteUrl, providerId );
	const storageService = await createStorageService(
		`${ subfolder }/blueprint.json`,
		storageConfig,
		providerId,
		providerConfig
	);

	if ( ! storageService ) {
		throw new Error(
			sprintf(
				/* translators: %s: Provider label */
				__( 'Storage service not available for %s', 'altolith-deploy' ),
				providerLabel
			)
		);
	}

	const uploadedFiles = [];
	let totalSize = 0;

	// 1. Upload wp-content.zip
	if ( coreContentZipPath ) {
		const wpContentPath = `${ subfolder }/wp-content.zip`;
		setStatusMessage(
			sprintf(
				/* translators: %s: Provider label */
				__( 'Uploading wp-content.zip to %s…', 'altolith-deploy' ),
				providerLabel
			),
			'progress',
			'upload'
		);

		const dummyBlob = new Blob( [], { type: 'application/zip' } );
		const result = await storageService.upload( wpContentPath, dummyBlob, {
			contentType: 'application/zip',
			sourcePath: coreContentZipPath,
			filePath: coreContentZipPath,
			metadata: { siteUrl },
		} );

		if ( ! result.success ) {
			throw new Error(
				result.error ||
					__( 'Failed to upload wp-content.zip', 'altolith-deploy' )
			);
		}

		uploadedFiles.push( wpContentPath );
		totalSize += result.size || 0;
	}

	// 2. Upload plugin zips
	if ( pluginZips && Object.keys( pluginZips ).length > 0 ) {
		for ( const [ slug, zipPath ] of Object.entries( pluginZips ) ) {
			const pluginPath = `${ subfolder }/plugins/${ slug }.zip`;
			setStatusMessage(
				sprintf(
					/* translators: %1$s: Plugin slug, %2$s: Provider label */
					__( 'Uploading plugin %1$s to %2$s…', 'altolith-deploy' ),
					slug,
					providerLabel
				),
				'progress',
				'upload'
			);

			const dummyBlob = new Blob( [], { type: 'application/zip' } );
			const result = await storageService.upload( pluginPath, dummyBlob, {
				contentType: 'application/zip',
				sourcePath: zipPath,
				filePath: zipPath,
				metadata: { siteUrl, slug },
			} );

			if ( ! result.success ) {
				// Log warning but continue - one plugin failure shouldn't stop everything
				// eslint-disable-next-line no-console
				console.warn(
					`Failed to upload plugin ${ slug }:`,
					result.error
				);
			} else {
				uploadedFiles.push( pluginPath );
				totalSize += result.size || 0;
			}
		}
	}

	// 3. Upload theme zips
	if ( themeZips && Object.keys( themeZips ).length > 0 ) {
		for ( const [ slug, zipPath ] of Object.entries( themeZips ) ) {
			const themePath = `${ subfolder }/themes/${ slug }.zip`;
			setStatusMessage(
				sprintf(
					/* translators: %1$s: Theme slug, %2$s: Provider label */
					__( 'Uploading theme %1$s to %2$s…', 'altolith-deploy' ),
					slug,
					providerLabel
				),
				'progress',
				'upload'
			);

			const dummyBlob = new Blob( [], { type: 'application/zip' } );
			const result = await storageService.upload( themePath, dummyBlob, {
				contentType: 'application/zip',
				sourcePath: zipPath,
				filePath: zipPath,
				metadata: { siteUrl, slug },
			} );

			if ( ! result.success ) {
				// Log warning but continue
				// eslint-disable-next-line no-console
				console.warn(
					`Failed to upload theme ${ slug }:`,
					result.error
				);
			} else {
				uploadedFiles.push( themePath );
				totalSize += result.size || 0;
			}
		}
	}

	// 4. Upload blueprint.json
	if ( blueprintData ) {
		const blueprintPath = `${ subfolder }/blueprint.json`;
		setStatusMessage(
			sprintf(
				/* translators: %s: Provider label */
				__( 'Uploading blueprint.json to %s…', 'altolith-deploy' ),
				providerLabel
			),
			'progress',
			'upload'
		);

		// Serialize blueprint data to JSON
		const blueprintJson = JSON.stringify( blueprintData, null, 2 );
		const blueprintBlob = new Blob( [ blueprintJson ], {
			type: 'application/json',
		} );

		const result = await storageService.upload(
			blueprintPath,
			blueprintBlob,
			{
				contentType: 'application/json',
				metadata: { siteUrl },
			}
		);

		if ( ! result.success ) {
			throw new Error(
				result.error ||
					__( 'Failed to upload blueprint.json', 'altolith-deploy' )
			);
		}

		uploadedFiles.push( blueprintPath );
		totalSize += blueprintJson.length;
	}

	return {
		success: true,
		subfolder,
		uploadedFiles,
		totalSize,
		filesUploaded: uploadedFiles.length,
	};
}

/**
 * Unified upload step handler
 *
 * Processes a single provider instance (thread context).
 * Uploads static files and/or individual blueprint files based on output type config.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Array}    context.urls                    - URLs from discoverAndScanSite
 * @param {Object}   context.htmlDataMap             - HTML data from discoverAndScanSite
 * @param {string}   context.staticSiteUrl           - Static site URL
 * @param {Object}   context.blueprintData           - Blueprint JSON data from createBlueprintBundle
 * @param {string}   context.coreContentZipPath      - Path to wp-content.zip
 * @param {Object}   context.pluginZips              - Plugin slug to zip path map
 * @param {Object}   context.themeZips               - Theme slug to zip path map
 * @param {string}   context.blueprintSubfolder      - Subfolder for blueprint files
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.processStaticSiteUrls   - Static site generator function
 * @param {Function} context.setStatusMessage        - Status message updater
 * @param {Function} context.setStepProgress         - Step progress updater
 * @return {Promise<Object>} Step result with uploaded files
 */
async function handler( context ) {
	const {
		currentProviderInstance,
		urls,
		blueprintData,
		setStatusMessage,
		setStepProgress,
	} = context;

	if ( ! currentProviderInstance ) {
		throw new Error(
			__(
				'Provider instance not found in thread context',
				'altolith-deploy'
			)
		);
	}

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	// Get enabled output types for this provider
	const instanceConfig = currentProviderInstance.config || {};
	const enabledOutputTypes = getEnabledOutputTypes( instanceConfig );

	const willUploadStatic = enabledOutputTypes.includes( 'static_site' );
	const willUploadBlueprint = enabledOutputTypes.includes( 'blueprint' );

	// Calculate total tasks for progress
	let totalTasks = 0;
	if ( willUploadStatic ) {
		totalTasks++;
	}
	if ( willUploadBlueprint ) {
		totalTasks++;
	}

	// Initial progress update
	if ( setStepProgress ) {
		setStepProgress( 'upload', {
			current: 0,
			total: totalTasks,
			statusData: { providerLabel },
		} );
	}

	// Fetch provider config once
	const providerConfig = await fetchProviderConfig( providerId );

	const results = {
		providerId,
		providerLabel,
		staticUploadResults: null,
		blueprintUploadResults: null,
	};

	let completedTasks = 0;

	// Upload static files if enabled
	if ( willUploadStatic ) {
		if ( ! urls || ! Array.isArray( urls ) ) {
			throw new Error(
				__(
					'URLs not found. Please run discoverAndScanSite first.',
					'altolith-deploy'
				)
			);
		}

		results.staticUploadResults = await uploadStaticFiles(
			context,
			providerConfig
		);
		completedTasks++;

		if ( setStepProgress ) {
			setStepProgress( 'upload', {
				current: completedTasks,
				total: totalTasks,
				statusData: { providerLabel },
			} );
		}

		setStatusMessage(
			sprintf(
				/* translators: %1$s: Provider label, %2$d: Files uploaded */
				__( 'Uploaded %2$d static files to %1$s', 'altolith-deploy' ),
				providerLabel,
				results.staticUploadResults.filesUploaded
			),
			'success',
			'upload'
		);
	}

	// Upload individual blueprint files if enabled
	if ( willUploadBlueprint ) {
		if ( ! blueprintData ) {
			throw new Error(
				__(
					'Blueprint data not found. Please run createBlueprintBundle first.',
					'altolith-deploy'
				)
			);
		}

		results.blueprintUploadResults = await uploadBlueprintFiles(
			context,
			providerConfig
		);
		completedTasks++;

		if ( setStepProgress ) {
			setStepProgress( 'upload', {
				current: completedTasks,
				total: totalTasks,
				statusData: { providerLabel },
			} );
		}

		setStatusMessage(
			sprintf(
				/* translators: %1$d: Number of files, %2$s: Provider label */
				__(
					'Uploaded %1$d blueprint files to %2$s',
					'altolith-deploy'
				),
				results.blueprintUploadResults.filesUploaded,
				providerLabel
			),
			'success',
			'upload'
		);
	}

	// Final success message
	const uploadedTypes = [];
	if ( willUploadStatic ) {
		uploadedTypes.push( __( 'static files', 'altolith-deploy' ) );
	}
	if ( willUploadBlueprint ) {
		uploadedTypes.push( __( 'blueprint', 'altolith-deploy' ) );
	}

	setStatusMessage(
		sprintf(
			/* translators: %1$s: Upload types, %2$s: Provider label */
			__( 'Uploaded %1$s to %2$s', 'altolith-deploy' ),
			uploadedTypes.join( __( ' and ', 'altolith-deploy' ) ),
			providerLabel
		),
		'success',
		'upload'
	);

	return applyFilters( 'altolith.export.step.upload.result', {
		uploadResults: results,
	} );
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'upload',
	label: __( 'Upload Files', 'altolith-deploy' ),
	description: __(
		'Upload static files and blueprint bundles to providers',
		'altolith-deploy'
	),
	supportsProgress: true,
	dependencies: [ 'discoverAndScanSite', 'createBlueprintBundle' ],
	skip: shouldSkip,
	requires: {
		currentProviderInstance: {
			from: 'thread',
			required: true,
		},
		urls: {
			from: 'discoverAndScanSite',
			required: false, // Only required if static_site is enabled
		},
		htmlDataMap: {
			from: 'discoverAndScanSite',
			required: false,
		},
		staticSiteUrl: {
			from: 'discoverAndScanSite',
			required: false,
		},
		// Individual blueprint file paths (not a bundle)
		blueprintData: {
			from: 'createBlueprintBundle',
			required: false, // Only required if blueprint is enabled
		},
		coreContentZipPath: {
			from: 'createBlueprintBundle',
			required: false,
		},
		pluginZips: {
			from: 'createBlueprintBundle',
			required: false,
		},
		themeZips: {
			from: 'createBlueprintBundle',
			required: false,
		},
		blueprintSubfolder: {
			from: 'createBlueprintBundle',
			required: false,
		},
		siteUrl: {
			from: 'initial',
			required: true,
		},
		processStaticSiteUrls: {
			from: 'initial',
			required: false, // Only required if static_site is enabled
		},
		setStatusMessage: {
			from: 'initial',
			required: true,
		},
		setStepProgress: {
			from: 'initial',
			required: false,
		},
		updateStaticSiteProgressContext: {
			from: 'initial',
			required: false,
		},
	},
	provides: {
		uploadResults: {
			type: 'object',
			scope: 'thread',
		},
	},
	statusLabels,
	handler,
};

/**
 * Register step via WordPress hooks
 */
addAction(
	'altolith.export.register_steps',
	'altolith/step-upload',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
