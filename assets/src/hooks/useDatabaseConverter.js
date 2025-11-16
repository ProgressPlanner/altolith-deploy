/**
 * useDatabaseConverter hook
 *
 * Orchestrates MySQL→SQLite database conversion via AJAX calls.
 * Handles analysis, chunked conversion with progress tracking, and finalization.
 *
 * @package AetherSiteExporter
 */

import { useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Custom hook for database conversion.
 *
 * @param {string} jobId - Export job ID.
 * @return {Object} Hook state and methods.
 */
const useDatabaseConverter = ( jobId ) => {
	const [ isConverting, setIsConverting ] = useState( false );
	const [ isAnalyzing, setIsAnalyzing ] = useState( false );
	const [ progress, setProgress ] = useState( 0 );
	const [ analysis, setAnalysis ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ isComplete, setIsComplete ] = useState( false );

	/**
	 * Analyze the database to determine size and chunk count.
	 */
	const analyzeDatabase = useCallback( async () => {
		setIsAnalyzing( true );
		setError( null );

		try {
			const response = await apiFetch( {
				path: `/aether-site-exporter/v1/export/${ jobId }/analyze-database`,
				method: 'POST',
			} );

			if ( response.success ) {
				setAnalysis( response.data );
			} else {
				setError( response.error || 'Failed to analyze database' );
			}
		} catch ( err ) {
			setError( err.message || 'Network error' );
		} finally {
			setIsAnalyzing( false );
		}
	}, [ jobId ] );

	/**
	 * Convert database in chunks.
	 */
	const convertDatabase = useCallback( async () => {
		if ( ! analysis ) {
			setError( 'Database must be analyzed before conversion' );
			return;
		}

		setIsConverting( true );
		setError( null );
		setProgress( 0 );

		let chunkIndex = 0;
		let complete = false;

		try {
			// Convert chunks until complete
			while ( ! complete ) {
				const chunkResponse = await apiFetch( {
					path: `/aether-site-exporter/v1/export/${ jobId }/convert-chunk`,
					method: 'POST',
					data: { chunkIndex },
				} );

				if ( ! chunkResponse.success ) {
					setError(
						chunkResponse.error || 'Failed to convert chunk'
					);
					setIsConverting( false );
					return;
				}

				// Update progress
				const chunkData = chunkResponse.data;
				complete = chunkData.complete;
				setProgress( chunkData.progress || 0 );

				chunkIndex++;
			}

			// Finalize database (create indexes, VACUUM)
			const finalizeResponse = await apiFetch( {
				path: `/aether-site-exporter/v1/export/${ jobId }/finalize-database`,
				method: 'POST',
			} );

			if ( ! finalizeResponse.success ) {
				setError(
					finalizeResponse.error || 'Failed to finalize database'
				);
				setIsConverting( false );
				return;
			}

			setIsComplete( true );
			setProgress( 100 );
		} catch ( err ) {
			setError( err.message || 'Conversion failed' );
		} finally {
			setIsConverting( false );
		}
	}, [ jobId, analysis ] );

	/**
	 * Reset hook state.
	 */
	const reset = useCallback( () => {
		setIsConverting( false );
		setIsAnalyzing( false );
		setProgress( 0 );
		setAnalysis( null );
		setError( null );
		setIsComplete( false );
	}, [] );

	/**
	 * Format bytes to human-readable string.
	 *
	 * @param {number} bytes - Number of bytes.
	 * @return {string} Formatted string.
	 */
	const formatBytes = useCallback( ( bytes ) => {
		if ( bytes === 0 ) {
			return '0 bytes';
		}
		if ( bytes < 1024 ) {
			return `${ bytes } bytes`;
		}

		const k = 1024;
		const sizes = [ 'bytes', 'KB', 'MB', 'GB', 'TB' ];
		const i = Math.floor( Math.log( bytes ) / Math.log( k ) );

		return `${ parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( 2 ) ) } ${ sizes[ i ] }`;
	}, [] );

	return {
		// State
		isConverting,
		isAnalyzing,
		progress,
		analysis,
		error,
		isComplete,

		// Methods
		analyzeDatabase,
		convertDatabase,
		reset,
		formatBytes,
	};
};

export default useDatabaseConverter;
