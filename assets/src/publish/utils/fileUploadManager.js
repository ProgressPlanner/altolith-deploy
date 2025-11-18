/**
 * File Upload Manager Utility
 *
 * Provides reusable functions for uploading files with progress tracking,
 * concurrency limiting, and hash-based deduplication.
 *
 * Used by:
 * - Static site file uploads (useStaticSiteGenerator.js)
 * - wp-content.zip uploads (usePublishController.js)
 *
 * @package
 */

import { createConcurrencyLimiter } from '../../utils/concurrencyLimiter';
import { getFileHashCache } from '../../utils/fileHashCache';
import { shouldSkipUpload } from '../../utils/manifestManager';
import { debugWarn } from '../../utils/debug';

/**
 * Sanitize a storage key for use in status message keys.
 *
 * @param {string} key Storage key.
 * @return {string} Sanitized key.
 */
export function sanitizeKeyForStatus( key ) {
	// Replace special characters that might cause issues in status keys
	return key.replace( /[^a-zA-Z0-9-_]/g, '-' );
}

/**
 * Upload multiple files with progress tracking and concurrency limiting.
 *
 * @typedef {Object} FileUploadDescriptor
 * @property {string}                 key                           Storage key/path.
 * @property {Blob}                   blob                          File blob to upload.
 * @property {string}                 contentType                   MIME type.
 * @property {string}                 [displayName]                 Display name for progress messages (optional).
 * @property {Object}                 [metadata]                    Optional metadata object.
 *
 * @param    {Object}                 options                       Options object.
 * @param    {FileUploadDescriptor[]} options.files                 Array of file upload descriptors.
 * @param    {Object}                 options.storageService        StorageService instance.
 * @param    {Function}               options.setStatusMessage      Status message callback function.
 * @param    {number}                 [options.concurrency=5]       Max concurrent uploads (default: 5).
 * @param    {Function}               [options.onProgress]          Overall progress callback (optional).
 * @param    {string}                 [options.keyPrefix='upload']  Prefix for status message keys (default: 'upload').
 * @param    {boolean}                [options.skipHashCheck=false] Boolean to skip hash checking (default: false).
 * @param    {Object}                 [options.manifest]            Manifest object for hash checking (optional).
 * @param    {Function}               [options.shouldSkipUpload]    Custom function to determine if file should be skipped (optional).
 * @return {Promise<Object>} Result with success, uploaded, skipped, failed counts and results array.
 */
