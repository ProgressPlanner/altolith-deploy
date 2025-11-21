/**
 * Standard Response Format Utility
 *
 * Provides standardized response object format for API operations.
 *
 * Standard format:
 * {
 *   success: boolean,
 *   data?: any,           // Success data
 *   error?: string,       // Single error message
 *   errors?: string[]     // Multiple errors (optional)
 * }
 *
 * @package
 */

/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
export function createSuccessResponse( data = null, message = null ) {
	const response = {
		success: true,
		data,
	};

	// Add message to data if provided
	if ( message && typeof data === 'object' && data !== null ) {
		response.data = { ...data, message };
	} else if ( message ) {
		response.data = { message };
	}

	return response;
}

/**
 * Create an error response.
 *
 * @param {string|Error} error  Error message or Error object.
 * @param {Array}        errors Optional array of multiple errors.
 * @return {Object} Standardized error response.
 */
export function createErrorResponse( error, errors = null ) {
	const errorMessage =
		typeof error === 'string' ? error : error?.message || 'Unknown error';

	const response = {
		success: false,
		error: errorMessage,
	};

	if ( errors && Array.isArray( errors ) && errors.length > 0 ) {
		response.errors = errors;
	}

	return response;
}
