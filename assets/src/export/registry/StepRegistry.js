/**
 * Step Registry
 *
 * Singleton registry for managing export workflow steps.
 * Steps register themselves dynamically via WordPress hooks.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';

/**
 * Singleton instance
 */
let instance = null;

/**
 * Step Registry Class
 *
 * Manages registration and retrieval of export workflow steps.
 */
class StepRegistry {
	/**
	 * Constructor
	 *
	 * Private constructor for singleton pattern.
	 */
	constructor() {
		if ( instance ) {
			throw new Error(
				'StepRegistry is a singleton. Use StepRegistry.getInstance()'
			);
		}
		this.steps = [];
	}

	/**
	 * Get singleton instance
	 *
	 * @return {StepRegistry} Singleton instance
	 */
	static getInstance() {
		if ( ! instance ) {
			instance = new StepRegistry();
		}
		return instance;
	}

	/**
	 * Register a step
	 *
	 * Validates step structure and adds to registry.
	 *
	 * @param {Object}        step                          - Step definition
	 * @param {string}        step.id                       - Unique step identifier
	 * @param {string}        step.label                    - Display label (i18n)
	 * @param {string}        [step.description]            - Step description (i18n)
	 * @param {boolean}       [step.supportsProgress=false] - Whether step reports progress
	 * @param {Array<string>} [step.dependencies=[]]        - IDs of steps this depends on
	 * @param {Object}        step.requires                 - Data requirements (explicit dependencies)
	 * @param {Object}        step.provides                 - Data this step provides
	 * @param {Function}      step.handler                  - Async handler function
	 * @param {Function}      [step.skip]                   - Optional skip function
	 * @param {Function}      [step.shouldSkip]             - Optional skip function (alternative)
	 * @throws {Error} If step is invalid
	 */
	register( step ) {
		// Validate required properties
		if ( ! step || typeof step !== 'object' ) {
			throw new Error( __( 'Step must be an object', 'aether-site-exporter' ) );
		}

		if ( ! step.id || typeof step.id !== 'string' ) {
			throw new Error(
				__( 'Step must have a valid id (string)', 'aether-site-exporter' )
			);
		}

		if ( ! step.label || typeof step.label !== 'string' ) {
			throw new Error(
				__( 'Step must have a valid label (string)', 'aether-site-exporter' )
			);
		}

		if ( ! step.handler || typeof step.handler !== 'function' ) {
			throw new Error(
				__( 'Step must have a valid handler (function)', 'aether-site-exporter' )
			);
		}

		if ( ! step.requires || typeof step.requires !== 'object' ) {
			throw new Error(
				__(
					'Step must have a valid requires object (data dependencies)',
					'aether-site-exporter'
				)
			);
		}

		if ( ! step.provides || typeof step.provides !== 'object' ) {
			throw new Error(
				__(
					'Step must have a valid provides object (output declaration)',
					'aether-site-exporter'
				)
			);
		}

		// Check for duplicate step ID
		if ( this.steps.find( ( s ) => s.id === step.id ) ) {
			throw new Error(
				`Step with id "${ step.id }" is already registered`
			);
		}

		// Set defaults for optional properties
		const normalizedStep = {
			...step,
			description: step.description || '',
			supportsProgress: step.supportsProgress ?? false,
			dependencies: step.dependencies || [],
		};

		// Add to registry
		this.steps.push( normalizedStep );
	}

	/**
	 * Get all registered steps
	 *
	 * @return {Array<Object>} Registered steps
	 */
	getSteps() {
		return this.steps;
	}

	/**
	 * Clear all registered steps
	 *
	 * Used for re-initialization and testing.
	 */
	clear() {
		this.steps = [];
	}

	/**
	 * Get step by ID
	 *
	 * @param {string} stepId - Step identifier
	 * @return {Object|null} Step definition or null if not found
	 */
	getStepById( stepId ) {
		return this.steps.find( ( step ) => step.id === stepId ) || null;
	}

	/**
	 * Check if step is registered
	 *
	 * @param {string} stepId - Step identifier
	 * @return {boolean} True if step is registered
	 */
	hasStep( stepId ) {
		return this.steps.some( ( step ) => step.id === stepId );
	}
}

export default StepRegistry;
