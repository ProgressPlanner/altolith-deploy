/**
 * Create Site Archive Step
 *
 * Creates wp-content.zip containing database + custom assets.
 * This is the LARGEST file in the publish (potentially 100s of MB).
 * Archive format matches WordPress Playground's expected structure.
 *
 * Stateless operation - no job tracking required.
 *
 * @package
 */

import apiFetch from '../../utils/api';

/**
 * Create site archive step handler (stateless).
 *
 * @param {Object}   context                  Execution context.
 * @param {Array}    context.discoveredAssets Custom assets from discoverAssets step.
 * @param {Function} context.setStatusMessage Status message updater.
 * @param {Function} context.setStepProgress  Step progress updater.
 * @return {Promise<Object>} Step result.
 */
export async function createSiteArchiveHandler( context ) {
	const { discoveredAssets, setStatusMessage, setStepProgress } = context;

	setStatusMessage(
		'Zipping the wp-content.zip file',
		'progress',
		'createSiteArchive'
	);

	// Prepare custom assets list for API
	// Only pass slugs to reduce payload size
	const customAssetSlugs = discoveredAssets
		? discoveredAssets.map( ( asset ) => asset.slug )
		: undefined;

	// Call stateless createArchive endpoint
	// Returns immediately - archive is created synchronously
	const response = await apiFetch( {
		path: '/aether/v1/publish/createArchive',
		method: 'POST',
		data: customAssetSlugs
			? { custom_assets: customAssetSlugs }
			: undefined,
	} );

	if ( ! response.success ) {
		throw new Error( response.message || 'Failed to create site archive' );
	}

	setStepProgress( 'createSiteArchive', 100 );

	setStatusMessage(
		'Zipped the wp-content.zip file',
		'success',
		'createSiteArchive'
	);

	return response.data || {};
}
