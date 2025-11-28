/**
 * Asset Manager Hook
 *
 * Manages asset state in localStorage.
 * Uses AssetManagerService for all business logic.
 *
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { storage } from '@altolith/utils/storage';
import {
	AssetManagerService,
	filterChangedAssets,
	clearAllUploadFlags,
} from '@altolith/services/AssetManagerService';

export function useAssetManager() {
	const [ assets, setAssets ] = useState( {} );

	// Create service instance (memoized to prevent recreation)
	const service = useMemo( () => new AssetManagerService( storage ), [] );

	// Load assets from localStorage on mount
	useEffect( () => {
		const data = service.load();
		setAssets( data );
	}, [ service ] );

	// Save assets to localStorage whenever they change
	useEffect( () => {
		service.save( assets );
	}, [ service, assets ] );

	const markAsChanged = useCallback(
		( type, slug ) => {
			setAssets( ( prev ) => service.markAsChanged( prev, type, slug ) );
		},
		[ service ]
	);

	const updateFromServer = useCallback(
		( assetData ) => {
			setAssets( ( prev ) =>
				service.updateFromServer( prev, assetData )
			);
		},
		[ service ]
	);

	const syncWithServer = useCallback(
		( serverAssets ) => {
			setAssets( ( prev ) =>
				service.syncWithServer( prev, serverAssets )
			);
		},
		[ service ]
	);

	const getChangedAssets = useCallback( () => {
		return filterChangedAssets( assets );
	}, [ assets ] );

	const clearUploadFlags = useCallback( () => {
		setAssets( ( prev ) => clearAllUploadFlags( prev ) );
	}, [] );

	return {
		assets,
		markAsChanged,
		updateFromServer,
		syncWithServer,
		getChangedAssets,
		clearUploadFlags,
	};
}
