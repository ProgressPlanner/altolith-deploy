/**
 * Static Site Configuration Utilities
 *
 * Pure functions for building static site generator configuration.
 *
 */

import { applyFilters } from '@wordpress/hooks';

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
		// Success if we uploaded files - asset failures shouldn't fail the entire export
		success: filesUploaded > 0,
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
		// CRITICAL: Always use the exact provider ID passed in
		// Do NOT do provider discovery - this breaks multi-instance threading
		// where each thread needs its OWN provider instance config
		if ( ! staticSiteProviderId ) {
			throw new Error(
				'Provider ID is required for fetchProviderConfig. ' +
					'Provider discovery should not be used in threaded contexts.'
			);
		}

		// Use ConfigStorage to load provider config (handles caching and REST API)
		const { ConfigStorage } = await import(
			'../../providers/utils/configStorage'
		);
		const storage = new ConfigStorage( staticSiteProviderId );
		providerConfig = await storage.load();
	} catch ( error ) {
		// Re-throw to make failures visible instead of silently using wrong config
		throw error;
	}

	return providerConfig;
}

/**
 * Create and configure storage service.
 *
 * Uses the StorageService adapter pattern for provider instance isolation.
 * Each provider type registers a filter on 'altolith.storage.service.create' to
 * inject its own StorageService with a provider-specific upload adapter.
 *
 * @param {string} staticPath     Static files path.
 * @param {Object} config         Storage configuration.
 * @param {string} providerId     Provider ID (full instance ID with UUID).
 * @param {Object} providerConfig Provider configuration (already loaded).
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
		'altolith.storage.service.config',
		config,
		staticPath,
		providerId,
		providerConfig
	);

	// Allow filter to override storage service creation
	// Pass providerConfig as 5th parameter so providers can use it
	// (WordPress filters are synchronous, so config must be pre-loaded)
	let storageService = applyFilters(
		'altolith.storage.service.create',
		null,
		staticPath,
		filteredConfig,
		providerId,
		providerConfig
	);

	// Create default if not overridden
	if ( ! storageService ) {
		const { StorageService } = await import(
			'../../providers/services/storageService'
		);
		storageService = new StorageService( staticPath, filteredConfig );
	}

	return storageService;
}
