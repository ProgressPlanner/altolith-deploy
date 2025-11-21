/**
 * Publish Step Definitions Tests
 *
 * @package
 */

import { PUBLISH_STEPS, getStep, supportsProgress } from '../steps';

describe( 'steps', () => {
	describe( 'PUBLISH_STEPS', () => {
		test( 'defines all required steps', () => {
			const stepIds = PUBLISH_STEPS.map( ( step ) => step.id );

			expect( stepIds ).toContain( 'discoverAssets' );
			expect( stepIds ).toContain( 'getStaticSiteUrls' );
			expect( stepIds ).toContain( 'generateBlueprint' );
			expect( stepIds ).toContain( 'createSiteArchive' );
			expect( stepIds ).toContain( 'uploadStaticSiteFiles' );
			expect( stepIds ).toContain( 'uploadSiteArchive' );
		} );

		test( 'steps are in correct order', () => {
			expect( PUBLISH_STEPS[ 0 ].id ).toBe( 'discoverAssets' );
			expect( PUBLISH_STEPS[ PUBLISH_STEPS.length - 1 ].id ).toBe(
				'uploadSiteArchive'
			);
		} );

		test( 'each step has required properties', () => {
			PUBLISH_STEPS.forEach( ( step ) => {
				expect( step ).toHaveProperty( 'id' );
				expect( step ).toHaveProperty( 'label' );
				expect( step ).toHaveProperty( 'supportsProgress' );
				expect( step ).toHaveProperty( 'phase' );
				expect( step ).toHaveProperty( 'waitingMessage' );
				expect( step ).toHaveProperty( 'completionMessage' );
			} );
		} );
	} );

	describe( 'getStep', () => {
		test( 'returns step definition for valid step ID', () => {
			const step = getStep( 'discoverAssets' );

			expect( step ).toBeDefined();
			expect( step.id ).toBe( 'discoverAssets' );
			expect( step.label ).toBeDefined();
		} );

		test( 'returns null for invalid step ID', () => {
			const step = getStep( 'invalidStep' );

			expect( step ).toBeNull();
		} );

		test( 'returns null for empty string', () => {
			const step = getStep( '' );

			expect( step ).toBeNull();
		} );
	} );

	describe( 'supportsProgress', () => {
		test( 'returns true for steps that support progress', () => {
			const step = getStep( 'createSiteArchive' );

			expect( step.supportsProgress ).toBe( true );
			expect( supportsProgress( 'createSiteArchive' ) ).toBe( true );
		} );

		test( 'returns false for steps that do not support progress', () => {
			const step = getStep( 'discoverAssets' );

			expect( step.supportsProgress ).toBe( false );
			expect( supportsProgress( 'discoverAssets' ) ).toBe( false );
		} );

		test( 'returns false for invalid step ID', () => {
			expect( supportsProgress( 'invalidStep' ) ).toBe( false );
		} );
	} );
} );
