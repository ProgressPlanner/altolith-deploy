/**
 * Provider Configuration Utilities
 *
 * Utilities for checking if providers are properly configured
 * based on required field validation.
 *
 */

/**
 * Check if a provider is configured by validating all required fields.
 *
 * A provider is considered configured if:
 * - All fields with `required: true` have non-empty values in the config
 * - If no required fields exist, the provider is considered configured
 *
 * @param {Array<Object>} settingsFields Array of provider settings field definitions
 * @param {Object}        config         Provider configuration object
 * @return {boolean} True if provider is configured, false otherwise
 */
export function isProviderConfigured( settingsFields, config ) {
	if ( ! settingsFields || ! Array.isArray( settingsFields ) ) {
		return false;
	}

	if ( ! config || typeof config !== 'object' ) {
		return false;
	}

	// Find all required fields
	const requiredFields = settingsFields.filter(
		( field ) => field.required === true
	);

	// If no required fields exist, provider is considered configured
	if ( requiredFields.length === 0 ) {
		return true;
	}

	// Check if all required fields have non-empty values
	for ( const field of requiredFields ) {
		const fieldName = field.name || field.id;
		if ( ! fieldName ) {
			continue;
		}

		const value = config[ fieldName ];

		// Check if value is empty
		if ( isEmpty( value ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Check if a value is considered empty.
 *
 * @param {*} value Value to check
 * @return {boolean} True if value is empty, false otherwise
 */
function isEmpty( value ) {
	// null or undefined
	if ( value === null || value === undefined ) {
		return true;
	}

	// Empty string
	if ( typeof value === 'string' && value.trim() === '' ) {
		return true;
	}

	// Empty array
	if ( Array.isArray( value ) && value.length === 0 ) {
		return true;
	}

	// Empty object
	if (
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		Object.keys( value ).length === 0
	) {
		return true;
	}

	return false;
}
