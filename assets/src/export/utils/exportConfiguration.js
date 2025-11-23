/**
 * Export Configuration Utilities
 *
 * Pure functions for preparing export workflow configuration.
 * These functions are extracted from useExportController for testability.
 *
 */

import { debugError } from '@aether/utils/debug';

/**
 * Prepare export configuration from settings response
 *
 * Extracts provider IDs and settings from API response.
 * Pure function - no side effects, easily testable.
 *
 * @param {Object} settingsResponse - Response from settings API
 * @return {Object} Configuration object with provider IDs
 */
export function prepareExportConfiguration( settingsResponse ) {
	const settings = settingsResponse?.settings || {};
	const providerTypes = settings.provider_types || {};

	return {
		storageProviderId: providerTypes.storage || '',
		staticSiteProviderId: providerTypes.static_site || '',
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
	} = dependencies;

	return {
		// API and state
		api,
		siteUrl,

		// Provider arrays by deployment type (from PHP registry via REST API)
		staticSiteProviders,
		blueprintBundleProviders,
		edgeFunctionProviders,

		// Provider instance references (for future parallel execution)
		providerInstances: config.providerInstances || [],
		currentProviderInstance: config.currentProviderInstance || null,

		// Hooks and utilities
		processStaticSiteUrls,
		generateBlueprintJson,
		updateStaticSiteProgressContext,
		assetManager,

		// State setters
		setStatusMessage,
		setStepProgress,

		// Discovered assets (populated during workflow)
		discoveredAssets: null,
	};
}