export async function uploadFilesWithProgress( {
	files,
	storageService,
	setStatusMessage,
	concurrency = 5,
	onProgress = null,
	keyPrefix = 'upload',
	skipHashCheck = false,
	manifest = null,
	shouldSkipUpload: customShouldSkipUpload = null,
} ) {
	if ( ! files || files.length === 0 ) {
		return {
			success: true,
			uploaded: 0,
			skipped: 0,
			failed: 0,
			results: [],
		};
	}

	const limiter = createConcurrencyLimiter( concurrency );
	let filesUploaded = 0;
	let filesSkipped = 0;
	let filesFailed = 0;
	let totalProcessed = 0; // Track total processed (uploaded + skipped) for progress
	const results = [];

	// Process all files in parallel with concurrency limiting
	const uploadPromises = files.map( ( file ) =>
		limiter( async () => {
			const {
				key,
				blob,
				contentType,
				displayName: providedDisplayName,
				metadata = {},
			} = file;

			// Ensure displayName is never empty - fallback to key, then to 'file'
			const displayName = providedDisplayName || key || 'file';

			const uploadKey = `${ keyPrefix }-${ sanitizeKeyForStatus( key ) }`;
			let fileHash = null;
			let shouldSkip = false;

			try {
				// Hash checking and skip logic (if enabled)
				if ( ! skipHashCheck && manifest ) {
					const fileSize = blob.size;
					const existingEntry = manifest[ key ];

					if ( existingEntry && existingEntry.size === fileSize ) {
						// Stage 2: Calculate hash if size matches
						try {
							const hashCache = getFileHashCache();
							fileHash = await hashCache.getOrCalculateHash(
								blob,
								key
							);
							shouldSkip = customShouldSkipUpload
								? customShouldSkipUpload(
										manifest,
										key,
										fileSize,
										fileHash
								  )
								: shouldSkipUpload(
										manifest,
										key,
										fileSize,
										fileHash
								  );
						} catch ( error ) {
							debugWarn(
								'Failed to calculate file hash, will upload:',
								error
							);
							shouldSkip = false;
						}
					}
				}

				if ( shouldSkip ) {
					// File unchanged - skip upload
					filesSkipped++;
					totalProcessed++;

					if ( setStatusMessage ) {
						setStatusMessage(
							`Skipped unchanged file ${ displayName }`,
							'success',
							uploadKey
						);
					}

					// Report progress (guard against empty array to prevent division by zero)
					if ( onProgress && files.length > 0 ) {
						onProgress( totalProcessed, files.length, null );
					}

					results.push( {
						key,
						success: true,
						skipped: true,
						url: null,
						hash: fileHash, // Include hash so skipped files can be added to manifest
						size: blob.size, // Include size for consistency
					} );

					return;
				}

				// Calculate hash if not already calculated (for manifest update)
				if ( ! fileHash && ! skipHashCheck ) {
					try {
						const hashCache = getFileHashCache();
						fileHash = await hashCache.getOrCalculateHash(
							blob,
							key
						);
					} catch ( error ) {
						debugWarn( 'Failed to calculate hash:', error );
						fileHash = null;
					}
				}

				const fileSize = blob.size;

				// Create status message with unique key for progress tracking
				if ( setStatusMessage ) {
					setStatusMessage(
						`Uploading ${ displayName }`,
						'progress',
						uploadKey,
						{
							percent: 0,
							loaded: 0,
							total: fileSize,
						}
					);
				}

				// Debug: Log before upload
				console.log( '[fileUploadManager] About to upload:', {
					key,
					displayName,
					contentType,
					blobSize: blob?.size,
					keyIsEmpty: ! key || key === '',
				} );

				// Upload file with progress tracking
				const uploadResult = await storageService.upload( key, blob, {
					contentType,
					cacheControl:
						metadata.cacheControl ||
						'public, max-age=31536000, immutable',
					onProgress: ( loaded, total, percent ) => {
						// Update progress in status message
						if ( setStatusMessage ) {
							setStatusMessage(
								`Uploading ${ displayName }`,
								'progress',
								uploadKey,
								{
									percent,
									loaded,
									total,
								}
							);
						}
					},
				} );

				if ( uploadResult.success ) {
					filesUploaded++;
					totalProcessed++;

					// Update message to success (remove progress)
					if ( setStatusMessage ) {
						setStatusMessage(
							`Uploaded ${ displayName }`,
							'success',
							uploadKey,
							null // Remove progress
						);
					}

					// Report progress after upload completes (guard against empty array)
					if ( onProgress && files.length > 0 ) {
						onProgress( totalProcessed, files.length, null );
					}

					results.push( {
						key,
						success: true,
						skipped: false,
						url: uploadResult.url,
						hash: fileHash,
						size: fileSize,
					} );
				} else {
					// Upload failed
					filesFailed++;

					if ( setStatusMessage ) {
						setStatusMessage(
							`Failed to upload ${ displayName }`,
							'error',
							uploadKey,
							null
						);
					}

					results.push( {
						key,
						success: false,
						skipped: false,
						url: null,
						error: uploadResult.error || 'Upload failed',
					} );
				}
			} catch ( error ) {
				// Failed to process file
				filesFailed++;
				debugWarn( `Failed to upload file: ${ key }`, error );

				if ( setStatusMessage ) {
					setStatusMessage(
						`Failed to upload ${ displayName }`,
						'error',
						uploadKey,
						null
					);
				}

				results.push( {
					key,
					success: false,
					skipped: false,
					url: null,
					error: error.message || 'Upload failed',
				} );
			}
		} )
	);

	// Wait for all uploads to complete (success or failure)
	await Promise.allSettled( uploadPromises );

	return {
		success: filesFailed === 0,
		uploaded: filesUploaded,
		skipped: filesSkipped,
		failed: filesFailed,
		results,
	};
}

/**
 * Upload a single file with progress tracking.
 *
 * @param {Object}   options                  Options object.
 * @param {string}   options.key              Storage key.
 * @param {Blob}     options.blob             File blob.
 * @param {Object}   options.storageService   StorageService instance.
 * @param {Function} options.setStatusMessage Status message callback.
 * @param {string}   options.contentType      MIME type.
 * @param {string}   options.displayName      Display name (optional, defaults to key).
 * @param {string}   options.statusKey        Unique key for status message (required).
 * @param {Function} options.onProgress       Progress callback (optional).
 * @param {boolean}  options.skipHashCheck    Boolean to skip hash checking (default: false).
 * @param {Object}   options.manifest         Manifest object (optional).
 * @param {Function} options.shouldSkipUpload Custom function to determine if file should be skipped (optional).
 * @param {Object}   options.metadata         Optional metadata object.
 * @return {Promise<Object>} Result with success, url, skipped, error.
 */
