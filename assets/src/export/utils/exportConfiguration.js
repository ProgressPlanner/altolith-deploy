/**
 * Export Configuration Utilities
 *
 * Pure functions for preparing export workflow configuration.
 * These functions are extracted from useExportController for testability.
 *
 */

import ProviderRegistry from '@altolith/providers/registry/ProviderRegistry';
import {
	getEnabledOutputTypes,
	getOutputTypes,
} from '@altolith/utils/outputTypes';

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
 * Get provider instances that have a specific output type enabled.
 *
 * In the new architecture, providers are generic storage backends.
 * Output types (static_site, blueprint, etc.) are enabled per-instance via config toggles.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} outputType      - Output type to filter by (e.g., 'static_site', 'blueprint')
 * @return {Array<string>} Array of instance IDs that have this output type enabled
 */
export function getInstancesForOutputType( providerConfigs, outputType ) {
	try {
		if ( ! providerConfigs || typeof providerConfigs !== 'object' ) {
			return [];
		}

		return Object.entries( providerConfigs )
			.filter( ( [ , instanceConfig ] ) => {
				if ( ! instanceConfig || typeof instanceConfig !== 'object' ) {
					return false;
				}

				// Check if provider type is registered
				const providerType = instanceConfig.provider_type;
				if ( ! providerType ) {
					return false;
				}

				const ProviderClass = ProviderRegistry.get( providerType );
				if ( ! ProviderClass ) {
					return false;
				}

				// Check if this output type is enabled in instance config
				const enabledTypes = getEnabledOutputTypes( instanceConfig );
				return enabledTypes.includes( outputType );
			} )
			.map( ( [ id ] ) => id );
	} catch ( error ) {
		return [];
	}
}

/**
 * Get provider instances for a specific deployment type (legacy compatibility).
 *
 * @deprecated Use getInstancesForOutputType instead.
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<string>} Array of instance IDs
 */
export function getInstancesForDeploymentType(
	providerConfigs,
	deploymentType
) {
	// Map legacy deployment types to output types
	const outputTypeMapping = {
		static_site: 'static_site',
		blueprint_bundle: 'blueprint',
	};

	const outputType = outputTypeMapping[ deploymentType ] || deploymentType;
	return getInstancesForOutputType( providerConfigs, outputType );
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
 * Build provider instance objects from configurations for a specific output type.
 *
 * Creates array of provider instances with full config for threading.
 * Each instance has id, label, and complete configuration.
 * Validates each instance to ensure it's properly configured.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} outputType      - Output type to filter by (e.g., 'static_site', 'blueprint')
 * @return {Array<Object>} Valid provider instance objects with { id, label, config }
 */
export function buildProviderInstancesForOutputType(
	providerConfigs,
	outputType
) {
	const instanceIds = getInstancesForOutputType(
		providerConfigs,
		outputType
	);

	return (
		instanceIds
			// Map to instance objects
			.map( ( instanceId ) => {
				const config = providerConfigs[ instanceId ] || {};
				return {
					id: instanceId,
					label: config.instance_name || config.label || instanceId,
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
 * Build provider instance objects from configurations (legacy compatibility).
 *
 * @deprecated Use buildProviderInstancesForOutputType instead.
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<Object>} Valid provider instance objects with { id, label, config }
 */
export function buildProviderInstances( providerConfigs, deploymentType ) {
	// Map legacy deployment types to output types
	const outputTypeMapping = {
		static_site: 'static_site',
		blueprint_bundle: 'blueprint',
	};

	const outputType = outputTypeMapping[ deploymentType ] || deploymentType;
	return buildProviderInstancesForOutputType( providerConfigs, outputType );
}

/**
 * Determine providers for all output types.
 *
 * Pure function that takes provider configs and returns
 * arrays of instance IDs for each output type.
 * Automatically gets output types from filterable registry.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @return {Object} Object with arrays of instance IDs keyed by output type
 */
export function determineProvidersByOutputType( providerConfigs ) {
	const outputTypes = getOutputTypes();
	const result = {};

	outputTypes.forEach( ( outputType ) => {
		const instances = getInstancesForOutputType(
			providerConfigs,
			outputType.id
		);
		result[ outputType.id ] = instances;
	} );

	return result;
}

/**
 * Determine providers for all deployment types (legacy compatibility).
 *
 * @deprecated Use determineProvidersByOutputType instead.
 * @param {Object} providerConfigs - All provider configurations
 * @return {Object} Object with arrays of instance IDs keyed by deployment type
 */
export function determineProvidersByDeploymentType( providerConfigs ) {
	return determineProvidersByOutputType( providerConfigs );
}

/**
 * Build provider instances by output type.
 *
 * Creates a map of output type to provider instance arrays.
 * Used for step filtering and context building.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @return {Object} Object with arrays of provider instances keyed by output type
 */
export function buildProviderInstancesByOutputType( providerConfigs ) {
	const outputTypes = getOutputTypes();
	const result = {};

	outputTypes.forEach( ( outputType ) => {
		result[ outputType.id ] = buildProviderInstancesForOutputType(
			providerConfigs,
			outputType.id
		);
	} );

	return result;
}

/**
 * Build provider instances by deployment type (legacy compatibility).
 *
 * @deprecated Use buildProviderInstancesByOutputType instead.
 * @param {Object} providerConfigs - All provider configurations
 * @return {Object} Object with arrays of provider instances keyed by deployment type
 */
export function buildProviderInstancesByType( providerConfigs ) {
	return buildProviderInstancesByOutputType( providerConfigs );
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
	const { siteUrl, providerInstancesByType } = config;

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

		// Provider instances by deployment type (for step filtering)
		providerInstancesByType,

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
