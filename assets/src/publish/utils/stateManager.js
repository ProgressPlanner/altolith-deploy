/**
 * State Manager Utility
 *
 * Manages workflow state persistence using IndexedDB.
 * Uses a single database with provider instance keys for state isolation.
 * State is automatically saved and can be resumed after failures.
 *
 * @package
 */

import { debug, debugWarn } from '../../utils/debug';
import IndexedDBStore, { isIndexedDBAvailable } from '../../utils/indexedDB';

const DB_CONFIG = {
	dbName: 'aether-publish-state',
	version: 1,
	stores: {
		workflowState: {
			keyPath: 'stateKey',
			indexes: [
				{ name: 'workflowId', keyPath: 'workflowId', unique: false },
			],
		},
	},
};

// Initialize store instance
let storeInstance = null;

/**
 * Get or create IndexedDB store instance.
 *
 * @return {IndexedDBStore|null} Store instance or null if unavailable.
 */
function getStore() {
	if ( ! isIndexedDBAvailable() ) {
		debugWarn(
			'[StateManager] IndexedDB not available, state will not persist'
		);
		return null;
	}

	if ( ! storeInstance ) {
		storeInstance = new IndexedDBStore( 'workflowState', DB_CONFIG );
	}

	return storeInstance;
}

/**
 * Generate a state key from workflow ID and provider instance.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {string} State key.
 */
function generateStateKey( workflowId, providerInstance = null ) {
	if ( providerInstance ) {
		return `${ workflowId }::${ providerInstance }`;
	}
	return workflowId;
}

/**
 * Save workflow state to IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {Object} state            State object to save.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<void>}
 */
async function saveState( workflowId, state, providerInstance = null ) {
	const store = getStore();
	if ( ! store ) {
		return; // Silently fail if IndexedDB unavailable
	}

	const stateKey = generateStateKey( workflowId, providerInstance );

	const stateData = {
		stateKey,
		workflowId,
		providerInstance: providerInstance || null,
		state,
		timestamp: Date.now(),
	};

	try {
		await store.set( stateKey, stateData );
		debug( `[StateManager] Saved state for ${ stateKey }` );
	} catch ( error ) {
		debugWarn( '[StateManager] Failed to save state:', error );
		// Don't throw - state persistence is non-critical
	}
}

/**
 * Load workflow state from IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<Object|null>} State object or null if not found.
 */
async function loadState( workflowId, providerInstance = null ) {
	const store = getStore();
	if ( ! store ) {
		return null;
	}

	const stateKey = generateStateKey( workflowId, providerInstance );

	try {
		const result = await store.get( stateKey );
		if ( result && result.state ) {
			debug( `[StateManager] Loaded state for ${ stateKey }` );
			return result.state;
		}
		return null;
	} catch ( error ) {
		debugWarn( '[StateManager] Failed to load state:', error );
		return null;
	}
}

/**
 * Delete workflow state from IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional, null deletes all for workflow).
 * @return {Promise<void>}
 */
async function deleteState( workflowId, providerInstance = null ) {
	const store = getStore();
	if ( ! store ) {
		return;
	}

	try {
		if ( providerInstance ) {
			// Delete specific provider instance state
			const stateKey = generateStateKey( workflowId, providerInstance );
			await store.delete( stateKey );
		} else {
			// Delete all states for this workflow
			// Get all states for this workflow using index
			const allStates = await store.getByIndex(
				'workflowId',
				workflowId
			);

			// Delete each state
			for ( const stateItem of allStates ) {
				await store.delete( stateItem.stateKey );
			}
		}

		debug(
			`[StateManager] Deleted state for ${ workflowId }${
				providerInstance ? `::${ providerInstance }` : ''
			}`
		);
	} catch ( error ) {
		debugWarn( '[StateManager] Failed to delete state:', error );
		// Don't throw - cleanup is non-critical
	}
}

/**
 * List all workflow states for a workflow ID.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<Array<Object>>} Array of state objects.
 */
async function listStates( workflowId ) {
	const store = getStore();
	if ( ! store ) {
		return [];
	}

	try {
		const allStates = await store.getByIndex( 'workflowId', workflowId );
		return allStates.map( ( stateItem ) => ( {
			stateKey: stateItem.stateKey,
			providerInstance: stateItem.providerInstance,
			timestamp: stateItem.timestamp,
		} ) );
	} catch ( error ) {
		debugWarn( '[StateManager] Failed to list states:', error );
		return [];
	}
}

