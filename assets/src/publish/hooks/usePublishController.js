/**
 * Publish Controller Hook
 *
 * Orchestrates the publish workflow using phase-based execution
 *
 * @package
 */

import { useCallback, useState, useRef } from '@wordpress/element';
import { usePublishAPI } from './usePublishAPI';
import { useAssetManager } from './useAssetManager';
import { useStaticSiteGenerator } from './useStaticSiteGenerator';
import { useBlueprintGenerator } from './useBlueprintGenerator';
import apiFetch from '../../utils/api';
import { calculateOverallProgress } from '../utils/progressManager';
import { debug, debugError } from '../../utils/debug';
import { DEPLOYMENT_TYPES } from '../../constants/deploymentTypes';
import { executeSteps } from '../executor';
import { getActiveSteps, getRegisteredSteps } from '../steps';
import {
	preparePublishConfiguration,
	determineProvidersByDeploymentType,
	buildWorkflowContext,
} from '../utils/publishConfiguration';

export function usePublishController( publishState ) {
	const {
		setIsPublishing,
		updateFromStep,
		markAllComplete,
		showError,
		initializeSteps,
		setStatusMessage,
		setOverallProgressValue,
		setStepProgress,
		removeMessage,
		setProviders,
	} = publishState;

	// State for storage provider ID (set before starting publish)
	// Must be declared before hooks that use it
	const [ setStorageProviderId ] = useState( '' );

	const api = usePublishAPI();
	const assetManager = useAssetManager();

	// Create blueprint generator hook.
	const { generateBlueprint: generateBlueprintJson } =
		useBlueprintGenerator();

	// Provider context for progress tracking across multiple providers
	// This allows the progress callback to adjust progress based on the current provider index
	const staticSiteProgressContext = useRef( {
		providerIndex: 0,
		totalProviders: 1,
	} );

	// Function to update static site progress context
	// This allows the step handler to set the current provider index before processing
	const updateStaticSiteProgressContext = useCallback(
		( providerIndex, totalProviders ) => {
			staticSiteProgressContext.current = {
				providerIndex,
				totalProviders,
			};
		},
		[]
	);

	// Create static site generator with progress callback
	const processStaticSiteUrls = useStaticSiteGenerator(
		( uploadedFiles, totalFiles ) => {
			if ( totalFiles > 0 && uploadedFiles >= 0 ) {
				// Get current provider context
				const { providerIndex, totalProviders } =
					staticSiteProgressContext.current;

				// Current provider's progress (0-100)
				const currentProviderProgress = Math.min(
					100,
					Math.max(
						0,
						Math.round( ( uploadedFiles / totalFiles ) * 100 )
					)
				);

				// Calculate step progress accounting for multiple providers
				// Progress formula: (providerIndex * 100 + currentProviderProgress) / totalProviders
				let stepProgress = currentProviderProgress;
				if ( totalProviders > 1 ) {
					stepProgress = Math.min(
						100,
						Math.round(
							( providerIndex * 100 + currentProviderProgress ) /
								totalProviders
						)
					);
				}

				const overallProgress = calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: stepProgress,
				} );
				setOverallProgressValue( overallProgress );
				setStepProgress( 'uploadStaticSiteFiles', stepProgress );
			}
		}
	);

	const startPublish = useCallback( async () => {
		try {
			debug( 'startPublish called' );

			// Initialize steps with 'discoverBlueprintBundleAssets' as the active step
			// This sets up steps array, active step, and lastStepIndex correctly
			initializeSteps(
				getRegisteredSteps(),
				'discoverBlueprintBundleAssets'
			);
			// Set isPublishing to true to start the workflow
			setIsPublishing( true );
			debug( 'Steps initialized, starting publish workflow' );

			// Fetch settings to get storage provider ID before starting
			const settingsResponse = await apiFetch( {
				path: '/aether/site-exporter/settings',
			} );

			// Use pure function to extract configuration
			const publishConfig =
				preparePublishConfiguration( settingsResponse );

			// Update storage provider ID state
			if ( settingsResponse.success && publishConfig.storageProviderId ) {
				setStorageProviderId( publishConfig.storageProviderId );
			}

			// Fetch asset status
			try {
				const assetStatusResponse = await api.getAssetStatus();
				if (
					assetStatusResponse.success &&
					assetStatusResponse.assets
				) {
					assetManager.syncWithServer( assetStatusResponse.assets );
				}
			} catch ( assetError ) {
				// Asset status fetch is not critical - log and continue
				debugError( 'Failed to fetch asset status:', assetError );
			}

			// STATELESS WORKFLOW EXECUTION
			// No job tracking - React owns all state, PHP provides stateless endpoints

			// Activate the first step immediately to update UI
			updateFromStep( 'discoverBlueprintBundleAssets' );

			// Get current site URL for static site generation (use pure function)
			const siteUrl = window.location.origin;

			// Get arrays of instance IDs for each deployment type (use pure function)
			const providersByType = determineProvidersByDeploymentType(
				publishConfig.providerConfigs,
				[
					DEPLOYMENT_TYPES.STATIC_SITE,
					DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE,
					DEPLOYMENT_TYPES.EDGE_FUNCTIONS,
				]
			);

			const staticSiteProviders =
				providersByType[ DEPLOYMENT_TYPES.STATIC_SITE ];
			const blueprintBundleProviders =
				providersByType[ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ];
			const edgeFunctionProviders =
				providersByType[ DEPLOYMENT_TYPES.EDGE_FUNCTIONS ];

			debug( '[Workflow] Providers by deployment type:', {
				staticSite: staticSiteProviders,
				blueprintBundle: blueprintBundleProviders,
				edgeFunctions: edgeFunctionProviders,
			} );

			// Store provider arrays in global state for UI access
			setProviders( staticSiteProviders, blueprintBundleProviders );

			// Build context object with all dependencies for step handlers (use pure function)
			const workflowContext = buildWorkflowContext(
				{
					siteUrl,
					staticSiteProviders,
					blueprintBundleProviders,
					edgeFunctionProviders,
				},
				{
					api,
					processStaticSiteUrls,
					generateBlueprintJson,
					updateStaticSiteProgressContext,
					assetManager,
					setStatusMessage,
					setStepProgress,
				}
			);

			// Add additional UI callbacks not in pure function (to avoid coupling)
			workflowContext.setOverallProgressValue = setOverallProgressValue;
			workflowContext.removeMessage = removeMessage;

			// Execute full workflow - individual steps check provider deployment_types

			// Set up workflow lifecycle callbacks for UI updates
			const workflowOptions = {
				onStepStart: ( stepId ) => {
					debug( `[Workflow] Step starting: ${ stepId }` );
					// Update UI with step ID
					updateFromStep( stepId );
				},
				onStepComplete: ( stepId, result ) => {
					debug( `[Workflow] Step completed: ${ stepId }`, result );
				},
				onStepSkipped: ( stepId ) => {
					debug( `[Workflow] Step skipped: ${ stepId }` );
				},
				onError: ( stepId, error ) => {
					debugError( `[Workflow] Step error: ${ stepId }`, error );
				},
			};

			// Get steps filtered by enabled providers
			const activeSteps = getActiveSteps( workflowContext );

			// Execute steps using flat executor with dependency resolution
			await executeSteps( activeSteps, workflowContext, workflowOptions );

			debug( '[Workflow] All steps completed successfully' );

			// Clear asset upload tracking flags (reset state for next publish)
			assetManager.clearUploadFlags();

			// Update UI to show all steps as complete with success message
			markAllComplete( { status: 'complete' } );

			// Release publishing lock (allows user to start new publish)
			setIsPublishing( false );
		} catch ( error ) {
			debugError( 'Publish failed:', error );
			showError( `Failed to start: ${ error.message }` );
			setIsPublishing( false );
		}
	}, [
		setIsPublishing,
		api,
		assetManager,
		showError,
		initializeSteps,
		setStorageProviderId,
		updateFromStep,
		updateStaticSiteProgressContext,
		processStaticSiteUrls,
		generateBlueprintJson,
		setStatusMessage,
		setStepProgress,
		removeMessage,
		setOverallProgressValue,
		setProviders,
		markAllComplete,
	] );

	return {
		startPublish,
	};
}
