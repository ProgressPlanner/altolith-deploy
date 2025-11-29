/**
 * Gather Files to Deploy Step
 *
 * Collects all files from previous steps into a unified structure for deployment:
 * - Static site files from discoverAndScanSite (URLs, HTML data)
 * - Blueprint files from prepareBlueprint (wp-content.zip, plugin/theme zips, JSON)
 *
 * This step provides a single extension point for 3rd-party plugins to add files
 * via the 'altolith.export.filesToDeploy' filter.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import { addAction, applyFilters } from '@wordpress/hooks';
import { getEnabledOutputTypes } from '@altolith/utils/outputTypes';

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Gather files', 'altolith-deploy' ),
	running: () => __( 'Gathering files to deploy\u2026', 'altolith-deploy' ),
	complete: ( data ) => {
		const { staticFileCount = 0, blueprintFileCount = 0 } = data || {};
		const total = staticFileCount + blueprintFileCount;
		if ( total === 0 ) {
			return __( 'No files to deploy', 'altolith-deploy' );
		}
		const parts = [];
		if ( staticFileCount > 0 ) {
			parts.push(
				`${ staticFileCount } ${ __( 'static', 'altolith-deploy' ) }`
			);
		}
		if ( blueprintFileCount > 0 ) {
			parts.push(
				`${ blueprintFileCount } ${ __(
					'blueprint',
					'altolith-deploy'
				) }`
			);
		}
		return `${ __( 'Files gathered:', 'altolith-deploy' ) } ${ parts.join(
			', '
		) }`;
	},
};

/**
 * Build static site file entries from URLs and HTML data
 *
 * @param {Array}  urls        Array of URLs to include
 * @param {Map}    htmlDataMap Map of URL to HTML content
 * @param {string} siteUrl     The site's base URL
 * @return {Object} Object mapping relative paths to file info
 */
function buildStaticSiteFiles( urls, htmlDataMap, siteUrl ) {
	const files = {};

	if ( ! urls || ! Array.isArray( urls ) ) {
		return files;
	}

	for ( const url of urls ) {
		// Convert URL to relative path
		let relativePath = url.replace( siteUrl, '' );
		if ( relativePath.startsWith( '/' ) ) {
			relativePath = relativePath.slice( 1 );
		}

		// Determine file path (add index.html for directories)
		let filePath = relativePath || 'index.html';
		if ( filePath.endsWith( '/' ) ) {
			filePath += 'index.html';
		} else if ( ! filePath.includes( '.' ) ) {
			filePath += '/index.html';
		}

		// Get HTML content if available
		const htmlData = htmlDataMap?.get?.( url );

		files[ filePath ] = {
			type: 'static',
			url,
			hasContent: !! htmlData,
			// HTML content will be processed during deploy for URL replacement
		};
	}

	return files;
}

/**
 * Map blueprint file type from createBlueprintBundle to deploy types
 *
 * @param {string} type The type from createBlueprintBundle (core, plugin, theme)
 * @return {string} The deploy type (blueprint-archive, blueprint-plugin, blueprint-theme)
 */
function mapBlueprintFileType( type ) {
	switch ( type ) {
		case 'core':
			return 'blueprint-archive';
		case 'plugin':
			return 'blueprint-plugin';
		case 'theme':
			return 'blueprint-theme';
		default:
			return type;
	}
}

/**
 * Gather files to deploy step handler
 *
 * Collects files from discoverAndScanSite and createBlueprintBundle steps,
 * then applies a filter for 3rd-party extensions.
 *
 * @param {Object} context Execution context
 * @return {Promise<Object>} Step result with filesToDeploy
 */
async function handler( context ) {
	const {
		// From discoverAndScanSite
		urls,
		htmlDataMap,
		siteUrl,
		// From createBlueprintBundle (simplified output)
		blueprintFiles,
		blueprintJson,
		// Status callbacks
		setStatusMessage,
		setStepProgress,
	} = context;

	setStatusMessage(
		__( 'Gathering files to deploy\u2026', 'altolith-deploy' ),
		'progress',
		'gatherFilesToDeploy'
	);

	// Check which output types are enabled
	const enabledOutputTypes = getEnabledOutputTypes();
	const staticEnabled = enabledOutputTypes.includes( 'static_site' );
	const blueprintEnabled = enabledOutputTypes.includes( 'blueprint' );

	// Build file collections
	const filesToDeploy = {
		staticSite: {},
		blueprint: {},
	};

	// Gather static site files
	if ( staticEnabled && urls && urls.length > 0 ) {
		filesToDeploy.staticSite = buildStaticSiteFiles(
			urls,
			htmlDataMap,
			siteUrl
		);
	}

	// Gather blueprint files from createBlueprintBundle output
	if ( blueprintEnabled && blueprintFiles ) {
		// blueprintFiles already contains the file entries from createBlueprintBundle
		// Add subfolder prefix and copy entries
		const subfolder = 'playground';
		const prefix = `${ subfolder }/`;

		// Add blueprint.json if we have the JSON data
		if ( blueprintJson ) {
			filesToDeploy.blueprint[ `${ prefix }blueprint.json` ] = {
				type: 'blueprint-json',
				content: blueprintJson,
			};
		}

		// Copy blueprint files with subfolder prefix
		for ( const [ relativePath, fileInfo ] of Object.entries(
			blueprintFiles
		) ) {
			filesToDeploy.blueprint[ `${ prefix }${ relativePath }` ] = {
				...fileInfo,
				// Map types for deploy step
				type: mapBlueprintFileType( fileInfo.type ),
			};
		}
	}

	// Apply filter for 3rd-party extensions
	const filteredFiles = applyFilters(
		'altolith.export.filesToDeploy',
		filesToDeploy,
		context
	);

	// Calculate counts for status
	const staticFileCount = Object.keys(
		filteredFiles.staticSite || {}
	).length;
	const blueprintFileCount = Object.keys(
		filteredFiles.blueprint || {}
	).length;

	// Update progress with status data
	if ( setStepProgress ) {
		setStepProgress( 'gatherFilesToDeploy', {
			current: 1,
			total: 1,
			statusData: {
				staticFileCount,
				blueprintFileCount,
			},
		} );
	}

	setStatusMessage(
		__( 'Files gathered', 'altolith-deploy' ),
		'success',
		'gatherFilesToDeploy'
	);

	return {
		filesToDeploy: filteredFiles,
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'gatherFilesToDeploy',
	label: __( 'Gather Files', 'altolith-deploy' ),
	description: __(
		'Collect all files to deploy from previous steps',
		'altolith-deploy'
	),
	supportsProgress: false,
	dependencies: [ 'discoverAndScanSite', 'prepareBlueprint' ],
	requires: {
		// From discoverAndScanSite (optional - may not have static site enabled)
		urls: { from: 'discoverAndScanSite', optional: true },
		htmlDataMap: { from: 'discoverAndScanSite', optional: true },
		siteUrl: true,
		// From prepareBlueprint (optional - may not have blueprint enabled)
		blueprintFiles: { from: 'prepareBlueprint', optional: true },
		blueprintJson: { from: 'prepareBlueprint', optional: true },
		// From initial context
		setStatusMessage: true,
		setStepProgress: false,
	},
	provides: {
		filesToDeploy: {
			type: 'object',
			scope: 'global',
		},
	},
	statusLabels,
	handler,
};

/**
 * Register step via WordPress hooks
 */
addAction(
	'altolith.export.register_steps',
	'altolith/step-gatherFilesToDeploy',
	( registry ) => {
		registry.register( stepDefinition );
	},
	20 // Run after discoverAndScanSite (10) and createBlueprintBundle (10)
);
