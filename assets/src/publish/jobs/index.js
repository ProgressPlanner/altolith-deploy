/**
 * Jobs Entry Point
 *
 * Imports all job definitions to trigger their registration with the JobRegistry.
 * This file should be imported before accessing JobRegistry.loadJobs().
 *
 * The import chain automatically registers:
 * - Jobs (via aether.publish.jobs.register)
 * - Phases (via aether.publish.{jobId}.phases.register)
 * - Steps (via aether.publish.{jobId}.{phaseId}.steps.register)
 *
 * @package
 */

// Import all jobs - this triggers their registration hooks
import './buildBlueprintBundle';
import './publishStaticSite';
import './uploadAssets';

// Jobs are now registered and can be loaded via:
// import JobRegistry from './registry/JobRegistry';
// const jobs = JobRegistry.loadJobs();
