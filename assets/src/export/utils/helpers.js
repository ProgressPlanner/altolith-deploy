/**
 * Export Utility Functions
 *
 * Helper functions used in export-related operations.
 *
 */

/**
 * Format file size in bytes to human-readable string
 *
 * @param {number} bytes    Number of bytes
 * @param {number} decimals Number of decimal places (default: 1)
 * @return {string} Formatted file size (e.g., "2.5 MB", "123 KB")
 */
export function formatFileSize( bytes, decimals = 1 ) {
	if ( ! bytes || bytes === 0 ) {
		return '0 B';
	}

	if ( bytes < 1024 ) {
		return `${ bytes } B`;
	}

	if ( bytes < 1024 * 1024 ) {
		return `${ ( bytes / 1024 ).toFixed( decimals ) } KB`;
	}

	if ( bytes < 1024 * 1024 * 1024 ) {
		return `${ ( bytes / ( 1024 * 1024 ) ).toFixed( decimals ) } MB`;
	}

	return `${ ( bytes / ( 1024 * 1024 * 1024 ) ).toFixed( decimals ) } GB`;
}
