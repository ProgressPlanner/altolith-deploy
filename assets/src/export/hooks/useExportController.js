/**
 * Publish Controller Hook
 *
 * Orchestrates the export workflow using phase-based execution
 *
 */

import {
	useCallback,
	useState,
	useRef,
	useMemo,
	useEffect,
} from '@wordpress/element';
import { useExportAPI } from './useExportAPI';
import { useAssetManager } from './useAssetManager';
import { useStaticSiteGenerator } from './useStaticSiteGenerator';
import { useBlueprintGenerator } from './useBlueprintGenerator';
import apiFetch from '@altolith/utils/api';
import { executeThreadedWorkflow } from '@altolith/export/executor/ThreadOrchestrator';
import {
	getActiveSteps,
	getRegisteredSteps,
	getStepsForUI,
} from '@altolith/export/steps';
import {
	prepareExportConfiguration,
	buildProviderInstancesByOutputType,
	buildWorkflowContext,
} from '@altolith/export/utils/exportConfiguration';
import {
	createProgressEmitter,
	PROGRESS_EVENTS,
} from '@altolith/export/utils/progressEmitter';

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
		setStepStatus,
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

	// Create progress emitter singleton for workflow-wide progress tracking
	const progressEmitter = useMemo( () => createProgressEmitter(), [] );

	// Subscribe UI callbacks to progress emitter events
	useEffect( () => {
		// Step progress handler
		const stepHandler = ( data ) => {
			if ( data.stepId ) {
				setStepProgress( data.stepId, {
					current: data.current,
					total: data.total,
					statusData: data.statusData,
				} );
			}
		};

		// Provider progress handler
		const providerHandler = ( data ) => {
			if ( data.providerId ) {
				setProviderProgress( data.providerId, {
					stepId: data.stepId,
					stepLabel: data.stepLabel,
					progress: data.progress,
					status: data.status,
				} );
			}
		};

		// Status message handler
		const statusHandler = ( data ) => {
			if ( data.message ) {
				setStatusMessage( data.message, data.type, data.key );
			}
		};

		// Subscribe to events
		progressEmitter.on( PROGRESS_EVENTS.STEP, stepHandler );
		progressEmitter.on( PROGRESS_EVENTS.PROVIDER, providerHandler );
		progressEmitter.on( PROGRESS_EVENTS.STATUS, statusHandler );

		// Cleanup on unmount
		return () => {
			progressEmitter.off( PROGRESS_EVENTS.STEP, stepHandler );
			progressEmitter.off( PROGRESS_EVENTS.PROVIDER, providerHandler );
			progressEmitter.off( PROGRESS_EVENTS.STATUS, statusHandler );
		};
	}, [
		progressEmitter,
		setStepProgress,
		setProviderProgress,
		setStatusMessage,
	] );

	// Create blueprint generator hook.
	const { generateBlueprint: generateBlueprintJson } =
		useBlueprintGenerator();

	// Provider context for progress tracking across multiple providers
	// This allows the progress callback to adjust progress based on the current provider index
	const staticSiteProgressContext = useRef( {
		providerIndex: 0,
		totalProviders: 1,
		currentProviderId: null,
	} );

	// Function to update static site progress context
	// This allows the step handler to set the current provider index before processing
	const updateStaticSiteProgressContext = useCallback(
		( providerIndex, totalProviders, currentProviderId = null ) => {
			staticSiteProgressContext.current = {
				providerIndex,
				totalProviders,
				currentProviderId,
			};
		},
		[]
	);

	// Create static site generator with progress callback
	const processStaticSiteUrls = useStaticSiteGenerator(
		( uploadedFiles, totalFiles ) => {
			if ( totalFiles > 0 && uploadedFiles >= 0 ) {
				// Get current provider context
				const { providerIndex, totalProviders, currentProviderId } =
					staticSiteProgressContext.current;

				// Calculate raw numbers accounting for multiple providers
				// For multiple providers, we need to calculate the total across all providers
				// and the current position across all providers
				const progress =
					totalProviders > 1
						? {
								// For multiple providers, each provider processes totalFiles
								// Current position: providerIndex * totalFiles + uploadedFiles
								// Total: totalProviders * totalFiles
								current:
									providerIndex * totalFiles + uploadedFiles,
								total: totalProviders * totalFiles,
						  }
						: {
								// Single provider - use raw numbers directly
								current: uploadedFiles,
								total: totalFiles,
						  };

				// Update step progress (overall progress bar)
				setStepProgress( 'upload', progress );

				// Update provider-specific progress for the progress bars
				// This is critical because processStaticSiteUrls bypasses ThreadOrchestrator's
				// wrapped setStepProgress that normally calls setProviderProgress
				if ( currentProviderId ) {
					setProviderProgress( currentProviderId, {
						stepId: 'upload',
						stepLabel: 'Upload Files',
						progress: {
							current: uploadedFiles,
							total: totalFiles,
						},
						status: 'active',
					} );
				}
			}
		}
	);

	const startExport = useCallback( async () => {
		try {
			// Initialize steps with 'discoverBlueprintBundleAssets' as the active step
			// This sets up steps array, active step, and lastStepIndex correctly
			// Use getStepsForUI() to filter steps by enabled output types from global settings
			initializeSteps(
				getStepsForUI(),
				'discoverBlueprintBundleAssets'
			);
			// Set isExporting to true to start the workflow
			setIsExporting( true );

			// Fetch settings to get storage provider ID before starting
			const settingsResponse = await apiFetch( {
				path: '/altolith/deploy/settings',
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

			// Build provider instances by output type (automatically uses all registered types)
			const providerInstancesByType = buildProviderInstancesByOutputType(
				exportConfig.providerConfigs
			);

			// Flatten all provider instances for threading
			const allProviderInstances = Object.values(
				providerInstancesByType
			).flat();

			// Store provider instances in context for UI access (includes labels)
			setProviderInstances( allProviderInstances );

			// Store provider IDs for UI (backwards compatibility for setProviders)
			const staticSiteProviderIds = (
				providerInstancesByType.static_site || []
			).map( ( p ) => p.id );
			const blueprintBundleProviderIds = (
				providerInstancesByType.blueprint_bundle || []
			).map( ( p ) => p.id );
			setProviders( staticSiteProviderIds, blueprintBundleProviderIds );

			// Build context object with all dependencies for step handlers (use pure function)
			const workflowContext = buildWorkflowContext(
				{
					siteUrl,
					providerInstancesByType,
					providerInstances: allProviderInstances,
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
					progressEmitter,
				}
			);

			// Add additional UI callbacks not in pure function (to avoid coupling)
			workflowContext.setOverallProgressValue = setOverallProgressValue;
			workflowContext.removeMessage = removeMessage;

			// Execute full workflow - individual steps check provider type

			// Set up workflow lifecycle callbacks for UI updates
			const workflowOptions = {
				onStepStart: ( stepId ) => {
					// Update UI with step ID - marks step as active
					updateFromStep( stepId );
				},
				onStepComplete: ( stepId ) => {
					// Mark step as complete when it finishes
					setStepStatus( stepId, 'complete' );
				},
				onStepSkipped: () => {},
				onError: () => {},
			};

			// Get steps filtered by available providers
			const activeSteps = getActiveSteps( workflowContext );

			// Get ALL registered steps for dependency validation.
			// Steps may declare dependencies on steps that are filtered out by
			// deploymentType (e.g., gatherFilesToDeploy depends on discoverAndScanSite).
			// Validation should pass if the step exists in the full registry.
			const allRegisteredSteps = getRegisteredSteps();

			// Execute workflow with ThreadOrchestrator (handles 0, 1, or N providers)
			await executeThreadedWorkflow(
				activeSteps,
				workflowContext,
				allProviderInstances,
				{
					...workflowOptions,
					allSteps: allRegisteredSteps,
				}
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
		setStepStatus,
		setProviderProgress,
		setProviderInstances,
		removeMessage,
		setOverallProgressValue,
		setProviders,
		markAllComplete,
		progressEmitter,
	] );

	return {
		startExport,
	};
}
