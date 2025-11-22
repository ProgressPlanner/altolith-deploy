/**
 * Step Registry
 *
 * Flat step definitions with explicit dependencies for the export workflow.
 * Steps are executed in parallel when their dependencies are satisfied.
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import { discoverBlueprintBundleAssetsStep } from './discoverBlueprintBundleAssets';
import { getStaticSiteUrlsStep } from './getStaticSiteUrls';
import { preScanStaticSiteStep } from './preScanStaticSite';
import { createWpContentArchiveStep } from './createWpContentArchive';
import { createBlueprintBundleStep } from './createBlueprintBundle';
import { uploadBlueprintBundleStep } from './uploadBlueprintBundle';
import { uploadStaticFilesStep } from './uploadStaticFiles';

/**
 * Get all registered steps.
 *
 * Steps are filtered through hooks to allow extension.
 *
 * @return {Array<Object>} Array of step definitions.
 */
export function getRegisteredSteps() {
	const steps = [
		discoverBlueprintBundleAssetsStep,
		getStaticSiteUrlsStep,
		preScanStaticSiteStep,
		createWpContentArchiveStep,
		createBlueprintBundleStep,
		uploadBlueprintBundleStep,
		uploadStaticFilesStep,
	];

	/**
	 * Filter registered steps.
	 *
	 * Allows plugins to add, remove, or modify steps.
	 *
	 * @param {Array<Object>} steps Array of step definitions.
	 */
	return applyFilters( 'aether.export.steps', steps );
}

/**
 * Get steps filtered by which providers are enabled.
 *
 * @param {Object} context Execution context with provider arrays.
 * @return {Array<Object>} Filtered steps based on enabled providers.
 */
export function getActiveSteps( context ) {
	const { staticSiteProviders = [], blueprintBundleProviders = [] } = context;

	const steps = getRegisteredSteps();

	// Filter out steps that should be skipped based on provider configuration
	return steps.filter( ( step ) => {
		// If step has a static skip function, check it
		if ( typeof step.shouldSkip === 'function' ) {
			return ! step.shouldSkip( context );
		}

		// Skip blueprint-related steps if no blueprint bundle providers
		if (
			step.id === 'discoverBlueprintBundleAssets' ||
			step.id === 'createWpContentArchive' ||
			step.id === 'createBlueprintBundle' ||
			step.id === 'uploadBlueprintBundle'
		) {
			return blueprintBundleProviders.length > 0;
		}

		// Skip static site steps if no static site providers
		if (
			step.id === 'preScanStaticSite' ||
			step.id === 'uploadStaticFiles'
		) {
			return staticSiteProviders.length > 0;
		}

		return true;
	} );
}
