/**
 * Static Site Upload Phase
 *
 * Uploads static HTML files to configured providers.
 * This phase depends on the publishStaticSite job completing.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import steps to trigger their registration
import './steps/uploadStaticFiles';

/**
 * Register staticSite phase for uploadAssets job
 */
addFilter(
	'aether.publish.uploadAssets.phases.register',
	'aether/upload-assets-static-site-phase',
	( phases ) => {
		phases.push( {
			id: 'staticSite',
			label: 'Upload Static Site',
			description: 'Upload static HTML files to providers',
			dependencies: [ 'publishStaticSite' ],
			steps: [], // Steps will be added via registration hooks
		} );
		return phases;
	}
);