/**
 * Create a state manager instance for a workflow.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Object} State manager instance.
 */
export function createStateManager( workflowId ) {
	/**
	 * Save workflow state.
	 *
	 * @param {Object} state            State object to save.
	 * @param {string} providerInstance Provider instance ID (optional).
	 * @return {Promise<void>}
	 */
	async function save( state, providerInstance = null ) {
		await saveState( workflowId, state, providerInstance );
	}

	/**
	 * Load workflow state.
	 *
	 * @param {string} providerInstance Provider instance ID (optional).
	 * @return {Promise<Object|null>} State object or null.
	 */
	async function load( providerInstance = null ) {
		return await loadState( workflowId, providerInstance );
	}

	/**
	 * Delete workflow state.
	 *
	 * @param {string} providerInstance Provider instance ID (optional, null deletes all).
	 * @return {Promise<void>}
	 */
	async function clear( providerInstance = null ) {
		await deleteState( workflowId, providerInstance );
	}

	/**
	 * List all states for this workflow.
	 *
	 * @return {Promise<Array<Object>>} Array of state metadata.
	 */
	async function list() {
		return await listStates( workflowId );
	}

	return {
		save,
		load,
		clear,
		list,
	};
}

/**
 * Save execution context state.
 *
 * This is a helper function that saves the relevant parts of the execution context.
 *
 * @param {Object} stateManager     State manager instance.
 * @param {Object} executionContext Execution context to save.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<void>}
 */
export async function saveExecutionContext(
	stateManager,
	executionContext,
	providerInstance = null
) {
	// Extract relevant state (exclude functions and non-serializable data)
	const stateToSave = {
		completedSteps: executionContext.completedSteps || [],
		skippedSteps: executionContext.skippedSteps || [],
		state: executionContext.state || {},
		// Save step results
		stepResults: {},
		// Save provider-specific data
		providers: {
			staticSiteProviders: executionContext.staticSiteProviders || [],
			blueprintBundleProviders:
				executionContext.blueprintBundleProviders || [],
			edgeFunctionProviders: executionContext.edgeFunctionProviders || [],
		},
		// Save configuration
		siteUrl: executionContext.siteUrl,
		staticSiteUrl: executionContext.staticSiteUrl,
		blueprintData: executionContext.blueprintData,
	};

	// Extract step results from state
	if ( executionContext.state ) {
		for ( const [ key, value ] of Object.entries(
			executionContext.state
		) ) {
			if (
				key.includes( 'Result' ) ||
				key.includes( 'Bundle' ) ||
				key.includes( 'Urls' )
			) {
				stateToSave.stepResults[ key ] = value;
			}
		}
	}

	await stateManager.save( stateToSave, providerInstance );
}

/**
 * Restore execution context from saved state.
 *
 * @param {Object} stateManager     State manager instance.
 * @param {Object} baseContext      Base context to merge with.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<Object>} Restored execution context.
 */
export async function restoreExecutionContext(
	stateManager,
	baseContext,
	providerInstance = null
) {
	const savedState = await stateManager.load( providerInstance );

	if ( ! savedState ) {
		return baseContext;
	}

	// Merge saved state into base context
	const restoredContext = {
		...baseContext,
		completedSteps: savedState.completedSteps || [],
		skippedSteps: savedState.skippedSteps || [],
		state: {
			...baseContext.state,
			...savedState.state,
			...savedState.stepResults,
		},
	};

	// Restore provider arrays if available
	if ( savedState.providers ) {
		restoredContext.staticSiteProviders =
			savedState.providers.staticSiteProviders ||
			baseContext.staticSiteProviders;
		restoredContext.blueprintBundleProviders =
			savedState.providers.blueprintBundleProviders ||
			baseContext.blueprintBundleProviders;
		restoredContext.edgeFunctionProviders =
			savedState.providers.edgeFunctionProviders ||
			baseContext.edgeFunctionProviders;
	}

	// Restore configuration
	if ( savedState.siteUrl ) {
		restoredContext.siteUrl = savedState.siteUrl;
	}
	if ( savedState.staticSiteUrl ) {
		restoredContext.staticSiteUrl = savedState.staticSiteUrl;
	}
	if ( savedState.blueprintData ) {
		restoredContext.blueprintData = savedState.blueprintData;
	}

	return restoredContext;
}
