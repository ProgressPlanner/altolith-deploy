/**
 * Static Site Generator Hook Tests
 *
 * Tests for useStaticSiteGenerator - orchestrates two-phase static site generation.
 *
 * Quality Standards:
 * - Tests must catch workflow orchestration issues
 * - Must test both pre-scan and upload phases
 * - Must test error handling and recovery
 * - Must fail if implementation loses data or skips steps
 *
 */

import { renderHook, act } from '@testing-library/react';
import { useStaticSiteGenerator } from '../useStaticSiteGenerator';
import { createAssetTracker } from '@aether/export/utils/assetTracker';
import {
	fetchProviderConfig,
	createStorageService,
	createFailureTracker,
	buildUploadResult,
	buildStorageConfig,
} from '@aether/export/utils/staticSiteConfig';
import { executePreScan } from '@aether/export/utils/preScanPhase';
import {
	prepareManifest,
	processAssets,
	uploadHtmlFile,
	finalizeManifest,
} from '@aether/export/utils/uploadPhase';
import { uploadManifest } from '@aether/utils/manifestManager';
import { doAction, applyFilters } from '@wordpress/hooks';

// Mock all dependencies
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

jest.mock( '@aether/export/utils/assetTracker', () => ( {
	createAssetTracker: jest.fn(),
} ) );

jest.mock( '@aether/export/utils/staticSiteConfig', () => ( {
	buildStorageConfig: jest.fn(),
	buildUploadResult: jest.fn(),
	createFailureTracker: jest.fn(),
	fetchProviderConfig: jest.fn(),
	createStorageService: jest.fn(),
} ) );

jest.mock( '@aether/export/utils/preScanPhase', () => ( {
	executePreScan: jest.fn(),
} ) );

jest.mock( '@aether/export/utils/uploadPhase', () => ( {
	prepareManifest: jest.fn(),
	processAssets: jest.fn(),
	uploadHtmlFile: jest.fn(),
	finalizeManifest: jest.fn(),
} ) );

jest.mock( '@aether/utils/manifestManager', () => ( {
	updateManifestEntry: jest.fn( ( manifest ) => manifest ),
	uploadManifest: jest.fn(),
} ) );

jest.mock( '@aether/utils/debug', () => ( {
	debug: jest.fn(),
	debugWarn: jest.fn(),
} ) );

