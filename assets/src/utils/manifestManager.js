/**
 * Manifest Manager Utility
 *
 * Manages the file manifest JSON that tracks file sizes and hashes
 * for upload optimization. The manifest is stored remotely at
 * file-manifest.json in each provider's storage location.
 *
 */

/**
 * Fetch existing manifest from remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @return {Promise<Object>} Manifest object (empty object if not found).
 */
export async function fetchManifest( storageService ) {
	try {
		// Try to download manifest from storage.
		const manifestBlob = await storageService.downloadManifest();

		if ( ! manifestBlob ) {
			return {};
		}

		// Parse JSON from blob.
		const manifestText = await manifestBlob.text();
		const manifest = JSON.parse( manifestText );

		return manifest || {};
	} catch ( error ) {
		// If manifest doesn't exist (404) or other error, start with empty manifest.
		if ( error.message && error.message.includes( '404' ) ) {
			return {};
		}

		return {};
	}
}

/**
 * Update manifest entry with size, hash, and optional content-type.
 *
 * @param {Object} manifest    Manifest object to update.
 * @param {string} storageKey  Storage key/path for the file.
 * @param {number} size        File size in bytes.
 * @param {string} hash        SHA-256 hash hex string.
 * @param {string} contentType Optional content-type header value.
 * @return {Object} Updated manifest object.
 */
export function updateManifestEntry(
	manifest,
	storageKey,
	size,
	hash,
	contentType = null
) {
	if ( ! manifest ) {
		manifest = {};
	}

	manifest[ storageKey ] = {
		size,
		hash,
	};

	// Add content-type if provided
	if ( contentType ) {
		manifest[ storageKey ].contentType = contentType;
	}

	return manifest;
}

/**
 * Check if file should be skipped based on size and hash comparison.
 *
 * Two-stage check: size first, then hash if size matches.
 * Returns true if both size and hash match existing entry.
 *
 * @param {Object} manifest   Manifest object.
 * @param {string} storageKey Storage key/path for the file.
 * @param {number} size       File size in bytes.
 * @param {string} hash       SHA-256 hash hex string.
 * @return {boolean} True if file should be skipped (size and hash match).
 */
export function shouldSkipUpload( manifest, storageKey, size, hash ) {
	if ( ! manifest || ! manifest[ storageKey ] ) {
		// No entry in manifest, don't skip.
		return false;
	}

	const entry = manifest[ storageKey ];

	// Stage 1: Check size first (fast comparison).
	if ( entry.size !== size ) {
		return false;
	}

	// Stage 2: Check hash if size matches.
	if ( entry.hash !== hash ) {
		return false;
	}

	// Both size and hash match - skip upload.

	return true;
}

/**
 * Clean up manifest by removing entries not in current upload set.
 *
 * This prevents manifest from growing indefinitely as files are added/removed.
 * Returns a new manifest object containing only entries for files in currentFiles set.
 *
 * @param {Object} manifest     Existing manifest object.
 * @param {Set}    currentFiles Set of storage keys for files in current upload.
 * @return {Object} Cleaned manifest object.
 */
export function cleanupManifest( manifest, currentFiles ) {
	if ( ! manifest || ! currentFiles ) {
		return manifest || {};
	}

	const cleanedManifest = {};
	let removedCount = 0;

	// Keep only entries for files that exist in current upload
	// Also preserve wp-content.zip entries (uploaded in parallel step)
	for ( const storageKey of Object.keys( manifest ) ) {
		if (
			currentFiles.has( storageKey ) ||
			storageKey.includes( '/wp-content.zip' )
		) {
			cleanedManifest[ storageKey ] = manifest[ storageKey ];
		} else {
			removedCount++;
		}
	}

	if ( removedCount > 0 ) {
	}

	return cleanedManifest;
}

/**
 * Upload manifest to remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @param {Object} manifest       Manifest object to upload.
 * @return {Promise<boolean>} True if upload succeeded.
 */
export async function uploadManifest( storageService, manifest ) {
	try {
		// Convert manifest to JSON blob (minified for smaller file size).
		const manifestJson = JSON.stringify( manifest );
		const manifestBlob = new Blob( [ manifestJson ], {
			type: 'application/json',
		} );

		// Upload manifest via storage service.
		const result = await storageService.uploadManifest( manifestBlob );

		if ( result.success ) {
			return true;
		}

		return false;
	} catch ( error ) {
		return false;
	}
}
