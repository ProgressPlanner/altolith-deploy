/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages and extracts assets (CSS, JS, images) to add to URL list.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
import { extractAssetsFromHtml } from '@aether/export/utils/assetExtractor';
import { debug, debugWarn } from '@aether/utils/debug';

/**
 * Pre-scan static site step handler
 *
 * @param {Object} context - Execution context
 * @param {Array} context.urls - URLs from getStaticSiteUrls
 * @param {string} context.siteUrl - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress - Step progress updater
 * @returns {Promise<Object>} Step result with expanded URL list including assets
 */
async function handler( context ) {
	const { urls, siteUrl, setStatusMessage, setStepProgress } = context;

	if ( ! urls || ! Array.isArray( urls ) ) {
		throw new Error(
			__( 'URLs not found. Please run getStaticSiteUrls first.', 'aether' )
		);
	}

	setStatusMessage(
		__( 'Scanning pages for assets…', 'aether' ),
		'progress',
		'preScanStaticSite'
	);

	const allAssets = new Set();
	const htmlUrls = [];
	const totalUrls = urls.length;
	const sharedHtmlData = new Map();

	// Fetch each URL and extract assets
	for ( let i = 0; i < totalUrls; i++ ) {
		const url = urls[ i ];

		// Update progress
		if ( setStepProgress ) {
			const progress = Math.round( ( ( i + 1 ) / totalUrls ) * 100 );
			setStepProgress( 'preScanStaticSite', progress );
		}

		try {
			const response = await fetch( url, {
				method: 'GET',
				credentials: 'omit',
				headers: {
					'User-Agent': 'Aether Static Site Generator',
				},
			} );

			if ( ! response.ok ) {
				debugWarn(
					`[Aether] Skipping URL with non-200 status: ${ url } (HTTP ${ response.status })`
				);
				continue;
			}

			const contentType = response.headers.get( 'content-type' ) || '';
			if ( ! contentType.includes( 'text/html' ) ) {
				// Not HTML, skip asset extraction but keep the URL
				htmlUrls.push( url );
				continue;
			}

			const html = await response.text();
			htmlUrls.push( url );

			// Store HTML in shared cache for later use
			sharedHtmlData.set( url, html );

			// Extract assets from HTML
			const assets = await extractAssetsFromHtml( html, url, siteUrl );
			for ( const asset of assets ) {
				allAssets.add( asset );
			}
		} catch ( error ) {
			debugWarn( `[Aether] Error fetching URL: ${ url }`, error.message );
		}
	}

	// Combine HTML URLs with discovered assets
	const expandedUrls = [ ...htmlUrls, ...allAssets ];

	debug( '[Aether] Pre-scan complete:', {
		htmlPages: htmlUrls.length,
		assetsDiscovered: allAssets.size,
		totalUrls: expandedUrls.length,
	} );

	setStatusMessage(
		sprintf(
			/* translators: %1$d: Number of pages, %2$d: Number of assets */
			__( 'Found %1$d pages and %2$d assets', 'aether' ),
			htmlUrls.length,
			allAssets.size
		),
		'success',
		'preScanStaticSite'
	);

	// Return expanded URL list and shared HTML cache
	return {
		urls: expandedUrls,
		htmlCount: htmlUrls.length,
		assetCount: allAssets.size,
		sharedHtmlData,
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'preScanStaticSite',
	label: __( 'Scan for Assets', 'aether' ),
	description: __( 'Discover CSS, JS, and image assets from pages', 'aether' ),
	supportsProgress: true,
	dependencies: [ 'getStaticSiteUrls' ],
	requires: {
		urls: {
			from: 'getStaticSiteUrls',
			required: true,
		},
		siteUrl: {
			from: 'initial',
			required: true,
		},
		setStatusMessage: {
			from: 'initial',
			required: true,
		},
		setStepProgress: {
			from: 'initial',
			required: false,
		},
	},
	provides: {
		urls: 'array',
		htmlCount: 'number',
		assetCount: 'number',
		sharedHtmlData: 'Map',
	},
	handler,
};

/**
 * Register step via WordPress hooks
 */
addAction(
	'aether.export.register_steps',
	'aether/step-preScanStaticSite',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
