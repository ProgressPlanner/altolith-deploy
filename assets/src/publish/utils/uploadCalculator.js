/**
 * Upload Calculator Utilities
 *
 * Pure functions for calculating upload statistics and progress.
 * These functions are extracted for testability.
 *
 * @package
 */

/**
 * Calculate total number of files to upload
 *
 * Pure function that sums up all file counts.
 *
 * @param {number} urlCount - Number of URLs/pages
 * @param {number} assetCount - Number of unique assets
 * @param {number} manifestCount - Number of manifest files (usually 1)
 * @return {number} Total file count
 */
export function calculateTotalFiles( urlCount, assetCount, manifestCount = 1 ) {
	// Ensure all inputs are numbers and non-negative
	const safeUrlCount = Math.max( 0, Number( urlCount ) || 0 );
	const safeAssetCount = Math.max( 0, Number( assetCount ) || 0 );
	const safeManifestCount = Math.max( 0, Number( manifestCount ) || 0 );

	return safeUrlCount + safeAssetCount + safeManifestCount;
}

/**
 * Calculate upload progress percentage
 *
 * Pure function that calculates progress as a percentage.
 *
 * @param {number} uploadedCount - Number of files uploaded so far
 * @param {number} totalCount - Total number of files to upload
 * @return {number} Progress percentage (0-100)
 */
export function calculateUploadProgress( uploadedCount, totalCount ) {
	// Handle edge cases
	if ( totalCount === 0 ) {
		return 100; // If no files to upload, consider it complete
	}

	const safeUploaded = Math.max( 0, Number( uploadedCount ) || 0 );
	const safeTotal = Math.max( 1, Number( totalCount ) || 1 ); // Avoid division by zero

	// Calculate percentage, clamped to 0-100
	const percentage = Math.min( 100, Math.max( 0, ( safeUploaded / safeTotal ) * 100 ) );

	return Math.round( percentage );
}

/**
 * Calculate incremental progress for multi-stage uploads
 *
 * Useful when uploading to multiple providers or in multiple phases.
 * Each stage gets an equal share of the total progress.
 *
 * @param {number} currentStage - Current stage index (0-based)
 * @param {number} totalStages - Total number of stages
 * @param {number} stageProgress - Progress within current stage (0-100)
 * @return {number} Overall progress percentage (0-100)
 */
export function calculateMultiStageProgress(
	currentStage,
	totalStages,
	stageProgress
) {
	// Validate inputs
	const safeCurrent = Math.max( 0, Number( currentStage ) || 0 );
	const safeTotal = Math.max( 1, Number( totalStages ) || 1 );
	const safeStageProgress = Math.min(
		100,
		Math.max( 0, Number( stageProgress ) || 0 )
	);

	// Each stage is worth (100 / totalStages)%
	const completedStagesProgress = ( safeCurrent / safeTotal ) * 100;
	const currentStageProgress = ( safeStageProgress / safeTotal );

	const totalProgress = completedStagesProgress + currentStageProgress;

	return Math.min( 100, Math.round( totalProgress ) );
}

/**
 * Calculate upload statistics summary
 *
 * Pure function that aggregates upload stats.
 *
 * @param {Object} stats - Statistics object
 * @param {number} stats.urlsSucceeded - Successfully uploaded URLs
 * @param {number} stats.urlsFailed - Failed URL uploads
 * @param {number} stats.assetsSucceeded - Successfully uploaded assets
 * @param {number} stats.assetsFailed - Failed asset uploads
 * @return {Object} Aggregated statistics
 */
export function calculateUploadStats( stats ) {
	const {
		urlsSucceeded = 0,
		urlsFailed = 0,
		assetsSucceeded = 0,
		assetsFailed = 0,
	} = stats || {};

	const totalUrls = urlsSucceeded + urlsFailed;
	const totalAssets = assetsSucceeded + assetsFailed;
	const totalFiles = totalUrls + totalAssets;
	const totalSucceeded = urlsSucceeded + assetsSucceeded;
	const totalFailed = urlsFailed + assetsFailed;

	const successRate =
		totalFiles > 0 ? ( totalSucceeded / totalFiles ) * 100 : 100;

	return {
		totalUrls,
		totalAssets,
		totalFiles,
		totalSucceeded,
		totalFailed,
		successRate: Math.round( successRate ),
		urlSuccessRate:
			totalUrls > 0 ? Math.round( ( urlsSucceeded / totalUrls ) * 100 ) : 100,
		assetSuccessRate:
			totalAssets > 0
				? Math.round( ( assetsSucceeded / totalAssets ) * 100 )
				: 100,
	};
}

/**
 * Determine if upload should be considered successful
 *
 * Pure function that determines success based on thresholds.
 *
 * @param {number} successCount - Number of successful uploads
 * @param {number} totalCount - Total upload attempts
 * @param {number} threshold - Minimum success percentage (default 80)
 * @return {boolean} True if upload meets success threshold
 */
export function isUploadSuccessful(
	successCount,
	totalCount,
	threshold = 80
) {
	if ( totalCount === 0 ) {
		return true; // No files to upload = success
	}

	const safeSuccess = Math.max( 0, Number( successCount ) || 0 );
	const safeTotal = Math.max( 1, Number( totalCount ) || 1 );
	// Use explicit check for undefined/null to allow 0 as valid threshold
	const rawThreshold = threshold !== undefined && threshold !== null ? Number( threshold ) : 80;
	const safeThreshold = Math.min( 100, Math.max( 0, rawThreshold ) );

	const successRate = ( safeSuccess / safeTotal ) * 100;

	return successRate >= safeThreshold;
}

/**
 * Calculate bytes per second upload speed
 *
 * Pure function for calculating upload speed.
 *
 * @param {number} bytesUploaded - Total bytes uploaded
 * @param {number} elapsedMs - Elapsed time in milliseconds
 * @return {number} Bytes per second (0 if time is 0)
 */
export function calculateUploadSpeed( bytesUploaded, elapsedMs ) {
	if ( elapsedMs <= 0 ) {
		return 0;
	}

	const safeBytes = Math.max( 0, Number( bytesUploaded ) || 0 );
	const safeMs = Math.max( 1, Number( elapsedMs ) || 1 );

	// Convert to bytes per second
	return Math.round( ( safeBytes / safeMs ) * 1000 );
}

/**
 * Estimate remaining time for upload
 *
 * Pure function to estimate completion time.
 *
 * @param {number} remainingBytes - Bytes remaining to upload
 * @param {number} bytesPerSecond - Current upload speed in bytes/second
 * @return {number} Estimated seconds remaining (0 if speed is 0)
 */
export function estimateRemainingTime( remainingBytes, bytesPerSecond ) {
	if ( bytesPerSecond <= 0 ) {
		return 0; // Cannot estimate without speed
	}

	const safeRemaining = Math.max( 0, Number( remainingBytes ) || 0 );
	const safeSpeed = Math.max( 1, Number( bytesPerSecond ) || 1 );

	return Math.ceil( safeRemaining / safeSpeed );
}
