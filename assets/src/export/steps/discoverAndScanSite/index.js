/**
 * Discover and Scan Site Step
 *
 * Unified step that discovers URLs from WordPress and crawls pages
 * to extract assets (CSS, JS, images) and discover internal links.
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
	pending: __( 'Discover site', 'aether-site-exporter' ),
	running: ( data ) => {
		const { pagesScanned = 0, assetsFound = 0 } = data;
		if ( pagesScanned === 0 ) {
			return __(
				'Fetching URLs from WordPress…',
				'aether-site-exporter'
			);
		}
		return sprintf(
			/* translators: %1$d: Pages scanned, %2$d: Assets found */
			__( 'Scanning… %1$d pages, %2$d assets', 'aether-site-exporter' ),
			pagesScanned,
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
			__( 'Discovered %1$s with %2$s', 'aether-site-exporter' ),
			pagesText,
			assetsText
		);
	},
};

/**
 * Discover and scan site step handler
 *
 * Combines URL discovery from WordPress API with crawl-based page scanning
 * and asset extraction into a single unified step.
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {string}   context.siteUrl          - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress  - Step progress updater
 * @return {Promise<Object>} Step result with URLs, HTML data, and counts
 */
async function handler( context ) {
	const { api, siteUrl, setStatusMessage, setStepProgress } = context;

	// Phase 1: Get seed URLs from WordPress API
	setStatusMessage(
		__( 'Fetching URLs from WordPress…', 'aether-site-exporter' ),
		'progress',
		'discoverAndScanSite'
	);

	const urlResponse = await api.discoverUrls( ( progress ) => {
		if ( progress.status === 'fetching' ) {
			setStatusMessage(
				sprintf(
					/* translators: %s: Type being fetched (posts, terms, etc.) */
					__( 'Fetching %s…', 'aether-site-exporter' ),
					progress.type
				),
				'progress',
				'discoverAndScanSite'
			);
		}
	} );

	if ( ! urlResponse.success ) {
		throw new Error(
			urlResponse.message ||
				__( 'Failed to discover URLs', 'aether-site-exporter' )
		);
	}

	const seedUrls = urlResponse.urls || [];
	const staticSiteUrl = urlResponse.staticSiteUrl || siteUrl;

	// Phase 2: Crawl and discover pages + assets
	setStatusMessage(
		__( 'Scanning pages and discovering assets…', 'aether-site-exporter' ),
		'progress',
		'discoverAndScanSite'
	);

	const htmlDataMap = new Map();
	const discoveredUrls = new Set(
		seedUrls.map( ( u ) => normalize( u, siteUrl ) )
	);
	const processedUrls = new Set();
	const pendingUrls = [ ...seedUrls ];
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

		// Update progress with statusData for dynamic label
		if ( setStepProgress ) {
			setStepProgress( 'discoverAndScanSite', {
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
				'discoverAndScanSite'
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

			// Store HTML and assets in Map
			htmlDataMap.set( normalizedUrl, {
				rawHtml: html,
				assetUrls: assets,
			} );

			// Extract internal links for crawl-based discovery
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
				`[Aether] discoverAndScanSite: Failed to process ${ url }:`,
				error.message
			);
		}
	}

	// Combine processed page URLs with discovered assets
	const expandedUrls = [ ...processedUrls, ...allAssets ];

	// Final progress update with complete statusData
	if ( setStepProgress ) {
		setStepProgress( 'discoverAndScanSite', {
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
		'discoverAndScanSite'
	);

	return {
		urls: expandedUrls,
		htmlDataMap,
		htmlCount: processedUrls.size,
		assetCount: allAssets.size,
		staticSiteUrl,
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'discoverAndScanSite',
	label: __( 'Discover Site', 'aether-site-exporter' ),
	description: __(
		'Find all pages and assets for export',
		'aether-site-exporter'
	),
	supportsProgress: true,
	dependencies: [],
	requires: {
		api: {
			from: 'initial',
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
		staticSiteUrl: {
			type: 'string',
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
	'aether/step-discoverAndScanSite',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
