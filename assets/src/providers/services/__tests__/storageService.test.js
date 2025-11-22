/**
 * StorageService Test Suite
 *
 * Comprehensive tests for StorageService class.
 * Tests all storage operations: upload, delete, copy, list, exists, batch operations, and connection testing.
 *
 * @package
 */

import { StorageService } from '../storageService';
import {
	deleteFile,
	copyFile,
	listObjects as listObjectsFromAdapter,
	batchCopy as batchCopyFromAdapter,
	batchDelete as batchDeleteFromAdapter,
	getObjectUrl,
	downloadFile,
} from '../../../utils/filesystemAdapter';
import { uploadFile as uploadFileUnified } from '../../../export/utils/unifiedFileUpload';

// Mock filesystem adapter
jest.mock( '../../../utils/filesystemAdapter', () => ( {
	deleteFile: jest.fn(),
	copyFile: jest.fn(),
	listObjects: jest.fn(),
	batchCopy: jest.fn(),
	batchDelete: jest.fn(),
	getObjectUrl: jest.fn(),
	downloadFile: jest.fn(),
} ) );

// Mock unified file upload
jest.mock( '../../../export/utils/unifiedFileUpload', () => ( {
	createFileContext: jest.fn( ( options ) => options ),
	FILE_TYPES: {
		STATIC_HTML: 'static-html',
		STATIC_ASSET: 'static-asset',
		BLUEPRINT_BUNDLE: 'blueprint-bundle',
	},
	uploadFile: jest.fn().mockResolvedValue( { success: true } ),
} ) );