export async function uploadSingleFileWithProgress( {
	key,
	blob,
	storageService,
	setStatusMessage,
	contentType,
	displayName: providedDisplayName,
	statusKey,
	onProgress = null,
	skipHashCheck = false,
	manifest = null,
	shouldSkipUpload: customShouldSkipUpload = null,
	metadata = {},
} ) {
	if ( ! statusKey ) {
		throw new Error(
			'statusKey is required for uploadSingleFileWithProgress'
		);
	}

	// Ensure displayName is never empty - fallback to key, then to 'file'
	const displayName = providedDisplayName || key || 'file';

	let fileHash = null;
	let shouldSkip = false;

	try {
		// Hash checking and skip logic (if enabled)
		if ( ! skipHashCheck && manifest ) {
			const fileSize = blob.size;
			const existingEntry = manifest[ key ];

			if ( existingEntry && existingEntry.size === fileSize ) {
				// Stage 2: Calculate hash if size matches
				try {
					const hashCache = getFileHashCache();
					fileHash = await hashCache.getOrCalculateHash( blob, key );
					shouldSkip = customShouldSkipUpload
						? customShouldSkipUpload(
								manifest,
								key,
								fileSize,
								fileHash
						  )
						: shouldSkipUpload( manifest, key, fileSize, fileHash );
				} catch ( error ) {
					debugWarn(
						'Failed to calculate file hash, will upload:',
						error
					);
					shouldSkip = false;
				}
			}
		}

		if ( shouldSkip ) {
			// File unchanged - skip upload
			if ( setStatusMessage ) {
				const fileSizeMB = ( blob.size / ( 1024 * 1024 ) ).toFixed( 2 );
				setStatusMessage(
					`${ displayName } unchanged (${ fileSizeMB } MB) - skipping upload`,
					'success',
					statusKey
				);
			}

			return {
				success: true,
				url: null,
				skipped: true,
				error: null,
				hash: fileHash,
			};
		}

		// Calculate hash if not already calculated (for manifest update)
		if ( ! fileHash && ! skipHashCheck ) {
			try {
				const hashCache = getFileHashCache();
				fileHash = await hashCache.getOrCalculateHash( blob, key );
			} catch ( error ) {
				debugWarn( 'Failed to calculate hash:', error );
				fileHash = null;
			}
		}

		const fileSize = blob.size;

		// Create status message with progress tracking
		if ( setStatusMessage ) {
			setStatusMessage(
				`Uploading ${ displayName }`,
				'progress',
				statusKey,
				{
					percent: 0,
					loaded: 0,
					total: fileSize,
				}
			);
		}

		// Upload file with progress tracking
		const uploadResult = await storageService.upload( key, blob, {
			contentType,
			cacheControl:
				metadata.cacheControl || 'public, max-age=31536000, immutable',
			onProgress: ( loaded, total, percent ) => {
				// Update progress in status message
				if ( setStatusMessage ) {
					setStatusMessage(
						`Uploading ${ displayName }`,
						'progress',
						statusKey,
						{
							percent,
							loaded,
							total,
						}
					);
				}

				// Call custom progress callback if provided
				if ( onProgress ) {
					onProgress( loaded, total, percent );
				}
			},
		} );

		if ( uploadResult.success ) {
			// Update message to success (remove progress)
			if ( setStatusMessage ) {
				setStatusMessage(
					`Uploaded ${ displayName }`,
					'success',
					statusKey,
					null // Remove progress
				);
			}

			return {
				success: true,
				url: uploadResult.url,
				skipped: false,
				error: null,
				hash: fileHash,
				size: fileSize,
			};
		}
		// Upload failed
		if ( setStatusMessage ) {
			setStatusMessage(
				`Failed to upload ${ displayName }`,
				'error',
				statusKey,
				null
			);
		}

		return {
			success: false,
			url: null,
			skipped: false,
			error: uploadResult.error || 'Upload failed',
			hash: fileHash,
		};
	} catch ( error ) {
		debugWarn( `Failed to upload file: ${ key }`, error );

		if ( setStatusMessage ) {
			setStatusMessage(
				`Failed to upload ${ displayName }`,
				'error',
				statusKey,
				null
			);
		}

		return {
			success: false,
			url: null,
			skipped: false,
			error: error.message || 'Upload failed',
			hash: fileHash,
		};
	}
}
