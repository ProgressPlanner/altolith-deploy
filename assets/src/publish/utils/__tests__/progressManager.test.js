/**
 * Progress Manager Tests
 *
 * Tests dynamic progress calculation from PUBLISH_WORKFLOW.
 * Tests auto-update when workflow weights change.
 *
 * @package
 */

import {
	calculateOverallProgress,
	getProgressWeight,
} from '../progressManager';
import { MAX_PROGRESS } from '../../../utils/constants';

describe( 'progressManager', () => {
	describe( 'calculateOverallProgress', () => {
		test( 'calculates progress for discoverAssets step (5% weight)', () => {
			// Phase 1: 0-5%
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: 0,
				} )
			).toBe( 0 );
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: 50,
				} )
			).toBe( 3 ); // 0 + (50/100) * 5 = 2.5, rounded = 3
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: 100,
				} )
			).toBe( 5 );
		} );

		test( 'calculates progress for getStaticSiteUrls step (8% weight)', () => {
			// Phase 2: 5-13%
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 0,
				} )
			).toBe( 5 );
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 50,
				} )
			).toBe( 9 ); // 5 + (50/100) * 8 = 5 + 4 = 9
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 100,
				} )
			).toBe( 13 );
		} );

		test( 'calculates progress for generateBlueprint step (1% weight, after createSiteArchive)', () => {
			// Phase 4: 33-34% (runs after createSiteArchive)
			expect(
				calculateOverallProgress( {
					step: 'generateBlueprint',
					progress: 0,
				} )
			).toBe( 33 );
			expect(
				calculateOverallProgress( {
					step: 'generateBlueprint',
					progress: 50,
				} )
			).toBe( 34 ); // 33 + (50/100) * 1 = 33 + 0.5 = 33.5, rounded = 34
			expect(
				calculateOverallProgress( {
					step: 'generateBlueprint',
					progress: 100,
				} )
			).toBe( 34 );
		} );

		test( 'calculates progress for createSiteArchive step (20% weight)', () => {
			// Phase 3: 13-33%
			expect(
				calculateOverallProgress( {
					step: 'createSiteArchive',
					progress: 0,
				} )
			).toBe( 13 );
			expect(
				calculateOverallProgress( {
					step: 'createSiteArchive',
					progress: 50,
				} )
			).toBe( 23 ); // 13 + (50/100) * 20 = 13 + 10 = 23
			expect(
				calculateOverallProgress( {
					step: 'createSiteArchive',
					progress: 100,
				} )
			).toBe( 33 ); // 13 + 20 = 33
		} );

		test( 'calculates progress for uploadStaticSiteFiles step (50% weight, parallel with uploadSiteArchive)', () => {
			// Phase 4: 34-84% (runs in parallel with uploadSiteArchive)
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 0,
				} )
			).toBe( 34 );
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 50,
				} )
			).toBe( 59 ); // 34 + (50/100) * 50 = 34 + 25 = 59
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 100,
				} )
			).toBe( 84 );
		} );

		test( 'calculates progress for uploadSiteArchive step (16% weight, parallel with uploadStaticSiteFiles)', () => {
			// Phase 4: 34-50% (runs in parallel with uploadStaticSiteFiles)
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 0,
				} )
			).toBe( 34 );
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 50,
				} )
			).toBe( 42 ); // 34 + (50/100) * 16 = 34 + 8 = 42
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 100,
				} )
			).toBe( 50 );
		} );

		test( 'handles undefined progress', () => {
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: undefined,
				} )
			).toBe( 0 );
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: undefined,
				} )
			).toBe( 5 );
		} );

		test( 'handles unknown step', () => {
			expect(
				calculateOverallProgress( {
					step: 'unknownStep',
					progress: 50,
				} )
			).toBe( 0 );
		} );

		test( 'clamps progress to 0-100 range', () => {
			// Negative progress clamped to 0%
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: -10,
				} )
			).toBe( 0 );
			// Progress over 100% is clamped to step's max contribution
			// uploadSiteArchive: cumulative=34%, weight=16%, so max = 50%
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 200,
				} )
			).toBe( 50 ); // 34 + 16 = 50 (step progress clamped to 100%)
			// uploadStaticSiteFiles: cumulative=34%, weight=50%, so max = 84%
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 200,
				} )
			).toBe( 84 ); // 34 + 50 = 84 (step progress clamped to 100%)
		} );

		test( 'rounds progress values', () => {
			// Test with values that would produce decimals
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: 33.333,
				} )
			).toBe( 2 ); // 0 + (33.333/100) * 5 = 0 + 1.66665 = 1.66665, rounded = 2
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 33.333,
				} )
			).toBe( 8 ); // 5 + (33.333/100) * 8 = 5 + 2.66664 = 7.66664, rounded = 8
		} );
	} );

	describe( 'getProgressWeight', () => {
		test( 'returns weight configuration for valid step', () => {
			const weight = getProgressWeight( 'discoverAssets' );
			expect( weight ).toEqual( { start: 0, range: 5 } );
		} );

		test( 'returns null for invalid step', () => {
			expect( getProgressWeight( 'invalidStep' ) ).toBeNull();
		} );

		test( 'returns correct weights for all steps (dynamically from PUBLISH_WORKFLOW)', () => {
			// Phase 1: discoverAssets (0-5%)
			expect( getProgressWeight( 'discoverAssets' ) ).toEqual( {
				start: 0,
				range: 5,
			} );
			// Phase 2: getStaticSiteUrls (5-13%)
			expect( getProgressWeight( 'getStaticSiteUrls' ) ).toEqual( {
				start: 5,
				range: 8,
			} );
			// Phase 3: createSiteArchive (13-33%)
			expect( getProgressWeight( 'createSiteArchive' ) ).toEqual( {
				start: 13,
				range: 20,
			} );
			// Phase 4: generateBlueprint (33-34%)
			expect( getProgressWeight( 'generateBlueprint' ) ).toEqual( {
				start: 33,
				range: 1,
			} );
			// Phase 5: uploadStaticSiteFiles (34-84%, parallel)
			expect( getProgressWeight( 'uploadStaticSiteFiles' ) ).toEqual( {
				start: 34,
				range: 50,
			} );
			// Phase 4: uploadSiteArchive (34-50%, parallel)
			expect( getProgressWeight( 'uploadSiteArchive' ) ).toEqual( {
				start: 34,
				range: 16,
			} );
		} );
	} );
} );
