/**
 * Configuration Validation Utilities
 *
 * Pure functions for validating provider configurations.
 *
 * @package
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
			__( '%s is required.', 'aether-site-exporter' ),
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
					__( '%s format is invalid.', 'aether-site-exporter' ),
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
					'aether-site-exporter'
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
					'aether-site-exporter'
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
