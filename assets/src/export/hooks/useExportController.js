/**
 * Publish Controller Hook
 *
 * Orchestrates the export workflow using phase-based execution
 * Listens to WordPress hooks for step lifecycle events
 *
 */

import { useCallback, useState, useRef, useEffect } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import { useExportAPI } from './useExportAPI';
import { useAssetManager } from './useAssetManager';
import { useStaticSiteGenerator } from './useStaticSiteGenerator';
import { useBlueprintGenerator } from './useBlueprintGenerator';
import apiFetch from '@aether/utils/api';
import { debug, debugError } from '@aether/utils/debug';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';
import { executeSteps } from '@aether/export/executor';
import { getActiveSteps, getRegisteredSteps } from '@aether/export/steps';
import {
	prepareExportConfiguration,
	determineProvidersByDeploymentType,
	buildWorkflowContext,
} from '@aether/export/utils/exportConfiguration';
import ConfigStorage from '@aether/providers/utils/configStorage';

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

				// Only update step progress - let the progress tracker handle overall progress
				// This prevents progress jumps when this step starts
				setStepProgress( 'uploadStaticFiles', stepProgress );
			}
		}
	);

	// Register WordPress hook listeners for step lifecycle events
	useEffect( () => {
		// Step start handler
		const handleStepStart = ( stepId, providerId ) => {
			debug(
				`[Workflow] Step starting: ${ stepId }${
					providerId ? ` (provider: ${ providerId })` : ''
				}`
			);
			// Update UI with step ID
			updateFromStep( stepId );
		};

		// Step complete handler
		const handleStepComplete = ( stepId, providerId, result ) => {
			debug(
				`[Workflow] Step completed: ${ stepId }${
					providerId ? ` (provider: ${ providerId })` : ''
				}`,
				result
			);
		};

		// Step cached handler
		const handleStepCached = ( stepId, providerId ) => {
			debug(
				`[Workflow] Step using cached result: ${ stepId } (provider: ${ providerId })`
			);
		};

		// Step waiting handler
		const handleStepWaiting = ( stepId, providerId ) => {
			debug(
				`[Workflow] Provider waiting for global step: ${ stepId } (provider: ${ providerId })`
			);
		};

		// Step error handler
		const handleStepError = ( stepId, providerId, error ) => {
			debugError(
				`[Workflow] Step error: ${ stepId }${
					providerId ? ` (provider: ${ providerId })` : ''
				}`,
				error
			);
		};

		// Register all hook listeners
		addAction(
			'aether.step.start',
			'aether/export-controller',
			handleStepStart
		);
		addAction(
			'aether.step.complete',
			'aether/export-controller',
			handleStepComplete
		);
		addAction(
			'aether.step.cached',
			'aether/export-controller',
			handleStepCached
		);
		addAction(
			'aether.step.waiting',
			'aether/export-controller',
			handleStepWaiting
		);
		addAction(
			'aether.step.error',
			'aether/export-controller',
			handleStepError
		);

		// Cleanup: Remove all hook listeners on unmount
		return () => {
			removeAction( 'aether.step.start', 'aether/export-controller' );
			removeAction( 'aether.step.complete', 'aether/export-controller' );
			removeAction( 'aether.step.cached', 'aether/export-controller' );
			removeAction( 'aether.step.waiting', 'aether/export-controller' );
			removeAction( 'aether.step.error', 'aether/export-controller' );
		};
	}, [ updateFromStep ] );

	const startExport = useCallback( async () => {
		try {
			debug( 'startExport called' );

			// Initialize steps with 'discoverBlueprintBundleAssets' as the active step
			// This sets up steps array, active step, and lastStepIndex correctly
			initializeSteps(
				getRegisteredSteps(),
				'discoverBlueprintBundleAssets'
			);
			// Set isExporting to true to start the workflow
			setIsExporting( true );

			// Invalidate all provider config caches to ensure fresh data during export
			try {
				await ConfigStorage.clearAllCaches();
				debug(
					'Invalidated all provider config caches for fresh export data'
				);
			} catch ( cacheError ) {
				// Cache invalidation failure is not critical - log and continue
				debugError(
					'Failed to invalidate provider config caches:',
					cacheError
				);
			}

			debug( 'Steps initialized, starting export workflow' );

			// Fetch settings to get storage provider ID before starting
			let settingsResponse;
			try {
				settingsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings',
				} );
			} catch ( apiError ) {
				debugError( 'Failed to fetch settings:', apiError );
				throw new Error(
					`Unable to load plugin settings: ${
						apiError.message || 'Unknown error'
					}`
				);
			}

			// Validate response structure
			if ( ! settingsResponse || typeof settingsResponse !== 'object' ) {
				throw new Error(
					'Invalid settings response format. Please refresh the page and try again.'
				);
			}

			if ( settingsResponse.success === false ) {
				throw new Error(
					settingsResponse.message ||
						'Failed to retrieve settings. Please check your permissions.'
				);
			}

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
			// Lifecycle events are fired via WordPress hooks (no callbacks needed)

			// Get steps filtered by enabled providers
			const activeSteps = getActiveSteps( workflowContext );

			// Execute steps using flat executor with dependency resolution
			// Hook listeners registered above will handle all lifecycle events
			await executeSteps( activeSteps, workflowContext );

			debug( '[Workflow] All steps completed successfully' );

			// Clear asset upload tracking flags (reset state for next export)
			assetManager.clearUploadFlags();

			// Update UI to show all steps as complete with success message
			markAllComplete( { status: 'complete' } );

			// Release exporting lock (allows user to start new export)
			setIsExporting( false );
		} catch ( error ) {
			debugError( 'Publish failed:', error );
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
		removeMessage,
		setOverallProgressValue,
		setProviders,
		markAllComplete,
	] );

	return {
		startExport,
	};
}
