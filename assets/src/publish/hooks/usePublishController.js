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
import { useConfig } from '../../hooks/useConfig';
import { PUBLISH_STEPS } from '../utils/steps';
import apiFetch from '../../utils/api';
import { calculateOverallProgress } from '../utils/progressManager';
import { debug, debugError } from '../../utils/debug';
import { applyFilters } from '@wordpress/hooks';
import { DEPLOYMENT_TYPES } from '../../constants/deploymentTypes';
import { PUBLISH_WORKFLOW, STEP_HANDLERS } from '../workflows/publishWorkflow';
import { executeWorkflow } from '../workflows/workflowExecutor';
import {
	preparePublishConfiguration,
	determineProvidersByDeploymentType,
	buildWorkflowContext,
	determineSiteUrl,
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

	// Helper function to upload blueprint-bundle.zip archive file.
	// Detects upload method from provider's upload strategy (git, storage, or direct).
	const handleSiteArchiveUpload = useCallback(
		async ( providerId, context ) => {
			try {
				// providerId is an instance ID (e.g., 'local-filesystem:abc-123')
				// Use provider ID passed from executeSteps (avoids redundant settings fetch).
				// Get default provider if none configured
				let fetchedStorageProviderId = providerId;
				if ( ! fetchedStorageProviderId ) {
					const { getDefaultProvider } = await import(
						'../../providers/utils/providerDiscovery'
					);
					fetchedStorageProviderId = await getDefaultProvider();
				}

				if ( ! fetchedStorageProviderId ) {
					throw new Error(
						'No provider instance ID provided for blueprint bundle upload'
					);
				}

				// Fetch provider metadata from REST API to check upload strategy
				// The endpoint handles both instance IDs and provider type IDs
				let providerMetadata = null;
				let instanceConfig = null;
				try {
					const providerResponse = await apiFetch( {
						path: `/aether/site-exporter/providers/${ fetchedStorageProviderId }`,
					} );

					if ( ! providerResponse ) {
						throw new Error(
							`REST API returned null response for provider ${ fetchedStorageProviderId }`
						);
					}

					if ( ! providerResponse.success ) {
						const errorMessage =
							providerResponse.message ||
							providerResponse.error ||
							'Unknown error';
						throw new Error(
							`REST API error for provider ${ fetchedStorageProviderId }: ${ errorMessage }`
						);
					}

					if ( providerResponse.provider ) {
						providerMetadata = providerResponse.provider;
					} else {
						throw new Error(
							`Provider metadata not found in REST API response for ${ fetchedStorageProviderId }`
						);
					}

					if ( providerResponse.config ) {
						instanceConfig = providerResponse.config;
					}

					debug(
						`[Aether] Fetched provider metadata for ${ fetchedStorageProviderId }:`,
						{
							providerType: providerMetadata?.type,
							hasConfig: !! instanceConfig,
							instanceEnabled: instanceConfig?.enabled,
						}
					);
				} catch ( error ) {
					debugError(
						`[Aether] Failed to fetch provider metadata for instance ${ fetchedStorageProviderId }:`,
						error
					);
					throw new Error(
						`Failed to fetch provider metadata for instance ${ fetchedStorageProviderId }: ${ error.message }`
					);
				}

				if ( ! providerMetadata ) {
					throw new Error(
						`Provider instance not found: ${ fetchedStorageProviderId }`
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
					// Pass instance ID (fetchedStorageProviderId) to the filter
					// The handler will receive the instance ID and can extract provider type if needed

					debug(
						`[Aether] Looking for upload handler for instance ${ fetchedStorageProviderId }, strategy: ${ uploadStrategy }`
					);

					const uploadHandler = applyFilters(
						'aether.provider.upload',
						null,
						fetchedStorageProviderId, // Instance ID (e.g., 'local-filesystem:abc-123')
						{
							filePath: blueprintBundlePath,
							fileName: 'blueprint-bundle.zip',
							context: {
								...context,
								instanceId: fetchedStorageProviderId,
								instanceConfig, // Include instance config in context
								exportPath: context.exportPath, // Include exportPath from uploadSiteArchiveStep
							},
						}
					);

					if (
						! uploadHandler ||
						typeof uploadHandler !== 'function'
					) {
						// Extract provider type from instance ID for better error message
						const providerType = fetchedStorageProviderId.includes(
							':'
						)
							? fetchedStorageProviderId.split( ':' )[ 0 ]
							: fetchedStorageProviderId;

						debugError(
							`[Aether] No upload handler found for provider type: ${ providerType } (instance: ${ fetchedStorageProviderId })`
						);

						throw new Error(
							`No upload handler registered for provider type: ${ providerType } (instance: ${ fetchedStorageProviderId }). ` +
								`Make sure the provider has registered an upload handler via the 'aether.provider.upload' filter.`
						);
					}

					debug(
						`[Aether] Upload handler found for ${ fetchedStorageProviderId }, calling handler...`
					);

					// Call the upload handler
					// Pass context which includes exportPath from uploadSiteArchiveStep
					const uploadResult = await uploadHandler(
						blueprintBundlePath,
						'blueprint-bundle.zip',
						{
							...context,
							instanceId: fetchedStorageProviderId,
							instanceConfig, // Include instance config
							exportPath: context.exportPath, // Include exportPath from uploadSiteArchiveStep
						}
					);

					if ( ! uploadResult ) {
						throw new Error(
							`Upload handler returned null/undefined for instance ${ fetchedStorageProviderId }`
						);
					}

					if ( ! uploadResult.success ) {
						const errorMessage =
							uploadResult?.error ||
							uploadResult?.message ||
							'Unknown upload error';
						debugError(
							`[Aether] Upload handler returned error for instance ${ fetchedStorageProviderId }:`,
							errorMessage
						);
						throw new Error(
							`Failed to upload blueprint bundle to instance ${ fetchedStorageProviderId }: ${ errorMessage }`
						);
					}

					debug(
						`[Aether] Blueprint bundle upload complete for instance ${ fetchedStorageProviderId }:`,
						uploadResult
					);

					// Progress updates are handled at the step handler level (uploadSiteArchiveStep.js)
					// to properly track progress across multiple provider instances.
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
			setOverallProgressValue, // Still used for git upload strategy
			// 			gitUpload,
			// setStepProgress removed from deps as progress is handled at step handler level
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

			// Use pure function to extract configuration
			const publishConfig = preparePublishConfiguration(
				settingsResponse,
				storageProviderId
			);

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
			updateFromStep( 'discoverAssets' );

			// Get current site URL for static site generation (use pure function)
			const siteUrl = determineSiteUrl( config, window.location.origin );

			// Get providerId for backwards compatibility (from pure function result)
			const providerId = publishConfig.providerId;

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

			// Build context object with all dependencies for step handlers (use pure function)
			const workflowContext = buildWorkflowContext(
				{
					siteUrl,
					providerId,
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
					handleSiteArchiveUpload,
					handleStaticSiteFilesUpload,
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
					updateFromStep( stepId );
				},
				onStepComplete: ( stepId, result ) => {
					debug( `[Workflow] Step completed: ${ stepId }`, result );
				},
				onProgress: ( current ) => {
					setOverallProgressValue( current );
				},
			};

			// Execute the workflow
			await executeWorkflow(
				PUBLISH_WORKFLOW,
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
		updateStaticSiteProgressContext,
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
