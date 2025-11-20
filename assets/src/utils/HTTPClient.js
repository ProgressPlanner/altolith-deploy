/**
 * HTTP Client
 *
 * Abstraction layer for HTTP requests to enable testing.
 * Provides mockable interface for fetch operations.
 *
 * @package
 */

/**
 * Production HTTP Client
 *
 * Uses native fetch API for actual HTTP requests.
 */
export class HTTPClient {
	/**
	 * Perform GET request
	 *
	 * @param {string} url     - URL to fetch
	 * @param {Object} options - Fetch options
	 * @return {Promise<Response>} Fetch response
	 */
	async get( url, options = {} ) {
		return await fetch( url, {
			method: 'GET',
			...options,
		} );
	}

	/**
	 * Perform POST request
	 *
	 * @param {string} url     - URL to post to
	 * @param {Object} data    - Data to send
	 * @param {Object} options - Fetch options
	 * @return {Promise<Response>} Fetch response
	 */
	async post( url, data, options = {} ) {
		const { headers = {}, ...otherOptions } = options;
		return await fetch( url, {
			method: 'POST',
			body: JSON.stringify( data ),
			...otherOptions,
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
		} );
	}

	/**
	 * Perform PUT request
	 *
	 * @param {string} url     - URL to put to
	 * @param {Object} data    - Data to send
	 * @param {Object} options - Fetch options
	 * @return {Promise<Response>} Fetch response
	 */
	async put( url, data, options = {} ) {
		const { headers = {}, ...otherOptions } = options;
		return await fetch( url, {
			method: 'PUT',
			body: JSON.stringify( data ),
			...otherOptions,
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
		} );
	}

	/**
	 * Perform DELETE request
	 *
	 * @param {string} url     - URL to delete
	 * @param {Object} options - Fetch options
	 * @return {Promise<Response>} Fetch response
	 */
	async delete( url, options = {} ) {
		return await fetch( url, {
			method: 'DELETE',
			...options,
		} );
	}

	/**
	 * Generic fetch method for custom requests
	 *
	 * @param {string} url     - URL to fetch
	 * @param {Object} options - Full fetch options
	 * @return {Promise<Response>} Fetch response
	 */
	async fetch( url, options = {} ) {
		return await fetch( url, options );
	}
}

/**
 * Mock HTTP Client for testing
 *
 * Allows pre-configured responses without actual HTTP requests.
 */
export class MockHTTPClient {
	/**
	 * Create mock client
	 *
	 * @param {Object} responses - Map of URL patterns to responses
	 * @param {Object} config    - Configuration options
	 */
	constructor( responses = {}, config = {} ) {
		// Use Map to support RegExp keys
		this.responses = new Map();
		// Add initial responses
		Object.entries( responses ).forEach( ( [ pattern, response ] ) => {
			this.responses.set( pattern, response );
		} );
		this.requests = []; // Track all requests for assertions
		this.config = {
			throwOnUnmocked: false, // Whether to throw on unmocked URLs
			...config,
		};
	}

	/**
	 * Set response for a URL pattern
	 *
	 * @param {string|RegExp}   pattern  - URL pattern to match
	 * @param {Object|Function} response - Response object or factory function
	 */
	setResponse( pattern, response ) {
		this.responses.set( pattern, response );
	}

	/**
	 * Get response for URL
	 *
	 * @param {string} url     - URL to match
	 * @param {Object} options - Request options
	 * @return {Object} Response configuration
	 */
	_getResponse( url, options ) {
		// Try exact match first
		if ( this.responses.has( url ) ) {
			const response = this.responses.get( url );
			return typeof response === 'function'
				? response( url, options )
				: response;
		}

		// Try pattern matching
		for ( const [ pattern, response ] of this.responses.entries() ) {
			if ( pattern instanceof RegExp && pattern.test( url ) ) {
				return typeof response === 'function'
					? response( url, options )
					: response;
			}
		}

		if ( this.config.throwOnUnmocked ) {
			throw new Error( `No mock response configured for URL: ${ url }` );
		}

		// Default 404 response
		return {
			status: 404,
			statusText: 'Not Found',
			body: 'No mock response configured',
		};
	}

