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
 * Get steps filtered by available providers
 *
 * Uses providerInstancesByType map to filter steps based on their deploymentType.
 * Steps are skipped when no provider instances exist for their deployment type.
 *
 * @param {Object} context                         - Execution context
 * @param {Object} context.providerInstancesByType - Map of deployment type to provider instances
 * @return {Array<Object>} Filtered steps based on available provider instances
 */
export function getActiveSteps( context ) {
	const { providerInstancesByType = {} } = context;

	const steps = getRegisteredSteps();

	// Filter out steps when no provider instances exist for their deployment type
	const filteredSteps = steps.filter( ( step ) => {
		if ( step.deploymentType ) {
			const instances =
				providerInstancesByType[ step.deploymentType ] || [];
			return instances.length > 0;
		}
		return true;
	} );

	return filteredSteps;
}
