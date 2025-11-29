/**
 * Deploy Step
 *
 * Handles deploying files to providers based on the filesToDeploy object
 * from the gatherFilesToDeploy step. Supports both static site files
 * and blueprint bundles.
 *
 * This step:
 * 1. Consumes filesToDeploy from gatherFilesToDeploy
 * 2. Replaces {targetUrl} placeholders with provider-specific public_url
 * 3. Uploads files to the provider
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

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Deploy files', 'altolith-deploy' ),
	running: () => __( 'Deploying files\u2026', 'altolith-deploy' ),
	complete: () => __( 'Files deployed', 'altolith-deploy' ),
};

/**
 * Replace {targetUrl} placeholder in content
 *
 * @param {string} content   - Content with {targetUrl} placeholders
 * @param {string} targetUrl - The provider's public URL
 * @return {string} Content with placeholders replaced
 */
function replaceTargetUrlPlaceholder( content, targetUrl ) {
	if ( typeof content !== 'string' ) {
		return content;
	}
	// Apply filter to allow customizing URL replacement
	const replacedContent = applyFilters(
		'altolith.deploy.replaceTargetUrl',
		content.replace( /\{targetUrl\}/g, targetUrl ),
		content,
		targetUrl
	);
	return replacedContent;
}

/**
 * Upload static files from filesToDeploy structure
 *
 * @param {Object} context        - Execution context
 * @param {Object} providerConfig - Provider configuration
 * @param {Object} staticFiles    - Static files from filesToDeploy.staticSite
 * @param {string} targetUrl      - Provider's public URL for URL replacement
 * @return {Promise<Object>} Upload result
 */
