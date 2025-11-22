/**
 * Upload Calculator Tests
 *
 * Tests for uploadCalculator utilities.
 * Validates pure functions for upload statistics and progress.
 *
 */

import {
	calculateTotalFiles,
	calculateUploadProgress,
	calculateMultiStageProgress,
	calculateUploadStats,
	isUploadSuccessful,
	calculateUploadSpeed,
	estimateRemainingTime,
} from '../uploadCalculator';

describe( 'uploadCalculator', () => {
	describe( 'calculateTotalFiles()', () => {
		test( 'should sum up all file counts', () => {
			const result = calculateTotalFiles( 10, 50, 1 );
			expect( result ).toBe( 61 ); // 10 URLs + 50 assets + 1 manifest
		} );

		test( 'should handle zero counts', () => {
			const result = calculateTotalFiles( 0, 0, 0 );
			expect( result ).toBe( 0 );
		} );

		test( 'should handle missing manifest count (default to 1)', () => {
			const result = calculateTotalFiles( 5, 10 );
			expect( result ).toBe( 16 ); // 5 URLs + 10 assets + 1 manifest (default)
		} );

		test( 'should handle negative numbers gracefully', () => {
			const result = calculateTotalFiles( -5, -10, -1 );
			expect( result ).toBe( 0 ); // Negative numbers treated as 0
		} );

		test( 'should handle non-numeric inputs', () => {
			const result = calculateTotalFiles( 'abc', null, undefined );
			expect( result ).toBe( 1 ); // undefined manifest defaults to 1
		} );

		test( 'should handle large numbers', () => {
			const result = calculateTotalFiles( 1000, 5000, 1 );
			expect( result ).toBe( 6001 );
		} );
	} );

	describe( 'calculateUploadProgress()', () => {
		test( 'should calculate progress percentage', () => {
			const result = calculateUploadProgress( 50, 100 );
			expect( result ).toBe( 50 );
		} );

		test( 'should return 100 when all files uploaded', () => {
			const result = calculateUploadProgress( 100, 100 );
			expect( result ).toBe( 100 );
		} );

		test( 'should return 0 when no files uploaded', () => {
			const result = calculateUploadProgress( 0, 100 );
			expect( result ).toBe( 0 );
		} );

		test( 'should return 100 when total is 0', () => {
			const result = calculateUploadProgress( 0, 0 );
			expect( result ).toBe( 100 );
		} );

		test( 'should round to nearest integer', () => {
			const result = calculateUploadProgress( 1, 3 );
			expect( result ).toBe( 33 ); // 33.33... rounded to 33
		} );

		test( 'should clamp to 100 if uploaded exceeds total', () => {
			const result = calculateUploadProgress( 150, 100 );
			expect( result ).toBe( 100 );
		} );

		test( 'should handle negative uploaded count', () => {
			const result = calculateUploadProgress( -10, 100 );
			expect( result ).toBe( 0 );
		} );

		test( 'should handle negative total count', () => {
			const result = calculateUploadProgress( 50, -100 );
			expect( result ).toBe( 100 ); // Total treated as 1, 50/1 = 100%
		} );

		test( 'should handle non-numeric inputs', () => {
			const result = calculateUploadProgress( 'abc', 'def' );
			expect( result ).toBe( 0 );
		} );
	} );

	describe( 'calculateMultiStageProgress()', () => {
		test( 'should calculate progress for first stage', () => {
			const result = calculateMultiStageProgress( 0, 3, 50 );
			expect( result ).toBe( 17 ); // 0/3 * 100 + 50/3 = 16.67 rounded to 17
		} );

		test( 'should calculate progress for middle stage', () => {
			const result = calculateMultiStageProgress( 1, 3, 50 );
			expect( result ).toBe( 50 ); // 1/3 * 100 + 50/3 = 50
		} );

		test( 'should calculate progress for last stage', () => {
			const result = calculateMultiStageProgress( 2, 3, 100 );
			expect( result ).toBe( 100 ); // 2/3 * 100 + 100/3 = 100
		} );

		test( 'should handle single stage', () => {
			const result = calculateMultiStageProgress( 0, 1, 75 );
			expect( result ).toBe( 75 );
		} );

		test( 'should clamp to 100', () => {
			const result = calculateMultiStageProgress( 2, 2, 100 );
			expect( result ).toBe( 100 );
		} );

		test( 'should handle negative stage numbers', () => {
			const result = calculateMultiStageProgress( -1, 3, 50 );
			expect( result ).toBe( 17 ); // Negative treated as 0
		} );

		test( 'should handle zero total stages', () => {
			const result = calculateMultiStageProgress( 0, 0, 50 );
			expect( result ).toBe( 50 ); // Total stages treated as 1
		} );

		test( 'should handle stage progress over 100', () => {
			const result = calculateMultiStageProgress( 0, 2, 150 );
			expect( result ).toBe( 50 ); // Stage progress clamped to 100
		} );
	} );

	describe( 'calculateUploadStats()', () => {
		test( 'should calculate comprehensive statistics', () => {
			const stats = {
				urlsSucceeded: 8,
				urlsFailed: 2,
				assetsSucceeded: 40,
				assetsFailed: 10,
			};

			const result = calculateUploadStats( stats );

			expect( result ).toEqual( {
				totalUrls: 10,
				totalAssets: 50,
				totalFiles: 60,
				totalSucceeded: 48,
				totalFailed: 12,
				successRate: 80,
				urlSuccessRate: 80,
				assetSuccessRate: 80,
			} );
		} );

		test( 'should handle perfect success', () => {
			const stats = {
				urlsSucceeded: 10,
				urlsFailed: 0,
				assetsSucceeded: 50,
				assetsFailed: 0,
			};

			const result = calculateUploadStats( stats );

			expect( result.successRate ).toBe( 100 );
			expect( result.urlSuccessRate ).toBe( 100 );
			expect( result.assetSuccessRate ).toBe( 100 );
		} );

		test( 'should handle total failure', () => {
			const stats = {
				urlsSucceeded: 0,
				urlsFailed: 10,
				assetsSucceeded: 0,
				assetsFailed: 50,
			};

			const result = calculateUploadStats( stats );

			expect( result.successRate ).toBe( 0 );
			expect( result.urlSuccessRate ).toBe( 0 );
			expect( result.assetSuccessRate ).toBe( 0 );
		} );

		test( 'should handle no files', () => {
			const stats = {
				urlsSucceeded: 0,
				urlsFailed: 0,
				assetsSucceeded: 0,
				assetsFailed: 0,
			};

			const result = calculateUploadStats( stats );

			expect( result.totalFiles ).toBe( 0 );
			expect( result.successRate ).toBe( 100 ); // No files = 100% success
			expect( result.urlSuccessRate ).toBe( 100 );
			expect( result.assetSuccessRate ).toBe( 100 );
		} );

		test( 'should handle missing stats object', () => {
			const result = calculateUploadStats( null );

			expect( result.totalFiles ).toBe( 0 );
			expect( result.successRate ).toBe( 100 );
		} );

		test( 'should handle partial stats', () => {
			const stats = {
				urlsSucceeded: 5,
				// urlsFailed missing
				assetsSucceeded: 20,
				// assetsFailed missing
			};

			const result = calculateUploadStats( stats );

			expect( result.totalUrls ).toBe( 5 );
			expect( result.totalAssets ).toBe( 20 );
			expect( result.totalFiles ).toBe( 25 );
		} );

		test( 'should round success rates', () => {
			const stats = {
				urlsSucceeded: 1,
				urlsFailed: 2, // 33.33% success
				assetsSucceeded: 0,
				assetsFailed: 0,
			};

			const result = calculateUploadStats( stats );

			expect( result.urlSuccessRate ).toBe( 33 ); // Rounded from 33.33
		} );
	} );

	describe( 'isUploadSuccessful()', () => {
		test( 'should return true when above threshold', () => {
			const result = isUploadSuccessful( 90, 100, 80 );
			expect( result ).toBe( true );
		} );

		test( 'should return true when exactly at threshold', () => {
			const result = isUploadSuccessful( 80, 100, 80 );
			expect( result ).toBe( true );
		} );

		test( 'should return false when below threshold', () => {
			const result = isUploadSuccessful( 75, 100, 80 );
			expect( result ).toBe( false );
		} );

		test( 'should use default threshold of 80%', () => {
			const result1 = isUploadSuccessful( 85, 100 );
			const result2 = isUploadSuccessful( 75, 100 );

			expect( result1 ).toBe( true );
			expect( result2 ).toBe( false );
		} );

		test( 'should return true when total is 0', () => {
			const result = isUploadSuccessful( 0, 0, 80 );
			expect( result ).toBe( true );
		} );

		test( 'should handle 100% success threshold', () => {
			const result1 = isUploadSuccessful( 100, 100, 100 );
			const result2 = isUploadSuccessful( 99, 100, 100 );

			expect( result1 ).toBe( true );
			expect( result2 ).toBe( false );
		} );

		test( 'should handle 0% threshold', () => {
			const result = isUploadSuccessful( 1, 100, 0 );
			expect( result ).toBe( true );
		} );

		test( 'should clamp threshold to 0-100 range', () => {
			const result1 = isUploadSuccessful( 50, 100, 150 );
			const result2 = isUploadSuccessful( 50, 100, -50 );

			expect( result1 ).toBe( false ); // 150 clamped to 100
			expect( result2 ).toBe( true ); // -50 clamped to 0
		} );
	} );

	describe( 'calculateUploadSpeed()', () => {
		test( 'should calculate bytes per second', () => {
			const result = calculateUploadSpeed( 1000000, 1000 ); // 1MB in 1 second
			expect( result ).toBe( 1000000 );
		} );

		test( 'should handle fractional seconds', () => {
			const result = calculateUploadSpeed( 500000, 500 ); // 500KB in 0.5 seconds
			expect( result ).toBe( 1000000 ); // 1MB/s
		} );

		test( 'should return 0 when time is 0', () => {
			const result = calculateUploadSpeed( 1000000, 0 );
			expect( result ).toBe( 0 );
		} );

		test( 'should return 0 when bytes is 0', () => {
			const result = calculateUploadSpeed( 0, 1000 );
			expect( result ).toBe( 0 );
		} );

		test( 'should handle negative time', () => {
			const result = calculateUploadSpeed( 1000000, -1000 );
			expect( result ).toBe( 0 ); // Negative time returns 0 (cannot calculate)
		} );

		test( 'should round to nearest integer', () => {
			const result = calculateUploadSpeed( 1000, 3 );
			expect( result ).toBe( 333333 ); // 333333.33... rounded
		} );
	} );

	describe( 'estimateRemainingTime()', () => {
		test( 'should calculate remaining seconds', () => {
			const result = estimateRemainingTime( 1000000, 100000 ); // 1MB at 100KB/s
			expect( result ).toBe( 10 ); // 10 seconds
		} );

		test( 'should round up to nearest second', () => {
			const result = estimateRemainingTime( 1500, 1000 ); // 1.5 seconds
			expect( result ).toBe( 2 ); // Rounded up
		} );

		test( 'should return 0 when speed is 0', () => {
			const result = estimateRemainingTime( 1000000, 0 );
			expect( result ).toBe( 0 );
		} );

		test( 'should return 0 when no bytes remaining', () => {
			const result = estimateRemainingTime( 0, 100000 );
			expect( result ).toBe( 0 );
		} );

		test( 'should handle very slow speeds', () => {
			const result = estimateRemainingTime( 1000000, 1 ); // 1MB at 1 byte/s
			expect( result ).toBe( 1000000 ); // 1 million seconds
		} );

		test( 'should handle negative speed', () => {
			const result = estimateRemainingTime( 1000000, -100000 );
			expect( result ).toBe( 0 ); // Negative speed returns 0 (cannot estimate)
		} );
	} );

	describe( 'Integration', () => {
		test( 'should work together for complete upload tracking', () => {
			// Calculate total files
			const totalFiles = calculateTotalFiles( 10, 50, 1 );
			expect( totalFiles ).toBe( 61 );

			// Calculate progress
			const progress = calculateUploadProgress( 30, totalFiles );
			expect( progress ).toBe( 49 ); // 30/61 * 100 = 49.18%

			// Calculate stats
			const stats = calculateUploadStats( {
				urlsSucceeded: 8,
				urlsFailed: 2,
				assetsSucceeded: 18,
				assetsFailed: 2,
			} );
			expect( stats.totalSucceeded ).toBe( 26 );

			// Check if successful
			const isSuccessful = isUploadSuccessful(
				stats.totalSucceeded,
				stats.totalFiles,
				80
			);
			expect( isSuccessful ).toBe( true ); // 26/30 = 86.67%
		} );

		test( 'should work for multi-stage uploads', () => {
			// Stage 1: 33% complete
			const stage1 = calculateMultiStageProgress( 0, 3, 100 );
			expect( stage1 ).toBe( 33 );

			// Stage 2: 67% complete
			const stage2 = calculateMultiStageProgress( 1, 3, 100 );
			expect( stage2 ).toBe( 67 );

			// Stage 3: 100% complete
			const stage3 = calculateMultiStageProgress( 2, 3, 100 );
			expect( stage3 ).toBe( 100 );
		} );
	} );
} );
