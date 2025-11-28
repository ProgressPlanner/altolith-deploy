/**
 * File Upload Manager Tests
 *
 * Comprehensive tests for fileUploadManager - handles upload with hash-based deduplication,
 * retry logic, progress tracking, and concurrency limiting.
 *
 * Quality Standards:
 * - Tests must catch upload failures and data loss scenarios
 * - Must test hash-based deduplication to prevent unnecessary uploads
 * - Must test retry logic and error handling
 * - Must test concurrency limiting to prevent resource exhaustion
 * - Must fail if implementation allows ANY data corruption or upload failures
 *
 */

import {
	uploadFilesWithProgress,
	sanitizeKeyForStatus,
} from '../fileUploadManager';
import { calculateFileHash } from '@altolith/utils/fileHash';
import { shouldSkipUpload } from '@altolith/utils/manifestManager';
import { formatFileSize } from '../helpers';
import { errorHandler } from '../errorHandler';

// Mock dependencies
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		return format
			.replace( /%\d\$s/g, () => args.shift() )
			.replace( /%s/g, () => args.shift() );
	},
} ) );

jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	applyFilters: jest.fn( ( hook, defaultValue ) => defaultValue ),
} ) );

jest.mock( '@altolith/utils/concurrencyLimiter', () => ( {
	createConcurrencyLimiter: jest.fn( ( limit ) => {
		// Simple mock that doesn't limit concurrency for testing
		return ( fn ) => fn();
	} ),
} ) );

jest.mock( '@altolith/utils/fileHash', () => ( {
	calculateFileHash: jest.fn(),
} ) );

jest.mock( '@altolith/utils/manifestManager', () => ( {
	shouldSkipUpload: jest.fn(),
} ) );

jest.mock( '../helpers', () => ( {
	formatFileSize: jest.fn( ( size ) => `${ size } bytes` ),
} ) );

jest.mock( '../errorHandler', () => ( {
	errorHandler: {
		executeWithRetry: jest.fn(),
		formatMessage: jest.fn( ( error ) => error.message ),
	},
} ) );

