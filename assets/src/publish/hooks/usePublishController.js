/**
 * Publish Controller Hook
 *
 * Orchestrates the publish workflow using phase-based execution
 *
 * @package
 */

import { useCallback, useState } from '@wordpress/element';
import { usePublishAPI } from './usePublishAPI';
import { useAssetManager } from './useAssetManager';
import { useStaticSiteGenerator } from './useStaticSiteGenerator';
import { useBlueprintGenerator } from './useBlueprintGenerator';
import { useConfig } from '../../hooks/useConfig';
import { PUBLISH_STEPS } from '../utils/steps';
import apiFetch from '../../utils/api';
import { calculateOverallProgress } from '../utils/progressManager';
import { debug, debugError } from '../../utils/debug';
import { applyFilters } from '@wordpress/hooks';
import { DEPLOYMENT_TYPES } from '../../constants/deploymentTypes';
import {
	PUBLISH_WORKFLOW,
	STEP_HANDLERS,
	filterWorkflowByExportTypes,
} from '../workflows/publishWorkflow';
import { executeWorkflow } from '../workflows/workflowExecutor';

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
	} = publishState;

	// State for storage provider ID (set before starting publish)
	// Must be declared before hooks that use it
	const [ storageProviderId, setStorageProviderId ] = useState( '' );

	const api = usePublishAPI();
	const assetManager = useAssetManager();

	// Get config at hook level (hooks can't be called inside callbacks)
	const config = useConfig();

	// Create blueprint generator hook.
	const { generateBlueprint: generateBlueprintJson } =
		useBlueprintGenerator();

	// Create static site generator with progress callback
	const processStaticSiteUrls = useStaticSiteGenerator(
		( uploadedFiles, totalFiles ) => {
			if ( totalFiles > 0 && uploadedFiles >= 0 ) {
				// Calculate progress percentage based on file count
				const progress = Math.min(
					100,
					Math.max(
						0,
						Math.round( ( uploadedFiles / totalFiles ) * 100 )
					)
				);
				const overallProgress = calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress,
				} );
				setOverallProgressValue( overallProgress );
				setStepProgress( 'uploadStaticSiteFiles', progress );
			}
		}
	);

	// Helper function to upload blueprint-bundle.zip archive file.
	// Detects upload method from provider's upload strategy (git, storage, or direct).
	const handleSiteArchiveUpload = useCallback(
		async ( providerId, context ) => {
			try {
				// Use provider ID passed from executeSteps (avoids redundant settings fetch).
				// Get default provider if none configured
				let fetchedStorageProviderId = providerId;
				if ( ! fetchedStorageProviderId ) {
					const { getDefaultProvider } = await import(
						'../../providers/utils/providerDiscovery'
					);
					fetchedStorageProviderId = await getDefaultProvider();
				}

				// Fetch provider metadata from REST API to check upload strategy
				let providerMetadata = null;
				try {
					const providerResponse = await apiFetch( {
						path: `/aether/site-exporter/providers/${ fetchedStorageProviderId }`,
					} );
					if (
						providerResponse.success &&
						providerResponse.provider
					) {
						providerMetadata = providerResponse.provider;
					}
				} catch ( error ) {
					debugError(
						`[Aether] Failed to fetch provider metadata for ${ fetchedStorageProviderId }:`,
						error
					);
				}

				if ( ! providerMetadata ) {
					throw new Error(
						`Provider not found: ${ fetchedStorageProviderId }`
					);
				}

				// Determine upload strategy from provider type or use hook
				// Git providers have type 'git-hosting', local has type 'local-storage'
				let uploadStrategy = 'storage'; // Default
				if ( providerMetadata.type === 'git-hosting' ) {
					uploadStrategy = 'git';
				} else if ( providerMetadata.type === 'local-storage' ) {
					uploadStrategy = 'direct';
				}

				// Allow providers to override upload strategy via filter
				const filteredStrategy = applyFilters(
					'aether.provider.upload_strategy',
					uploadStrategy,
					fetchedStorageProviderId,
					providerMetadata
				);
				uploadStrategy = filteredStrategy;

				let gitConfig = null;
				if ( uploadStrategy === 'git' ) {
					// For Git-based providers, fetch Git configuration
					gitConfig = await api.getGitConfig().catch( () => null );
				}

				// DECISION POINT: Git vs Storage provider upload.
				// Priority: Git upload takes precedence if configured.
				// Fallback: Storage provider upload via API.
				if (
					uploadStrategy === 'git' &&
					gitConfig &&
					gitConfig.success &&
					gitConfig.config
				) {
					// METHOD 1: Git-based upload
					// Create simple manifest with wp-content.zip for Git upload.
					// eslint-disable-next-line no-unused-vars
					const _manifest = [
						{
							storageKey: 'wp-content.zip',
							contentType: 'application/zip',
						},
					];
					// 					await gitUpload.uploadFiles( manifest, gitConfig );
					// Update progress to 100% for uploadSiteArchive when Git upload completes.
					updateFromStep( 'uploadSiteArchive' );
					setOverallProgressValue(
						calculateOverallProgress( {
							step: 'uploadSiteArchive',
							progress: 100,
						} )
					);
				} else if ( uploadStrategy === 'direct' ) {
					// METHOD 2: Direct provider upload (LocalFilesystem)
					// For 'direct' strategy, we use the provider's uploadFile method
					// This allows the provider to handle the file operation (copy, verify, etc.)

					// Get blueprintBundle data from context (set by generateBlueprint step)
					// Note: The workflow executor merges step results into context
					const blueprintBundlePath =
						context.blueprintBundle?.bundlePath;

					if ( ! blueprintBundlePath ) {
						throw new Error(
							'Blueprint bundle not found. generateBlueprint must run before uploadSiteArchive.'
						);
					}

					debug(
						'Uploading blueprint bundle via provider:',
						blueprintBundlePath
					);

					// Use hook-based upload instead of provider method
					// Get upload handler for this provider via filter
					const uploadHandler = applyFilters(
						'aether.provider.upload',
						null,
						fetchedStorageProviderId,
						{
							filePath: blueprintBundlePath,
							fileName: 'blueprint-bundle.zip',
							context,
						}
					);

					if (
						! uploadHandler ||
						typeof uploadHandler !== 'function'
					) {
						throw new Error(
							`No upload handler registered for provider: ${ fetchedStorageProviderId }`
						);
					}

					// Call the upload handler
					const uploadResult = await uploadHandler(
						blueprintBundlePath,
						'blueprint-bundle.zip',
						context
					);

					if ( ! uploadResult || ! uploadResult.success ) {
						throw new Error(
							uploadResult?.error ||
								'Failed to upload blueprint bundle'
						);
					}

					debug( 'Blueprint bundle upload complete:', uploadResult );

					// Update progress to 100%
					updateFromStep( 'uploadSiteArchive' );
					setOverallProgressValue(
						calculateOverallProgress( {
							step: 'uploadSiteArchive',
							progress: 100,
						} )
					);
					setStepProgress( 'uploadSiteArchive', 100 );
				} else {
					// ERROR: No upload method configured (no provider configured).
					throw new Error( 'No supported upload method available' );
				}

				// Upload complete - control returns to workflow executor.
			} catch ( error ) {
				throw error;
			}
		},
		[
			api,
			updateFromStep,
			// 			gitUpload,
			setOverallProgressValue,
			setStepProgress,
		]
	);

	const startPublish = useCallback( async () => {
		try {
			debug( 'startPublish called' );

			// Initialize steps with 'discoverAssets' as the active step
			// This sets up steps array, active step, and lastStepIndex correctly
			initializeSteps( PUBLISH_STEPS, 'discoverAssets' );
			// Set isPublishing to true to start the workflow
			setIsPublishing( true );
			debug( 'Steps initialized, starting publish workflow' );

			// Fetch settings to get storage provider ID before starting
			const settingsResponse = await apiFetch( {
				path: '/aether/site-exporter/settings',
			} );

			if ( settingsResponse.success ) {
				const settings = settingsResponse.settings || {};
				const providerTypes = settings.provider_types || {};
				const currentStorageProviderId = providerTypes.storage || '';
				setStorageProviderId( currentStorageProviderId );
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
			updateFromStep( 'discoverAssets' );

			// Fetch static site provider settings
			const fetchedStaticSiteProviderId =
				settingsResponse.settings?.provider_types?.static_site || '';

			// Get current site URL for static site generation
			const siteUrl = config.playgroundUrl || window.location.origin;

			// Get providerId for backwards compatibility
			const providerId = fetchedStaticSiteProviderId || storageProviderId;

			// Fetch providers for each deployment type from REST API (PHP registry)
			const getProvidersForDeploymentType = async ( deploymentType ) => {
				try {
					const response = await apiFetch( {
						path: `/aether/site-exporter/providers/by-deployment-type/${ deploymentType }`,
					} );
					if ( response.success && response.providers ) {
						// Return array of provider IDs
						return response.providers.map( ( p ) => p.id );
					}
				} catch ( error ) {
					debugError(
						`Failed to fetch providers for deployment type ${ deploymentType }:`,
						error
					);
				}
				return [];
			};

			// Get arrays of providers for each deployment type (in parallel)
			const [
				staticSiteProviders,
				blueprintBundleProviders,
				edgeFunctionProviders,
			] = await Promise.all( [
				getProvidersForDeploymentType( DEPLOYMENT_TYPES.STATIC_SITE ),
				getProvidersForDeploymentType(
					DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE
				),
				getProvidersForDeploymentType(
					DEPLOYMENT_TYPES.EDGE_FUNCTIONS
				),
			] );

			debug( '[Workflow] Providers by deployment type:', {
				staticSite: staticSiteProviders,
				blueprintBundle: blueprintBundleProviders,
				edgeFunctions: edgeFunctionProviders,
			} );

			// Build context object with all dependencies for step handlers
			const workflowContext = {
				// API and state
				api,
				siteUrl,
				providerId, // Legacy: single provider ID for backwards compat

				// Provider arrays by deployment type (from PHP registry via REST API)
				staticSiteProviders,
				blueprintBundleProviders,
				edgeFunctionProviders,

				// Hooks and utilities
				processStaticSiteUrls,
				generateBlueprintJson,
				handleSiteArchiveUpload,

				// UI callbacks
				setStatusMessage,
				setStepProgress,
				removeMessage,
			};

			// Get export_types from provider settings to determine which exports to run
			const providerSettings =
				settingsResponse.settings?.providers?.[ providerId ] || {};
			const exportTypes = providerSettings.export_types || [
				'static_site',
				'blueprint_bundle',
			];

			debug( '[Workflow] Export types configured:', exportTypes );

			// Filter workflow based on export types
			const filteredWorkflow = filterWorkflowByExportTypes(
				PUBLISH_WORKFLOW,
				exportTypes
			);

			debug(
				'[Workflow] Filtered workflow phases:',
				filteredWorkflow.length
			);

			// Set up workflow lifecycle callbacks for UI updates
			const workflowOptions = {
				onStepStart: ( stepId ) => {
					debug( `[Workflow] Step starting: ${ stepId }` );
					updateFromStep( stepId );
				},
				onStepComplete: ( stepId, result ) => {
					debug( `[Workflow] Step completed: ${ stepId }`, result );
				},
				onProgress: ( current ) => {
					setOverallProgressValue( current );
				},
			};

			// Execute the filtered workflow
			await executeWorkflow(
				filteredWorkflow,
				STEP_HANDLERS,
				workflowContext,
				workflowOptions
			);

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
		config,
		storageProviderId,
		processStaticSiteUrls,
		generateBlueprintJson,
		handleSiteArchiveUpload,
		setStatusMessage,
		setStepProgress,
		removeMessage,
		setOverallProgressValue,
		markAllComplete,
	] );

	return {
		startPublish,
	};
}
