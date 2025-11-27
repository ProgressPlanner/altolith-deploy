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
import './createWpContentArchive';
import './createBlueprintBundle';
import './uploadBlueprintBundle';
import './uploadStaticFiles';

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
	doAction( 'aether.export.register_steps', registry );

	return registry.getSteps();
}

/**
 * Get steps filtered by which providers are enabled
 *
 * Uses provider INSTANCE arrays (not ID arrays) to ensure validation.
 * This prevents steps from executing when all provider instances are disabled/invalid.
 *
 * @param {Object} context - Execution context with provider instance arrays
 * @return {Array<Object>} Filtered steps based on enabled provider instances
 */
export function getActiveSteps( context ) {
	const {
		staticSiteProviderInstances = [],
		blueprintBundleProviderInstances = [],
	} = context;

	const steps = getRegisteredSteps();

	// Filter out steps that should be skipped based on provider configuration
	const filteredSteps = steps.filter( ( step ) => {
		// If step has a static skip function, check it
		if ( typeof step.shouldSkip === 'function' ) {
			return ! step.shouldSkip( context );
		}

		// Skip blueprint-related steps if no blueprint bundle provider INSTANCES
		if (
			step.id === 'createWpContentArchive' ||
			step.id === 'createBlueprintBundle' ||
			step.id === 'uploadBlueprintBundle'
		) {
			return blueprintBundleProviderInstances.length > 0;
		}

		// Skip static site steps if no static site provider INSTANCES
		if (
			step.id === 'discoverAndScanSite' ||
			step.id === 'uploadStaticFiles'
		) {
			return staticSiteProviderInstances.length > 0;
		}

		return true;
	} );

	return filteredSteps;
}
