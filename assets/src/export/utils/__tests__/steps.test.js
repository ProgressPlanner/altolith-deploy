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

			expect( stepIds ).toContain( 'discoverBlueprintBundleAssets' );
			expect( stepIds ).toContain( 'getStaticSiteUrls' );
			expect( stepIds ).toContain( 'createBlueprintBundle' );
			expect( stepIds ).toContain( 'createWpContentArchive' );
			expect( stepIds ).toContain( 'uploadStaticFiles' );
			expect( stepIds ).toContain( 'uploadBlueprintBundle' );
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

			// Upload and create steps support progress
			expect( progressSteps.map( ( s ) => s.id ) ).toContain(
				'uploadStaticFiles'
			);
			expect( progressSteps.map( ( s ) => s.id ) ).toContain(
				'uploadBlueprintBundle'
			);
			expect( progressSteps.map( ( s ) => s.id ) ).toContain(
				'createWpContentArchive'
			);

			// Discovery steps don't support progress
			expect( noProgressSteps.map( ( s ) => s.id ) ).toContain(
				'discoverBlueprintBundleAssets'
			);
			expect( noProgressSteps.map( ( s ) => s.id ) ).toContain(
				'getStaticSiteUrls'
			);
		} );
	} );
} );
