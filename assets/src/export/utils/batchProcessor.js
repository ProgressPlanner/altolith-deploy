/**
 * Batch Processor Utility
 *
 * Processes items in controlled batches to prevent overwhelming resources.
 * Useful for rate-limited APIs, resource-constrained systems, or controlled parallelization.
 *
 * @since 1.0.0
 */

/**
 * Process items in batches with controlled concurrency
 *
 * @param {Array}    items           Items to process
 * @param {Function} processFn       Async function to process each item
 * @param {number}   batchSize       Max items to process simultaneously
 * @param {Function} onBatchComplete Optional callback after each batch completes
 * @return {Promise<Array>} Array of results in same order as items
 */
export async function processBatch(
	items,
	processFn,
	batchSize = 10,
	onBatchComplete = null
) {
	const results = [];
	const totalItems = items.length;

	// Process items in batches
	for ( let i = 0; i < totalItems; i += batchSize ) {
		const batch = items.slice( i, i + batchSize );
		const batchNumber = Math.floor( i / batchSize ) + 1;
		const totalBatches = Math.ceil( totalItems / batchSize );

		// Process batch in parallel
		const batchResults = await Promise.all(
			batch.map( ( item, index ) => processFn( item, i + index ) )
		);

		results.push( ...batchResults );

		// Call callback if provided
		if ( onBatchComplete ) {
			onBatchComplete( {
				batchNumber,
				totalBatches,
				itemsProcessed: results.length,
				totalItems,
				batchResults,
			} );
		}
	}

	return results;
}

/**
 * Process items with dynamic batch size based on provider configuration
 *
 * Gets batch size from provider config, with fallbacks to provider defaults and global default.
 *
 * @param {Array}    items                   Items to process
 * @param {Function} processFn               Async function to process each item
 * @param {Object}   options                 Options object
 * @param {Object}   options.providerConfig  Provider instance configuration
 * @param {number}   options.providerDefault Default batch size for this provider type
 * @param {number}   options.globalDefault   Global default batch size (default: 10)
 * @param {Function} options.onBatchComplete Optional callback after each batch
 * @return {Promise<Array>} Array of results in same order as items
 */
export async function processWithProviderBatching(
	items,
	processFn,
	{
		providerConfig = {},
		providerDefault = null,
		globalDefault = 10,
		onBatchComplete = null,
	} = {}
) {
	// Determine batch size with fallback chain:
	// 1. Instance config override
	// 2. Provider type default
	// 3. Global default
	const batchSize =
		providerConfig.maxSimultaneousUploads ??
		providerDefault ??
		globalDefault;

	return processBatch( items, processFn, batchSize, onBatchComplete );
}

export default {
	processBatch,
	processWithProviderBatching,
};
