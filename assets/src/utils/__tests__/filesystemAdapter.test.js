/**
 * Filesystem Adapter Tests
 *
 * @package
 */

import {
	uploadFile,
	deleteFile,
	copyFile,
	listObjects,
	batchCopy,
	batchDelete,
	downloadFile,
	getObjectUrl,
} from '../filesystemAdapter';
import apiFetch from '../api';

// Mock dependencies
jest.mock( '../api' );
jest.mock( '../debug', () => ( {
	debug: jest.fn(),
} ) );

describe( 'filesystemAdapter', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'getObjectUrl()', () => {
		test( 'should construct URL from baseUrl and key', () => {
			const result = getObjectUrl( '/static', 'https://example.com', 'file.html' );
			expect( result ).toBe( 'https://example.com/file.html' );
		} );

		test( 'should remove trailing slash from baseUrl', () => {
			const result = getObjectUrl( '/static', 'https://example.com/', 'file.html' );
			expect( result ).toBe( 'https://example.com/file.html' );
		} );

		test( 'should remove leading slash from key', () => {
			const result = getObjectUrl( '/static', 'https://example.com', '/file.html' );
			expect( result ).toBe( 'https://example.com/file.html' );
		} );

		test( 'should handle nested paths', () => {
			const result = getObjectUrl( '/static', 'https://cdn.example.com', 'assets/css/style.css' );
			expect( result ).toBe( 'https://cdn.example.com/assets/css/style.css' );
		} );
	} );

	describe( 'uploadFile()', () => {
		test( 'should return error for empty key', async () => {
			const file = new Blob( [ 'content' ] );
			const result = await uploadFile( '/static', '', file );

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'Upload key is empty' );
		} );

		test( 'should upload file successfully', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const file = new Blob( [ 'content' ] );
			const result = await uploadFile( '/static', 'test.txt', file );

			expect( result.success ).toBe( true );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/local-storage/upload',
					method: 'POST',
				} )
			);
		} );

		test( 'should call onProgress callback', async () => {
			apiFetch.mockResolvedValue( { success: true } );
			const onProgress = jest.fn();

			const file = new Blob( [ 'content' ] );
			await uploadFile( '/static', 'test.txt', file, { onProgress } );

			expect( onProgress ).toHaveBeenCalledWith( file.size, file.size, 100 );
		} );

		test( 'should return error on API failure', async () => {
			apiFetch.mockResolvedValue( { success: false, error: 'Server error' } );

			const file = new Blob( [ 'content' ] );
			const result = await uploadFile( '/static', 'test.txt', file );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Server error' );
		} );
	} );

	describe( 'deleteFile()', () => {
		test( 'should delete file successfully', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const result = await deleteFile( '/static', 'test.txt' );

			expect( result.success ).toBe( true );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/local-storage/delete',
					method: 'DELETE',
				} )
			);
		} );

		test( 'should return error on failure', async () => {
			apiFetch.mockResolvedValue( { success: false, error: 'Not found' } );

			const result = await deleteFile( '/static', 'test.txt' );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Not found' );
		} );
	} );

	describe( 'copyFile()', () => {
		test( 'should return success (not implemented)', async () => {
			const result = await copyFile( '/static', 'src.txt', 'dest.txt' );
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'listObjects()', () => {
		test( 'should return success (not implemented)', async () => {
			const result = await listObjects( '/static', 'prefix/', 100 );
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'batchCopy()', () => {
		test( 'should return success (not implemented)', async () => {
			const result = await batchCopy( '/static', [ { source: 'a', dest: 'b' } ] );
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'batchDelete()', () => {
		test( 'should batch delete files successfully', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const result = await batchDelete( '/static', [ 'a.txt', 'b.txt' ] );

			expect( result.success ).toBe( true );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/local-storage/batch-delete',
					method: 'DELETE',
				} )
			);
		} );

		test( 'should return error on failure', async () => {
			apiFetch.mockResolvedValue( { success: false, error: 'Batch delete failed' } );

			const result = await batchDelete( '/static', [ 'a.txt' ] );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Batch delete failed' );
		} );
	} );

	describe( 'downloadFile()', () => {
		test( 'should download file as blob', async () => {
			const mockBlob = new Blob( [ 'content' ] );
			apiFetch.mockResolvedValue( {
				ok: true,
				blob: jest.fn().mockResolvedValue( mockBlob ),
			} );

			const result = await downloadFile( '/static', 'test.txt' );

			expect( result ).toBe( mockBlob );
		} );

		test( 'should return null on not found', async () => {
			apiFetch.mockResolvedValue( { ok: false } );

			const result = await downloadFile( '/static', 'missing.txt' );

			expect( result ).toBeNull();
		} );

		test( 'should return null on error', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const result = await downloadFile( '/static', 'test.txt' );

			expect( result ).toBeNull();
		} );
	} );
} );
