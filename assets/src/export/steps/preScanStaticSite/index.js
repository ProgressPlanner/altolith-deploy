/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages, extracts assets (CSS, JS, images), and discovers
 * internal links for crawl-based URL discovery.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
import { extractAssetsFromHtml } from '@aether/export/utils/assetExtractor';
import { extractInternalLinks } from '@aether/export/utils/linkExtractor';
import { normalize } from '@aether/export/utils/urlUtils';
import { getStaticFilesCache } from '@aether/export/utils/staticFilesCache';

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

	setStatusMessage(
		__( 'Scanning pages and discovering links…', 'aether-site-exporter' ),
		'progress',
		'preScanStaticSite'
	);

	// Get the static files cache for storing discovered URLs
	const cache = getStaticFilesCache();

	// Track all URLs
	const discoveredUrls = new Set(
		urls.map( ( u ) => normalize( u, siteUrl ) )
	);
	const processedUrls = new Set();
	const pendingUrls = [ ...urls ];
	const sharedHtmlData = new Map();
	const allAssets = new Set();

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

		// Update progress
		if ( setStepProgress ) {
			setStepProgress( 'preScanStaticSite', {
				current: processedCount,
				total: discoveredUrls.size,
				pending: pendingUrls.length,
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

			// Add to IndexedDB cache for persistence
			await cache.add( normalizedUrl, contentType, html );

			// Extract assets from HTML (CSS, JS, images, fonts)
			const assets = await extractAssetsFromHtml( html, url, siteUrl );
			for ( const asset of assets ) {
				allAssets.add( asset );
			}

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

			// Store HTML and assets in shared cache for later use
			sharedHtmlData.set( normalizedUrl, {
				rawHtml: html,
				assetUrls: assets,
			} );
		} catch ( error ) {
			// Continue on fetch errors
		}
	}

	// Combine processed page URLs with discovered assets
	const expandedUrls = [ ...processedUrls, ...allAssets ];

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

	// Return expanded URL list and shared HTML cache
	return {
		urls: expandedUrls,
		htmlCount: processedUrls.size,
		assetCount: allAssets.size,
		sharedHtmlData,
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
		htmlCount: {
			type: 'number',
			scope: 'global',
		},
		assetCount: {
			type: 'number',
			scope: 'global',
		},
		sharedHtmlData: {
			type: 'Map',
			scope: 'global',
		},
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
