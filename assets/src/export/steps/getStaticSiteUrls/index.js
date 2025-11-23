/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be fetched for static site generation.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';

/**
 * Get static site URLs step handler
 *
 * @param {Object} context - Execution context
 * @param {Object} context.api - PublishAPI instance
 * @param {string} context.siteUrl - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @returns {Promise<Object>} Step result with discovered URLs
 */
async function handler( context ) {
	const { api, siteUrl, setStatusMessage } = context;

	setStatusMessage(
		__( 'Discovering URLs for static site…', 'aether' ),
		'progress',
		'getStaticSiteUrls'
	);

	// Discover URLs from API with progress updates
	const urlResponse = await api.discoverUrls( ( progress ) => {
		if ( progress.status === 'fetching' ) {
			setStatusMessage(
				sprintf(
					/* translators: %s: Type being fetched (posts, terms, etc.) */
					__( 'Fetching %s…', 'aether' ),
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
				__( 'Failed to discover URLs', 'aether' )
		);
	}

	const urls = urlResponse.urls || [];
	const staticSiteUrl = urlResponse.staticSiteUrl || siteUrl;
	const urlsCount = urls.length;

	setStatusMessage(
		sprintf(
			/* translators: %d: Number of URLs */
			__( 'Discovered %d URLs for static site generation', 'aether' ),
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
	label: __( 'Discover URLs', 'aether' ),
	description: __( 'Find all URLs for static site generation', 'aether' ),
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
	},
	provides: {
		urls: 'array',
		staticSiteUrl: 'string',
		urlsCount: 'number',
	},
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
