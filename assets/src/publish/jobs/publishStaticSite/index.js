/**
 * Publish Static Site Job
 *
 * Converts a WordPress site to static HTML files.
 * Discovers all URLs and generates static HTML for each.
 *
 * This job has one phase:
 * 1. Discover - Find all URLs to convert to static HTML
 *
 * Note: The actual HTML generation happens in a separate phase
 * or is provider-specific (e.g., upload to Netlify, GitHub Pages).
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import phases to trigger their registration
import './phases/discover';

/**
 * Register publishStaticSite job
 */
addFilter(
	'aether.publish.jobs.register',
	'aether/publish-static-site-job',
	( jobs ) => {
		jobs.push( {
			id: 'publishStaticSite',
			label: 'Publish Static Site',
			description:
				'Converts WordPress site to static HTML and publishes',
			dependencies: [],
			phases: [], // Phases will be added via registration hooks
		} );
		return jobs;
	}
);
