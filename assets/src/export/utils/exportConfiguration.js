/**
 * Export Configuration Utilities
 *
 * Pure functions for preparing export workflow configuration.
 * These functions are extracted from useExportController for testability.
 *
 */

import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

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
 * Get provider instances for a specific deployment type
 *
 * Filters provider configurations to find instances
 * that support the specified deployment type based on their provider type.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<string>} Array of instance IDs
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

				// Check if provider type supports this deployment type
				const providerType = instanceConfig.provider_type;
				if ( ! providerType ) {
					return false;
				}

				// Get provider class from registry and check if it supports the deployment type
				const ProviderClass = ProviderRegistry.get( providerType );
				if ( ! ProviderClass ) {
					return false;
				}

				const supportsType =
					ProviderClass.DEPLOYMENT_TYPE === deploymentType;

				return supportsType;
			} )
			.map( ( [ id ] ) => id );
	} catch ( error ) {
		return [];
	}
}

/**
 * Validate a provider instance configuration
 *
 * Checks that the instance has required properties and valid configuration.
 *
 * @param {string} instanceId - Instance ID
 * @param {Object} config     - Instance configuration
 * @return {boolean} True if instance is valid
 */
function isValidProviderInstance( instanceId, config ) {
	// Must have non-empty ID
	if ( ! instanceId || typeof instanceId !== 'string' ) {
		return false;
	}

	// Must have config object
	if ( ! config || typeof config !== 'object' ) {
		return false;
	}

	// Must have provider_type
	if ( ! config.provider_type ) {
		return false;
	}

	return true;
}

/**
 * Build provider instance objects from configurations
 *
 * Creates array of provider instances with full config for threading.
 * Each instance has id, label, and complete configuration.
 * Validates each instance to ensure it's properly configured.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<Object>} Valid provider instance objects with { id, label, config }
 */
export function buildProviderInstances( providerConfigs, deploymentType ) {
	const instanceIds = getEnabledInstancesForDeploymentType(
		providerConfigs,
		deploymentType
	);

	return (
		instanceIds
			// Map to instance objects
			.map( ( instanceId ) => {
				const config = providerConfigs[ instanceId ] || {};
				return {
					id: instanceId,
					label: config.label || instanceId,
					config,
				};
			} )
			// Validate and filter out invalid instances
			.filter( ( instance ) =>
				isValidProviderInstance( instance.id, instance.config )
			)
	);
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
		staticSiteProviderInstances,
		blueprintBundleProviderInstances,
		edgeFunctionProviderInstances,
	} = config;

	const {
		api,
		processStaticSiteUrls,
		generateBlueprintJson,
		updateStaticSiteProgressContext,
		assetManager,
		setStatusMessage,
		setStepProgress,
		setProviderProgress,
	} = dependencies;

	return {
		// API and state
		api,
		siteUrl,

		// Provider arrays by deployment type (from PHP registry via REST API)
		staticSiteProviders,
		blueprintBundleProviders,
		edgeFunctionProviders,

		// Provider instance arrays for threading (with full config objects)
		staticSiteProviderInstances,
		blueprintBundleProviderInstances,
		edgeFunctionProviderInstances,

		// Provider instance references (for thread context)
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
		setProviderProgress,

		// Discovered assets (populated during workflow)
		discoveredAssets: null,
	};
}
