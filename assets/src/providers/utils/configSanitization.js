/**
 * Configuration Sanitization Utilities
 *
 * Pure functions for sanitizing provider configurations.
 *
 */

/**
 * Sanitize a single field value based on its type.
 *
 * @param {*}      value Value to sanitize.
 * @param {Object} field Field definition with type info.
 * @return {*} Sanitized value.
 */
export function sanitizeFieldValue( value, field ) {
	const type = field.type || 'text';

	switch ( type ) {
		case 'password':
		case 'text':
		case 'textarea':
			return String( value ).trim();

		case 'email':
			return String( value ).trim().toLowerCase();

		case 'url':
			// Remove trailing slash
			return String( value ).trim().replace( /\/$/, '' );

		case 'checkbox':
			return Boolean( value );

		case 'number':
			return Number( value ) || 0;

		case 'select':
			// Return value as-is, validation happens separately
			return value;

		case 'checkbox-group':
			// Ensure value is an array
			return Array.isArray( value ) ? value : [];

		default:
			return String( value ).trim();
	}
}

/**
 * Validate a select field value against allowed options.
 *
 * @param {*}             value   Value to validate.
 * @param {Array<Object>} options Field options array.
 * @return {boolean} True if value is in allowed options.
 */
export function isValidSelectValue( value, options ) {
	const allowedValues = ( options || [] ).map( ( opt ) => opt.value );
	return allowedValues.includes( value );
}

/**
 * Filter checkbox-group values against allowed options.
 *
 * @param {Array}         values  Array of values to filter.
 * @param {Array<Object>} options Field options array.
 * @return {Array} Filtered array containing only valid values.
 */
export function filterCheckboxGroupValues( values, options ) {
	if ( ! Array.isArray( values ) ) {
		return [];
	}

	const allowedValues = ( options || [] ).map( ( opt ) => opt.value );
	if ( allowedValues.length === 0 ) {
		return values;
	}

	return values.filter( ( v ) => allowedValues.includes( v ) );
}

/**
 * Sanitize all fields in a configuration.
 *
 * @param {Object}        config Configuration to sanitize.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {Object} Sanitized configuration.
 */
export function sanitizeAllFields( config, fields ) {
	const sanitized = {};

	for ( const field of fields ) {
		const fieldId = field.id;
		if ( ! ( fieldId in config ) ) {
			continue;
		}

		const value = config[ fieldId ];
		const type = field.type || 'text';

		// Handle select type with option validation
		if ( type === 'select' ) {
			if ( isValidSelectValue( value, field.options ) ) {
				sanitized[ fieldId ] = value;
			}
			continue;
		}

		// Handle checkbox-group with option filtering
		if ( type === 'checkbox-group' ) {
			sanitized[ fieldId ] = filterCheckboxGroupValues(
				value,
				field.options
			);
			continue;
		}

		// Standard sanitization
		sanitized[ fieldId ] = sanitizeFieldValue( value, field );
	}

	return sanitized;
}
