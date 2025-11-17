/**
 * Publish Workflow Definition
 *
 * Defines the complete publish workflow as a series of sequential phases.
 * Each phase can contain one or more steps that run in parallel.
 *
 * Structure: [[[stepId, progressWeight], ...], ...]
 * - Outer array = sequential phases (run one after another)
 * - Inner array = parallel steps within phase (run simultaneously)
 * - Each step = [stepId, progressWeight] where weight is percentage of total progress
 *
 * Example:
 * [
 *   [['step1', 10]],              // Phase 1: step1 alone (10%)
 *   [['step2', 3]],               // Phase 2: step2 alone (3%)
 *   [['step3', 20], ['step4', 14]], // Phase 3: step3 and step4 in PARALLEL (34% total)
 * ]
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';
import { discoverAssetsHandler } from '../steps/discoverAssetsStep';
import { getStaticSiteUrlsHandler } from '../steps/getStaticSiteUrlsStep';
import { generateBlueprintHandler } from '../steps/generateBlueprintStep';
import { createSiteArchiveHandler } from '../steps/createSiteArchiveStep';
import { uploadStaticSiteFilesHandler } from '../steps/uploadStaticSiteFilesStep';
import { uploadSiteArchiveHandler } from '../steps/uploadSiteArchiveStep';

/**
 * Publish workflow definition.
 *
 * Current workflow is entirely sequential (one step per phase).
 * Future optimization: Move independent steps into same phase for parallel execution.
 *
 * Total progress must equal 100%.
 * Note: Removed offloadMedia step (10%) - redistributed to other steps.
 *
 * IMPORTANT: generateBlueprint must run AFTER createSiteArchive because it needs
 * the archive result (zipPath) to generate the blueprint-bundle.zip.
 */
export const PUBLISH_WORKFLOW = [
	[ [ 'discoverAssets', 5 ] ],
	[ [ 'getStaticSiteUrls', 8 ] ],
	[ [ 'createSiteArchive', 20 ] ],
	[ [ 'generateBlueprint', 1 ] ],
	[
		[ 'uploadStaticSiteFiles', 50 ],
		[ 'uploadSiteArchive', 16 ],
	],
];

/**
 * Map step IDs to handler functions.
 *
 * Each handler is an async function that returns a Promise.
 * Handlers receive a context object with all necessary dependencies.
 *
 * Handler signature:
 * async function handler(context): Promise<Object>
 *
 * Context includes:
 * - api: PublishAPI instance
 * - jobId: Current job ID
 * - currentStatus: Current job status
 * - providerId: Storage provider ID
 * - setStatusMessage: Function to update UI status
 * - setOverallProgressValue: Function to update progress bar
 * - setStepProgress: Function to update step progress
 * - ... (other dependencies as needed)
 *
 * Return value:
 * - Object with step-specific data to merge into job status
 * - Or throw Error on failure
 */
export const STEP_HANDLERS = {
	discoverAssets: discoverAssetsHandler,
	getStaticSiteUrls: getStaticSiteUrlsHandler,
	generateBlueprint: generateBlueprintHandler,
	createSiteArchive: createSiteArchiveHandler,
	uploadStaticSiteFiles: uploadStaticSiteFilesHandler,
	uploadSiteArchive: uploadSiteArchiveHandler,
};

/**
 * Get workflow with filters applied.
 *
 * Allows third-party code to modify the workflow steps via filters.
 *
 * @return {Array} Workflow with filters applied.
 */
export function getWorkflow() {
	/**
	 * Filter the publish workflow steps.
	 *
	 * Allows providers to add, remove, or modify workflow steps.
	 *
	 * @param {Array} workflow The workflow definition.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('aether.publish.workflow.steps', 'my-provider', (workflow) => {
	 *   // Add custom step at the end
	 *   return [...workflow, [['myCustomStep', 5]]];
	 * });
	 */
	return applyFilters( 'aether.publish.workflow.steps', PUBLISH_WORKFLOW );
}

/**
 * Validate workflow definition.
 *
 * Ensures:
 * - All step IDs have handlers
 * - Progress weights sum to 100%
 * - No duplicate step IDs
 *
 * @return {Object} Validation result { isValid, errors }
 */
