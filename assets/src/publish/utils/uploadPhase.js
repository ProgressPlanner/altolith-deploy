/**
 * Upload Phase
 *
 * Phase 2 of static site generation: Upload all files with accurate progress tracking.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { processHtml, getStaticFilePath } from './htmlProcessor';
import { getAssetLocalPath } from './assetExtractor';
import { uploadFilesWithProgress } from './fileUploadManager';
import { debug, debugWarn } from '@aether/utils/debug';
import { calculateFileHash } from '@aether/utils/fileHash';
import {
	fetchManifest,
	updateManifestEntry,
	shouldSkipUpload,
	uploadManifest,
	cleanupManifest,
} from '@aether/utils/manifestManager';

/**
 * Fetch and prepare manifest for upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<Object>} Manifest object.
 */
export async function prepareManifest(
	storageService,
	providerId,
	setStatusMessage
) {
	let manifest = {};

	try {
		if ( setStatusMessage ) {
			setStatusMessage(
				__( 'Fetching file manifest…', 'aether-site-exporter' ),
				'progress',
				'fetchManifest'
			);
		}

		manifest = applyFilters(
			'aether.manifest.fetch',
			null,
			storageService,
			providerId
		);

		if ( manifest === null ) {
			manifest = await fetchManifest( storageService );
		}

		const manifestEntryCount = Object.keys( manifest ).length;
		if ( setStatusMessage ) {
			setStatusMessage(
				sprintf(
					/* translators: %d: Number of manifest entries */
					__(
						'Fetched file manifest (%d entries)',
						'aether-site-exporter'
					),
					manifestEntryCount
				),
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

	return manifest;
}

/**
 * Process and upload assets for a given set of asset URLs.
 *
 * @param {Object}   options                    Upload options.
 * @param {Array}    options.assetUrls          Asset URLs to process.
 * @param {Object}   options.assetTracker       Asset tracker instance.
 * @param {Object}   options.storageService     Storage service instance.
 * @param {Object}   options.manifest           Manifest object.
 * @param {string}   options.providerId         Provider ID.
 * @param {number}   options.filesUploaded      Current files uploaded count.
 * @param {number}   options.totalFilesToUpload Total files to upload.
 * @param {Function} options.onProgress         Progress callback.
 * @param {Function} options.setStatusMessage   Status message updater.
 * @return {Promise<Object>} Updated counts and manifest.
 */
export async function processAssets( {
	assetUrls,
	assetTracker,
	storageService,
	manifest,
	providerId,
	filesUploaded,
	totalFilesToUpload,
	onProgress,
	setStatusMessage,
} ) {
	let currentFilesUploaded = filesUploaded;
	let filesSkipped = 0;
	const uploadedFiles = [];
	let currentManifest = manifest;

	// Filter out already processed assets
	const assetsNotInTracker = assetUrls.filter(
		( assetUrl ) => ! assetTracker.isUploaded( assetUrl )
	);

	if ( assetsNotInTracker.length === 0 ) {
		return {
			filesUploaded: currentFilesUploaded,
			filesSkipped,
			uploadedFiles,
			manifest: currentManifest,
		};
	}

	// Fetch and prepare asset data
	const assetData = [];
	for ( const assetUrl of assetsNotInTracker ) {
		try {
			const assetResponse = await fetch( assetUrl, {
				method: 'GET',
				credentials: 'omit',
				headers: {
					'User-Agent': 'Aether Static Site Generator',
				},
			} );

			if ( assetResponse.status !== 200 ) {
				continue;
			}

			const assetContent = await assetResponse.blob();
			const contentType =
				assetResponse.headers.get( 'content-type' ) ||
				'application/octet-stream';

			const assetPath = getAssetLocalPath( assetUrl );

			if ( assetPath === null ) {
				debugWarn(
					`Skipping invalid asset URL (empty path after scope stripping): ${ assetUrl }`
				);
				assetTracker.markFailed( assetUrl );
				continue;
			}

			const assetKey = assetPath;
			let assetBlob = new Blob( [ assetContent ], { type: contentType } );

			// Filter asset before processing
			const filteredAssetData = applyFilters(
				'aether.static.asset.process',
				{
					blob: assetBlob,
					path: assetPath,
					key: assetKey,
					contentType,
					url: assetUrl,
				},
				providerId
			);

			assetBlob = filteredAssetData.blob || assetBlob;
			const finalAssetPath = filteredAssetData.path || assetPath;
			const finalAssetKey = filteredAssetData.key || assetKey;
			const finalContentType =
				filteredAssetData.contentType || contentType;

			// Check manifest for skip
			const existingEntry = currentManifest[ finalAssetKey ];
			if ( existingEntry && existingEntry.size === assetBlob.size ) {
				try {
					const assetHash = await calculateFileHash( assetBlob );
					if (
						shouldSkipUpload(
							currentManifest,
							finalAssetKey,
							assetBlob.size,
							assetHash
						)
					) {
						assetTracker.markUploaded( assetUrl );
						currentFilesUploaded++;
						filesSkipped++;
						uploadedFiles.push( {
							storageKey: finalAssetKey,
							relativePath: finalAssetPath,
							contentType: finalContentType,
						} );
						continue;
					}
				} catch ( error ) {
					debugWarn(
						'Failed to calculate hash for manifest check, will upload:',
						assetUrl,
						error
					);
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
			debugWarn( 'Failed to fetch asset:', assetUrl, error );
		}
	}

	// Prepare files for upload
	const filesToUpload = assetData.map( ( data ) => ( {
		key: data.assetKey,
		blob: data.assetBlob,
		contentType: data.contentType,
		displayName: data.assetPath || data.assetKey || 'file',
		metadata: {},
		assetData: data,
	} ) );

	// Upload in parallel
	const uploadResult = await uploadFilesWithProgress( {
		files: filesToUpload,
		storageService,
		setStatusMessage,
		concurrency: 5,
		onProgress: ( uploaded ) => {
			if ( onProgress ) {
				onProgress(
					currentFilesUploaded + uploaded,
					totalFilesToUpload,
					null
				);
			}
		},
		keyPrefix: 'upload',
		skipHashCheck: false,
		manifest: currentManifest,
		shouldSkipUpload,
	} );

	// Process results
	for ( const result of uploadResult.results ) {
		const fileData = filesToUpload.find( ( f ) => f.key === result.key );
		if ( ! fileData ) {
			debugWarn( 'Could not find fileData for result key:', result.key );
			continue;
		}

		const { assetUrl, assetPath, assetKey, contentType } =
			fileData.assetData;

		if ( result.success ) {
			assetTracker.markUploaded( assetUrl );
			currentFilesUploaded++;

			if ( result.skipped ) {
				filesSkipped++;
			}

			if ( result.hash ) {
				currentManifest = updateManifestEntry(
					currentManifest,
					assetKey,
					result.size || fileData.blob.size,
					result.hash,
					contentType
				);

				currentManifest = applyFilters(
					'aether.manifest.update',
					currentManifest,
					assetKey,
					providerId
				);
			}

			uploadedFiles.push( {
				storageKey: assetKey,
				relativePath: assetPath,
				contentType,
			} );
		}
	}

	return {
		filesUploaded: currentFilesUploaded,
		filesSkipped,
		uploadedFiles,
		manifest: currentManifest,
	};
}

/**
 * Upload a single HTML file.
 *
 * @param {Object}   options                  Upload options.
 * @param {string}   options.url              Page URL.
 * @param {string}   options.rawHtml          Raw HTML content.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.staticSiteUrl    Target static site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.storageService   Storage service instance.
 * @param {Object}   options.manifest         Manifest object.
 * @param {Function} options.setStatusMessage Status message updater.
 * @return {Promise<Object>} Upload result.
 */
export async function uploadHtmlFile( {
	url,
	rawHtml,
	siteUrl,
	staticSiteUrl,
	providerId,
	storageService,
	manifest,
	setStatusMessage,
} ) {
	// Filter HTML before processing
	let processedHtml = applyFilters(
		'aether.static.html.process',
		rawHtml,
		url,
		siteUrl,
		staticSiteUrl,
		providerId
	);

	// Process HTML with URL rewriting
	processedHtml = processHtml( processedHtml, url, siteUrl, staticSiteUrl );

	const htmlPath = getStaticFilePath( url );
	const htmlKey = htmlPath;
	const htmlBlob = new Blob( [ processedHtml ], { type: 'text/html' } );

	const htmlSize = htmlBlob.size;
	let htmlHash = null;
	let shouldSkip = false;

	// Check manifest for skip
	const existingEntry = manifest[ htmlKey ];
	if ( existingEntry && existingEntry.size === htmlSize ) {
		try {
			htmlHash = await calculateFileHash( htmlBlob );
			shouldSkip = shouldSkipUpload(
				manifest,
				htmlKey,
				htmlSize,
				htmlHash
			);
		} catch ( error ) {
			debugWarn( 'Failed to calculate hash, will upload:', error );
			shouldSkip = false;
		}
	}

	if ( shouldSkip ) {
		return {
			success: true,
			skipped: true,
			htmlPath,
			htmlKey,
			htmlHash,
			htmlSize,
		};
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

	// Upload status
	if ( setStatusMessage ) {
		setStatusMessage(
			`Uploading ${ htmlPath }`,
			'progress',
			`upload-${ htmlPath }`
		);
	}

	const htmlUploadResult = await storageService.upload( htmlKey, htmlBlob, {
		contentType: 'text/html',
	} );

	if ( ! htmlUploadResult.success ) {
		throw new Error(
			sprintf(
				/* translators: %s: Error message */
				__( 'Failed to upload HTML file: %s', 'aether-site-exporter' ),
				htmlUploadResult.error
			)
		);
	}

	if ( setStatusMessage ) {
		setStatusMessage(
			sprintf(
				/* translators: %s: File path */
				__( 'Uploaded %s', 'aether-site-exporter' ),
				htmlPath
			),
			'success',
			`upload-${ htmlPath }`
		);
	}

	return {
		success: true,
		skipped: false,
		htmlPath,
		htmlKey,
		htmlHash,
		htmlSize,
	};
}

/**
 * Finalize manifest after upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {Object}   manifest         Manifest object.
 * @param {Array}    uploadedFiles    Array of uploaded file info.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<void>}
 */
export async function finalizeManifest(
	storageService,
	manifest,
	uploadedFiles,
	providerId,
	setStatusMessage
) {
	try {
		if ( setStatusMessage ) {
			setStatusMessage(
				__( 'Updating file manifest…', 'aether-site-exporter' ),
				'progress',
				'updateManifest'
			);
		}

		const currentFileKeys = new Set(
			uploadedFiles.map( ( file ) => file.storageKey )
		);
		const beforeCleanupCount = Object.keys( manifest ).length;
		let cleanedManifest = cleanupManifest( manifest, currentFileKeys );

		cleanedManifest = applyFilters(
			'aether.manifest.cleanup',
			cleanedManifest,
			currentFileKeys,
			providerId
		);

		const afterCleanupCount = Object.keys( cleanedManifest ).length;
		const removedCount = beforeCleanupCount - afterCleanupCount;

		debug(
			`Manifest cleanup: ${ beforeCleanupCount } entries → ${ afterCleanupCount } entries (${ removedCount } removed, ${ currentFileKeys.size } current files)`
		);

		await uploadManifest( storageService, cleanedManifest );

		if ( setStatusMessage ) {
			setStatusMessage(
				__( 'Updated file manifest', 'aether-site-exporter' ),
				'success',
				'updateManifest'
			);
		}
	} catch ( error ) {
		debugWarn( 'Failed to upload manifest:', error );
	}
}
