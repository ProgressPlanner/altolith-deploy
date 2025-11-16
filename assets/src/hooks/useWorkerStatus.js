/**
 * Worker Status Hook
 *
 * Fetches worker deployment status from Cloudflare and WordPress settings.
 * Uses useAPIData for settings fetch, then enriches with Cloudflare API data.
 * Simplified from 97 to 115 lines (better separation of concerns).
 *
 * @package
 */

import { useState, useEffect, useMemo } from '@wordpress/element';
import { listWorkers } from '../utils/cloudflareWorkersApi';
import { useAPIData } from './useAPIData';

/**
 * Hook for fetching worker deployment status.
 *
 * @return {Object} Status data and methods.
 */
export function useWorkerStatus() {
	const [ cloudflareWorkers, setCloudflareWorkers ] = useState( {} );
	const [ cfError, setCfError ] = useState( null );

	// Fetch WordPress settings
	const {
		data: settings,
		loading,
		error,
		refresh,
	} = useAPIData( {
		path: '/aether/v1/settings',
		transform: ( response ) => {
			if ( ! response.success && ! response.value ) {
				throw new Error( 'Failed to fetch settings' );
			}
			return response.value || {};
		},
		initialData: {},
	} );

	// Extract saved deployments and credentials
	const savedDeployments = useMemo(
		() => settings.worker_deployments || {},
		[ settings ]
	);

	const edgeProvider = useMemo( () => {
		const providerTypes = settings.provider_types || {};
		const edgeProviderId = providerTypes.edge || 'cloudflare';
		return settings.providers?.[ edgeProviderId ] || {};
	}, [ settings ] );

	const accountId = edgeProvider.account_id || '';
	const apiToken = edgeProvider.api_token || '';

	// Fetch from Cloudflare API when credentials are available
	useEffect( () => {
		if ( ! accountId || ! apiToken ) {
			setCloudflareWorkers( {} );
			setCfError( null );
			return;
		}

		const fetchCloudflareWorkers = async () => {
			try {
				const cfResponse = await listWorkers( accountId, apiToken );
				const workers = {};

				if ( cfResponse.success && cfResponse.workers ) {
					// Map Cloudflare workers to our format
					cfResponse.workers.forEach( ( worker ) => {
						const name = worker.id || worker.name || '';
						if ( name.startsWith( 'aether-' ) ) {
							const parts = name.split( '-' );
							if ( parts.length >= 2 ) {
								const type = parts[ 1 ]; // r2, git, media, spaces
								workers[ type ] = {
									workerName: name,
									workerUrl: `https://${ name }.workers.dev`,
									deployed_at:
										worker.modified_on || Date.now(),
								};
							}
						}
					} );
				}

				setCloudflareWorkers( workers );
				setCfError( null );
			} catch ( err ) {
				// Failed to fetch from Cloudflare, continue with saved deployments
				setCloudflareWorkers( {} );
				setCfError( err.message );
			}
		};

		fetchCloudflareWorkers();
	}, [ accountId, apiToken ] );

	// Merge saved deployments with Cloudflare workers
	const deployments = useMemo(
		() => ( { ...savedDeployments, ...cloudflareWorkers } ),
		[ savedDeployments, cloudflareWorkers ]
	);

	return useMemo(
		() => ( {
			deployments,
			loading,
			error: error || cfError,
			refresh: () => {
				refresh();
				// Cloudflare will refetch automatically via useEffect
			},
		} ),
		[ deployments, loading, error, cfError, refresh ]
	);
}
