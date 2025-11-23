/**
 * Step Executor - Per-Provider Queue Architecture
 *
 * Executes export workflows with parallel provider queues.
 * Each provider runs its own complete workflow independently.
 * Steps with globalCache=true run once and share results across providers.
 *
 * Uses WordPress hooks for extensibility instead of callbacks.
 */

import { doAction } from '@wordpress/hooks';
import { validateDependencies } from './DependencyResolver';
import { debug, debugError, debugWarn } from '@aether/utils/debug';

/**
 * Execute workflow for all providers with per-provider queues.
 *
 * Fires WordPress hooks at all lifecycle points for extensibility.
 *
 * @param {Array<Object>} steps   Array of step definitions.
 * @param {Object}        context Initial context with providerIds.
 * @return {Promise<Object>} Results per provider.
 */
export async function executeSteps( steps, context ) {
	const { providerIds = [] } = context;

	if ( providerIds.length === 0 ) {
		debugWarn(
			'[StepExecutor] No providers specified, nothing to execute'
		);
		return {};
	}

	// Validate dependencies
	const errors = validateDependencies( steps );
	if ( errors.length > 0 ) {
		throw new Error(
			`Invalid step dependencies: ${ errors.join( '; ' ) }`
		);
	}

	debug(
		`[StepExecutor] Starting execution for ${ providerIds.length } providers`
	);

	// Create executor for managing provider queues
	const executor = new ProviderQueueExecutor( steps, context );

	// Execute all provider queues in parallel
	const results = await executor.executeAll( providerIds );

	debug( '[StepExecutor] All provider queues completed' );

	return results;
}

/**
 * Get execution plan (for backward compatibility and debugging).
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Object} Execution plan information.
 */
export function getExecutionPlan( steps ) {
	return {
		steps: steps.map( ( step ) => ( {
			id: step.id,
			label: step.label,
			globalCache: step.globalCache || false,
			dependencies: step.dependencies || [],
		} ) ),
		globalSteps: steps.filter( ( step ) => step.globalCache ),
		providerSteps: steps.filter( ( step ) => ! step.globalCache ),
	};
}

/**
 * Provider Queue Executor
 *
 * Manages execution of parallel provider queues with global state coordination.
 * Fires WordPress hooks at all lifecycle points instead of using callbacks.
 */
class ProviderQueueExecutor {
	constructor( steps, baseContext ) {
		this.steps = steps;
		this.baseContext = baseContext;
	}

	/**
	 * Execute workflow for all providers in parallel.
	 *
	 * @param {Array<string>} providerIds List of provider IDs.
	 * @return {Promise<Object>} Results per provider.
	 */
	async executeAll( providerIds ) {
		// Execute each provider queue in parallel
		const queuePromises = providerIds.map( ( providerId ) =>
			this.executeProviderQueue( providerId ).catch( ( error ) => {
				// Catch errors to allow other providers to continue
				debugError(
					`[StepExecutor] Provider ${ providerId } failed:`,
					error
				);
				return {
					providerId,
					success: false,
					error: error.message || String( error ),
				};
			} )
		);

		const queueResults = await Promise.all( queuePromises );

		// Convert array to object keyed by providerId
		const results = {};
		queueResults.forEach( ( result ) => {
			results[ result.providerId ] = result;
		} );

		return results;
	}

	/**
	 * Execute workflow for single provider.
	 *
	 * @param {string} providerId Provider identifier.
	 * @return {Promise<Object>} Provider execution result.
	 */
	async executeProviderQueue( providerId ) {
		debug( `[StepExecutor] Starting queue for provider: ${ providerId }` );

		// Create provider-specific context with deep clone to prevent shared references
		// Critical: Shallow spread would share nested objects across all providers
		const providerContext = this._deepCloneContext( this.baseContext );
		providerContext.providerId = providerId;

		// Execute steps sequentially for this provider
		for ( const step of this.steps ) {
			try {
				await this.executeStep( step, providerContext, providerId );
			} catch ( error ) {
				// If a provider-specific step fails, stop this provider's queue
				if ( ! step.globalCache ) {
					debugError(
						`[StepExecutor] Provider ${ providerId } step ${ step.id } failed:`,
						error
					);

					// Fire error hook
					doAction( 'aether.step.error', step.id, providerId, error );

					return {
						providerId,
						success: false,
						error: error.message || String( error ),
						failedStep: step.id,
					};
				}

				// If a global step fails, rethrow to fail all providers
				throw error;
			}
		}

		debug(
			`[StepExecutor] Provider ${ providerId } completed successfully`
		);

		return {
			providerId,
			success: true,
		};
	}

