/**
 * Mock Storage Provider
 *
 * Mock implementation for testing storage-related functionality.
 */

export class MockStorageProvider {
	constructor() {
		this.objects = new Map();
		this.failOperations = new Set();
		this.callCounts = {};
		this.callArgs = {};
	}

	/**
	 * Mock upload operation
	 *
	 * @param {string} localPath - Local file path
	 * @param {string} remoteKey - Remote object key
	 * @return {Promise<Object>} Upload result
	 */
	async upload( localPath, remoteKey ) {
		this._trackCall( 'upload', [ localPath, remoteKey ] );

		if ( this.failOperations.has( 'upload' ) ) {
			throw new Error( 'Mock upload failure' );
		}

		// Store object
		this.objects.set( remoteKey, {
			key: remoteKey,
			size: 1024, // Mock size
			lastModified: Date.now(),
			localPath,
		} );

		return {
			success: true,
			key: remoteKey,
		};
	}

	/**
	 * Mock batch delete operation
	 *
	 * @param {Array<string>} keys - Keys to delete
	 * @return {Promise<Object>} Delete result
	 */
	async batchDelete( keys ) {
		this._trackCall( 'batchDelete', [ keys ] );

		if ( this.failOperations.has( 'batchDelete' ) ) {
			throw new Error( 'Mock batch delete failure' );
		}

		let deleted = 0;
		let errors = 0;

		keys.forEach( ( key ) => {
			if ( this.objects.has( key ) ) {
				this.objects.delete( key );
				deleted++;
			} else {
				errors++;
			}
		} );

		return {
			deleted,
			errors,
		};
	}

	/**
	 * Mock batch copy operation
	 *
	 * @param {Array<Object>} operations - Copy operations [{source, dest}]
	 * @return {Promise<Object>} Copy result
	 */
	async batchCopy( operations ) {
		this._trackCall( 'batchCopy', [ operations ] );

		if ( this.failOperations.has( 'batchCopy' ) ) {
			throw new Error( 'Mock batch copy failure' );
		}

		let copied = 0;
		let errors = 0;

		operations.forEach( ( { source, dest } ) => {
			if ( this.objects.has( source ) ) {
				const sourceObj = this.objects.get( source );
				this.objects.set( dest, {
					...sourceObj,
					key: dest,
				} );
				copied++;
			} else {
				errors++;
			}
		} );

		return {
			copied,
			errors,
		};
	}

	/**
	 * Mock exists check
	 *
	 * @param {string} key - Object key
	 * @return {Promise<boolean>} True if exists
	 */
	async exists( key ) {
		this._trackCall( 'exists', [ key ] );

		if ( this.failOperations.has( 'exists' ) ) {
			return false;
		}

		return this.objects.has( key );
	}

	/**
	 * Add object to mock storage
	 *
	 * @param {string} key      - Object key
	 * @param {Object} metadata - Object metadata
	 */
	addObject( key, metadata = {} ) {
		this.objects.set( key, {
			key,
			size: 1024,
			lastModified: Date.now(),
			...metadata,
		} );
	}

	/**
	 * Set operation to fail
	 *
	 * @param {string} operation - Operation name
	 */
	setFail( operation ) {
		this.failOperations.add( operation );
	}

	/**
	 * Clear failure for operation
	 *
	 * @param {string} operation - Operation name
	 */
	clearFail( operation ) {
		this.failOperations.delete( operation );
	}

	/**
	 * Get call count for method
	 *
	 * @param {string} method - Method name
	 * @return {number} Call count
	 */
	getCallCount( method ) {
		return this.callCounts[ method ] || 0;
	}

	/**
	 * Get call arguments for method
	 *
	 * @param {string} method    - Method name
	 * @param {number} callIndex - Call index (0-based)
	 * @return {Array|null} Call arguments
	 */
	getCallArgs( method, callIndex = 0 ) {
		return this.callArgs[ method ]?.[ callIndex ] || null;
	}

	/**
	 * Reset all mock data
	 */
	reset() {
		this.objects.clear();
		this.failOperations.clear();
		this.callCounts = {};
		this.callArgs = {};
	}

	/**
	 * Get all stored objects
	 *
	 * @return {Array<Object>} All objects
	 */
	getAllObjects() {
		return Array.from( this.objects.values() );
	}

	/**
	 * Get object count
	 *
	 * @return {number} Number of objects
	 */
	getObjectCount() {
		return this.objects.size;
	}

	/**
	 * Track method call
	 *
	 * @private
	 * @param {string} method - Method name
	 * @param {Array}  args   - Method arguments
	 */
	_trackCall( method, args ) {
		if ( ! this.callCounts[ method ] ) {
			this.callCounts[ method ] = 0;
			this.callArgs[ method ] = [];
		}

		this.callCounts[ method ]++;
		this.callArgs[ method ].push( args );
	}
}
