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
import { useGitUpload } from './useGitUpload';
import { useStaticSiteGenerator } from './useStaticSiteGenerator';
import { useBlueprintGenerator } from './useBlueprintGenerator';
import { useMediaOffload } from './useMediaOffload';
import { StorageService } from '../../providers/services/storageService';
import { getCredentials } from '../../utils/credentialManager';
import { useConfig } from '../../hooks/useConfig';
import { PUBLISH_STEPS } from '../utils/steps';
import apiFetch from '../../utils/api';
import { calculateOverallProgress } from '../utils/progressManager';
import { ProviderRegistry } from '../../providers/registry/ProviderRegistry';
import { debug, debugError } from '../../utils/debug';
import { getZipUrl } from '../../utils/getZipUrl';
import {
	fetchManifest,
	updateManifestEntry,
	shouldSkipUpload,
	uploadManifest,
} from '../../utils/manifestManager';
import { uploadSingleFileWithProgress } from '../utils/fileUploadManager';
import { PUBLISH_WORKFLOW, STEP_HANDLERS } from '../workflows/publishWorkflow';
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
	const gitUpload = useGitUpload();

	// Get config at hook level (hooks can't be called inside callbacks)
	const config = useConfig();

	// Create blueprint generator hook.
	const { generateBlueprint: generateBlueprintJson } =
		useBlueprintGenerator();

	// Create media offload hook with progress callback
	const mediaOffload = useMediaOffload( ( currentFiles, totalFiles ) => {
		if ( totalFiles > 0 && currentFiles >= 0 ) {
			const progress = Math.min(
				100,
				Math.max( 0, Math.round( ( currentFiles / totalFiles ) * 100 ) )
			);
			const overallProgress = calculateOverallProgress( {
				step: 'offloadMedia',
				progress,
			} );
			setOverallProgressValue( overallProgress );
			setStepProgress( 'offloadMedia', progress );
		}
	} );

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

	// Helper function to upload wp-content.zip archive file.
	// Detects upload method from provider's upload strategy (git or storage).
	const handleSiteArchiveUpload = useCallback(
		async ( siteKey, providerId ) => {
			try {
				// Use provider ID passed from executeSteps (avoids redundant settings fetch).
				const fetchedStorageProviderId = providerId;

				// Get provider instance from registry to check upload strategy
				const registry = ProviderRegistry.getInstance();
				const provider = registry.getProvider(
					fetchedStorageProviderId
				);

				// Determine upload strategy from provider
				// If provider not found, default to 'storage' strategy
				const uploadStrategy = provider
					? provider.getUploadStrategy()
					: 'storage';

				let gitConfig = null;
				if ( uploadStrategy === 'git' ) {
					// For Git-based providers, fetch Git configuration
					gitConfig = await api.getGitConfig().catch( () => null );
				}

				// DECISION POINT: Git vs Storage provider upload.
				// Priority: Git upload takes precedence if configured (GitHub/GitLab Pages workflow).
				// Fallback: Storage provider upload (R2/Spaces via Worker API).
				if (
					uploadStrategy === 'git' &&
					gitConfig &&
					gitConfig.success &&
					gitConfig.config
				) {
					// METHOD 1: Git-based upload (GitHub Pages / GitLab Pages)
					// Create simple manifest with wp-content.zip for Git upload.
					const manifest = [
						{
							storageKey: `${ siteKey }/wp-content.zip`,
							contentType: 'application/zip',
						},
					];
					await gitUpload.uploadFiles( manifest, gitConfig );
					// Update progress to 100% for uploadSiteArchive when Git upload completes.
					updateFromStep( 'uploadSiteArchive' );
					setOverallProgressValue(
						calculateOverallProgress( {
							step: 'uploadSiteArchive',
							progress: 100,
						} )
					);
				} else if ( fetchedStorageProviderId ) {
					// METHOD 2: Storage provider upload (Cloudflare R2 / DigitalOcean Spaces)
					// Uploads wp-content.zip directly to object storage via Worker proxy.
					// Fetch storage provider credentials (Worker endpoint + bucket name).
					const credentials = await getCredentials(
						fetchedStorageProviderId
					);
					const workerEndpoint = credentials.worker_endpoint || '';
					const bucketName = credentials.bucket_name || '';

					// Validate required credentials exist.
					if ( ! workerEndpoint || ! bucketName ) {
						throw new Error(
							'Worker endpoint and bucket name are required for storage operations'
						);
					}

					// Initialize storage service for uploads.
					const uploadStorageService = new StorageService(
						workerEndpoint,
						bucketName,
						credentials
					);

					// Storage key format: {siteKey}/wp-content.zip
					const storageKey = `${ siteKey }/wp-content.zip`;

					// Fetch manifest for hash comparison
					let manifest = {};
					try {
						manifest = await fetchManifest(
							uploadStorageService,
							siteKey
						);
					} catch ( error ) {
						debug(
							'Failed to fetch manifest, continuing without hash comparison:',
							error
						);
						manifest = {};
					}

					// Fetch file from server (wp-content.zip stored in wp-content/ directory).
					// File is web-accessible, so we can fetch it directly via URL.
					const fileResponse = await fetch( getZipUrl() );

					if ( ! fileResponse.ok ) {
						const errorMessage =
							fileResponse.status === 404
								? 'wp-content.zip file not found. Please ensure the archive was created successfully.'
								: `Failed to fetch file: ${ fileResponse.statusText }`;
						throw new Error( errorMessage );
					}

					// Convert response to Blob for upload.
					let fileBlob = await fileResponse.blob();
					debug(
						'uploadSiteArchive fileBlob size:',
						fileBlob.size,
						'bytes'
					);

					// Upload file using utility
					const uploadResult = await uploadSingleFileWithProgress( {
						key: storageKey,
						blob: fileBlob,
						storageService: uploadStorageService,
						setStatusMessage,
						contentType: 'application/zip',
						displayName: 'wp-content.zip',
						statusKey: 'uploadSiteArchive',
						onProgress: ( uploaded, total, percent ) => {
							debug( '[Aether] uploadSiteArchive progress:', {
								uploaded,
								total,
								percentage: percent,
								fileSize: fileBlob.size,
							} );

							updateFromStep( 'uploadSiteArchive' );
							const overallProgress = calculateOverallProgress( {
								step: 'uploadSiteArchive',
								progress: percent,
							} );
							debug(
								'[Aether] uploadSiteArchive overall progress:',
								overallProgress
							);
							setOverallProgressValue( overallProgress );
							setStepProgress( 'uploadSiteArchive', percent );
						},
						skipHashCheck: false,
						manifest,
						shouldSkipUpload,
					} );

					// Update manifest entry if hash was calculated
					// Include skipped files to ensure they're preserved in manifest
					if ( uploadResult.hash ) {
						manifest = updateManifestEntry(
							manifest,
							storageKey,
							uploadResult.size || fileBlob.size,
							uploadResult.hash
						);

						// Upload updated manifest
						try {
							await uploadManifest(
								uploadStorageService,
								siteKey,
								manifest
							);
						} catch ( error ) {
							debug( 'Failed to upload manifest:', error );
							// Don't fail publish if manifest upload fails
						}
					}

					// Null blob reference to help GC
					fileBlob = null;

					// Update progress to 100% when upload completes (or skipped).
					updateFromStep( 'uploadSiteArchive' );
					setOverallProgressValue(
						calculateOverallProgress( {
							step: 'uploadSiteArchive',
							progress: 100,
						} )
					);
					setStepProgress( 'uploadSiteArchive', 100 );

					if ( ! uploadResult.success && ! uploadResult.skipped ) {
						throw new Error(
							uploadResult.error ||
								'Failed to upload wp-content.zip'
						);
					}
				} else {
					// ERROR: No upload method configured (neither Git nor storage provider).
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
			gitUpload,
			setOverallProgressValue,
			setStepProgress,
			setStatusMessage,
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

			// Fetch siteKey (unique identifier for storage path)
			let siteKey = '';
			try {
				const configResponse = await apiFetch( {
					path: '/aether/site-exporter/config',
				} );
				siteKey = configResponse.siteKey || '';
			} catch ( error ) {
				debug( 'SiteKey fetch failed, continuing without it' );
			}

			// Get current site URL for static site generation
			const siteUrl = config.playgroundUrl || window.location.origin;

			// Get providerId for step handlers
			const providerId = fetchedStaticSiteProviderId || storageProviderId;

			// Build context object with all dependencies for step handlers
			const workflowContext = {
				// API and state
				api,
				siteKey,
				siteUrl,
				providerId,

				// Hooks and utilities
				mediaOffload,
				processStaticSiteUrls,
				generateBlueprintJson,
				handleSiteArchiveUpload,

				// UI callbacks
				setStatusMessage,
				setStepProgress,
				removeMessage,
			};

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
		config,
		storageProviderId,
		mediaOffload,
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
