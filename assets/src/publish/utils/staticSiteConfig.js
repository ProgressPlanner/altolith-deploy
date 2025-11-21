/**
 * Static Site Configuration Utilities
 *
 * Pure functions for building static site generator configuration.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import { debug } from '../../utils/debug';
import apiFetch from '../../utils/api';

/**
 * Build storage configuration object.
 *
 * @param {string} siteUrl       WordPress site URL.
 * @param {string} staticSiteUrl Target static site URL.
 * @param {string} providerId    Provider ID.
 * @return {Object} Storage configuration.
 */
export function buildStorageConfig( siteUrl, staticSiteUrl, providerId ) {
	return {
		public_url: siteUrl,
		base_url: staticSiteUrl || siteUrl,
		provider_id: providerId,
	};
}

/**
 * Calculate total files to upload from pre-scan results.
 *
 * @param {number} cachedHtmlCount Number of HTML files cached.
 * @param {number} uniqueAssets    Number of unique assets.
 * @return {number} Total files to upload.
 */
export function calculateTotalFiles( cachedHtmlCount, uniqueAssets ) {
	return cachedHtmlCount + uniqueAssets;
}

/**
 * Build the final result object from upload phase.
 *
 * @param {Object} failures           Failure tracking object.
 * @param {Object} assetTracker       Asset tracker instance.
 * @param {number} filesUploaded      Number of files uploaded.
 * @param {number} filesSkipped       Number of files skipped.
 * @param {number} totalFilesToUpload Total files to upload.
 * @param {Array}  uploadedFiles      Array of uploaded file info.
 * @param {number} totalUrls          Total URLs processed.
 * @return {Object} Result object.
 */
export function buildUploadResult(
	failures,
	assetTracker,
	filesUploaded,
	filesSkipped,
	totalFilesToUpload,
	uploadedFiles,
	totalUrls
) {
	return {
		success: failures.urlsFailed === 0,
		urlsProcessed: totalUrls,
		urlsSucceeded: failures.urlsSucceeded,
		urlsFailed: failures.urlsFailed,
		assetsUploaded: assetTracker.getCount(),
		assetsFailed: failures.assetsFailed,
		failedUrls: failures.failedUrls,
		uploadedFiles,
		filesUploaded,
		filesSkipped,
		totalFilesToUpload,
	};
}

/**
 * Create initial failure tracking object.
 *
 * @return {Object} Failure tracking object.
 */
export function createFailureTracker() {
	return {
		urlsFailed: 0,
		urlsSucceeded: 0,
		assetsFailed: 0,
		failedUrls: [],
	};
}

/**
 * Fetch provider configuration from REST API.
 *
 * @param {string} staticSiteProviderId Provider ID from parameter.
 * @return {Promise<Object>} Provider configuration object.
 */
export async function fetchProviderConfig( staticSiteProviderId ) {
	let providerConfig = {};

	try {
		// Dynamic import to avoid circular dependencies
		const providerDiscovery = await import(
			'../../providers/utils/providerDiscovery'
		);
		const discoveredProviderId =
			await providerDiscovery.getProviderForDeploymentType(
				'static_site'
			);

		const providerIdToUse = staticSiteProviderId || discoveredProviderId;

		if ( providerIdToUse ) {
			const configResponse = await apiFetch( {
				path: `/aether/site-exporter/providers/${ providerIdToUse }`,
			} );
			if ( configResponse.success && configResponse.config ) {
				providerConfig = configResponse.config;
			}
		}
	} catch ( error ) {
		debug( 'Failed to load provider configuration:', error );
	}

	return providerConfig;
}

/**
 * Create and configure storage service.
 *
 * @param {string} staticPath     Static files path.
 * @param {Object} config         Storage configuration.
 * @param {string} providerId     Provider ID.
 * @param {Object} providerConfig Provider configuration.
 * @return {Promise<Object>} Storage service instance.
 */
export async function createStorageService(
	staticPath,
	config,
	providerId,
	providerConfig
) {
	// Filter configuration
	const filteredConfig = applyFilters(
		'aether.storage.service.config',
		config,
		staticPath,
		providerId,
		providerConfig
	);

	// Allow filter to override storage service creation
	let storageService = applyFilters(
		'aether.storage.service.create',
		null,
		staticPath,
		filteredConfig,
		providerId
	);

	// Create default if not overridden
	if ( ! storageService ) {
		const { StorageService } = await import(
			'../../providers/services/storageService'
		);
		storageService = new StorageService( staticPath, '', filteredConfig );
	}

	return storageService;
}