describe( 'StorageService', () => {
	let service;
	const mockStaticPath = 'wp-content/aether-static';
	const mockJobId = '123456789';
	const mockConfig = {
		base_url: 'https://cdn.example.com',
	};

	beforeEach( () => {
		service = new StorageService( mockStaticPath, mockJobId, mockConfig );
		jest.clearAllMocks();
	} );

	describe( 'Constructor', () => {
		test( 'should initialize with static path and job ID', () => {
			expect( service.staticPath ).toBe( mockStaticPath );
			expect( service.jobId ).toBe( mockJobId );
			expect( service.config ).toEqual( mockConfig );
			expect( service.baseUrl ).toBe( mockConfig.base_url );
		} );

		test( 'should use public_url as baseUrl if base_url not provided', () => {
			const configWithoutBaseUrl = { public_url: 'https://example.com' };
			const testService = new StorageService(
				mockStaticPath,
				mockJobId,
				configWithoutBaseUrl
			);
			expect( testService.baseUrl ).toBe( 'https://example.com' );
		} );

		test( 'should use empty string as baseUrl if neither provided', () => {
			const emptyConfig = {};
			const testService = new StorageService(
				mockStaticPath,
				mockJobId,
				emptyConfig
			);
			expect( testService.baseUrl ).toBe( '' );
		} );

		test( 'should initialize providerId from config', () => {
			const configWithProviderId = {
				base_url: 'https://example.com',
				provider_id: 'cloudflare-r2',
			};
			const testService = new StorageService(
				mockStaticPath,
				mockJobId,
				configWithProviderId
			);
			expect( testService.providerId ).toBe( 'cloudflare-r2' );
		} );

		test( 'should set providerId to null if not provided', () => {
			expect( service.providerId ).toBeNull();
		} );
	} );

	describe( '_prefixKey()', () => {
		test( 'should not prefix key when providerId is null', () => {
			const key = 'static/index.html';
			expect( service._prefixKey( key ) ).toBe( key );
		} );

		test( 'should prefix key with providerId', () => {
			const configWithProviderId = {
				base_url: 'https://example.com',
				provider_id: 'cloudflare-r2',
			};
			const testService = new StorageService(
				mockStaticPath,
				mockJobId,
				configWithProviderId
			);
			const key = 'static/index.html';
			expect( testService._prefixKey( key ) ).toBe(
				'cloudflare-r2/static/index.html'
			);
		} );

		test( 'should not double-prefix key', () => {
			const configWithProviderId = {
				base_url: 'https://example.com',
				provider_id: 'cloudflare-r2',
			};
			const testService = new StorageService(
				mockStaticPath,
				mockJobId,
				configWithProviderId
			);
			const key = 'cloudflare-r2/static/index.html';
			expect( testService._prefixKey( key ) ).toBe(
				'cloudflare-r2/static/index.html'
			);
		} );
	} );

	describe( 'upload()', () => {
		test( 'should upload a file successfully', async () => {
			const mockFile = new Blob( [ 'test content' ], {
				type: 'text/plain',
			} );
			const mockKey = 'test-file.txt';
			const mockMetadata = { contentType: 'text/plain' };

			const result = await service.upload(
				mockKey,
				mockFile,
				mockMetadata
			);

			expect( uploadFileUnified ).toHaveBeenCalled();
			expect( result.success ).toBe( true );
		} );

		test( 'should upload with prefixed key when providerId is set', async () => {
			const configWithProviderId = {
				base_url: 'https://example.com',
				provider_id: 'cloudflare-r2',
			};
			const testService = new StorageService(
				mockStaticPath,
				mockJobId,
				configWithProviderId
			);
			const mockFile = new Blob( [ 'test content' ], {
				type: 'text/plain',
			} );
			const mockKey = 'static/index.html';

			const result = await testService.upload( mockKey, mockFile );

			expect( uploadFileUnified ).toHaveBeenCalled();
			expect( result.success ).toBe( true );
		} );

		test( 'should handle upload failure', async () => {
			const mockFile = new Blob( [ 'test content' ] );
			const mockKey = 'test-file.txt';

			uploadFileUnified.mockRejectedValueOnce(
				new Error( 'Upload failed' )
			);

			const result = await service.upload( mockKey, mockFile );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Upload failed' );
		} );

		test( 'should reject non-File/Blob objects', async () => {
			const mockKey = 'test-file.txt';
			const invalidFile = 'not a file';

			const result = await service.upload( mockKey, invalidFile );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'File must be a File or Blob object' );
		} );
	} );

	describe( 'delete()', () => {
		test( 'should delete a file successfully', async () => {
			const mockKey = 'test-file.txt';

			deleteFile.mockResolvedValue( { success: true } );

			const result = await service.delete( mockKey );

			expect( deleteFile ).toHaveBeenCalledWith(
				mockStaticPath,
				mockKey,
				{
					jobId: mockJobId,
				}
			);
			expect( result.success ).toBe( true );
		} );

		test( 'should handle delete failure', async () => {
			const mockKey = 'test-file.txt';

			deleteFile.mockResolvedValue( {
				success: false,
				error: 'Delete failed',
			} );

			const result = await service.delete( mockKey );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Delete failed' );
		} );
	} );

	describe( 'copy()', () => {
		test( 'should return success (not implemented for local filesystem)', async () => {
			const sourceKey = 'source.txt';
			const destKey = 'dest.txt';

			copyFile.mockResolvedValue( { success: true } );

			const result = await service.copy( sourceKey, destKey );

			expect( copyFile ).toHaveBeenCalledWith(
				mockStaticPath,
				sourceKey,
				destKey
			);
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'exists()', () => {
		test( 'should return false (not implemented for local filesystem)', async () => {
			const result = await service.exists( 'test-file.txt' );
			expect( result ).toBe( false );
		} );
	} );

	describe( 'listObjects()', () => {
		test( 'should list objects with default parameters', async () => {
			const mockObjects = [
				{ key: 'file1.txt', size: 100 },
				{ key: 'file2.txt', size: 200 },
			];

			listObjectsFromAdapter.mockResolvedValue( {
				success: true,
				objects: mockObjects,
			} );

			const result = await service.listObjects();

			expect( listObjectsFromAdapter ).toHaveBeenCalledWith(
				mockStaticPath,
				'',
				1000
			);
			expect( result.success ).toBe( true );
			expect( result.objects ).toEqual( mockObjects );
		} );

		test( 'should list objects with prefix and limit', async () => {
			const mockPrefix = 'static/';
			const mockLimit = 50;

			listObjectsFromAdapter.mockResolvedValue( {
				success: true,
				objects: [],
			} );

			await service.listObjects( mockPrefix, mockLimit );

			expect( listObjectsFromAdapter ).toHaveBeenCalledWith(
				mockStaticPath,
				mockPrefix,
				mockLimit
			);
		} );
	} );

	describe( 'getUrl()', () => {
		test( 'should return public URL using baseUrl', () => {
			const mockKey = 'test-file.txt';

			getObjectUrl.mockReturnValue(
				'https://cdn.example.com/test-file.txt'
			);

			const url = service.getUrl( mockKey );

			expect( getObjectUrl ).toHaveBeenCalledWith(
				mockStaticPath,
				mockConfig.base_url,
				mockKey
			);
			expect( url ).toBe( 'https://cdn.example.com/test-file.txt' );
		} );

		test( 'should return relative path as fallback if no baseUrl', () => {
			const emptyService = new StorageService(
				mockStaticPath,
				mockJobId,
				{}
			);
			const mockKey = 'test-file.txt';

			const url = emptyService.getUrl( mockKey );

			expect( url ).toBe( mockKey );
		} );
	} );

	describe( 'batchCopy()', () => {
		test( 'should batch copy files', async () => {
			const mockOperations = [
				{ source: 'file1.txt', dest: 'copy1.txt' },
				{ source: 'file2.txt', dest: 'copy2.txt' },
			];

			batchCopyFromAdapter.mockResolvedValue( { success: true } );

			const result = await service.batchCopy( mockOperations );

			expect( batchCopyFromAdapter ).toHaveBeenCalledWith(
				mockStaticPath,
				mockOperations
			);
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'batchDelete()', () => {
		test( 'should batch delete files', async () => {
			const mockKeys = [ 'file1.txt', 'file2.txt', 'file3.txt' ];

			batchDeleteFromAdapter.mockResolvedValue( { success: true } );

			const result = await service.batchDelete( mockKeys );

			expect( batchDeleteFromAdapter ).toHaveBeenCalledWith(
				mockStaticPath,
				mockKeys,
				{ jobId: mockJobId }
			);
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'downloadManifest()', () => {
		test( 'should download manifest file', async () => {
			const mockBlob = new Blob( [ '{"test": "data"}' ], {
				type: 'application/json',
			} );

			downloadFile.mockResolvedValue( mockBlob );

			const result = await service.downloadManifest();

			expect( downloadFile ).toHaveBeenCalledWith(
				mockStaticPath,
				'file-manifest.json',
				{ jobId: mockJobId }
			);
			expect( result ).toBe( mockBlob );
		} );

		test( 'should return null if manifest download fails', async () => {
			downloadFile.mockRejectedValue( new Error( 'Not found' ) );

			const result = await service.downloadManifest();

			expect( result ).toBeNull();
		} );
	} );

	describe( 'uploadManifest()', () => {
		test( 'should upload manifest file', async () => {
			const mockBlob = new Blob( [ '{"test": "data"}' ], {
				type: 'application/json',
			} );

			const result = await service.uploadManifest( mockBlob );

			expect( uploadFileUnified ).toHaveBeenCalled();
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'testConnection()', () => {
		test( 'should return success for local filesystem', async () => {
			const result = await service.testConnection();

			expect( result.success ).toBe( true );
			expect( result.message ).toBe(
				'Local filesystem storage is ready.'
			);
		} );
	} );
} );
