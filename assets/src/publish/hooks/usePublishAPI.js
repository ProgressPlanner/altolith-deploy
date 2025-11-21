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

	const discoverBlueprintBundleAssets = useCallback( async () => {
		return await service.discoverBlueprintBundleAssets();
	}, [ service ] );

	// getAssetStatus is an alias for discoverBlueprintBundleAssets (eliminates duplication)
	const getAssetStatus = useCallback( async () => {
		return await service.discoverBlueprintBundleAssets();
	}, [ service ] );

	const markAssetChanged = useCallback(
		( type, slug ) => {
			return Promise.resolve( service.markAssetChanged( type, slug ) );
		},
		[ service ]
	);

	return {
		discoverBlueprintBundleAssets,
		getAssetStatus,
		markAssetChanged,
	};
}
