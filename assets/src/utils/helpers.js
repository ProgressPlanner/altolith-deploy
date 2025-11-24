/**
 * General Utility Functions
 *
 * Common helper functions used throughout the application.
 *
 */

/**
 * Safely parse JSON with fallback value
 *
 * @param {string}   jsonString JSON string to parse
 * @param {*}        fallback   Fallback value if parsing fails (default: null)
 * @param {Function} validator  Optional validator function to verify parsed value
 * @return {*} Parsed value or fallback
 */
export function parseJSONSafely(
	jsonString,
	fallback = null,
	validator = null
) {
	if ( ! jsonString || typeof jsonString !== 'string' ) {
		return fallback;
	}

	try {
		const parsed = JSON.parse( jsonString );

		// If validator provided, use it to verify the parsed value
		if ( validator && ! validator( parsed ) ) {
			return fallback;
		}

		return parsed;
	} catch {
		return fallback;
	}
}

/**
 * Deep merge two objects
 *
 * @param {Object} target Target object
 * @param {Object} source Source object
 * @return {Object} Merged object
 */
export function deepMerge( target, source ) {
	const output = { ...target };

	if ( ! source || typeof source !== 'object' ) {
		return output;
	}

	Object.keys( source ).forEach( ( key ) => {
		if (
			source[ key ] &&
			typeof source[ key ] === 'object' &&
			! Array.isArray( source[ key ] )
		) {
			if ( key in target ) {
				output[ key ] = deepMerge( target[ key ], source[ key ] );
			} else {
				output[ key ] = source[ key ];
			}
		} else {
			output[ key ] = source[ key ];
		}
	} );

	return output;
}

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
