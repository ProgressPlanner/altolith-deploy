/**
 * Job Registry
 *
 * Central registry for managing job, phase, and step registration.
 * Supports three-level registration:
 * 1. Jobs via aether.publish.jobs.register
 * 2. Phases via aether.publish.{jobId}.phases.register
 * 3. Steps via aether.publish.{jobId}.{phaseId}.steps.register
 *
 * @package
 */

import { applyFilters } from '@wordpress/hooks';

/**
 * JobRegistry class
 *
 * Manages registration and loading of jobs, phases, and steps.
 */
class JobRegistry {
	constructor() {
		this.jobs = new Map();
		this.phases = new Map(); // jobId -> Map of phases
		this.steps = new Map(); // jobId.phaseId -> Map of steps
		this.loaded = false;
	}

	/**
	 * Load all jobs and apply all registration hooks
	 *
	 * Registration happens in three passes:
	 * 1. Register jobs
	 * 2. For each job, register phases
	 * 3. For each phase, register steps
	 *
	 * @return {Array} Array of complete job objects with phases and steps
	 */
	loadJobs() {
		if ( this.loaded ) {
			return this.buildJobsArray();
		}

		// Pass 1: Register jobs
		let jobs = [];
		jobs = applyFilters( 'aether.publish.jobs.register', jobs );

		// Store base jobs
		jobs.forEach( ( job ) => {
			this.jobs.set( job.id, job );
			this.phases.set( job.id, new Map() );

			// Store initial phases from job definition
			if ( job.phases && Array.isArray( job.phases ) ) {
				job.phases.forEach( ( phase ) => {
					this.phases.get( job.id ).set( phase.id, phase );
					this.steps.set( `${ job.id }.${ phase.id }`, new Map() );

					// Store initial steps from phase definition
					if ( phase.steps && Array.isArray( phase.steps ) ) {
						phase.steps.forEach( ( step ) => {
							this.steps
								.get( `${ job.id }.${ phase.id }` )
								.set( step.id, step );
						} );
					}
				} );
			}
		} );

		// Pass 2: Register phases into each job
		for ( const [ jobId ] of this.jobs ) {
			const phasesMap = this.phases.get( jobId );
			let phasesArray = Array.from( phasesMap.values() );

			// Apply hook: aether.publish.{jobId}.phases.register
			phasesArray = applyFilters(
				`aether.publish.${ jobId }.phases.register`,
				phasesArray
			);

			// Merge new phases into job
			phasesArray.forEach( ( phase ) => {
				if ( ! phasesMap.has( phase.id ) ) {
					phasesMap.set( phase.id, phase );
					this.steps.set( `${ jobId }.${ phase.id }`, new Map() );

					// Store initial steps from newly registered phase
					if ( phase.steps && Array.isArray( phase.steps ) ) {
						phase.steps.forEach( ( step ) => {
							this.steps
								.get( `${ jobId }.${ phase.id }` )
								.set( step.id, step );
						} );
					}
				}
			} );
		}

		// Pass 3: Register steps into each phase
		for ( const [ jobId, phasesMap ] of this.phases ) {
			for ( const [ phaseId ] of phasesMap ) {
				const stepsMap = this.steps.get( `${ jobId }.${ phaseId }` );
				let stepsArray = Array.from( stepsMap.values() );

				// Apply hook: aether.publish.{jobId}.{phaseId}.steps.register
				stepsArray = applyFilters(
					`aether.publish.${ jobId }.${ phaseId }.steps.register`,
					stepsArray
				);

				// Merge new steps into phase
				stepsArray.forEach( ( step ) => {
					if ( ! stepsMap.has( step.id ) ) {
						stepsMap.set( step.id, step );
					}
				} );
			}
		}

		this.loaded = true;
		return this.buildJobsArray();
	}

	/**
	 * Build final jobs array with all phases and steps
	 *
	 * @return {Array} Complete jobs array
	 */
	buildJobsArray() {
		const jobs = [];

		for ( const [ jobId, job ] of this.jobs ) {
			const phasesMap = this.phases.get( jobId );
			const phases = [];

			for ( const [ phaseId, phase ] of phasesMap ) {
				const stepsMap = this.steps.get( `${ jobId }.${ phaseId }` );
				const steps = Array.from( stepsMap.values() );

				phases.push( {
					...phase,
					steps,
				} );
			}

			jobs.push( {
				...job,
				phases,
			} );
		}

		return jobs;
	}

	/**
	 * Get a specific job by ID
	 *
	 * @param {string} jobId Job ID
	 * @return {Object|null} Job object or null if not found
	 */
	getJob( jobId ) {
		if ( ! this.loaded ) {
			this.loadJobs();
		}

		const job = this.jobs.get( jobId );
		if ( ! job ) {
			return null;
		}

		const phasesMap = this.phases.get( jobId );
		const phases = [];

		for ( const [ phaseId, phase ] of phasesMap ) {
			const stepsMap = this.steps.get( `${ jobId }.${ phaseId }` );
			const steps = Array.from( stepsMap.values() );

			phases.push( {
				...phase,
				steps,
			} );
		}

		return {
			...job,
			phases,
		};
	}

	/**
	 * Get all phases for a job
	 *
	 * @param {string} jobId Job ID
	 * @return {Array} Array of phase objects
	 */
	getPhases( jobId ) {
		if ( ! this.loaded ) {
			this.loadJobs();
		}

		const phasesMap = this.phases.get( jobId );
		if ( ! phasesMap ) {
			return [];
		}

		const phases = [];
		for ( const [ phaseId, phase ] of phasesMap ) {
			const stepsMap = this.steps.get( `${ jobId }.${ phaseId }` );
			const steps = Array.from( stepsMap.values() );

			phases.push( {
				...phase,
				steps,
			} );
		}

		return phases;
	}

	/**
	 * Get all steps for a phase
	 *
	 * @param {string} jobId   Job ID
	 * @param {string} phaseId Phase ID
	 * @return {Array} Array of step objects
	 */
	getSteps( jobId, phaseId ) {
		if ( ! this.loaded ) {
			this.loadJobs();
		}

		const stepsMap = this.steps.get( `${ jobId }.${ phaseId }` );
		if ( ! stepsMap ) {
			return [];
		}

		return Array.from( stepsMap.values() );
	}

	/**
	 * Reset registry (mainly for testing)
	 */
	reset() {
		this.jobs.clear();
		this.phases.clear();
		this.steps.clear();
		this.loaded = false;
	}
}

// Export singleton instance
export default new JobRegistry();