async function uploadStaticFilesFromGather(
	context,
	providerConfig,
	staticFiles,
	targetUrl
) {
	const {
		currentProviderInstance,
		htmlDataMap,
		siteUrl,
		processStaticSiteUrls,
		setStatusMessage,
		updateStaticSiteProgressContext,
	} = context;

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	// Extract URLs from static files for processStaticSiteUrls
	const urls = Object.values( staticFiles )
		.filter( ( file ) => file.url )
		.map( ( file ) => file.url );

	// Use provider-specific public_url if available
	const providerSpecificStaticSiteUrl =
		providerConfig.public_url || targetUrl;

	setStatusMessage(
		sprintf(
			/* translators: %s: Provider label */
			__( 'Processing static site for %s\u2026', 'altolith-deploy' ),
			providerLabel
		),
		'progress',
		'deploy'
	);

	// Filter URLs before processing
	const filteredUrls = applyFilters(
		'altolith.deploy.staticFiles.urls',
		urls,
		[ providerId ],
		{
			siteUrl,
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
 * Upload blueprint files from filesToDeploy structure
 *
 * @param {Object} context        - Execution context
 * @param {Object} providerConfig - Provider configuration
 * @param {Object} blueprintFiles - Blueprint files from filesToDeploy.blueprint
 * @param {string} targetUrl      - Provider's public URL for URL replacement
 * @return {Promise<Object>} Upload result
 */
async function uploadBlueprintFilesFromGather(
	context,
	providerConfig,
	blueprintFiles,
	targetUrl
) {
	const {
		currentProviderInstance,
		siteUrl,
		setStatusMessage,
		setStepProgress,
		setProviderProgress,
	} = context;

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	// Calculate total files to upload for progress tracking
	const totalBlueprintFiles = Object.keys( blueprintFiles ).length;

	let uploadedCount = 0;

	// Helper to update progress
	const updateProgress = () => {
		if ( setStepProgress ) {
			setStepProgress( 'deploy', {
				current: uploadedCount,
				total: totalBlueprintFiles,
			} );
		}
		if ( setProviderProgress ) {
			setProviderProgress( providerId, {
				stepId: 'deploy',
				stepLabel: 'Deploy Files',
				progress: {
					current: uploadedCount,
					total: totalBlueprintFiles,
				},
				status: 'active',
			} );
		}
	};

	setStatusMessage(
		sprintf(
			/* translators: %s: Provider label */
			__( 'Uploading blueprint files to %s\u2026', 'altolith-deploy' ),
			providerLabel
		),
		'progress',
		'deploy'
	);

	// Get the blueprint path from provider config, with filter support
	// Default to blueprint_subfolder config field or 'playground' fallback
	const defaultBlueprintPath =
		providerConfig.blueprint_subfolder || 'playground';
	const blueprintPath = applyFilters(
		'altolith.blueprint.path',
		defaultBlueprintPath,
		providerConfig,
		providerId
	);

	// Use provider's base_path as staticPath for storage service
	// For local-filesystem, this is the base directory where files are stored
	const staticPath = providerConfig.base_path || 'static/';
	const storageConfig = buildStorageConfig( siteUrl, siteUrl, providerId );
	const storageService = await createStorageService(
		staticPath,
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

	// Upload each file from blueprintFiles
	for ( const [ relativePath, fileInfo ] of Object.entries(
		blueprintFiles
	) ) {
		const { type, content, sourcePath } = fileInfo;

		// Replace {blueprintPath} placeholder with the actual filtered path
		const finalPath = relativePath.replace(
			/\{blueprintPath\}/g,
			blueprintPath
		);

		setStatusMessage(
			sprintf(
				/* translators: %1$s: File path, %2$s: Provider label */
				__( 'Uploading %1$s to %2$s\u2026', 'altolith-deploy' ),
				finalPath,
				providerLabel
			),
			'progress',
			'deploy'
		);

		let uploadResult;

		if ( type === 'blueprint-json' && content ) {
			// Serialize JSON content with {targetUrl} and {blueprintPath} replacement
			let jsonString = JSON.stringify( content, null, 2 );
			jsonString = replaceTargetUrlPlaceholder( jsonString, targetUrl );
			// Replace {blueprintPath} placeholder with the filtered blueprint path
			jsonString = jsonString.replace( /\{blueprintPath\}/g, blueprintPath );
			const jsonBlob = new Blob( [ jsonString ], {
				type: 'application/json',
			} );

			uploadResult = await storageService.upload(
				finalPath,
				jsonBlob,
				{
					contentType: 'application/json',
					metadata: { siteUrl },
				}
			);

			if ( uploadResult.success ) {
				totalSize += jsonString.length;
			}
		} else if ( sourcePath ) {
			// Upload from source path (zip files)
			const dummyBlob = new Blob( [], { type: 'application/zip' } );
			uploadResult = await storageService.upload(
				finalPath,
				dummyBlob,
				{
					contentType: 'application/zip',
					sourcePath,
					filePath: sourcePath,
					metadata: { siteUrl },
				}
			);

			if ( uploadResult.success ) {
				totalSize += uploadResult.size || 0;
			}
		} else {
			// Skip files without content or sourcePath
			// eslint-disable-next-line no-console
			console.warn(
				`Skipping blueprint file ${ finalPath }: no content or sourcePath`
			);
			continue;
		}

		if ( ! uploadResult.success ) {
			// Log warning but continue - one file failure shouldn't stop everything
			// eslint-disable-next-line no-console
			console.warn(
				`Failed to upload ${ finalPath }:`,
				uploadResult.error
			);
		} else {
			uploadedFiles.push( finalPath );
			uploadedCount++;
			updateProgress();
		}
	}

	return {
		success: true,
		uploadedFiles,
		totalSize,
		filesUploaded: uploadedFiles.length,
	};
}

/**
 * Deploy step handler
 *
 * Processes a single provider instance (thread context).
 * Deploys files from filesToDeploy to the provider.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Object}   context.filesToDeploy           - Files to deploy from gatherFilesToDeploy
 * @param {Object}   context.htmlDataMap             - HTML data from discoverAndScanSite
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.processStaticSiteUrls   - Static site generator function
 * @param {Function} context.setStatusMessage        - Status message updater
 * @param {Function} context.setStepProgress         - Step progress updater
 * @return {Promise<Object>} Step result with uploaded files
 */
async function handler( context ) {
	const {
		currentProviderInstance,
		filesToDeploy,
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

	if ( ! filesToDeploy ) {
		throw new Error(
			__(
				'Files to deploy not found. Please run gatherFilesToDeploy first.',
				'altolith-deploy'
			)
		);
	}

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	// Fetch provider config to get public_url for {targetUrl} replacement
	const providerConfig = await fetchProviderConfig( providerId );
	const targetUrl = providerConfig.public_url || '';

	// Count files in each category
	const staticFiles = filesToDeploy.staticSite || {};
	const blueprintFiles = filesToDeploy.blueprint || {};
	const staticFileCount = Object.keys( staticFiles ).length;
	const blueprintFileCount = Object.keys( blueprintFiles ).length;

	// Calculate total tasks for progress
	let totalTasks = 0;
	if ( staticFileCount > 0 ) {
		totalTasks++;
	}
	if ( blueprintFileCount > 0 ) {
		totalTasks++;
	}

	// Initial progress update
	if ( setStepProgress ) {
		setStepProgress( 'deploy', {
			current: 0,
			total: totalTasks,
			statusData: { providerLabel },
		} );
	}

	const results = {
		providerId,
		providerLabel,
		staticUploadResults: null,
		blueprintUploadResults: null,
		targetUrl,
	};

	let completedTasks = 0;

	// Upload static files if any
	if ( staticFileCount > 0 ) {
		// For static files, use the existing processStaticSiteUrls function
		// but pass in the files from filesToDeploy
		results.staticUploadResults = await uploadStaticFilesFromGather(
			context,
			providerConfig,
			staticFiles,
			targetUrl
		);
		completedTasks++;

		if ( setStepProgress ) {
			setStepProgress( 'deploy', {
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
			'deploy'
		);
	}

	// Upload blueprint files if any
	if ( blueprintFileCount > 0 ) {
		results.blueprintUploadResults = await uploadBlueprintFilesFromGather(
			context,
			providerConfig,
			blueprintFiles,
			targetUrl
		);
		completedTasks++;

		if ( setStepProgress ) {
			setStepProgress( 'deploy', {
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
			'deploy'
		);
	}

	// Final success message
	const uploadedTypes = [];
	if ( staticFileCount > 0 ) {
		uploadedTypes.push( __( 'static files', 'altolith-deploy' ) );
	}
	if ( blueprintFileCount > 0 ) {
		uploadedTypes.push( __( 'blueprint', 'altolith-deploy' ) );
	}

	if ( uploadedTypes.length > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %1$s: Upload types, %2$s: Provider label */
				__( 'Deployed %1$s to %2$s', 'altolith-deploy' ),
				uploadedTypes.join( __( ' and ', 'altolith-deploy' ) ),
				providerLabel
			),
			'success',
			'deploy'
		);
	} else {
		setStatusMessage(
			__( 'No files to deploy', 'altolith-deploy' ),
			'success',
			'deploy'
		);
	}

	return applyFilters( 'altolith.deploy.result', {
		deployResults: results,
	} );
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'deploy',
	label: __( 'Deploy Files', 'altolith-deploy' ),
	description: __(
		'Deploy static files and blueprint bundles to providers',
		'altolith-deploy'
	),
	supportsProgress: true,
	dependencies: [ 'gatherFilesToDeploy' ],
	requires: {
		currentProviderInstance: 'thread',
		filesToDeploy: { from: 'gatherFilesToDeploy' },
		htmlDataMap: { from: 'discoverAndScanSite', optional: true },
		siteUrl: true,
		processStaticSiteUrls: false,
		setStatusMessage: true,
		setStepProgress: false,
		setProviderProgress: false,
		updateStaticSiteProgressContext: false,
	},
	provides: {
		deployResults: {
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
	'altolith/step-deploy',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
