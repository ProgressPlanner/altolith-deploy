/**
 * Upload Assets Job
 *
 * Handles uploading generated assets to configured providers.
 * This job is provider-dependent and may have different phases
 * based on what was generated (blueprint bundle, static site, etc.).
 *
 * Phases:
 * 1. blueprintBundle - Upload blueprint-bundle.zip (if generated)
 * 2. staticSite - Upload static HTML files (if generated)
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';

// Import phases to trigger their registration
import './phases/blueprintBundle';
import './phases/staticSite';

/**
 * Register uploadAssets job
 */
addFilter(
	'aether.publish.jobs.register',
	'aether/upload-assets-job',
	( jobs ) => {
		jobs.push( {
			id: 'uploadAssets',
			label: 'Upload Assets',
			description: 'Upload generated assets to configured providers',
			dependencies: [], // This job can run after any generation job
			phases: [], // Phases will be added via registration hooks
		} );
		return jobs;
	}
);
