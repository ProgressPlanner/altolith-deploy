/**
 * Filesystem Adapter Tests
 *
 */

import {
	uploadFile,
	deleteFile,
	batchDelete,
	downloadFile,
	getObjectUrl,
} from '../filesystemAdapter';
import apiFetch from '@altolith/utils/api';

// Mock dependencies
jest.mock( '@altolith/utils/api' );

describe( 'filesystemAdapter', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'uploadFile', () => {
		test( 'uploads file successfully', async () => {
			const mockFile = new Blob( [ 'test content' ], {
				type: 'text/plain',
			} );
			const staticPath = '/static';
			const key = 'test.txt';

			apiFetch.mockResolvedValue( { success: true } );

			const result = await uploadFile( staticPath, key, mockFile );

			expect( result.success ).toBe( true );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/altolith/deploy/local-storage/upload',
				method: 'POST',
				body: expect.any( FormData ),
			} );
		} );

		test( 'returns error when key is empty', async () => {
			const mockFile = new Blob( [ 'test' ] );
			const result = await uploadFile( '/static', '', mockFile );

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'Upload key is empty' );
		} );

		test( 'handles API errors', async () => {
			const mockFile = new Blob( [ 'test' ] );
			apiFetch.mockRejectedValue( {
				message: 'Upload failed',
				data: { destination: '/path/to/file' },
			} );

			const result = await uploadFile( '/static', 'test.txt', mockFile );

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'Upload failed' );
		} );
	} );

	describe( 'deleteFile', () => {
		test( 'deletes file successfully', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const result = await deleteFile( '/static', 'test.txt' );

			expect( result.success ).toBe( true );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/altolith/deploy/local-storage/delete',
				method: 'DELETE',
				data: {
					key: 'test.txt',
					static_path: '/static',
				},
			} );
		} );

		test( 'handles delete errors', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				error: 'Delete failed',
			} );

			const result = await deleteFile( '/static', 'test.txt' );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Delete failed' );
		} );
	} );

	describe( 'batchDelete', () => {
		test( 'deletes multiple files successfully', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const result = await batchDelete( '/static', [
				'file1.txt',
				'file2.txt',
			] );

			expect( result.success ).toBe( true );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/altolith/deploy/local-storage/batch-delete',
				method: 'DELETE',
				data: {
					keys: [ 'file1.txt', 'file2.txt' ],
					static_path: '/static',
				},
			} );
		} );
	} );

	describe( 'downloadFile', () => {
		test( 'downloads file successfully', async () => {
			const mockBlob = new Blob( [ 'test content' ] );
			const mockResponse = {
				ok: true,
				blob: jest.fn().mockResolvedValue( mockBlob ),
			};

			apiFetch.mockResolvedValue( mockResponse );

			const result = await downloadFile( '/static', 'test.txt' );

			expect( result ).toBe( mockBlob );
		} );

		test( 'returns null when file not found', async () => {
			const mockResponse = {
				ok: false,
			};

			apiFetch.mockResolvedValue( mockResponse );

			const result = await downloadFile( '/static', 'test.txt' );

			expect( result ).toBeNull();
		} );
	} );

	describe( 'getObjectUrl', () => {
		test( 'constructs URL correctly', () => {
			const url = getObjectUrl(
				'/static',
				'https://example.com',
				'test.txt'
			);

			expect( url ).toBe( 'https://example.com/test.txt' );
		} );

		test( 'handles trailing slash in baseUrl', () => {
			const url = getObjectUrl(
				'/static',
				'https://example.com/',
				'test.txt'
			);

			expect( url ).toBe( 'https://example.com/test.txt' );
		} );

		test( 'handles leading slash in key', () => {
			const url = getObjectUrl(
				'/static',
				'https://example.com',
				'/test.txt'
			);

			expect( url ).toBe( 'https://example.com/test.txt' );
		} );
	} );
} );
