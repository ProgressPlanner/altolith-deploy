/**
 * Publish Step Definitions Tests
 *
 * @package
 */

import {
	PUBLISH_STEPS,
	getStep,
	getNextStep,
	getCompletionMessage,
	getWaitingMessage,
	getLabel,
	supportsProgress,
	requiresBrowserUpload,
} from '../steps';

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

	describe( 'getNextStep', () => {
		test( 'returns next step ID for valid current step', () => {
			const nextStep = getNextStep( 'discoverAssets' );

			expect( nextStep ).toBe( 'getStaticSiteUrls' );
		} );

		test( 'returns null for last step', () => {
			const nextStep = getNextStep( 'uploadSiteArchive' );

			expect( nextStep ).toBeNull();
		} );

		test( 'returns null for invalid step ID', () => {
			const nextStep = getNextStep( 'invalidStep' );

			expect( nextStep ).toBeNull();
		} );

		test( 'returns correct next step for each step', () => {
			for ( let i = 0; i < PUBLISH_STEPS.length - 1; i++ ) {
				const currentStep = PUBLISH_STEPS[ i ];
				const expectedNextStep = PUBLISH_STEPS[ i + 1 ];

				expect( getNextStep( currentStep.id ) ).toBe(
					expectedNextStep.id
				);
			}
		} );
	} );

	describe( 'getCompletionMessage', () => {
		test( 'returns completion message for valid step', () => {
			const message = getCompletionMessage( 'discoverAssets' );

			expect( message ).toBeDefined();
			expect( typeof message ).toBe( 'string' );
		} );

		test( 'returns null for invalid step ID', () => {
			const message = getCompletionMessage( 'invalidStep' );

			expect( message ).toBeNull();
		} );
	} );

	describe( 'getWaitingMessage', () => {
		test( 'returns waiting message for valid step', () => {
			const message = getWaitingMessage( 'discoverAssets' );

			expect( message ).toBeDefined();
			expect( typeof message ).toBe( 'string' );
		} );

		test( 'returns null for invalid step ID', () => {
			const message = getWaitingMessage( 'invalidStep' );

			expect( message ).toBeNull();
		} );
	} );

	describe( 'getLabel', () => {
		test( 'returns label for valid step', () => {
			const label = getLabel( 'discoverAssets' );

			expect( label ).toBeDefined();
			expect( typeof label ).toBe( 'string' );
		} );

		test( 'returns null for invalid step ID', () => {
			const label = getLabel( 'invalidStep' );

			expect( label ).toBeNull();
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

	describe( 'requiresBrowserUpload', () => {
		test( 'returns false for steps without requiresBrowserUpload property', () => {
			// Most steps don't have this property, so it should default to false
			expect( requiresBrowserUpload( 'discoverAssets' ) ).toBe( false );
		} );

		test( 'returns false for invalid step ID', () => {
			expect( requiresBrowserUpload( 'invalidStep' ) ).toBe( false );
		} );
	} );
} );
