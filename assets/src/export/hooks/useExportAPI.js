/**
 * Publish API Hook
 *
 * Handles API calls for export operations.
 * Uses ExportAPIService for all business logic.
 *
 */

import { useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@aether/utils/api';
import useAssetDiscovery from '@aether/utils/useAssetDiscovery';
import { storage } from '@aether/utils/storage';
import { ExportAPIService } from '@aether/services/ExportAPIService';

export function useExportAPI() {
	const assetDiscovery = useAssetDiscovery();

	// Create service instance (memoized to prevent recreation)
	const service = useMemo(
		() => new ExportAPIService( apiFetch, assetDiscovery, storage ),
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

	const discoverUrls = useCallback( async () => {
		return await service.discoverUrls();
	}, [ service ] );

	const createArchive = useCallback(
		async ( options ) => {
			return await service.createArchive( options );
		},
		[ service ]
	);

	const generateBlueprint = useCallback(
		async ( options ) => {
			return await service.generateBlueprint( options );
		},
		[ service ]
	);

	const createBlueprintBundle = useCallback(
		async ( options ) => {
			return await service.createBlueprintBundle( options );
		},
		[ service ]
	);

	return {
		discoverBlueprintBundleAssets,
		getAssetStatus,
		markAssetChanged,
		discoverUrls,
		createArchive,
		generateBlueprint,
		createBlueprintBundle,
	};
}
