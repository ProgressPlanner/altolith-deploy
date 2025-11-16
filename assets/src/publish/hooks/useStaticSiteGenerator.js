/**
 * Static Site Generator Hook
 *
 * Processes URLs and uploads static site files using a two-phase approach:
 * 1. PHASE 1 (Pre-scan): Fetch all URLs, extract assets, count total files
 *    - Discovers all unique assets across all pages
 *    - Caches processed HTML to avoid duplicate work
 *    - Calculates accurate total file count for progress tracking
 * 2. PHASE 2 (Upload): Upload all files with accurate progress
 *    - Uses cached HTML from pre-scan phase
 *    - Reports progress as filesUploaded/totalFilesToUpload (fixed total)
 *    - Handles deduplication of shared assets across pages
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import { getCredentials } from '../../utils/credentialManager';
import { StorageService } from '../../providers/services/storageService';
import { processHtml, getStaticFilePath } from '../utils/htmlProcessor';
import {
	extractAssetsFromHtml,
	getAssetLocalPath,
} from '../utils/assetExtractor';
import { createAssetTracker } from '../utils/assetTracker';
import apiFetch from '../../utils/api';
import { debug, debugWarn } from '../../utils/debug';
import { calculateFileHash } from '../../utils/fileHash';
import {
	fetchManifest,
	updateManifestEntry,
	shouldSkipUpload,
	uploadManifest,
	cleanupManifest,
} from '../../utils/manifestManager';
import { uploadFilesWithProgress } from '../utils/fileUploadManager';

/**
 * WordPress Playground root URL (matches PHP constant AETHER_PLAYGROUND_ROOT_URL).
 */
