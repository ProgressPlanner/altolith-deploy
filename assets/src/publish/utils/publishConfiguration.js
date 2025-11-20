/**
 * Publish Configuration Utilities
 *
 * Pure functions for preparing publish workflow configuration.
 * These functions are extracted from usePublishController for testability.
 *
 * @package
 */

import { debugError } from '../../utils/debug';

/**
 * Prepare publish configuration from settings response
 *
 * Extracts provider IDs and settings from API response.
 * Pure function - no side effects, easily testable.
 *
 * @param {Object} settingsResponse          - Response from settings API
 * @param {string} fallbackStorageProviderId - Fallback provider ID if not in settings
 * @return {Object} Configuration object with provider IDs
 */
export function preparePublishConfiguration(
	settingsResponse,
	fallbackStorageProviderId = ''
) {
	const settings = settingsResponse?.settings || {};
	const providerTypes = settings.provider_types || {};

	return {
		storageProviderId: providerTypes.storage || '',
		staticSiteProviderId: providerTypes.static_site || '',
		// For backwards compatibility, use static site provider or storage provider
		providerId:
			providerTypes.static_site ||
			providerTypes.storage ||
			fallbackStorageProviderId,
		providerConfigs: settings.providers || {},
	};
}

/**
 * Get enabled provider instances for a specific deployment type
 *
 * Filters provider configurations to find enabled instances
 * that support the specified deployment type.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<string>} Array of enabled instance IDs
 */
export function getEnabledInstancesForDeploymentType(
	providerConfigs,
	deploymentType
) {
	try {
		if ( ! providerConfigs || typeof providerConfigs !== 'object' ) {
			return [];
		}

		return Object.entries( providerConfigs )
			.filter( ( [ , instanceConfig ] ) => {
				if ( ! instanceConfig || typeof instanceConfig !== 'object' ) {
					return false;
				}

				// Check if enabled (default to true if not specified)
				const isEnabled = instanceConfig.enabled !== false;

				// Check if supports this deployment type
				const deploymentTypes = instanceConfig.deployment_types || [];
				const supportsType =
					Array.isArray( deploymentTypes ) &&
					deploymentTypes.includes( deploymentType );

				return isEnabled && supportsType;
			} )
			.map( ( [ id ] ) => id );
	} catch ( error ) {
		debugError(
			`Failed to get instances for deployment type ${ deploymentType }:`,
			error
		);
		return [];
	}
}

/**
 * Determine providers for all deployment types
 *
 * Pure function that takes provider configs and returns
 * arrays of instance IDs for each deployment type.
 *
 * @param {Object}        providerConfigs - All provider configurations
 * @param {Array<string>} deploymentTypes - Array of deployment type constants
 * @return {Object} Object with arrays of instance IDs keyed by deployment type
 */
export function determineProvidersByDeploymentType(
	providerConfigs,
	deploymentTypes
) {
	const result = {};

	deploymentTypes.forEach( ( deploymentType ) => {
		const instances = getEnabledInstancesForDeploymentType(
			providerConfigs,
			deploymentType
		);
		result[ deploymentType ] = instances;
	} );

	return result;
}

/**
 * Build workflow context from configuration
 *
 * Pure function that assembles the context object
 * needed for workflow execution.
 *
 * @param {Object} config       - Configuration object
 * @param {Object} dependencies - External dependencies
 * @return {Object} Workflow context
 */
export function buildWorkflowContext( config, dependencies ) {
	const {
		siteUrl,
		providerId,
		staticSiteProviders,
		blueprintBundleProviders,
		edgeFunctionProviders,
	} = config;

	const {
		api,
		processStaticSiteUrls,
		generateBlueprintJson,
		updateStaticSiteProgressContext,
		assetManager,
		setStatusMessage,
		setStepProgress,
		handleSiteArchiveUpload,
	} = dependencies;

	return {
		// API and state
		api,
		siteUrl,
		providerId, // Legacy: single provider ID for backwards compat

		// Provider arrays by deployment type (from PHP registry via REST API)
		staticSiteProviders,
		blueprintBundleProviders,
		edgeFunctionProviders,

		// Hooks and utilities
		processStaticSiteUrls,
		generateBlueprintJson,
		updateStaticSiteProgressContext,
		assetManager,

		// State setters
		setStatusMessage,
		setStepProgress,

		// Upload handlers
		handleSiteArchiveUpload,

		// Discovered assets (populated during workflow)
		discoveredAssets: null,
	};
}
