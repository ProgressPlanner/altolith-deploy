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
		test( 'calculates progress for discoverAssets step (4% weight)', () => {
			// Phase 1: 0-4%
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
			).toBe( 2 ); // 0 + (50/100) * 4 = 2
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: 100,
				} )
			).toBe( 4 );
		} );

		test( 'calculates progress for offloadMedia step (10% weight)', () => {
			// Phase 2: 4-14%
			expect(
				calculateOverallProgress( {
					step: 'offloadMedia',
					progress: 0,
				} )
			).toBe( 4 );
			expect(
				calculateOverallProgress( {
					step: 'offloadMedia',
					progress: 50,
				} )
			).toBe( 9 ); // 4 + (50/100) * 10 = 4 + 5 = 9
			expect(
				calculateOverallProgress( {
					step: 'offloadMedia',
					progress: 100,
				} )
			).toBe( 14 );
		} );

		test( 'calculates progress for getStaticSiteUrls step (7% weight, parallel with generateBlueprint)', () => {
			// Phase 3: 14-21% (runs in parallel with generateBlueprint)
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 0,
				} )
			).toBe( 14 );
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 50,
				} )
			).toBe( 18 ); // 14 + (50/100) * 7 = 14 + 3.5 = 17.5, rounded = 18
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 100,
				} )
			).toBe( 21 );
		} );

		test( 'calculates progress for generateBlueprint step (1% weight, parallel with getStaticSiteUrls)', () => {
			// Phase 3: 14-15% (runs in parallel with getStaticSiteUrls)
			expect(
				calculateOverallProgress( {
					step: 'generateBlueprint',
					progress: 0,
				} )
			).toBe( 14 );
			expect(
				calculateOverallProgress( {
					step: 'generateBlueprint',
					progress: 50,
				} )
			).toBe( 15 ); // 14 + (50/100) * 1 = 14 + 0.5 = 14.5, rounded = 15
			expect(
				calculateOverallProgress( {
					step: 'generateBlueprint',
					progress: 100,
				} )
			).toBe( 15 );
		} );

		test( 'calculates progress for createSiteArchive step (15% weight)', () => {
			// Phase 4: 22-37%
			expect(
				calculateOverallProgress( {
					step: 'createSiteArchive',
					progress: 0,
				} )
			).toBe( 22 );
			expect(
				calculateOverallProgress( {
					step: 'createSiteArchive',
					progress: 50,
				} )
			).toBe( 30 ); // 22 + (50/100) * 15 = 22 + 7.5 = 29.5, rounded = 30
			expect(
				calculateOverallProgress( {
					step: 'createSiteArchive',
					progress: 100,
				} )
			).toBe( 37 );
		} );

		test( 'calculates progress for uploadStaticSiteFiles step (48% weight, parallel with uploadSiteArchive)', () => {
			// Phase 5: 37-85% (runs in parallel with uploadSiteArchive)
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 0,
				} )
			).toBe( 37 );
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 50,
				} )
			).toBe( 61 ); // 37 + (50/100) * 48 = 37 + 24 = 61
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 100,
				} )
			).toBe( 85 );
		} );

		test( 'calculates progress for uploadSiteArchive step (15% weight, parallel with uploadStaticSiteFiles)', () => {
			// Phase 5: 37-52% (runs in parallel with uploadStaticSiteFiles)
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 0,
				} )
			).toBe( 37 );
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 50,
				} )
			).toBe( 45 ); // 37 + (50/100) * 15 = 37 + 7.5 = 44.5, rounded = 45
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 100,
				} )
			).toBe( 52 );
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
			).toBe( 14 );
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
			// uploadSiteArchive: cumulative=37%, weight=15%, so max = 52%
			expect(
				calculateOverallProgress( {
					step: 'uploadSiteArchive',
					progress: 200,
				} )
			).toBe( 52 ); // 37 + 15 = 52 (step progress clamped to 100%)
			// uploadStaticSiteFiles: cumulative=37%, weight=48%, so max = 85%
			expect(
				calculateOverallProgress( {
					step: 'uploadStaticSiteFiles',
					progress: 200,
				} )
			).toBe( 85 ); // 37 + 48 = 85 (step progress clamped to 100%)
		} );

		test( 'rounds progress values', () => {
			// Test with values that would produce decimals
			expect(
				calculateOverallProgress( {
					step: 'discoverAssets',
					progress: 33.333,
				} )
			).toBe( 1 ); // 0 + (33.333/100) * 4 = 0 + 1.33332 = 1.33332, rounded = 1
			expect(
				calculateOverallProgress( {
					step: 'getStaticSiteUrls',
					progress: 33.333,
				} )
			).toBe( 16 ); // 14 + (33.333/100) * 7 = 14 + 2.33331 = 16.33331, rounded = 16
		} );
	} );

	describe( 'getProgressWeight', () => {
		test( 'returns weight configuration for valid step', () => {
			const weight = getProgressWeight( 'discoverAssets' );
			expect( weight ).toEqual( { start: 0, range: 4 } );
		} );

		test( 'returns null for invalid step', () => {
			expect( getProgressWeight( 'invalidStep' ) ).toBeNull();
		} );

		test( 'returns correct weights for all steps (dynamically from PUBLISH_WORKFLOW)', () => {
			// Phase 1: discoverAssets (0-4%)
			expect( getProgressWeight( 'discoverAssets' ) ).toEqual( {
				start: 0,
				range: 4,
			} );
			// Phase 2: offloadMedia (4-14%)
			expect( getProgressWeight( 'offloadMedia' ) ).toEqual( {
				start: 4,
				range: 10,
			} );
			// Phase 3: getStaticSiteUrls (14-21%, parallel)
			expect( getProgressWeight( 'getStaticSiteUrls' ) ).toEqual( {
				start: 14,
				range: 7,
			} );
			// Phase 3: generateBlueprint (14-15%, parallel)
			expect( getProgressWeight( 'generateBlueprint' ) ).toEqual( {
				start: 14,
				range: 1,
			} );
			// Phase 4: createSiteArchive (22-37%)
			expect( getProgressWeight( 'createSiteArchive' ) ).toEqual( {
				start: 22,
				range: 15,
			} );
			// Phase 5: uploadStaticSiteFiles (37-85%, parallel)
			expect( getProgressWeight( 'uploadStaticSiteFiles' ) ).toEqual( {
				start: 37,
				range: 48,
			} );
			// Phase 5: uploadSiteArchive (37-52%, parallel)
			expect( getProgressWeight( 'uploadSiteArchive' ) ).toEqual( {
				start: 37,
				range: 15,
			} );
		} );
	} );
} );
