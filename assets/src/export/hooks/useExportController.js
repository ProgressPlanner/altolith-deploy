/**
 * Publish Controller Hook
 *
 * Orchestrates the export workflow using phase-based execution
 *
 */

import { useCallback, useState, useRef } from '@wordpress/element';
import { useExportAPI } from './useExportAPI';
import { useAssetManager } from './useAssetManager';
import { useStaticSiteGenerator } from './useStaticSiteGenerator';
import { useBlueprintGenerator } from './useBlueprintGenerator';
import apiFetch from '@aether/utils/api';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';
import { executeThreadedWorkflow } from '@aether/export/executor/ThreadOrchestrator';
import { getActiveSteps, getRegisteredSteps } from '@aether/export/steps';
import {
	prepareExportConfiguration,
	determineProvidersByDeploymentType,
	buildProviderInstances,
	buildWorkflowContext,
} from '@aether/export/utils/exportConfiguration';

export function useExportController( exportState ) {
	const {
		setIsExporting,
		updateFromStep,
		markAllComplete,
		showError,
		initializeSteps,
		setStatusMessage,
		setOverallProgressValue,
		setStepProgress,
		setProviderProgress,
		setProviderInstances,
		removeMessage,
		setProviders,
	} = exportState;

	// State for storage provider ID (set before starting export)
	// Must be declared before hooks that use it
	const [ setStorageProviderId ] = useState( '' );

	const api = useExportAPI();
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

				// Calculate raw numbers accounting for multiple providers
				// For multiple providers, we need to calculate the total across all providers
				// and the current position across all providers
				if ( totalProviders > 1 ) {
					// For multiple providers, each provider processes totalFiles
					// Current position: providerIndex * totalFiles + uploadedFiles
					// Total: totalProviders * totalFiles
					const totalAcrossProviders = totalProviders * totalFiles;
					const currentAcrossProviders =
						providerIndex * totalFiles + uploadedFiles;
					setStepProgress( 'uploadStaticFiles', {
						current: currentAcrossProviders,
						total: totalAcrossProviders,
					} );
				} else {
					// Single provider - use raw numbers directly
					setStepProgress( 'uploadStaticFiles', {
						current: uploadedFiles,
						total: totalFiles,
					} );
				}
			}
		}
	);

	const startExport = useCallback( async () => {
		try {
			// Initialize steps with 'discoverBlueprintBundleAssets' as the active step
			// This sets up steps array, active step, and lastStepIndex correctly
			initializeSteps(
				getRegisteredSteps(),
				'discoverBlueprintBundleAssets'
			);
			// Set isExporting to true to start the workflow
			setIsExporting( true );

			// Fetch settings to get storage provider ID before starting
			const settingsResponse = await apiFetch( {
				path: '/aether/site-exporter/settings',
			} );

			// Use pure function to extract configuration
			const exportConfig = prepareExportConfiguration( settingsResponse );

			// Update storage provider ID state
			if ( settingsResponse.success && exportConfig.storageProviderId ) {
				setStorageProviderId( exportConfig.storageProviderId );
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
			}

			// Activate the first step immediately to update UI
			updateFromStep( 'discoverBlueprintBundleAssets' );

			// Get current site URL for static site generation (use pure function)
			const siteUrl = window.location.origin;

			// Get arrays of instance IDs for each deployment type (use pure function)
			const providersByType = determineProvidersByDeploymentType(
				exportConfig.providerConfigs,
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

			// Build provider instance objects for threading
			const staticSiteProviderInstances = buildProviderInstances(
				exportConfig.providerConfigs,
				DEPLOYMENT_TYPES.STATIC_SITE
			);
			const blueprintBundleProviderInstances = buildProviderInstances(
				exportConfig.providerConfigs,
				DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE
			);
			const edgeFunctionProviderInstances = buildProviderInstances(
				exportConfig.providerConfigs,
				DEPLOYMENT_TYPES.EDGE_FUNCTIONS
			);

			// Store provider arrays in global state for UI access
			setProviders( staticSiteProviders, blueprintBundleProviders );

			// Determine provider instances for threading
			// Use all provider instances across all deployment types
			const allProviderInstances = [
				...staticSiteProviderInstances,
				...blueprintBundleProviderInstances,
				...edgeFunctionProviderInstances,
			];

			// Store provider instances in context for UI access (includes labels)
			setProviderInstances( allProviderInstances );

			// Build context object with all dependencies for step handlers (use pure function)
			const workflowContext = buildWorkflowContext(
				{
					siteUrl,
					staticSiteProviders,
					blueprintBundleProviders,
					edgeFunctionProviders,
					staticSiteProviderInstances,
					blueprintBundleProviderInstances,
					edgeFunctionProviderInstances,
				},
				{
					api,
					processStaticSiteUrls,
					generateBlueprintJson,
					updateStaticSiteProgressContext,
					assetManager,
					setStatusMessage,
					setStepProgress,
					setProviderProgress,
				}
			);

			// Add additional UI callbacks not in pure function (to avoid coupling)
			workflowContext.setOverallProgressValue = setOverallProgressValue;
			workflowContext.removeMessage = removeMessage;

			// Execute full workflow - individual steps check provider type

			// Set up workflow lifecycle callbacks for UI updates
			const workflowOptions = {
				onStepStart: ( stepId ) => {
					// Update UI with step ID
					updateFromStep( stepId );
				},
				onStepComplete: () => {},
				onStepSkipped: () => {},
				onError: () => {},
			};

			// Get steps filtered by enabled providers
			const activeSteps = getActiveSteps( workflowContext );

			// Execute workflow with ThreadOrchestrator (handles 0, 1, or N providers)
			await executeThreadedWorkflow(
				activeSteps,
				workflowContext,
				allProviderInstances,
				workflowOptions
			);

			// Clear asset upload tracking flags (reset state for next export)
			assetManager.clearUploadFlags();

			// Update UI to show all steps as complete with success message
			markAllComplete( { status: 'complete' } );

			// Release exporting lock (allows user to start new export)
			setIsExporting( false );
		} catch ( error ) {
			showError( `Failed to start: ${ error.message }` );
			setIsExporting( false );
		}
	}, [
		setIsExporting,
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
		setProviderProgress,
		setProviderInstances,
		removeMessage,
		setOverallProgressValue,
		setProviders,
		markAllComplete,
	] );

	return {
		startExport,
	};
}
