/**
 * Configuration Validation Utilities
 *
 * Pure functions for validating provider configurations.
 *
 * @package
 */

/**
 * Validate a configuration value against a field definition.
 *
 * @param {*}      value   Value to validate.
 * @param {Object} field   Field definition.
 * @param {Object} config  Full config object (for cross-field validation).
 * @return {Promise<string|null>} Error message or null if valid.
 */
export async function validateFieldValue( value, field, config ) {
	const fieldId = field.id;

	// Check required fields
	if ( field.required && ! value ) {
		return `${ field.label } is required.`;
	}

	// Skip validation if field is empty and not required
	if ( ! value ) {
		return null;
	}

	// Type validation
	if ( field.validation ) {
		const validation = field.validation;

		// Pattern validation
		if ( validation.pattern ) {
			const regex = new RegExp( validation.pattern );
			if ( ! regex.test( value ) ) {
				return validation.message || `${ field.label } format is invalid.`;
			}
		}

		// Min length validation
		if ( validation.minLength !== undefined && value.length < validation.minLength ) {
			return `${ field.label } must be at least ${ validation.minLength } characters.`;
		}

		// Max length validation
		if ( validation.maxLength !== undefined && value.length > validation.maxLength ) {
			return `${ field.label } must be no more than ${ validation.maxLength } characters.`;
		}

		// Custom validator callback
		if ( validation.callback && typeof validation.callback === 'function' ) {
			const result = await validation.callback( value, config );
			if ( typeof result === 'string' ) {
				return result;
			}
		}
	}

	return null;
}

/**
 * Validate all fields in a configuration.
 *
 * @param {Object}        config Configuration to validate.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {Promise<Object>} Object of field ID to error message.
 */
export async function validateAllFields( config, fields ) {
	const errors = {};

	for ( const field of fields ) {
		const fieldId = field.id;
		const value = config[ fieldId ];
		const error = await validateFieldValue( value, field, config );

		if ( error ) {
			errors[ fieldId ] = error;
		}
	}

	return errors;
}

/**
 * Check if a configuration has all required fields filled.
 *
 * @param {Object}        config Configuration to check.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {boolean} True if all required fields are present.
 */
export function hasRequiredFields( config, fields ) {
	for ( const field of fields ) {
		if ( field.required && ! config[ field.id ] ) {
			return false;
		}
	}
	return true;
}