const AETHER_PLAYGROUND_ROOT_URL = 'https://static-wp.s12y.org/index.html';

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
			siteKey,
			siteUrl,
			setStatusMessage,
			blueprintData,
			removeMessage = null
		) => {
			// Create asset tracker to prevent duplicate uploads.
			const assetTracker = createAssetTracker();

			// Track all uploaded files for manifest generation.
			const uploadedFiles = [];

			// Track failures for reporting.
			const failures = {
				urlsFailed: 0,
				urlsSucceeded: 0,
				assetsFailed: 0,
				failedUrls: [],
			};

			// Check if Git-based upload is available (GitHub Pages or GitLab Pages provider).
			// Git config contains: repo URL, branch, access token, etc.
			// Only fetch if using a Git-based staticSite provider.
			// Known Git providers: github, gitlab, gitlab-pages
			const gitProviderIds = [ 'github', 'gitlab', 'gitlab-pages' ];
			const isGitProvider =
				gitProviderIds.includes( staticSiteProviderId );

			let gitConfig = null;
			if ( isGitProvider ) {
				try {
					const gitConfigResponse = await apiFetch( {
						path: '/aether/site-exporter/git-config',
					} );
					if (
						gitConfigResponse &&
						gitConfigResponse.success &&
						gitConfigResponse.config
					) {
						gitConfig = gitConfigResponse;
					}
				} catch ( error ) {
					// Git config not available, will use StorageService
				}
			}

			// Get credentials for staticSite provider.
			// Falls back to storage provider if staticSite provider not configured.
			const credentials = await getCredentials( staticSiteProviderId );
			const workerEndpoint = credentials.worker_endpoint || '';
			const bucketName = credentials.bucket_name || '';

			// DECISION POINT: Git vs Storage provider upload.
			// Priority: Git upload takes precedence if configured (GitHub/GitLab Pages workflow).
			// Fallback: Storage provider upload via Worker API.
			if ( gitConfig && gitConfig.success && gitConfig.config ) {
				// Git-based upload for staticSite providers (GitHub Pages / GitLab Pages)
				// Note: Git uploads require collecting all files first, then uploading together
				// This is a simplified implementation - full Git support would require refactoring
				// to collect files first, then upload via Git manifest
				throw new Error(
					'Git-based staticSite providers are not yet fully supported for static site uploads. Please use a storage-based provider for static site hosting.'
				);
			} else if ( ! workerEndpoint || ! bucketName ) {
				throw new Error(
					'Worker endpoint and bucket name are required for static site uploads. Please configure a storage-based staticSite provider.'
				);
			}

			if ( ! siteKey ) {
				throw new Error(
					'Site key is required for static site generation'
				);
			}

			// Create storage service.
			const storageService = new StorageService(
				workerEndpoint,
				bucketName,
				credentials
			);

			const totalUrls = urls.length;

			// PHASE 1: Pre-scan all URLs to discover total file count
			// This allows us to report accurate progress (X of Y files) instead of growing totals
			if ( setStatusMessage ) {
				setStatusMessage(
					'Scanning files to upload…',
					'progress',
					'scanFiles'
				);
			}

			// Cache for processed HTML and discovered assets
			const urlCache = new Map();
			const allUniqueAssets = new Set(); // Track unique assets across all URLs

			// Pre-scan: Fetch all URLs, extract assets, count total files
			for ( let i = 0; i < urls.length; i++ ) {
				const url = urls[ i ];

				try {
					// Fetch HTML content directly from URL (as anonymous visitor).
					const htmlResponse = await fetch( url, {
						method: 'GET',
						credentials: 'omit',
						headers: {
							'User-Agent': 'Aether Static Site Generator',
						},
					} );

					if ( htmlResponse.status !== 200 ) {
						// Log failure silently (non-200 responses are expected for some URLs)
						// Use debugWarn instead of console.error to avoid console noise
						debugWarn(
							`[Aether] Skipping URL with non-200 status: ${ url } (HTTP ${ htmlResponse.status })`
						);
						failures.urlsFailed++;
						failures.failedUrls.push( {
							url,
							reason: `Failed to fetch HTML: HTTP ${ htmlResponse.status } ${ htmlResponse.statusText }`,
						} );
						continue;
					}

					const html = await htmlResponse.text();

					// Extract assets from HTML
					const assetUrls = await extractAssetsFromHtml(
						html,
						url,
						siteUrl
					);

					// Add all assets to unique set
					for ( const assetUrl of assetUrls ) {
						allUniqueAssets.add( assetUrl );
					}

					// Process HTML and cache it
					const processedHtml = processHtml(
						html,
						url,
						siteUrl,
						staticSiteUrl
					);

					// Cache processed HTML and asset URLs for upload phase
					urlCache.set( url, {
						processedHtml,
						assetUrls,
					} );
				} catch ( error ) {
					// Log failure silently (network errors are expected for some URLs)
					// Use debugWarn instead of letting error propagate to avoid console noise
					debugWarn(
						`[Aether] Error fetching URL: ${ url }`,
						error.message
					);
					failures.urlsFailed++;
					failures.failedUrls.push( {
						url,
						reason: error.message,
					} );
				}
			}

			// Calculate total files: HTML files + unique assets + wp-admin/index.html
			const totalFilesToUpload =
				urlCache.size + // HTML files successfully fetched
				allUniqueAssets.size + // Unique assets across all pages
				1; // wp-admin/index.html

			debug( 'Pre-scan complete:', {
				urlsScanned: urls.length,
				urlsSuccessful: urlCache.size,
				uniqueAssets: allUniqueAssets.size,
				totalFilesToUpload,
			} );

			if ( setStatusMessage ) {
				setStatusMessage(
					`Pre-scan complete: ${ urlCache.size } HTML files, ${ allUniqueAssets.size } assets`,
					'success',
					'scanFiles'
				);
			}

			// PHASE 2: Upload all files with accurate progress tracking
			// Fetch manifest for hash comparison
			let manifest = {};
			try {
				if ( setStatusMessage ) {
					setStatusMessage(
						'Fetching file manifest…',
						'progress',
						'fetchManifest'
					);
				}
				manifest = await fetchManifest( storageService, siteKey );
				const manifestEntryCount = Object.keys( manifest ).length;
				if ( setStatusMessage ) {
					setStatusMessage(
						`Fetched file manifest (${ manifestEntryCount } entries)`,
						'success',
						'fetchManifest'
					);
				}
				debug( `Manifest loaded with ${ manifestEntryCount } entries` );
			} catch ( error ) {
				debugWarn(
					'Failed to fetch manifest, continuing without hash comparison:',
					error
				);
				manifest = {};
			}

			let filesUploaded = 0;
			let filesSkipped = 0;

			/**
			 * Process and upload assets for a given set of asset URLs.
			 * This function handles fetching, uploading, and manifest tracking for assets.
			 *
			 * @param {Array<string>} assetUrls Array of asset URLs to process.
			 * @return {Promise<void>}
			 */
			const processAssets = async ( assetUrls ) => {
				// Step 1: Filter out assets already processed in THIS session (deduplication)
				const assetsNotInTracker = assetUrls.filter(
					( assetUrl ) => ! assetTracker.isUploaded( assetUrl )
				);

				if ( assetsNotInTracker.length === 0 ) {
					return; // Skip if no assets to process
				}

				// Step 2: Fetch all assets first (this part stays sequential to avoid overwhelming the server)
				const assetData = [];
				for ( const assetUrl of assetsNotInTracker ) {
					try {
						// Fetch asset content from URL (as anonymous visitor).
						const assetResponse = await fetch( assetUrl, {
							method: 'GET',
							credentials: 'omit',
							headers: {
								'User-Agent': 'Aether Static Site Generator',
							},
						} );
						if ( assetResponse.status !== 200 ) {
							// Skip failed asset silently (non-200 responses are expected for some assets)
							continue;
						}

						const assetContent = await assetResponse.blob();
						const contentType =
							assetResponse.headers.get( 'content-type' ) ||
							'application/octet-stream';

						// Get asset path and storage key.
						const assetPath = getAssetLocalPath( assetUrl );
						const assetKey = `${ siteKey }/static/${ assetPath }`;

						// Create blob with appropriate content type.
						const assetBlob = new Blob( [ assetContent ], {
							type: contentType,
						} );

						// Step 3: Check manifest BEFORE adding to upload queue
						// This prevents unnecessary uploads for assets that already exist in manifest
						const existingEntry = manifest[ assetKey ];
						if (
							existingEntry &&
							existingEntry.size === assetBlob.size
						) {
							// Size matches - calculate hash to verify
							try {
								const assetHash =
									await calculateFileHash( assetBlob );
								if (
									shouldSkipUpload(
										manifest,
										assetKey,
										assetBlob.size,
										assetHash
									)
								) {
									// Asset exists in manifest with matching hash - skip upload
									// But still mark as uploaded and add to uploadedFiles for cleanup
									assetTracker.markUploaded( assetUrl );
									filesUploaded++;
									filesSkipped++;
									uploadedFiles.push( {
										storageKey: assetKey,
										relativePath: `static/${ assetPath }`,
										contentType,
									} );
									continue; // Skip adding to assetData
								}
							} catch ( error ) {
								debugWarn(
									'Failed to calculate hash for manifest check, will upload:',
									assetUrl,
									error
								);
								// Continue to add asset to upload queue
							}
						}

						assetData.push( {
							assetUrl,
							assetPath,
							assetKey,
							assetBlob,
							contentType,
						} );
					} catch ( error ) {
						// Failed to fetch asset silently (network errors are expected).
						debugWarn( 'Failed to fetch asset:', assetUrl, error );
					}
				}

				// Prepare files for upload utility
				const filesToUpload = assetData.map( ( data ) => ( {
					key: data.assetKey,
					blob: data.assetBlob,
					contentType: data.contentType,
					displayName: data.assetPath || data.assetKey || 'file',
					metadata: {},
					assetData: data, // Store original data for later processing
				} ) );

				// Upload all files in parallel using the utility
				const uploadResult = await uploadFilesWithProgress( {
					files: filesToUpload,
					storageService,
					setStatusMessage,
					concurrency: 5,
					onProgress: ( uploaded ) => {
						if ( onProgress ) {
							onProgress(
								filesUploaded + uploaded,
								totalFilesToUpload,
								null
							);
						}
					},
					keyPrefix: 'upload',
					skipHashCheck: false,
					manifest,
					shouldSkipUpload,
				} );

				// Process results and update manifest
				// IMPORTANT: Match results by key, not index, since parallel uploads complete out of order
				for ( let i = 0; i < uploadResult.results.length; i++ ) {
					const result = uploadResult.results[ i ];
					// Find corresponding fileData by matching the key
					// IMPORTANT: Match by key, not index, since parallel uploads complete out of order
					const fileData = filesToUpload.find(
						( f ) => f.key === result.key
					);
					if ( ! fileData ) {
						debugWarn(
							'Could not find fileData for result key:',
							result.key
						);
						continue;
					}
					const { assetUrl, assetPath, assetKey, contentType } =
						fileData.assetData;

					if ( result.success ) {
						// Mark asset as uploaded.
						assetTracker.markUploaded( assetUrl );
						filesUploaded++;

						if ( result.skipped ) {
							filesSkipped++;
						}

						// Update manifest entry if hash was calculated.
						if ( result.hash ) {
							manifest = updateManifestEntry(
								manifest,
								assetKey,
								result.size || fileData.blob.size,
								result.hash,
								contentType
							);
						}

						// Track uploaded asset file for manifest generation.
						uploadedFiles.push( {
							storageKey: assetKey,
							relativePath: `static/${ assetPath }`,
							contentType,
						} );
					}
				}
			};

			// Process each URL sequentially and upload files
			for ( const [ url, cached ] of urlCache.entries() ) {
				const { processedHtml, assetUrls } = cached;

				try {
					// Update UI to show current progress (files X of Y).
					// Use a single key for all "Uploading files" messages so they update in place
					if ( setStatusMessage ) {
						setStatusMessage(
							`Uploading files (${
								filesUploaded + 1
							}/${ totalFilesToUpload })`,
							'progress',
							'uploadFilesProgress'
						);
					}

					// Upload HTML file to storage with progress tracking.
					// Storage path format: {siteKey}/static/{path}/index.html
					const htmlPath = getStaticFilePath( url );
					const htmlKey = `${ siteKey }/static/${ htmlPath }`;
					let htmlBlob = new Blob( [ processedHtml ], {
						type: 'text/html',
					} );

					// Check if file should be skipped based on size and hash
					const htmlSize = htmlBlob.size;
					let htmlHash = null;
					let shouldSkip = false;

					// Stage 1: Check size first
					const existingEntry = manifest[ htmlKey ];
					if ( existingEntry && existingEntry.size === htmlSize ) {
						// Stage 2: Calculate hash if size matches
						try {
							htmlHash = await calculateFileHash( htmlBlob );
							shouldSkip = shouldSkipUpload(
								manifest,
								htmlKey,
								htmlSize,
								htmlHash
							);
						} catch ( error ) {
							debugWarn(
								'Failed to calculate hash, will upload:',
								error
							);
							shouldSkip = false;
						}
					}

					if ( shouldSkip ) {
						// File unchanged - skip upload
						filesUploaded++;
						filesSkipped++;
						failures.urlsSucceeded++;

						// Track skipped file in uploadedFiles for manifest cleanup.
						// This prevents the manifest from being wiped clean on next publish.
						uploadedFiles.push( {
							storageKey: htmlKey,
							relativePath: `static/${ htmlPath }`,
							contentType: 'text/html',
						} );

						if ( setStatusMessage ) {
							const uploadKey = `upload-${ htmlPath }`;
							setStatusMessage(
								`Skipped unchanged file <code>${ htmlPath }</code>`,
								'success',
								uploadKey
							);
						}

						// Report progress
						if ( onProgress ) {
							onProgress(
								filesUploaded,
								totalFilesToUpload,
								null
							);
						}

						// IMPORTANT: Process assets even when HTML is skipped
						// Assets might have changed even if HTML hasn't
						await processAssets( assetUrls );

						// Null blob reference to help GC
						htmlBlob = null;
						continue;
					}

					// Calculate hash if not already calculated
					if ( ! htmlHash ) {
						try {
							htmlHash = await calculateFileHash( htmlBlob );
						} catch ( error ) {
							debugWarn( 'Failed to calculate hash:', error );
							htmlHash = null;
						}
					}

					// Update status message to show current file being uploaded.
					if ( setStatusMessage ) {
						const uploadKey = `upload-${ htmlPath }`;
						setStatusMessage(
							`Uploading <code>${ htmlPath }</code>`,
							'progress',
							uploadKey
						);
					}

					// Report progress BEFORE uploading
					if ( onProgress ) {
						const progressPercent =
							totalFilesToUpload > 0
								? Math.round(
										( filesUploaded / totalFilesToUpload ) *
											100
								  )
								: 0;
						debug(
							'[Aether] uploadStaticSiteFiles HTML before upload:',
							{
								filesUploaded,
								totalFilesToUpload,
								progressPercent,
							}
						);
						onProgress( filesUploaded, totalFilesToUpload, null );
					}

					// Upload HTML file (progress reported via onProgress callback, not upload callback)
					const htmlUploadResult = await storageService.upload(
						htmlKey,
						htmlBlob,
						{
							contentType: 'text/html',
						}
					);

					if ( ! htmlUploadResult.success ) {
						throw new Error(
							`Failed to upload HTML file: ${ htmlUploadResult.error }`
						);
					}

					// File uploaded successfully - update progress and manifest
					filesUploaded++;
					failures.urlsSucceeded++;

					// Update message to success
					if ( setStatusMessage ) {
						const uploadKey = `upload-${ htmlPath }`;
						setStatusMessage(
							`Uploaded <code>${ htmlPath }</code>`,
							'success',
							uploadKey
						);
					}

					// Update manifest entry if hash was calculated
					if ( htmlHash ) {
						manifest = updateManifestEntry(
							manifest,
							htmlKey,
							htmlSize,
							htmlHash,
							'text/html'
						);
					}

					// Periodic manifest save for crash recovery (every 50 files)
					if ( filesUploaded % 50 === 0 ) {
						try {
							debug(
								'Periodic manifest save:',
								filesUploaded + ' files'
							);
							await uploadManifest(
								storageService,
								siteKey,
								manifest
							);
						} catch ( error ) {
							debugWarn(
								'Periodic manifest save failed:',
								error
							);
							// Don't fail upload on manifest save error
						}
					}

					// Null blob reference to help GC
					htmlBlob = null;

					// Report progress after upload completes
					if ( onProgress ) {
						const progressPercent =
							totalFilesToUpload > 0
								? Math.round(
										( filesUploaded / totalFilesToUpload ) *
											100
								  )
								: 0;
						debug(
							'[Aether] uploadStaticSiteFiles HTML after upload:',
							{
								filesUploaded,
								totalFilesToUpload,
								progressPercent,
							}
						);
						onProgress( filesUploaded, totalFilesToUpload, null );
					}

					// Track uploaded HTML file.
					uploadedFiles.push( {
						storageKey: htmlKey,
						relativePath: `static/${ htmlPath }`,
						contentType: 'text/html',
					} );

					// Upload all assets extracted from this HTML page.
					// Assets include: CSS, JS, images, fonts, etc.
					// OPTIMIZATION: Deduplication prevents uploading the same asset multiple times.
					// OPTIMIZATION: Parallel uploads with concurrency limiting for better performance.
					await processAssets( assetUrls );

					// Periodic manifest save (after batch completes).
					if ( filesUploaded % 50 === 0 ) {
						try {
							debug(
								'Periodic manifest save:',
								filesUploaded + ' files'
							);
							await uploadManifest(
								storageService,
								siteKey,
								manifest
							);
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

			// Report progress BEFORE uploading wp-admin/index.html
			if ( onProgress ) {
				const progressPercent =
					totalFilesToUpload > 0
						? Math.round(
								( filesUploaded / totalFilesToUpload ) * 100
						  )
						: 0;
				debug(
					'[Aether] uploadStaticSiteFiles wp-admin before upload:',
					{
						filesUploaded,
						totalFilesToUpload,
						progressPercent,
					}
				);
				onProgress( filesUploaded, totalFilesToUpload, null );
			}

			// Generate and upload wp-admin/index.html redirect file.
			if ( setStatusMessage ) {
				setStatusMessage(
					'Generating wp-admin redirect file',
					'progress',
					'generateWpAdmin'
				);
			}

			// Generate base64-encoded blueprint for URL fragment.
			if ( ! blueprintData ) {
				throw new Error(
					'Blueprint data is required for wp-admin redirect'
				);
			}

			const blueprintBase64 = btoa( JSON.stringify( blueprintData ) );
			const playgroundUrl = `${ AETHER_PLAYGROUND_ROOT_URL }#${ blueprintBase64 }`;

			const redirectHtml = `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta http-equiv="refresh" content="0; url=${ playgroundUrl }">
	<title>Redirecting to WordPress Playground...</title>
</head>
<body>
	<p>Redirecting to <a href="${ playgroundUrl }">WordPress Playground</a>...</p>
	<script>window.location.href = ${ JSON.stringify( playgroundUrl ) };</script>
</body>
</html>`;

			// Upload wp-admin/index.html file (progress reported via onProgress callback)
			const wpAdminKey = `${ siteKey }/static/wp-admin/index.html`;
			let wpAdminBlob = new Blob( [ redirectHtml ], {
				type: 'text/html',
			} );

			// Check if file should be skipped based on size and hash
			const wpAdminSize = wpAdminBlob.size;
			let wpAdminHash = null;
			let shouldSkipWpAdmin = false;

			// Stage 1: Check size first
			const existingWpAdminEntry = manifest[ wpAdminKey ];
			if (
				existingWpAdminEntry &&
				existingWpAdminEntry.size === wpAdminSize
			) {
				// Stage 2: Calculate hash if size matches
				try {
					wpAdminHash = await calculateFileHash( wpAdminBlob );
					shouldSkipWpAdmin = shouldSkipUpload(
						manifest,
						wpAdminKey,
						wpAdminSize,
						wpAdminHash
					);
				} catch ( error ) {
					debugWarn(
						'Failed to calculate wp-admin hash, will upload:',
						error
					);
					shouldSkipWpAdmin = false;
				}
			}

			if ( shouldSkipWpAdmin ) {
				// File unchanged - skip upload
				filesUploaded++;
				filesSkipped++;
				uploadedFiles.push( {
					storageKey: wpAdminKey,
					relativePath: 'static/wp-admin/index.html',
					contentType: 'text/html',
				} );

				// Update message to success
				if ( setStatusMessage ) {
					setStatusMessage(
						'Generated wp-admin redirect file',
						'success',
						'generateWpAdmin'
					);
				}

				// Report final progress (100%)
				if ( onProgress ) {
					onProgress( filesUploaded, totalFilesToUpload, null );
				}

				// Null blob reference to help GC
				wpAdminBlob = null;
			} else {
				// Calculate hash if not already calculated
				if ( ! wpAdminHash ) {
					try {
						wpAdminHash = await calculateFileHash( wpAdminBlob );
					} catch ( error ) {
						debugWarn(
							'Failed to calculate wp-admin hash:',
							error
						);
						wpAdminHash = null;
					}
				}

				const wpAdminUploadResult = await storageService.upload(
					wpAdminKey,
					wpAdminBlob,
					{
						contentType: 'text/html',
						cacheControl: 'no-store', // Prevent caching - always fetch fresh
					}
				);

				if ( wpAdminUploadResult.success ) {
					filesUploaded++;

					// Update message to success
					if ( setStatusMessage ) {
						setStatusMessage(
							'Generated wp-admin redirect file',
							'success',
							'generateWpAdmin'
						);
					}

					// Update manifest entry if hash was calculated
					if ( wpAdminHash ) {
						manifest = updateManifestEntry(
							manifest,
							wpAdminKey,
							wpAdminSize,
							wpAdminHash
						);
					}

					// Report final progress (100%)
					if ( onProgress ) {
						onProgress( filesUploaded, totalFilesToUpload, null );
					}
					uploadedFiles.push( {
						storageKey: wpAdminKey,
						relativePath: 'static/wp-admin/index.html',
						contentType: 'text/html',
					} );
				}

				// Null blob reference to help GC
				wpAdminBlob = null;
			}

			// Upload final manifest with cleanup
			try {
				if ( setStatusMessage ) {
					setStatusMessage(
						'Updating file manifest…',
						'progress',
						'updateManifest'
					);
				}

				// Clean up manifest to remove entries for files not in current upload
				const currentFileKeys = new Set(
					uploadedFiles.map( ( file ) => file.storageKey )
				);
				const beforeCleanupCount = Object.keys( manifest ).length;
				const cleanedManifest = cleanupManifest(
					manifest,
					currentFileKeys
				);
				const afterCleanupCount = Object.keys( cleanedManifest ).length;
				const removedCount = beforeCleanupCount - afterCleanupCount;

				debug(
					`Manifest cleanup: ${ beforeCleanupCount } entries → ${ afterCleanupCount } entries (${ removedCount } removed, ${ currentFileKeys.size } current files)`
				);

				await uploadManifest(
					storageService,
					siteKey,
					cleanedManifest
				);

				// Add success message after manifest update
				if ( setStatusMessage ) {
					setStatusMessage(
						'Updated file manifest',
						'success',
						'updateManifest'
					);
				}

				// Log summary statistics for hash-based deduplication
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
			} catch ( error ) {
				debugWarn( 'Failed to upload manifest:', error );
				// Don't fail publish if manifest upload fails
			}

			// Remove the "Uploading files" progress message at the end
			// This message is just for progress tracking and not needed in final history
			if ( removeMessage ) {
				removeMessage( 'uploadFilesProgress' );
			}

			// Return comprehensive result object.
			// Used by usePublishController to track success/failure and update job status.
			return {
				success: failures.urlsFailed === 0,
				urlsProcessed: totalUrls,
				urlsSucceeded: failures.urlsSucceeded,
				urlsFailed: failures.urlsFailed,
				assetsUploaded: assetTracker.getCount(),
				assetsFailed: failures.assetsFailed,
				failedUrls: failures.failedUrls,
				uploadedFiles, // List of all uploaded files (for manifest).
				filesUploaded, // Number of files uploaded (for progress calculation).
				filesSkipped, // Number of files skipped (for reporting).
				totalFilesToUpload, // Total files to upload (for progress calculation).
			};
		},
		[ onProgress ]
	);

	return processUrls;
}
