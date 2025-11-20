/**
 * Blueprint Bundle Upload Phase
 *
 * Uploads blueprint-bundle.zip to configured providers.
 * This phase depends on the buildBlueprintBundle job completing.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import steps to trigger their registration
import './steps/uploadBundle';

/**
 * Register blueprintBundle phase for uploadAssets job
 */
addFilter(
	'aether.publish.uploadAssets.phases.register',
	'aether/upload-assets-blueprint-bundle-phase',
	( phases ) => {
		phases.push( {
			id: 'blueprintBundle',
			label: 'Upload Blueprint Bundle',
			description: 'Upload blueprint-bundle.zip to providers',
			dependencies: [ 'buildBlueprintBundle' ],
			steps: [], // Steps will be added via registration hooks
		} );
		return phases;
	}
);
