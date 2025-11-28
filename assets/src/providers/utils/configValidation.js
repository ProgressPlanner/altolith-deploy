/**
 * Configuration Validation Utilities
 *
 * Pure functions for validating provider configurations.
 *
 */

import { __, sprintf } from '@wordpress/i18n';

/**
 * Validate a configuration value against a field definition.
 *
 * @param {*}      value  Value to validate.
 * @param {Object} field  Field definition.
 * @param {Object} config Full config object (for cross-field validation).
 * @return {Promise<string|null>} Error message or null if valid.
 */
export async function validateFieldValue( value, field, config ) {
	// Check required fields
	if ( field.required && ! value ) {
		return sprintf(
			/* translators: %s: Field label */
			__( '%s is required.', 'altolith-deploy' ),
			field.label
		);
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
				if ( validation.message ) {
					return validation.message;
				}
				return sprintf(
					/* translators: %s: Field label */
					__( '%s format is invalid.', 'altolith-deploy' ),
					field.label
				);
			}
		}

		// Min length validation
		if (
			validation.minLength !== undefined &&
			value.length < validation.minLength
		) {
			return sprintf(
				/* translators: 1: Field label, 2: Minimum length */
				__(
					'%1$s must be at least %2$d characters.',
					'altolith-deploy'
				),
				field.label,
				validation.minLength
			);
		}

		// Max length validation
		if (
			validation.maxLength !== undefined &&
			value.length > validation.maxLength
		) {
			return sprintf(
				/* translators: 1: Field label, 2: Maximum length */
				__(
					'%1$s must be no more than %2$d characters.',
					'altolith-deploy'
				),
				field.label,
				validation.maxLength
			);
		}

		// Custom validator callback
		if (
			validation.callback &&
			typeof validation.callback === 'function'
		) {
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
 * Check if all required fields are filled in a configuration.
 *
 * @param {Object}        config Configuration to check.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {boolean} True if all required fields have values, false otherwise.
 */
export function hasRequiredFields( config, fields ) {
	// Safety check: if no fields or fields is not an array, consider it valid
	if ( ! fields || ! Array.isArray( fields ) || fields.length === 0 ) {
		return true;
	}

	for ( const field of fields ) {
		const fieldId = field.id || field.name;
		if ( field.required ) {
			const value = config[ fieldId ];
			// Check if value is empty (null, undefined, empty string, empty array)
			if ( ! value || ( Array.isArray( value ) && value.length === 0 ) ) {
				return false;
			}
		}
	}
	return true;
}
