/**
 * Fetch with Retry Utility
 *
 * Provides automatic retry logic for network requests using p-retry.
 * Uses centralized retry configuration from timing.js constants.
 *
 */

import pRetry from 'p-retry';
import {
	MAX_RETRIES,
	RETRY_INITIAL_DELAY,
	RETRY_MAX_DELAY,
} from '../constants/timing';

/**
 * Fetch with automatic retry logic using exponential backoff.
 *
 * @param {string}   url                         The URL to fetch.
 * @param {Object}   options                     Fetch options (headers, method, body, etc.).
 * @param {Object}   retryConfig                 Optional retry configuration.
 * @param {number}   retryConfig.retries         Maximum retry attempts (default: MAX_RETRIES).
 * @param {number}   retryConfig.minTimeout      Initial delay in ms (default: RETRY_INITIAL_DELAY).
 * @param {number}   retryConfig.maxTimeout      Maximum delay in ms (default: RETRY_MAX_DELAY).
 * @param {Function} retryConfig.onFailedAttempt Callback for failed attempts.
 * @return {Promise<Response>} The fetch response.
 * @throws {Error} If all retry attempts fail.
 */
export async function fetchWithRetry( url, options = {}, retryConfig = {} ) {
	return pRetry(
		async () => {
			const response = await fetch( url, options );

			// Throw on non-OK responses to trigger retry.
			if ( ! response.ok ) {
				const error = new Error(
					`HTTP ${ response.status }: ${ response.statusText }`
				);
				error.response = response;
				error.status = response.status;
				throw error;
			}

			return response;
		},
		{
			retries: retryConfig.retries ?? MAX_RETRIES,
			minTimeout: retryConfig.minTimeout ?? RETRY_INITIAL_DELAY,
			maxTimeout: retryConfig.maxTimeout ?? RETRY_MAX_DELAY,
			onFailedAttempt: retryConfig.onFailedAttempt,
			...retryConfig,
		}
	);
}
