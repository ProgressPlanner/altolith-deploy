/**
 * Tests for useDatabaseConverter hook
 *
 * Following TDD principles - these tests define the INTENDED functionality.
 * The hook orchestrates MySQL→SQLite database conversion via AJAX calls.
 *
 * @package AetherSiteExporter\Tests\JS
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useDatabaseConverter from './useDatabaseConverter';

// Mock @wordpress/api-fetch
jest.mock( '@wordpress/api-fetch' );

describe( 'useDatabaseConverter', () => {
	const mockJobId = 'export_1234567890_abcdefgh';
	const mockAnalysis = {
		totalSize: 10485760, // 10MB
		totalRows: 1000,
		tables: [
			{ name: 'wp_posts', rows: 500, size: 5242880 },
			{ name: 'wp_options', rows: 500, size: 5242880 },
		],
	};

	beforeEach( () => {
		apiFetch.mockClear();
		jest.clearAllMocks();
	} );

	/**
	 * Test: Hook should initialize with default state.
	 */
	test( 'should initialize with default state', () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		expect( result.current.isConverting ).toBe( false );
		expect( result.current.isAnalyzing ).toBe( false );
		expect( result.current.progress ).toBe( 0 );
		expect( result.current.analysis ).toBeNull();
		expect( result.current.error ).toBeNull();
		expect( result.current.isComplete ).toBe( false );
	} );

	/**
	 * Test: analyzeDatabase should call REST endpoint and store analysis.
	 */
	test( 'should analyze database and store results', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			data: mockAnalysis,
			message: 'Database analyzed',
		} );

		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		await act( async () => {
			await result.current.analyzeDatabase();
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: `/aether-site-exporter/v1/export/${ mockJobId }/analyze-database`,
			method: 'POST',
		} );

		expect( result.current.analysis ).toEqual( mockAnalysis );
		expect( result.current.isAnalyzing ).toBe( false );
		expect( result.current.error ).toBeNull();
	} );

	/**
	 * Test: analyzeDatabase should set isAnalyzing flag during request.
	 */
	test( 'should set isAnalyzing flag during analysis', async () => {
		let resolveAnalysis;
		apiFetch.mockReturnValue(
			new Promise( ( resolve ) => {
				resolveAnalysis = resolve;
			} )
		);

		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		act( () => {
			result.current.analyzeDatabase();
		} );

		// Should be analyzing
		expect( result.current.isAnalyzing ).toBe( true );

		await act( async () => {
			resolveAnalysis( {
				success: true,
				data: mockAnalysis,
			} );
		} );

		// Should no longer be analyzing
		expect( result.current.isAnalyzing ).toBe( false );
	} );

	/**
	 * Test: analyzeDatabase should handle errors.
	 */
	test( 'should handle analyze database errors', async () => {
		const errorMessage = 'Database connection failed';
		apiFetch.mockResolvedValueOnce( {
			success: false,
			error: errorMessage,
		} );

		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		await act( async () => {
			await result.current.analyzeDatabase();
		} );

		expect( result.current.error ).toBe( errorMessage );
		expect( result.current.isAnalyzing ).toBe( false );
		expect( result.current.analysis ).toBeNull();
	} );

	/**
	 * Test: convertDatabase should process chunks sequentially.
	 */
	test( 'should convert database in chunks with progress updates', async () => {
		// Setup: Mock analysis first
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );
		result.current.analysis = mockAnalysis;

		// Mock convert-chunk responses
		apiFetch
			.mockResolvedValueOnce( {
				success: true,
				data: {
					complete: false,
					bytesConverted: 5242880, // 5MB (50%)
					currentTableIndex: 0,
					currentOffset: 500,
					progress: 50,
				},
			} )
			.mockResolvedValueOnce( {
				success: true,
				data: {
					complete: true,
					bytesConverted: 10485760, // 10MB (100%)
					currentTableIndex: 1,
					currentOffset: 500,
					progress: 100,
				},
			} )
			.mockResolvedValueOnce( {
				success: true,
				data: {
					success: true,
					finalSize: 10485760,
				},
			} );

		await act( async () => {
			await result.current.convertDatabase();
		} );

		// Should have called convert-chunk twice
		expect( apiFetch ).toHaveBeenCalledTimes( 3 );
		expect( apiFetch ).toHaveBeenNthCalledWith( 1, {
			path: `/aether-site-exporter/v1/export/${ mockJobId }/convert-chunk`,
			method: 'POST',
			data: { chunkIndex: 0 },
		} );
		expect( apiFetch ).toHaveBeenNthCalledWith( 2, {
			path: `/aether-site-exporter/v1/export/${ mockJobId }/convert-chunk`,
			method: 'POST',
			data: { chunkIndex: 1 },
		} );

		// Should have called finalize-database
		expect( apiFetch ).toHaveBeenNthCalledWith( 3, {
			path: `/aether-site-exporter/v1/export/${ mockJobId }/finalize-database`,
			method: 'POST',
		} );

		expect( result.current.isComplete ).toBe( true );
		expect( result.current.isConverting ).toBe( false );
		expect( result.current.progress ).toBe( 100 );
	} );

	/**
	 * Test: convertDatabase should update progress during conversion.
	 */
	test( 'should update progress as chunks are converted', async () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );
		result.current.analysis = mockAnalysis;

		apiFetch
			.mockResolvedValueOnce( {
				success: true,
				data: {
					complete: false,
					progress: 25,
					bytesConverted: 2621440, // 2.5MB
				},
			} )
			.mockResolvedValueOnce( {
				success: true,
				data: {
					complete: false,
					progress: 50,
					bytesConverted: 5242880, // 5MB
				},
			} )
			.mockResolvedValueOnce( {
				success: true,
				data: {
					complete: false,
					progress: 75,
					bytesConverted: 7864320, // 7.5MB
				},
			} )
			.mockResolvedValueOnce( {
				success: true,
				data: {
					complete: true,
					progress: 100,
					bytesConverted: 10485760, // 10MB
				},
			} )
			.mockResolvedValueOnce( {
				success: true,
				data: { success: true },
			} );

		await act( async () => {
			await result.current.convertDatabase();
		} );

		// Final progress should be 100%
		expect( result.current.progress ).toBe( 100 );
		expect( result.current.isComplete ).toBe( true );
	} );

	/**
	 * Test: convertDatabase should handle chunk conversion errors.
	 */
	test( 'should handle chunk conversion errors', async () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );
		result.current.analysis = mockAnalysis;

		const errorMessage = 'Failed to convert chunk';
		apiFetch.mockResolvedValueOnce( {
			success: false,
			error: errorMessage,
		} );

		await act( async () => {
			await result.current.convertDatabase();
		} );

		expect( result.current.error ).toBe( errorMessage );
		expect( result.current.isConverting ).toBe( false );
		expect( result.current.isComplete ).toBe( false );
	} );

	/**
	 * Test: convertDatabase should handle finalize errors.
	 */
	test( 'should handle finalize database errors', async () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );
		result.current.analysis = mockAnalysis;

		apiFetch
			.mockResolvedValueOnce( {
				success: true,
				data: {
					complete: true,
					progress: 100,
					bytesConverted: 10485760,
				},
			} )
			.mockResolvedValueOnce( {
				success: false,
				error: 'Failed to create indexes',
			} );

		await act( async () => {
			await result.current.convertDatabase();
		} );

		expect( result.current.error ).toBe( 'Failed to create indexes' );
		expect( result.current.isConverting ).toBe( false );
	} );

	/**
	 * Test: convertDatabase should require analysis first.
	 */
	test( 'should not convert without analysis', async () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		await act( async () => {
			await result.current.convertDatabase();
		} );

		expect( result.current.error ).toBe(
			'Database must be analyzed before conversion'
		);
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	/**
	 * Test: reset should clear all state.
	 */
	test( 'should reset all state', () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		// Set some state
		act( () => {
			result.current.analysis = mockAnalysis;
			result.current.progress = 50;
			result.current.error = 'Some error';
			result.current.isComplete = true;
		} );

		// Reset
		act( () => {
			result.current.reset();
		} );

		expect( result.current.isConverting ).toBe( false );
		expect( result.current.isAnalyzing ).toBe( false );
		expect( result.current.progress ).toBe( 0 );
		expect( result.current.analysis ).toBeNull();
		expect( result.current.error ).toBeNull();
		expect( result.current.isComplete ).toBe( false );
	} );

	/**
	 * Test: Should handle network errors gracefully.
	 */
	test( 'should handle network errors', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		await act( async () => {
			await result.current.analyzeDatabase();
		} );

		expect( result.current.error ).toBe( 'Network error' );
		expect( result.current.isAnalyzing ).toBe( false );
	} );

	/**
	 * Test: convertDatabase should set isConverting flag during conversion.
	 */
	test( 'should set isConverting flag during conversion', async () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );
		result.current.analysis = mockAnalysis;

		let resolveChunk;
		apiFetch.mockReturnValue(
			new Promise( ( resolve ) => {
				resolveChunk = resolve;
			} )
		);

		act( () => {
			result.current.convertDatabase();
		} );

		// Should be converting
		expect( result.current.isConverting ).toBe( true );

		await act( async () => {
			resolveChunk( {
				success: true,
				data: {
					complete: true,
					progress: 100,
					bytesConverted: 10485760,
				},
			} );
			// Wait for finalize
			apiFetch.mockResolvedValueOnce( {
				success: true,
				data: { success: true },
			} );
		} );

		await waitFor( () => {
			expect( result.current.isConverting ).toBe( false );
		} );
	} );

	/**
	 * Test: Should expose formatBytes utility function.
	 */
	test( 'should provide formatBytes utility', () => {
		const { result } = renderHook( () => useDatabaseConverter( mockJobId ) );

		expect( result.current.formatBytes( 1024 ) ).toBe( '1.00 KB' );
		expect( result.current.formatBytes( 1048576 ) ).toBe( '1.00 MB' );
		expect( result.current.formatBytes( 1073741824 ) ).toBe( '1.00 GB' );
		expect( result.current.formatBytes( 500 ) ).toBe( '500 bytes' );
	} );
} );
