/**
 * HTTP Client
 *
 * Abstraction layer for HTTP requests to enable testing.
 * Provides mockable interface for fetch operations.
 *
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
 * Default HTTP client instance
 */
export const defaultHTTPClient = new HTTPClient();