export function validateWorkflow() {
	const errors = [];

	// Flatten workflow to get all steps
	const allSteps = PUBLISH_WORKFLOW.flat( 2 ).filter(
		( item ) => typeof item === 'string'
	);

	// Check for missing handlers
	allSteps.forEach( ( stepId, index ) => {
		if ( index % 2 === 0 && ! STEP_HANDLERS[ stepId ] ) {
			errors.push( `Missing handler for step: ${ stepId }` );
		}
	} );

	// Calculate total progress
	let totalProgress = 0;
	PUBLISH_WORKFLOW.forEach( ( phase ) => {
		phase.forEach( ( [ , weight ] ) => {
			totalProgress += weight;
		} );
	} );

	if ( totalProgress !== 100 ) {
		errors.push(
			`Progress weights must sum to 100%, got ${ totalProgress }%`
		);
	}

	// Check for duplicate step IDs
	const stepIds = [];
	PUBLISH_WORKFLOW.forEach( ( phase ) => {
		phase.forEach( ( [ stepId ] ) => {
			if ( stepIds.includes( stepId ) ) {
				errors.push( `Duplicate step ID: ${ stepId }` );
			}
			stepIds.push( stepId );
		} );
	} );

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Get step progress weight by step ID.
 *
 * @param {string} stepId Step identifier.
 * @return {number} Progress weight (0-100) or 0 if not found.
 */
export function getStepWeight( stepId ) {
	for ( const phase of PUBLISH_WORKFLOW ) {
		for ( const [ id, weight ] of phase ) {
			if ( id === stepId ) {
				return weight;
			}
		}
	}
	return 0;
}

/**
 * Get cumulative progress up to (but not including) a step.
 *
 * For parallel steps (within same phase), returns progress BEFORE the phase starts.
 * For sequential steps (each in own phase), returns sum of all previous phases.
 *
 * Example:
 * Phase 1: [['stepA', 10]]           -> stepA: cumulative = 0
 * Phase 2: [['stepB', 20], ['stepC', 5]] -> stepB: cumulative = 10, stepC: cumulative = 10 (parallel!)
 * Phase 3: [['stepD', 15]]           -> stepD: cumulative = 35 (10 + 20 + 5)
 *
 * @param {string} stepId Step identifier.
 * @return {number} Cumulative progress (0-100).
 */
export function getCumulativeProgress( stepId ) {
	let cumulative = 0;
	for ( const phase of PUBLISH_WORKFLOW ) {
		// Check if stepId is in this phase
		const stepInPhase = phase.some( ( [ id ] ) => id === stepId );
		if ( stepInPhase ) {
			// Return progress before this phase (all parallel steps start at same point)
			return cumulative;
		}
		// Add all weights from this phase (sum of parallel steps)
		const phaseWeight = phase.reduce(
			( sum, [ , weight ] ) => sum + weight,
			0
		);
		cumulative += phaseWeight;
	}
	return cumulative;
}

/**
 * Filter workflow based on export types configuration.
 *
 * Removes steps that are not needed based on the export_types setting.
 * Redistributes progress weights to maintain 100% total.
 *
 * @param {Array} workflow    The workflow to filter.
 * @param {Array} exportTypes Array of export types ('static_site', 'blueprint_bundle').
 * @return {Array} Filtered workflow with adjusted progress weights.
 */
export function filterWorkflowByExportTypes( workflow, exportTypes = [] ) {
	// Default to both if empty or invalid
	if ( ! Array.isArray( exportTypes ) || exportTypes.length === 0 ) {
		return workflow;
	}

	const includeStaticSite = exportTypes.includes( 'static_site' );
	const includeBlueprintBundle = exportTypes.includes( 'blueprint_bundle' );

	// If both are included, return original workflow
	if ( includeStaticSite && includeBlueprintBundle ) {
		return workflow;
	}

	// Map steps to their export type
	const stepExportTypes = {
		discoverAssets: 'both', // Always needed
		getStaticSiteUrls: 'static_site',
		createSiteArchive: 'blueprint_bundle',
		generateBlueprint: 'blueprint_bundle',
		uploadStaticSiteFiles: 'static_site',
		uploadSiteArchive: 'blueprint_bundle',
	};

	// Filter workflow to remove unwanted steps
	const filteredWorkflow = workflow
		.map( ( phase ) => {
			return phase.filter( ( [ stepId ] ) => {
				const stepType = stepExportTypes[ stepId ];
				if ( stepType === 'both' ) {
					return true;
				}
				if ( stepType === 'static_site' && includeStaticSite ) {
					return true;
				}
				if (
					stepType === 'blueprint_bundle' &&
					includeBlueprintBundle
				) {
					return true;
				}
				return false;
			} );
		} )
		.filter( ( phase ) => phase.length > 0 ); // Remove empty phases

	// Calculate total weight of remaining steps
	let totalWeight = 0;
	filteredWorkflow.forEach( ( phase ) => {
		phase.forEach( ( [ , weight ] ) => {
			totalWeight += weight;
		} );
	} );

	// Redistribute weights to sum to 100%
	if ( totalWeight > 0 && totalWeight !== 100 ) {
		const scaleFactor = 100 / totalWeight;
		return filteredWorkflow.map( ( phase ) => {
			return phase.map( ( [ stepId, weight ] ) => {
				return [ stepId, Math.round( weight * scaleFactor ) ];
			} );
		} );
	}

	return filteredWorkflow;
}
