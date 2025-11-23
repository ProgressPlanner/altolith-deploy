/**
 * Static Site Generator Hook
 *
 * Processes URLs and uploads static site files.
 * Receives pre-fetched URL data from preScanStaticSite step (no caching).
 *
 */

import { useCallback } from '@wordpress/element';
import { doAction, applyFilters } from '@wordpress/hooks';
import { createAssetTracker } from '@aether/export/utils/assetTracker';
import { debug, debugWarn } from '@aether/utils/debug';
import {
	updateManifestEntry,
	uploadManifest,
} from '@aether/utils/manifestManager';

// Extracted modules
import {
	buildStorageConfig,
	buildUploadResult,
	createFailureTracker,
	fetchProviderConfig,
	createStorageService,
} from '@aether/export/utils/staticSiteConfig';
import {
	prepareManifest,
	processAssets,
	uploadHtmlFile,
	finalizeManifest,
} from '@aether/export/utils/uploadPhase';

/**
 * Process URLs and upload static site files.
 *
 * @param {Function} onProgress Progress callback (uploadedFiles, totalFiles, message).
 * @return {Function} Process function.
 */
export function useStaticSiteGenerator( onProgress ) {
	const processUrls = useCallback(
		async (
			urls,
			staticSiteUrl,
			staticSiteProviderId,
			siteUrl,
			setStatusMessage,
			blueprintData,
			removeMessage = null,
			urlData = null
		) => {
			// Create asset tracker to prevent duplicate uploads
			const assetTracker = createAssetTracker();

			// Track all uploaded files for manifest generation
			const uploadedFiles = [];

			// Track failures for reporting
			const failures = createFailureTracker();

			// Get provider configuration
			const providerConfig =
				await fetchProviderConfig( staticSiteProviderId );
			const staticPath = providerConfig.static_files_path || 'static/';

			// Build and create storage service
			const config = buildStorageConfig(
				siteUrl,
				staticSiteUrl,
				staticSiteProviderId
			);

			debug( 'Static site storage configuration:', {
				staticPath,
				providerId: staticSiteProviderId,
			} );

			const storageService = await createStorageService(
				staticPath,
				config,
				staticSiteProviderId,
				providerConfig
			);

			const totalUrls = urls.length;

			// If no urlData provided, we can't continue
			// (urlData should come from preScanStaticSite step)
			if (
				! urlData ||
				! Array.isArray( urlData ) ||
				urlData.length === 0
			) {
				debugWarn(
					'[Aether] No URL data provided to useStaticSiteGenerator. Upload skipped.'
				);
				return buildUploadResult(
					failures,
					assetTracker,
					0,
					0,
					0,
					uploadedFiles,
					totalUrls
				);
			}

			// Calculate total files to upload from urlData
			const allAssets = new Set();
			for ( const item of urlData ) {
				if ( item.assetUrls ) {
					for ( const assetUrl of item.assetUrls ) {
						allAssets.add( assetUrl );
					}
				}
			}
			const totalFilesToUpload = urlData.length + allAssets.size;

			// Upload all files
			let manifest = await prepareManifest(
				storageService,
				staticSiteProviderId,
				setStatusMessage
			);

			let filesUploaded = 0;
			let filesSkipped = 0;

			// Fire upload start action
			doAction(
				'aether.export.step.uploadStaticSiteFiles.upload.before',
				urlData.map( ( item ) => item.url ),
				totalFilesToUpload,
				staticSiteProviderId
			);

			// Process each URL from urlData (no cache lookups)
			for ( const item of urlData ) {
				const { url, rawHtml, assetUrls } = item;

				try {
					// Update progress message
					if ( setStatusMessage ) {
						setStatusMessage(
							`Uploading files (${
								filesUploaded + 1
							}/${ totalFilesToUpload })`,
							'progress',
							'uploadFilesProgress'
						);
					}

					// Upload HTML file
					const htmlResult = await uploadHtmlFile( {
						url,
						rawHtml,
						siteUrl,
						staticSiteUrl,
						providerId: staticSiteProviderId,
						storageService,
						setStatusMessage,
						staticPath,
					} );

					filesUploaded++;
					failures.urlsSucceeded++;

					if ( htmlResult.skipped ) {
						filesSkipped++;
						if ( setStatusMessage ) {
							setStatusMessage(
								`Skipped unchanged file ${ htmlResult.htmlPath }`,
								'success',
								`upload-${ htmlResult.htmlPath }`
							);
						}
					}

					// Update manifest if hash available
					if ( htmlResult.htmlHash && ! htmlResult.skipped ) {
						manifest = updateManifestEntry(
							manifest,
							htmlResult.htmlKey,
							htmlResult.htmlSize,
							htmlResult.htmlHash,
							'text/html'
						);

						manifest = applyFilters(
							'aether.export.step.uploadStaticSiteFiles.manifest.update',
							manifest,
							htmlResult.htmlKey,
							staticSiteProviderId
						);
					}

					// Track uploaded file
					uploadedFiles.push( {
						storageKey: htmlResult.htmlKey,
						relativePath: htmlResult.htmlPath,
						contentType: 'text/html',
					} );

					// Report progress
					if ( onProgress ) {
						onProgress( filesUploaded, totalFilesToUpload, null );
					}

					// Process assets for this page
					const assetResult = await processAssets( {
						assetUrls,
						assetTracker,
						storageService,
						manifest,
						providerId: staticSiteProviderId,
						filesUploaded,
						totalFilesToUpload,
						onProgress,
						setStatusMessage,
					} );

					filesUploaded = assetResult.filesUploaded;
					filesSkipped += assetResult.filesSkipped;
					uploadedFiles.push( ...assetResult.uploadedFiles );
					manifest = assetResult.manifest;

					// Periodic manifest save
					if ( filesUploaded % 50 === 0 ) {
						try {
							debug(
								'Periodic manifest save:',
								filesUploaded + ' files'
							);
							await uploadManifest( storageService, manifest );
						} catch ( error ) {
							debugWarn(
								'Periodic manifest save failed:',
								error
							);
						}
					}
				} catch ( error ) {
					failures.urlsFailed++;
					failures.failedUrls.push( { url, reason: error.message } );
				}
			}

			// Finalize manifest
			await finalizeManifest(
				storageService,
				manifest,
				uploadedFiles,
				staticSiteProviderId,
				setStatusMessage
			);

			// Log optimization summary
			const actualUploads = filesUploaded - filesSkipped;
			debug( 'Upload optimization summary:', {
				totalFiles: filesUploaded,
				uploaded: actualUploads,
				skipped: filesSkipped,
				skipRate:
					filesUploaded > 0
						? `${ Math.round(
								( filesSkipped / filesUploaded ) * 100
						  ) }%`
						: '0%',
			} );

			// Remove progress message
			if ( removeMessage ) {
				removeMessage( 'uploadFilesProgress' );
			}

			// Fire completion action
			doAction(
				'aether.export.step.uploadStaticSiteFiles.upload.after',
				{
					filesUploaded,
					filesSkipped,
					urlsSucceeded: failures.urlsSucceeded,
					urlsFailed: failures.urlsFailed,
					assetsUploaded: assetTracker.getCount(),
				},
				staticSiteProviderId
			);

			// Return result
			return buildUploadResult(
				failures,
				assetTracker,
				filesUploaded,
				filesSkipped,
				totalFilesToUpload,
				uploadedFiles,
				totalUrls
			);
		},
		[ onProgress ]
	);

	return processUrls;
}
