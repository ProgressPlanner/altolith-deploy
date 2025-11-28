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
			expect( stepIds ).toContain( 'createBlueprintBundle' );
			expect( stepIds ).toContain( 'upload' );
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

			// Upload and discover steps support progress
			expect( progressSteps.map( ( s ) => s.id ) ).toContain( 'upload' );
			expect( progressSteps.map( ( s ) => s.id ) ).toContain(
				'discoverAndScanSite'
			);

			// Blueprint bundle creation step doesn't support progress
			expect( noProgressSteps.map( ( s ) => s.id ) ).toContain(
				'createBlueprintBundle'
			);
		} );
	} );
} );
