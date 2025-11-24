/**
 * Data Validator
 *
 * Validates data dependencies between workflow steps.
 * Ensures all required data exists before step execution
 * and validates output matches declared provides.
 *
 * Supports scope validation for multi-threaded execution:
 * - Global scope: Data shared across all threads (read-only)
 * - Thread scope: Data isolated to specific provider instance thread
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';

/**
 * Determine if a step is a per-thread step
 *
 * A step is per-thread if it requires data from 'thread' source.
 *
 * @param {Object} step - Step definition
 * @return {boolean} True if step is per-thread
 */
export function isThreadStep( step ) {
	if ( ! step.requires ) {
		return false;
	}

	return Object.values( step.requires ).some(
		( requirement ) => requirement.from === 'thread'
	);
}

/**
 * Get the scope of provided data
 *
 * @param {Object} step - Step definition
 * @param {string} key  - Data key
 * @return {string} 'global' or 'thread'
 */
export function getProvideScope( step, key ) {
	if ( ! step.provides || ! step.provides[ key ] ) {
		return 'thread'; // Default to thread scope
	}

	const definition = step.provides[ key ];

	// Support both string format (legacy, defaults to thread) and object format
	if ( typeof definition === 'string' ) {
		return 'thread';
	}

	return definition.scope || 'thread';
}

/**
 * Validate scope consistency
 *
 * Ensures that:
 * - Thread steps only provide thread-scoped data
 * - Global steps only provide global-scoped data
 * - No scope mismatches
 *
 * @param {Object} step - Step definition
 * @throws {Error} If scope is inconsistent
 */
export function validateScope( step ) {
	if ( ! step.provides ) {
		return;
	}

	const isThread = isThreadStep( step );

	const errors = [];

	Object.entries( step.provides ).forEach( ( [ key ] ) => {
		const scope = getProvideScope( step, key );

		// Thread steps should only provide thread-scoped data
		if ( isThread && scope === 'global' ) {
			errors.push(
				`"${ key }" is declared as global scope but step "${ step.id }" is a thread step`
			);
		}

		// Global steps should only provide global-scoped data
		if ( ! isThread && scope === 'thread' ) {
			errors.push(
				`"${ key }" is declared as thread scope but step "${ step.id }" is a global step`
			);
		}
	} );

	if ( errors.length > 0 ) {
		throw new Error(
			`Step "${ step.id }" has scope inconsistencies:\n  - ${ errors.join(
				'\n  - '
			) }`
		);
	}
}

/**
 * Validate step data requirements
 *
 * Checks that all required data exists in context before step execution.
 *
 * @param {Object} step    - Step definition
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
			`Step "${
				step.id
			}" is missing required data:\n${ missingDetails.join( '\n' ) }`
		);
	}
}

/**
 * Validate step output
 *
 * Checks that step handler returned all declared provides.
 *
 * @param {Object} step   - Step definition
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
			`Step "${
				step.id
			}" did not provide declared outputs: ${ missing.join( ', ' ) }`
		);
	}
}

/**
 * Get data requirements summary
 *
 * Returns a human-readable summary of what data a step requires.
 *
 * @param {Object} step - Step definition
 * @return {string} Requirements summary
 */
export function getRequirementsSummary( step ) {
	if ( ! step.requires ) {
		return __( 'No data requirements', 'aether-site-exporter' );
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
 * @return {string} Provides summary
 */
export function getProvidesSummary( step ) {
	if ( ! step.provides ) {
		return __( 'No data provided', 'aether-site-exporter' );
	}

	const provides = Object.entries( step.provides ).map(
		( [ key, definition ] ) => {
			// Support both old format (string) and new format (object with type and scope)
			if ( typeof definition === 'string' ) {
				return `  - ${ key } (type: ${ definition })`;
			}
			const type = definition.type || 'unknown';
			const scope = definition.scope || 'thread';
			return `  - ${ key } (type: ${ type }, scope: ${ scope })`;
		}
	);

	return provides.join( '\n' );
}

export default {
	validate,
	validateOutput,
	validateScope,
	isThreadStep,
	getProvideScope,
	getRequirementsSummary,
	getProvidesSummary,
};
