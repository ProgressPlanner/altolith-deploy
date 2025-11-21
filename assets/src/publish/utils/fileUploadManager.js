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

import { __, sprintf } from '@wordpress/i18n';
import { doAction, applyFilters } from '@wordpress/hooks';
import { createConcurrencyLimiter } from '../../utils/concurrencyLimiter';
import { calculateFileHash } from '../../utils/fileHash';
import { shouldSkipUpload } from '../../utils/manifestManager';
import { debugWarn } from '../../utils/debug';
import { formatFileSize } from '../../utils/helpers';
import { delay } from '../../utils/delay';

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
				/**
				 * Action fired before each file upload.
				 *
				 * @param {Object} fileData             File data object.
				 * @param {string} fileData.key         Storage key.
				 * @param {Blob}   fileData.blob        File blob.
				 * @param {string} fileData.contentType Content type.
				 * @param {string} fileData.displayName Display name.
				 *
				 * @example
				 * import { addAction } from '@wordpress/hooks';
				 *
				 * addAction('aether.upload.file.before', 'my-provider', (fileData) => {
				 *   console.log('About to upload:', fileData.key);
				 * });
				 */
				doAction( 'aether.upload.file.before', {
					key,
					blob,
					contentType,
					displayName,
				} );

				// Hash checking and skip logic (if enabled)
				if ( ! skipHashCheck && manifest ) {
					const fileSize = blob.size;
					const existingEntry = manifest[ key ];

					if ( existingEntry && existingEntry.size === fileSize ) {
						// Stage 2: Calculate hash if size matches
						try {
							/**
							 * Filter hash calculation for files.
							 *
							 * Allows providers to customize hash calculation or provide pre-calculated hash.
							 *
							 * @param {string|null} hash     Calculated hash or null to use default calculation.
							 * @param {Blob}        blob     File blob.
							 * @param {string}      key      Storage key.
							 * @param {Object}      manifest Manifest object.
							 *
							 * @example
							 * import { addFilter } from '@wordpress/hooks';
							 *
							 * addFilter('aether.upload.hash.calculate', 'my-provider', (hash, blob, key, manifest) => {
							 *   // Return pre-calculated hash or null to use default
							 *   if (key.startsWith('custom/')) {
							 *     return 'pre-calculated-hash';
							 *   }
							 *   return hash; // Use default calculation
							 * });
							 */
							const filteredHash = applyFilters(
								'aether.upload.hash.calculate',
								null,
								blob,
								key,
								manifest
							);

							fileHash =
								filteredHash ||
								( await calculateFileHash( blob ) );
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

					const fileSize = blob.size;
					const sizeStr = formatFileSize( fileSize );

					if ( setStatusMessage ) {
						setStatusMessage(
							sprintf(
								/* translators: %1$s: File name, %2$s: File size */
								__(
									'Skipped unchanged file %1$s (%2$s)',
									'aether-site-exporter'
								),
								displayName,
								sizeStr
							),
							'success',
							uploadKey,
							undefined,
							{ fileSize }
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
						/**
						 * Filter hash calculation for files (when not already calculated).
						 *
						 * Allows providers to customize hash calculation.
						 *
						 * @param {string|null} hash     Calculated hash or null to use default calculation.
						 * @param {Blob}        blob     File blob.
						 * @param {string}      key      Storage key.
						 * @param {Object}      manifest Manifest object.
						 */
						const filteredHash = applyFilters(
							'aether.upload.hash.calculate',
							null,
							blob,
							key,
							manifest
						);
						fileHash =
							filteredHash || ( await calculateFileHash( blob ) );
					} catch ( error ) {
						debugWarn( 'Failed to calculate hash:', error );
						fileHash = null;
					}
				}

				const fileSize = blob.size;
				const sizeStr = formatFileSize( fileSize );

				// Create status message with unique key for progress tracking
				if ( setStatusMessage ) {
					setStatusMessage(
						sprintf(
							/* translators: %1$s: File name, %2$s: File size */
							__(
								'Uploading %1$s (%2$s)',
								'aether-site-exporter'
							),
							displayName,
							sizeStr
						),
						'progress',
						uploadKey,
						{
							percent: 0,
							loaded: 0,
							total: fileSize,
						},
						{ fileSize }
					);
				}

				// Prepare upload options
				let uploadOptions = {
					contentType,
					cacheControl:
						metadata.cacheControl ||
						'public, max-age=31536000, immutable',
					onProgress: ( loaded, total, percent ) => {
						// Update progress in status message
						if ( setStatusMessage ) {
							setStatusMessage(
								sprintf(
									/* translators: %1$s: File name, %2$s: File size */
									__(
										'Uploading %1$s (%2$s)',
										'aether-site-exporter'
									),
									displayName,
									sizeStr
								),
								'progress',
								uploadKey,
								{
									percent,
									loaded,
									total,
								},
								{ fileSize }
							);
						}
					},
				};

				/**
				 * Filter upload options before file upload.
				 *
				 * Allows providers to modify upload options (contentType, cacheControl, metadata, etc.).
				 *
				 * @param {Object} uploadOptions Upload options object.
				 * @param {string} key           Storage key.
				 * @param {Blob}   blob          File blob.
				 * @param {string} contentType   Content type.
				 * @param {Object} metadata      File metadata.
				 *
				 * @example
				 * import { addFilter } from '@wordpress/hooks';
				 *
				 * addFilter('aether.upload.file.options', 'my-provider', (options, key, blob, contentType, metadata) => {
				 *   return {
				 *     ...options,
				 *     cacheControl: 'public, max-age=86400',
				 *     customHeader: 'value'
				 *   };
				 * });
				 */
				uploadOptions = applyFilters(
					'aether.upload.file.options',
					uploadOptions,
					key,
					blob,
					contentType,
					metadata
				);

				// Upload file with retry logic (max 3 attempts with exponential backoff)
				const maxRetries = 3;
				let uploadResult = null;
				let lastError = null;

				for ( let attempt = 1; attempt <= maxRetries; attempt++ ) {
					try {
						uploadResult = await storageService.upload(
							key,
							blob,
							uploadOptions
						);

						if ( uploadResult.success ) {
							// Upload succeeded, break out of retry loop
							break;
						}

						// Upload returned failure, prepare for retry
						lastError = uploadResult.error || 'Upload failed';

						// If this isn't the last attempt, retry with backoff
						if ( attempt < maxRetries ) {
							const delayMs = Math.pow( 2, attempt - 1 ) * 1000; // 1s, 2s, 4s
							if ( setStatusMessage ) {
								setStatusMessage(
									sprintf(
										/* translators: %1$s: File name, %2$s: File size, %3$d: Attempt number, %4$d: Max retries */
										__(
											'Retrying %1$s (%2$s) - attempt %3$d/%4$d',
											'aether-site-exporter'
										),
										displayName,
										sizeStr,
										attempt + 1,
										maxRetries
									),
									'info',
									uploadKey,
									undefined,
									{ fileSize }
								);
							}
							await delay( delayMs );
						}
					} catch ( error ) {
						lastError = error.message || error;

						// If this isn't the last attempt, retry with backoff
						if ( attempt < maxRetries ) {
							const delayMs = Math.pow( 2, attempt - 1 ) * 1000; // 1s, 2s, 4s
							if ( setStatusMessage ) {
								setStatusMessage(
									sprintf(
										/* translators: %1$s: File name, %2$s: File size, %3$d: Attempt number, %4$d: Max retries */
										__(
											'Retrying %1$s (%2$s) - attempt %3$d/%4$d',
											'aether-site-exporter'
										),
										displayName,
										sizeStr,
										attempt + 1,
										maxRetries
									),
									'info',
									uploadKey,
									undefined,
									{ fileSize }
								);
							}
							await delay( delayMs );
						}
					}
				}

				if ( uploadResult && uploadResult.success ) {
					filesUploaded++;
					totalProcessed++;

					// Update message to success (remove progress)
					if ( setStatusMessage ) {
						setStatusMessage(
							sprintf(
								/* translators: %1$s: File name, %2$s: File size */
								__(
									'Uploaded %1$s (%2$s)',
									'aether-site-exporter'
								),
								displayName,
								sizeStr
							),
							'success',
							uploadKey,
							null, // Remove progress
							{ fileSize }
						);
					}

					// Report progress after upload completes (guard against empty array)
					if ( onProgress && files.length > 0 ) {
						onProgress( totalProcessed, files.length, null );
					}

					const uploadResultData = {
						key,
						success: true,
						skipped: false,
						url: uploadResult.url,
						hash: fileHash,
						size: fileSize,
					};

					/**
					 * Action fired after each file upload succeeds.
					 *
					 * @param {Object} result      Upload result object.
					 * @param {string} result.key  Storage key.
					 * @param {string} result.url  Uploaded file URL.
					 * @param {string} result.hash File hash.
					 * @param {number} result.size File size.
					 * @param {string} displayName Display name.
					 *
					 * @example
					 * import { addAction } from '@wordpress/hooks';
					 *
					 * addAction('aether.upload.file.after', 'my-provider', (result, displayName) => {
					 *   console.log('File uploaded:', result.key, result.url);
					 * });
					 */
					doAction(
						'aether.upload.file.after',
						uploadResultData,
						displayName
					);

					results.push( uploadResultData );
				} else {
					// Upload failed after all retries
					filesFailed++;

					const errorMessage =
						lastError ||
						'Upload failed after ${ maxRetries } attempts';

					if ( setStatusMessage ) {
						setStatusMessage(
							sprintf(
								/* translators: %1$s: File name, %2$d: Number of attempts */
								__(
									'Failed to upload %1$s after %2$d attempts',
									'aether-site-exporter'
								),
								displayName,
								maxRetries
							),
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
						error: errorMessage,
					} );
				}
			} catch ( error ) {
				// Failed to process file
				filesFailed++;
				debugWarn( `Failed to upload file: ${ key }`, error );

				if ( setStatusMessage ) {
					setStatusMessage(
						sprintf(
							/* translators: %s: File name */
							__( 'Failed to upload %s', 'aether-site-exporter' ),
							displayName
						),
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
					fileHash = await calculateFileHash( blob );
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
					sprintf(
						/* translators: %1$s: File name, %2$s: File size in MB */
						__(
							'%1$s unchanged (%2$s MB) - skipping upload',
							'aether-site-exporter'
						),
						displayName,
						fileSizeMB
					),
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
				fileHash = await calculateFileHash( blob );
			} catch ( error ) {
				debugWarn( 'Failed to calculate hash:', error );
				fileHash = null;
			}
		}

		const fileSize = blob.size;

		// Create status message with progress tracking
		if ( setStatusMessage ) {
			setStatusMessage(
				sprintf(
					/* translators: %s: File name */
					__( 'Uploading %s', 'aether-site-exporter' ),
					displayName
				),
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
						sprintf(
							/* translators: %s: File name */
							__( 'Uploading %s', 'aether-site-exporter' ),
							displayName
						),
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
					sprintf(
						/* translators: %s: File name */
						__( 'Uploaded %s', 'aether-site-exporter' ),
						displayName
					),
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
				sprintf(
					/* translators: %s: File name */
					__( 'Failed to upload %s', 'aether-site-exporter' ),
					displayName
				),
				'error',
				statusKey,
				null
			);
		}

		return {
			success: false,
			url: null,
			skipped: false,
			error:
				uploadResult.error ||
				__( 'Upload failed', 'aether-site-exporter' ),
			hash: fileHash,
		};
	} catch ( error ) {
		debugWarn( `Failed to upload file: ${ key }`, error );

		if ( setStatusMessage ) {
			setStatusMessage(
				sprintf(
					/* translators: %s: File name */
					__( 'Failed to upload %s', 'aether-site-exporter' ),
					displayName
				),
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
