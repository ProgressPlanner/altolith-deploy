/**
 * Cloudflare Workers API Hook
 *
 * Provides direct API calls to Cloudflare Workers API from React.
 *
 * @package
 */

import { useCallback } from '@wordpress/element';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Hook for making direct Cloudflare Workers API calls.
 *
 * @param {string} accountId Cloudflare account ID.
 * @param {string} apiToken  Cloudflare API token.
 * @return {Object} API methods.
 */
export function useCloudflareWorkersAPI( accountId, apiToken ) {
	const makeRequest = useCallback(
		async ( endpoint, options = {} ) => {
			if ( ! accountId || ! apiToken ) {
				throw new Error( 'Cloudflare credentials are required' );
			}

			const url = `${ CLOUDFLARE_API_BASE }${ endpoint }`;
			const response = await fetch( url, {
				...options,
				headers: {
					Authorization: `Bearer ${ apiToken }`,
					'Content-Type': 'application/json',
					...options.headers,
				},
			} );

			const data = await response.json();

			if ( ! response.ok ) {
				const errorMessage =
					data.errors?.[ 0 ]?.message ||
					data.error ||
					`HTTP ${ response.status }: ${ response.statusText }`;
				throw new Error( errorMessage );
			}

			return data;
		},
		[ accountId, apiToken ]
	);

	const deployWorker = useCallback(
		async ( workerName, scriptContent ) => {
			const boundary = `----formdata-${ Date.now() }`;
			let body = '';

			// Add worker script as file part.
			body += `--${ boundary }\r\n`;
			body +=
				'Content-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n';
			body += 'Content-Type: application/javascript+module\r\n\r\n';
			body += scriptContent + '\r\n';

			// Add metadata.
			const metadata = { mainModule: 'worker.js' };
			body += `--${ boundary }\r\n`;
			body += 'Content-Disposition: form-data; name="metadata"\r\n';
			body += 'Content-Type: application/json\r\n\r\n';
			body += JSON.stringify( metadata ) + '\r\n';
			body += `--${ boundary }--\r\n`;

			return makeRequest(
				`/accounts/${ accountId }/workers/scripts/${ workerName }`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': `multipart/form-data; boundary=${ boundary }`,
					},
					body,
				}
			);
		},
		[ accountId, makeRequest ]
	);

	const getWorkers = useCallback( async () => {
		return makeRequest( `/accounts/${ accountId }/workers/scripts` );
	}, [ accountId, makeRequest ] );

	const deleteWorker = useCallback(
		async ( workerName ) => {
			return makeRequest(
				`/accounts/${ accountId }/workers/scripts/${ workerName }`,
				{
					method: 'DELETE',
				}
			);
		},
		[ accountId, makeRequest ]
	);

	const testConnection = useCallback( async () => {
		return makeRequest( `/accounts/${ accountId }/workers/scripts` );
	}, [ accountId, makeRequest ] );

	return {
		deployWorker,
		getWorkers,
		deleteWorker,
		testConnection,
	};
}