	/**
	 * Create mock Response object
	 *
	 * @param {Object} config - Response configuration
	 * @return {Object} Mock response with promise methods
	 */
	_createResponse( config ) {
		const {
			status = 200,
			statusText = 'OK',
			headers = {},
			body = '',
		} = config;

		return {
			status,
			statusText,
			headers,
			ok: status >= 200 && status < 300,
			text: async () => body,
			json: async () => {
				try {
					return typeof body === 'string' ? JSON.parse( body ) : body;
				} catch ( e ) {
					throw new Error( 'Invalid JSON' );
				}
			},
			blob: async () => new Blob( [ body ] ),
			arrayBuffer: async () => new ArrayBuffer( body.length ),
		};
	}

	/**
	 * Perform GET request
	 *
	 * @param {string} url     - URL to fetch
	 * @param {Object} options - Fetch options
	 * @return {Promise<Object>} Mock response
	 */
	async get( url, options = {} ) {
		const requestOptions = { method: 'GET', ...options };
		this.requests.push( { url, options: requestOptions } );

		const responseConfig = this._getResponse( url, requestOptions );
		return this._createResponse( responseConfig );
	}

	/**
	 * Perform POST request
	 *
	 * @param {string} url     - URL to post to
	 * @param {Object} data    - Data to send
	 * @param {Object} options - Fetch options
	 * @return {Promise<Object>} Mock response
	 */
	async post( url, data, options = {} ) {
		const requestOptions = {
			method: 'POST',
			body: JSON.stringify( data ),
			...options,
		};
		this.requests.push( { url, options: requestOptions, data } );

		const responseConfig = this._getResponse( url, requestOptions );
		return this._createResponse( responseConfig );
	}

	/**
	 * Perform PUT request
	 *
	 * @param {string} url     - URL to put to
	 * @param {Object} data    - Data to send
	 * @param {Object} options - Fetch options
	 * @return {Promise<Object>} Mock response
	 */
	async put( url, data, options = {} ) {
		const requestOptions = {
			method: 'PUT',
			body: JSON.stringify( data ),
			...options,
		};
		this.requests.push( { url, options: requestOptions, data } );

		const responseConfig = this._getResponse( url, requestOptions );
		return this._createResponse( responseConfig );
	}

	/**
	 * Perform DELETE request
	 *
	 * @param {string} url     - URL to delete
	 * @param {Object} options - Fetch options
	 * @return {Promise<Object>} Mock response
	 */
	async delete( url, options = {} ) {
		const requestOptions = { method: 'DELETE', ...options };
		this.requests.push( { url, options: requestOptions } );

		const responseConfig = this._getResponse( url, requestOptions );
		return this._createResponse( responseConfig );
	}

	/**
	 * Generic fetch method
	 *
	 * @param {string} url     - URL to fetch
	 * @param {Object} options - Full fetch options
	 * @return {Promise<Object>} Mock response
	 */
	async fetch( url, options = {} ) {
		this.requests.push( { url, options } );

		const responseConfig = this._getResponse( url, options );
		return this._createResponse( responseConfig );
	}

	/**
	 * Get all requests made
	 *
	 * @return {Array<Object>} Array of request records
	 */
	getRequests() {
		return [ ...this.requests ];
	}

	/**
	 * Clear request history
	 */
	clearRequests() {
		this.requests = [];
	}

	/**
	 * Get requests matching URL pattern
	 *
	 * @param {string|RegExp} pattern - URL pattern to match
	 * @return {Array<Object>} Matching requests
	 */
	getRequestsMatching( pattern ) {
		const regex =
			pattern instanceof RegExp ? pattern : new RegExp( pattern );
		return this.requests.filter( ( req ) => regex.test( req.url ) );
	}
}

/**
 * Default HTTP client instance
 */
export const defaultHTTPClient = new HTTPClient();
