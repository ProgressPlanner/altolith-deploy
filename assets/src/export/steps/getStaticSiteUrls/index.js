/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be fetched for static site generation.
 *
 * @since 1.0.0
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';

/**
 * Status labels for the step
 */
const statusLabels = {
	pending: __( 'Get seed URLs', 'aether-site-exporter' ),
	running: () =>
		__( 'Fetching seed URLs from WordPress…', 'aether-site-exporter' ),
	complete: ( data ) => {
		const { urlsCount = 0 } = data;
		return sprintf(
			/* translators: %d: Number of seed URLs */
			_n(
				'Found %d seed URL to crawl',
				'Found %d seed URLs to crawl',
				urlsCount,
				'aether-site-exporter'
			),
			urlsCount
		);
	},
};

/**
 * Get static site URLs step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {string}   context.siteUrl          - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress  - Step progress updater
 * @return {Promise<Object>} Step result with discovered URLs
 */
async function handler( context ) {
	const { api, siteUrl, setStatusMessage, setStepProgress } = context;

	setStatusMessage(
		__( 'Discovering URLs for static site…', 'aether-site-exporter' ),
		'progress',
		'getStaticSiteUrls'
	);

	// Discover URLs from API with progress updates
	const urlResponse = await api.discoverUrls( ( progress ) => {
		if ( progress.status === 'fetching' ) {
			setStatusMessage(
				sprintf(
					/* translators: %s: Type being fetched (posts, terms, etc.) */
					__( 'Fetching %s…', 'aether-site-exporter' ),
					progress.type
				),
				'progress',
				'getStaticSiteUrls'
			);
		}
	} );

	if ( ! urlResponse.success ) {
		throw new Error(
			urlResponse.message ||
				__( 'Failed to discover URLs', 'aether-site-exporter' )
		);
	}

	const urls = urlResponse.urls || [];
	const staticSiteUrl = urlResponse.staticSiteUrl || siteUrl;
	const urlsCount = urls.length;

	// Update progress with statusData for dynamic label
	if ( setStepProgress ) {
		setStepProgress( 'getStaticSiteUrls', {
			current: 1,
			total: 1,
			statusData: {
				urlsCount,
			},
		} );
	}

	setStatusMessage(
		sprintf(
			/* translators: %d: Number of URLs */
			__(
				'Discovered %d URLs for static site generation',
				'aether-site-exporter'
			),
			urlsCount
		),
		'success',
		'getStaticSiteUrls'
	);

	// Return data to merge into execution state
	return {
		urls,
		staticSiteUrl,
		urlsCount,
	};
}

/**
 * Step definition
 */
const stepDefinition = {
	id: 'getStaticSiteUrls',
	label: __( 'Discover URLs', 'aether-site-exporter' ),
	description: __(
		'Find all URLs for static site generation',
		'aether-site-exporter'
	),
	supportsProgress: false,
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
		staticSiteUrl: {
			type: 'string',
			scope: 'global',
		},
		urlsCount: {
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
	'aether/step-getStaticSiteUrls',
	( registry ) => {
		registry.register( stepDefinition );
	},
	10
);
