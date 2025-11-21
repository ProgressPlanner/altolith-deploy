/**
 * Publish Controller Hook
 *
 * Orchestrates the publish workflow using phase-based execution
 *
 * @package
 */

import { useCallback, useState, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { usePublishAPI } from './usePublishAPI';
import { useAssetManager } from './useAssetManager';
import { useStaticSiteGenerator } from './useStaticSiteGenerator';
import { useBlueprintGenerator } from './useBlueprintGenerator';
import apiFetch from '../../utils/api';
import { calculateOverallProgress } from '../utils/progressManager';
import { debug, debugError } from '../../utils/debug';
import { applyFilters } from '@wordpress/hooks';
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
						__(
							'No provider instance ID provided for blueprint bundle upload',
							'aether-site-exporter'
						)
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
							sprintf(
								/* translators: %s: Provider ID */
								__(
									'REST API returned null response for provider %s',
									'aether-site-exporter'
								),
								fetchedStorageProviderId
							)
						);
					}

					if ( ! providerResponse.success ) {
						const errorMessage =
							providerResponse.message ||
							providerResponse.error ||
							__( 'Unknown error', 'aether-site-exporter' );
						throw new Error(
							sprintf(
								/* translators: 1: Provider ID, 2: Error message */
								__(
									'REST API error for provider %1$s: %2$s',
									'aether-site-exporter'
								),
								fetchedStorageProviderId,
								errorMessage
							)
						);
					}

					if ( providerResponse.provider ) {
						providerMetadata = providerResponse.provider;
					} else {
						throw new Error(
							sprintf(
								/* translators: %s: Provider ID */
								__(
									'Provider metadata not found in REST API response for %s',
									'aether-site-exporter'
								),
								fetchedStorageProviderId
							)
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
						sprintf(
							/* translators: 1: Provider instance ID, 2: Error message */
							__(
								'Failed to fetch provider metadata for instance %1$s: %2$s',
								'aether-site-exporter'
							),
							fetchedStorageProviderId,
							error.message
						)
					);
				}

				if ( ! providerMetadata ) {
					throw new Error(
						sprintf(
							/* translators: %s: Provider instance ID */
							__(
								'Provider instance not found: %s',
								'aether-site-exporter'
							),
							fetchedStorageProviderId
						)
					);
				}

				// Determine upload strategy from provider type
				// Local filesystem has type 'local-storage' and uses direct file operations
				let uploadStrategy = 'storage'; // Default for cloud storage providers
				if ( providerMetadata.type === 'local-storage' ) {
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

				// DECISION POINT: Storage provider upload strategy
				if ( uploadStrategy === 'direct' ) {
					// METHOD 2: Direct provider upload (LocalFilesystem)
					// For 'direct' strategy, we use the provider's uploadFile method
					// This allows the provider to handle the file operation (copy, verify, etc.)

					// Get blueprintBundle data from context (set by generateBlueprint step)
					// Note: The workflow executor merges step results into context
					const blueprintBundlePath =
						context.blueprintBundle?.bundlePath;

					if ( ! blueprintBundlePath ) {
						throw new Error(
							__(
								'Blueprint bundle not found. generateBlueprint must run before uploadSiteArchive.',
								'aether-site-exporter'
							)
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
							sprintf(
								/* translators: 1: Provider type, 2: Provider instance ID */
								__(
									"No upload handler registered for provider type: %1$s (instance: %2$s). Make sure the provider has registered an upload handler via the 'aether.provider.upload' filter.",
									'aether-site-exporter'
								),
								providerType,
								fetchedStorageProviderId
							)
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
							sprintf(
								/* translators: %s: Provider instance ID */
								__(
									'Upload handler returned null/undefined for instance %s',
									'aether-site-exporter'
								),
								fetchedStorageProviderId
							)
						);
					}

					if ( ! uploadResult.success ) {
						const errorMessage =
							uploadResult?.error ||
							uploadResult?.message ||
							__(
								'Unknown upload error',
								'aether-site-exporter'
							);
						debugError(
							`[Aether] Upload handler returned error for instance ${ fetchedStorageProviderId }:`,
							errorMessage
						);
						throw new Error(
							sprintf(
								/* translators: 1: Provider instance ID, 2: Error message */
								__(
									'Failed to upload blueprint bundle to instance %1$s: %2$s',
									'aether-site-exporter'
								),
								fetchedStorageProviderId,
								errorMessage
							)
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
					throw new Error(
						__(
							'No supported upload method available',
							'aether-site-exporter'
						)
					);
				}

				// Upload complete - control returns to workflow executor.
			} catch ( error ) {
				throw error;
			}
		},
		[]
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
					handleSiteArchiveUpload,
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
		handleSiteArchiveUpload,
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
