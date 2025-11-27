/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages, extracts assets (CSS, JS, images), and discovers
 * internal links for crawl-based URL discovery.
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
import { extractAssetsFromHtml } from '@aether/export/utils/assetExtractor';
import { extractInternalLinks } from '@aether/export/utils/linkExtractor';
import { normalize } from '@aether/export/utils/urlUtils';

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Scan site', 'aether-site-exporter' ),
	running: ( data ) => {
		const { pagesScanned = 0, pagesDiscovered = 0, assetsFound = 0 } = data;
		if ( pagesScanned === 0 ) {
			return __( 'Starting site scan…', 'aether-site-exporter' );
		}
		return sprintf(
			/* translators: %1$d: Pages scanned, %2$d: Pages discovered, %3$d: Assets found */
			__(
				'Scanning… %1$d pages scanned, %2$d discovered, %3$d assets',
				'aether-site-exporter'
			),
			pagesScanned,
			pagesDiscovered,
			assetsFound
		);
	},
	complete: ( data ) => {
		const { htmlCount = 0, assetCount = 0 } = data;
		const pagesText = sprintf(
			/* translators: %d: Number of pages */
			_n( '%d page', '%d pages', htmlCount, 'aether-site-exporter' ),
			htmlCount
		);
		const assetsText = sprintf(
			/* translators: %d: Number of assets */
			_n( '%d asset', '%d assets', assetCount, 'aether-site-exporter' ),
			assetCount
		);
		return sprintf(
			/* translators: %1$s: Pages text, %2$s: Assets text */
			__( 'Scanned %1$s, found %2$s', 'aether-site-exporter' ),
			pagesText,
			assetsText
		);
	},
};

/**
 * Pre-scan static site step handler
 *
 * Uses crawl-based discovery to find all pages and assets.
 * Starts with seed URLs from PHP, then discovers additional URLs
 * by extracting internal links from each scanned page.
 *
 * @param {Object}   context                  - Execution context
 * @param {Array}    context.urls             - Seed URLs from getStaticSiteUrls
 * @param {string}   context.siteUrl          - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress  - Step progress updater
 * @return {Promise<Object>} Step result with expanded URL list including assets
 */
async function handler( context ) {
	const { urls, siteUrl, setStatusMessage, setStepProgress } = context;

	if ( ! urls || ! Array.isArray( urls ) ) {
		throw new Error(
			__(
				'URLs not found. Please run getStaticSiteUrls first.',
				'aether-site-exporter'
			)
		);
	}

	// Debug: Log input
	console.log(
		'[Aether] preScanStaticSite: Starting with',
		urls.length,
		'URLs'
	);
	console.log( '[Aether] preScanStaticSite: siteUrl =', siteUrl );
	console.log(
		'[Aether] preScanStaticSite: First 3 URLs:',
		urls.slice( 0, 3 )
	);

	setStatusMessage(
		__( 'Scanning pages and discovering links…', 'aether-site-exporter' ),
		'progress',
		'preScanStaticSite'
	);

	// Build htmlDataMap during crawl (passed through step context for thread isolation)
	const htmlDataMap = new Map();

	// Track all URLs
	const discoveredUrls = new Set(
		urls.map( ( u ) => normalize( u, siteUrl ) )
	);
	const processedUrls = new Set();
	const pendingUrls = [ ...urls ];
	const allAssets = new Set();

	console.log(
		'[Aether] preScanStaticSite: pendingUrls.length =',
		pendingUrls.length
	);
	console.log(
		'[Aether] preScanStaticSite: discoveredUrls.size =',
		discoveredUrls.size
	);

	let processedCount = 0;

	// Process URLs in a crawl-like fashion
	while ( pendingUrls.length > 0 ) {
		const url = pendingUrls.shift();
		const normalizedUrl = normalize( url, siteUrl );

		// Skip if already processed
		if ( processedUrls.has( normalizedUrl ) ) {
			continue;
		}

		processedUrls.add( normalizedUrl );
		processedCount++;

		// Update progress with statusData for dynamic label
		if ( setStepProgress ) {
			setStepProgress( 'preScanStaticSite', {
				current: processedCount,
				total: discoveredUrls.size,
				statusData: {
					pagesScanned: processedCount,
					pagesDiscovered: discoveredUrls.size,
					assetsFound: allAssets.size,
				},
			} );
		}

		// Update status message periodically
		if ( processedCount % 10 === 0 ) {
			setStatusMessage(
				sprintf(
					/* translators: %1$d: Pages scanned, %2$d: Total discovered */
					__(
						'Scanned %1$d pages, discovered %2$d URLs…',
						'aether-site-exporter'
					),
					processedCount,
					discoveredUrls.size
				),
				'progress',
				'preScanStaticSite'
			);
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
				continue;
			}

			const contentType = response.headers.get( 'content-type' ) || '';
			if ( ! contentType.includes( 'text/html' ) ) {
				// Not HTML, skip processing
				continue;
			}

			const html = await response.text();

			// Extract assets from HTML (CSS, JS, images, fonts)
			const assets = await extractAssetsFromHtml( html, url, siteUrl );
			for ( const asset of assets ) {
				allAssets.add( asset );
			}

			// Store HTML and assets in Map (deep cloned per-thread via step context)
			htmlDataMap.set( normalizedUrl, {
				rawHtml: html,
				assetUrls: assets,
			} );

			// Extract internal links for crawl-based discovery
			// This also captures pagination links (/page/2/, /page/3/, etc.)
			const internalLinks = await extractInternalLinks(
				html,
				url,
				siteUrl
			);
			for ( const link of internalLinks ) {
				const normalizedLink = normalize( link, siteUrl );
				if (
					normalizedLink &&
					! discoveredUrls.has( normalizedLink ) &&
					! processedUrls.has( normalizedLink )
				) {
					discoveredUrls.add( normalizedLink );
					pendingUrls.push( link );
				}
			}
		} catch ( error ) {
			// Log error for debugging, then continue
			console.error(
				`[Aether] preScanStaticSite: Failed to process ${ url }:`,
				error.message
			);
		}
	}

	// Combine processed page URLs with discovered assets
	const expandedUrls = [ ...processedUrls, ...allAssets ];

	// Final progress update with complete statusData
	if ( setStepProgress ) {
		setStepProgress( 'preScanStaticSite', {
			current: processedUrls.size,
			total: processedUrls.size,
			statusData: {
				htmlCount: processedUrls.size,
				assetCount: allAssets.size,
			},
		} );
	}

	setStatusMessage(
		sprintf(
			/* translators: %1$d: Number of pages, %2$d: Number of assets */
			__( 'Found %1$d pages and %2$d assets', 'aether-site-exporter' ),
			processedUrls.size,
			allAssets.size
		),
		'success',
		'preScanStaticSite'
	);

	return {
		urls: expandedUrls,
		htmlDataMap,
		htmlCount: processedUrls.size,
		assetCount: allAssets.size,
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'preScanStaticSite',
	label: __( 'Scan for Assets', 'aether-site-exporter' ),
	description: __(
		'Discover pages, CSS, JS, and image assets',
		'aether-site-exporter'
	),
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
		urls: {
			type: 'array',
			scope: 'global',
		},
		htmlDataMap: {
			type: 'object',
			scope: 'global',
		},
		htmlCount: {
			type: 'number',
			scope: 'global',
		},
		assetCount: {
			type: 'number',
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
	'aether.export.register_steps',
	'aether/step-preScanStaticSite',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
