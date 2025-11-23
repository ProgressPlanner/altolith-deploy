/**
 * Data Validator
 *
 * Validates data dependencies between workflow steps.
 * Ensures all required data exists before step execution
 * and validates output matches declared provides.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';

/**
 * Validate step data requirements
 *
 * Checks that all required data exists in context before step execution.
 *
 * @param {Object} step - Step definition
 * @param {Object} context - Execution context
 * @throws {Error} If required data is missing
 */
export function validate( step, context ) {
	if ( ! step.requires ) {
		return;
	}

	const missing = [];
	const missingDetails = [];

	Object.entries( step.requires ).forEach( ( [ key, requirement ] ) => {
		const isRequired = requirement.required !== false;

		if ( ! ( key in context ) && isRequired ) {
			missing.push( key );
			missingDetails.push(
				`  - "${ key }" (from: ${ requirement.from })`
			);
		}
	} );

	if ( missing.length > 0 ) {
		throw new Error(
			`Step "${ step.id }" is missing required data:\n${ missingDetails.join(
				'\n'
			) }`
		);
	}
}

/**
 * Validate step output
 *
 * Checks that step handler returned all declared provides.
 *
 * @param {Object} step - Step definition
 * @param {Object} result - Step handler result
 * @throws {Error} If provided data is missing
 */
export function validateOutput( step, result ) {
	if ( ! step.provides || ! result ) {
		return;
	}

	const missing = [];

	Object.keys( step.provides ).forEach( ( key ) => {
		if ( ! ( key in result ) ) {
			missing.push( key );
		}
	} );

	if ( missing.length > 0 ) {
		throw new Error(
			`Step "${ step.id }" did not provide declared outputs: ${ missing.join(
				', '
			) }`
		);
	}
}

/**
 * Get data requirements summary
 *
 * Returns a human-readable summary of what data a step requires.
 *
 * @param {Object} step - Step definition
 * @returns {string} Requirements summary
 */
export function getRequirementsSummary( step ) {
	if ( ! step.requires ) {
		return __( 'No data requirements', 'aether' );
	}

	const requirements = Object.entries( step.requires ).map(
		( [ key, requirement ] ) => {
			const required = requirement.required !== false;
			const requiredLabel = required ? 'required' : 'optional';
			return `  - ${ key } (from: ${ requirement.from }, ${ requiredLabel })`;
		}
	);

	return requirements.join( '\n' );
}

/**
 * Get provides summary
 *
 * Returns a human-readable summary of what data a step provides.
 *
 * @param {Object} step - Step definition
 * @returns {string} Provides summary
 */
export function getProvidesSummary( step ) {
	if ( ! step.provides ) {
		return __( 'No data provided', 'aether' );
	}

	const provides = Object.entries( step.provides ).map(
		( [ key, type ] ) => `  - ${ key } (type: ${ type })`
	);

	return provides.join( '\n' );
}

export default {
	validate,
	validateOutput,
	getRequirementsSummary,
	getProvidesSummary,
};
