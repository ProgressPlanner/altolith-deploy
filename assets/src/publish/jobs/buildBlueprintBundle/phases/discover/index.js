/**
 * Discover Phase
 *
 * Discovers custom plugins and themes that need to be included
 * in the blueprint bundle. Custom assets are those not available
 * from WordPress.org.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import steps to trigger their registration
import './steps/discoverAssets';

/**
 * Register discover phase for buildBlueprintBundle job
 */
addFilter(
	'aether.publish.buildBlueprintBundle.phases.register',
	'aether/build-blueprint-bundle-discover-phase',
	( phases ) => {
		phases.push( {
			id: 'discover',
			label: 'Discover Assets',
			description: 'Find custom plugins and themes to include',
			dependencies: [],
			steps: [], // Steps will be added via registration hooks
		} );
		return phases;
	}
);
