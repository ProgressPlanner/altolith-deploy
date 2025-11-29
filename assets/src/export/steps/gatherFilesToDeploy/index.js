/**
 * Gather Files to Deploy Step
 *
 * Collects all files from previous steps into a unified structure for deployment:
 * - Static site files from discoverAndScanSite (URLs, HTML data)
 * - Blueprint files from createBlueprintBundle (wp-content.zip, plugin/theme zips, JSON)
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
 * Build blueprint file entries from prepared blueprint data
 *
 * @param {Object} blueprintData   The blueprint JSON data
 * @param {string} coreContentPath Path to wp-content.zip
 * @param {number} coreContentSize Size of wp-content.zip
 * @param {Object} pluginZips      Map of plugin slug to zip path
 * @param {Object} themeZips       Map of theme slug to zip path
 * @param {string} subfolder       Blueprint subfolder (e.g., 'playground')
 * @return {Object} Object mapping relative paths to file info
 */
function buildBlueprintFiles(
	blueprintData,
	coreContentPath,
	coreContentSize,
	pluginZips,
	themeZips,
	subfolder
) {
	const files = {};
	const prefix = subfolder ? `${ subfolder }/` : '';

	// Add blueprint.json
	if ( blueprintData ) {
		files[ `${ prefix }blueprint.json` ] = {
			type: 'blueprint-json',
			content: blueprintData,
			// Will be stringified and URL-replaced during deploy
		};
	}

	// Add wp-content.zip
	if ( coreContentPath ) {
		files[ `${ prefix }wp-content.zip` ] = {
			type: 'blueprint-archive',
			sourcePath: coreContentPath,
			size: coreContentSize || 0,
		};
	}

	// Add plugin zips
	if ( pluginZips && typeof pluginZips === 'object' ) {
		for ( const [ slug, zipPath ] of Object.entries( pluginZips ) ) {
			files[ `${ prefix }plugins/${ slug }.zip` ] = {
				type: 'blueprint-plugin',
				sourcePath: zipPath,
				slug,
			};
		}
	}

	// Add theme zips
	if ( themeZips && typeof themeZips === 'object' ) {
		for ( const [ slug, zipPath ] of Object.entries( themeZips ) ) {
			files[ `${ prefix }themes/${ slug }.zip` ] = {
				type: 'blueprint-theme',
				sourcePath: zipPath,
				slug,
			};
		}
	}

	return files;
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
		// From createBlueprintBundle
		blueprintData,
		coreContentZipPath,
		coreContentZipSize,
		pluginZips,
		themeZips,
		blueprintSubfolder,
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

	// Gather blueprint files
	if ( blueprintEnabled && blueprintData ) {
		filesToDeploy.blueprint = buildBlueprintFiles(
			blueprintData,
			coreContentZipPath,
			coreContentZipSize,
			pluginZips,
			themeZips,
			blueprintSubfolder || 'playground'
		);
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
	dependencies: [ 'discoverAndScanSite', 'createBlueprintBundle' ],
	requires: {
		// From discoverAndScanSite (optional - may not have static site enabled)
		urls: { from: 'discoverAndScanSite', optional: true },
		htmlDataMap: { from: 'discoverAndScanSite', optional: true },
		siteUrl: true,
		// From createBlueprintBundle (optional - may not have blueprint enabled)
		blueprintData: { from: 'createBlueprintBundle', optional: true },
		coreContentZipPath: { from: 'createBlueprintBundle', optional: true },
		coreContentZipSize: { from: 'createBlueprintBundle', optional: true },
		pluginZips: { from: 'createBlueprintBundle', optional: true },
		themeZips: { from: 'createBlueprintBundle', optional: true },
		blueprintSubfolder: { from: 'createBlueprintBundle', optional: true },
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
