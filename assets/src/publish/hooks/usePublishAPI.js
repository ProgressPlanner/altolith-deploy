/**
 * Publish API Hook
 *
 * Handles API calls for publish operations.
 * Uses PublishAPIService for all business logic.
 *
 * @package
 */

import { useCallback, useMemo } from '@wordpress/element';
import apiFetch from '../../utils/api';
import useAssetDiscovery from '../../utils/useAssetDiscovery';
import { storage } from '../../utils/storage';
import { PublishAPIService } from '../../services/PublishAPIService';

export function usePublishAPI() {
	const assetDiscovery = useAssetDiscovery();

	// Create service instance (memoized to prevent recreation)
	const service = useMemo(
		() => new PublishAPIService( apiFetch, assetDiscovery, storage ),
		[ assetDiscovery ]
	);

	const discoverAssets = useCallback(
		async () => {
			return await service.discoverAssets();
		},
		[ service ]
	);

	// getAssetStatus is an alias for discoverAssets (eliminates duplication)
	const getAssetStatus = useCallback(
		async () => {
			return await service.discoverAssets();
		},
		[ service ]
	);

	const markAssetChanged = useCallback(
		( type, slug ) => {
			return Promise.resolve( service.markAssetChanged( type, slug ) );
		},
		[ service ]
	);

	const getGitConfig = useCallback(
		async () => {
			return await service.getGitConfig();
		},
		[ service ]
	);

	return {
		discoverAssets,
		getAssetStatus,
		markAssetChanged,
		getGitConfig,
	};
}
