/**
 * Publish API Hook
 *
 * Handles API calls for publish operations
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import apiFetch from '../../utils/api';
import { ENDPOINTS } from '../../constants';
import useAssetDiscovery from '../../utils/useAssetDiscovery';
import { storage } from '../../utils/storage';

export function usePublishAPI() {
	const assetDiscovery = useAssetDiscovery();

	const discoverAssets = useCallback( async () => {
		// Use browser-based asset discovery instead of PHP endpoint
		const customAssets = await assetDiscovery.discoverCustomAssets();
		return {
			success: true,
			assets: customAssets,
			count: customAssets.length,
		};
	}, [ assetDiscovery ] );

	const getAssetStatus = useCallback( async () => {
		// Use browser-based asset discovery instead of PHP endpoint
		const customAssets = await assetDiscovery.discoverCustomAssets();
		return {
			success: true,
			assets: customAssets,
			count: customAssets.length,
		};
	}, [ assetDiscovery ] );

	const markAssetChanged = useCallback( ( type, slug ) => {
		// Store changed assets in localStorage (no server needed)
		const changedAssets = storage.get( 'aether_changed_assets', [] );
		const key = `${ type }:${ slug }`;

		if ( ! changedAssets.includes( key ) ) {
			changedAssets.push( key );
			storage.set( 'aether_changed_assets', changedAssets );
		}

		return Promise.resolve( {
			success: true,
			message: `Marked ${ type } ${ slug } as changed`,
		} );
	}, [] );

	const getGitConfig = useCallback( async () => {
		const response = await apiFetch( {
			path: ENDPOINTS.GIT.CONFIG,
		} );
		return response;
	}, [] );

	return {
		discoverAssets,
		getAssetStatus,
		markAssetChanged,
		getGitConfig,
	};
}
