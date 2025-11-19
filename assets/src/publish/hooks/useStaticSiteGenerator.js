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
import { doAction, applyFilters } from '@wordpress/hooks';
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
				// Get provider for static_site deployment type
				// Dynamic import to avoid circular dependencies
				const providerDiscovery = await import(
					'../../providers/utils/providerDiscovery'
				);
				const discoveredStaticSiteProviderId =
					await providerDiscovery.getProviderForDeploymentType(
						'static_site'
					);

				// Use instance ID parameter if provided (multi-instance support)
				// Otherwise use discovered provider type (legacy single-instance)
				const providerIdToUse =
					staticSiteProviderId || discoveredStaticSiteProviderId;

				if ( providerIdToUse ) {
					const configResponse = await apiFetch( {
						path: `/aether/site-exporter/providers/${ providerIdToUse }`,
					} );
					if ( configResponse.success && configResponse.config ) {
						providerConfig = configResponse.config;
					}
				}
			} catch ( error ) {
				debug( 'Failed to load provider configuration:', error );
			}

			// Configure local filesystem storage
			const staticPath = providerConfig.static_files_path || 'static/';

			const config = {
				public_url: siteUrl,
				base_url: staticSiteUrl || siteUrl,
				provider_id: staticSiteProviderId,
			};

			debug( 'Static site storage configuration:', {
				staticPath,
				providerId: staticSiteProviderId,
			} );

			/**
			 * Filter storage service configuration before creation.
			 *
			 * Allows providers to customize storage service configuration.
			 *
			 * @param {Object} config               Storage service configuration.
			 * @param {string} staticPath           Static files path.
			 * @param {string} staticSiteProviderId Provider ID.
			 * @param {Object} providerConfig       Provider configuration.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('aether.storage.service.config', 'my-provider', (config, staticPath, providerId, providerConfig) => {
			 *   return {
			 *     ...config,
			 *     customOption: 'value'
			 *   };
			 * });
			 */
			const filteredConfig = applyFilters(
				'aether.storage.service.config',
				config,
				staticPath,
				staticSiteProviderId,
				providerConfig
			);

			/**
			 * Filter storage service creation.
			 *
			 * Allows providers to override StorageService creation with custom implementation.
			 *
			 * @param {StorageService|null} storageService Storage service instance or null to use default.
			 * @param {string}              staticPath     Static files path.
			 * @param {Object}              config         Storage service configuration.
			 * @param {string}              providerId     Provider ID.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('aether.storage.service.create', 'my-provider', (service, staticPath, config, providerId) => {
			 *   if (providerId === 'my-provider') {
			 *     return new CustomStorageService(staticPath, config);
			 *   }
			 *   return service; // Use default
			 * });
			 */
			let storageService = applyFilters(
				'aether.storage.service.create',
				null,
				staticPath,
				filteredConfig,
				staticSiteProviderId
			);

			// Create storage service if not overridden by filter
			if ( ! storageService ) {
				storageService = new StorageService(
					staticPath,
					'',
					filteredConfig
				);
			}

			const totalUrls = urls.length;

			// PHASE 1: Pre-scan all URLs to discover total file count
			// This allows us to report accurate progress (X of Y files) instead of growing totals

			/**
			 * Action fired before pre-scan phase starts.
			 *
			 * @param {Array}  urls                 URLs to scan.
			 * @param {string} staticSiteProviderId Provider ID.
			 * @param {Object} providerConfig       Provider configuration.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.static.pre_scan.before', 'my-provider', (urls, providerId, config) => {
			 *   console.log('Starting pre-scan for', urls.length, 'URLs');
			 * });
			 */
			doAction(
				'aether.static.pre_scan.before',
				urls,
				staticSiteProviderId,
				providerConfig
			);

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

					/**
					 * Filter raw HTML before caching.
					 *
					 * Allows providers to modify HTML before caching.
					 * NOTE: URL rewriting happens later during upload, per-provider.
					 *
					 * @param {string} html    Raw HTML content.
					 * @param {string} url     Page URL.
					 * @param {string} siteUrl Site URL.
					 *
					 * @example
					 * import { addFilter } from '@wordpress/hooks';
					 *
					 * addFilter('aether.static.html.raw', 'my-provider', (html, url, siteUrl) => {
					 *   // Add custom meta tag
					 *   return html.replace('</head>', '<meta name="custom" content="value" /></head>');
					 * });
					 */
					const filteredRawHtml = applyFilters(
						'aether.static.html.raw',
						html,
						url,
						siteUrl
					);

					// Cache RAW HTML (before URL rewriting) and asset URLs in IndexedDB
					// URL rewriting will happen per-provider during upload phase
					// No size limit - IndexedDB can handle thousands of URLs
					await cache.set( url, filteredRawHtml, assetUrls );
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

			/**
			 * Action fired after pre-scan phase completes.
			 *
			 * @param {Object} stats                Pre-scan statistics.
			 * @param {number} stats.urlsScanned    Total URLs scanned.
			 * @param {number} stats.urlsSuccessful URLs successfully cached.
			 * @param {number} stats.uniqueAssets   Unique assets discovered.
			 * @param {number} stats.totalFiles     Total files to upload.
			 * @param {string} staticSiteProviderId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.static.pre_scan.after', 'my-provider', (stats, providerId) => {
			 *   console.log('Pre-scan complete:', stats);
			 * });
			 */
			doAction(
				'aether.static.pre_scan.after',
				{
					urlsScanned: urls.length,
					urlsSuccessful: cacheStats.sessionCached,
					uniqueAssets: allUniqueAssets.size,
					totalFiles: totalFilesToUpload,
				},
				staticSiteProviderId
			);

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

				/**
				 * Filter manifest before fetching.
				 *
				 * Allows providers to customize manifest fetching or provide custom manifest.
				 *
				 * @param {Object|null} manifest             Manifest object or null to fetch from storage.
				 * @param {Object}      storageService       Storage service instance.
				 * @param {string}      staticSiteProviderId Provider ID.
				 *
				 * @example
				 * import { addFilter } from '@wordpress/hooks';
				 *
				 * addFilter('aether.manifest.fetch', 'my-provider', (manifest, storageService, providerId) => {
				 *   // Return custom manifest or null to use default fetching
				 *   if (providerId === 'my-provider') {
				 *     return { custom: 'manifest' };
				 *   }
				 *   return manifest; // Use default
				 * });
				 */
				manifest = applyFilters(
					'aether.manifest.fetch',
					null,
					storageService,
					staticSiteProviderId
				);

				// If filter returned null, fetch from storage
				if ( manifest === null ) {
					manifest = await fetchManifest( storageService );
				}
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

						// Skip invalid assets (empty path after Playground scope stripping)
						if ( assetPath === null ) {
							debugWarn(
								`Skipping invalid asset URL (empty path after scope stripping): ${ assetUrl }`
							);
							assetTracker.markFailed( assetUrl );
							continue;
						}

						const assetKey = assetPath;

						// Create blob with appropriate content type.
						let assetBlob = new Blob( [ assetContent ], {
							type: contentType,
						} );

						/**
						 * Filter asset before processing.
						 *
						 * Allows providers to modify asset blob, path, or metadata before upload.
						 *
						 * @param {Object} assetData             Asset data object.
						 * @param {Blob}   assetData.blob        Asset blob.
						 * @param {string} assetData.path        Asset local path.
						 * @param {string} assetData.key         Storage key.
						 * @param {string} assetData.contentType Content type.
						 * @param {string} assetData.url         Original asset URL.
						 * @param {string} staticSiteProviderId  Provider ID.
						 *
						 * @example
						 * import { addFilter } from '@wordpress/hooks';
						 *
						 * addFilter('aether.static.asset.process', 'my-provider', (assetData, providerId) => {
						 *   // Modify asset blob
						 *   return {
						 *     ...assetData,
						 *     blob: new Blob([assetData.blob], { type: 'image/webp' })
						 *   };
						 * });
						 */
						const filteredAssetData = applyFilters(
							'aether.static.asset.process',
							{
								blob: assetBlob,
								path: assetPath,
								key: assetKey,
								contentType,
								url: assetUrl,
							},
							staticSiteProviderId
						);

						// Use filtered asset data
						assetBlob = filteredAssetData.blob || assetBlob;
						const finalAssetPath =
							filteredAssetData.path || assetPath;
						const finalAssetKey = filteredAssetData.key || assetKey;
						const finalContentType =
							filteredAssetData.contentType || contentType;

						// Step 3: Check manifest BEFORE adding to upload queue
						// This prevents unnecessary uploads for assets that already exist in manifest
						const existingEntry = manifest[ finalAssetKey ];
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
										finalAssetKey,
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
										storageKey: finalAssetKey,
										relativePath: finalAssetPath,
										contentType: finalContentType,
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
							assetPath: finalAssetPath,
							assetKey: finalAssetKey,
							assetBlob,
							contentType: finalContentType,
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

							/**
							 * Filter manifest after asset entry update.
							 *
							 * Allows providers to modify manifest after asset entry is updated.
							 *
							 * @param {Object} manifest             Manifest object.
							 * @param {string} storageKey           Storage key that was updated.
							 * @param {string} staticSiteProviderId Provider ID.
							 */
							manifest = applyFilters(
								'aether.manifest.update',
								manifest,
								assetKey,
								staticSiteProviderId
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

			/**
			 * Action fired before upload phase starts.
			 *
			 * @param {Array}  cachedUrls           URLs to upload.
			 * @param {number} totalFilesToUpload   Total files to upload.
			 * @param {string} staticSiteProviderId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.static.upload.before', 'my-provider', (urls, totalFiles, providerId) => {
			 *   console.log('Starting upload phase:', totalFiles, 'files');
			 * });
			 */
			doAction(
				'aether.static.upload.before',
				cachedUrls,
				totalFilesToUpload,
				staticSiteProviderId
			);

			// Process each URL sequentially and upload files
			for ( const url of cachedUrls ) {
				const cached = await cache.get( url );
				if ( ! cached ) {
					debugWarn(
						`[Aether] Cache miss for URL: ${ url } - skipping`
					);
					continue;
				}
				const { processedHtml: rawHtml, assetUrls } = cached;

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

					/**
					 * Filter HTML before provider-specific processing.
					 *
					 * Allows providers to modify HTML before URL rewriting.
					 *
					 * @param {string} html                 Raw HTML content.
					 * @param {string} url                  Page URL.
					 * @param {string} siteUrl              Site URL.
					 * @param {string} staticSiteUrl        Provider-specific deployment URL.
					 * @param {string} staticSiteProviderId Provider ID.
					 *
					 * @example
					 * import { addFilter } from '@wordpress/hooks';
					 *
					 * addFilter('aether.static.html.process', 'my-provider', (html, url, siteUrl, staticSiteUrl, providerId) => {
					 *   // Add custom meta tag
					 *   return html.replace('</head>', '<meta name="custom" content="value" /></head>');
					 * });
					 */
					let processedHtml = applyFilters(
						'aether.static.html.process',
						rawHtml,
						url,
						siteUrl,
						staticSiteUrl,
						staticSiteProviderId
					);

					// Process HTML with provider-specific deployment URL
					// This includes URL rewriting, admin bar removal, etc.
					processedHtml = processHtml(
						processedHtml,
						url,
						siteUrl,
						staticSiteUrl
					);

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

						/**
						 * Filter manifest after entry update.
						 *
						 * Allows providers to modify manifest after entry is updated.
						 *
						 * @param {Object} manifest             Manifest object.
						 * @param {string} storageKey           Storage key that was updated.
						 * @param {string} staticSiteProviderId Provider ID.
						 *
						 * @example
						 * import { addFilter } from '@wordpress/hooks';
						 *
						 * addFilter('aether.manifest.update', 'my-provider', (manifest, storageKey, providerId) => {
						 *   // Add custom metadata to manifest entry
						 *   if (manifest[storageKey]) {
						 *     manifest[storageKey].customMetadata = 'value';
						 *   }
						 *   return manifest;
						 * });
						 */
						manifest = applyFilters(
							'aether.manifest.update',
							manifest,
							htmlKey,
							staticSiteProviderId
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
				let cleanedManifest = cleanupManifest(
					manifest,
					currentFileKeys
				);

				/**
				 * Filter manifest before final cleanup and upload.
				 *
				 * Allows providers to customize manifest cleanup logic.
				 *
				 * @param {Object} manifest             Cleaned manifest object.
				 * @param {Set}    currentFileKeys      Set of current file keys.
				 * @param {string} staticSiteProviderId Provider ID.
				 *
				 * @example
				 * import { addFilter } from '@wordpress/hooks';
				 *
				 * addFilter('aether.manifest.cleanup', 'my-provider', (manifest, currentFileKeys, providerId) => {
				 *   // Keep additional entries
				 *   return { ...manifest, 'custom-file.html': { size: 100, hash: 'abc' } };
				 * });
				 */
				cleanedManifest = applyFilters(
					'aether.manifest.cleanup',
					cleanedManifest,
					currentFileKeys,
					staticSiteProviderId
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

			/**
			 * Action fired after upload phase completes.
			 *
			 * @param {Object} result               Upload result statistics.
			 * @param {number} result.filesUploaded Files uploaded.
			 * @param {number} result.filesSkipped  Files skipped.
			 * @param {number} result.urlsSucceeded URLs succeeded.
			 * @param {number} result.urlsFailed    URLs failed.
			 * @param {string} staticSiteProviderId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.static.upload.after', 'my-provider', (result, providerId) => {
			 *   console.log('Upload phase complete:', result);
			 * });
			 */
			doAction(
				'aether.static.upload.after',
				{
					filesUploaded,
					filesSkipped,
					urlsSucceeded: failures.urlsSucceeded,
					urlsFailed: failures.urlsFailed,
					assetsUploaded: assetTracker.getCount(),
				},
				staticSiteProviderId
			);

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
