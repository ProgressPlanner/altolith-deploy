/**
 * General Utility Functions
 *
 * Common helper functions used throughout the application.
 *
 */

/**
 * Filter out null and undefined values from an object
 *
 * @param {Object} obj Object to filter
 * @return {Object} New object with null/undefined values removed
 */
export function filterNullishValues( obj ) {
	if ( ! obj || typeof obj !== 'object' ) {
		return obj;
	}

	return Object.entries( obj ).reduce( ( acc, [ key, value ] ) => {
		if ( value !== null && value !== undefined ) {
			acc[ key ] = value;
		}
		return acc;
	}, {} );
}

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
 * Parse JSON array from localStorage safely
 *
 * @param {string} jsonString JSON string to parse
 * @param {Array}  fallback   Fallback array if parsing fails (default: [])
 * @return {Array} Parsed array or fallback
 */
export function parseJSONArray( jsonString, fallback = [] ) {
	return parseJSONSafely( jsonString, fallback, Array.isArray );
}

/**
 * Parse JSON object from localStorage safely
 *
 * @param {string} jsonString JSON string to parse
 * @param {Object} fallback   Fallback object if parsing fails (default: {})
 * @return {Object} Parsed object or fallback
 */
export function parseJSONObject( jsonString, fallback = {} ) {
	return parseJSONSafely(
		jsonString,
		fallback,
		( val ) => val && typeof val === 'object' && ! Array.isArray( val )
	);
}

/**
 * Check if a value is an encrypted credential
 *
 * @param {*} value Value to check
 * @return {boolean} True if value is encrypted credential string
 */
export function isEncryptedValue( value ) {
	return typeof value === 'string' && value.startsWith( 'encrypted:' );
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
 * Debounce a function call
 *
 * @param {Function} func      Function to debounce
 * @param {number}   wait      Milliseconds to wait
 * @param {boolean}  immediate Execute on leading edge instead of trailing
 * @return {Function} Debounced function
 */
export function debounce( func, wait, immediate = false ) {
	let timeout;

	return function executedFunction( ...args ) {
		const later = () => {
			timeout = null;
			if ( ! immediate ) {
				func( ...args );
			}
		};

		const callNow = immediate && ! timeout;
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );

		if ( callNow ) {
			func( ...args );
		}
	};
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