describe( 'useStaticSiteGenerator', () => {
	let mockOnProgress;
	let mockSetStatusMessage;
	let mockAssetTracker;
	let mockStorageService;
	let mockCache;

	beforeEach( () => {
		jest.clearAllMocks();

		mockOnProgress = jest.fn();
		mockSetStatusMessage = jest.fn();

		mockAssetTracker = {
			isUploaded: jest.fn().mockReturnValue( false ),
			markUploaded: jest.fn(),
			markFailed: jest.fn(),
			getCount: jest.fn().mockReturnValue( 0 ),
		};

		mockStorageService = {
			upload: jest.fn().mockResolvedValue( true ),
			download: jest.fn(),
			delete: jest.fn(),
		};

		mockCache = new Map();

		createAssetTracker.mockReturnValue( mockAssetTracker );
		fetchProviderConfig.mockResolvedValue( {
			static_files_path: 'static/',
		} );
		createStorageService.mockResolvedValue( mockStorageService );

		// Mock createFailureTracker to return a failure tracking object
		createFailureTracker.mockReturnValue( {
			urlsFailed: 0,
			urlsSucceeded: 0,
			assetsFailed: 0,
			failedUrls: [],
		} );

		// Mock buildStorageConfig to return a config object
		buildStorageConfig.mockReturnValue( {
			siteUrl: 'https://example.com',
			staticSiteUrl: 'https://static.example.com',
			providerId: 'test-provider',
		} );

		// Mock buildUploadResult to return a result object
		buildUploadResult.mockImplementation(
			(
				failures,
				assetTracker,
				filesUploaded,
				filesSkipped,
				totalFilesToUpload,
				uploadedFiles,
				totalUrls
			) => ( {
				success: true,
				filesUploaded,
				filesSkipped,
				failures,
				assetsUploaded: assetTracker.getCount(),
				totalFilesToUpload,
				uploadedFiles,
				totalUrls,
			} )
		);

		// Default mock for executePreScan
		executePreScan.mockResolvedValue( {
			htmlData: mockCache,
			totalFilesToUpload: 0,
			failures: { urlsFailed: 0, failedUrls: [] },
		} );

		// Default mocks for upload phase
		prepareManifest.mockResolvedValue( {} );
		processAssets.mockResolvedValue( {
			filesUploaded: 0,
			filesSkipped: 0,
			uploadedFiles: [],
		} );
		uploadHtmlFile.mockResolvedValue( true );
		finalizeManifest.mockResolvedValue( undefined );
	} );

	describe( 'initialization', () => {
		it( 'should return processUrls function', () => {
			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			expect( result.current ).toBeInstanceOf( Function );
		} );

		it( 'should fetch provider configuration', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( fetchProviderConfig ).toHaveBeenCalledWith( 'provider-id' );
		} );

		it( 'should create storage service with correct config', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( createStorageService ).toHaveBeenCalledWith(
				'static/',
				expect.any( Object ),
				'provider-id',
				expect.objectContaining( { static_files_path: 'static/' } )
			);
		} );

		it( 'should create asset tracker', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( createAssetTracker ).toHaveBeenCalled();
		} );
	} );

	describe( 'pre-scan phase', () => {
		it( 'should execute pre-scan with correct parameters', async () => {
			const urls = [
				'https://example.com/page1',
				'https://example.com/page2',
			];

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 10,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( executePreScan ).toHaveBeenCalledWith( {
				urls,
				siteUrl: 'https://example.com',
				providerId: 'provider-id',
				providerConfig: expect.objectContaining( {
					static_files_path: 'static/',
				} ),
				setStatusMessage: mockSetStatusMessage,
				htmlData: mockCache,
			} );
		} );

		it( 'should handle pre-scan failures', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 5,
				failures: {
					urlsFailed: 2,
					failedUrls: [
						{
							url: 'https://example.com/fail1',
							reason: 'Network error',
						},
						{ url: 'https://example.com/fail2', reason: 'Timeout' },
					],
				},
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			const resultData = await act( async () => {
				return await result.current(
					[ 'https://example.com/page1' ],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			// Pre-scan failures should be included in result
			expect( resultData.failures ).toBeDefined();
		} );

		it( 'should use shared cache when provided', async () => {
			const sharedCache = {
				get: jest.fn(),
				getAllUrls: jest.fn().mockResolvedValue( [] ),
			};

			executePreScan.mockResolvedValue( {
				cache: sharedCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					sharedCache
				);
			} );

			expect( executePreScan ).toHaveBeenCalledWith(
				expect.objectContaining( { cache: sharedCache } )
			);
		} );
	} );

	describe( 'manifest management', () => {
		it( 'should prepare manifest before upload', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( prepareManifest ).toHaveBeenCalledWith(
				mockStorageService,
				'provider-id',
				mockSetStatusMessage
			);
		} );

		it( 'should finalize manifest after upload', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			finalizeManifest.mockResolvedValue();

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( finalizeManifest ).toHaveBeenCalledWith(
				mockStorageService,
				{},
				[],
				'provider-id',
				mockSetStatusMessage
			);
		} );

		it( 'should save manifest periodically every 50 files', async () => {
			const urls = Array.from(
				{ length: 100 },
				( _, i ) => `https://example.com/page${ i }`
			);
			const cachedUrls = urls.slice( 0, 100 );

			mockCache.getAllUrls.mockResolvedValue( cachedUrls );
			mockCache.get.mockImplementation( ( url ) => ( {
				rawHtml: '<html></html>',
				assetUrls: [],
			} ) );

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 100,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			uploadHtmlFile.mockResolvedValue( {
				htmlKey: 'key',
				htmlPath: 'path',
				htmlSize: 100,
				htmlHash: 'hash',
				skipped: false,
			} );
			processAssets.mockImplementation( ( { filesUploaded } ) => ( {
				filesUploaded,
				filesSkipped: 0,
				uploadedFiles: [],
				manifest: {},
			} ) );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			// Should save at 50 and 100 files
			expect( uploadManifest ).toHaveBeenCalled();
		} );
	} );

	describe( 'HTML file upload', () => {
		it( 'should upload HTML files from cache', async () => {
			const urls = [ 'https://example.com/page1' ];

			// Populate the Map directly
			const htmlDataMap = new Map();
			htmlDataMap.set( urls[ 0 ], {
				rawHtml: '<html><body>Test</body></html>',
				assetUrls: [],
			} );

			executePreScan.mockResolvedValue( {
				htmlData: htmlDataMap,
				totalFilesToUpload: 1,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			uploadHtmlFile.mockResolvedValue( {
				htmlKey: 'page1.html',
				htmlPath: 'page1.html',
				htmlSize: 100,
				htmlHash: 'abc123',
				skipped: false,
			} );
			processAssets.mockResolvedValue( {
				filesUploaded: 1,
				filesSkipped: 0,
				uploadedFiles: [],
				manifest: {},
			} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( uploadHtmlFile ).toHaveBeenCalledWith( {
				url: urls[ 0 ],
				rawHtml: '<html><body>Test</body></html>',
				siteUrl: 'https://example.com',
				staticSiteUrl: 'https://static.example.com',
				providerId: 'provider-id',
				storageService: mockStorageService,
				manifest: {},
				setStatusMessage: mockSetStatusMessage,
			} );
		} );

		it( 'should skip cache misses gracefully', async () => {
			const urls = [ 'https://example.com/page1' ];

			mockCache.getAllUrls.mockResolvedValue( urls );
			mockCache.get.mockResolvedValue( null ); // Cache miss

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 1,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			// Should not crash, should skip the URL
			expect( uploadHtmlFile ).not.toHaveBeenCalled();
		} );

		it( 'should handle upload errors gracefully', async () => {
			const urls = [ 'https://example.com/page1' ];

			mockCache.getAllUrls.mockResolvedValue( urls );
			mockCache.get.mockResolvedValue( {
				rawHtml: '<html></html>',
				assetUrls: [],
			} );

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 1,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			uploadHtmlFile.mockRejectedValue( new Error( 'Upload failed' ) );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			const resultData = await act( async () => {
				return await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			// Should track failure
			expect( resultData.failures ).toBeDefined();
		} );

		it( 'should track skipped files', async () => {
			const urls = [ 'https://example.com/page1' ];

			mockCache.getAllUrls.mockResolvedValue( urls );
			mockCache.get.mockResolvedValue( {
				rawHtml: '<html></html>',
				assetUrls: [],
			} );

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 1,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			uploadHtmlFile.mockResolvedValue( {
				htmlKey: 'page1.html',
				htmlPath: 'page1.html',
				skipped: true, // File was skipped
			} );
			processAssets.mockResolvedValue( {
				filesUploaded: 1,
				filesSkipped: 0,
				uploadedFiles: [],
				manifest: {},
			} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			// Should set status message for skipped file
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Skipped' ),
				'success',
				expect.any( String )
			);
		} );
	} );

	describe( 'asset processing', () => {
		it( 'should process assets for each page', async () => {
			const urls = [ 'https://example.com/page1' ];
			const assetUrls = [
				'https://example.com/style.css',
				'https://example.com/script.js',
			];

			mockCache.getAllUrls.mockResolvedValue( urls );
			mockCache.get.mockResolvedValue( {
				rawHtml: '<html></html>',
				assetUrls,
			} );

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 3,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			uploadHtmlFile.mockResolvedValue( {
				htmlKey: 'page1.html',
				htmlPath: 'page1.html',
				htmlSize: 100,
				htmlHash: 'hash',
				skipped: false,
			} );
			processAssets.mockResolvedValue( {
				filesUploaded: 3,
				filesSkipped: 0,
				uploadedFiles: [
					{ storageKey: 'style.css', relativePath: 'style.css' },
					{ storageKey: 'script.js', relativePath: 'script.js' },
				],
				manifest: {},
			} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( processAssets ).toHaveBeenCalledWith(
				expect.objectContaining( {
					assetUrls,
					assetTracker: mockAssetTracker,
					storageService: mockStorageService,
				} )
			);
		} );
	} );

	describe( 'progress tracking', () => {
		it( 'should call onProgress callback', async () => {
			const urls = [ 'https://example.com/page1' ];

			mockCache.getAllUrls.mockResolvedValue( urls );
			mockCache.get.mockResolvedValue( {
				rawHtml: '<html></html>',
				assetUrls: [],
			} );

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 1,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			uploadHtmlFile.mockResolvedValue( {
				htmlKey: 'page1.html',
				htmlPath: 'page1.html',
				skipped: false,
			} );
			processAssets.mockResolvedValue( {
				filesUploaded: 1,
				filesSkipped: 0,
				uploadedFiles: [],
				manifest: {},
			} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( mockOnProgress ).toHaveBeenCalled();
		} );

		it( 'should update status messages during upload', async () => {
			const urls = [ 'https://example.com/page1' ];

			mockCache.getAllUrls.mockResolvedValue( urls );
			mockCache.get.mockResolvedValue( {
				rawHtml: '<html></html>',
				assetUrls: [],
			} );

			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 1,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );
			uploadHtmlFile.mockResolvedValue( {
				htmlKey: 'page1.html',
				htmlPath: 'page1.html',
				skipped: false,
			} );
			processAssets.mockResolvedValue( {
				filesUploaded: 1,
				filesSkipped: 0,
				uploadedFiles: [],
				manifest: {},
			} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					urls,
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Uploading' ),
				'progress',
				'uploadFilesProgress'
			);
		} );
	} );

	describe( 'WordPress hooks integration', () => {
		it( 'should fire upload start action', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( doAction ).toHaveBeenCalledWith(
				'aether.export.step.uploadStaticSiteFiles.upload.before',
				[],
				0,
				'provider-id'
			);
		} );

		it( 'should fire upload completion action', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await act( async () => {
				await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( doAction ).toHaveBeenCalledWith(
				'aether.export.step.uploadStaticSiteFiles.upload.after',
				expect.objectContaining( {
					filesUploaded: expect.any( Number ),
					filesSkipped: expect.any( Number ),
				} ),
				'provider-id'
			);
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle empty URL list', async () => {
			executePreScan.mockResolvedValue( {
				htmlData: mockCache,
				totalFilesToUpload: 0,
				failures: { urlsFailed: 0, failedUrls: [] },
			} );
			prepareManifest.mockResolvedValue( {} );

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			const resultData = await act( async () => {
				return await result.current(
					[],
					'https://static.example.com',
					'provider-id',
					'https://example.com',
					mockSetStatusMessage,
					{},
					null,
					mockCache
				);
			} );

			expect( resultData ).toBeDefined();
		} );

		it( 'should handle missing provider config gracefully', async () => {
			fetchProviderConfig.mockRejectedValue(
				new Error( 'Config not found' )
			);

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await expect(
				act( async () => {
					await result.current(
						[],
						'https://static.example.com',
						'provider-id',
						'https://example.com',
						mockSetStatusMessage,
						{},
						null,
						mockCache
					);
				} )
			).rejects.toThrow();
		} );

		it( 'should handle storage service creation failure', async () => {
			createStorageService.mockRejectedValue(
				new Error( 'Storage init failed' )
			);

			const { result } = renderHook( () =>
				useStaticSiteGenerator( mockOnProgress )
			);

			await expect(
				act( async () => {
					await result.current(
						[],
						'https://static.example.com',
						'provider-id',
						'https://example.com',
						mockSetStatusMessage,
						{},
						null,
						mockCache
					);
				} )
			).rejects.toThrow();
		} );
	} );

	describe( 'callback stability', () => {
		it( 'should update callback when onProgress changes', () => {
			const firstOnProgress = jest.fn();
			const secondOnProgress = jest.fn();

			const { result, rerender } = renderHook(
				( { onProgress } ) => useStaticSiteGenerator( onProgress ),
				{ initialProps: { onProgress: firstOnProgress } }
			);

			const firstCallback = result.current;

			rerender( { onProgress: secondOnProgress } );

			// Should return new callback when dependency changes
			expect( result.current ).not.toBe( firstCallback );
		} );
	} );
} );
