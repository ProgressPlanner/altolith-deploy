<?php

/**
 * Export Limits Constants
 *
 * Centralizes all magic numbers and limits used throughout the export system.
 * This makes it easier to maintain and adjust limits consistently.
 *
 * @package Altolith\Constants
 */

namespace Altolith\Deploy\Constants;

\defined('ABSPATH') || exit;

/**
 * Export limits constants.
 */
class ExportLimits
{
	/**
	 * Maximum number of URLs that can be processed in a single batch.
	 *
	 * Used to prevent server overload when fetching HTML content.
	 */
	public const MAX_BATCH_SIZE = 10;

	/**
	 * Maximum file size for wp-content.zip in bytes (512MB).
	 *
	 * Used to prevent memory exhaustion and timeout issues.
	 */
	public const MAX_FILE_SIZE = 512 * 1024 * 1024;

	/**
	 * Maximum number of files per batch.
	 *
	 * Used when creating file batches for processing.
	 */
	public const MAX_FILES_PER_BATCH = 100;

	/**
	 * Maximum batch size in bytes (10MB).
	 *
	 * Used to limit the total size of files in a single batch.
	 */
	public const MAX_BATCH_SIZE_BYTES = 10 * 1024 * 1024;
}
