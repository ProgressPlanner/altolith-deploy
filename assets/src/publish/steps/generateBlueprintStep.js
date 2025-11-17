/**
 * Generate Blueprint Step
 *
 * Creates WordPress Playground blueprint-bundle.zip.
 * Bundle contains blueprint.json + wp-content.zip.
 *
 * @package
 */

import apiFetch from '../../utils/api';

/**
 * Generate blueprint step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Function} context.generateBlueprintJson Blueprint generator function.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @param {string}   context.zipPath               Path to wp-content.zip from createSiteArchive step.
 * @param {string}   context.zipUrl                URL to wp-content.zip from createSiteArchive step.
 * @param {string}   context.zipSize               Size of wp-content.zip from createSiteArchive step.
 * @return {Promise<Object>} Step result with blueprint bundle data.
 */
export async function generateBlueprintHandler( context ) {
	const {
		generateBlueprintJson,
		setStatusMessage,
		zipPath,
		zipUrl,
		zipSize,
	} = context;

	setStatusMessage(
		'Generating the blueprint file',
		'progress',
		'generateBlueprint'
	);

	// Generate blueprint JSON using React hook.
	const blueprintData = await generateBlueprintJson( setStatusMessage );

	setStatusMessage(
		'Creating blueprint bundle',
		'progress',
		'generateBlueprint'
	);

	// Get archive result from previous step (createSiteArchive).
	// The workflow executor merges step results into the context, so zipPath is available directly.
	if ( ! zipPath ) {
		throw new Error(
			'Archive result not found. createSiteArchive must run before generateBlueprint.'
		);
	}

	// Build archiveResult object for REST endpoint
	const archiveResult = {
		zipPath,
		zipUrl,
		zipSize,
	};

	// Call REST endpoint to generate blueprint-bundle.zip.
	const response = await apiFetch( {
		path: '/aether/site-exporter/publish/generateBlueprintBundle',
		method: 'POST',
		data: {
			blueprintData,
			archiveResult,
		},
	} );

	if ( ! response.success ) {
		throw new Error(
			response.message || 'Failed to generate blueprint bundle'
		);
	}

	setStatusMessage(
		'Generated the blueprint bundle',
		'success',
		'generateBlueprint'
	);

	return {
		blueprintData,
		blueprintBundle: response.data,
	};
}
