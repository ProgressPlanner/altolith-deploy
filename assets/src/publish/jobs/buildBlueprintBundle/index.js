/**
 * Build Blueprint Bundle Job
 *
 * Creates a WordPress Playground blueprint bundle containing:
 * - blueprint.json (site configuration)
 * - wp-content.zip (database + custom assets)
 *
 * This job has three phases:
 * 1. Discover - Find custom plugins/themes to include
 * 2. Prepare - Create wp-content.zip archive
 * 3. Generate - Create blueprint-bundle.zip
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import phases to trigger their registration
import './phases/discover';
import './phases/prepare';
import './phases/generate';

/**
 * Register buildBlueprintBundle job
 */
addFilter(
	'aether.publish.jobs.register',
	'aether/build-blueprint-bundle-job',
	( jobs ) => {
		jobs.push( {
			id: 'buildBlueprintBundle',
			label: 'Build Blueprint Bundle',
			description:
				'Creates a WordPress Playground blueprint bundle with site data',
			dependencies: [],
			phases: [], // Phases will be added via registration hooks
		} );
		return jobs;
	}
);
