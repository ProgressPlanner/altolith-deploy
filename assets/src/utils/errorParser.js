/**
 * Error Response Parser Utility
 *
 * Centralized error response parsing for API calls.
 * Handles multiple error response formats (generic, plain text).
 *
 */

/**
 * Parse error response from various API formats.
 *
 * Handles:
 * - API format with array of errors: { errors: [{ message: "..." }] }
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

		// Handle API format with errors array: { errors: [{ message: "..." }] }
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