	/**
	 * Execute single step for a provider.
	 *
	 * @param {Object} step            Step definition.
	 * @param {Object} providerContext Provider-specific context.
	 * @param {string} providerId      Provider identifier.
	 * @return {Promise<void>}
	 */
	async executeStep( step, providerContext, providerId ) {
		if ( step.globalCache ) {
			await this.executeGlobalStep( step, providerContext, providerId );
		} else {
			await this.executeProviderStep( step, providerContext, providerId );
		}
	}

	/**
	 * Execute global step (runs once, shared across providers).
	 * NOTE: With caching removed, this now executes independently per provider.
	 * The step handler itself is responsible for managing any shared state.
	 *
	 * @param {Object} step            Step definition.
	 * @param {Object} providerContext Provider-specific context.
	 * @param {string} providerId      Provider identifier.
	 * @return {Promise<void>}
	 */
	async executeGlobalStep( step, providerContext, providerId ) {
		debug(
			`[StepExecutor] Provider ${ providerId } executing global step ${ step.id }`
		);

		// Fire start hook
		doAction( 'aether.step.start', step.id, providerId );

		const result = await step.handler( providerContext );

		// Merge result into context
		Object.assign( providerContext, result );

		// Fire complete hook
		doAction( 'aether.step.complete', step.id, providerId, result );
	}

	/**
	 * Execute provider-specific step (runs independently per provider).
	 *
	 * @param {Object} step            Step definition.
	 * @param {Object} providerContext Provider-specific context.
	 * @param {string} providerId      Provider identifier.
	 * @return {Promise<void>}
	 */
	async executeProviderStep( step, providerContext, providerId ) {
		debug(
			`[StepExecutor] Provider ${ providerId } executing step ${ step.id }`
		);

		// Fire start hook
		doAction( 'aether.step.start', step.id, providerId );

		const result = await step.handler( providerContext );

		// Merge result into context for subsequent steps
		Object.assign( providerContext, result );

		// Fire complete hook
		doAction( 'aether.step.complete', step.id, providerId, result );
	}

	/**
	 * Deep clone context object to prevent shared references between providers.
	 *
	 * Strategy:
	 * - Known shared objects (api, callbacks, assetManager) preserved by reference
	 * - Arrays and plain objects deep cloned
	 * - Functions preserved by reference
	 * - Primitives copied by value
	 *
	 * @private
	 * @param {Object} context - Context object to clone
	 * @return {Object} Deep cloned context
	 */
	_deepCloneContext( context ) {
		const cloned = {};

		// Keys that should always be shared by reference (not cloned)
		const sharedKeys = new Set( [
			'api',
			'assetManager',
			'processStaticSiteUrls',
			'generateBlueprintJson',
			'updateStaticSiteProgressContext',
			'setStatusMessage',
			'setStepProgress',
			'setOverallProgressValue',
			'removeMessage',
			// NOTE: urlData is NOT in sharedKeys - it must be deep cloned per provider
			// to prevent race conditions when providers run in parallel. If shared by reference,
			// providers would modify the same array causing data corruption.
		] );

		for ( const key in context ) {
			if ( ! context.hasOwnProperty( key ) ) {
				continue;
			}

			const value = context[ key ];

			// Preserve shared objects and functions by reference
			if ( sharedKeys.has( key ) || typeof value === 'function' ) {
				cloned[ key ] = value;
				continue;
			}

			// Preserve null and undefined as-is
			if ( value === null || value === undefined ) {
				cloned[ key ] = value;
				continue;
			}

			// Deep clone objects and arrays
			if ( typeof value === 'object' ) {
				try {
					// Use structuredClone if available (modern browsers)
					if ( typeof structuredClone === 'function' ) {
						cloned[ key ] = structuredClone( value );
					} else {
						// Fallback: JSON serialization
						cloned[ key ] = JSON.parse( JSON.stringify( value ) );
					}
				} catch ( error ) {
					// If cloning fails (e.g., circular references), use reference
					// This is safe for objects that are meant to be shared
					debug(
						`[StepExecutor] Cannot clone context.${ key }, using reference (this is normal for complex objects)`
					);
					cloned[ key ] = value;
				}
				continue;
			}

			// Primitives (string, number, boolean) - copy by value
			cloned[ key ] = value;
		}

		return cloned;
	}
}
