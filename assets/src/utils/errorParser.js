/**
 * Error Response Parser Utility
 *
 * Centralized error response parsing for API calls.
 * Handles multiple error response formats (Cloudflare API, generic, plain text).
 *
 * @package
 */

/**
 * Parse error response from various API formats.
 *
 * Handles:
 * - Cloudflare API format: { errors: [{ message: "..." }] }
 * - Generic format: { error: "..." }
 * - Message format: { message: "..." }
 * - Plain text responses
 *
 * @param {string} responseText   Raw response text (may be JSON or plain text).
 * @param {string} defaultMessage Default message if parsing fails.
 * @return {string} Parsed error message.
 */
export function parseErrorResponse( responseText, defaultMessage ) {
	if ( ! responseText ) {
		return defaultMessage;
	}

	try {
		const data = JSON.parse( responseText );

		// Handle Cloudflare API format: { errors: [{ message: "..." }] }
		if ( data.errors && Array.isArray( data.errors ) ) {
			if ( data.errors.length > 0 && data.errors[ 0 ].message ) {
				return data.errors[ 0 ].message;
			}
		}

		// Handle generic error format: { error: "..." }
		if ( data.error ) {
			return typeof data.error === 'string'
				? data.error
				: JSON.stringify( data.error );
		}

		// Handle message format: { message: "..." }
		if ( data.message ) {
			return data.message;
		}

		// If JSON parsed but no recognized format, return default
		return defaultMessage;
	} catch ( e ) {
		// Not valid JSON, treat as plain text
		return responseText || defaultMessage;
	}
}

/**
 * Parse error response with HTTP status context.
 *
 * Includes HTTP status code in error message if available.
 *
 * @param {string} responseText Raw response text.
 * @param {number} statusCode   HTTP status code.
 * @param {string} operation    Operation name (e.g., "Worker deployment").
 * @return {string} Formatted error message with context.
 */
export function parseErrorResponseWithStatus(
	responseText,
	statusCode,
	operation
) {
	const errorMessage = parseErrorResponse(
		responseText,
		`${ operation } failed`
	);

	// Add status code context if available and not already in message
	if ( statusCode && ! errorMessage.includes( statusCode.toString() ) ) {
		return `${ errorMessage } (HTTP ${ statusCode })`;
	}

	return errorMessage;
}

/**
 * Extract multiple errors from response.
 *
 * Some APIs return multiple errors in an array.
 * This function extracts all of them.
 *
 * @param {string} responseText Raw response text.
 * @return {Array<string>} Array of error messages.
 */
export function parseMultipleErrors( responseText ) {
	if ( ! responseText ) {
		return [];
	}

	try {
		const data = JSON.parse( responseText );

		// Handle Cloudflare API format with multiple errors
		if ( data.errors && Array.isArray( data.errors ) ) {
			return data.errors
				.map( ( err ) => {
					// Return message if it exists and is not empty
					if (
						err.message &&
						typeof err.message === 'string' &&
						err.message.trim() !== ''
					) {
						return err.message;
					}
					// If no valid message, stringify the whole error object
					// but only if it has meaningful content
					const stringified = JSON.stringify( err );
					if (
						stringified !== '{}' &&
						stringified !== '{"message":""}'
					) {
						return stringified;
					}
					return null;
				} )
				.filter( Boolean );
		}

		// Handle generic error format
		if ( data.error ) {
			return [ data.error ];
		}

		// Handle message format
		if ( data.message ) {
			return [ data.message ];
		}

		return [];
	} catch ( e ) {
		// Not valid JSON, return as single error
		return [ responseText ];
	}
}
