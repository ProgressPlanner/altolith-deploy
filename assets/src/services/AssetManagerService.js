/**
 * Asset Manager Service
 *
 * Service for managing asset state with pure business logic.
 * Extracted from useAssetManager hook for testability.
 *
 */

const STORAGE_KEY = 'altolithAssets';

/**
 * Normalize asset data from server
 *
 * Converts snake_case fields to camelCase and ensures existsOnR2 is present.
 * Pure function for data transformation.
 *
 * @param {Object} assetData Raw asset data from server
 * @return {Object} Normalized asset data
 */
export function normalizeAssetData( assetData ) {
	if ( ! assetData || typeof assetData !== 'object' ) {
		return { existsOnR2: false };
	}

	// eslint-disable-next-line camelcase
	const { exists_on_r2, existsOnR2, ...rest } = assetData;

	return {
		...rest,
		// eslint-disable-next-line camelcase
		existsOnR2: existsOnR2 || exists_on_r2 || false,
	};
}

/**
 * Calculate if asset needs upload
 *
 * Pure function to determine upload necessity based on R2 existence.
 *
 * @param {boolean} existsOnR2 Whether asset exists on R2
 * @return {boolean} Whether asset needs upload
 */
export function calculateNeedsUpload( existsOnR2 ) {
	return ! existsOnR2;
}

/**
 * Create new asset object
 *
 * Pure function for creating asset with consistent structure.
 *
 * @param {string}  type       Asset type (theme, plugin)
 * @param {string}  slug       Asset slug
 * @param {string}  name       Asset name (optional)
 * @param {boolean} existsOnR2 Whether asset exists on R2 (optional)
 * @return {Object} New asset object
 */
export function createAsset(
	type,
	slug,
	name = undefined,
	existsOnR2 = false
) {
	const asset = {
		type,
		slug,
		needsUpload: calculateNeedsUpload( existsOnR2 ),
	};

	if ( name !== undefined ) {
		asset.name = name;
	}

	if ( existsOnR2 !== undefined ) {
		asset.existsOnR2 = existsOnR2;
	}

	return asset;
}

/**
 * Merge asset data
 *
 * Pure function for merging existing asset with updated data.
 *
 * @param {Object}  existing                    Existing asset object
 * @param {Object}  updated                     Updated asset data
 * @param {Object}  options                     Merge options
 * @param {boolean} options.preserveNeedsUpload Preserve existing needsUpload flag
 * @return {Object} Merged asset
 */
export function mergeAsset( existing, updated, options = {} ) {
	const { preserveNeedsUpload = false } = options;

	// If no existing asset, treat updated as new
	if ( ! existing ) {
		const normalized = normalizeAssetData( updated );
		return {
			...normalized,
			needsUpload: calculateNeedsUpload( normalized.existsOnR2 ),
		};
	}

	// If no update, return existing
	if ( ! updated ) {
		return existing;
	}

	// Normalize updated data
	const normalized = normalizeAssetData( updated );

	// Merge data
	const merged = {
		...existing,
		...normalized,
	};

	// Calculate or preserve needsUpload
	if ( preserveNeedsUpload && 'needsUpload' in existing ) {
		merged.needsUpload = existing.needsUpload;
	} else if ( 'existsOnR2' in merged ) {
		merged.needsUpload = calculateNeedsUpload( merged.existsOnR2 );
	}

	return merged;
}

/**
 * Filter assets that need upload
 *
 * Pure function to extract changed assets as type:slug strings.
 *
 * @param {Object} assets Assets object
 * @return {Array<string>} Array of "type:slug" strings
 */
export function filterChangedAssets( assets ) {
	if ( ! assets || typeof assets !== 'object' ) {
		return [];
	}

	return Object.values( assets )
		.filter( ( asset ) => asset && asset.needsUpload )
		.map( ( asset ) => `${ asset.type }:${ asset.slug }` );
}

/**
 * Clear all upload flags
 *
 * Pure function to set needsUpload=false for all assets.
 *
 * @param {Object} assets Assets object
 * @return {Object} New assets object with cleared flags
 */
export function clearAllUploadFlags( assets ) {
	if ( ! assets || typeof assets !== 'object' ) {
		return {};
	}

	const cleared = {};

	Object.keys( assets ).forEach( ( slug ) => {
		cleared[ slug ] = {
			...assets[ slug ],
			needsUpload: false,
		};
	} );

	return cleared;
}

/**
 * Asset Manager Service Class
 *
 * Handles asset state operations with localStorage integration.
 */
export class AssetManagerService {
	/**
	 * Create service instance
	 *
	 * @param {Object} storage Storage implementation (injectable for testing)
	 */
	constructor( storage ) {
		this.storage = storage;
	}

	/**
	 * Load assets from storage
	 *
	 * @return {Object} Assets object
	 */
	load() {
		return this.storage.get( STORAGE_KEY, {} );
	}

	/**
	 * Save assets to storage
	 *
	 * @param {Object} assets Assets to save
	 * @return {void}
	 */
	save( assets ) {
		this.storage.set( STORAGE_KEY, assets );
	}

	/**
	 * Mark asset as changed (needs upload)
	 *
	 * @param {Object} currentAssets Current assets state
	 * @param {string} type          Asset type
	 * @param {string} slug          Asset slug
	 * @return {Object} Updated assets state
	 */
	markAsChanged( currentAssets, type, slug ) {
		const updated = { ...currentAssets };
		const existingAsset = updated[ slug ];

		updated[ slug ] = existingAsset
			? { ...existingAsset, needsUpload: true }
			: createAsset( type, slug );

		return updated;
	}

	/**
	 * Update asset from server data
	 *
	 * @param {Object} currentAssets Current assets state
	 * @param {Object} assetData     Server asset data
	 * @return {Object} Updated assets state
	 */
	updateFromServer( currentAssets, assetData ) {
		const normalized = normalizeAssetData( assetData );
		const { slug } = normalized;

		const updated = { ...currentAssets };
		const existingAsset = updated[ slug ];

		updated[ slug ] = mergeAsset( existingAsset, normalized );

		return updated;
	}

	/**
	 * Sync multiple assets from server
	 *
	 * @param {Object} currentAssets Current assets state
	 * @param {Array}  serverAssets  Array of server asset data
	 * @return {Object} Updated assets state
	 */
	syncWithServer( currentAssets, serverAssets ) {
		if ( ! Array.isArray( serverAssets ) ) {
			return currentAssets;
		}

		const updated = { ...currentAssets };

		serverAssets.forEach( ( assetData ) => {
			const normalized = normalizeAssetData( assetData );
			const { slug } = normalized;
			const existingAsset = updated[ slug ];

			// Preserve needsUpload if asset was locally marked as changed
			updated[ slug ] = mergeAsset( existingAsset, normalized, {
				preserveNeedsUpload: !! existingAsset?.needsUpload,
			} );
		} );

		return updated;
	}
}
