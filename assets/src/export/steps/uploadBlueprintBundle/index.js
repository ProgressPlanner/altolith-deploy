/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 * Uses the StorageService adapter pattern for provider instance isolation.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
import { formatFileSize } from '../../utils/helpers';
import {
	createStorageService,
	fetchProviderConfig,
	buildStorageConfig,
} from '../../utils/staticSiteConfig';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

/**
 * Status labels for the step
 * Don't show provider-specific info - per-provider progress is shown in provider pills
 */
const statusLabels = {
	pending: __( 'Upload blueprint', 'aether-site-exporter' ),
	running: () => __( 'Uploading blueprint…', 'aether-site-exporter' ),
	complete: () => __( 'Blueprint uploaded', 'aether-site-exporter' ),
};

/**
 * Check if step should be skipped for this provider
 *
 * Uses the StepExecutor's native skip mechanism to avoid running
 * the handler for providers that don't support blueprint bundles.
 *
 * @param {Object} context - Execution context
 * @return {boolean} True if step should be skipped
 */
function shouldSkip( context ) {
	const { currentProviderInstance } = context;

	if ( ! currentProviderInstance ) {
		return false; // Let handler throw the proper error
	}

	const providerType = currentProviderInstance.id?.split( ':' )[ 0 ];
	const ProviderClass = providerType
		? ProviderRegistry.get( providerType )
		: null;
	const providerDeploymentType =
		currentProviderInstance.deploymentType ||
		ProviderClass?.DEPLOYMENT_TYPE;

	// Skip if provider doesn't handle blueprint bundles
	return providerDeploymentType !== 'blueprint_bundle';
}

/**
 * Upload blueprint bundle step handler
 *
 * Processes a single provider instance (thread context).
 * Called once per provider by ThreadOrchestrator.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Object}   context.blueprintBundle         - Bundle data from createBlueprintBundle
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.setStatusMessage        - Status message updater
 * @param {Function} context.setStepProgress         - Step progress updater
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
			__(
				'Provider instance not found in thread context',
				'aether-site-exporter'
			)
		);
	}

	const providerId = currentProviderInstance.id;
	const providerLabel =
		currentProviderInstance.label || currentProviderInstance.id;

	const bundleSize = blueprintBundle?.bundleSize || 0;
	const bundleSizeFormatted = formatFileSize( bundleSize );

	// Initial progress update with statusData for dynamic label
	if ( setStepProgress ) {
		setStepProgress( 'uploadBlueprintBundle', {
			current: 0,
			total: 1,
			statusData: {
				bundleSizeFormatted,
				providerLabel,
			},
		} );
	}

	setStatusMessage(
		sprintf(
			/* translators: %1$s: Provider label, %2$s: File size */
			__(
				'Uploading blueprint bundle (%2$s) to %1$s…',
				'aether-site-exporter'
			),
			providerLabel,
			bundleSizeFormatted
		),
		'progress',
		'uploadBlueprintBundle'
	);

	// Fetch provider config to get export_path
	const providerConfig = await fetchProviderConfig( providerId );
	const exportPath =
		providerConfig.export_path || 'blueprint-bundle/bundle.zip';

	// Build storage config and create storage service
	const storageConfig = buildStorageConfig( siteUrl, siteUrl, providerId );
	const storageService = await createStorageService(
		exportPath,
		storageConfig,
		providerId,
		providerConfig
	);

	if ( ! storageService ) {
		throw new Error(
			sprintf(
				/* translators: %s: Provider label */
				__(
					'Storage service not available for %s',
					'aether-site-exporter'
				),
				providerLabel
			)
		);
	}

	// For blueprint bundles, we need to pass the source URL via metadata
	// since the actual file is on the server and needs to be fetched
	const dummyBlob = new Blob( [], { type: 'application/zip' } );
	const uploadResult = await storageService.upload( exportPath, dummyBlob, {
		contentType: 'application/zip',
		sourcePath: blueprintBundle.bundlePath,
		sourceUrl: blueprintBundle.bundleUrl, // URL for fetching the file
		filePath: blueprintBundle.bundlePath,
		metadata: {
			siteUrl,
			exportPath,
		},
	} );

	if ( ! uploadResult.success ) {
		throw new Error(
			uploadResult.error ||
				__(
					'Failed to upload blueprint bundle',
					'aether-site-exporter'
				)
		);
	}

	// Final progress update with statusData for dynamic label
	if ( setStepProgress ) {
		setStepProgress( 'uploadBlueprintBundle', {
			current: 1,
			total: 1,
			statusData: {
				bundleSizeFormatted,
				providerLabel,
			},
		} );
	}

	// Report success
	setStatusMessage(
		sprintf(
			/* translators: %1$s: Provider label, %2$s: File size */
			__(
				'Uploaded blueprint bundle (%2$s) to %1$s',
				'aether-site-exporter'
			),
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
	label: __( 'Upload Blueprint Bundle', 'aether-site-exporter' ),
	description: __(
		'Upload blueprint-bundle.zip to providers',
		'aether-site-exporter'
	),
	deploymentType: 'blueprint_bundle',
	supportsProgress: true,
	dependencies: [ 'createBlueprintBundle' ],
	skip: shouldSkip,
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
	statusLabels,
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