describe( 'fileUploadManager', () => {
	// ========================================================================
	// sanitizeKeyForStatus() Tests
	// ========================================================================

	describe( 'sanitizeKeyForStatus', () => {
		/**
		 * Test sanitization of storage keys for status messages.
		 *
		 * Purpose: Verify special characters are replaced with dashes
		 * Reason: Status keys must be safe for object property names
		 */
		it( 'should replace special characters with dashes', () => {
			expect( sanitizeKeyForStatus( 'file/path/to/file.jpg' ) ).toBe(
				'file-path-to-file-jpg'
			);
			expect( sanitizeKeyForStatus( 'file@#$%.txt' ) ).toBe(
				'file-----txt'
			);
			expect( sanitizeKeyForStatus( 'file name with spaces.txt' ) ).toBe(
				'file-name-with-spaces-txt'
			);
		} );

		/**
		 * Test sanitization preserves alphanumeric and allowed characters.
		 *
		 * Purpose: Verify valid characters are kept
		 */
		it( 'should preserve alphanumeric characters, dashes, and underscores', () => {
			expect( sanitizeKeyForStatus( 'file_name-123.txt' ) ).toBe(
				'file_name-123-txt'
			);
			expect( sanitizeKeyForStatus( 'ABC-def_123' ) ).toBe(
				'ABC-def_123'
			);
		} );

		/**
		 * Test sanitization of empty string.
		 *
		 * Purpose: Verify edge case handling
		 * Edge Case: Empty key
		 */
		it( 'should handle empty string', () => {
			expect( sanitizeKeyForStatus( '' ) ).toBe( '' );
		} );
	} );

	// ========================================================================
	// uploadFilesWithProgress() Tests - Happy Path
	// ========================================================================

	describe( 'uploadFilesWithProgress - Happy Path', () => {
		let mockStorageService;
		let mockSetStatusMessage;

		beforeEach( () => {
			mockStorageService = {
				upload: jest.fn().mockResolvedValue( {
					success: true,
					url: 'https://example.com/file.jpg',
				} ),
			};

			mockSetStatusMessage = jest.fn();

			// Mock errorHandler to call the function directly (no retry)
			errorHandler.executeWithRetry.mockImplementation( async ( fn ) => {
				return await fn();
			} );

			// Clear all mocks
			jest.clearAllMocks();
		} );

		/**
		 * Test successful upload of single file.
		 *
		 * Purpose: Verify basic upload workflow
		 */
		it( 'should upload a single file successfully', async () => {
			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test content' ] ),
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.success ).toBe( true );
			expect( result.uploaded ).toBe( 1 );
			expect( result.skipped ).toBe( 0 );
			expect( result.failed ).toBe( 0 );
			expect( result.results ).toHaveLength( 1 );
			expect( result.results[ 0 ].success ).toBe( true );
			expect( result.results[ 0 ].url ).toBe(
				'https://example.com/file.jpg'
			);
			expect( mockStorageService.upload ).toHaveBeenCalledTimes( 1 );
		} );

		/**
		 * Test upload of multiple files.
		 *
		 * Purpose: Verify batch upload handling
		 */
		it( 'should upload multiple files successfully', async () => {
			const files = [
				{
					key: 'file1.jpg',
					blob: new Blob( [ 'content1' ] ),
					contentType: 'image/jpeg',
					displayName: 'file1.jpg',
				},
				{
					key: 'file2.jpg',
					blob: new Blob( [ 'content2' ] ),
					contentType: 'image/jpeg',
					displayName: 'file2.jpg',
				},
				{
					key: 'file3.jpg',
					blob: new Blob( [ 'content3' ] ),
					contentType: 'image/jpeg',
					displayName: 'file3.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.uploaded ).toBe( 3 );
			expect( result.results ).toHaveLength( 3 );
			expect( mockStorageService.upload ).toHaveBeenCalledTimes( 3 );
		} );

		/**
		 * Test upload with empty file list.
		 *
		 * Purpose: Verify edge case handling
		 * Edge Case: No files to upload
		 */
		it( 'should handle empty file list', async () => {
			const result = await uploadFilesWithProgress( {
				files: [],
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.success ).toBe( true );
			expect( result.uploaded ).toBe( 0 );
			expect( result.skipped ).toBe( 0 );
			expect( result.failed ).toBe( 0 );
			expect( result.results ).toHaveLength( 0 );
			expect( mockStorageService.upload ).not.toHaveBeenCalled();
		} );

		/**
		 * Test upload calls progress callback.
		 *
		 * Purpose: Verify progress tracking works
		 */
		it( 'should call onProgress callback', async () => {
			const onProgress = jest.fn();
			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
				onProgress,
			} );

			expect( onProgress ).toHaveBeenCalledWith( 1, 1, null );
		} );

		/**
		 * Test upload sets status messages.
		 *
		 * Purpose: Verify UI feedback works
		 */
		it( 'should set status messages during upload', async () => {
			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'Test Image',
				},
			];

			await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should set uploading message and success message
			expect( mockSetStatusMessage ).toHaveBeenCalled();
			const calls = mockSetStatusMessage.mock.calls;
			expect(
				calls.some( ( call ) => call[ 0 ].includes( 'Uploading' ) )
			).toBe( true );
			expect(
				calls.some( ( call ) => call[ 0 ].includes( 'Uploaded' ) )
			).toBe( true );
		} );

		/**
		 * Test upload uses default displayName if not provided.
		 *
		 * Purpose: Verify fallback display name
		 * Edge Case: Missing displayName
		 */
		it( 'should use key as displayName if not provided', async () => {
			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					// No displayName provided
				},
			];

			await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should use key as displayName
			const calls = mockSetStatusMessage.mock.calls;
			expect( calls[ 0 ][ 0 ] ).toContain( 'test.jpg' );
		} );
	} );

	// ========================================================================
	// Hash-Based Deduplication Tests
	// ========================================================================

	describe( 'uploadFilesWithProgress - Hash-Based Deduplication', () => {
		let mockStorageService;
		let mockSetStatusMessage;

		beforeEach( () => {
			mockStorageService = {
				upload: jest.fn().mockResolvedValue( {
					success: true,
					url: 'https://example.com/file.jpg',
				} ),
			};

			mockSetStatusMessage = jest.fn();

			errorHandler.executeWithRetry.mockImplementation( async ( fn ) => {
				return await fn();
			} );

			jest.clearAllMocks();
		} );

		/**
		 * Test upload skips unchanged files.
		 *
		 * Purpose: Verify hash-based deduplication works
		 * Reason: Prevents unnecessary uploads, saves bandwidth and time
		 */
		it( 'should skip files with matching size and hash', async () => {
			const blob = new Blob( [ 'test content' ] );
			const fileHash = 'abc123hash';

			calculateFileHash.mockResolvedValue( fileHash );
			shouldSkipUpload.mockReturnValue( true );

			const manifest = {
				'test.jpg': {
					size: blob.size,
					hash: fileHash,
				},
			};

			const files = [
				{
					key: 'test.jpg',
					blob,
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
				manifest,
			} );

			expect( result.uploaded ).toBe( 0 );
			expect( result.skipped ).toBe( 1 );
			expect( result.failed ).toBe( 0 );
			expect( result.results[ 0 ].skipped ).toBe( true );
			expect( mockStorageService.upload ).not.toHaveBeenCalled();
		} );

		/**
		 * Test upload proceeds when hash doesn't match.
		 *
		 * Purpose: Verify upload happens when file changed
		 * Reason: Modified files must be uploaded
		 */
		it( 'should upload files when hash does not match', async () => {
			const blob = new Blob( [ 'new content' ] );
			const newHash = 'xyz789hash';

			calculateFileHash.mockResolvedValue( newHash );
			shouldSkipUpload.mockReturnValue( false );

			const manifest = {
				'test.jpg': {
					size: blob.size,
					hash: 'old-different-hash',
				},
			};

			const files = [
				{
					key: 'test.jpg',
					blob,
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
				manifest,
			} );

			expect( result.uploaded ).toBe( 1 );
			expect( result.skipped ).toBe( 0 );
			expect( mockStorageService.upload ).toHaveBeenCalledTimes( 1 );
		} );

		/**
		 * Test upload skips hash check when disabled.
		 *
		 * Purpose: Verify hash check can be disabled
		 * Edge Case: Force upload all files
		 */
		it( 'should skip hash check when skipHashCheck is true', async () => {
			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const manifest = {
				'test.jpg': {
					size: 4,
					hash: 'some-hash',
				},
			};

			await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
				manifest,
				skipHashCheck: true,
			} );

			expect( calculateFileHash ).not.toHaveBeenCalled();
			expect( mockStorageService.upload ).toHaveBeenCalled();
		} );

		/**
		 * Test upload continues if hash calculation fails.
		 *
		 * Purpose: Verify error handling in hash calculation
		 * Edge Case: Hash calculation error
		 */
		it( 'should continue upload if hash calculation fails', async () => {
			calculateFileHash.mockRejectedValue(
				new Error( 'Hash calculation failed' )
			);

			const manifest = {
				'test.jpg': {
					size: 4,
					hash: 'some-hash',
				},
			};

			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
				manifest,
			} );

			// Should proceed with upload despite hash error
			expect( result.uploaded ).toBe( 1 );
			expect( mockStorageService.upload ).toHaveBeenCalled();
		} );
	} );

	// ========================================================================
	// Retry Logic Tests
	// ========================================================================

	describe( 'uploadFilesWithProgress - Retry Logic', () => {
		let mockStorageService;
		let mockSetStatusMessage;

		beforeEach( () => {
			jest.clearAllMocks();

			mockStorageService = {
				upload: jest.fn(),
			};

			mockSetStatusMessage = jest.fn();
		} );

		/**
		 * Test upload retries on failure.
		 *
		 * Purpose: Verify retry mechanism works
		 * Reason: Transient network errors should be retried
		 */
		it( 'should retry failed uploads', async () => {
			let uploadCallCount = 0;

			// Mock storageService.upload to fail twice, then succeed
			mockStorageService.upload.mockImplementation( async () => {
				uploadCallCount++;
				if ( uploadCallCount < 3 ) {
					throw new Error( 'Network error' );
				}
				return {
					success: true,
					url: 'https://example.com/file.jpg',
				};
			} );

			// Mock executeWithRetry to actually implement retry logic
			errorHandler.executeWithRetry.mockReset();
			errorHandler.executeWithRetry.mockImplementation(
				async ( fn, options ) => {
					const maxRetries = 3;
					let lastError;

					for ( let attempt = 1; attempt <= maxRetries; attempt++ ) {
						try {
							return await fn();
						} catch ( error ) {
							lastError = error;
							if ( attempt < maxRetries && options?.onRetry ) {
								options.onRetry( error, attempt );
							}
						}
					}

					throw lastError;
				}
			);

			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.uploaded ).toBe( 1 );
			expect( result.failed ).toBe( 0 );
			expect( uploadCallCount ).toBe( 3 ); // Verify it retried
		} );

		it( 'should fail after max retries', async () => {
			errorHandler.executeWithRetry.mockRejectedValue(
				new Error( 'Persistent error' )
			);

			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.uploaded ).toBe( 0 );
			expect( result.failed ).toBe( 1 );
			expect( result.results[ 0 ].success ).toBe( false );
			expect( result.results[ 0 ].error ).toBeDefined();
		} );

		/**
		 * Test retry status messages.
		 *
		 * Purpose: Verify retry feedback to user
		 */
		it( 'should show retry status messages', async () => {
			errorHandler.executeWithRetry.mockImplementation(
				async ( fn, options ) => {
					// Simulate retry
					if ( options?.onRetry ) {
						options.onRetry( new Error( 'Network error' ), 2 );
					}
					throw new Error( 'Failed after retries' );
				}
			);

			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'Test File',
				},
			];

			await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should set retry message
			const calls = mockSetStatusMessage.mock.calls;
			expect(
				calls.some( ( call ) => call[ 0 ].includes( 'Retrying' ) )
			).toBe( true );
		} );
	} );

	// ========================================================================
	// Error Handling Tests
	// ========================================================================

	describe( 'uploadFilesWithProgress - Error Handling', () => {
		let mockStorageService;
		let mockSetStatusMessage;

		beforeEach( () => {
			mockStorageService = {
				upload: jest.fn(),
			};

			mockSetStatusMessage = jest.fn();

			errorHandler.executeWithRetry.mockImplementation( async ( fn ) => {
				return await fn();
			} );

			jest.clearAllMocks();
		} );

		/**
		 * Test upload handles storage service errors.
		 *
		 * Purpose: Verify error handling for upload failures
		 */
		it( 'should handle storage service errors', async () => {
			mockStorageService.upload.mockResolvedValue( {
				success: false,
				error: 'Storage quota exceeded',
			} );

			errorHandler.executeWithRetry.mockImplementation( async ( fn ) => {
				const result = await fn();
				if ( ! result.success ) {
					throw new Error( result.error );
				}
				return result;
			} );

			errorHandler.executeWithRetry.mockRejectedValue(
				new Error( 'Storage quota exceeded' )
			);

			const files = [
				{
					key: 'test.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'test.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.failed ).toBe( 1 );
			expect( result.results[ 0 ].success ).toBe( false );
		} );

		/**
		 * Test upload handles mixed success and failure.
		 *
		 * Purpose: Verify partial upload handling
		 * Edge Case: Some files succeed, some fail
		 */
		it( 'should handle mixed success and failure', async () => {
			let callCount = 0;

			errorHandler.executeWithRetry.mockImplementation( async ( fn ) => {
				callCount++;
				if ( callCount === 2 ) {
					// Second file fails
					throw new Error( 'Upload failed' );
				}
				return await fn();
			} );

			mockStorageService.upload.mockResolvedValue( {
				success: true,
				url: 'https://example.com/file.jpg',
			} );

			const files = [
				{
					key: 'file1.jpg',
					blob: new Blob( [ 'test1' ] ),
					contentType: 'image/jpeg',
					displayName: 'file1.jpg',
				},
				{
					key: 'file2.jpg',
					blob: new Blob( [ 'test2' ] ),
					contentType: 'image/jpeg',
					displayName: 'file2.jpg',
				},
				{
					key: 'file3.jpg',
					blob: new Blob( [ 'test3' ] ),
					contentType: 'image/jpeg',
					displayName: 'file3.jpg',
				},
			];

			const result = await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.uploaded ).toBe( 2 );
			expect( result.failed ).toBe( 1 );
			expect( result.results ).toHaveLength( 3 );
		} );
	} );

	// ========================================================================
	// Concurrency Tests
	// ========================================================================

	describe( 'uploadFilesWithProgress - Concurrency', () => {
		/**
		 * Test concurrency limiting is applied.
		 *
		 * Purpose: Verify concurrency limiter is used
		 * Reason: Prevents resource exhaustion from parallel uploads
		 */
		it( 'should apply concurrency limiting', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( {
					success: true,
					url: 'https://example.com/file.jpg',
				} ),
			};

			const files = [
				{
					key: 'file1.jpg',
					blob: new Blob( [ 'test' ] ),
					contentType: 'image/jpeg',
					displayName: 'file1.jpg',
				},
			];

			await uploadFilesWithProgress( {
				files,
				storageService: mockStorageService,
				setStatusMessage: jest.fn(),
				concurrency: 3,
			} );

			// Concurrency limiter should have been called
			const {
				createConcurrencyLimiter,
			} = require( '@altolith/utils/concurrencyLimiter' );
			expect( createConcurrencyLimiter ).toHaveBeenCalledWith( 3 );
		} );
	} );
} );
