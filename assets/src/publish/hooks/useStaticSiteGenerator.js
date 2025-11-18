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
import { StorageService } from '../../providers/services/storageService';
import { processHtml, getStaticFilePath } from '../utils/htmlProcessor';
import {
	extractAssetsFromHtml,
	getAssetLocalPath,
} from '../utils/assetExtractor';
import { createAssetTracker } from '../utils/assetTracker';
import { debug, debugWarn } from '../../utils/debug';
import { calculateFileHash } from '../../utils/fileHash';
import StaticSiteCache from '../../utils/staticSiteCache';
import {
	fetchManifest,
	updateManifestEntry,
	shouldSkipUpload,
	uploadManifest,
	cleanupManifest,
} from '../../utils/manifestManager';
import { uploadFilesWithProgress } from '../utils/fileUploadManager';
import apiFetch from '../../utils/api';

// WordPress Playground root URL constant removed - not currently used
// const AETHER_PLAYGROUND_ROOT_URL = 'https://static-wp.s12y.org/index.html';

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

			// Get provider configuration
			let providerConfig = {};
			try {
				const settingsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );
				if ( settingsResponse.success && settingsResponse.value ) {
					providerConfig =
						settingsResponse.value[ 'local-filesystem' ] || {};
				}
			} catch ( error ) {
				debug( 'Failed to load provider configuration:', error );
			}

			// Configure local filesystem storage
			const staticPath = providerConfig.static_files_path || 'static/';

			const config = {
				public_url: siteUrl,
				base_url: staticSiteUrl || siteUrl,
			};

			debug( 'Static site storage configuration:', {
				staticPath,
			} );

			// Create storage service (jobId no longer needed for path)
			const storageService = new StorageService( staticPath, '', config );

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
			// Using IndexedDB for unlimited caching (instead of RAM-limited Map)
			const cache = new StaticSiteCache();
			const allUniqueAssets = new Set(); // Track unique assets across all URLs

			// Log cache health
			const cacheHealth = await cache.getHealth();
			if ( cacheHealth.usingFallback ) {
				debugWarn(
					'[Aether] IndexedDB not available, using in-memory fallback (500 URL limit)'
				);
			}
			if ( cacheHealth.recommendations.length > 0 ) {
				cacheHealth.recommendations.forEach( ( rec ) =>
					debugWarn( `[Aether] ${ rec }` )
				);
			}

			// Clean up old caches before starting
			const cleanedCount = await cache.cleanup();
			if ( cleanedCount > 0 ) {
				debug(
					`[Aether] Cleaned up ${ cleanedCount } old cache entries`
				);
			}

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

					// Cache processed HTML and asset URLs in IndexedDB
					// No size limit - IndexedDB can handle thousands of URLs
					await cache.set( url, processedHtml, assetUrls );
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

			// Calculate total files: HTML files + unique assets
			const cacheStats = await cache.getStats();
			const totalFilesToUpload =
				cacheStats.sessionCached + // HTML files successfully cached
				allUniqueAssets.size; // Unique assets across all pages

			debug( 'Pre-scan complete:', {
				urlsScanned: urls.length,
				urlsSuccessful: cacheStats.sessionCached,
				uniqueAssets: allUniqueAssets.size,
				totalFilesToUpload,
			} );

			if ( setStatusMessage ) {
				setStatusMessage(
					`Pre-scan complete: ${ cacheStats.sessionCached } HTML files, ${ allUniqueAssets.size } assets`,
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
				manifest = await fetchManifest( storageService );
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
						const assetKey = assetPath;

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
										relativePath: assetPath,
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
							relativePath: assetPath,
							contentType,
						} );
					}
				}
			};

			// Get all cached URLs from IndexedDB
			const cachedUrls = await cache.getAllUrls();

			// Process each URL sequentially and upload files
			for ( const url of cachedUrls ) {
				const cached = await cache.get( url );
				if ( ! cached ) {
					debugWarn(
						`[Aether] Cache miss for URL: ${ url } - skipping`
					);
					continue;
				}
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
					const htmlPath = getStaticFilePath( url );
					const htmlKey = htmlPath;
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
							relativePath: htmlPath,
							contentType: 'text/html',
						} );

						if ( setStatusMessage ) {
							const uploadKey = `upload-${ htmlPath }`;
							setStatusMessage(
								`Skipped unchanged file ${ htmlPath }`,
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
							`Uploading ${ htmlPath }`,
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
							`Uploaded ${ htmlPath }`,
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
							await uploadManifest( storageService, manifest );
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
						relativePath: htmlPath,
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

			// Clean up cache for this session
			// Cache will be automatically cleaned up after 24 hours anyway
			const cacheCleanedCount = await cache.clearSession();
			if ( cacheCleanedCount > 0 ) {
				debug(
					`[Aether] Cleared ${ cacheCleanedCount } cache entries from this session`
				);
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

				await uploadManifest( storageService, cleanedManifest );

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
