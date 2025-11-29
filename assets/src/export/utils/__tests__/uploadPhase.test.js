/**
 * Upload Phase Tests
 *
 * Tests for uploadPhase - Phase 2 of static site generation.
 * Handles file upload with manifest management and asset processing.
 *
 * Quality Standards:
 * - Tests must catch manifest corruption and upload failures
 * - Must test asset processing and deduplication
 * - Must test error handling and recovery
 * - Must fail if implementation loses data or corrupts state
 *
 */

import { prepareManifest, processAssets } from '../uploadPhase';
import { fetchManifest } from '@altolith/utils/manifestManager';
import { calculateFileHash } from '@altolith/utils/fileHash';
import { shouldStoreInMemory } from '../fileTypeUtils';

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => format.replace( /%d/g, () => args.shift() ),
} ) );

jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, defaultValue ) => defaultValue ),
} ) );

jest.mock( '@altolith/utils/manifestManager', () => ( {
	fetchManifest: jest.fn(),
	updateManifestEntry: jest.fn(),
	shouldSkipUpload: jest.fn(),
	uploadManifest: jest.fn(),
	cleanupManifest: jest.fn(),
} ) );

jest.mock( '@altolith/utils/fileHash', () => ( {
	calculateFileHash: jest.fn(),
} ) );

jest.mock( '../htmlProcessor', () => ( {
	processHtml: jest.fn(),
	getStaticFilePath: jest.fn(),
} ) );

jest.mock( '../assetExtractor', () => ( {
	getAssetLocalPath: jest.fn(),
} ) );

jest.mock( '../fileUploadManager', () => ( {
	uploadFilesWithProgress: jest.fn(),
} ) );

jest.mock( '../fileTypeUtils', () => ( {
	shouldStoreInMemory: jest.fn( ( url ) => {
		// Default behavior: CSS/JS need memory, images don't
		if ( url.endsWith( '.css' ) || url.endsWith( '.js' ) ) {
			return true;
		}
		if (
			url.endsWith( '.jpg' ) ||
			url.endsWith( '.png' ) ||
			url.endsWith( '.gif' )
		) {
			return false;
		}
		return true;
	} ),
} ) );

describe( 'uploadPhase', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'prepareManifest', () => {
		it( 'should fetch and return manifest', async () => {
			const mockManifest = {
				'file1.txt': { hash: 'abc123', size: 100 },
				'file2.txt': { hash: 'def456', size: 200 },
			};

			fetchManifest.mockResolvedValue( mockManifest );

			const mockStorageService = {};
			const mockSetStatusMessage = jest.fn();

			const result = await prepareManifest(
				mockStorageService,
				'test-provider',
				mockSetStatusMessage
			);

			expect( result ).toEqual( mockManifest );
			expect( fetchManifest ).toHaveBeenCalledWith(
				mockStorageService,
				'test-provider'
			);
		} );

		it( 'should handle manifest fetch failure gracefully', async () => {
			fetchManifest.mockRejectedValue( new Error( 'Fetch failed' ) );

			const mockStorageService = {};
			const mockSetStatusMessage = jest.fn();

			const result = await prepareManifest(
				mockStorageService,
				'test-provider',
				mockSetStatusMessage
			);

			expect( result ).toEqual( {} );
		} );

		it( 'should set status messages', async () => {
			const mockManifest = { 'file1.txt': { hash: 'abc', size: 100 } };
			fetchManifest.mockResolvedValue( mockManifest );

			const mockSetStatusMessage = jest.fn();

			await prepareManifest( {}, 'test-provider', mockSetStatusMessage );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Fetching' ),
				'progress',
				'fetchManifest'
			);

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Fetched' ),
				'success',
				'fetchManifest'
			);
		} );
	} );

	describe( 'processAssets', () => {
		let mockAssetTracker;
		let mockStorageService;
		let mockSetStatusMessage;

		beforeEach( () => {
			mockAssetTracker = {
				isUploaded: jest.fn().mockReturnValue( false ),
				markUploaded: jest.fn(),
				markFailed: jest.fn(),
			};

			mockStorageService = {
				upload: jest.fn(),
			};

			mockSetStatusMessage = jest.fn();

			global.fetch = jest.fn();

			// Mock uploadFilesWithProgress to return expected structure
			const {
				uploadFilesWithProgress,
			} = require( '../fileUploadManager' );
			uploadFilesWithProgress.mockResolvedValue( {
				success: true,
				uploaded: 0,
				failed: 0,
				skipped: 0,
				results: [],
			} );
		} );

		it( 'should return early if all assets already processed', async () => {
			mockAssetTracker.isUploaded.mockReturnValue( true );

			const result = await processAssets( {
				assetUrls: [ 'http://example.com/test.jpg' ],
				assetTracker: mockAssetTracker,
				storageService: mockStorageService,
				manifest: {},
				providerId: 'test-provider',
				filesUploaded: 0,
				totalFilesToUpload: 1,
				onProgress: jest.fn(),
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.filesUploaded ).toBe( 0 );
			expect( result.filesSkipped ).toBe( 0 );
			expect( result.uploadedFiles ).toHaveLength( 0 );
			expect( global.fetch ).not.toHaveBeenCalled();
		} );

		it( 'should handle empty asset list', async () => {
			const result = await processAssets( {
				assetUrls: [],
				assetTracker: mockAssetTracker,
				storageService: mockStorageService,
				manifest: {},
				providerId: 'test-provider',
				filesUploaded: 0,
				totalFilesToUpload: 0,
				onProgress: jest.fn(),
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.filesUploaded ).toBe( 0 );
			expect( result.filesSkipped ).toBe( 0 );
		} );

		it( 'should handle fetch failures gracefully', async () => {
			const { getAssetLocalPath } = require( '../assetExtractor' );
			getAssetLocalPath.mockReturnValue( 'assets/test.jpg' );

			global.fetch.mockRejectedValue( new Error( 'Network error' ) );

			const result = await processAssets( {
				assetUrls: [ 'http://example.com/test.jpg' ],
				assetTracker: mockAssetTracker,
				storageService: mockStorageService,
				manifest: {},
				providerId: 'test-provider',
				filesUploaded: 0,
				totalFilesToUpload: 1,
				onProgress: jest.fn(),
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should continue despite error
			expect( result ).toBeDefined();
		} );

		it( 'should call shouldStoreInMemory for each asset', async () => {
			const assetUrls = [
				'http://example.com/style.css',
				'http://example.com/image.jpg',
				'http://example.com/script.js',
			];

			await processAssets( {
				assetUrls,
				assetTracker: mockAssetTracker,
				storageService: mockStorageService,
				manifest: {},
				providerId: 'test-provider',
				filesUploaded: 0,
				totalFilesToUpload: 3,
				onProgress: jest.fn(),
				setStatusMessage: mockSetStatusMessage,
			} );

			// Verify shouldStoreInMemory was called for each URL
			expect( shouldStoreInMemory ).toHaveBeenCalledWith(
				'http://example.com/style.css'
			);
			expect( shouldStoreInMemory ).toHaveBeenCalledWith(
				'http://example.com/image.jpg'
			);
			expect( shouldStoreInMemory ).toHaveBeenCalledWith(
				'http://example.com/script.js'
			);
		} );
	} );
} );
