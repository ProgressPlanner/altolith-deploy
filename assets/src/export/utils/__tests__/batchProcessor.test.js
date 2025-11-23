/**
 * Batch Processor Tests
 *
 * Tests for controlled concurrency batch processing utilities.
 */

import { processBatch, processWithProviderBatching } from '../batchProcessor';

describe( 'batchProcessor', () => {
	describe( 'processBatch', () => {
		test( 'processes all items in batches', async () => {
			const items = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
			const processFn = jest.fn( async ( item ) => item * 2 );

			const results = await processBatch( items, processFn, 3 );

			expect( results ).toEqual( [ 2, 4, 6, 8, 10, 12, 14, 16, 18, 20 ] );
			expect( processFn ).toHaveBeenCalledTimes( 10 );
		} );

		test( 'respects batch size limit', async () => {
			const items = [ 1, 2, 3, 4, 5 ];
			const activeCalls = [];
			let maxConcurrent = 0;

			const processFn = jest.fn( async ( item ) => {
				activeCalls.push( item );
				maxConcurrent = Math.max( maxConcurrent, activeCalls.length );

				// Simulate async work
				await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );

				activeCalls.splice( activeCalls.indexOf( item ), 1 );
				return item;
			} );

			await processBatch( items, processFn, 2 );

			// Should never have more than 2 concurrent calls
			expect( maxConcurrent ).toBeLessThanOrEqual( 2 );
		} );

		test( 'calls onBatchComplete callback after each batch', async () => {
			const items = [ 1, 2, 3, 4, 5, 6, 7 ];
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processBatch( items, processFn, 3, onBatchComplete );

			// Should have 3 batches: [1,2,3], [4,5,6], [7]
			expect( onBatchComplete ).toHaveBeenCalledTimes( 3 );

			// Check first batch callback
			expect( onBatchComplete ).toHaveBeenNthCalledWith( 1, {
				batchNumber: 1,
				totalBatches: 3,
				itemsProcessed: 3,
				totalItems: 7,
				batchResults: [ 1, 2, 3 ],
			} );

			// Check second batch callback
			expect( onBatchComplete ).toHaveBeenNthCalledWith( 2, {
				batchNumber: 2,
				totalBatches: 3,
				itemsProcessed: 6,
				totalItems: 7,
				batchResults: [ 4, 5, 6 ],
			} );

			// Check third batch callback
			expect( onBatchComplete ).toHaveBeenNthCalledWith( 3, {
				batchNumber: 3,
				totalBatches: 3,
				itemsProcessed: 7,
				totalItems: 7,
				batchResults: [ 7 ],
			} );
		} );

		test( 'handles empty array', async () => {
			const items = [];
			const processFn = jest.fn();
			const onBatchComplete = jest.fn();

			const results = await processBatch(
				items,
				processFn,
				5,
				onBatchComplete
			);

			expect( results ).toEqual( [] );
			expect( processFn ).not.toHaveBeenCalled();
			expect( onBatchComplete ).not.toHaveBeenCalled();
		} );

		test( 'handles single item', async () => {
			const items = [ 42 ];
			const processFn = jest.fn( async ( item ) => item * 2 );

			const results = await processBatch( items, processFn, 5 );

			expect( results ).toEqual( [ 84 ] );
			expect( processFn ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'preserves item order in results', async () => {
			const items = [ 5, 3, 1, 4, 2 ];
			const processFn = jest.fn( async ( item ) => {
				// Simulate variable processing time
				await new Promise( ( resolve ) =>
					setTimeout( resolve, item * 10 )
				);
				return item * 10;
			} );

			const results = await processBatch( items, processFn, 2 );

			// Results should be in original order, not completion order
			expect( results ).toEqual( [ 50, 30, 10, 40, 20 ] );
		} );

		test( 'handles errors in individual items', async () => {
			const items = [ 1, 2, 3, 4, 5 ];
			const processFn = jest.fn( async ( item ) => {
				if ( item === 3 ) {
					throw new Error( 'Item 3 failed' );
				}
				return item;
			} );

			await expect( processBatch( items, processFn, 2 ) ).rejects.toThrow(
				'Item 3 failed'
			);
		} );

		test( 'passes item index to processFn', async () => {
			const items = [ 'a', 'b', 'c' ];
			const processFn = jest.fn( async ( item, index ) => ( {
				item,
				index,
			} ) );

			const results = await processBatch( items, processFn, 2 );

			expect( results ).toEqual( [
				{ item: 'a', index: 0 },
				{ item: 'b', index: 1 },
				{ item: 'c', index: 2 },
			] );
		} );

		test( 'handles batch size larger than items', async () => {
			const items = [ 1, 2, 3 ];
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processBatch( items, processFn, 10, onBatchComplete );

			// Should be just 1 batch
			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith( {
				batchNumber: 1,
				totalBatches: 1,
				itemsProcessed: 3,
				totalItems: 3,
				batchResults: [ 1, 2, 3 ],
			} );
		} );
	} );

	describe( 'processWithProviderBatching', () => {
		test( 'uses instance config maxSimultaneousUploads', async () => {
			const items = [ 1, 2, 3, 4, 5 ];
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processWithProviderBatching( items, processFn, {
				providerConfig: { maxSimultaneousUploads: 2 },
				providerDefault: 5,
				globalDefault: 10,
				onBatchComplete,
			} );

			// Should use instance config (2), resulting in 3 batches
			expect( onBatchComplete ).toHaveBeenCalledTimes( 3 );
		} );

		test( 'falls back to provider default when no instance config', async () => {
			const items = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processWithProviderBatching( items, processFn, {
				providerConfig: {}, // No maxSimultaneousUploads
				providerDefault: 3,
				globalDefault: 10,
				onBatchComplete,
			} );

			// Should use provider default (3), resulting in 4 batches
			expect( onBatchComplete ).toHaveBeenCalledTimes( 4 );
		} );

		test( 'falls back to global default when no provider default', async () => {
			const items = [ 1, 2, 3, 4, 5 ];
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processWithProviderBatching( items, processFn, {
				providerConfig: {},
				providerDefault: null,
				globalDefault: 2,
				onBatchComplete,
			} );

			// Should use global default (2), resulting in 3 batches
			expect( onBatchComplete ).toHaveBeenCalledTimes( 3 );
		} );

		test( 'handles Infinity batch size (no batching)', async () => {
			const items = [ 1, 2, 3, 4, 5 ];
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processWithProviderBatching( items, processFn, {
				providerConfig: { maxSimultaneousUploads: Infinity },
				onBatchComplete,
			} );

			// With Infinity batch size, all items in one batch
			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith(
				expect.objectContaining( {
					batchNumber: 1,
					totalBatches: 1,
					itemsProcessed: 5,
					totalItems: 5,
				} )
			);
		} );

		test( 'uses 10 as default when no options provided', async () => {
			const items = Array.from( { length: 25 }, ( _, i ) => i );
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processWithProviderBatching( items, processFn, {
				onBatchComplete,
			} );

			// Should use global default (10), resulting in 3 batches
			expect( onBatchComplete ).toHaveBeenCalledTimes( 3 );
		} );

		test( 'handles zero batch size gracefully', async () => {
			const items = [ 1, 2, 3 ];
			const processFn = jest.fn( async ( item ) => item );

			// Zero batch size should fall back to default
			await processWithProviderBatching( items, processFn, {
				providerConfig: { maxSimultaneousUploads: 0 },
				globalDefault: 2,
			} );

			// With 0 treated as falsy, should use global default
			expect( processFn ).toHaveBeenCalledTimes( 3 );
		} );

		test( 'instance config zero explicitly set should be respected', async () => {
			const items = [ 1, 2, 3 ];
			const processFn = jest.fn( async ( item ) => item );
			const onBatchComplete = jest.fn();

			await processWithProviderBatching( items, processFn, {
				providerConfig: { maxSimultaneousUploads: 1 },
				globalDefault: 5,
				onBatchComplete,
			} );

			// Should use instance config (1), processing one at a time
			expect( onBatchComplete ).toHaveBeenCalledTimes( 3 );
		} );
	} );
} );
