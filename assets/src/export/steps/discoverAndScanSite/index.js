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
import {
	HtmlFetchStrategyManager,
	categorizeError,
	STRATEGY,
} from '@aether/export/utils/htmlFetchStrategy';

/**
 * Batch size for PHP endpoint requests
 */
const BATCH_SIZE = 10;

/**
 * Fetch single URL via JavaScript fallback
 *
 * @param {string} url URL to fetch
 * @return {Promise<Object>} Result with html and success flag
 */
async function fetchWithJsFallback( url ) {
	try {
		const response = await fetch( url, {
			method: 'GET',
			credentials: 'omit',
			headers: {
				'User-Agent': 'Aether Static Site Generator',
			},
		} );

		if ( ! response.ok ) {
			return { success: false };
		}

		const contentType = response.headers.get( 'content-type' ) || '';
		if ( ! contentType.includes( 'text/html' ) ) {
			return { success: false, skip: true };
		}

		return { success: true, html: await response.text() };
	} catch ( error ) {
		return { success: false, error: error.message };
	}
}

/**
 * Process HTML result - extract assets, links, store in map
 *
 * @param {string} url            Original URL
 * @param {string} html           HTML content
 * @param {string} siteUrl        Site base URL
 * @param {Map}    htmlDataMap    Map to store HTML data
 * @param {Set}    allAssets      Set to collect assets
 * @param {Set}    discoveredUrls Set of discovered URLs
 * @param {Array}  pendingUrls    Array of pending URLs to process
 * @param {Set}    processedUrls  Set of already processed URLs
 * @return {Promise<void>}
 */
async function processHtmlResult(
	url,
	html,
	siteUrl,
	htmlDataMap,
	allAssets,
	discoveredUrls,
	pendingUrls,
	processedUrls
) {
	const normalizedUrl = normalize( url, siteUrl );

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
	const internalLinks = await extractInternalLinks( html, url, siteUrl );
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
}

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

	// Initialize strategy manager for two-tiered HTML fetching
	const strategyManager = new HtmlFetchStrategyManager();
	let phpFetchCount = 0;
	let jsFallbackCount = 0;

	let processedCount = 0;

	// Process URLs in batches for efficiency
	while ( pendingUrls.length > 0 ) {
		// Collect batch of URLs to process (filter out already processed)
		const batch = [];
		while ( batch.length < BATCH_SIZE && pendingUrls.length > 0 ) {
			const url = pendingUrls.shift();
			const normalizedUrl = normalize( url, siteUrl );

			if ( ! processedUrls.has( normalizedUrl ) ) {
				processedUrls.add( normalizedUrl );
				batch.push( { url, normalizedUrl } );
			}
		}

		if ( batch.length === 0 ) {
			continue;
		}

		// Separate URLs by fetch strategy
		const phpUrls = [];
		const jsUrls = [];

		for ( const { url, normalizedUrl } of batch ) {
			if ( strategyManager.shouldUsePHP( url ) ) {
				phpUrls.push( { url, normalizedUrl } );
			} else {
				jsUrls.push( { url, normalizedUrl } );
			}
		}

		// Batch fetch via PHP endpoint
		if ( phpUrls.length > 0 ) {
			try {
				const batchResult = await api.fetchHtmlBatch(
					phpUrls.map( ( item ) => item.url )
				);

				if ( batchResult.success && batchResult.results ) {
					for ( const { url, normalizedUrl } of phpUrls ) {
						const data = batchResult.results[ url ];

						if ( data && data.success && data.html ) {
							strategyManager.recordResult( url, true );
							phpFetchCount++;
							processedCount++;

							try {
								await processHtmlResult(
									url,
									data.html,
									siteUrl,
									htmlDataMap,
									allAssets,
									discoveredUrls,
									pendingUrls,
									processedUrls
								);
							} catch ( error ) {
								console.error(
									`[Aether] Failed to process HTML for ${ url }:`,
									error.message
								);
							}
						} else {
							// PHP failed for this URL - fall back to JS
							strategyManager.recordResult(
								url,
								false,
								'php_error'
							);
							jsUrls.push( { url, normalizedUrl } );
						}
					}
				} else {
					// Batch failed entirely - all URLs fall back to JS
					for ( const item of phpUrls ) {
						strategyManager.recordResult(
							item.url,
							false,
							categorizeError(
								new Error( 'Batch request failed' )
							)
						);
						jsUrls.push( item );
					}
				}
			} catch ( error ) {
				// Batch request threw - all URLs fall back to JS
				for ( const item of phpUrls ) {
					strategyManager.recordResult(
						item.url,
						false,
						categorizeError( error )
					);
					jsUrls.push( item );
				}
			}
		}

		// JS fallback for remaining URLs (one by one)
		for ( const { url } of jsUrls ) {
			try {
				const result = await fetchWithJsFallback( url );

				if ( result.success && result.html ) {
					jsFallbackCount++;
					processedCount++;

					await processHtmlResult(
						url,
						result.html,
						siteUrl,
						htmlDataMap,
						allAssets,
						discoveredUrls,
						pendingUrls,
						processedUrls
					);
				} else {
					processedCount++;
				}
			} catch ( error ) {
				processedCount++;
				console.error(
					`[Aether] discoverAndScanSite: Failed to process ${ url }:`,
					error.message
				);
			}
		}

		// Update progress after batch
		if ( setStepProgress ) {
			const status = strategyManager.getStatus();
			setStepProgress( 'discoverAndScanSite', {
				current: processedCount,
				total: discoveredUrls.size,
				statusData: {
					pagesScanned: processedCount,
					pagesDiscovered: discoveredUrls.size,
					assetsFound: allAssets.size,
					fetchStrategy: status.strategy,
					phpFetchCount,
					jsFallbackCount,
				},
			} );
		}

		// Update status message after batch
		const status = strategyManager.getStatus();
		const modeText =
			status.strategy === STRATEGY.JS_ONLY
				? __( ' (fallback mode)', 'aether-site-exporter' )
				: '';
		setStatusMessage(
			sprintf(
				/* translators: %1$d: Pages scanned, %2$d: Total discovered */
				__(
					'Scanned %1$d pages, discovered %2$d URLs…',
					'aether-site-exporter'
				),
				processedCount,
				discoveredUrls.size
			) + modeText,
			'progress',
			'discoverAndScanSite'
		);
	}

	// Log strategy status for debugging
	const finalStatus = strategyManager.getStatus();
	if ( finalStatus.isUsingFallback ) {
		console.info(
			`[Aether] HTML fetch completed in fallback mode. ` +
				`PHP: ${ phpFetchCount }, JS: ${ jsFallbackCount }, ` +
				`Success rate: ${ finalStatus.successRate }`
		);
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
	deploymentType: 'static_site',
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
