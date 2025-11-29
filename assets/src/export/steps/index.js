/**
 * Step Registry
 *
 * Steps register themselves dynamically via WordPress hooks.
 * This file triggers step registration and provides helper functions.
 *
 * @since 1.0.0
 */

import { doAction } from '@wordpress/hooks';
import StepRegistry from '../registry/StepRegistry';
import { getEnabledOutputTypes } from '@altolith/utils/outputTypes';

// Import step files to ensure they register themselves
import './discoverAndScanSite';
import './prepareBlueprint';
import './gatherFilesToDeploy';
import './deploy';

/**
 * Get all registered steps
 *
 * Triggers step registration via hooks and returns collected steps.
 *
 * @return {Array<Object>} Array of step definitions
 */
export function getRegisteredSteps() {
	const registry = StepRegistry.getInstance();

	// Clear previous registrations (for re-initialization)
	registry.clear();

	// Trigger registration hook - steps self-register
	doAction( 'altolith.export.register_steps', registry );

	return registry.getSteps();
}

/**
 * Get steps filtered by enabled output types for UI display
 *
 * Filters steps based on enabled output types from global settings.
 * Steps with a deploymentType are shown only if that output type is enabled.
 * Steps without a deploymentType are shown if ANY output type is enabled.
 *
 * This function doesn't require provider context, so it can be called early
 * in the export flow for UI initialization.
 *
 * @return {Array<Object>} Filtered steps based on enabled output types
 */
export function getStepsForUI() {
	const enabledOutputTypes = getEnabledOutputTypes();
	const steps = getRegisteredSteps();

	// Filter steps by enabled output types and hidden property
	const filteredSteps = steps.filter( ( step ) => {
		// Hide steps marked as hidden (internal orchestration steps)
		if ( step.hidden === true ) {
			return false;
		}
		// Steps with deploymentType: show only if that output type is enabled
		if ( step.deploymentType ) {
			return enabledOutputTypes.includes( step.deploymentType );
		}
		// Steps without deploymentType: show if ANY output type is enabled
		return enabledOutputTypes.length > 0;
	} );

	return filteredSteps;
}

/**
 * Get steps filtered by available providers
 *
 * Uses providerInstancesByType map to filter steps based on their deploymentType.
 * Steps are skipped when no provider instances exist for their deployment type.
 * Also filters by enabled output types from global settings.
 *
 * @param {Object} context                         - Execution context
 * @param {Object} context.providerInstancesByType - Map of deployment type to provider instances
 * @return {Array<Object>} Filtered steps based on available provider instances and enabled output types
 */
export function getActiveSteps( context ) {
	const { providerInstancesByType = {} } = context;
	const enabledOutputTypes = getEnabledOutputTypes();

	const steps = getRegisteredSteps();

	// Filter out steps when no provider instances exist for their deployment type
	// AND filter by enabled output types
	const filteredSteps = steps.filter( ( step ) => {
		// First check: enabled output types
		if ( step.deploymentType ) {
			// Step has deploymentType: must be enabled in global settings
			if ( ! enabledOutputTypes.includes( step.deploymentType ) ) {
				return false;
			}
			// Also check provider instances
			const instances =
				providerInstancesByType[ step.deploymentType ] || [];
			return instances.length > 0;
		}
		// Step without deploymentType: show if ANY output type is enabled
		// and if there are any provider instances configured
		if ( enabledOutputTypes.length === 0 ) {
			return false;
		}
		// Check if there are any provider instances for any enabled output type
		const hasProviderInstances = enabledOutputTypes.some( ( type ) => {
			const instances = providerInstancesByType[ type ] || [];
			return instances.length > 0;
		} );
		return hasProviderInstances;
	} );

	return filteredSteps;
}
