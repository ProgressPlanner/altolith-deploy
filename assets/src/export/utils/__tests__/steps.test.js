/**
 * Publish Step Definitions Tests
 *
 */

import { getRegisteredSteps } from '../../steps';

describe( 'steps', () => {
	describe( 'getRegisteredSteps', () => {
		test( 'defines all required steps', () => {
			const steps = getRegisteredSteps();
			const stepIds = steps.map( ( step ) => step.id );

			expect( stepIds ).toContain( 'discoverAndScanSite' );
			expect( stepIds ).toContain( 'prepareBlueprint' );
			expect( stepIds ).toContain( 'gatherFilesToDeploy' );
			expect( stepIds ).toContain( 'deploy' );
		} );

		test( 'each step has required properties', () => {
			const steps = getRegisteredSteps();

			steps.forEach( ( step ) => {
				expect( step ).toHaveProperty( 'id' );
				expect( step ).toHaveProperty( 'label' );
				expect( step ).toHaveProperty( 'supportsProgress' );
				expect( step ).toHaveProperty( 'handler' );
			} );
		} );

		test( 'steps with progress support are marked correctly', () => {
			const steps = getRegisteredSteps();

			const progressSteps = steps.filter( ( s ) => s.supportsProgress );
			const noProgressSteps = steps.filter(
				( s ) => ! s.supportsProgress
			);

			// Deploy and discover steps support progress
			expect( progressSteps.map( ( s ) => s.id ) ).toContain( 'deploy' );
			expect( progressSteps.map( ( s ) => s.id ) ).toContain(
				'discoverAndScanSite'
			);

			// Prepare blueprint step doesn't support progress
			expect( noProgressSteps.map( ( s ) => s.id ) ).toContain(
				'prepareBlueprint'
			);
		} );
	} );
} );
