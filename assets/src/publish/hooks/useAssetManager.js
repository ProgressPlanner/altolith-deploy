/**
 * Asset Manager Hook
 *
 * Manages asset state in localStorage
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

const STORAGE_KEY = 'aetherAssets';

export function useAssetManager() {
	const [ assets, setAssets ] = useState( {} );

	// Load assets from localStorage on mount
	useEffect( () => {
		try {
			const data = localStorage.getItem( STORAGE_KEY );
			if ( data ) {
				setAssets( JSON.parse( data ) );
			}
		} catch ( error ) {
			// Failed to load assets from localStorage
		}
	}, [] );

	// Save assets to localStorage whenever they change
	useEffect( () => {
		try {
			localStorage.setItem( STORAGE_KEY, JSON.stringify( assets ) );
		} catch ( error ) {
			// Failed to save assets to localStorage
		}
	}, [ assets ] );

	const markAsChanged = useCallback( ( type, slug ) => {
		setAssets( ( prev ) => {
			const updated = { ...prev };
			const existingAsset = updated[ slug ];
			updated[ slug ] = existingAsset
				? { ...existingAsset, needsUpload: true }
				: { type, slug, needsUpload: true };
			return updated;
		} );
	}, [] );

	const updateFromServer = useCallback( ( assetData ) => {
		const {
			slug,
			type,
			name,
			existsOnR2 = assetData.exists_on_r2 || false,
		} = assetData;
		setAssets( ( prev ) => {
			const updated = { ...prev };
			const existingAsset = updated[ slug ];
			updated[ slug ] = existingAsset
				? {
						...existingAsset,
						existsOnR2,
						name,
						needsUpload: ! existsOnR2,
				  }
				: {
						type,
						slug,
						name,
						existsOnR2,
						needsUpload: ! existsOnR2,
				  };
			return updated;
		} );
	}, [] );

	const syncWithServer = useCallback( ( serverAssets ) => {
		if ( ! Array.isArray( serverAssets ) ) {
			return;
		}

		setAssets( ( prev ) => {
			const updated = { ...prev };
			serverAssets.forEach( ( assetData ) => {
				const { slug } = assetData;
				const existingAsset = updated[ slug ];
				const existsOnR2 =
					assetData.existsOnR2 || assetData.exists_on_r2 || false;
				updated[ slug ] = existingAsset
					? {
							...existingAsset,
							existsOnR2,
							name: assetData.name,
							needsUpload:
								existingAsset.needsUpload || ! existsOnR2,
					  }
					: {
							type: assetData.type,
							slug,
							name: assetData.name,
							existsOnR2,
							needsUpload: ! existsOnR2,
					  };
			} );
			return updated;
		} );
	}, [] );

	const getChangedAssets = useCallback( () => {
		return Object.values( assets )
			.filter( ( asset ) => asset.needsUpload )
			.map( ( asset ) => `${ asset.type }:${ asset.slug }` );
	}, [ assets ] );

	const clearUploadFlags = useCallback( () => {
		setAssets( ( prev ) => {
			const updated = { ...prev };
			Object.keys( updated ).forEach( ( slug ) => {
				updated[ slug ] = { ...updated[ slug ], needsUpload: false };
			} );
			return updated;
		} );
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
