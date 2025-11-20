/**
 * Prepare Phase
 *
 * Creates wp-content.zip archive containing database and custom assets.
 * This is the largest file in the bundle (potentially 100s of MB).
 *
 * Uses modular approach with multiple API requests to avoid timeouts
 * and provide granular progress feedback.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import steps to trigger their registration
import './steps/createSiteArchive';

/**
 * Register prepare phase for buildBlueprintBundle job
 */
addFilter(
	'aether.publish.buildBlueprintBundle.phases.register',
	'aether/build-blueprint-bundle-prepare-phase',
	( phases ) => {
		phases.push( {
			id: 'prepare',
			label: 'Prepare Archive',
			description: 'Create wp-content.zip with site data',
			dependencies: [ 'buildBlueprintBundle.discover' ],
			steps: [], // Steps will be added via registration hooks
		} );
		return phases;
	}
);
