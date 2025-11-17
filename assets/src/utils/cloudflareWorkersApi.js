/**
 * Cloudflare Workers API Client
 *
 * Client for Cloudflare Workers API (v4).
 * Handles worker deployment, retrieval, and management.
 *
 * @package
 */

import { parseErrorResponseWithStatus } from './errorParser';
import { createAuthHeaders } from './api';
import { createSuccessResponse, createErrorResponse } from './standardResponse';

/**
 * Cloudflare API base URL.
 */
const API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Deploy a worker to Cloudflare.
 *
 * @param {string} accountId  Cloudflare account ID.
 * @param {string} apiToken   Cloudflare API token.
 * @param {string} workerName Worker name.
 * @param {string} script     Worker script content.
 * @param {Object} bindings   Optional worker bindings (storage buckets, KV namespaces, etc.).
 * @return {Promise<Object>} Deployment result with success, workerName, workerUrl, and optional error.
 */
export async function deployWorker(
	accountId,
	apiToken,
	workerName,
	script,
	bindings = {}
) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts/${ workerName }`;

	// Create multipart/form-data body for ES module upload.
	const boundary = generateBoundary();
	const body = buildMultipartBody( script, bindings, boundary );

	const authHeaders = createAuthHeaders( apiToken );
	const response = await fetch( url, {
		method: 'PUT',
		headers: {
			...authHeaders,
			'Content-Type': `multipart/form-data; boundary=${ boundary }`,
		},
		body,
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'Worker deployment'
		);
		return createErrorResponse( errorMessage );
	}

	const workerUrl = `https://${ workerName }.workers.dev`;

	return createSuccessResponse( { workerName, workerUrl } );
}

/**
 * Get worker information.
 *
 * @param {string} accountId  Cloudflare account ID.
 * @param {string} apiToken   Cloudflare API token.
 * @param {string} workerName Worker name.
 * @return {Promise<Object>} Worker info or error.
 */
export async function getWorker( accountId, apiToken, workerName ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts/${ workerName }`;

	const response = await fetch( url, {
		method: 'GET',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'Get worker'
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( { worker: data.result || data } );
}

/**
 * List workers for an account.
 *
 * @param {string} accountId Cloudflare account ID.
 * @param {string} apiToken  Cloudflare API token.
 * @return {Promise<Object>} List of workers or error.
 */
export async function listWorkers( accountId, apiToken ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts`;

	const response = await fetch( url, {
		method: 'GET',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'List workers'
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( { workers: data.result || [] } );
}

/**
 * Delete a worker.
 *
 * @param {string} accountId  Cloudflare account ID.
 * @param {string} apiToken   Cloudflare API token.
 * @param {string} workerName Worker name.
 * @return {Promise<Object>} Delete result with success and optional error/message.
 */
export async function deleteWorker( accountId, apiToken, workerName ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts/${ workerName }`;

	const response = await fetch( url, {
		method: 'DELETE',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( response.status === 200 || response.status === 404 ) {
		// 404 means worker already deleted, which is success.
		return {
			success: true,
			message: `Worker ${ workerName } deleted successfully`,
		};
	}

	const responseBody = await response.text();
	const errorMessage = parseErrorResponseWithStatus(
		responseBody,
		response.status,
		'Worker deletion'
	);
	return createErrorResponse( errorMessage );
}

/**
 * Generate a random boundary string for multipart/form-data.
 *
 * @return {string} Boundary string.
 */
function generateBoundary() {
	return `----WebKitFormBoundary${ Math.random()
		.toString( 36 )
		.substring( 2, 15 ) }`;
}

/**
 * Build multipart/form-data body for worker deployment.
 *
 * @param {string} script   Worker script content.
 * @param {Object} bindings Worker bindings.
 * @param {string} boundary Boundary string.
 * @return {string} Multipart body.
 */
function buildMultipartBody( script, bindings, boundary ) {
	let body = '';

	// Add the worker script as a file part.
	body += `--${ boundary }\r\n`;
	body +=
		'Content-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n';
	body += 'Content-Type: application/javascript+module\r\n\r\n';
	body += script + '\r\n';

	// Add metadata to indicate ES module format.
	const metadata = {
		main_module: 'worker.js', // Cloudflare API requires snake_case
	};

	// Add bindings if provided.
	if ( Object.keys( bindings ).length > 0 ) {
		metadata.bindings = bindings;
	}

	body += `--${ boundary }\r\n`;
	body += 'Content-Disposition: form-data; name="metadata"\r\n';
	body += 'Content-Type: application/json\r\n\r\n';
	body += JSON.stringify( metadata ) + '\r\n';

	body += `--${ boundary }--\r\n`;

	return body;
}
