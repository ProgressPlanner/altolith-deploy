/**
 * Create Site Archive Step
 *
 * Creates wp-content.zip containing database + custom assets.
 * This is the LARGEST file in the publish (potentially 100s of MB).
 * Archive format matches WordPress Playground's expected structure.
 *
 * Modular approach: Breaks down zip creation into separate API requests
 * to avoid timeouts and provide granular progress feedback.
 *
 * @package
 */

import apiFetch from '../../utils/api';
import { getArchiveProgressCache } from '../../utils/archiveProgressCache';

/**
 * Create site archive step handler (modular approach).
 *
 * @param {Object}   context                  Execution context.
 * @param {Array}    context.discoveredAssets Custom assets from discoverAssets step.
 * @param {Function} context.setStatusMessage Status message updater.
 * @param {Function} context.setStepProgress  Step progress updater.
 * @return {Promise<Object>} Step result.
 */
export async function createSiteArchiveHandler( context ) {
	const { discoveredAssets, setStatusMessage, setStepProgress } = context;
	const progressCache = getArchiveProgressCache();

	setStatusMessage(
		'Initializing archive...',
		'progress',
		'createSiteArchive'
	);

	// Prepare custom assets list for API
	const customAssetSlugs = discoveredAssets
		? discoveredAssets.map( ( asset ) => asset.slug )
		: undefined;

	// Step 1: Initialize archive
	const initResponse = await apiFetch( {
		path: '/aether/site-exporter/publish/createArchive/init',
		method: 'POST',
		data: customAssetSlugs
			? { custom_assets: customAssetSlugs }
			: undefined,
	} );

	if ( ! initResponse.success ) {
		throw new Error(
			initResponse.message || 'Failed to initialize archive'
		);
	}

	// Validate required data fields
	if (
		! initResponse.data ||
		! initResponse.data.zipPath ||
		! initResponse.data.progressId
	) {
		throw new Error(
			'Invalid response from server: missing required data (zipPath or progressId)'
		);
	}

	const { zipPath, progressId } = initResponse.data;
	const progress = initResponse.progress || {};

	// Store initial progress in IndexedDB
	await progressCache.set( progressId, progress );

	// Step 2: Add database
	setStatusMessage( 'Adding database...', 'progress', 'createSiteArchive' );
	const dbResponse = await apiFetch( {
		path: '/aether/site-exporter/publish/createArchive/phase/database',
		method: 'POST',
		data: {
			zipPath,
			progress,
		},
	} );

	if ( ! dbResponse.success ) {
		await progressCache.clear( progressId );
		throw new Error(
			dbResponse.message || 'Failed to add database to archive'
		);
	}

	let currentProgress = dbResponse.progress || progress;
	await progressCache.update( progressId, currentProgress );
	setStepProgress( 'createSiteArchive', currentProgress.overall || 0 );

	// Step 3: Add uploads in batches
	const uploadsBatchesResponse = await apiFetch( {
		path: '/aether/site-exporter/publish/createArchive/phase/uploads/batches',
		method: 'GET',
	} );

	if ( ! uploadsBatchesResponse.success ) {
		await progressCache.clear( progressId );
		throw new Error(
			uploadsBatchesResponse.message ||
				'Failed to get uploads batches list'
		);
	}

	const batches = uploadsBatchesResponse.data.batches || 0;
	if ( batches > 0 ) {
		for ( let i = 0; i < batches; i++ ) {
			setStatusMessage(
				`Adding uploads (batch ${ i + 1 }/${ batches })...`,
				'progress',
				'createSiteArchive'
			);

			const batchResponse = await apiFetch( {
				path: '/aether/site-exporter/publish/createArchive/phase/uploads/batch',
				method: 'POST',
				data: {
					zipPath,
					batch: i,
					progress: currentProgress,
				},
			} );

			if ( ! batchResponse.success ) {
				await progressCache.clear( progressId );
				throw new Error(
					batchResponse.message ||
						`Failed to add uploads batch ${ i + 1 }`
				);
			}

			currentProgress = batchResponse.progress || currentProgress;
			await progressCache.update( progressId, currentProgress );
			setStepProgress(
				'createSiteArchive',
				currentProgress.overall || 0
			);
		}
	} else {
		setStatusMessage(
			'No uploads to add',
			'progress',
			'createSiteArchive'
		);
	}

	// Step 4: Add plugins one by one
	const pluginsListPath =
		'/aether/site-exporter/publish/createArchive/phase/plugins/list' +
		( customAssetSlugs
			? `?custom_assets=${ encodeURIComponent(
					JSON.stringify( customAssetSlugs )
			  ) }`
			: '' );
	const pluginsListResponse = await apiFetch( {
		path: pluginsListPath,
		method: 'GET',
	} );

	if ( ! pluginsListResponse.success ) {
		await progressCache.clear( progressId );
		throw new Error(
			pluginsListResponse.message || 'Failed to get plugins list'
		);
	}

	const plugins = pluginsListResponse.data.plugins || [];
	const totalPlugins = plugins.length;

	if ( totalPlugins > 0 ) {
		for ( let i = 0; i < plugins.length; i++ ) {
			const pluginSlug = plugins[ i ];
			setStatusMessage(
				`Adding plugin: ${ pluginSlug } (${
					i + 1
				}/${ totalPlugins })...`,
				'progress',
				'createSiteArchive'
			);

			const pluginResponse = await apiFetch( {
				path: '/aether/site-exporter/publish/createArchive/phase/plugins/add',
				method: 'POST',
				data: {
					zipPath,
					slug: pluginSlug,
					progress: currentProgress,
				},
			} );

			if ( ! pluginResponse.success ) {
				await progressCache.clear( progressId );
				throw new Error(
					pluginResponse.message ||
						`Failed to add plugin: ${ pluginSlug }`
				);
			}

			currentProgress = pluginResponse.progress || currentProgress;
			await progressCache.update( progressId, currentProgress );
			setStepProgress(
				'createSiteArchive',
				currentProgress.overall || 0
			);
		}
	} else {
		setStatusMessage(
			'No plugins to add',
			'progress',
			'createSiteArchive'
		);
	}

	// Step 5: Add themes one by one
	const themesListPath =
		'/aether/site-exporter/publish/createArchive/phase/themes/list' +
		( customAssetSlugs
			? `?custom_assets=${ encodeURIComponent(
					JSON.stringify( customAssetSlugs )
			  ) }`
			: '' );
	const themesListResponse = await apiFetch( {
		path: themesListPath,
		method: 'GET',
	} );

	if ( ! themesListResponse.success ) {
		await progressCache.clear( progressId );
		throw new Error(
			themesListResponse.message || 'Failed to get themes list'
		);
	}

	const themes = themesListResponse.data.themes || [];
	const totalThemes = themes.length;

	if ( totalThemes > 0 ) {
		for ( let i = 0; i < themes.length; i++ ) {
			const themeSlug = themes[ i ];
			setStatusMessage(
				`Adding theme: ${ themeSlug } (${ i + 1 }/${ totalThemes })...`,
				'progress',
				'createSiteArchive'
			);

			const themeResponse = await apiFetch( {
				path: '/aether/site-exporter/publish/createArchive/phase/themes/add',
				method: 'POST',
				data: {
					zipPath,
					slug: themeSlug,
					progress: currentProgress,
				},
			} );

			if ( ! themeResponse.success ) {
				await progressCache.clear( progressId );
				throw new Error(
					themeResponse.message ||
						`Failed to add theme: ${ themeSlug }`
				);
			}

			currentProgress = themeResponse.progress || currentProgress;
			await progressCache.update( progressId, currentProgress );
			setStepProgress(
				'createSiteArchive',
				currentProgress.overall || 0
			);
		}
	} else {
		setStatusMessage( 'No themes to add', 'progress', 'createSiteArchive' );
	}

	// Step 6: Add mu-plugins in batches
	const muPluginsBatchesResponse = await apiFetch( {
		path: '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batches',
		method: 'GET',
	} );

	if ( ! muPluginsBatchesResponse.success ) {
		await progressCache.clear( progressId );
		throw new Error(
			muPluginsBatchesResponse.message ||
				'Failed to get mu-plugins batches list'
		);
	}

	const muPluginsBatches = muPluginsBatchesResponse.data.batches || 0;
	if ( muPluginsBatches > 0 ) {
		for ( let i = 0; i < muPluginsBatches; i++ ) {
			setStatusMessage(
				`Adding mu-plugins (batch ${ i + 1 }/${ muPluginsBatches })...`,
				'progress',
				'createSiteArchive'
			);

			const batchResponse = await apiFetch( {
				path: '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batch',
				method: 'POST',
				data: {
					zipPath,
					batch: i,
					progress: currentProgress,
				},
			} );

			if ( ! batchResponse.success ) {
				await progressCache.clear( progressId );
				throw new Error(
					batchResponse.message ||
						`Failed to add mu-plugins batch ${ i + 1 }`
				);
			}

			currentProgress = batchResponse.progress || currentProgress;
			await progressCache.update( progressId, currentProgress );
			setStepProgress(
				'createSiteArchive',
				currentProgress.overall || 0
			);
		}
	} else {
		setStatusMessage(
			'No mu-plugins to add',
			'progress',
			'createSiteArchive'
		);
	}

	// Step 7: Finalize archive
	setStatusMessage(
		'Finalizing archive...',
		'progress',
		'createSiteArchive'
	);
	const finalizeResponse = await apiFetch( {
		path: '/aether/site-exporter/publish/createArchive/finalize',
		method: 'POST',
		data: {
			zipPath,
		},
	} );

	if ( ! finalizeResponse.success ) {
		await progressCache.clear( progressId );
		throw new Error(
			finalizeResponse.message || 'Failed to finalize archive'
		);
	}

	// Clean up progress cache
	await progressCache.clear( progressId );

	setStepProgress( 'createSiteArchive', 100 );

	setStatusMessage(
		'Zipped the wp-content.zip file',
		'success',
		'createSiteArchive'
	);

	return finalizeResponse.data || {};
}
