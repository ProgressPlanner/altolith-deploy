/**
 * Storage Abstraction Layer
 *
 * Provides a testable abstraction over localStorage with:
 * - Automatic JSON serialization/deserialization
 * - Error handling for quota exceeded and other errors
 * - Consistent API that can be easily mocked in tests
 * - Support for default values
 *
 */

/**
 * Storage abstraction object.
 *
 * @type {Object}
 */
export const storage = {
	/**
	 * Get a value from storage.
	 *
	 * @param {string} key          Storage key.
	 * @param {*}      defaultValue Optional default value if key doesn't exist or parse fails.
	 * @return {*} Parsed value, default value, or null.
	 */
	get( key, defaultValue = null ) {
		try {
			const item = localStorage.getItem( key );

			if ( item === null ) {
				return defaultValue;
			}

			try {
				return JSON.parse( item );
			} catch ( parseError ) {
				// If JSON parsing fails, return default value
				return defaultValue;
			}
		} catch ( error ) {
			// Handle localStorage access errors
			return defaultValue;
		}
	},

	/**
	 * Set a value in storage.
	 *
	 * @param {string} key   Storage key.
	 * @param {*}      value Value to store (will be JSON serialized).
	 * @return {boolean} True on success, false on error.
	 */
	set( key, value ) {
		try {
			const serialized = JSON.stringify( value );
			localStorage.setItem( key, serialized );
			return true;
		} catch ( error ) {
			// Handle quota exceeded, circular references, or other errors
			return false;
		}
	},

	/**
	 * Remove a value from storage.
	 *
	 * @param {string} key Storage key.
	 * @return {boolean} True on success, false on error.
	 */
	remove( key ) {
		try {
			localStorage.removeItem( key );
			return true;
		} catch ( error ) {
			return false;
		}
	},

	/**
	 * Clear all storage.
	 *
	 * @return {boolean} True on success, false on error.
	 */
	clear() {
		try {
			localStorage.clear();
			return true;
		} catch ( error ) {
			return false;
		}
	},

	/**
	 * Check if a key exists in storage.
	 *
	 * @param {string} key Storage key.
	 * @return {boolean} True if key exists, false otherwise.
	 */
	has( key ) {
		try {
			return localStorage.getItem( key ) !== null;
		} catch ( error ) {
			return false;
		}
	},

	/**
	 * Get all keys in storage.
	 *
	 * @return {Array<string>} Array of storage keys.
	 */
	keys() {
		try {
			const keys = [];
			for ( let i = 0; i < localStorage.length; i++ ) {
				const key = localStorage.key( i );
				if ( key !== null ) {
					keys.push( key );
				}
			}
			return keys;
		} catch ( error ) {
			return [];
		}
	},
};
