/**
 * Discover Phase
 *
 * Discovers all URLs that need to be converted to static HTML.
 * Uses WordPress queries to find posts, pages, archives, etc.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import steps to trigger their registration
import './steps/getStaticSiteUrls';

/**
 * Register discover phase for publishStaticSite job
 */
addFilter(
	'aether.publish.publishStaticSite.phases.register',
	'aether/publish-static-site-discover-phase',
	( phases ) => {
		phases.push( {
			id: 'discover',
			label: 'Discover URLs',
			description: 'Find all URLs to convert to static HTML',
			dependencies: [],
			steps: [], // Steps will be added via registration hooks
		} );
		return phases;
	}
);
