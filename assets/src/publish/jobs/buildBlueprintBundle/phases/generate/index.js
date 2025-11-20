/**
 * Generate Phase
 *
 * Creates WordPress Playground blueprint-bundle.zip containing:
 * - blueprint.json (site configuration)
 * - wp-content.zip (from prepare phase)
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import steps to trigger their registration
import './steps/generateBlueprint';

/**
 * Register generate phase for buildBlueprintBundle job
 */
addFilter(
	'aether.publish.buildBlueprintBundle.phases.register',
	'aether/build-blueprint-bundle-generate-phase',
	( phases ) => {
		phases.push( {
			id: 'generate',
			label: 'Generate Blueprint',
			description: 'Create blueprint-bundle.zip',
			dependencies: [ 'buildBlueprintBundle.prepare' ],
			steps: [], // Steps will be added via registration hooks
		} );
		return phases;
	}
);
